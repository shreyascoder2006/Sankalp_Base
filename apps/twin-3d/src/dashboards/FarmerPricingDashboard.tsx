import { useState, useMemo } from 'react'
import type { TwinData } from '../scene/types'
import { readEcon, quote, fullTruckFare } from '../hud/pricing'

interface FarmerPricingDashboardProps {
  data: TwinData
  onFocusVillage: (key: string) => void
  onReturnTo3D: () => void
}

const CROPS = [
  { id: 'tomato', name: 'Tomato (Tamatar)', icon: '🍅', shelfLife: '3-4 days', mandi: 'Nashik APMC Yard 1' },
  { id: 'onion', name: 'Onion (Pyaz)', icon: '🧅', shelfLife: '15-20 days', mandi: 'Pimpalgaon Sub-Yard' },
  { id: 'grapes', name: 'Grapes (Angoor)', icon: '🍇', shelfLife: '2-3 days', mandi: 'Nashik Export Gate' },
  { id: 'potato', name: 'Potato (Aloo)', icon: '🥔', shelfLife: '30+ days', mandi: 'Nashik APMC Yard 2' },
]

export default function FarmerPricingDashboard({
  data,
  onFocusVillage,
  onReturnTo3D,
}: FarmerPricingDashboardProps) {
  const [selectedVillageKey, setSelectedVillageKey] = useState<string>(
    data.villages[0]?.key || 'sakore'
  )
  const [loadKg, setLoadKg] = useState<number>(200)
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato')

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
  const savingAmount = Math.max(0, Math.round(fullFare - fareQuote.total))
  const perKgRate = (fareQuote.total / loadKg).toFixed(2)
  const soloPerKgRate = (fullFare / loadKg).toFixed(2)

  // Weight Tier Matrix
  const weightTiers = [50, 100, 200, 350, 500, 750, 1000, 1500].map((kg) => {
    const q = quote(kg, trunkKm, branchEntryKm, branchSharedBy, marginalKm, econ)
    const save = Math.max(0, Math.round(((fullFare - q.total) / fullFare) * 100))
    const diff = Math.max(0, Math.round(fullFare - q.total))
    const dalalRate = kg * 2.2 // Middleman freight markup typical in Nashik
    return {
      kg,
      pooledFare: q.total,
      perKg: (q.total / kg).toFixed(2),
      fullFare,
      dalalRate,
      savingPct: save,
      savingDiff: diff,
    }
  })

  const currentCrop = CROPS.find((c) => c.id === selectedCropId) || CROPS[0]

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-meta">
          <div className="dashboard-eyebrow">
            SANKALP Brief Section 6 · Farmer Logistics Inclusion &amp; Transparent Fares
          </div>
          <h1 className="dashboard-title">Farmer Pricing Engine Dashboard</h1>
          <p className="dashboard-desc">
            Direct algorithmic quote simulator based on core/pricing/fare.py. Smallholders pay only for the crates they ship, eliminating predatory full-truck monopoly rates.
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
            <span className="kpi-title">Guaranteed Pooled Fare</span>
            <span className="kpi-tag green">Quote</span>
          </div>
          <div className="kpi-value mono hi">₹{Math.round(fareQuote.total)}</div>
          <div className="kpi-sub">
            For {loadKg} kg ({village?.name} &rarr; Nashik APMC)
          </div>
          <div className="kpi-foot mono">₹{perKgRate} / kg freight</div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Solo Full-Truck Hire</span>
            <span className="kpi-tag red">Monopoly</span>
          </div>
          <div className="kpi-value mono">₹{Math.round(fullFare).toLocaleString()}</div>
          <div className="kpi-sub">
            Status quo cost to hire an entire SCV alone
          </div>
          <div className="kpi-foot mono">₹{soloPerKgRate} / kg freight</div>
        </div>

        <div className="dash-kpi-card success-card">
          <div className="kpi-top">
            <span className="kpi-title">Smallholder Direct Savings</span>
            <span className="kpi-tag green">Impact</span>
          </div>
          <div className="kpi-value mono hi">{savingPct}%</div>
          <div className="kpi-sub">
            ₹{savingAmount.toLocaleString()} saved on this single harvest run
          </div>
          <div className="kpi-foot mono">Protects farmer mandi profit margin</div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Branch Synergy Factor</span>
            <span className="kpi-tag blue">Shared Road</span>
          </div>
          <div className="kpi-value mono">
            {branchSharedBy > 1 ? `${branchSharedBy} Farmers` : 'Solo Node'}
          </div>
          <div className="kpi-sub">
            Branch {village?.branch_id} ({village?.solo_detour_km.toFixed(1)} km detour)
          </div>
          <div className="kpi-foot mono">
            {branchSharedBy > 1 ? `Detour fuel split ${branchSharedBy} ways` : 'Solo detour tariff applies'}
          </div>
        </div>
      </div>

      {/* Main Multi-Column Section */}
      <div className="dash-content-grid">
        {/* Left Column: Configurator & Hero Card */}
        <div className="dash-column-left">
          <div className="dash-panel-card">
            <h3 className="card-title">Harvest Shipment Configurator</h3>
            <p className="card-subtitle">
              Configure settlement, weight, and crop to generate an instant transparent quote.
            </p>

            <div className="workbench-form">
              {/* Village Selector */}
              <div className="form-group">
                <div className="wb-slider-hdr">
                  <span className="wb-lbl">Origin Settlement</span>
                  {village && (
                    <button
                      className="fly-inline-btn"
                      onClick={() => onFocusVillage(village.key)}
                    >
                      Fly to {village.name} in 3D &rarr;
                    </button>
                  )}
                </div>
                <select
                  className="dash-select"
                  value={selectedVillageKey}
                  onChange={(e) => setSelectedVillageKey(e.target.value)}
                >
                  {data.villages.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.name} ({v.solo_detour_km.toFixed(1)} km detour · Branch {v.branch_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight Slider */}
              <div className="form-group">
                <div className="wb-slider-hdr">
                  <span className="wb-lbl">Harvest Load Weight</span>
                  <span className="wb-val mono hi">{loadKg} kg ({Math.round(loadKg / 25)} crates)</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1500"
                  step="10"
                  value={loadKg}
                  onChange={(e) => setLoadKg(Number(e.target.value))}
                  className="dash-slider"
                />
                <div className="quick-presets">
                  {[50, 100, 200, 350, 500, 1000].map((preset) => (
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

              {/* Crop Selector */}
              <div className="form-group">
                <span className="wb-lbl">Crop Category</span>
                <div className="crop-selector-grid">
                  {CROPS.map((c) => (
                    <div
                      key={c.id}
                      className={`crop-card${selectedCropId === c.id ? ' active' : ''}`}
                      onClick={() => setSelectedCropId(c.id)}
                    >
                      <span className="crop-emoji">{c.icon}</span>
                      <div className="crop-card-info">
                        <b>{c.name.split(' ')[0]}</b>
                        <span>{c.shelfLife}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hero Guaranteed Fare Card */}
          <div className="quote-hero-banner">
            <div className="qh-header">
              <span className="qh-tag">Algorithmic Guaranteed Fare</span>
              <span className="qh-target mono">Target: {currentCrop.mandi}</span>
            </div>
            <div className="qh-price-row">
              <div className="qh-amount">
                <span className="currency">₹</span>
                <span className="num mono">{Math.round(fareQuote.total)}</span>
              </div>
              <div className="qh-savings">
                <span className="badge-save">SAVE {savingPct}%</span>
                <span className="save-diff mono">Save ₹{savingAmount}</span>
              </div>
            </div>
            <div className="qh-sub-row">
              <span>Trunk Distance: <b className="mono">{trunkKm} km</b></span>
              <span>Rate: <b className="mono">₹{perKgRate} / kg</b></span>
              <span>Pickup: <b className="mono">{village?.name}</b></span>
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown & Tier Table */}
        <div className="dash-column-right">
          {/* Transparent Formula Cost Dissection */}
          <div className="dash-panel-card">
            <div className="dash-card-header">
              <div>
                <h3 className="card-title">Transparent Cost Dissection</h3>
                <p className="card-subtitle">
                  Formula audit matching Python engine `core.pricing.fare.quote()`.
                </p>
              </div>
              <span className="chip MODELED">Pricing Engine</span>
            </div>

            <div className="breakdown-grid">
              <div className="bg-item">
                <div className="bg-lbl">1. Trunk Capacity Share</div>
                <div className="bg-sub mono">
                  ({loadKg}kg / {econ.truckCapacityKg}kg) &times; ₹{fullFare}
                </div>
                <div className="bg-val mono">₹{fareQuote.capacityShare.toFixed(2)}</div>
              </div>

              <div className="bg-item">
                <div className="bg-lbl">2. Branch Entry Diesel</div>
                <div className="bg-sub mono">
                  ({branchEntryKm}km &divide; {branchSharedBy} farmers) fuel
                </div>
                <div className="bg-val mono">₹{fareQuote.branchEntryShare.toFixed(2)}</div>
              </div>

              <div className="bg-item">
                <div className="bg-lbl">3. Marginal Farm Gate Detour</div>
                <div className="bg-sub mono">
                  {marginalKm} km pickup detour fuel
                </div>
                <div className="bg-val mono">₹{fareQuote.marginalDetour.toFixed(2)}</div>
              </div>

              <div className="bg-item">
                <div className="bg-lbl">4. Crate Handling &amp; Stop</div>
                <div className="bg-sub mono">Loading support allowance</div>
                <div className="bg-val mono">₹{fareQuote.handling.toFixed(2)}</div>
              </div>

              <div className="bg-item highlight-item">
                <div className="bg-lbl">5. Platform Fee (8%)</div>
                <div className="bg-sub mono">Matching, routing &amp; dispatch</div>
                <div className="bg-val mono">₹{fareQuote.platformFee.toFixed(2)}</div>
              </div>

              <div className="bg-item total-item">
                <div className="bg-lbl bold">Total Guaranteed Farmer Fare</div>
                <div className="bg-sub mono">All-inclusive to APMC gate</div>
                <div className="bg-val mono hi bold">₹{Math.round(fareQuote.total)}</div>
              </div>
            </div>
          </div>

          {/* Load Tier Matrix Table */}
          <div className="dash-panel-card" style={{ marginTop: '16px' }}>
            <h3 className="card-title">Load Size Comparison Matrix</h3>
            <p className="card-subtitle">
              Pricing comparison across standard agricultural lot sizes from {village?.name}.
            </p>

            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Harvest Weight</th>
                    <th>Pooled Quote</th>
                    <th>Rate / Kg</th>
                    <th>Full Truck</th>
                    <th>Dalal Markup</th>
                    <th>Saving %</th>
                    <th>Net Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {weightTiers.map((tier) => (
                    <tr
                      key={tier.kg}
                      className={tier.kg === loadKg ? 'selected-row' : ''}
                      onClick={() => setLoadKg(tier.kg)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="mono bold">{tier.kg} kg</td>
                      <td className="mono hi bold">₹{Math.round(tier.pooledFare)}</td>
                      <td className="mono">₹{tier.perKg}</td>
                      <td className="mono dim">₹{Math.round(tier.fullFare)}</td>
                      <td className="mono dim">₹{Math.round(tier.dalalRate)}</td>
                      <td className="mono"><span className="status-pill green">-{tier.savingPct}%</span></td>
                      <td className="mono hi bold">₹{tier.savingDiff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
