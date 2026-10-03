"""Fare computation for a pooled run.

The brief prices a detour as a flat Rs50 per booking. Measured against real corridor
geometry that charge implicitly assumes every branch is shared about three ways: it
lands within 5% of cost at three farmers, but under-recovers by ~23% for a solo pickup,
which costs ~8.5 km off the trunk plus handling.

That matters because branch sharing is rare here -- only 3 of 15 branches support it --
so the common booking is solo and the brief's rate would lose money on most of them.

Branch entry cost is therefore split across everyone actually served on the branch, and
each farmer additionally pays only the marginal km their own stop adds.
"""

from dataclasses import dataclass

from core.domain.provenance import Provenance
from core.pricing.economics import (
    FULL_TRUCK_FARE_PER_KM,
    HANDLING_PER_STOP,
    PLATFORM_FEE_PCT,
    TRUCK_CAPACITY_KG,
    diesel_cost,
)


@dataclass(frozen=True)
class FareBreakdown:
    capacity_share: float
    branch_entry_share: float
    marginal_detour: float
    handling: float
    platform_fee: float
    provenance: Provenance

    @property
    def total(self) -> float:
        return round(
            self.capacity_share
            + self.branch_entry_share
            + self.marginal_detour
            + self.handling
            + self.platform_fee,
            2,
        )


def full_truck_fare(trunk_km: float) -> float:
    return trunk_km * FULL_TRUCK_FARE_PER_KM.value


def quote(
    load_kg: float,
    trunk_km: float,
    branch_entry_km: float,
    branch_shared_by: int,
    marginal_km: float,
    capacity_kg: float | None = None,
) -> FareBreakdown:
    if load_kg <= 0:
        raise ValueError("load_kg must be positive")
    if branch_shared_by < 1:
        raise ValueError("branch_shared_by must be at least 1")

    capacity = capacity_kg or TRUCK_CAPACITY_KG.value
    if load_kg > capacity:
        raise ValueError(f"load {load_kg} kg exceeds capacity {capacity} kg")

    capacity_share = full_truck_fare(trunk_km) / capacity * load_kg
    entry_share = diesel_cost(branch_entry_km) / branch_shared_by
    marginal = diesel_cost(marginal_km)
    handling = HANDLING_PER_STOP.value

    subtotal = capacity_share + entry_share + marginal + handling
    fee = subtotal * PLATFORM_FEE_PCT.value

    # Weakest input governs: the fare is only as well-evidenced as the truck rate.
    return FareBreakdown(
        capacity_share=round(capacity_share, 2),
        branch_entry_share=round(entry_share, 2),
        marginal_detour=round(marginal, 2),
        handling=round(handling, 2),
        platform_fee=round(fee, 2),
        provenance=Provenance.MODELED,
    )


def brief_quote(load_kg: float, full_truck: float, capacity_kg: float | None = None) -> float:
    """The brief's own formula, kept for comparison in the twin's what-if view."""
    capacity = capacity_kg or TRUCK_CAPACITY_KG.value
    subtotal = full_truck / capacity * load_kg + 50.0
    return round(subtotal * (1 + PLATFORM_FEE_PCT.value), 2)
