"""Which pending lots a truck can economically pick up.

The brief filters on an absolute detour cap of ~5 km. On this corridor that rejects
every village -- the cheapest is 8.5 km off the trunk -- so the filter here is the
marginal cost of adding a stop to the run the truck is already making. A lot on a
branch the truck already serves can pass even when its solo detour is large, which is
the whole basis of pooling.
"""

from dataclasses import dataclass

from core.geo.branches import Matrix, route_cost


@dataclass(frozen=True)
class Lot:
    lot_id: str
    point_key: str
    crop: str
    weight_kg: float


@dataclass(frozen=True)
class Candidate:
    lot: Lot
    marginal_km: float
    shares_branch: bool
    cumulative_km: float


@dataclass(frozen=True)
class MatchPolicy:
    """Opening a branch and extending one are different decisions.

    The first stop on a branch necessarily pays the whole entry cost -- 8.5 km on the
    cheapest branch of this corridor -- so a single uniform cap either rejects every
    lot or waves through expensive isolated ones. Budgets are therefore separate.
    """

    max_branch_entry_km: float = 15.0
    max_marginal_km: float = 3.0
    max_stops: int = 5
    max_route_km: float | None = None


def rank(
    m: Matrix,
    origin: int,
    dest: int,
    accepted: tuple[int, ...],
    lots: list[Lot],
    point_index: dict[str, int],
    branch_of: dict[str, int],
    spare_kg: float,
    policy: MatchPolicy = MatchPolicy(),
) -> list[Candidate]:
    """Rank feasible lots by the marginal cost of adding each to the current run."""
    if len(accepted) >= policy.max_stops:
        return []

    current = route_cost(m, origin, accepted, dest)
    accepted_branches = {
        branch_of[k] for k, i in point_index.items() if i in accepted and k in branch_of
    }

    out = []
    for lot in lots:
        if lot.weight_kg > spare_kg:
            continue
        idx = point_index.get(lot.point_key)
        if idx is None or idx in accepted:
            continue

        extended = route_cost(m, origin, (*accepted, idx), dest)
        marginal = extended - current
        shares = branch_of.get(lot.point_key) in accepted_branches
        budget = policy.max_marginal_km if shares else policy.max_branch_entry_km
        if marginal > budget:
            continue
        if policy.max_route_km is not None and extended > policy.max_route_km:
            continue

        out.append(
            Candidate(
                lot=lot,
                marginal_km=marginal,
                shares_branch=shares,
                cumulative_km=extended,
            )
        )

    out.sort(key=lambda c: (c.marginal_km / max(c.lot.weight_kg, 1.0), c.marginal_km))
    return out


def fill(
    m: Matrix,
    origin: int,
    dest: int,
    lots: list[Lot],
    point_index: dict[str, int],
    branch_of: dict[str, int],
    spare_kg: float,
    policy: MatchPolicy = MatchPolicy(),
) -> tuple[tuple[int, ...], list[Lot]]:
    """Greedily accept the cheapest marginal lot until capacity or policy stops us."""
    accepted: tuple[int, ...] = ()
    taken: list[Lot] = []
    remaining = list(lots)

    while len(accepted) < policy.max_stops and spare_kg > 0:
        ranked = rank(
            m, origin, dest, accepted, remaining, point_index, branch_of, spare_kg, policy
        )
        if not ranked:
            break
        best = ranked[0]
        accepted += (point_index[best.lot.point_key],)
        taken.append(best.lot)
        spare_kg -= best.lot.weight_kg
        remaining = [x for x in remaining if x.lot_id != best.lot.lot_id]

    return accepted, taken
