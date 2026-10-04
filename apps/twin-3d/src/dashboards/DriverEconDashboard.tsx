import { useState, useMemo } from 'react'
import type { TwinData } from '../scene/types'
import { readEcon } from '../hud/pricing'

interface DriverEconDashboardProps {
  data: TwinData
  onReturnTo3D: () => void
}

export default function DriverEconDashboard({ data, onReturnTo3D }: DriverEconDashboardProps) {
  const econ = useMemo(() => readEcon(data.economics), [data.economics])

  // Dead-mile inputs
  const [returnKm, setReturnKm] = useState<number>(50)
  const [unladenMileage, setUnladenMileage] = useState<number>(12)
  const [workingDays, setWorkingDays] = useState<number>(25)

  // Backhaul inputs
  const [backhaulTrips, setBackhaulTrips] = useState<number>(12)
  const [avgLoadFare, setAvgLoadFare] = useState<number>(500)
  const [selectedCargo, setSelectedCargo] = useState<string>('all')

  // EMI input
  const [monthlyEmi, setMonthlyEmi] = useState<number>(15000)

  // Calculations
  const dailyDeadMileDieselLiters = returnKm / unladenMileage
  const dailyDeadMileCost = dailyDeadMileDieselLiters * econ.dieselPricePerL
  const monthlyDeadMileCost = dailyDeadMileCost * workingDays
  const monthlyDeadMileLiters = dailyDeadMileDieselLiters * workingDays
  const annualDeadMileCost = monthlyDeadMileCost * 12

  const monthlyBackhaulGross = backhaulTrips * avgLoadFare
  const platformFee = monthlyBackhaulGross * econ.platformFeePct
  const monthlyBackhaulNet = monthlyBackhaulGross - platformFee

  // Forward trip net earnings estimate (typical SCV driver net earnings after fuel)
  const forwardNetPerDay = 680
  const monthlyForwardNet = workingDays * forwardNetPerDay

  const totalMonthlyNetDriverIncome = monthlyForwardNet + monthlyBackhaulNet
  const emiCoveragePct = Math.round((totalMonthlyNetDriverIncome / monthlyEmi) * 100)
  const netFinancialSwing = monthlyDeadMileCost + monthlyBackhaulNet

  // Sensitivity table rows
  const sensitivityRows = [0, 5, 10, 15, 20, 25].map((trips) => {
    const gross = trips * avgLoadFare
    const net = gross * (1 - econ.platformFeePct)
    const combined = monthlyForwardNet + net
    const emiCover = Math.round((combined / monthlyEmi) * 100)
    const netCashflow = combined - monthlyEmi
    return { trips, gross, net, combined, emiCover, netCashflow }
  })

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-meta">
          <div className="dashboard-eyebrow">
            SANKALP Brief Section 7 · Sustainable Mobility &amp; Driver Economics
          </div>
          <h1 className="dashboard-title">Driver Economics &amp; Backhaul Dashboard</h1>
          <p className="dashboard-desc">
            Modeling how backhaul cargo matching converts dead miles into driver equity, covering truck loan EMIs and eliminating wasted rural diesel.
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

      {/* Top 4 KPI Cards */}
      <div className="dashboard-kpi-grid">
        <div className="dash-kpi-card danger-card">
          <div className="kpi-top">
            <span className="kpi-title">Dead-Mile Diesel Waste</span>
            <span className="kpi-tag red">Status Quo</span>
          </div>
          <div className="kpi-value mono red-txt">-₹{Math.round(monthlyDeadMileCost).toLocaleString()}</div>
          <div className="kpi-sub">
            {monthlyDeadMileLiters.toFixed(0)} liters burned hauling empty air every month
          </div>
          <div className="kpi-foot mono danger-txt">₹{Math.round(annualDeadMileCost).toLocaleString()} / year lost</div>
        </div>

        <div className="dash-kpi-card success-card">
          <div className="kpi-top">
            <span className="kpi-title">Net Backhaul Earnings</span>
            <span className="kpi-tag green">Uber for Harvest</span>
          </div>
          <div className="kpi-value mono hi">+₹{Math.round(monthlyBackhaulNet).toLocaleString()}</div>
          <div className="kpi-sub">
            {backhaulTrips} return loads matched (fertilizer, seeds, FMCG, crates)
          </div>
          <div className="kpi-foot mono hi">8% platform fee deducted</div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Net Financial Swing</span>
            <span className="kpi-tag gold">Cashflow</span>
          </div>
          <div className="kpi-value mono hi">+₹{Math.round(netFinancialSwing).toLocaleString()}</div>
          <div className="kpi-sub">
            Combined swing: dead miles monetized + backhaul revenue
          </div>
          <div className="kpi-foot mono">Per driver monthly turnaround</div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Truck Loan EMI Coverage</span>
            <span className="kpi-tag blue">Security</span>
          </div>
          <div className={`kpi-value mono ${emiCoveragePct >= 100 ? 'hi' : 'warn'}`}>
            {emiCoveragePct}%
          </div>
          <div className="kpi-sub">
            Total net revenue (₹{Math.round(totalMonthlyNetDriverIncome).toLocaleString()}) vs ₹{monthlyEmi.toLocaleString()} EMI
          </div>
          <div className="kpi-progress">
            <div
              className={`kpi-progress-bar ${emiCoveragePct >= 100 ? 'green' : 'gold'}`}
              style={{ width: `${Math.min(100, emiCoveragePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Dual Workbench Section */}
      <div className="dash-content-grid">
        {/* Left Column: Dead-Mile Cost Simulator */}
        <div className="dash-panel-card danger-accent">
          <div className="dash-card-header">
            <div>
              <span className="dash-eyebrow-tag danger">Baseline Waste Modeling</span>
              <h3 className="card-title">Dead-Mile Diesel Burn Calculator</h3>
              <p className="card-subtitle">
                Rural SCVs run empty on the return leg from mandi to village, burning cash every kilometer.
              </p>
            </div>
            <span className="chip REAL">Diesel: ₹{econ.dieselPricePerL.toFixed(2)} REAL</span>
          </div>

          <div className="workbench-form">
            <div className="wb-slider-group">
              <div className="wb-slider-hdr">
                <span className="wb-lbl">Empty Return Distance</span>
                <span className="wb-val mono">{returnKm} km / day</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                step="5"
                value={returnKm}
                onChange={(e) => setReturnKm(Number(e.target.value))}
                className="dash-slider danger"
              />
              <div className="wb-range-labels mono">
                <span>20 km</span>
                <span>Pimpalgaon Corridor (50 km)</span>
                <span>80 km</span>
              </div>
            </div>

            <div className="wb-slider-group">
              <div className="wb-slider-hdr">
                <span className="wb-lbl">Vehicle Mileage (Unladen)</span>
                <span className="wb-val mono">{unladenMileage} km/L</span>
              </div>
              <input
                type="range"
                min="8"
                max="18"
                step="1"
                value={unladenMileage}
                onChange={(e) => setUnladenMileage(Number(e.target.value))}
                className="dash-slider danger"
              />
              <div className="wb-range-labels mono">
                <span>8 km/L (Heavy load)</span>
                <span>12 km/L (Bolero SCV)</span>
                <span>18 km/L</span>
              </div>
            </div>

            <div className="wb-slider-group">
              <div className="wb-slider-hdr">
                <span className="wb-lbl">Monthly Operating Days</span>
                <span className="wb-val mono">{workingDays} days</span>
              </div>
              <input
                type="range"
                min="15"
                max="30"
                step="1"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="dash-slider danger"
              />
              <div className="wb-range-labels mono">
                <span>15 days</span>
                <span>25 days (Standard)</span>
                <span>30 days</span>
              </div>
            </div>

            <div className="cost-breakdown-box danger-bg">
              <div className="cb-row">
                <span>Daily Empty Distance:</span>
                <b className="mono">{returnKm} km</b>
              </div>
              <div className="cb-row">
                <span>Daily Diesel Consumed:</span>
                <b className="mono">{dailyDeadMileDieselLiters.toFixed(2)} Liters</b>
              </div>
              <div className="cb-row">
                <span>Daily Fuel Cost Wasted:</span>
                <b className="mono red-txt">₹{Math.round(dailyDeadMileCost)}</b>
              </div>
              <div className="cb-row bold-row">
                <span>Monthly Fuel Drain:</span>
                <b className="mono red-txt">₹{Math.round(monthlyDeadMileCost).toLocaleString()}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Backhaul Monetization Simulator */}
        <div className="dash-panel-card success-accent">
          <div className="dash-card-header">
            <div>
              <span className="dash-eyebrow-tag success">Backhaul Monetization Engine</span>
              <h3 className="card-title">Urban-to-Rural Freight Return Estimator</h3>
              <p className="card-subtitle">
                Filling trucks on return runs with input dealer seed, fertilizer, FMCG, and crates.
              </p>
            </div>
            <span className="chip MODELED">Backhaul: MODELED</span>
          </div>

          <div className="workbench-form">
            <div className="wb-slider-group">
              <div className="wb-slider-hdr">
                <span className="wb-lbl">Return Loads Filled per Month</span>
                <span className="wb-val mono hi">{backhaulTrips} return runs</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={backhaulTrips}
                onChange={(e) => setBackhaulTrips(Number(e.target.value))}
                className="dash-slider success"
              />
              <div className="wb-range-labels mono">
                <span>0 runs (0%)</span>
                <span>12 runs (~50%)</span>
                <span>25 runs (100%)</span>
              </div>
            </div>

            <div className="wb-slider-group">
              <div className="wb-slider-hdr">
                <span className="wb-lbl">Average Cargo Freight Rate</span>
                <span className="wb-val mono hi">₹{avgLoadFare} / run</span>
              </div>
              <input
                type="range"
                min="250"
                max="900"
                step="50"
                value={avgLoadFare}
                onChange={(e) => setAvgLoadFare(Number(e.target.value))}
                className="dash-slider success"
              />
              <div className="wb-range-labels mono">
                <span>₹250 (Light crates)</span>
                <span>₹500 (Fertilizer sacks)</span>
                <span>₹900 (Heavy FMCG)</span>
              </div>
            </div>

            <div className="cargo-type-selector">
              <span className="wb-lbl">Return Cargo Category Mix:</span>
              <div className="cargo-pills">
                {[
                  { id: 'all', label: 'Balanced Mix' },
                  { id: 'fert', label: 'Fertilizer & Seeds' },
                  { id: 'fmcg', label: 'Village Kirana FMCG' },
                  { id: 'crates', label: 'FPO Crates' },
                ].map((c) => (
                  <button
                    key={c.id}
                    className={`cargo-pill-btn${selectedCargo === c.id ? ' active' : ''}`}
                    onClick={() => setSelectedCargo(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cost-breakdown-box success-bg">
              <div className="cb-row">
                <span>Gross Backhaul Cargo Freight:</span>
                <b className="mono">₹{monthlyBackhaulGross.toLocaleString()}</b>
              </div>
              <div className="cb-row">
                <span>Platform Commission (8%):</span>
                <b className="mono">-₹{Math.round(platformFee)}</b>
              </div>
              <div className="cb-row bold-row">
                <span>Net Driver Backhaul Income:</span>
                <b className="mono hi">+₹{Math.round(monthlyBackhaulNet).toLocaleString()}</b>
              </div>
              <div className="cb-row">
                <span>Net Monthly Swing (vs Dead Miles):</span>
                <b className="mono hi">+₹{Math.round(netFinancialSwing).toLocaleString()}</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EMI Stress Test & Sensitivity Table */}
      <div className="dash-panel-card" style={{ marginTop: '16px' }}>
        <div className="dash-card-header">
          <div>
            <h3 className="card-title">Vehicle Loan EMI Sensitivity &amp; Security Matrix</h3>
            <p className="card-subtitle">
              Evaluating truck owner financial stability across varying monthly backhaul match rates.
            </p>
          </div>
          <div className="emi-control-hdr">
            <span>Target SCV Loan EMI:</span>
            <input
              type="range"
              min="10000"
              max="22000"
              step="1000"
              value={monthlyEmi}
              onChange={(e) => setMonthlyEmi(Number(e.target.value))}
              className="dash-slider inline"
            />
            <b className="mono hi">₹{monthlyEmi.toLocaleString()} / mo</b>
          </div>
        </div>

        <div className="table-responsive">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Backhaul Trips / Mo</th>
                <th>Backhaul Gross</th>
                <th>Net Backhaul Payout</th>
                <th>Forward Pooling Net</th>
                <th>Total Driver Net</th>
                <th>EMI (₹{monthlyEmi.toLocaleString()})</th>
                <th>Coverage %</th>
                <th>Driver Net Surplus</th>
              </tr>
            </thead>
            <tbody>
              {sensitivityRows.map((row) => (
                <tr
                  key={row.trips}
                  className={row.trips === backhaulTrips ? 'selected-row' : ''}
                >
                  <td className="mono bold">{row.trips} trips / mo</td>
                  <td className="mono">₹{row.gross.toLocaleString()}</td>
                  <td className="mono hi">₹{Math.round(row.net).toLocaleString()}</td>
                  <td className="mono">₹{monthlyForwardNet.toLocaleString()}</td>
                  <td className="mono bold hi">₹{Math.round(row.combined).toLocaleString()}</td>
                  <td className="mono">₹{monthlyEmi.toLocaleString()}</td>
                  <td className="mono">
                    <span className={`status-pill ${row.emiCover >= 100 ? 'green' : 'warn'}`}>
                      {row.emiCover}%
                    </span>
                  </td>
                  <td className={`mono bold ${row.netCashflow >= 0 ? 'hi' : 'danger-txt'}`}>
                    {row.netCashflow >= 0 ? '+' : ''}₹{Math.round(row.netCashflow).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
