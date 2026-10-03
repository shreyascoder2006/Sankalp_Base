"""Detour-branch topology for a corridor.

A branch is a set of settlements a truck can serve on one departure from the trunk
route. Membership is defined empirically — by the marginal cost of adding one stop to
a route that already serves another — rather than by geometry, because the structure
that matters is a through-road paralleling the trunk, not only a dead-end spur.

This replaces the absolute detour cap in the brief: on this corridor no village is
within 5 km of the trunk run, but a second stop on a branch already being served is
close to free, so branch membership is what actually governs whether pooling pays.
"""

from dataclasses import dataclass
from itertools import permutations

import numpy as np
from scipy.cluster.hierarchy import fcluster, linkage
from scipy.spatial.distance import squareform

from core.geo.graph import RoadGraph

MAX_EXACT_STOPS = 7


@dataclass
class Point:
    key: str
    name: str
    lon: float
    lat: float
    node: int
    snap_m: float


@dataclass
class Matrix:
    points: list[Point]
    km: np.ndarray
    minutes: np.ndarray

    def index(self, key: str) -> int:
        for i, p in enumerate(self.points):
            if p.key == key:
                return i
        raise KeyError(key)


def build_matrix(graph: RoadGraph, points: list[Point]) -> Matrix:
    n = len(points)
    km = np.full((n, n), np.inf)
    minutes = np.full((n, n), np.inf)
    targets = [p.node for p in points]
    for i, p in enumerate(points):
        for j, r in enumerate(graph.route_many(p.node, targets)):
            if r.reachable:
                km[i, j] = r.distance_m / 1000.0
                minutes[i, j] = r.time_min
    np.fill_diagonal(km, 0.0)
    np.fill_diagonal(minutes, 0.0)
    return Matrix(points, km, minutes)


def _leg_sum(m: Matrix, seq: tuple[int, ...]) -> float:
    return float(sum(m.km[a, b] for a, b in zip(seq[:-1], seq[1:])))


def route_cost(m: Matrix, origin: int, stops: tuple[int, ...], dest: int) -> float:
    """Cheapest ordering of `stops` between origin and destination."""
    if not stops:
        return _leg_sum(m, (origin, dest))
    if len(stops) <= MAX_EXACT_STOPS:
        return min(_leg_sum(m, (origin, *p, dest)) for p in permutations(stops))

    # Greedy nearest-next, then a 2-opt pass; exact permutation is infeasible here.
    remaining, order, cur = list(stops), [], origin
    while remaining:
        nxt = min(remaining, key=lambda s: m.km[cur, s])
        order.append(nxt)
        remaining.remove(nxt)
        cur = nxt
    improved = True
    while improved:
        improved = False
        for i in range(len(order) - 1):
            for j in range(i + 1, len(order)):
                cand = order[:i] + order[i : j + 1][::-1] + order[j + 1 :]
                if _leg_sum(m, (origin, *cand, dest)) < _leg_sum(m, (origin, *order, dest)):
                    order, improved = cand, True
    return _leg_sum(m, (origin, *order, dest))


def solo_detour(m: Matrix, origin: int, stop: int, dest: int) -> float:
    return route_cost(m, origin, (stop,), dest) - route_cost(m, origin, (), dest)


def marginal_detour(m: Matrix, origin: int, given: int, add: int, dest: int) -> float:
    """Extra km to add `add` to a route already stopping at `given`."""
    return route_cost(m, origin, (given, add), dest) - route_cost(m, origin, (given,), dest)


@dataclass
class Branch:
    branch_id: int
    members: list[int]
    names: list[str]
    entry_km: float
    full_km: float

    @property
    def marginal_per_extra_km(self) -> float:
        extra = len(self.members) - 1
        return (self.full_km - self.entry_km) / extra if extra else 0.0


def pair_costs(m: Matrix, origin: int, dest: int, candidates: list[int]) -> np.ndarray:
    """Symmetric cheapest marginal cost of serving each pair together."""
    n = len(candidates)
    out = np.zeros((n, n))
    for i, a in enumerate(candidates):
        for j in range(i + 1, n):
            b = candidates[j]
            cost = max(
                0.0,
                min(
                    marginal_detour(m, origin, a, b, dest),
                    marginal_detour(m, origin, b, a, dest),
                ),
            )
            out[i, j] = out[j, i] = cost
    return out


def build_branches(
    m: Matrix, origin: int, dest: int, candidates: list[int], threshold_km: float = 2.0
) -> tuple[list[Branch], dict[str, int]]:
    """Greedy agglomerative clustering on *joint* serving cost.

    Clustering on pairwise marginal cost does not work here: cheapness does not
    compose, so a group whose every pair is within threshold can still be expensive
    to serve in one run. The merge test is therefore the cost of the merged group
    itself — the quantity the matcher and the fare split both actually use.
    """
    base = route_cost(m, origin, (), dest)

    def extra(group: tuple[int, ...]) -> float:
        return route_cost(m, origin, group, dest) - base

    def per_extra(group: tuple[int, ...]) -> float:
        if len(group) < 2:
            return 0.0
        entry = min(solo_detour(m, origin, s, dest) for s in group)
        return (extra(group) - entry) / (len(group) - 1)

    clusters = [(c,) for c in candidates]
    while len(clusters) > 1:
        best, best_cost = None, float("inf")
        for i in range(len(clusters)):
            for j in range(i + 1, len(clusters)):
                merged = tuple(sorted(clusters[i] + clusters[j]))
                cost = per_extra(merged)
                if cost < best_cost:
                    best, best_cost = (i, j, merged), cost
        if best is None or best_cost > threshold_km:
            break
        i, j, merged = best
        clusters = [c for k, c in enumerate(clusters) if k not in (i, j)] + [merged]

    branches, assignment = [], {}
    for bid, members in enumerate(sorted(clusters, key=lambda c: -len(c))):
        entry = min(solo_detour(m, origin, s, dest) for s in members)
        branches.append(
            Branch(
                branch_id=bid,
                members=list(members),
                names=[m.points[s].name for s in members],
                entry_km=entry,
                full_km=extra(members),
            )
        )
        for s in members:
            assignment[m.points[s].key] = bid
    return branches, assignment
