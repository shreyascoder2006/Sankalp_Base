"""Clip a corridor's road network and settlements out of a Geofabrik .osm.pbf.

Two passes, because a pbf stores nodes before ways and we need coordinates to decide
which ways matter. Pass 1 keeps every node inside the corridor bbox (plus a margin so
ways crossing the boundary still resolve); pass 2 keeps highway ways touching that set.
"""

from dataclasses import dataclass
from pathlib import Path

import osmium
import pandas as pd

from core.geo.corridor import Corridor
from core.geo.profile import EXCLUDED

PLACE_KINDS = {"village", "hamlet", "town", "suburb", "city"}
WAY_TAG_KEYS = (
    "highway",
    "surface",
    "smoothness",
    "oneway",
    "access",
    "motor_vehicle",
    "maxspeed",
    "name",
    "bridge",
    "tracktype",
)
MARGIN_DEG = 0.05


@dataclass
class ExtractResult:
    nodes: pd.DataFrame
    ways: pd.DataFrame
    places: pd.DataFrame


def extract(pbf: Path, corridor: Corridor) -> ExtractResult:
    b = corridor.bbox
    south, north = b.south - MARGIN_DEG, b.north + MARGIN_DEG
    west, east = b.west - MARGIN_DEG, b.east + MARGIN_DEG

    coords: dict[int, tuple[float, float]] = {}
    places: list[dict] = []

    for n in osmium.FileProcessor(str(pbf), osmium.osm.NODE):
        if not n.location.valid():
            continue
        lat, lon = n.location.lat, n.location.lon
        if not (south <= lat <= north and west <= lon <= east):
            continue
        coords[n.id] = (lat, lon)
        place = n.tags.get("place")
        if place in PLACE_KINDS and b.south <= lat <= b.north and b.west <= lon <= b.east:
            places.append(
                {
                    "node_id": n.id,
                    "name": n.tags.get("name"),
                    "name_mr": n.tags.get("name:mr"),
                    "place": place,
                    "lat": lat,
                    "lon": lon,
                }
            )

    ways: list[dict] = []
    for w in osmium.FileProcessor(str(pbf), osmium.osm.WAY):
        hw = w.tags.get("highway")
        if hw is None or hw in EXCLUDED:
            continue
        refs = [n.ref for n in w.nodes]
        if not any(r in coords for r in refs):
            continue
        row = {k: w.tags.get(k) for k in WAY_TAG_KEYS}
        row["way_id"] = w.id
        row["node_ids"] = [r for r in refs if r in coords]
        if len(row["node_ids"]) < 2:
            continue
        ways.append(row)

    used = {r for w in ways for r in w["node_ids"]}
    nodes_df = pd.DataFrame(
        [{"node_id": i, "lat": c[0], "lon": c[1]} for i, c in coords.items() if i in used]
    )
    return ExtractResult(nodes_df, pd.DataFrame(ways), pd.DataFrame(places))


def write(result: ExtractResult, out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    result.nodes.to_parquet(out / "nodes.parquet", index=False)
    result.ways.to_parquet(out / "ways.parquet", index=False)
    result.places.to_parquet(out / "places.parquet", index=False)
