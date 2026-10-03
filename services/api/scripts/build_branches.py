"""Derive the corridor's detour-branch topology and cache it."""

import argparse
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.geo.branches import Point, build_branches, build_matrix, solo_detour  # noqa: E402
from core.geo.corridor import CORRIDORS  # noqa: E402
from core.geo.graph import load  # noqa: E402

DATA = ROOT.parents[1] / "data"
FARM_PLACES = {"village", "hamlet", "town"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--corridor", default="nashik")
    ap.add_argument("--threshold", type=float, default=2.0)
    ap.add_argument("--max-snap-m", type=float, default=1500.0)
    args = ap.parse_args()

    corridor = CORRIDORS[args.corridor]
    derived = DATA / "derived" / corridor.key
    g = load(derived)
    places = pd.read_parquet(derived / "places.parquet")
    places = places[places.place.isin(FARM_PLACES) & places.name.notna()]

    points = []
    for anchor in (corridor.origin, corridor.destination):
        node, snap = g.snap(anchor.lon, anchor.lat)
        points.append(Point(anchor.key, anchor.name, anchor.lon, anchor.lat, node, snap))

    anchor_nodes = {p.node for p in points}
    dropped, duplicates = [], []
    for r in places.itertuples(index=False):
        node, snap = g.snap(r.lon, r.lat)
        if snap > args.max_snap_m:
            dropped.append((r.name, snap))
            continue
        # A settlement that snaps onto an anchor is that anchor, not a stop on the way.
        if node in anchor_nodes:
            duplicates.append(r.name)
            continue
        points.append(Point(f"v{r.node_id}", r.name, r.lon, r.lat, node, snap))

    print(
        f"{corridor.name}\nsettlements {len(points) - 2}  "
        f"dropped {len(dropped)}  anchor-duplicates {duplicates}"
    )
    m = build_matrix(g, points)
    o, d = m.index(corridor.origin.key), m.index(corridor.destination.key)
    candidates = [i for i in range(len(points)) if i not in (o, d)]
    candidates = [c for c in candidates if m.km[o, c] < float("inf")]

    branches, assignment = build_branches(m, o, d, candidates, args.threshold)

    rows = []
    for b in branches:
        for idx in b.members:
            p = m.points[idx]
            rows.append(
                {
                    "branch_id": b.branch_id,
                    "name": p.name,
                    "key": p.key,
                    "lon": p.lon,
                    "lat": p.lat,
                    "solo_detour_km": solo_detour(m, o, idx, d),
                    "branch_entry_km": b.entry_km,
                    "branch_full_km": b.full_km,
                    "branch_size": len(b.members),
                }
            )
    df = pd.DataFrame(rows).sort_values(["branch_id", "solo_detour_km"])
    df.to_parquet(derived / "branches.parquet", index=False)

    print(f"\nbranches {len(branches)}  (threshold {args.threshold} km)\n")
    print(f"{'id':>3} {'n':>3} {'entry_km':>9} {'full_km':>8} {'per_extra':>10}  members")
    print("-" * 92)
    for b in branches:
        shown = ", ".join(b.names[:5]) + ("..." if len(b.names) > 5 else "")
        print(
            f"{b.branch_id:>3} {len(b.members):>3} {b.entry_km:>9.1f} {b.full_km:>8.1f}"
            f" {b.marginal_per_extra_km:>10.2f}  {shown}"
        )

    multi = [b for b in branches if len(b.members) > 1]
    if multi:
        avg = sum(b.marginal_per_extra_km for b in multi) / len(multi)
        print(
            f"\n{len(multi)} shareable branches; "
            f"mean marginal cost per extra stop {avg:.2f} km"
        )
    print(f"\ncached -> {derived / 'branches.parquet'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
