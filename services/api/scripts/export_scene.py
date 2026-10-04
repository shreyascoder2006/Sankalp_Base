"""Export one simulated day as drawable 3D scene data."""

import argparse
import json
import sys
import time
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

import httpx
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.geo.corridor import CORRIDORS  # noqa: E402
from core.geo.graph import load as load_graph  # noqa: E402
from core.geo.index import load_index  # noqa: E402
from core.matching.pool import PoolPolicy  # noqa: E402
from twin.engine.scene import build_day_scene  # noqa: E402
from twin.world.seed import build_world  # noqa: E402

DATA = ROOT.parents[1] / "data"
OUT = ROOT.parents[1] / "apps" / "twin-3d" / "public" / "scene.json"
ELEV_CACHE = DATA / "derived" / "nashik" / "elevation.json"

TRUNK_CLASSES = {"motorway", "trunk", "primary", "secondary", "tertiary"}


def fetch_elevation(lats: np.ndarray, lons: np.ndarray) -> list[float] | None:
    """Real terrain from Open-Meteo's elevation API, 100 points per call."""
    if ELEV_CACHE.exists():
        return json.loads(ELEV_CACHE.read_text())["elevation"]
    out: list[float] = []
    try:
        for i in range(0, len(lats), 100):
            la = ",".join(f"{v:.5f}" for v in lats[i : i + 100])
            lo = ",".join(f"{v:.5f}" for v in lons[i : i + 100])
            for attempt in range(6):
                r = httpx.get(
                    "https://api.open-meteo.com/v1/elevation",
                    params={"latitude": la, "longitude": lo},
                    timeout=60,
                )
                if r.status_code == 429:  # per-minute cap; wait it out
                    wait = 20 * (attempt + 1)
                    print(f"  rate limited, waiting {wait}s")
                    time.sleep(wait)
                    continue
                r.raise_for_status()
                out.extend(r.json()["elevation"])
                break
            else:
                raise RuntimeError("elevation API kept rate limiting")
            print(f"  {len(out)}/{len(lats)} samples")
            time.sleep(4)
    except Exception as exc:  # noqa: BLE001
        print(f"  elevation unavailable ({type(exc).__name__}); scene will use a flat plane")
        return None
    ELEV_CACHE.write_text(json.dumps({"elevation": out}))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--day", type=int, default=2)
    ap.add_argument("--farmers", type=int, default=400)
    ap.add_argument("--trucks", type=int, default=60)
    ap.add_argument("--grid", type=int, default=36, help="terrain samples per side")
    args = ap.parse_args()

    corridor = CORRIDORS["nashik"]
    derived = DATA / "derived" / "nashik"
    idx = load_index(derived, "pimpalgaon", "nashik_apmc")
    graph = load_graph(derived)
    world = build_world(idx, n_farmers=args.farmers, n_trucks=args.trucks, seed=7)

    print(f"building day {args.day} scene...")
    scene = build_day_scene(world, graph, args.day, policy=PoolPolicy(solver_ms=300))
    print(f"  trips {len(scene.trips)}  refusals {len(scene.refusals)}  "
          f"horizon {scene.horizon_min:.0f} min")

    b = corridor.bbox
    gx = np.linspace(b.west, b.east, args.grid)
    gy = np.linspace(b.south, b.north, args.grid)
    mesh_lon, mesh_lat = np.meshgrid(gx, gy)
    print(f"fetching terrain ({args.grid}x{args.grid} samples)...")
    elev = fetch_elevation(mesh_lat.ravel(), mesh_lon.ravel())

    # Road backdrop: major classes only, so the scene reads as a corridor not a hairball.
    ways = pd.read_parquet(derived / "ways.parquet")
    nodes = pd.read_parquet(derived / "nodes.parquet")
    lat = dict(zip(nodes.node_id, nodes.lat))
    lon = dict(zip(nodes.node_id, nodes.lon))
    roads = []
    for w in ways.itertuples(index=False):
        if w.highway not in TRUNK_CLASSES:
            continue
        pts = [
            [round(float(lon[n]), 6), round(float(lat[n]), 6)]
            for n in w.node_ids
            if n in lat
        ][::2]
        if len(pts) >= 2:
            roads.append({"cls": w.highway, "pts": pts})

    branches = pd.read_parquet(derived / "branches.parquet")
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "corridor": {
            "name": corridor.name,
            "bbox": {"west": b.west, "east": b.east, "south": b.south, "north": b.north},
            "trunk_km": round(idx.trunk_km, 2),
            "origin": {"key": corridor.origin.key, "name": corridor.origin.name,
                       "lon": corridor.origin.lon, "lat": corridor.origin.lat},
            "dest": {"key": corridor.destination.key, "name": corridor.destination.name,
                     "lon": corridor.destination.lon, "lat": corridor.destination.lat},
        },
        "terrain": {
            "grid": args.grid,
            "elevation": elev,
            "provenance": "REAL" if elev else "ABSENT",
            "source": "Open-Meteo elevation API (Copernicus DEM)" if elev else None,
        },
        "roads": roads,
        "villages": [
            {
                "key": r.key, "name": r.name, "lon": float(r.lon), "lat": float(r.lat),
                "branch_id": int(r.branch_id), "branch_size": int(r.branch_size),
                "solo_detour_km": round(float(r.solo_detour_km), 2),
            }
            for r in branches.itertuples(index=False)
        ],
        "day": scene.day,
        "horizon_min": round(scene.horizon_min, 1),
        "trips": [asdict(t) for t in scene.trips],
        "refusals": [asdict(r) for r in scene.refusals],
        "provenance": {
            "road_geometry": "REAL",
            "terrain": "REAL" if elev else "ABSENT",
            "routes": "REAL",
            "truck_behaviour": "SIMULATED",
            "harvest": "SIMULATED",
            "note": (
                "Roads, routes and terrain are measured. Which trucks run, what farmers "
                "offer and whether a driver accepts are uncalibrated simulated parameters."
            ),
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload), encoding="utf-8")
    print(f"\nwrote {OUT}  ({OUT.stat().st_size / 1024:.0f} KB)")
    print(f"  roads {len(roads)}  villages {len(payload['villages'])}  "
          f"terrain {'REAL' if elev else 'flat'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
