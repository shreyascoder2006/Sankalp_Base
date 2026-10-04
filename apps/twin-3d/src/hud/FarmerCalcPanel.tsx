import { useState, useMemo } from 'react'
import type { TwinData } from '../scene/types'
import { readEcon, quote, fullTruckFare } from './pricing'

interface FarmerCalcPanelProps {
  data: TwinData
  onFocusVillage: (key: string) => void
}

const CROPS = [
  { id: 'tomato', name: 'Tomato (Tamatar)', icon: '🍅' },
  { id: 'onion', name: 'Onion (Pyaz)', icon: '🧅' },
  { id: 'grapes', name: 'Grapes (Angoor)', icon: '🍇' },
  { id: 'potato', name: 'Potato (Aloo)', icon: '🥔' },
]

export default function FarmerCalcPanel({ data, onFocusVillage }: FarmerCalcPanelProps) {
  const [selectedVillageKey, setSelectedVillageKey] = useState<string>(
    data.villages[0]?.key || 'sakore'
  )
  const [loadKg, setLoadKg] = useState<number>(200)
  const [selectedCrop, setSelectedCrop] = useState<string>('tomato')
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false)

  const econ = useMemo(() => readEcon(data.economics), [data.economics])

  const village = useMemo(() => {
    return data.villages.find((v) => v.key === selectedVillageKey) || data.villages[0]
  }, [data.villages, selectedVillageKey])

  const trunkKm = data.corridor.trunk_km
  const branchEntryKm = village ? village.solo_detour_km : 8.5
  const branchSharedBy = village ? Math.max(village.branch_size, 1) : 1
  const marginalKm = branchSharedBy > 1 ? 0.35 : 0.0

  const fareQuote = useMemo(() => {
    return quote(loadKg, trunkKm, branchEntryKm, branchSharedBy, marginalKm, econ)
  }, [loadKg, trunkKm, branchEntryKm, branchSharedBy, marginalKm, econ])

  const fullFare = useMemo(() => {
    return fullTruckFare(trunkKm, econ)
  }, [trunkKm, econ])

  const savingPct = Math.max(0, Math.round(((fullFare - fareQuote.total) / fullFare) * 100))

  // Comparison table for standard lot sizes
  const comparisons = useMemo(() => {
    const weights = [50, 100, 200, 500, 1000]
    return weights.map((w) => {
      const q = quote(w, trunkKm, branchEntryKm, branchSharedBy, marginalKm, econ)
      const save = Math.max(0, Math.round(((fullFare - q.total) / fullFare) * 100))
      return { kg: w, pooled: q.total, saving: save }
    })
  }, [trunkKm, branchEntryKm, branchSharedBy, marginalKm, econ, fullFare])

  return (
    <div className="farmer-calc">
      <div className="calc-inputs">
        <div className="form-group">
          <label className="form-label">
            <span>Pickup Settlement</span>
            {village && (
              <button
                className="fly-inline-btn"
                title="View in 3D"
                onClick={() => onFocusVillage(village.key)}
              >
                Fly to village &rarr;
              </button>
            )}
          </label>
          <select
            className="select-village"
            value={selectedVillageKey}
            onChange={(e) => {
              setSelectedVillageKey(e.target.value)
              onFocusVillage(e.target.value)
            }}
          >
            {data.villages.map((v) => (
              <option key={v.key} value={v.key}>
                {v.name} ({v.solo_detour_km.toFixed(1)} km detour · Branch {v.branch_id})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <div className="label-with-val">
            <span className="form-label">Harvest Load</span>
            <span className="mono bold hi">{loadKg} kg</span>
          </div>
          <div className="slider-row">
            <input
              type="range"
              min="20"
              max="1500"
              step="10"
              value={loadKg}
              onChange={(e) => setLoadKg(Number(e.target.value))}
              className="slider"
            />
          </div>
          <div className="quick-presets">
            {[50, 100, 200, 500, 1000].map((preset) => (
              <button
                key={preset}
                className={`preset-btn${loadKg === preset ? ' active' : ''}`}
                onClick={() => setLoadKg(preset)}
              >
                {preset} kg
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Crop Type</label>
          <div className="crop-selector">
            {CROPS.map((c) => (
              <button
                key={c.id}
                className={`crop-btn${selectedCrop === c.id ? ' active' : ''}`}
                onClick={() => setSelectedCrop(c.id)}
              >
                <span className="crop-icon">{c.icon}</span>
                <span className="crop-name">{c.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Quote Result Card */}
      <div className="quote-card">
        <div className="quote-eyebrow">Guaranteed Pooled Quote</div>
        <div className="quote-hero">
          <div className="quote-price">
            <span className="currency">₹</span>
            <span className="amount mono">{Math.round(fareQuote.total)}</span>
          </div>
          <div className="quote-badge">
            <span className="save-badge">SAVE {savingPct}%</span>
            <span className="per-kg mono">₹{(fareQuote.total / loadKg).toFixed(1)} / kg</span>
          </div>
        </div>

        <div className="vs-full-truck">
          <span>vs full truck hire: </span>
          <s className="mono">₹{Math.round(fullFare)}</s>
          <span className="diff-highlight"> (Save ₹{Math.round(fullFare - fareQuote.total)})</span>
        </div>

        <button
          className="toggle-breakdown"
          onClick={() => setShowBreakdown(!showBreakdown)}
        >
          <span>{showBreakdown ? 'Hide Cost Breakdown' : 'Show Cost Breakdown'}</span>
          <span>{showBreakdown ? '▲' : '▼'}</span>
        </button>

        {showBreakdown && (
          <div className="breakdown-details">
            <div className="bd-row">
              <span className="bd-label">Trunk Capacity Share ({loadKg}kg / {econ.truckCapacityKg}kg)</span>
              <span className="bd-val mono">₹{fareQuote.capacityShare.toFixed(1)}</span>
            </div>
            <div className="bd-row">
              <span className="bd-label">Branch Entry Share ({branchEntryKm}km / {branchSharedBy} farmers)</span>
              <span className="bd-val mono">₹{fareQuote.branchEntryShare.toFixed(1)}</span>
            </div>
            {fareQuote.marginalDetour > 0 && (
              <div className="bd-row">
                <span className="bd-label">Marginal Detour</span>
                <span className="bd-val mono">₹{fareQuote.marginalDetour.toFixed(1)}</span>
              </div>
            )}
            <div className="bd-row">
              <span className="bd-label">Loading &amp; Handling</span>
              <span className="bd-val mono">₹{fareQuote.handling.toFixed(1)}</span>
            </div>
            <div className="bd-row fee">
              <span className="bd-label">Platform Fee ({(econ.platformFeePct * 100).toFixed(0)}%)</span>
              <span className="bd-val mono">₹{fareQuote.platformFee.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="comparison-section">
        <div className="section-title">Load Size Comparison</div>
        <table className="compare-table">
          <thead>
            <tr>
              <th>Load</th>
              <th>Pooled Fare</th>
              <th>Rate / kg</th>
              <th>Saving</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c) => (
              <tr key={c.kg} className={c.kg === loadKg ? 'active-row' : ''}>
                <td className="mono">{c.kg} kg</td>
                <td className="mono bold hi">₹{Math.round(c.pooled)}</td>
                <td className="mono dim">₹{(c.pooled / c.kg).toFixed(1)}</td>
                <td className="mono save-txt">-{c.saving}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
