"""Advance the corridor one day.

Matching and pricing are imported from core, never reimplemented here. If the
simulation sequenced or priced its own way, every number it produced would describe a
system other than the one the bot would actually run.
"""

from dataclasses import dataclass, field

import numpy as np

from core.matching.candidates import Lot
from core.matching.pool import PoolPolicy, solve
from core.pricing.economics import co2_kg, diesel_cost
from core.pricing.fare import full_truck_fare, quote
from twin.agents.driver import SimulatedDriverSource, accepts
from twin.agents.farmer import lots_for_day
from twin.engine.sources import LivePreferringSource
from twin.world.seed import World


@dataclass
class Trip:
    truck_id: str
    stops: int
    distance_km: float
    detour_km: float
    served_kg: float
    farmer_fares: list[float] = field(default_factory=list)

    @property
    def revenue(self) -> float:
        return sum(self.farmer_fares)


@dataclass
class DayResult:
    day: int
    trips: list[Trip]
    lots_offered: int
    lots_served: int
    kg_offered: float
    kg_served: float
    trucks_running: int
    trucks_with_pooled_load: int

    @property
    def match_rate(self) -> float:
        return self.lots_served / self.lots_offered if self.lots_offered else 0.0

    @property
    def forward_fill_rate(self) -> float:
        return self.trucks_with_pooled_load / self.trucks_running if self.trucks_running else 0.0

    @property
    def detour_km(self) -> float:
        return sum(t.detour_km for t in self.trips)

    @property
    def revenue(self) -> float:
        return sum(t.revenue for t in self.trips)

    @property
    def co2_kg(self) -> float:
        """Emissions from pooling detours only; the trunk run happens regardless."""
        return co2_kg(self.detour_km)


def run_day(
    world: World,
    day: int,
    source: LivePreferringSource | None = None,
    policy: PoolPolicy = PoolPolicy(solver_seconds=2),
    season: float = 1.0,
) -> DayResult:
    idx = world.corridor
    dest_key = next(k for k, i in idx.point_index.items() if i == idx.dest)
    src = source or LivePreferringSource(SimulatedDriverSource(world, dest_key))

    pending: list[Lot] = lots_for_day(world, day, season=season)
    offered = len(pending)
    kg_offered = sum(lot.weight_kg for lot in pending)

    states = [s for s in src.states_for_day(day) if s.spare_kg > 50.0]
    rng = np.random.default_rng(world.seed * 31 + day)

    trips: list[Trip] = []
    for state in states:
        if not pending:
            break
        route = solve(
            idx,
            pending,
            capacity_kg=state.spare_kg,
            policy=policy,
            origin_key=state.origin_key,
            dest_key=state.dest_key,
        )
        if not route.served or not accepts(rng):
            continue

        own_trunk_km = float(
            idx.matrix.km[idx.point_index[state.origin_key], idx.point_index[state.dest_key]]
        )
        served_keys = {lot.point_key for lot in route.served}
        detour = route.distance_km - own_trunk_km
        trip = Trip(
            truck_id=state.truck_id,
            stops=route.stops,
            distance_km=route.distance_km,
            detour_km=detour,
            served_kg=sum(lot.weight_kg for lot in route.served),
        )

        for lot in route.served:
            entry = idx.branch_entry_km(lot.point_key)
            shared = len(set(idx.branch_members(lot.point_key)) & served_keys)
            marginal = max(0.0, (detour - entry) / max(shared, 1))
            trip.farmer_fares.append(
                quote(lot.weight_kg, own_trunk_km, entry, shared, marginal).total
            )

        trips.append(trip)
        taken = {lot.lot_id for lot in route.served}
        pending = [lot for lot in pending if lot.lot_id not in taken]

    served = offered - len(pending)
    return DayResult(
        day=day,
        trips=trips,
        lots_offered=offered,
        lots_served=served,
        kg_offered=kg_offered,
        kg_served=kg_offered - sum(lot.weight_kg for lot in pending),
        trucks_running=len(states),
        trucks_with_pooled_load=len(trips),
    )


def farmer_saving_vs_full_truck(result: DayResult, trunk_km: float) -> float:
    """Fraction saved against every served farmer hiring a whole truck instead."""
    full = full_truck_fare(trunk_km)
    served = sum(t.stops for t in result.trips)
    if not served:
        return 0.0
    return (full * served - result.revenue) / (full * served)


def detour_diesel_cost(result: DayResult) -> float:
    return diesel_cost(result.detour_km)
