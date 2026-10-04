"""Export every scenario as its own drawable twin."""

import json
import sys
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402

from core.geo.corridor import CORRIDORS  # noqa: E402
from core.geo.graph import load as load_graph  # noqa: E402
from core.geo.index import load_index  # noqa: E402
from twin.scenarios import SCENARIOS, run_scenario  # noqa: E402

DATA = ROOT.parents[1] / "data"
OUT = ROOT.parents[1] / "apps" / "twin-3d" / "public" / "scenarios.json"
TRUNK_CLASSES = {"motorway", "trunk", "primary", "secondary", "tertiary"}


def main() -> int:
    corridor = CORRIDORS["nashik"]
    derived = DATA / "derived" / "nashik"
    idx = load_index(derived, "pimpalgaon", "nashik_apmc")
    graph = load_graph(derived)

    elev = None
    cache = derived / "elevation.json"
    if cache.exists():
        elev = json.loads(cache.read_text())["elevation"]

    ways = pd.read_parquet(derived / "ways.parquet")
    nodes = pd.read_parquet(derived / "nodes.parquet")
    lat = dict(zip(nodes.node_id, nodes.lat))
    lon = dict(zip(nodes.node_id, nodes.lon))
    roads = []
    for w in ways.itertuples(index=False):
        if w.highway not in TRUNK_CLASSES:
            continue
        pts = [[round(float(lon[n]), 6), round(float(lat[n]), 6)] for n in w.node_ids if n in lat][::2]
        if len(pts) >= 2:
            roads.append({"cls": w.highway, "pts": pts})

    branches = pd.read_parquet(derived / "branches.parquet")
    out_scenarios = []
    for spec in SCENARIOS:
        r = run_scenario(spec, idx, graph)
        print(
            f"{spec.key:<15} served {r.facts['served']}  unserved {r.facts['unserved']}  "
            f"detour {r.facts['detour_km']} km  cheapest ₹{r.facts['cheapest_fare']:.0f}"
        )
        out_scenarios.append(
            {
                "key": spec.key, "title": spec.title, "question": spec.question,
                "takeaway": spec.takeaway,
                "lots": [asdict(l) for l in spec.lots],
                "trucks": [asdict(t) for t in spec.trucks],
                "trips": [asdict(t) for t in r.trips],
                "unserved": r.unserved,
                "facts": r.facts,
                "horizon_min": round(r.horizon_min, 1),
            }
        )

    b = corridor.bbox
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
            "grid": 28, "elevation": elev,
            "provenance": "REAL" if elev else "ABSENT",
        },
        "roads": roads,
        "villages": [
            {"key": r.key, "name": r.name, "lon": float(r.lon), "lat": float(r.lat),
             "branch_id": int(r.branch_id), "branch_size": int(r.branch_size),
             "solo_detour_km": round(float(r.solo_detour_km), 2)}
            for r in branches.itertuples(index=False)
        ],
        "scenarios": out_scenarios,
        "provenance": {
            "road_geometry": "REAL", "terrain": "REAL" if elev else "ABSENT",
            "routes": "REAL", "fares": "MODELED", "situations": "AUTHORED",
            "note": (
                "The situations are chosen to isolate one question each. Everything the "
                "engine then says about them -- route, distance, fare, refusal -- is "
                "computed by the same code the bot would run."
            ),
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload), encoding="utf-8")
    print(f"\nwrote {OUT}  ({OUT.stat().st_size / 1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
