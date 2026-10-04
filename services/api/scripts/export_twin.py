"""Export everything the twin UI renders, as one JSON payload.

The UI reads only this file. Nothing is computed in the browser, so no figure can be
invented there, and every value arrives with the provenance the backend assigned it.
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402

from core.geo.branches import route_cost  # noqa: E402
from core.geo.index import load_index  # noqa: E402
from core.matching.pool import PoolPolicy  # noqa: E402
from core.pricing import economics as econ  # noqa: E402
from core.pricing.fare import brief_quote, full_truck_fare, quote  # noqa: E402
from twin.calibration.sensitivity import sweep  # noqa: E402
from twin.engine.cascade import detect  # noqa: E402
from twin.engine.tick import run_day  # noqa: E402
from twin.world.seed import build_world  # noqa: E402

DATA = ROOT.parents[1] / "data"
OUT = ROOT.parents[1] / "apps" / "twin-ui" / "public" / "twin.json"


def marginal_curve(idx, names: list[str]) -> list[dict]:
    """Cost of a run as stops are added one at a time along a shared branch."""
    keys = []
    for n in names:
        row = idx.branches[idx.branches.name == n]
        if not row.empty:
            keys.append((n, idx.point_index[row.iloc[0].key]))
    base = route_cost(idx.matrix, idx.origin, (), idx.dest)
    out, acc, prev = [], (), base
    out.append({"label": "direct run", "stops": 0, "km": round(base, 2), "marginal_km": 0.0})
    for name, node in keys:
        acc += (node,)
        km = route_cost(idx.matrix, idx.origin, acc, idx.dest)
        out.append(
            {
                "label": f"+ {name}",
                "stops": len(acc),
                "km": round(km, 2),
                "marginal_km": round(km - prev, 2),
            }
        )
        prev = km
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--sweep-days", type=int, default=2)
    args = ap.parse_args()

    idx = load_index(DATA / "derived" / "nashik", "pimpalgaon", "nashik_apmc")
    manifest = json.loads((DATA / "derived" / "nashik" / "manifest.json").read_text())
    branches = pd.read_parquet(DATA / "derived" / "nashik" / "branches.parquet")
    points = pd.read_parquet(DATA / "derived" / "nashik" / "points.parquet")

    world = build_world(idx, n_farmers=400, n_trucks=60, seed=7)
    policy = PoolPolicy(solver_ms=300)
    days = [run_day(world, d, policy=policy) for d in range(args.days)]
    cascade = detect(days[0], idx.trunk_km)

    full = full_truck_fare(idx.trunk_km)
    entry = 8.5
    sharing = [
        {
            "shared_by": n,
            "ours": quote(200, idx.trunk_km, entry, n, 0.25 if n > 1 else 0.0).total,
            "brief": brief_quote(200, full),
            "full_truck": round(full, 2),
        }
        for n in (1, 2, 3, 4)
    ]

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "corridor": {
            "name": "Pimpalgaon Baswant to Nashik APMC",
            "trunk_km": round(idx.trunk_km, 2),
            "source": manifest.get("source_url"),
            "licence": manifest.get("licence"),
        },
        "provenance_note": (
            "Road geometry and landholding distribution are real. Farmer and driver "
            "behaviour are uncalibrated simulated parameters: the harvest model has not "
            "been validated against observed mandi arrivals."
        ),
        "calibrated": (DATA / "raw" / "arrivals_nashik.csv").exists(),
        "points": [
            {"key": r.key, "name": r.name, "lon": r.lon, "lat": r.lat}
            for r in points.itertuples(index=False)
        ],
        "branches": [
            {
                "branch_id": int(r.branch_id),
                "key": r.key,
                "name": r.name,
                "lon": float(r.lon),
                "lat": float(r.lat),
                "solo_detour_km": round(float(r.solo_detour_km), 2),
                "branch_entry_km": round(float(r.branch_entry_km), 2),
                "branch_full_km": round(float(r.branch_full_km), 2),
                "branch_size": int(r.branch_size),
            }
            for r in branches.itertuples(index=False)
        ],
        "marginal_curve": marginal_curve(idx, ["Sakore", "Mohadi", "Korhate"]),
        "sharing": sharing,
        "cascade": [
            {
                "key": s.key,
                "headline": s.headline,
                "value": round(s.value, 2),
                "unit": s.unit,
                "provenance": s.provenance.value,
                "evidenced": s.evidenced,
                "detail": s.detail,
            }
            for s in cascade.stages
        ],
        "cascade_confidence": cascade.confidence.value,
        "days": [
            {
                "day": d.day,
                "lots_offered": d.lots_offered,
                "lots_served": d.lots_served,
                "match_rate": round(d.match_rate, 4),
                "trucks_running": d.trucks_running,
                "trips": len(d.trips),
                "forward_fill_rate": round(d.forward_fill_rate, 4),
                "detour_km": round(d.detour_km, 2),
                "revenue": round(d.revenue, 2),
                "co2_kg": round(d.co2_kg, 2),
            }
            for d in days
        ],
        "sweep": [
            {
                "farmers": p.farmers,
                "trucks": p.trucks,
                "per_truck": round(p.farmers / p.trucks, 1),
                "match_rate": round(p.match_rate, 4),
                "forward_fill_rate": round(p.forward_fill_rate, 4),
                "mean_detour_km": round(p.mean_detour_km, 2),
            }
            for p in sweep(idx, [100, 200, 400, 800], [15, 30, 60], days=args.sweep_days)
        ],
        "economics": [
            {
                "name": name,
                "value": getattr(econ, name).value,
                "provenance": getattr(econ, name).provenance.value,
                "source": getattr(econ, name).source,
            }
            for name in (
                "DIESEL_PRICE_PER_L",
                "SCV_MILEAGE_KMPL_LADEN",
                "TRUCK_CAPACITY_KG",
                "FULL_TRUCK_FARE_PER_KM",
                "PLATFORM_FEE_PCT",
                "HANDLING_PER_STOP",
                "CO2_KG_PER_L_DIESEL",
            )
        ],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"wrote {OUT}  ({OUT.stat().st_size / 1024:.0f} KB)")
    print(f"  branches {len(payload['branches'])}  days {len(payload['days'])}  "
          f"sweep {len(payload['sweep'])}  calibrated={payload['calibrated']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
