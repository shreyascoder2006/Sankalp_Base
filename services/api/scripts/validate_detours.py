"""Compare our SCV graph against the live OSRM measurements taken on this corridor.

OSRM reference values were measured against router.project-osrm.org with its default
car profile. Distances should agree closely; durations are expected to diverge, because
that is the entire point of having an SCV profile.
"""

import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.geo.corridor import CORRIDORS  # noqa: E402
from core.geo.graph import load  # noqa: E402

DATA = ROOT.parents[1] / "data"

# Measured live, 2026-10-03, OSRM demo server, default car profile.
OSRM_REFERENCE_KM = {
    (): 30.1,
    ("Sakore",): 38.9,
    ("Mohadi",): 38.6,
    ("Korhate",): 47.5,
    ("Sakore", "Mohadi"): 38.9,
    ("Sakore", "Mohadi", "Korhate"): 47.8,
}


def main() -> int:
    corridor = CORRIDORS["nashik"]
    derived = DATA / "derived" / corridor.key
    g = load(derived)
    places = pd.read_parquet(derived / "places.parquet")

    def coords(name: str) -> tuple[float, float]:
        row = places[places.name == name]
        if row.empty:
            raise SystemExit(f"village not in extract: {name}")
        return float(row.iloc[0].lon), float(row.iloc[0].lat)

    def leg_sum(seq: tuple[str, ...]) -> tuple[float, float]:
        pts = [(corridor.origin.lon, corridor.origin.lat)]
        pts += [coords(n) for n in seq]
        pts.append((corridor.destination.lon, corridor.destination.lat))
        km = mins = 0.0
        for a, b in zip(pts[:-1], pts[1:]):
            si, _ = g.snap(*a)
            di, _ = g.snap(*b)
            r = g.route(si, di)
            if not r.reachable:
                return float("nan"), float("nan")
            km += r.distance_m / 1000.0
            mins += r.time_min
        return km, mins

    base_km, base_min = leg_sum(())
    print(f"base Pimpalgaon -> APMC : {base_km:.1f} km, {base_min:.0f} min (SCV profile)")
    print(f"OSRM reference          : {OSRM_REFERENCE_KM[()]:.1f} km, 25 min (car profile)")
    print()
    print(f"{'stops':<30}{'ours_km':>9}{'osrm_km':>9}{'delta':>8}{'detour':>9}{'min':>7}")
    print("-" * 72)

    ok = True
    for seq, osrm_km in OSRM_REFERENCE_KM.items():
        km, mins = leg_sum(seq)
        delta = (km - osrm_km) / osrm_km * 100
        label = " + ".join(seq) if seq else "(direct)"
        print(
            f"{label:<30}{km:>9.1f}{osrm_km:>9.1f}{delta:>7.0f}%"
            f"{km - base_km:>9.1f}{mins:>7.0f}"
        )
        if abs(delta) > 20:
            ok = False

    print()
    solo = leg_sum(("Sakore",))[0] - base_km
    chained = leg_sum(("Sakore", "Mohadi"))[0] - base_km
    print(f"marginal cost of adding Mohadi to a route already stopping at Sakore: "
          f"{chained - solo:+.2f} km")
    print("STATUS:", "PASS" if ok else "FAIL (distance deviates >20% from OSRM)")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
