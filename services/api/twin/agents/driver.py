"""Simulated driver behaviour: declared trips and offer acceptance."""

import numpy as np

from core.domain.provenance import Provenance, Tagged
from twin.engine.sources import TruckState
from twin.world.seed import World

TRIP_PROBABILITY = Tagged(
    0.55,
    Provenance.SIMULATED,
    "chance a truck runs to the mandi on a given day; Phase 0 interviews must replace",
)

OWN_LOAD_FRACTION = Tagged(
    (0.45, 0.85),
    Provenance.SIMULATED,
    "share of capacity already filled with the driver's own consignment",
)

ACCEPTANCE_RATE = Tagged(
    0.8,
    Provenance.SIMULATED,
    "chance a driver accepts a profitable offer; uncalibrated",
)


class SimulatedDriverSource:
    def __init__(self, world: World, dest_key: str):
        self.world = world
        self.dest_key = dest_key

    def states_for_day(self, day: int) -> list[TruckState]:
        rng = np.random.default_rng(self.world.seed * 100_003 + day)
        out = []
        for truck in self.world.trucks:
            if rng.random() > TRIP_PROBABILITY.value:
                continue
            lo, hi = OWN_LOAD_FRACTION.value
            laden = truck.capacity_kg * rng.uniform(lo, hi)
            out.append(
                TruckState(
                    truck_id=truck.truck_id,
                    origin_key=truck.home_key,
                    dest_key=self.dest_key,
                    laden_kg=float(laden),
                    capacity_kg=truck.capacity_kg,
                    depart_hour=float(rng.uniform(4.0, 7.0)),
                    provenance=Provenance.SIMULATED,
                )
            )
        return out


def accepts(rng: np.random.Generator) -> bool:
    return bool(rng.random() < ACCEPTANCE_RATE.value)
