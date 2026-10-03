"""Clip the corridor out of the regional .osm.pbf and cache it as parquet."""

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.geo.corridor import CORRIDORS  # noqa: E402
from core.geo.extract import extract, write  # noqa: E402

DATA = ROOT.parents[1] / "data"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--corridor", default="nashik")
    ap.add_argument("--pbf", default=str(DATA / "raw" / "western-zone-latest.osm.pbf"))
    args = ap.parse_args()

    corridor = CORRIDORS[args.corridor]
    pbf = Path(args.pbf)
    if not pbf.exists():
        print(f"missing extract: {pbf}", file=sys.stderr)
        return 1

    print(f"{corridor.name}\nreading {pbf.name} ({pbf.stat().st_size / 1e6:.0f} MB)")
    t0 = time.time()
    result = extract(pbf, corridor)
    out = DATA / "derived" / corridor.key
    write(result, out)

    (out / "manifest.json").write_text(
        json.dumps(
            {
                "corridor": corridor.key,
                "bbox": corridor.bbox.__dict__,
                "source": pbf.name,
                "source_url": "https://download.geofabrik.de/asia/india/western-zone-latest.osm.pbf",
                "licence": "OpenStreetMap contributors, ODbL",
                "provenance": "REAL",
                "built_at": datetime.now(timezone.utc).isoformat(),
                "counts": {
                    "nodes": len(result.nodes),
                    "ways": len(result.ways),
                    "places": len(result.places),
                },
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(
        f"nodes {len(result.nodes):,}  ways {len(result.ways):,}  "
        f"places {len(result.places):,}   ({time.time() - t0:.0f}s)"
    )
    if not result.ways.empty:
        print("\ntop highway classes:")
        print(result.ways["highway"].value_counts().head(10).to_string())
    print(f"\ncached -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
