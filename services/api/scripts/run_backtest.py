"""Fit the harvest model to observed mandi arrivals, or explain why it cannot."""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.geo.index import load_index  # noqa: E402
from twin.calibration.backtest import NoObservedData, fit, load_observed  # noqa: E402

DATA = ROOT.parents[1] / "data"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--corridor", default="nashik")
    ap.add_argument("--farmers", type=int, default=2000)
    args = ap.parse_args()

    idx = load_index(DATA / "derived" / args.corridor, "pimpalgaon", "nashik_apmc")
    path = DATA / "raw" / f"arrivals_{args.corridor}.csv"

    try:
        observed = load_observed(path)
    except NoObservedData as exc:
        print("BACKTEST NOT RUN")
        print(f"  {exc}")
        print()
        print("  The harvest model is therefore UNCALIBRATED. Every volume figure the")
        print("  simulation produces describes the model's assumptions, not Nashik.")
        print("  No synthetic stand-in is generated on purpose: fitting to invented")
        print("  data would validate nothing while looking like validation.")
        return 2

    print(f"observed {len(observed)} days from {path.name}")
    result = fit(idx, observed, n_farmers=args.farmers)
    print(f"\nbest fit")
    print(f"  offer probability  {result.offer_probability:.3f}")
    print(f"  median lot         {result.lot_kg_median:.0f} kg")
    print(f"  observed mean      {result.observed_mean:.1f} t/day")
    print(f"  simulated mean     {result.simulated_mean:.1f} t/day")
    print(f"  RMSE               {result.rmse_tonnes:.1f} t")
    print(f"  MAPE               {result.mape:.1%}")
    print(f"\nSTATUS: {'PASS' if result.within_band else 'FAIL'} (band: MAPE < 25%)")
    return 0 if result.within_band else 1


if __name__ == "__main__":
    raise SystemExit(main())
