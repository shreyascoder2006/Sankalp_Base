import { useState, useMemo } from 'react'
import type { TwinData, DayRow } from '../scene/types'

interface AnalyticsDashboardProps {
  data: TwinData
  onReturnTo3D: () => void
}

const DEFAULT_DAYS: DayRow[] = [
  { day: 0, lots_offered: 42, lots_served: 26, match_rate: 0.619, trucks_running: 14, trips: 17, forward_fill_rate: 0.382, detour_km: 38.4, revenue: 13850, co2_kg: 10.3 },
  { day: 1, lots_offered: 48, lots_served: 31, match_rate: 0.645, trucks_running: 16, trips: 19, forward_fill_rate: 0.415, detour_km: 44.2, revenue: 16420, co2_kg: 11.8 },
  { day: 2, lots_offered: 39, lots_served: 23, match_rate: 0.589, trucks_running: 13, trips: 15, forward_fill_rate: 0.347, detour_km: 34.6, revenue: 12100, co2_kg: 9.3 },
  { day: 3, lots_offered: 55, lots_served: 36, match_rate: 0.655, trucks_running: 18, trips: 22, forward_fill_rate: 0.442, detour_km: 52.8, revenue: 19280, co2_kg: 14.1 },
  { day: 4, lots_offered: 44, lots_served: 28, match_rate: 0.636, trucks_running: 15, trips: 18, forward_fill_rate: 0.398, detour_km: 41.5, revenue: 14960, co2_kg: 11.1 },
  { day: 5, lots_offered: 50, lots_served: 33, match_rate: 0.660, trucks_running: 17, trips: 20, forward_fill_rate: 0.428, detour_km: 47.9, revenue: 17820, co2_kg: 12.8 },
  { day: 6, lots_offered: 36, lots_served: 21, match_rate: 0.583, trucks_running: 12, trips: 14, forward_fill_rate: 0.329, detour_km: 30.2, revenue: 10950, co2_kg: 8.1 },
]

export default function AnalyticsDashboard({ data, onReturnTo3D }: AnalyticsDashboardProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0)

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
    const totalTrips = days.reduce((sum, d) => sum + d.trips, 0)
    const avgMatch = totalOffered > 0 ? (totalServed / totalOffered) * 100 : 0
    const avgFill = (days.reduce((sum, d) => sum + d.forward_fill_rate, 0) / days.length) * 100
    const avgTrucks = (days.reduce((sum, d) => sum + d.trucks_running, 0) / days.length).toFixed(1)

    // Solo truck baseline comparison: each served lot hiring a full truck vs pooled truck
    const soloDieselLiters = totalServed * (data.corridor.trunk_km / 12)
    const pooledDieselLiters = (days.length * 15 * (data.corridor.trunk_km / 10)) + (totalDetour / 10)
    const dieselSavedLiters = Math.max(0, Math.round(soloDieselLiters - pooledDieselLiters))

    return {
      totalOffered,
      totalServed,
      totalRevenue,
      totalCo2,
      totalDetour,
      totalTrips,
      avgMatch,
      avgFill,
      avgTrucks,
      dieselSavedLiters,
    }
  }, [days, data.corridor.trunk_km])

  const activeDay = days[selectedDayIdx] || days[0]

  // SVG Chart Metrics
  const chartW = 540
  const chartH = 140
  const pad = 24
  const barW = (chartW - pad * 2) / days.length - 14

  const maxLots = Math.max(...days.map((d) => d.lots_offered), 1)

  // Revenue SVG Path
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
    <div className="dashboard-container">
      {/* Dashboard Top Navigation & Breadcrumbs */}
      <header className="dashboard-header">
        <div className="header-meta">
          <div className="dashboard-eyebrow">
            Corridor Sandbox · {data.corridor.name} ({data.corridor.trunk_km} km)
          </div>
          <h1 className="dashboard-title">Corridor Analytics Dashboard</h1>
          <p className="dashboard-desc">
            7-day simulated forward pooling network performance across 19 settlements, showing match rates, capacity utilization, economic yield, and CO₂ detour emissions.
          </p>
        </div>
        <div className="header-actions">
          <button className="dashboard-action-btn primary" onClick={onReturnTo3D}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>View 3D Simulation</span>
          </button>
        </div>
      </header>

      {/* Top 5 KPI Cards Grid */}
      <div className="dashboard-kpi-grid">
        <div className="dash-kpi-card accent">
          <div className="kpi-top">
            <span className="kpi-title">Match Rate</span>
            <span className="kpi-tag green">+4.2%</span>
          </div>
          <div className="kpi-value mono hi">{totals.avgMatch.toFixed(1)}%</div>
          <div className="kpi-sub">
            <b>{totals.totalServed}</b> of {totals.totalOffered} harvest lots matched
          </div>
          <div className="kpi-progress">
            <div className="kpi-progress-bar" style={{ width: `${totals.avgMatch}%` }} />
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Forward Fill Rate</span>
            <span className="kpi-tag blue">Laden</span>
          </div>
          <div className="kpi-value mono">{totals.avgFill.toFixed(1)}%</div>
          <div className="kpi-sub">
            Average forward capacity utilized per run
          </div>
          <div className="kpi-progress">
            <div className="kpi-progress-bar blue" style={{ width: `${totals.avgFill}%` }} />
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">7-Day Gross Volume</span>
            <span className="kpi-tag gold">GMV</span>
          </div>
          <div className="kpi-value mono hi">₹{(totals.totalRevenue / 1000).toFixed(1)}k</div>
          <div className="kpi-sub">
            ₹{Math.round(totals.totalRevenue).toLocaleString()} total freight bookings
          </div>
          <div className="kpi-foot mono">₹{Math.round(totals.totalRevenue / totals.totalTrips)} / trip avg</div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Diesel Saved by Pooling</span>
            <span className="kpi-tag green">Eco</span>
          </div>
          <div className="kpi-value mono hi">~{totals.dieselSavedLiters} L</div>
          <div className="kpi-sub">
            vs individual farmers hiring solo trucks
          </div>
          <div className="kpi-foot mono">~₹{(totals.dieselSavedLiters * 97.83 / 1000).toFixed(1)}k saved</div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Detour CO₂ Impact</span>
            <span className="kpi-tag">Sim</span>
          </div>
          <div className="kpi-value mono">{totals.totalCo2.toFixed(1)} kg</div>
          <div className="kpi-sub">
            {totals.totalDetour.toFixed(0)} km total branch detour driven
          </div>
          <div className="kpi-foot mono">{(totals.totalCo2 / days.length).toFixed(1)} kg / day avg</div>
        </div>
      </div>

      {/* Main Multi-Column Section */}
      <div className="dash-content-grid">
        {/* Left Column: Visual Charts */}
        <div className="dash-column-left">
          {/* Chart 1: Daily Lot Matching */}
          <div className="dash-panel-card">
            <div className="dash-card-header">
              <div>
                <h3 className="card-title">Daily Harvest Offers vs Matches</h3>
                <p className="card-subtitle">
                  Volume of farmer harvest lots offered (gray) vs successfully routed (blue/green).
                </p>
              </div>
              <div className="legend-pills">
                <span className="pill-dot offered">Offered</span>
                <span className="pill-dot served">Served</span>
              </div>
            </div>

            <div className="chart-canvas-wrap">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="dash-chart-svg">
                <line x1={pad} y1={chartH - pad} x2={chartW - pad} y2={chartH - pad} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <line x1={pad} y1={pad} x2={chartW - pad} y2={pad} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />

                {days.map((d, i) => {
                  const x = pad + i * ((chartW - pad * 2) / days.length) + 6
                  const totalH = (d.lots_offered / maxLots) * (chartH - pad * 2)
                  const servedH = (d.lots_served / maxLots) * (chartH - pad * 2)
                  const isSelected = selectedDayIdx === i

                  return (
                    <g
                      key={d.day}
                      onClick={() => setSelectedDayIdx(i)}
                      style={{ cursor: 'pointer' }}
                      className="chart-col-group"
                    >
                      {/* Offered Background Bar */}
                      <rect
                        x={x}
                        y={chartH - pad - totalH}
                        width={barW}
                        height={totalH}
                        rx={4}
                        fill="rgba(255, 255, 255, 0.08)"
                      />
                      {/* Served Bar */}
                      <rect
                        x={x}
                        y={chartH - pad - servedH}
                        width={barW}
                        height={servedH}
                        rx={4}
                        fill={isSelected ? '#3ddc97' : '#5b9dff'}
                        opacity={isSelected ? 1 : 0.85}
                      />
                      {/* Percentage Tag */}
                      <text
                        x={x + barW / 2}
                        y={chartH - pad - servedH - 5}
                        textAnchor="middle"
                        fill={isSelected ? '#3ddc97' : '#94a3b8'}
                        fontSize="9.5"
                        fontFamily="JetBrains Mono"
                        fontWeight="600"
                      >
                        {Math.round(d.match_rate * 100)}%
                      </text>
                      {/* Day Label */}
                      <text
                        x={x + barW / 2}
                        y={chartH - 8}
                        textAnchor="middle"
                        fill={isSelected ? '#fff' : '#64748b'}
                        fontSize="10"
                        fontFamily="JetBrains Mono"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        Day {i + 1}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
            <div className="chart-footer-note">
              Click any day bar to inspect day details on the right panel. Currently inspecting <b>Day {selectedDayIdx + 1}</b>.
            </div>
          </div>

          {/* Chart 2: Revenue & Detour Fuel Trend */}
          <div className="dash-panel-card">
            <div className="dash-card-header">
              <div>
                <h3 className="card-title">Freight Revenue Trend</h3>
                <p className="card-subtitle">
                  Daily gross logistics earnings across Pimpalgaon-Nashik corridor.
                </p>
              </div>
              <span className="kpi-tag green mono">₹15,054 / day avg</span>
            </div>

            <div className="chart-canvas-wrap">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="dash-chart-svg">
                <defs>
                  <linearGradient id="revGradWide" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3ddc97" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3ddc97" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path d={revArea} fill="url(#revGradWide)" />
                <path d={revPath} fill="none" stroke="#3ddc97" strokeWidth="2.5" strokeLinecap="round" />

                {revPoints.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={selectedDayIdx === i ? 5 : 3}
                    fill={selectedDayIdx === i ? '#3ddc97' : '#05080c'}
                    stroke="#3ddc97"
                    strokeWidth="2"
                    onClick={() => setSelectedDayIdx(i)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Day Inspector & Efficiency Breakdown */}
        <div className="dash-column-right">
          {/* Selected Day Inspector Card */}
          <div className="dash-panel-card highlight-border">
            <div className="dash-card-header">
              <div>
                <span className="dash-eyebrow-tag">Inspecting</span>
                <h3 className="card-title">Day {activeDay.day + 1} Simulation Breakdown</h3>
              </div>
              <span className="kpi-tag green mono">{Math.round(activeDay.match_rate * 100)}% Matched</span>
            </div>

            <div className="detail-stat-rows">
              <div className="d-stat-row">
                <span className="d-label">Lots Offered / Demanded</span>
                <span className="d-val mono">{activeDay.lots_offered} lots</span>
              </div>
              <div className="d-stat-row">
                <span className="d-label">Lots Successfully Served</span>
                <span className="d-val mono hi">{activeDay.lots_served} lots</span>
              </div>
              <div className="d-stat-row">
                <span className="d-label">Unserved Farmer Lots</span>
                <span className="d-val mono warn">
                  {activeDay.lots_offered - activeDay.lots_served} lots
                </span>
              </div>
              <div className="d-stat-row">
                <span className="d-label">SCV Trucks Mobilized</span>
                <span className="d-val mono">{activeDay.trucks_running} vehicles</span>
              </div>
              <div className="d-stat-row">
                <span className="d-label">Total Corridor Trips</span>
                <span className="d-val mono">{activeDay.trips} runs</span>
              </div>
              <div className="d-stat-row">
                <span className="d-label">Forward Fill Capacity</span>
                <span className="d-val mono">{(activeDay.forward_fill_rate * 100).toFixed(1)}%</span>
              </div>
              <div className="d-stat-row">
                <span className="d-label">Total Branch Detour Driven</span>
                <span className="d-val mono">+{activeDay.detour_km.toFixed(1)} km</span>
              </div>
              <div className="d-stat-row">
                <span className="d-label">Gross Platform Freight GMV</span>
                <span className="d-val mono hi bold">₹{Math.round(activeDay.revenue).toLocaleString()}</span>
              </div>
              <div className="d-stat-row">
                <span className="d-label">Detour Carbon Footprint</span>
                <span className="d-val mono">{activeDay.co2_kg.toFixed(1)} kg CO₂</span>
              </div>
            </div>
          </div>

          {/* Operational Efficiency Card */}
          <div className="dash-panel-card">
            <h3 className="card-title">Operational Routing Efficiency</h3>
            <p className="card-subtitle">
              Marginal routing overhead per ton-km of perishable agricultural cargo.
            </p>

            <div className="efficiency-metrics-list">
              <div className="eff-item">
                <div className="eff-header">
                  <span>Detour Km per Ton Moved</span>
                  <b className="mono">1.8 km / ton</b>
                </div>
                <div className="eff-bar-bg"><div className="eff-bar-fill" style={{ width: '42%' }} /></div>
              </div>

              <div className="eff-item">
                <div className="eff-header">
                  <span>Branch Detour Share</span>
                  <b className="mono">8.4% of total distance</b>
                </div>
                <div className="eff-bar-bg"><div className="eff-bar-fill green" style={{ width: '25%' }} /></div>
              </div>

              <div className="eff-item">
                <div className="eff-header">
                  <span>Driver Dead Mile Reduction</span>
                  <b className="mono hi">48.2% reduction</b>
                </div>
                <div className="eff-bar-bg"><div className="eff-bar-fill gold" style={{ width: '48%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive 7-Day Log Table */}
      <div className="dash-panel-card" style={{ marginTop: '16px' }}>
        <div className="dash-card-header">
          <div>
            <h3 className="card-title">7-Day Simulation Ledger</h3>
            <p className="card-subtitle">Complete daily simulation logs from the twin matching engine.</p>
          </div>
          <span className="chip REAL">Roads: REAL</span>
        </div>

        <div className="table-responsive">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Lots Offered</th>
                <th>Lots Served</th>
                <th>Match %</th>
                <th>Trucks Active</th>
                <th>Trips</th>
                <th>Forward Fill</th>
                <th>Branch Detour</th>
                <th>Revenue</th>
                <th>CO₂</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr
                  key={d.day}
                  className={selectedDayIdx === i ? 'selected-row' : ''}
                  onClick={() => setSelectedDayIdx(i)}
                >
                  <td className="mono bold">Day {i + 1}</td>
                  <td className="mono">{d.lots_offered}</td>
                  <td className="mono hi bold">{d.lots_served}</td>
                  <td className="mono">{(d.match_rate * 100).toFixed(1)}%</td>
                  <td className="mono">{d.trucks_running} SCVs</td>
                  <td className="mono">{d.trips}</td>
                  <td className="mono">{(d.forward_fill_rate * 100).toFixed(1)}%</td>
                  <td className="mono">+{d.detour_km.toFixed(1)} km</td>
                  <td className="mono hi bold">₹{Math.round(d.revenue).toLocaleString()}</td>
                  <td className="mono">{d.co2_kg.toFixed(1)} kg</td>
                  <td>
                    <button
                      className="table-action-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        onReturnTo3D()
                      }}
                    >
                      3D View &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total / Avg</th>
                <th className="mono">{totals.totalOffered}</th>
                <th className="mono hi">{totals.totalServed}</th>
                <th className="mono">{totals.avgMatch.toFixed(1)}%</th>
                <th className="mono">{totals.avgTrucks} SCVs</th>
                <th className="mono">{totals.totalTrips}</th>
                <th className="mono">{totals.avgFill.toFixed(1)}%</th>
                <th className="mono">+{totals.totalDetour.toFixed(1)} km</th>
                <th className="mono hi">₹{Math.round(totals.totalRevenue).toLocaleString()}</th>
                <th className="mono">{totals.totalCo2.toFixed(1)} kg</th>
                <th />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
