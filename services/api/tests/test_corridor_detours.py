"""Phase 2 gate: the graph must reproduce detours measured against live OSRM.

If these drift, the graph has stopped describing the real road network and every
downstream number — fares, fill rates, CO2 — is describing something else.
"""

from pathlib import Path

import pandas as pd
import pytest

from core.geo.corridor import CORRIDORS
from core.geo.graph import load

DERIVED = Path(__file__).resolve().parents[3] / "data" / "derived" / "nashik"

pytestmark = pytest.mark.skipif(
    not (DERIVED / "edges.parquet").exists(),
    reason="corridor not built; run scripts/build_corridor.py then scripts/build_graph.py",
)

OSRM_REFERENCE_KM = {
    (): 30.1,
    ("Sakore",): 38.9,
    ("Mohadi",): 38.6,
    ("Korhate",): 47.5,
    ("Sakore", "Mohadi"): 38.9,
}


@pytest.fixture(scope="module")
def corridor_graph():
    g = load(DERIVED)
    places = pd.read_parquet(DERIVED / "places.parquet")
    return g, places, CORRIDORS["nashik"]


def _route_km(g, places, corridor, stops):
    def coords(name):
        row = places[places.name == name]
        return float(row.iloc[0].lon), float(row.iloc[0].lat)

    pts = [(corridor.origin.lon, corridor.origin.lat)]
    pts += [coords(n) for n in stops]
    pts.append((corridor.destination.lon, corridor.destination.lat))

    km = 0.0
    for a, b in zip(pts[:-1], pts[1:]):
        r = g.route(g.snap(*a)[0], g.snap(*b)[0])
        assert r.reachable, f"unreachable leg {a} -> {b}"
        km += r.distance_m / 1000.0
    return km


@pytest.mark.parametrize("stops,osrm_km", list(OSRM_REFERENCE_KM.items()))
def test_matches_osrm_within_tolerance(corridor_graph, stops, osrm_km):
    g, places, corridor = corridor_graph
    km = _route_km(g, places, corridor, stops)
    assert km == pytest.approx(osrm_km, rel=0.20)


def test_second_stop_on_same_branch_is_free(corridor_graph):
    """The core product finding: branch sharing, not proximity, drives pooling."""
    g, places, corridor = corridor_graph
    base = _route_km(g, places, corridor, ())
    solo = _route_km(g, places, corridor, ("Sakore",)) - base
    chained = _route_km(g, places, corridor, ("Sakore", "Mohadi")) - base

    assert solo > 5.0, "leaving the trunk road should carry a real fixed cost"
    assert chained - solo < 1.0, "a second stop on the same branch must be near-free"


def test_scv_profile_is_slower_than_a_car(corridor_graph):
    g, _, corridor = corridor_graph
    r = g.route(
        g.snap(corridor.origin.lon, corridor.origin.lat)[0],
        g.snap(corridor.destination.lon, corridor.destination.lat)[0],
    )
    avg_kmh = (r.distance_m / 1000.0) / (r.time_min / 60.0)
    assert 25.0 < avg_kmh < 55.0, f"implausible laden SCV average: {avg_kmh:.0f} km/h"
