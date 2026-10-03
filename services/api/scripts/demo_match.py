"""End-to-end scenario: the brief's own 'Ramesh passes with 400 kg spare' story.

Runs the real corridor matrix, the VRP pooler and the corrected fare side by side with
the brief's formula and with hiring a whole truck.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.geo.index import load_index  # noqa: E402
from core.matching.candidates import Lot  # noqa: E402
from core.matching.pool import PoolPolicy, solve  # noqa: E402
from core.pricing.economics import TRUCK_CAPACITY_KG  # noqa: E402
from core.pricing.fare import brief_quote, full_truck_fare, quote  # noqa: E402

DERIVED = ROOT.parents[1] / "data" / "derived" / "nashik"
SPARE_KG = 400.0

PENDING = [
    ("Sakore", 150.0),
    ("Mohadi", 120.0),
    ("Chandori", 200.0),
    ("Bhuse", 80.0),
    ("Dindori", 180.0),
]


def main() -> int:
    idx = load_index(DERIVED, "pimpalgaon", "nashik_apmc")
    by_name = {r.name: r for r in idx.branches.itertuples(index=False)}

    lots = [Lot(f"lot-{n}", by_name[n].key, "onion", kg) for n, kg in PENDING if n in by_name]
    print(f"corridor trunk run      {idx.trunk_km:.1f} km")
    print(f"truck spare capacity    {SPARE_KG:.0f} kg of {TRUCK_CAPACITY_KG.value:.0f} kg")
    print(f"pending lots            {len(lots)}\n")

    route = solve(idx, lots, capacity_kg=SPARE_KG, policy=PoolPolicy(solver_seconds=8))

    print(f"accepted {route.stops} of {len(lots)}   route {route.distance_km:.1f} km, "
          f"{route.duration_min:.0f} min")
    print(f"detour over trunk       {route.distance_km - idx.trunk_km:+.1f} km\n")

    if not route.served:
        print("nothing accepted")
        return 0

    served_keys = {lot.point_key for lot in route.served}
    full = full_truck_fare(idx.trunk_km)

    print(f"{'village':<14}{'kg':>6}{'ours':>8}{'brief':>8}{'full truck':>12}{'saving':>9}")
    print("-" * 60)
    for key in route.order:
        lot = next(x for x in route.served if x.point_key == key)
        name = next(r.name for r in idx.branches.itertuples(index=False) if r.key == key)
        shared = len(set(idx.branch_members(key)) & served_keys)
        entry = idx.branch_entry_km(key)
        marginal = max(0.0, (route.distance_km - idx.trunk_km - entry) / max(shared, 1))

        q = quote(lot.weight_kg, idx.trunk_km, entry, shared, marginal)
        b = brief_quote(lot.weight_kg, full)
        print(
            f"{name:<14}{lot.weight_kg:>6.0f}{q.total:>8.0f}{b:>8.0f}{full:>12.0f}"
            f"{(full - q.total) / full:>8.0%}"
        )

    print()
    for lot in route.dropped:
        name = next(r.name for r in idx.branches.itertuples(index=False) if r.key == lot.point_key)
        detour = idx.branch_entry_km(lot.point_key)
        print(f"refused {name:<12} {lot.weight_kg:>4.0f} kg  "
              f"would need {detour:.1f} km detour; revenue does not cover it")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
