import { useState, useMemo } from 'react'
import type { TwinData } from '../scene/types'
import { readEcon, dieselCost } from './pricing'

interface VillageExplorerPanelProps {
  data: TwinData
  activeVillageKey?: string | null
  onFocusVillage: (key: string) => void
}

export default function VillageExplorerPanel({
  data,
  activeVillageKey,
  onFocusVillage,
}: VillageExplorerPanelProps) {
  const [query, setQuery] = useState('')
  const [filterSharedOnly, setFilterSharedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'detour' | 'branch'>('detour')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const econ = useMemo(() => readEcon(data.economics), [data.economics])

  const filteredVillages = useMemo(() => {
    let list = [...data.villages]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((v) => v.name.toLowerCase().includes(q) || v.key.toLowerCase().includes(q))
    }
    if (filterSharedOnly) {
      list = list.filter((v) => v.branch_size > 1)
    }
    list.sort((a, b) => {
      if (sortBy === 'detour') return a.solo_detour_km - b.solo_detour_km
      if (sortBy === 'branch') return b.branch_size - a.branch_size
      return a.name.localeCompare(b.name)
    })
    return list
  }, [data.villages, query, filterSharedOnly, sortBy])

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

  return (
    <div className="village-explorer">
      <div className="panel-summary-stats">
        <div className="stat-box">
          <span className="stat-label">Total Settlements</span>
          <span className="stat-val mono">{data.villages.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Shared Branches</span>
          <span className="stat-val mono hi">
            {data.villages.filter((v) => v.branch_size > 1).length}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Isolated (Solo)</span>
          <span className="stat-val mono warn">
            {data.villages.filter((v) => v.branch_size <= 1).length}
          </span>
        </div>
      </div>

      <div className="filter-controls">
        <div className="search-wrap">
          <input
            type="text"
            className="input-search"
            placeholder="Search village name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              &times;
            </button>
          )}
        </div>

        <div className="filter-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={filterSharedOnly}
              onChange={(e) => setFilterSharedOnly(e.target.checked)}
            />
            <span>Shared branches only</span>
          </label>

          <select
            className="select-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="detour">Sort: Detour km</option>
            <option value="name">Sort: Name</option>
            <option value="branch">Sort: Branch Size</option>
          </select>
        </div>
      </div>

      <div className="village-list">
        {filteredVillages.map((v) => {
          const isExpanded = expandedKey === v.key
          const isActive = activeVillageKey === v.key
          const isShared = v.branch_size > 1
          const diesel = dieselCost(v.solo_detour_km, econ)
          const scnInfo = villageScenarioMap[v.key] || { servedIn: [], unservedIn: [] }

          return (
            <div
              key={v.key}
              className={`village-card${isActive ? ' active-focus' : ''}${isExpanded ? ' expanded' : ''}`}
            >
              <div
                className="village-header"
                onClick={() => setExpandedKey(isExpanded ? null : v.key)}
              >
                <div className="v-info">
                  <div className="v-name-row">
                    <span className="v-name">{v.name}</span>
                    <span className={`branch-badge ${isShared ? 'shared' : 'solo'}`}>
                      {isShared ? `Branch ${v.branch_id} (${v.branch_size} villages)` : 'Solo Node'}
                    </span>
                  </div>
                  <div className="v-meta mono">
                    <span>+{v.solo_detour_km.toFixed(1)} km detour</span>
                    <span>·</span>
                    <span>₹{Math.round(diesel)} diesel</span>
                  </div>
                </div>

                <div className="v-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="fly-btn"
                    title="Focus in 3D scene"
                    onClick={() => onFocusVillage(v.key)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>Fly</span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="village-detail-panel">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="lbl">Coordinates</span>
                      <span className="val mono">
                        {v.lat.toFixed(4)}°N, {v.lon.toFixed(4)}°E
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="lbl">Solo Detour Fuel</span>
                      <span className="val mono">
                        {(v.solo_detour_km / econ.scvMileageKmplLaden).toFixed(1)} L diesel
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="lbl">Min Viable Lot</span>
                      <span className="val mono hi">
                        ~{Math.round((diesel / (econ.fullTruckFarePerKm * (data.corridor.trunk_km / econ.truckCapacityKg))) || 80)} kg
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="lbl">Shared Pooling</span>
                      <span className={`val ${isShared ? 'hi' : 'dim'}`}>
                        {isShared ? `Eligible (x${v.branch_size})` : 'Individual only'}
                      </span>
                    </div>
                  </div>

                  {(scnInfo.servedIn.length > 0 || scnInfo.unservedIn.length > 0) && (
                    <div className="scn-appearance">
                      <span className="lbl">Scenario Evidence:</span>
                      <div className="scn-tags">
                        {scnInfo.servedIn.map((s) => (
                          <span key={s} className="tag served">
                            ✓ {s}
                          </span>
                        ))}
                        {scnInfo.unservedIn.map((s) => (
                          <span key={s} className="tag unserved">
                            ✗ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filteredVillages.length === 0 && (
          <div className="empty-notice">No settlements match your filter.</div>
        )}
      </div>
    </div>
  )
}
