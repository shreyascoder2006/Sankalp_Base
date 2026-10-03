"""Speed profile for small commercial vehicles (Bolero Pickup class).

Every number here is MODELED and pending replacement by Phase 0 driver interviews.
OSRM's default car profile returns ~72 km/h on the Pimpalgaon-Nashik trunk run, which
is not achievable by a loaded SCV; these values exist so durations are defensible.
"""

from core.domain.provenance import Provenance

PROVENANCE = Provenance.MODELED
SOURCE = "modeled pending driver interviews (Phase 0)"

# km/h, laden, on paved surface
BASE_SPEED_KMH = {
    "motorway": 60.0,
    "motorway_link": 40.0,
    "trunk": 50.0,
    "trunk_link": 35.0,
    "primary": 45.0,
    "primary_link": 32.0,
    "secondary": 40.0,
    "secondary_link": 30.0,
    "tertiary": 32.0,
    "tertiary_link": 25.0,
    "unclassified": 24.0,
    "residential": 20.0,
    "living_street": 12.0,
    "service": 15.0,
    "track": 12.0,
    "road": 24.0,
}

# Surfaces common on village approach roads.
SURFACE_FACTOR = {
    "asphalt": 1.0,
    "paved": 1.0,
    "concrete": 1.0,
    "compacted": 0.75,
    "gravel": 0.6,
    "unpaved": 0.55,
    "dirt": 0.45,
    "ground": 0.45,
    "sand": 0.35,
}

EMPTY_SPEED_FACTOR = 1.15
DEFAULT_SURFACE_FACTOR = 0.8  # untagged rural road: assume partly unpaved

# Highway classes an SCV may not legally or practically use.
EXCLUDED = {"footway", "path", "cycleway", "steps", "pedestrian", "bridleway", "corridor"}

# Fixed time cost of a loading stop, independent of distance.
STOP_SERVICE_MINUTES = 12.0


def edge_speed_kmh(tags: dict, laden: bool = True) -> float | None:
    highway = tags.get("highway")
    if highway in EXCLUDED or highway not in BASE_SPEED_KMH:
        return None
    if tags.get("motor_vehicle") == "no" or tags.get("access") == "private":
        return None

    speed = BASE_SPEED_KMH[highway]
    surface = tags.get("surface")
    speed *= SURFACE_FACTOR.get(surface, DEFAULT_SURFACE_FACTOR if surface is None else 0.7)
    if not laden:
        speed *= EMPTY_SPEED_FACTOR
    if tags.get("smoothness") in {"bad", "very_bad", "horrible"}:
        speed *= 0.7
    return max(speed, 6.0)
