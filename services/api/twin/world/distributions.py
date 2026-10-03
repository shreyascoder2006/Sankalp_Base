"""Population distributions for the simulated corridor.

Landholding is REAL — the Agriculture Census size-class breakdown, which is also where
the brief's "86% under 2 ha" figure comes from. Everything downstream of it is not.

Marketable lot size is deliberately *not* derived bottom-up from yields and harvest
schedules: that would chain three unsourced assumptions together and present the result
as though it followed from the census. It is a fitted parameter instead, tagged
SIMULATED, and Phase 4 calibrates it against real Agmarknet arrival volumes.
"""

import numpy as np

from core.domain.provenance import Provenance, Tagged

# Agriculture Census 2015-16, all-India. share of holdings, mean size in hectares.
LANDHOLDING_CLASSES = Tagged(
    (
        ("marginal", 0.685, 0.38),
        ("small", 0.177, 1.41),
        ("semi_medium", 0.094, 2.71),
        ("medium", 0.038, 5.76),
        ("large", 0.006, 17.38),
    ),
    Provenance.REAL,
    "Agriculture Census 2015-16; all-India, not Nashik district specific",
)

LOT_KG_MEDIAN = Tagged(
    200.0,
    Provenance.SIMULATED,
    "fitted parameter; calibrate against Agmarknet arrivals in Phase 4",
)

LOT_KG_SIGMA = Tagged(
    0.55,
    Provenance.SIMULATED,
    "lognormal spread of marketable lot size; uncalibrated",
)

OFFER_PROBABILITY = Tagged(
    0.06,
    Provenance.SIMULATED,
    "chance a given farmer has a lot ready on a given day; uncalibrated",
)


def sample_holding_ha(rng: np.random.Generator, n: int) -> np.ndarray:
    classes = LANDHOLDING_CLASSES.value
    shares = np.array([c[1] for c in classes])
    means = np.array([c[2] for c in classes])
    picks = rng.choice(len(classes), size=n, p=shares / shares.sum())
    # Spread within a class so every holding in it is not identical.
    return means[picks] * rng.lognormal(mean=0.0, sigma=0.25, size=n)


def sample_lot_kg(rng: np.random.Generator, holding_ha: np.ndarray) -> np.ndarray:
    """Larger holdings ship larger lots, with heavy spread."""
    scale = (holding_ha / 0.38) ** 0.45
    lots = LOT_KG_MEDIAN.value * scale * rng.lognormal(0.0, LOT_KG_SIGMA.value, len(holding_ha))
    return np.clip(lots, 40.0, 1400.0)
