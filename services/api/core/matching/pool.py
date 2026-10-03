"""Pooled route construction as a capacitated VRP with optional stops.

Selection and sequencing are one decision, not two. Each lot is an optional node whose
drop penalty is the revenue it would earn, and arc costs are the diesel burnt to travel
them, so the solver accepts a lot exactly when serving it pays for itself. That ties
matching to pricing instead of letting a geometric threshold stand in for economics.

The greedy fill in candidates.py remains useful for ranking and for explaining a single
offer to a driver, but it sequences by accident; this does it properly.
"""

from dataclasses import dataclass

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from core.geo.index import CorridorIndex
from core.geo.profile import STOP_SERVICE_MINUTES
from core.matching.candidates import Lot
from core.pricing.economics import TRUCK_CAPACITY_KG, diesel_cost
from core.pricing.fare import full_truck_fare

UNREACHABLE_PAISE = 10**9


@dataclass(frozen=True)
class PooledRoute:
    served: list[Lot]
    dropped: list[Lot]
    order: list[str]
    distance_km: float
    duration_min: float

    @property
    def stops(self) -> int:
        return len(self.served)


@dataclass(frozen=True)
class PoolPolicy:
    max_stops: int = 5
    max_route_minutes: float | None = 240.0
    solver_seconds: int = 5


def _lot_revenue(weight_kg: float, trunk_km: float) -> float:
    """Revenue attributable to a lot, independent of the route finally chosen.

    Rated against the truck's full capacity, never its spare capacity on this trip:
    a farmer pays for the share of a truck they occupy, and the driver's remaining
    space does not change that. Dividing by spare capacity inflates revenue per kg and
    makes the solver maximise tonnage instead of profit.
    """
    return full_truck_fare(trunk_km) / TRUCK_CAPACITY_KG.value * weight_kg


def solve(
    index: CorridorIndex,
    lots: list[Lot],
    capacity_kg: float | None = None,
    policy: PoolPolicy = PoolPolicy(),
) -> PooledRoute:
    capacity = capacity_kg or TRUCK_CAPACITY_KG.value
    usable = [lot for lot in lots if lot.point_key in index.point_index]
    if not usable:
        return PooledRoute([], list(lots), [], index.trunk_km, 0.0)

    # node 0 = origin, node 1 = destination, 2.. = lots
    nodes = [index.origin, index.dest] + [index.point_index[lot.point_key] for lot in usable]
    km, minutes = index.matrix.km, index.matrix.minutes

    def cost_paise(a: int, b: int) -> int:
        d = km[nodes[a], nodes[b]]
        return UNREACHABLE_PAISE if d == float("inf") else int(diesel_cost(d) * 100)

    def travel_min(a: int, b: int) -> int:
        t = minutes[nodes[a], nodes[b]]
        return 10**6 if t == float("inf") else int(t)

    manager = pywrapcp.RoutingIndexManager(len(nodes), 1, [0], [1])
    routing = pywrapcp.RoutingModel(manager)

    transit = routing.RegisterTransitCallback(
        lambda i, j: cost_paise(manager.IndexToNode(i), manager.IndexToNode(j))
    )
    routing.SetArcCostEvaluatorOfAllVehicles(transit)

    # OR-Tools charges nothing for a route that visits no one, so without this the
    # solver compares "cost of the whole trip including the trunk run" against a lot's
    # revenue and refuses everything. The driver is making the trunk run regardless;
    # charging the empty route too makes the comparison incremental, which is the only
    # version of the question that means anything here.
    routing.SetVehicleUsedWhenEmpty(True, 0)

    demand = routing.RegisterUnaryTransitCallback(
        lambda i: 0 if manager.IndexToNode(i) < 2 else int(usable[manager.IndexToNode(i) - 2].weight_kg)
    )
    routing.AddDimensionWithVehicleCapacity(demand, 0, [int(capacity)], True, "capacity")

    time_cb = routing.RegisterTransitCallback(
        lambda i, j: travel_min(manager.IndexToNode(i), manager.IndexToNode(j))
        + (0 if manager.IndexToNode(i) < 2 else int(STOP_SERVICE_MINUTES))
    )
    horizon = int(policy.max_route_minutes) if policy.max_route_minutes else 10**6
    routing.AddDimension(time_cb, 0, horizon, True, "time")

    visits = routing.RegisterUnaryTransitCallback(
        lambda i: 0 if manager.IndexToNode(i) < 2 else 1
    )
    routing.AddDimension(visits, 0, policy.max_stops, True, "stops")

    for n in range(2, len(nodes)):
        penalty = int(_lot_revenue(usable[n - 2].weight_kg, index.trunk_km) * 100)
        routing.AddDisjunction([manager.NodeToIndex(n)], penalty)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    params.time_limit.FromSeconds(policy.solver_seconds)

    solution = routing.SolveWithParameters(params)
    if solution is None:
        return PooledRoute([], list(lots), [], index.trunk_km, 0.0)

    order, served, total_km, total_min = [], [], 0.0, 0.0
    idx = routing.Start(0)
    while not routing.IsEnd(idx):
        node = manager.IndexToNode(idx)
        nxt = solution.Value(routing.NextVar(idx))
        nxt_node = manager.IndexToNode(nxt)
        total_km += float(km[nodes[node], nodes[nxt_node]])
        total_min += float(minutes[nodes[node], nodes[nxt_node]])
        if node >= 2:
            lot = usable[node - 2]
            served.append(lot)
            order.append(lot.point_key)
            total_min += STOP_SERVICE_MINUTES
        idx = nxt

    served_ids = {lot.lot_id for lot in served}
    dropped = [lot for lot in lots if lot.lot_id not in served_ids]
    return PooledRoute(served, dropped, order, total_km, total_min)
