"""Eight-stage derivation of a corridor day.

A pure read across modules that already run, not a parallel implementation. Each stage
reports where its number came from, and the chain's confidence is the weakest stage
that actually produced evidence -- stages with nothing to say are excluded rather than
scored zero, so an absent backhaul market does not drag down a well-evidenced routing
result it has nothing to do with.
"""

from dataclasses import dataclass

from core.domain.provenance import Provenance
from core.pricing.economics import co2_kg, diesel_cost
from core.pricing.fare import full_truck_fare
from twin.engine.tick import DayResult

STAGE_ORDER = (
    "harvest",
    "truck_supply",
    "matching",
    "routing",
    "pricing",
    "backhaul",
    "emissions",
    "outcomes",
)


@dataclass(frozen=True)
class Stage:
    key: str
    headline: str
    value: float
    unit: str
    provenance: Provenance
    evidenced: bool
    detail: str


@dataclass(frozen=True)
class Cascade:
    day: int
    stages: list[Stage]

    @property
    def confidence(self) -> Provenance:
        evidenced = [s.provenance for s in self.stages if s.evidenced]
        if not evidenced:
            return Provenance.SIMULATED
        order = [Provenance.REAL, Provenance.MODELED, Provenance.SIMULATED]
        return max(evidenced, key=order.index)

    def stage(self, key: str) -> Stage:
        return next(s for s in self.stages if s.key == key)


def detect(result: DayResult, trunk_km: float, has_live_trips: bool = False) -> Cascade:
    served_stops = sum(t.stops for t in result.trips)
    full = full_truck_fare(trunk_km)

    stages = [
        Stage(
            "harvest",
            "lots offered",
            float(result.lots_offered),
            "lots",
            Provenance.SIMULATED,
            result.lots_offered > 0,
            "farmer offer rate is an uncalibrated parameter; Phase 4 fits it to Agmarknet",
        ),
        Stage(
            "truck_supply",
            "trucks running",
            float(result.trucks_running),
            "trucks",
            Provenance.REAL if has_live_trips else Provenance.SIMULATED,
            result.trucks_running > 0,
            "declared trips; real once drivers are onboarded",
        ),
        Stage(
            "matching",
            "lots matched",
            float(result.lots_served),
            "lots",
            Provenance.MODELED,
            result.lots_offered > 0,
            "core matching, the same code the bot would run",
        ),
        Stage(
            "routing",
            "detour driven",
            result.detour_km,
            "km",
            Provenance.REAL,
            served_stops > 0,
            "distances come from the OSM road graph, validated against OSRM",
        ),
        Stage(
            "pricing",
            "farmer spend",
            result.revenue,
            "INR",
            Provenance.MODELED,
            result.revenue > 0,
            "fare formula is real; the truck rate it scales is not yet sourced",
        ),
        Stage(
            "backhaul",
            "return legs filled",
            0.0,
            "legs",
            Provenance.SIMULATED,
            False,
            "no backhaul demand data exists publicly; excluded until dealers are signed",
        ),
        Stage(
            "emissions",
            "CO2 from detours",
            co2_kg(result.detour_km),
            "kg",
            Provenance.MODELED,
            result.detour_km > 0,
            "real emission factor applied to real distances over a modelled day",
        ),
        Stage(
            "outcomes",
            "saved vs full-truck hire",
            (full * served_stops - result.revenue) if served_stops else 0.0,
            "INR",
            Provenance.MODELED,
            served_stops > 0,
            "counterfactual assumes each farmer would otherwise hire a whole truck",
        ),
    ]
    return Cascade(result.day, stages)


def driver_margin(result: DayResult) -> float:
    """What the pooled load earns a driver after the diesel its detour burns."""
    return result.revenue - diesel_cost(result.detour_km)
