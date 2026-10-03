"""Build the corridor routing graph and cache the edge list."""

import argparse
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.geo.corridor import CORRIDORS  # noqa: E402
from core.geo.graph import RoadGraph, build_edges  # noqa: E402

DATA = ROOT.parents[1] / "data"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--corridor", default="nashik")
    args = ap.parse_args()

    corridor = CORRIDORS[args.corridor]
    derived = DATA / "derived" / corridor.key

    nodes = pd.read_parquet(derived / "nodes.parquet")
    ways = pd.read_parquet(derived / "ways.parquet")
    print(f"{corridor.name}\nnodes {len(nodes):,}  ways {len(ways):,}")

    t0 = time.time()
    edges = build_edges(nodes, ways)
    edges.to_parquet(derived / "edges.parquet", index=False)
    print(f"edges {len(edges):,}  ({time.time() - t0:.1f}s)")

    g = RoadGraph(edges, nodes)
    sizes = np.bincount(g.component)
    main = sizes[g.main_component]
    print(
        f"graph nodes {len(g.node_ids):,}  components {len(sizes)}  "
        f"largest {main:,} ({main / len(g.node_ids):.1%})"
    )
    print(f"total road length {edges.length_m.sum() / 2 / 1000:,.0f} km")

    for anchor in (corridor.origin, corridor.destination):
        idx, snap_m = g.snap(anchor.lon, anchor.lat)
        print(f"snap {anchor.name:22s} {snap_m:6.0f} m  component {g.component[idx]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
