"""Loader for the cached corridor artefacts the matcher and twin both read."""

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

from core.geo.branches import Matrix, Point


@dataclass
class CorridorIndex:
    matrix: Matrix
    branches: pd.DataFrame
    point_index: dict[str, int]
    branch_of: dict[str, int]
    origin: int
    dest: int

    @property
    def trunk_km(self) -> float:
        return float(self.matrix.km[self.origin, self.dest])

    def branch_entry_km(self, point_key: str) -> float:
        row = self.branches[self.branches.key == point_key]
        return float(row.iloc[0].branch_entry_km) if not row.empty else 0.0

    def branch_members(self, point_key: str) -> list[str]:
        bid = self.branch_of.get(point_key)
        if bid is None:
            return [point_key]
        return self.branches[self.branches.branch_id == bid].key.tolist()


def load_index(derived: Path, origin_key: str, dest_key: str) -> CorridorIndex:
    mats = np.load(derived / "matrix.npz")
    pts = pd.read_parquet(derived / "points.parquet")
    branches = pd.read_parquet(derived / "branches.parquet")

    points = [
        Point(r.key, r.name, r.lon, r.lat, node=-1, snap_m=r.snap_m)
        for r in pts.itertuples(index=False)
    ]
    matrix = Matrix(points, mats["km"], mats["minutes"])
    point_index = {p.key: i for i, p in enumerate(points)}

    return CorridorIndex(
        matrix=matrix,
        branches=branches,
        point_index=point_index,
        branch_of=dict(zip(branches.key, branches.branch_id)),
        origin=point_index[origin_key],
        dest=point_index[dest_key],
    )
