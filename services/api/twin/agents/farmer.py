"""Simulated farmer behaviour: which lots come to market on a given day."""

import numpy as np

from core.matching.candidates import Lot
from twin.world.distributions import OFFER_PROBABILITY, sample_lot_kg
from twin.world.seed import World


def lots_for_day(world: World, day: int, crop: str = "onion", season: float = 1.0) -> list[Lot]:
    """`season` scales offer probability; Phase 4 drives it from Agmarknet arrivals."""
    rng = np.random.default_rng(world.seed * 7_919 + day)
    p = min(1.0, OFFER_PROBABILITY.value * season)
    offering = [f for f in world.farmers if rng.random() < p]
    if not offering:
        return []

    weights = sample_lot_kg(rng, np.array([f.holding_ha for f in offering]))
    return [
        Lot(f"{f.farmer_id}-d{day}", f.point_key, crop, float(kg))
        for f, kg in zip(offering, weights)
    ]
