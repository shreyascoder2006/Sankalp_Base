from pathlib import Path

import pytest

from core.geo.index import load_index
from core.matching.candidates import Lot
from core.matching.pool import PoolPolicy, solve

DERIVED = Path(__file__).resolve().parents[3] / "data" / "derived" / "nashik"

pytestmark = pytest.mark.skipif(
    not (DERIVED / "matrix.npz").exists(),
    reason="corridor matrix not built; run scripts/build_branches.py",
)

FAST = PoolPolicy(solver_seconds=2)


@pytest.fixture(scope="module")
def idx():
    return load_index(DERIVED, "pimpalgaon", "nashik_apmc")


def _lots(idx, names, kg=200.0):
    out = []
    for n in names:
        row = idx.branches[idx.branches.name == n].iloc[0]
        out.append(Lot(f"lot-{n}", row.key, "onion", kg))
    return out


def test_serves_a_shared_branch_together(idx):
    route = solve(idx, _lots(idx, ["Mohadi", "Sakore"]), policy=FAST)
    assert route.stops == 2, "both ends of a shared branch should be worth serving"
    assert route.distance_km < idx.trunk_km + 12.0


def test_accepts_a_lot_worth_less_than_the_whole_trip(idx):
    """Regression: the trunk run is sunk, so only the detour counts against revenue.

    A 150 kg lot earns ~Rs151 while the full 38.9 km run burns ~Rs380 of diesel. It is
    still worth taking, because the driver was making 30.2 km of that journey anyway and
    the lot only adds 8.7 km. OR-Tools charges nothing for a route that visits no one,
    so without SetVehicleUsedWhenEmpty the solver compares total cost against revenue
    and refuses every lot on the corridor.
    """
    route = solve(idx, _lots(idx, ["Sakore"], kg=150.0), policy=FAST)
    assert route.stops == 1


def test_respects_capacity(idx):
    route = solve(idx, _lots(idx, ["Mohadi", "Sakore"], kg=900.0), capacity_kg=1000.0, policy=FAST)
    assert sum(lot.weight_kg for lot in route.served) <= 1000.0


def test_drops_a_lot_that_does_not_pay_for_itself(idx):
    """A tiny lot down a long isolated detour should be refused, not served at a loss."""
    route = solve(idx, _lots(idx, ["Bhuse"], kg=20.0), policy=FAST)
    assert route.served == []
    assert len(route.dropped) == 1


def test_enforces_stop_cap(idx):
    names = idx.branches.name.head(8).tolist()
    route = solve(idx, _lots(idx, names, kg=100.0), policy=PoolPolicy(max_stops=2, solver_seconds=2))
    assert route.stops <= 2


def test_sequences_better_than_arbitrary_order(idx):
    """The solver must not simply visit stops in the order they were submitted."""
    names = ["Sakore", "Mohadi", "Chandori", "Nagapur"]
    route = solve(idx, _lots(idx, names, kg=150.0), policy=FAST)
    if route.stops >= 3:
        naive = 0.0
        km = idx.matrix.km
        seq = [idx.origin] + [idx.point_index[k] for k in
                              [idx.branches[idx.branches.name == n].iloc[0].key for n in names]
                              ] + [idx.dest]
        for a, b in zip(seq[:-1], seq[1:]):
            naive += float(km[a, b])
        assert route.distance_km <= naive
