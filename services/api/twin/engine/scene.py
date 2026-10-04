"""Turn a simulated day into drawable, timed geometry.

The tick engine already decides who is picked up, in what order, and at what cost; it
just throws the geometry away afterwards. This replays one day and keeps it: the real
road polyline each truck drives, when it reaches each stop, and -- for farmers nobody
served -- the detour that would have been required and the cost that refused it.
"""

from dataclasses import dataclass, field

import numpy as np

from core.geo.branches import route_cost
from core.geo.graph import RoadGraph
from core.geo.index import CorridorIndex
from core.matching.candidates import Lot
from core.matching.pool import PoolPolicy, solve
from core.pricing.economics import diesel_cost
from core.pricing.fare import full_truck_fare, quote
from twin.agents.driver import SimulatedDriverSource, accepts
from twin.agents.farmer import lots_for_day
from twin.engine.sources import LivePreferringSource
from twin.world.seed import World

DAY_START_HOUR = 4.0


@dataclass
class SceneStop:
    point_key: str
    name: str
    arrive_min: float
    load_kg: float
    fare: float
    shares_branch: bool


@dataclass
class SceneTrip:
    truck_id: str
    depart_min: float
    arrive_min: float
    polyline: list[list[float]]
    cum_km: list[float]
    stops: list[SceneStop]
    distance_km: float
    detour_km: float
    served_kg: float
    spare_kg: float
    provenance: str


@dataclass
class SceneRefusal:
    point_key: str
    name: str
    load_kg: float
    detour_km: float
    diesel_cost: float
    revenue: float
    reason: str
    detail: str
    polyline: list[list[float]]


@dataclass
class DayScene:
    day: int
    trips: list[SceneTrip] = field(default_factory=list)
    refusals: list[SceneRefusal] = field(default_factory=list)
    horizon_min: float = 0.0


def _leg_polyline(graph: RoadGraph, idx: CorridorIndex, a: str, b: str, every: int) -> list[list[float]]:
    pa = idx.matrix.points[idx.point_index[a]]
    pb = idx.matrix.points[idx.point_index[b]]
    return graph.polyline(graph.snap(pa.lon, pa.lat)[0], graph.snap(pb.lon, pb.lat)[0], every)


def _cumulative_km(poly: list[list[float]]) -> list[float]:
    if not poly:
        return []
    out = [0.0]
    for (x1, y1), (x2, y2) in zip(poly[:-1], poly[1:]):
        # local flat-earth metres; over one corridor the error is far below a road width
        dx = (x2 - x1) * 111.32 * np.cos(np.radians((y1 + y2) / 2))
        dy = (y2 - y1) * 110.57
        out.append(out[-1] + float(np.hypot(dx, dy)))
    return [round(v, 4) for v in out]


def build_day_scene(
    world: World,
    graph: RoadGraph,
    day: int,
    policy: PoolPolicy = PoolPolicy(solver_ms=300),
    thin: int = 3,
    max_trips: int = 14,
) -> DayScene:
    idx = world.corridor
    dest_key = next(k for k, i in idx.point_index.items() if i == idx.dest)
    src = LivePreferringSource(SimulatedDriverSource(world, dest_key))
    name_of = dict(zip(idx.branches.key, idx.branches.name))
    name_of.update({p.key: p.name for p in idx.matrix.points})

    pending: list[Lot] = lots_for_day(world, day)
    states = [s for s in src.states_for_day(day) if s.spare_kg > 50.0]
    rng = np.random.default_rng(world.seed * 31 + day)

    scene = DayScene(day=day)
    for state in states:
        if not pending or len(scene.trips) >= max_trips:
            break
        route = solve(
            idx, pending, capacity_kg=state.spare_kg, policy=policy,
            origin_key=state.origin_key, dest_key=state.dest_key,
        )
        if not route.served or not accepts(rng):
            continue

        own_trunk = float(
            idx.matrix.km[idx.point_index[state.origin_key], idx.point_index[state.dest_key]]
        )
        detour = route.distance_km - own_trunk
        served_keys = {lot.point_key for lot in route.served}

        legs = [state.origin_key, *route.order, state.dest_key]
        poly: list[list[float]] = []
        leg_end_km: list[float] = []
        for a, b in zip(legs[:-1], legs[1:]):
            seg = _leg_polyline(graph, idx, a, b, thin)
            if poly and seg:
                seg = seg[1:]
            poly.extend(seg)
            leg_end_km.append(_cumulative_km(poly)[-1] if poly else 0.0)

        cum = _cumulative_km(poly)
        total_km = cum[-1] if cum else route.distance_km
        speed_kmh = total_km / max(route.duration_min / 60.0, 1e-6) if route.duration_min else 35.0
        depart = (state.depart_hour - DAY_START_HOUR) * 60.0

        stops: list[SceneStop] = []
        for leg_i, key in enumerate(route.order):
            lot = next(x for x in route.served if x.point_key == key)
            entry = idx.branch_entry_km(key)
            shared = len(set(idx.branch_members(key)) & served_keys)
            marginal = max(0.0, (detour - entry) / max(shared, 1))
            stops.append(
                SceneStop(
                    point_key=key,
                    name=name_of.get(key, key),
                    arrive_min=round(depart + leg_end_km[leg_i] / max(speed_kmh, 1e-6) * 60.0, 2),
                    load_kg=lot.weight_kg,
                    fare=quote(lot.weight_kg, own_trunk, entry, shared, marginal).total,
                    shares_branch=shared > 1,
                )
            )

        arrive = depart + total_km / max(speed_kmh, 1e-6) * 60.0
        scene.trips.append(
            SceneTrip(
                truck_id=state.truck_id,
                depart_min=round(depart, 2),
                arrive_min=round(arrive, 2),
                polyline=poly,
                cum_km=cum,
                stops=stops,
                distance_km=round(total_km, 2),
                detour_km=round(detour, 2),
                served_kg=sum(l.weight_kg for l in route.served),
                spare_kg=round(state.spare_kg, 1),
                provenance=state.provenance.value,
            )
        )
        taken = {l.lot_id for l in route.served}
        pending = [l for l in pending if l.lot_id not in taken]
        scene.horizon_min = max(scene.horizon_min, arrive)

    # Why each leftover went unserved. The reason is established, not assumed: a lot can
    # be perfectly profitable and still go nowhere because no truck had room for it, and
    # labelling that as an economic refusal would be simply false.
    max_spare = max((s.spare_kg for s in states), default=0.0)
    seen: set[str] = set()
    for lot in pending:
        if lot.point_key in seen or lot.point_key not in idx.point_index:
            continue
        seen.add(lot.point_key)
        node = idx.point_index[lot.point_key]
        extra = route_cost(idx.matrix, idx.origin, (node,), idx.dest) - idx.trunk_km
        cost = diesel_cost(extra)
        revenue = full_truck_fare(idx.trunk_km) / 1500.0 * lot.weight_kg

        if lot.weight_kg > max_spare:
            reason = "capacity"
            detail = f"{lot.weight_kg:.0f} kg exceeds the {max_spare:.0f} kg best spare today"
        elif cost > revenue:
            reason = "economics"
            detail = f"₹{cost:.0f} diesel against ₹{revenue:.0f} freight"
        else:
            reason = "no truck free"
            detail = "would have paid, but every truck filled before reaching it"

        a = _leg_polyline(graph, idx, "pimpalgaon", lot.point_key, thin)
        b = _leg_polyline(graph, idx, lot.point_key, "nashik_apmc", thin)
        scene.refusals.append(
            SceneRefusal(
                point_key=lot.point_key,
                name=name_of.get(lot.point_key, lot.point_key),
                load_kg=lot.weight_kg,
                detour_km=round(extra, 2),
                diesel_cost=round(cost, 2),
                revenue=round(revenue, 2),
                reason=reason,
                detail=detail,
                polyline=a + b[1:],
            )
        )

    scene.horizon_min = max(scene.horizon_min, 1.0)
    return scene
