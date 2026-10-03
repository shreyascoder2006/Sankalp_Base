from pathlib import Path

import pytest

from core.domain.provenance import Provenance
from core.geo.index import load_index
from core.matching.pool import PoolPolicy
from twin.engine.cascade import STAGE_ORDER, detect, driver_margin
from twin.engine.tick import run_day
from twin.world.seed import build_world

DERIVED = Path(__file__).resolve().parents[3] / "data" / "derived" / "nashik"

pytestmark = pytest.mark.skipif(
    not (DERIVED / "matrix.npz").exists(), reason="corridor matrix not built"
)


@pytest.fixture(scope="module")
def day():
    idx = load_index(DERIVED, "pimpalgaon", "nashik_apmc")
    return run_day(build_world(idx, 200, 30, seed=3), 1, policy=PoolPolicy(solver_seconds=1)), idx


def test_reports_every_stage_in_order(day):
    result, idx = day
    c = detect(result, idx.trunk_km)
    assert [s.key for s in c.stages] == list(STAGE_ORDER)


def test_backhaul_is_excluded_not_scored_zero(day):
    """No public backhaul data exists, so the stage must not pretend to a number."""
    result, idx = day
    stage = detect(result, idx.trunk_km).stage("backhaul")
    assert stage.evidenced is False
    assert stage.provenance is Provenance.SIMULATED


def test_unevidenced_stages_do_not_drag_confidence(day):
    """Confidence is the weakest *evidenced* link, not the weakest link."""
    result, idx = day
    c = detect(result, idx.trunk_km)
    assert any(not s.evidenced for s in c.stages)
    evidenced = [s.provenance for s in c.stages if s.evidenced]
    assert c.confidence in evidenced


def test_live_trips_upgrade_the_supply_stage(day):
    result, idx = day
    sim = detect(result, idx.trunk_km, has_live_trips=False).stage("truck_supply")
    live = detect(result, idx.trunk_km, has_live_trips=True).stage("truck_supply")
    assert sim.provenance is Provenance.SIMULATED
    assert live.provenance is Provenance.REAL


def test_routing_stage_is_real(day):
    """Road distance is the one thing in the chain that is genuinely measured."""
    result, idx = day
    assert detect(result, idx.trunk_km).stage("routing").provenance is Provenance.REAL


def test_driver_margin_covers_the_detour_diesel(day):
    result, _ = day
    if result.trips:
        assert driver_margin(result) > 0
