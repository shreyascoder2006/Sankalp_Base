from dataclasses import dataclass
from enum import Enum
from typing import Generic, TypeVar


class Provenance(str, Enum):
    """Where a value came from. Every number surfaced to a user carries one."""

    REAL = "REAL"  # measured or published by an external source
    MODELED = "MODELED"  # derived from a cited distribution or formula
    SIMULATED = "SIMULATED"  # invented by the simulator; no real-world referent

    def weakest(self, other: "Provenance") -> "Provenance":
        order = [Provenance.REAL, Provenance.MODELED, Provenance.SIMULATED]
        return max(self, other, key=order.index)


T = TypeVar("T")


@dataclass(frozen=True)
class Tagged(Generic[T]):
    value: T
    provenance: Provenance
    source: str

    def map(self, fn) -> "Tagged":
        return Tagged(fn(self.value), self.provenance, self.source)


def combine(*tagged: Tagged) -> Provenance:
    """A derived value is only as well-evidenced as its weakest input."""
    p = Provenance.REAL
    for t in tagged:
        p = p.weakest(t.provenance)
    return p
