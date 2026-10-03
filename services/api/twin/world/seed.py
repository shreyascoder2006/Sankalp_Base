"""Deterministic world construction for a corridor."""

from dataclasses import dataclass, field

import numpy as np

from core.geo.index import CorridorIndex
from core.pricing.economics import TRUCK_CAPACITY_KG
from twin.world.distributions import sample_holding_ha


@dataclass(frozen=True)
class Farmer:
    farmer_id: str
    point_key: str
    holding_ha: float


@dataclass(frozen=True)
class Truck:
    truck_id: str
    home_key: str
    capacity_kg: float


@dataclass(frozen=True)
class Shipper:
    shipper_id: str
    point_key: str
    kind: str


@dataclass
class World:
    corridor: CorridorIndex
    farmers: list[Farmer]
    trucks: list[Truck]
    shippers: list[Shipper]
    seed: int
    rng: np.random.Generator = field(repr=False)

    @property
    def village_keys(self) -> list[str]:
        return sorted({f.point_key for f in self.farmers})


SHIPPER_KINDS = ("input_dealer", "kirana", "fpo")


def build_world(
    corridor: CorridorIndex,
    n_farmers: int = 400,
    n_trucks: int = 60,
    n_shippers: int = 25,
    seed: int = 7,
) -> World:
    rng = np.random.default_rng(seed)
    villages = corridor.branches.key.tolist()
    if not villages:
        raise ValueError("corridor has no settlements; build branches first")

    holdings = sample_holding_ha(rng, n_farmers)
    farmers = [
        Farmer(f"f{i:04d}", villages[rng.integers(len(villages))], float(h))
        for i, h in enumerate(holdings)
    ]

    trucks = [
        Truck(
            f"t{i:03d}",
            villages[rng.integers(len(villages))],
            float(TRUCK_CAPACITY_KG.value),
        )
        for i in range(n_trucks)
    ]

    shippers = [
        Shipper(f"s{i:03d}", villages[rng.integers(len(villages))], SHIPPER_KINDS[i % 3])
        for i in range(n_shippers)
    ]

    return World(corridor, farmers, trucks, shippers, seed, rng)
