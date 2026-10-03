from pathlib import Path

import pytest

from core.geo.index import load_index
from core.matching.pool import PoolPolicy
from twin.engine.sources import LivePreferringSource, TruckState
from twin.engine.tick import run_day
from twin.world import distributions as dist
from twin.world.seed import build_world
from core.domain.provenance import Provenance

DERIVED = Path(__file__).resolve().parents[3] / "data" / "derived" / "nashik"

pytestmark = pytest.mark.skipif(
    not (DERIVED / "matrix.npz").exists(),
    reason="corridor matrix not built; run scripts/build_branches.py",
)

FAST = PoolPolicy(solver_seconds=1)


@pytest.fixture(scope="module")
def idx():
    return load_index(DERIVED, "pimpalgaon", "nashik_apmc")


def test_same_seed_reproduces_the_same_day(idx):
    a = run_day(build_world(idx, 120, 20, seed=42), 3, policy=FAST)
    b = run_day(build_world(idx, 120, 20, seed=42), 3, policy=FAST)
    assert (a.lots_offered, a.lots_served, round(a.detour_km, 3)) == (
        b.lots_offered,
        b.lots_served,
        round(b.detour_km, 3),
    )


def test_different_seeds_diverge(idx):
    a = run_day(build_world(idx, 120, 20, seed=1), 3, policy=FAST)
    b = run_day(build_world(idx, 120, 20, seed=2), 3, policy=FAST)
    assert (a.lots_offered, a.kg_offered) != (b.lots_offered, b.kg_offered)


def test_no_lot_is_served_twice(idx):
    result = run_day(build_world(idx, 200, 30, seed=5), 1, policy=FAST)
    assert result.lots_served <= result.lots_offered
    assert sum(t.stops for t in result.trips) == result.lots_served


def test_trip_capacity_is_never_exceeded(idx):
    world = build_world(idx, 200, 30, seed=5)
    result = run_day(world, 1, policy=FAST)
    for trip in result.trips:
        assert trip.served_kg <= world.trucks[0].capacity_kg


def test_detour_is_never_materially_negative(idx):
    """A pooled route may be a shade shorter in km than the truck's direct run.

    Routing minimises time and distance is summed along the chosen path, so the direct
    run is the fastest route, not the shortest one. Dropping through a village can
    therefore shave a few metres while costing minutes -- real behaviour, not an error.
    Observed worst case is about -0.05 km; anything beyond -1 km means the matrix and
    the route have stopped agreeing and should be investigated.
    """
    result = run_day(build_world(idx, 200, 30, seed=11), 2, policy=FAST)
    for trip in result.trips:
        assert trip.detour_km > -1.0


def test_live_source_takes_precedence_over_simulation(idx):
    class Sim:
        def states_for_day(self, day):
            return [
                TruckState("t000", "x", "y", 100, 1500, 5.0, Provenance.SIMULATED),
                TruckState("t001", "x", "y", 100, 1500, 5.0, Provenance.SIMULATED),
            ]

    class Live:
        def states_for_day(self, day):
            return [TruckState("t000", "x", "y", 900, 1500, 6.0, Provenance.REAL)]

    merged = LivePreferringSource(Sim(), Live()).states_for_day(0)
    by_id = {s.truck_id: s for s in merged}
    assert by_id["t000"].provenance is Provenance.REAL
    assert by_id["t000"].laden_kg == 900
    assert by_id["t001"].provenance is Provenance.SIMULATED


def test_simulated_parameters_are_labelled_as_such(idx):
    """Nothing invented may masquerade as measured."""
    assert dist.LANDHOLDING_CLASSES.provenance is Provenance.REAL
    for tagged in (dist.LOT_KG_MEDIAN, dist.LOT_KG_SIGMA, dist.OFFER_PROBABILITY):
        assert tagged.provenance is Provenance.SIMULATED
        assert tagged.source
