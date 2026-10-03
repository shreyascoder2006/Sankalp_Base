"""Live-preferring, simulation-fallback state access.

The whole upgrade path runs through this module. Today every truck state is invented;
once drivers are onboarded, a real declared trip or location ping answers instead, and
nothing in the matching engine changes or needs to know. A reading always says which it
was, so a number derived from real trips is never presented as though it were modelled,
or the reverse.
"""

from dataclasses import dataclass
from typing import Protocol

from core.domain.provenance import Provenance


@dataclass(frozen=True)
class TruckState:
    truck_id: str
    origin_key: str
    dest_key: str
    laden_kg: float
    capacity_kg: float
    depart_hour: float
    provenance: Provenance

    @property
    def spare_kg(self) -> float:
        return max(0.0, self.capacity_kg - self.laden_kg)


class TruckStateSource(Protocol):
    def states_for_day(self, day: int) -> list[TruckState]: ...


class LivePreferringSource:
    """Returns real declared trips where they exist, simulated ones otherwise."""

    def __init__(self, simulated: TruckStateSource, live: TruckStateSource | None = None):
        self._simulated = simulated
        self._live = live

    def states_for_day(self, day: int) -> list[TruckState]:
        real = list(self._live.states_for_day(day)) if self._live else []
        if not real:
            return self._simulated.states_for_day(day)

        covered = {s.truck_id for s in real}
        topped_up = [s for s in self._simulated.states_for_day(day) if s.truck_id not in covered]
        return real + topped_up

    @property
    def has_live_data(self) -> bool:
        return self._live is not None
