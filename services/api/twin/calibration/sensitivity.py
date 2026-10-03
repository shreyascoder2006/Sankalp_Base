"""Parameter sweeps.

The point of these is not to predict a fill rate. It is to answer what a given fill
rate would *require*, so a target can be stated as a derived threshold with its
assumptions attached rather than asserted.
"""

from dataclasses import dataclass

from core.geo.index import CorridorIndex
from core.matching.pool import PoolPolicy
from twin.engine.tick import run_day
from twin.world.seed import build_world


@dataclass(frozen=True)
class SweepPoint:
    farmers: int
    trucks: int
    days: int
    match_rate: float
    forward_fill_rate: float
    mean_detour_km: float
    revenue: float


def sweep(
    corridor: CorridorIndex,
    farmer_counts: list[int],
    truck_counts: list[int],
    days: int = 5,
    seed: int = 7,
    solver_seconds: int = 1,
) -> list[SweepPoint]:
    policy = PoolPolicy(solver_seconds=solver_seconds)
    out = []
    for farmers in farmer_counts:
        for trucks in truck_counts:
            world = build_world(corridor, n_farmers=farmers, n_trucks=trucks, seed=seed)
            offered = served = running = pooled = 0
            detour = revenue = 0.0
            for day in range(days):
                r = run_day(world, day, policy=policy)
                offered += r.lots_offered
                served += r.lots_served
                running += r.trucks_running
                pooled += len(r.trips)
                detour += r.detour_km
                revenue += r.revenue
            out.append(
                SweepPoint(
                    farmers=farmers,
                    trucks=trucks,
                    days=days,
                    match_rate=served / offered if offered else 0.0,
                    forward_fill_rate=pooled / running if running else 0.0,
                    mean_detour_km=detour / pooled if pooled else 0.0,
                    revenue=revenue,
                )
            )
    return out


def threshold_for_fill(points: list[SweepPoint], target: float) -> list[SweepPoint]:
    """The cheapest configurations that reach a given forward fill rate."""
    hits = [p for p in points if p.forward_fill_rate >= target]
    return sorted(hits, key=lambda p: (p.farmers / max(p.trucks, 1), p.farmers))
