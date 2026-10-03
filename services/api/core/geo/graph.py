"""Routing graph over the extracted corridor, weighted by the SCV speed profile.

Shortest paths minimise travel time (what a driver actually optimises, and what OSRM
does by default) and distance is then summed along the chosen path, so the two numbers
describe the same route rather than two different ones.
"""

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
from pyproj import Geod
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import connected_components, dijkstra
from scipy.spatial import cKDTree

from core.geo.profile import WAY_SPEED_TAGS, edge_speed_kmh

GEOD = Geod(ellps="WGS84")
ONEWAY_FORWARD = {"yes", "true", "1"}
ONEWAY_REVERSE = {"-1", "reverse"}


def build_edges(nodes: pd.DataFrame, ways: pd.DataFrame) -> pd.DataFrame:
    lat = dict(zip(nodes.node_id, nodes.lat))
    lon = dict(zip(nodes.node_id, nodes.lon))

    u, v, speeds, hw = [], [], [], []
    for w in ways.itertuples(index=False):
        tags = {k: getattr(w, k) for k in WAY_SPEED_TAGS}
        speed = edge_speed_kmh(tags)
        if speed is None:
            continue
        ids = [int(i) for i in w.node_ids]
        oneway = (tags.get("oneway") or "").lower()
        for a, b in zip(ids[:-1], ids[1:]):
            if a == b or a not in lat or b not in lat:
                continue
            if oneway in ONEWAY_REVERSE:
                pairs = [(b, a)]
            elif oneway in ONEWAY_FORWARD:
                pairs = [(a, b)]
            else:
                pairs = [(a, b), (b, a)]
            for x, y in pairs:
                u.append(x)
                v.append(y)
                speeds.append(speed)
                hw.append(w.highway)

    if not u:
        return pd.DataFrame(columns=["u", "v", "length_m", "time_min", "highway"])

    u_arr, v_arr = np.array(u, dtype=np.int64), np.array(v, dtype=np.int64)
    _, _, length_m = GEOD.inv(
        np.array([lon[i] for i in u_arr]),
        np.array([lat[i] for i in u_arr]),
        np.array([lon[i] for i in v_arr]),
        np.array([lat[i] for i in v_arr]),
    )
    length_m = np.abs(length_m)
    speed_arr = np.array(speeds, dtype=float)
    return pd.DataFrame(
        {
            "u": u_arr,
            "v": v_arr,
            "length_m": length_m,
            "time_min": length_m / 1000.0 / speed_arr * 60.0,
            "highway": hw,
        }
    )


@dataclass
class Route:
    distance_m: float
    time_min: float
    reachable: bool


class RoadGraph:
    def __init__(self, edges: pd.DataFrame, nodes: pd.DataFrame):
        keep = set(edges.u) | set(edges.v)
        nodes = nodes[nodes.node_id.isin(keep)].reset_index(drop=True)

        self.node_ids = nodes.node_id.to_numpy()
        self.lat = nodes.lat.to_numpy()
        self.lon = nodes.lon.to_numpy()
        self._index = {int(n): i for i, n in enumerate(self.node_ids)}

        ui = np.array([self._index[int(x)] for x in edges.u])
        vi = np.array([self._index[int(x)] for x in edges.v])
        n = len(self.node_ids)
        shape = (n, n)
        self.time = csr_matrix((edges.time_min.to_numpy(), (ui, vi)), shape=shape)
        self.dist = csr_matrix((edges.length_m.to_numpy(), (ui, vi)), shape=shape)

        # Snapping uses a local equirectangular projection in km; over a corridor this
        # is well under the error that matters for picking a nearest road node.
        mean_lat = float(np.mean(self.lat))
        self._kd = cKDTree(
            np.column_stack(
                [
                    self.lon * 111.32 * np.cos(np.radians(mean_lat)),
                    self.lat * 110.57,
                ]
            )
        )
        self._mean_lat = mean_lat

        ncomp, labels = connected_components(self.time, directed=True, connection="weak")
        self.component = labels
        self.main_component = int(np.bincount(labels).argmax()) if ncomp > 1 else 0

    def snap(self, lon: float, lat: float) -> tuple[int, float]:
        pt = [lon * 111.32 * np.cos(np.radians(self._mean_lat)), lat * 110.57]
        d_km, idx = self._kd.query(pt)
        return int(idx), float(d_km * 1000.0)

    def route(self, src: int, dst: int) -> Route:
        d, pred = dijkstra(
            self.time, directed=True, indices=src, return_predecessors=True
        )
        if not np.isfinite(d[dst]):
            return Route(float("nan"), float("nan"), False)

        metres, hop = 0.0, dst
        while hop != src:
            prev = pred[hop]
            if prev < 0:
                return Route(float("nan"), float("nan"), False)
            metres += self.dist[prev, hop]
            hop = prev
        return Route(metres, float(d[dst]), True)

    def route_many(self, src: int, dsts: list[int]) -> list[Route]:
        d, pred = dijkstra(
            self.time, directed=True, indices=src, return_predecessors=True
        )
        out = []
        for dst in dsts:
            if not np.isfinite(d[dst]):
                out.append(Route(float("nan"), float("nan"), False))
                continue
            metres, hop, ok = 0.0, dst, True
            while hop != src:
                prev = pred[hop]
                if prev < 0:
                    ok = False
                    break
                metres += self.dist[prev, hop]
                hop = prev
            out.append(
                Route(metres, float(d[dst]), True) if ok
                else Route(float("nan"), float("nan"), False)
            )
        return out


def load(derived: Path) -> RoadGraph:
    edges = pd.read_parquet(derived / "edges.parquet")
    nodes = pd.read_parquet(derived / "nodes.parquet")
    return RoadGraph(edges, nodes)
