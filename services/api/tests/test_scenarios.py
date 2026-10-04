"""The narratives must match what the engine actually does.

Each scenario's prose asserts an outcome. If the engine's answer drifts -- a parameter
changes, the matcher improves -- the prose silently becomes a false claim. These tests
pin the claims to the computation.
"""

from pathlib import Path

import pytest

from core.geo.graph import load as load_graph
from core.geo.index import load_index
from core.matching.pool import PoolPolicy
from twin.scenarios import SCENARIOS, run_scenario

DERIVED = Path(__file__).resolve().parents[3] / "data" / "derived" / "nashik"

pytestmark = pytest.mark.skipif(
    not (DERIVED / "matrix.npz").exists(), reason="corridor not built"
)

FAST = PoolPolicy(solver_ms=400)


@pytest.fixture(scope="module")
def ctx():
    return load_index(DERIVED, "pimpalgaon", "nashik_apmc"), load_graph(DERIVED)


def _run(ctx, key):
    idx, graph = ctx
    spec = next(s for s in SCENARIOS if s.key == key)
    return run_scenario(spec, idx, graph, policy=FAST)


def test_forty_kg_alone_is_refused_on_economics(ctx):
    """The headline scenario. Spare capacity alone does not justify a detour."""
    r = _run(ctx, "forty_kg_alone")
    assert r.facts["served"] == 0
    assert len(r.unserved) == 1
    u = r.unserved[0]
    assert u["reason"] == "economics"
    assert u["diesel_cost"] > u["revenue"]


def test_same_lot_rides_free_once_a_neighbour_justifies_the_branch(ctx):
    r = _run(ctx, "forty_kg_shared")
    assert r.facts["served"] == 2
    assert not r.unserved
    sunita = next(s for t in r.trips for s in t.stops if s.name == "Sunita")
    assert sunita.load_kg == 40
    assert sunita.shares_branch
    # Same 40 kg that was refused outright is now a fraction of a whole-truck hire.
    assert sunita.fare < r.facts["full_truck_fare"] * 0.15


def test_isolated_village_is_refused(ctx):
    r = _run(ctx, "isolated")
    assert r.facts["served"] == 0
    assert r.unserved[0]["reason"] in {"economics", "capacity"}


def test_capacity_refusal_is_not_labelled_economic(ctx):
    """A profitable lot with nowhere to sit must say so, not blame the economics."""
    r = _run(ctx, "capacity")
    assert r.facts["served"] == 0
    u = r.unserved[0]
    assert u["reason"] == "capacity"
    assert u["revenue"] > u["diesel_cost"], "this lot would have paid comfortably"


def test_full_branch_run_serves_everyone(ctx):
    r = _run(ctx, "milk_run")
    assert r.facts["served"] == 3
    assert not r.unserved
    assert r.facts["detour_km"] > 0


def test_every_scenario_reports_a_route_that_can_be_drawn(ctx):
    for spec in SCENARIOS:
        r = _run(ctx, spec.key)
        for t in r.trips:
            assert len(t.polyline) >= 2
            assert len(t.cum_km) == len(t.polyline)
            assert t.cum_km[-1] > 0
        for u in r.unserved:
            assert len(u["polyline"]) >= 2
