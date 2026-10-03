from pathlib import Path

import pytest

from core.geo.index import load_index
from twin.calibration.sensitivity import sweep, threshold_for_fill

DERIVED = Path(__file__).resolve().parents[3] / "data" / "derived" / "nashik"

pytestmark = pytest.mark.skipif(
    not (DERIVED / "matrix.npz").exists(), reason="corridor matrix not built"
)


@pytest.fixture(scope="module")
def points():
    idx = load_index(DERIVED, "pimpalgaon", "nashik_apmc")
    return sweep(idx, [100, 400], [15, 60], days=1, solver_seconds=1)


def test_fill_and_match_pull_in_opposite_directions(points):
    """The brief targets 50%+ return-leg fill AND 1,500 farmers served.

    These compete. Scarce trucks fill well but leave farmers unserved; plentiful
    trucks serve everyone but mostly run without a pooled load. Any plan quoting both
    targets has to say which it is optimising, so this relationship is pinned here.
    """
    scarce = next(p for p in points if p.farmers == 400 and p.trucks == 15)
    plentiful = next(p for p in points if p.farmers == 100 and p.trucks == 60)

    assert scarce.forward_fill_rate > plentiful.forward_fill_rate
    assert scarce.match_rate < plentiful.match_rate


def test_fill_rate_rises_with_farmers_per_truck(points):
    by_ratio = sorted(points, key=lambda p: p.farmers / p.trucks)
    assert by_ratio[0].forward_fill_rate <= by_ratio[-1].forward_fill_rate


def test_threshold_helper_returns_only_qualifying_points(points):
    for p in threshold_for_fill(points, 0.3):
        assert p.forward_fill_rate >= 0.3
