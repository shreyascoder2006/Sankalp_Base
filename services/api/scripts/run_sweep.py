"""Sweep farmer and truck density; report what a 50% forward fill rate requires."""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.geo.index import load_index  # noqa: E402
from twin.calibration.sensitivity import sweep, threshold_for_fill  # noqa: E402

DERIVED = ROOT.parents[1] / "data" / "derived" / "nashik"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=4)
    ap.add_argument("--target", type=float, default=0.50)
    args = ap.parse_args()

    idx = load_index(DERIVED, "pimpalgaon", "nashik_apmc")
    farmer_counts = [100, 200, 400, 800]
    truck_counts = [15, 30, 60]

    print(f"corridor {idx.trunk_km:.1f} km   {args.days} simulated days per cell")
    print("forward fill = share of running trucks that carried a pooled load\n")
    points = sweep(idx, farmer_counts, truck_counts, days=args.days)

    print(f"{'farmers':>8}{'trucks':>8}{'lots/truck':>12}{'match':>8}{'fill':>8}{'detour':>9}")
    print("-" * 53)
    for p in points:
        ratio = p.farmers / p.trucks
        print(
            f"{p.farmers:>8}{p.trucks:>8}{ratio:>12.1f}{p.match_rate:>8.0%}"
            f"{p.forward_fill_rate:>8.0%}{p.mean_detour_km:>9.1f}"
        )

    hits = threshold_for_fill(points, args.target)
    print()
    if hits:
        best = hits[0]
        print(
            f"{args.target:.0%} forward fill is reached at "
            f"{best.farmers} farmers / {best.trucks} trucks "
            f"({best.farmers / best.trucks:.0f} farmers per truck)"
        )
        print(f"cheapest qualifying ratio across the sweep: "
              f"{min(h.farmers / h.trucks for h in hits):.0f} farmers per truck")
    else:
        print(f"no swept configuration reaches {args.target:.0%} forward fill")
        print(f"best observed: {max(p.forward_fill_rate for p in points):.0%}")

    print("\nThis states what the target REQUIRES under current assumptions.")
    print("Farmer offer rate and driver trip rate are uncalibrated; Phase 4 fits them.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
