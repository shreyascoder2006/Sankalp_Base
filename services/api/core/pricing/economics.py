"""Cost parameters for the corridor.

Every value is tagged. The MODELED ones are the parameters Phase 0 interviews exist to
replace, and several of them are load-bearing: the fare a farmer is quoted moves
directly with the full-truck rate and the laden mileage, neither of which has a source
better than the brief's own worked example today.
"""

from core.domain.provenance import Provenance, Tagged

DIESEL_PRICE_PER_L = Tagged(
    97.83,
    Provenance.REAL,
    "Mumbai retail, Sep 2026 (The Core). Nashik district differs; verify before pitch.",
)

SCV_MILEAGE_KMPL_LADEN = Tagged(
    10.0,
    Provenance.MODELED,
    "brief assumes 12 km/L; laden pickups on mixed rural surface typically run lower",
)

TRUCK_CAPACITY_KG = Tagged(
    1500.0,
    Provenance.REAL,
    "Mahindra Bolero Pickup rated payload",
)

FULL_TRUCK_FARE_PER_KM = Tagged(
    50.0,
    Provenance.MODELED,
    "derived from the brief's unsourced ~Rs2000 / ~40 km example; Phase 0 must replace",
)

PLATFORM_FEE_PCT = Tagged(
    0.08,
    Provenance.MODELED,
    "brief proposes 8-10%, to be validated",
)

HANDLING_PER_STOP = Tagged(
    25.0,
    Provenance.MODELED,
    "loading time and driver effort per pickup; no source yet",
)

CO2_KG_PER_L_DIESEL = Tagged(
    2.68,
    Provenance.REAL,
    "standard diesel emission factor",
)


def diesel_cost(km: float) -> float:
    return km / SCV_MILEAGE_KMPL_LADEN.value * DIESEL_PRICE_PER_L.value


def co2_kg(km: float) -> float:
    return km / SCV_MILEAGE_KMPL_LADEN.value * CO2_KG_PER_L_DIESEL.value
