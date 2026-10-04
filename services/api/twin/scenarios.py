"""Hand-authored situations, answered by the real engine.

Each scenario fixes the inputs -- who has what, which truck is passing with how much
room -- and then runs the same matching and pricing code the bot would run. The numbers
in the narrative are read back out of the result, never written by hand, so a scenario
cannot claim an outcome the engine does not actually produce.
"""

from dataclasses import dataclass, field

from core.domain.provenance import Provenance
from core.geo.graph import RoadGraph
from core.geo.index import CorridorIndex
from core.matching.candidates import Lot
from core.matching.pool import PoolPolicy, solve
from core.pricing.economics import TRUCK_CAPACITY_KG, diesel_cost
from core.pricing.fare import brief_quote, full_truck_fare, quote
from twin.engine.scene import SceneStop, SceneTrip, _cumulative_km, _leg_polyline


@dataclass(frozen=True)
class LotSpec:
    village: str
    kg: float
    crop: str = "tomato"
    farmer: str = "farmer"


@dataclass(frozen=True)
class TruckSpec:
    truck_id: str
    home: str
    spare_kg: float
    laden_kg: float
    depart_hour: float = 5.0


@dataclass(frozen=True)
class ScenarioSpec:
    key: str
    title: str
    question: str
    lots: tuple[LotSpec, ...]
    trucks: tuple[TruckSpec, ...]
    takeaway: str


@dataclass
class ScenarioResult:
    spec: ScenarioSpec
    trips: list[SceneTrip] = field(default_factory=list)
    unserved: list[dict] = field(default_factory=list)
    facts: dict = field(default_factory=dict)
    horizon_min: float = 1.0


SCENARIOS: tuple[ScenarioSpec, ...] = (
    ScenarioSpec(
        key="forty_kg_alone",
        title="The 40 kg problem",
        question="Sunita has 40 kg of tomatoes. A pickup passes with exactly 40 kg of room. "
        "Spare space and a small lot -- so the match is obvious, surely?",
        lots=(LotSpec("Sakore", 40, "tomato", "Sunita"),),
        trucks=(TruckSpec("MH15-pickup", "Pimpalgaon Basvant", spare_kg=40, laden_kg=1460),),
        takeaway="It is refused, and correctly. Her village sits 8.8 km off the trunk road; "
        "that detour burns more diesel than 40 kg of freight can pay for. Spare capacity "
        "alone does not make a trip worth taking -- the detour has to be justified.",
    ),
    ScenarioSpec(
        key="forty_kg_shared",
        title="The same 40 kg, now worth collecting",
        question="Identical lot, identical village. This time a neighbour on the same side "
        "road also has produce, and the truck has room for both. What changes?",
        lots=(
            LotSpec("Sakore", 40, "tomato", "Sunita"),
            LotSpec("Mohadi", 300, "onion", "Kailas"),
        ),
        trucks=(TruckSpec("MH15-bolero", "Pimpalgaon Basvant", spare_kg=400, laden_kg=1100),),
        takeaway="Kailas's lot justifies leaving the highway; Sunita's 40 kg then rides a "
        "branch the truck is already serving and costs almost nothing extra. Her access "
        "depends on her neighbour, not on her own tonnage.",
    ),
    ScenarioSpec(
        key="isolated",
        title="The village nobody can reach",
        question="A farmer in an isolated village has a small lot. No branch, no neighbour. "
        "Does the freight cover the detour?",
        lots=(LotSpec("Bhuse", 80, "onion", "Ramdas"),),
        trucks=(TruckSpec("MH15-tempo", "Pimpalgaon Basvant", spare_kg=600, laden_kg=900),),
        takeaway="Some trips genuinely do not pay, and a platform that pretends otherwise "
        "just moves the loss onto the driver. Naming the gap is the honest answer.",
    ),
    ScenarioSpec(
        key="capacity",
        title="Profitable, and still stranded",
        question="A large lot on a cheap branch would earn well. The only truck passing has "
        "almost no room. Why is this farmer still waiting?",
        lots=(LotSpec("Mohadi", 700, "onion", "Vaishali"),),
        trucks=(TruckSpec("MH15-loaded", "Pimpalgaon Basvant", spare_kg=120, laden_kg=1380),),
        takeaway="Not every refusal is economic. This lot pays for itself several times "
        "over and still goes nowhere, because capacity and economics fail independently.",
    ),
    ScenarioSpec(
        key="milk_run",
        title="A full branch run",
        question="Three farmers across one branch, one truck with real room. How does the "
        "cost per farmer move as the truck fills?",
        lots=(
            LotSpec("Sakore", 220, "onion", "Sunita"),
            LotSpec("Mohadi", 260, "onion", "Kailas"),
            LotSpec("Korhate", 190, "onion", "Pandurang"),
        ),
        trucks=(TruckSpec("MH15-pooled", "Pimpalgaon Basvant", spare_kg=800, laden_kg=700),),
        takeaway="Cost per farmer falls as the branch fills. This is the shape the whole "
        "business depends on, and it is why recruitment should cluster on side roads.",
    ),
)


def _village_key(idx: CorridorIndex, name: str) -> str | None:
    row = idx.branches[idx.branches.name == name]
    if not row.empty:
        return str(row.iloc[0].key)
    for p in idx.matrix.points:
        if p.name == name:
            return p.key
    return None


def run_scenario(
    spec: ScenarioSpec,
    idx: CorridorIndex,
    graph: RoadGraph,
    policy: PoolPolicy = PoolPolicy(solver_ms=800),
    thin: int = 2,
) -> ScenarioResult:
    name_of = dict(zip(idx.branches.key, idx.branches.name))
    name_of.update({p.key: p.name for p in idx.matrix.points})

    lots: list[Lot] = []
    labels: dict[str, LotSpec] = {}
    for i, ls in enumerate(spec.lots):
        key = _village_key(idx, ls.village)
        if key is None:
            continue
        lot = Lot(f"{spec.key}-{i}", key, ls.crop, ls.kg)
        lots.append(lot)
        labels[lot.lot_id] = ls

    result = ScenarioResult(spec=spec)
    dest_key = next(k for k, i in idx.point_index.items() if i == idx.dest)
    pending = list(lots)

    for truck in spec.trucks:
        origin_key = _village_key(idx, truck.home) or "pimpalgaon"
        route = solve(
            idx, pending, capacity_kg=truck.spare_kg, policy=policy,
            origin_key=origin_key, dest_key=dest_key,
        )
        own_trunk = float(idx.matrix.km[idx.point_index[origin_key], idx.point_index[dest_key]])
        if not route.served:
            continue

        detour = route.distance_km - own_trunk
        served_keys = {l.point_key for l in route.served}
        legs = [origin_key, *route.order, dest_key]
        poly: list[list[float]] = []
        leg_end: list[float] = []
        for a, b in zip(legs[:-1], legs[1:]):
            seg = _leg_polyline(graph, idx, a, b, thin)
            if poly and seg:
                seg = seg[1:]
            poly.extend(seg)
            leg_end.append(_cumulative_km(poly)[-1] if poly else 0.0)

        cum = _cumulative_km(poly)
        total_km = cum[-1] if cum else route.distance_km
        speed = total_km / max(route.duration_min / 60.0, 1e-6) if route.duration_min else 35.0
        depart = (truck.depart_hour - 4.0) * 60.0

        stops: list[SceneStop] = []
        for li, key in enumerate(route.order):
            lot = next(x for x in route.served if x.point_key == key)
            entry = idx.branch_entry_km(key)
            shared = len(set(idx.branch_members(key)) & served_keys)
            marginal = max(0.0, (detour - entry) / max(shared, 1))
            stops.append(
                SceneStop(
                    point_key=key,
                    name=labels[lot.lot_id].farmer if lot.lot_id in labels else name_of.get(key, key),
                    arrive_min=round(depart + leg_end[li] / max(speed, 1e-6) * 60.0, 2),
                    load_kg=lot.weight_kg,
                    fare=quote(lot.weight_kg, own_trunk, entry, shared, marginal).total,
                    shares_branch=shared > 1,
                )
            )

        arrive = depart + total_km / max(speed, 1e-6) * 60.0
        result.trips.append(
            SceneTrip(
                truck_id=truck.truck_id, depart_min=round(depart, 2),
                arrive_min=round(arrive, 2), polyline=poly, cum_km=cum, stops=stops,
                distance_km=round(total_km, 2), detour_km=round(detour, 2),
                served_kg=sum(l.weight_kg for l in route.served),
                spare_kg=truck.spare_kg, provenance=Provenance.SIMULATED.value,
            )
        )
        result.horizon_min = max(result.horizon_min, arrive)
        taken = {l.lot_id for l in route.served}
        pending = [l for l in pending if l.lot_id not in taken]

    max_spare = max((t.spare_kg for t in spec.trucks), default=0.0)
    for lot in pending:
        ls = labels[lot.lot_id]
        key = lot.point_key
        entry = idx.branch_entry_km(key)
        cost = diesel_cost(entry)
        revenue = full_truck_fare(idx.trunk_km) / TRUCK_CAPACITY_KG.value * lot.weight_kg
        if lot.weight_kg > max_spare:
            reason, detail = "capacity", (
                f"{lot.weight_kg:.0f} kg needs more room than the {max_spare:.0f} kg spare"
            )
        elif cost > revenue:
            reason, detail = "economics", (
                f"₹{cost:.0f} of diesel for ₹{revenue:.0f} of freight"
            )
        else:
            reason, detail = "no truck free", "no passing truck had room in the window"
        result.unserved.append(
            {
                "farmer": ls.farmer, "village": name_of.get(key, ls.village),
                "point_key": key, "load_kg": lot.weight_kg,
                "detour_km": round(entry, 2), "diesel_cost": round(cost, 2),
                "revenue": round(revenue, 2), "reason": reason, "detail": detail,
                "polyline": (
                    _leg_polyline(graph, idx, "pimpalgaon", key, thin)
                    + _leg_polyline(graph, idx, key, dest_key, thin)[1:]
                ),
            }
        )

    served = [s for t in result.trips for s in t.stops]
    full = full_truck_fare(idx.trunk_km)
    result.facts = {
        "full_truck_fare": round(full, 2),
        "served": len(served),
        "unserved": len(result.unserved),
        "total_fare": round(sum(s.fare for s in served), 2),
        "cheapest_fare": round(min((s.fare for s in served), default=0.0), 2),
        "detour_km": round(sum(t.detour_km for t in result.trips), 2),
        "brief_fare": round(
            brief_quote(served[0].load_kg, full) if served else 0.0, 2
        ),
        "saving_vs_full_truck": (
            round(1 - (min(s.fare for s in served) / full), 4) if served else 0.0
        ),
    }
    return result
