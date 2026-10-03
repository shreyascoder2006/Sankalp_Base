from pathlib import Path

import pytest

from core.geo.index import load_index
from core.matching.candidates import Lot, MatchPolicy, fill, rank

DERIVED = Path(__file__).resolve().parents[3] / "data" / "derived" / "nashik"

pytestmark = pytest.mark.skipif(
    not (DERIVED / "matrix.npz").exists(),
    reason="corridor matrix not built; run scripts/build_branches.py",
)


@pytest.fixture(scope="module")
def idx():
    return load_index(DERIVED, "pimpalgaon", "nashik_apmc")


def _lots_for(idx, names, kg=200.0):
    out = []
    for n in names:
        row = idx.branches[idx.branches.name == n].iloc[0]
        out.append(Lot(f"lot-{n}", row.key, "onion", kg))
    return out


def test_second_lot_on_a_shared_branch_ranks_as_near_free(idx):
    """Mohadi and Sakore share a branch; once one is accepted the other is cheap."""
    lots = _lots_for(idx, ["Mohadi", "Sakore"])
    first = idx.point_index[lots[0].point_key]

    ranked = rank(
        idx.matrix, idx.origin, idx.dest, (first,), [lots[1]],
        idx.point_index, idx.branch_of, spare_kg=1000,
    )
    assert len(ranked) == 1
    assert ranked[0].marginal_km < 1.0
    assert ranked[0].shares_branch


def test_capacity_is_respected(idx):
    lots = _lots_for(idx, ["Mohadi", "Sakore"], kg=900.0)
    accepted, taken = fill(
        idx.matrix, idx.origin, idx.dest, lots,
        idx.point_index, idx.branch_of, spare_kg=1000.0,
    )
    assert len(taken) == 1
    assert sum(t.weight_kg for t in taken) <= 1000.0


def test_isolated_villages_are_rejected_under_marginal_cap(idx):
    """A village with no shared branch costs far more than the marginal budget."""
    lots = _lots_for(idx, ["Bhuse"])
    ranked = rank(
        idx.matrix, idx.origin, idx.dest, (), lots,
        idx.point_index, idx.branch_of, spare_kg=1000,
        policy=MatchPolicy(max_branch_entry_km=15.0),
    )
    assert ranked == []


def test_stop_cap_is_enforced(idx):
    names = idx.branches.name.head(8).tolist()
    accepted, taken = fill(
        idx.matrix, idx.origin, idx.dest, _lots_for(idx, names, kg=50.0),
        idx.point_index, idx.branch_of, spare_kg=1500.0,
        policy=MatchPolicy(max_branch_entry_km=40.0, max_marginal_km=40.0, max_stops=3),
    )
    assert len(accepted) <= 3
