from pathlib import Path

import pandas as pd
import pytest

DERIVED = Path(__file__).resolve().parents[3] / "data" / "derived" / "nashik"

pytestmark = pytest.mark.skipif(
    not (DERIVED / "branches.parquet").exists(),
    reason="branches not built; run scripts/build_branches.py",
)


@pytest.fixture(scope="module")
def branches():
    return pd.read_parquet(DERIVED / "branches.parquet")


def test_every_settlement_has_exactly_one_branch(branches):
    assert branches.key.is_unique
    assert branches.branch_id.notna().all()


def test_mohadi_and_sakore_share_a_branch(branches):
    pair = branches[branches.name.isin(["Mohadi", "Sakore"])]
    assert len(pair) == 2
    assert pair.branch_id.nunique() == 1, "the measured shareable pair must cluster"

    b = pair.iloc[0]
    per_extra = (b.branch_full_km - b.branch_entry_km) / (b.branch_size - 1)
    assert per_extra < 1.0


def test_shareable_branches_are_the_exception(branches):
    """Guards the headline claim: most settlements have no cheap pooling partner.

    If a gazetteer change makes sharing common, the recruitment story changes with
    it and this test should be revisited deliberately, not silently.
    """
    sizes = branches.groupby("branch_id").size()
    shareable = (sizes > 1).sum()
    assert shareable < len(sizes) / 2


def test_duplicate_village_names_stay_distinct(branches):
    """Two real villages share the name Lakhalgaon; they must not be merged."""
    dupes = branches[branches.name.duplicated(keep=False)]
    if not dupes.empty:
        assert dupes.key.is_unique
