"""Run the corridor simulation for a span of days."""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.geo.index import load_index  # noqa: E402
from core.matching.pool import PoolPolicy  # noqa: E402
from twin.engine.tick import detour_diesel_cost, farmer_saving_vs_full_truck, run_day  # noqa: E402
from twin.world.seed import build_world  # noqa: E402

DERIVED = ROOT.parents[1] / "data" / "derived" / "nashik"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=14)
    ap.add_argument("--farmers", type=int, default=400)
    ap.add_argument("--trucks", type=int, default=60)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--solver-seconds", type=int, default=1)
    args = ap.parse_args()

    idx = load_index(DERIVED, "pimpalgaon", "nashik_apmc")
    world = build_world(idx, n_farmers=args.farmers, n_trucks=args.trucks, seed=args.seed)
    policy = PoolPolicy(solver_seconds=args.solver_seconds)

    print(
        f"corridor {idx.trunk_km:.1f} km   farmers {len(world.farmers)}   "
        f"trucks {len(world.trucks)}   villages {len(world.village_keys)}   seed {args.seed}"
    )
    print("ALL SIMULATED except road geometry and landholding distribution\n")
    print(f"{'day':>4}{'offered':>9}{'served':>8}{'match':>8}{'trips':>7}"
          f"{'fill':>7}{'detour':>9}{'revenue':>10}{'CO2kg':>8}")
    print("-" * 70)

    totals = dict(offered=0, served=0, trips=0, running=0, detour=0.0, revenue=0.0, co2=0.0)
    for day in range(args.days):
        r = run_day(world, day, policy=policy)
        totals["offered"] += r.lots_offered
        totals["served"] += r.lots_served
        totals["trips"] += len(r.trips)
        totals["running"] += r.trucks_running
        totals["detour"] += r.detour_km
        totals["revenue"] += r.revenue
        totals["co2"] += r.co2_kg
        print(
            f"{day:>4}{r.lots_offered:>9}{r.lots_served:>8}{r.match_rate:>7.0%}"
            f"{len(r.trips):>7}{r.forward_fill_rate:>7.0%}{r.detour_km:>9.1f}"
            f"{r.revenue:>10.0f}{r.co2_kg:>8.1f}"
        )

    n = args.days
    print("-" * 70)
    print(
        f"\nover {n} days: {totals['served']}/{totals['offered']} lots matched "
        f"({totals['served'] / max(totals['offered'], 1):.0%})"
    )
    print(
        f"forward fill: {totals['trips']}/{totals['running']} running trucks carried a "
        f"pooled load ({totals['trips'] / max(totals['running'], 1):.0%})"
    )
    print(f"detour       {totals['detour']:.0f} km, diesel Rs{totals['detour'] / 10 * 97.83:.0f}")
    print(f"revenue      Rs{totals['revenue']:.0f}")
    print(f"CO2 from detours {totals['co2']:.0f} kg")
    print("\nNOTE: driver and farmer behaviour are uncalibrated SIMULATED parameters.")
    print("These figures describe the model, not the corridor, until Phase 4 backtest.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
