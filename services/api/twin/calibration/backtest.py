"""Calibrate the harvest model against observed mandi arrivals.

This is the credibility artefact: it is what distinguishes a simulation that reproduces
a real arrival curve from one that merely looks plausible. It deliberately cannot run
without observed data, and has no synthetic fallback -- a backtest against invented
numbers would validate nothing while appearing to validate everything.

Expected input: a CSV at data/raw/arrivals_<corridor>.csv with columns

    date,arrivals_tonnes

one row per day for the market being modelled. Agmarknet publishes exactly this, but
its API was unreachable from the build environment (see docs/DATA.md), so the file has
to be supplied by hand for now.
"""

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

from core.geo.index import CorridorIndex
from core.matching.pool import PoolPolicy
from twin.agents.farmer import lots_for_day
from twin.world import distributions as dist
from twin.world.seed import build_world


class NoObservedData(RuntimeError):
    pass


@dataclass(frozen=True)
class Fit:
    offer_probability: float
    lot_kg_median: float
    rmse_tonnes: float
    mape: float
    observed_mean: float
    simulated_mean: float
    days: int

    @property
    def within_band(self) -> bool:
        return self.mape < 0.25


def load_observed(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise NoObservedData(
            f"no observed arrivals at {path}. Supply a CSV with columns "
            "date,arrivals_tonnes before calibration can mean anything."
        )
    df = pd.read_csv(path, parse_dates=["date"]).sort_values("date")
    if "arrivals_tonnes" not in df.columns:
        raise NoObservedData("CSV must contain an 'arrivals_tonnes' column")
    return df.reset_index(drop=True)


def simulate_arrivals(
    corridor: CorridorIndex,
    days: int,
    n_farmers: int,
    offer_probability: float,
    lot_kg_median: float,
    seed: int = 7,
) -> np.ndarray:
    """Tonnes offered per day. Measures harvest supply, not matching throughput."""
    original = (dist.OFFER_PROBABILITY.value, dist.LOT_KG_MEDIAN.value)
    try:
        dist.OFFER_PROBABILITY = dist.OFFER_PROBABILITY.__class__(
            offer_probability, dist.OFFER_PROBABILITY.provenance, dist.OFFER_PROBABILITY.source
        )
        dist.LOT_KG_MEDIAN = dist.LOT_KG_MEDIAN.__class__(
            lot_kg_median, dist.LOT_KG_MEDIAN.provenance, dist.LOT_KG_MEDIAN.source
        )
        world = build_world(corridor, n_farmers=n_farmers, n_trucks=1, seed=seed)
        return np.array(
            [sum(lot.weight_kg for lot in lots_for_day(world, d)) / 1000.0 for d in range(days)]
        )
    finally:
        dist.OFFER_PROBABILITY = dist.OFFER_PROBABILITY.__class__(
            original[0], dist.OFFER_PROBABILITY.provenance, dist.OFFER_PROBABILITY.source
        )
        dist.LOT_KG_MEDIAN = dist.LOT_KG_MEDIAN.__class__(
            original[1], dist.LOT_KG_MEDIAN.provenance, dist.LOT_KG_MEDIAN.source
        )


def fit(
    corridor: CorridorIndex,
    observed: pd.DataFrame,
    n_farmers: int = 2000,
    offer_grid: tuple[float, ...] = (0.02, 0.04, 0.06, 0.09, 0.13, 0.18, 0.25),
    lot_grid: tuple[float, ...] = (120.0, 200.0, 320.0, 500.0),
    seed: int = 7,
) -> Fit:
    target = observed["arrivals_tonnes"].to_numpy(dtype=float)
    days = len(target)
    if days < 7:
        raise NoObservedData("need at least a week of observed arrivals to fit anything")

    best: Fit | None = None
    for p in offer_grid:
        for lot in lot_grid:
            sim = simulate_arrivals(corridor, days, n_farmers, p, lot, seed)
            rmse = float(np.sqrt(np.mean((sim - target) ** 2)))
            mape = float(np.mean(np.abs(sim - target) / np.maximum(target, 1e-6)))
            cand = Fit(p, lot, rmse, mape, float(target.mean()), float(sim.mean()), days)
            if best is None or cand.rmse_tonnes < best.rmse_tonnes:
                best = cand
    assert best is not None
    return best
