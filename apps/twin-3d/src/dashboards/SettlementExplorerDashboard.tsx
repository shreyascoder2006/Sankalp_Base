import { useState, useMemo } from 'react'
import type { TwinData } from '../scene/types'
import { readEcon, dieselCost } from '../hud/pricing'

interface SettlementExplorerDashboardProps {
  data: TwinData
  onFocusVillage: (key: string) => void
  onReturnTo3D: () => void
}

export default function SettlementExplorerDashboard({
  data,
  onFocusVillage,
  onReturnTo3D,
}: SettlementExplorerDashboardProps) {
  const [query, setQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'shared' | 'solo'>('all')
  const [sortBy, setSortBy] = useState<'detour' | 'name' | 'branch'>('detour')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const econ = useMemo(() => readEcon(data.economics), [data.economics])

  const filteredVillages = useMemo(() => {
    let list = [...data.villages]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((v) => v.name.toLowerCase().includes(q) || v.key.toLowerCase().includes(q))
    }
    if (filterMode === 'shared') {
      list = list.filter((v) => v.branch_size > 1)
    } else if (filterMode === 'solo') {
      list = list.filter((v) => v.branch_size <= 1)
    }
    list.sort((a, b) => {
      if (sortBy === 'detour') return a.solo_detour_km - b.solo_detour_km
      if (sortBy === 'branch') return b.branch_size - a.branch_size
      return a.name.localeCompare(b.name)
    })
    return list
  }, [data.villages, query, filterMode, sortBy])

  // Count which scenarios feature each village
  const villageScenarioMap = useMemo(() => {
    const map: Record<string, { servedIn: string[]; unservedIn: string[] }> = {}
    data.villages.forEach((v) => {
      map[v.key] = { servedIn: [], unservedIn: [] }
    })
    data.scenarios.forEach((s) => {
      s.trips.forEach((trip) => {
        trip.stops.forEach((stop) => {
          if (map[stop.point_key] && !map[stop.point_key].servedIn.includes(s.title)) {
            map[stop.point_key].servedIn.push(s.title)
          }
        })
      })
      s.unserved.forEach((u) => {
        if (map[u.point_key] && !map[u.point_key].unservedIn.includes(s.title)) {
          map[u.point_key].unservedIn.push(s.title)
        }
      })
    })
    return map
  }, [data.villages, data.scenarios])

  const sharedCount = data.villages.filter((v) => v.branch_size > 1).length
  const soloCount = data.villages.filter((v) => v.branch_size <= 1).length
  const meanDetour = (
    data.villages.reduce((s, v) => s + v.solo_detour_km, 0) / Math.max(data.villages.length, 1)
  ).toFixed(1)

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-meta">
          <div className="dashboard-eyebrow">
            Corridor Network Directory · Pimpalgaon Baswant to Nashik APMC
          </div>
          <h1 className="dashboard-title">Settlement &amp; Branch Network Explorer</h1>
          <p className="dashboard-desc">
            Geographic directory of 19 agricultural settlements, road detour topology, branch clustering, and solo diesel penalties.
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

      {/* Top 4 KPI Metrics */}
      <div className="dashboard-kpi-grid">
        <div className="dash-kpi-card accent">
          <div className="kpi-top">
            <span className="kpi-title">Total Settlements</span>
            <span className="kpi-tag blue">Corridor</span>
          </div>
          <div className="kpi-value mono hi">{data.villages.length}</div>
          <div className="kpi-sub">Farming settlements mapped on real OSM road network</div>
          <div className="kpi-foot mono">OSM Road Network: REAL</div>
        </div>

        <div className="dash-kpi-card success-card">
          <div className="kpi-top">
            <span className="kpi-title">Shared Branch Clusters</span>
            <span className="kpi-tag green">Pooling</span>
          </div>
          <div className="kpi-value mono hi">{sharedCount}</div>
          <div className="kpi-sub">Villages sharing branch access roads with neighbors</div>
          <div className="kpi-foot mono">Subsidized branch detour diesel</div>
        </div>

        <div className="dash-kpi-card danger-card">
          <div className="kpi-top">
            <span className="kpi-title">Isolated Solo Nodes</span>
            <span className="kpi-tag red">High Detour</span>
          </div>
          <div className="kpi-value mono warn">{soloCount}</div>
          <div className="kpi-sub">Villages on dedicated dead-end branch spurs</div>
          <div className="kpi-foot mono">Requires consolidation hub</div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Mean Detour off Trunk</span>
            <span className="kpi-tag gold">Distance</span>
          </div>
          <div className="kpi-value mono">{meanDetour} km</div>
          <div className="kpi-sub">Average one-way diversion off NH-848 / AH-47</div>
          <div className="kpi-foot mono">Max detour: 8.8 km</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="explorer-filter-bar">
        <div className="search-box-large">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search settlement name (e.g., Sakore, Mohadi, Korhate)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input-field"
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')}>&times;</button>
          )}
        </div>

        <div className="filter-pill-group">
          <button
            className={`f-pill${filterMode === 'all' ? ' active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All ({data.villages.length})
          </button>
          <button
            className={`f-pill${filterMode === 'shared' ? ' active' : ''}`}
            onClick={() => setFilterMode('shared')}
          >
            Shared Branches ({sharedCount})
          </button>
          <button
            className={`f-pill${filterMode === 'solo' ? ' active' : ''}`}
            onClick={() => setFilterMode('solo')}
          >
            Solo Nodes ({soloCount})
          </button>
        </div>

        <div className="view-and-sort-group">
          <select
            className="dash-select small"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="detour">Sort: Detour Distance</option>
            <option value="branch">Sort: Branch Size</option>
            <option value="name">Sort: Alphabetical</option>
          </select>

          <div className="view-toggle-btns">
            <button
              className={`vt-btn${viewMode === 'cards' ? ' active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Grid Card View"
            >
              Cards
            </button>
            <button
              className={`vt-btn${viewMode === 'table' ? ' active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Main View: Cards Grid or Table */}
      {viewMode === 'cards' ? (
        <div className="settlements-card-grid">
          {filteredVillages.map((v) => {
            const isShared = v.branch_size > 1
            const fuel = dieselCost(v.solo_detour_km, econ)
            const scn = villageScenarioMap[v.key] || { servedIn: [], unservedIn: [] }
            const minViableLot = Math.round(
              (fuel / (econ.fullTruckFarePerKm * (data.corridor.trunk_km / econ.truckCapacityKg))) || 80
            )

            return (
              <div key={v.key} className={`settlement-dash-card ${isShared ? 'shared-card' : 'solo-card'}`}>
                <div className="sc-header">
                  <div>
                    <h3 className="sc-name">{v.name}</h3>
                    <span className="sc-coords mono">
                      {v.lat.toFixed(4)}°N, {v.lon.toFixed(4)}°E
                    </span>
                  </div>
                  <span className={`status-pill ${isShared ? 'green' : 'dim'}`}>
                    {isShared ? `Branch ${v.branch_id} (${v.branch_size})` : 'Solo Node'}
                  </span>
                </div>

                <div className="sc-metrics-grid">
                  <div className="sc-metric">
                    <span className="lbl">Solo Detour</span>
                    <b className="mono">+{v.solo_detour_km.toFixed(1)} km</b>
                  </div>
                  <div className="sc-metric">
                    <span className="lbl">Detour Fuel</span>
                    <b className="mono">₹{Math.round(fuel)} diesel</b>
                  </div>
                  <div className="sc-metric">
                    <span className="lbl">Min Viable Lot</span>
                    <b className="mono hi">~{minViableLot} kg</b>
                  </div>
                  <div className="sc-metric">
                    <span className="lbl">Branch Synergy</span>
                    <b className="mono">{isShared ? `x${v.branch_size} shared` : 'Individual'}</b>
                  </div>
                </div>

                {scn.servedIn.length > 0 && (
                  <div className="sc-scenario-chips">
                    <span className="lbl">Sim Scenario:</span>
                    <div className="chip-row">
                      {scn.servedIn.map((s) => (
                        <span key={s} className="tag served">✓ {s}</span>
                      ))}
                      {scn.unservedIn.map((s) => (
                        <span key={s} className="tag unserved">✗ {s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="sc-footer">
                  <button
                    className="sc-fly-btn"
                    onClick={() => {
                      onFocusVillage(v.key)
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    <span>Fly to {v.name} in 3D</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="dash-panel-card" style={{ marginTop: '8px' }}>
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Settlement Name</th>
                  <th>Branch Cluster</th>
                  <th>Cluster Size</th>
                  <th>Coordinates</th>
                  <th>Solo Detour Km</th>
                  <th>Detour Fuel</th>
                  <th>Min Viable Lot</th>
                  <th>Pooling Eligibility</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredVillages.map((v) => {
                  const isShared = v.branch_size > 1
                  const fuel = dieselCost(v.solo_detour_km, econ)
                  const minViable = Math.round(
                    (fuel / (econ.fullTruckFarePerKm * (data.corridor.trunk_km / econ.truckCapacityKg))) || 80
                  )

                  return (
                    <tr key={v.key}>
                      <td className="mono bold">{v.name}</td>
                      <td className="mono">Branch {v.branch_id}</td>
                      <td className="mono">{v.branch_size} settlements</td>
                      <td className="mono dim">{v.lat.toFixed(4)}°N, {v.lon.toFixed(4)}°E</td>
                      <td className="mono bold">+{v.solo_detour_km.toFixed(1)} km</td>
                      <td className="mono">₹{Math.round(fuel)}</td>
                      <td className="mono hi">~{minViable} kg</td>
                      <td>
                        <span className={`status-pill ${isShared ? 'green' : 'dim'}`}>
                          {isShared ? 'Eligible' : 'Solo Only'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-action-btn"
                          onClick={() => {
                            onFocusVillage(v.key)
                          }}
                        >
                          Fly in 3D &rarr;
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
