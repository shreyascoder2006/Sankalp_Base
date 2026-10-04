import { useMemo, useState } from 'react'
import type { TwinData, DayRow } from '../scene/types'

interface AnalyticsPanelProps {
  data: TwinData
}

// Fallback days if scenarios.json had empty days
const DEFAULT_DAYS: DayRow[] = [
  { day: 0, lots_offered: 42, lots_served: 26, match_rate: 0.619, trucks_running: 14, trips: 17, forward_fill_rate: 0.382, detour_km: 38.4, revenue: 13850, co2_kg: 10.3 },
  { day: 1, lots_offered: 48, lots_served: 31, match_rate: 0.645, trucks_running: 16, trips: 19, forward_fill_rate: 0.415, detour_km: 44.2, revenue: 16420, co2_kg: 11.8 },
  { day: 2, lots_offered: 39, lots_served: 23, match_rate: 0.589, trucks_running: 13, trips: 15, forward_fill_rate: 0.347, detour_km: 34.6, revenue: 12100, co2_kg: 9.3 },
  { day: 3, lots_offered: 55, lots_served: 36, match_rate: 0.655, trucks_running: 18, trips: 22, forward_fill_rate: 0.442, detour_km: 52.8, revenue: 19280, co2_kg: 14.1 },
  { day: 4, lots_offered: 44, lots_served: 28, match_rate: 0.636, trucks_running: 15, trips: 18, forward_fill_rate: 0.398, detour_km: 41.5, revenue: 14960, co2_kg: 11.1 },
  { day: 5, lots_offered: 50, lots_served: 33, match_rate: 0.660, trucks_running: 17, trips: 20, forward_fill_rate: 0.428, detour_km: 47.9, revenue: 17820, co2_kg: 12.8 },
  { day: 6, lots_offered: 36, lots_served: 21, match_rate: 0.583, trucks_running: 12, trips: 14, forward_fill_rate: 0.329, detour_km: 30.2, revenue: 10950, co2_kg: 8.1 },
]

export default function AnalyticsPanel({ data }: AnalyticsPanelProps) {
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null)

  const days: DayRow[] = useMemo(() => {
    if (data.days && data.days.length > 0) return data.days
    return DEFAULT_DAYS
  }, [data.days])

  const totals = useMemo(() => {
    const totalOffered = days.reduce((sum, d) => sum + d.lots_offered, 0)
    const totalServed = days.reduce((sum, d) => sum + d.lots_served, 0)
    const totalRevenue = days.reduce((sum, d) => sum + d.revenue, 0)
    const totalCo2 = days.reduce((sum, d) => sum + d.co2_kg, 0)
    const totalDetour = days.reduce((sum, d) => sum + d.detour_km, 0)
    const avgMatch = totalOffered > 0 ? (totalServed / totalOffered) * 100 : 0
    const avgFill = (days.reduce((sum, d) => sum + d.forward_fill_rate, 0) / days.length) * 100

    return {
      totalOffered,
      totalServed,
      totalRevenue,
      totalCo2,
      totalDetour,
      avgMatch,
      avgFill,
    }
  }, [days])

  // SVG Chart Dimensions
  const chartW = 280
  const chartH = 80
  const pad = 16

  // Match rate bars
  const maxMatch = 1.0
  const barW = (chartW - pad * 2) / days.length - 6

  // Revenue curve
  const maxRev = Math.max(...days.map((d) => d.revenue), 1)
  const revPoints = days.map((d, i) => {
    const x = pad + (i / (days.length - 1)) * (chartW - pad * 2)
    const y = chartH - pad - (d.revenue / maxRev) * (chartH - pad * 2)
    return { x, y, rev: d.revenue }
  })
  const revPath = revPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  )
  const revArea = `${revPath} L ${revPoints[revPoints.length - 1].x} ${chartH - pad} L ${revPoints[0].x} ${chartH - pad} Z`

  return (
    <div className="analytics-panel">
      {/* Top Level Summary Cards */}
      <div className="analytics-grid">
        <div className="metric-card">
          <div className="metric-label">Match Rate</div>
          <div className="metric-val mono hi">{totals.avgMatch.toFixed(1)}%</div>
          <div className="metric-sub">{totals.totalServed} of {totals.totalOffered} lots</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg Fill Rate</div>
          <div className="metric-val mono">{totals.avgFill.toFixed(1)}%</div>
          <div className="metric-sub">forward direction</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Weekly Rev</div>
          <div className="metric-val mono hi">₹{(totals.totalRevenue / 1000).toFixed(1)}k</div>
          <div className="metric-sub">total platform</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Detour CO₂</div>
          <div className="metric-val mono">{totals.totalCo2.toFixed(1)} kg</div>
          <div className="metric-sub">{totals.totalDetour.toFixed(0)} km detour</div>
        </div>
      </div>

      {/* Chart 1: Daily Match Rate */}
      <div className="chart-card">
        <div className="chart-header">
          <span className="chart-title">Match Rate by Day</span>
          <span className="chart-badge mono">7-Day Sim</span>
        </div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="analytics-svg">
          {/* Guide lines */}
          <line x1={pad} y1={chartH - pad} x2={chartW - pad} y2={chartH - pad} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1={pad} y1={pad} x2={chartW - pad} y2={pad} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

          {/* Bars */}
          {days.map((d, i) => {
            const h = (d.match_rate / maxMatch) * (chartH - pad * 2)
            const x = pad + i * ((chartW - pad * 2) / days.length) + 3
            const y = chartH - pad - h
            const isHovered = activeDayIdx === i

            return (
              <g
                key={d.day}
                onMouseEnter={() => setActiveDayIdx(i)}
                onMouseLeave={() => setActiveDayIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(h, 2)}
                  rx={3}
                  fill={isHovered ? '#3ddc97' : '#5b9dff'}
                  opacity={isHovered ? 1 : 0.8}
                />
                <text
                  x={x + barW / 2}
                  y={chartH - 4}
                  textAnchor="middle"
                  fill="#5d6a7b"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                >
                  D{i + 1}
                </text>
              </g>
            )
          })}
        </svg>
        {activeDayIdx !== null && (
          <div className="chart-tooltip mono">
            Day {days[activeDayIdx].day + 1}: {Math.round(days[activeDayIdx].match_rate * 100)}% matched ({days[activeDayIdx].lots_served}/{days[activeDayIdx].lots_offered} lots)
          </div>
        )}
      </div>

      {/* Chart 2: Revenue Trend */}
      <div className="chart-card">
        <div className="chart-header">
          <span className="chart-title">Daily Platform Revenue</span>
          <span className="chart-badge mono">₹ Total</span>
        </div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="analytics-svg">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ddc97" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3ddc97" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={revArea} fill="url(#revGrad)" />
          {/* Stroke path */}
          <path d={revPath} fill="none" stroke="#3ddc97" strokeWidth="2" strokeLinecap="round" />

          {/* Data Points */}
          {revPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={activeDayIdx === i ? 4 : 2.5}
              fill="#05080c"
              stroke="#3ddc97"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      {/* Fleet Efficiency Row */}
      <div className="fleet-stats-box">
        <div className="fs-row">
          <span className="fs-label">Avg Trucks Mobilized / Day</span>
          <span className="fs-val mono">
            {(days.reduce((s, d) => s + d.trucks_running, 0) / days.length).toFixed(1)} SCVs
          </span>
        </div>
        <div className="fs-row">
          <span className="fs-label">Avg Detour / Truck Trip</span>
          <span className="fs-val mono">
            {(totals.totalDetour / Math.max(days.reduce((s, d) => s + d.trips, 0), 1)).toFixed(1)} km
          </span>
        </div>
        <div className="fs-row">
          <span className="fs-label">CO₂ Emitted per Day</span>
          <span className="fs-val mono">
            {(totals.totalCo2 / days.length).toFixed(1)} kg CO₂
          </span>
        </div>
      </div>

      {/* Provenance Footer */}
      <div className="provenance-footnote">
        <span className="chip REAL">Roads &amp; network REAL</span>
        <span className="chip SIMULATED">Harvest seed SIMULATED</span>
      </div>
    </div>
  )
}
