import pytest

from core.pricing import economics as econ
from core.pricing.fare import brief_quote, full_truck_fare, quote

TRUNK_KM = 30.2  # measured corridor run
ENTRY_KM = 8.5  # measured cost of leaving the trunk for the Mohadi/Sakore branch


def test_solo_detour_costs_more_than_the_briefs_flat_charge():
    """A single pickup here burns ~Rs83 of diesel; the brief charges a flat Rs50."""
    assert econ.diesel_cost(ENTRY_KM) == pytest.approx(83.2, abs=1.0)


def test_sharing_a_branch_cuts_the_entry_cost_per_farmer():
    solo = quote(200, TRUNK_KM, ENTRY_KM, branch_shared_by=1, marginal_km=0.0)
    shared = quote(200, TRUNK_KM, ENTRY_KM, branch_shared_by=3, marginal_km=0.25)

    assert shared.branch_entry_share < solo.branch_entry_share / 2
    assert shared.total < solo.total


def test_pooled_fare_beats_hiring_the_whole_truck():
    full = full_truck_fare(TRUNK_KM)
    pooled = quote(200, TRUNK_KM, ENTRY_KM, branch_shared_by=2, marginal_km=0.25)
    assert pooled.total < full * 0.5, "a 200 kg lot must not approach a full-truck hire"


def test_small_lots_benefit_most():
    """Pooling savings shrink as the lot approaches a full truck load."""
    full = full_truck_fare(TRUNK_KM)

    def saving(kg):
        q = quote(kg, TRUNK_KM, ENTRY_KM, branch_shared_by=3, marginal_km=0.25)
        return (full - q.total) / full

    assert saving(100) > saving(500) > saving(1000)
    assert saving(1000) < 0.5, "a 1000 kg lot is two-thirds of a truck; saving is modest"


def test_brief_flat_charge_undercovers_a_solo_pickup():
    """The headline correction.

    The brief's flat Rs50 detour charge implicitly assumes a branch is shared about
    three ways. On this corridor only 3 of 15 branches support sharing at all, so the
    common booking is solo -- and a solo booking under-recovers by ~23%.
    """
    theirs = brief_quote(200, full_truck_fare(TRUNK_KM))
    solo = quote(200, TRUNK_KM, ENTRY_KM, branch_shared_by=1, marginal_km=0.0)
    assert solo.total > theirs * 1.15


def test_brief_charge_converges_once_a_branch_is_shared():
    theirs = brief_quote(200, full_truck_fare(TRUNK_KM))
    shared = quote(200, TRUNK_KM, ENTRY_KM, branch_shared_by=3, marginal_km=0.25)
    assert abs(shared.total - theirs) / theirs < 0.05


def test_rejects_overloaded_and_degenerate_input():
    with pytest.raises(ValueError):
        quote(2000, TRUNK_KM, ENTRY_KM, 1, 0.0)
    with pytest.raises(ValueError):
        quote(0, TRUNK_KM, ENTRY_KM, 1, 0.0)
    with pytest.raises(ValueError):
        quote(200, TRUNK_KM, ENTRY_KM, 0, 0.0)


def test_every_economic_constant_declares_provenance():
    for name in (
        "DIESEL_PRICE_PER_L",
        "SCV_MILEAGE_KMPL_LADEN",
        "TRUCK_CAPACITY_KG",
        "FULL_TRUCK_FARE_PER_KM",
        "PLATFORM_FEE_PCT",
        "HANDLING_PER_STOP",
    ):
        tagged = getattr(econ, name)
        assert tagged.provenance is not None
        assert tagged.source, f"{name} must cite a source"
