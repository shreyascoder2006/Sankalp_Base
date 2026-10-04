import { useState, useMemo } from 'react'
import type { TwinData } from '../scene/types'
import { readEcon } from './pricing'

interface DriverEconPanelProps {
  data: TwinData
}

export default function DriverEconPanel({ data }: DriverEconPanelProps) {
  const econ = useMemo(() => readEcon(data.economics), [data.economics])

  // Dead mile calculator inputs
  const [returnKm, setReturnKm] = useState<number>(50)
  const [mileageKmpl, setMileageKmpl] = useState<number>(12)
  const [workingDays, setWorkingDays] = useState<number>(25)

  // Backhaul earnings inputs
  const [backhaulLoads, setBackhaulLoads] = useState<number>(12)
  const [avgLoadFare, setAvgLoadFare] = useState<number>(500)

  // EMI settings
  const [monthlyEmi, setMonthlyEmi] = useState<number>(15000)

  // Calculations
  const dailyDeadMileDieselCost = useMemo(() => {
    return (returnKm / mileageKmpl) * econ.dieselPricePerL
  }, [returnKm, mileageKmpl, econ.dieselPricePerL])

  const monthlyDeadMileCost = dailyDeadMileDieselCost * workingDays

  const monthlyBackhaulGross = backhaulLoads * avgLoadFare
  const platformBackhaulFee = monthlyBackhaulGross * econ.platformFeePct
  const monthlyBackhaulNet = monthlyBackhaulGross - platformBackhaulFee

  // Forward trip net earnings estimate (typical SCV driver net earnings after fuel)
  const monthlyForwardNet = workingDays * 650 // approx ~₹650 net profit/day from forward harvest pooling

  const totalMonthlyNetEarnings = monthlyForwardNet + monthlyBackhaulNet
  const emiCoveragePct = Math.min(250, Math.round((totalMonthlyNetEarnings / monthlyEmi) * 100))

  return (
    <div className="driver-econ">
      {/* 1. Dead Mile Waste Box */}
      <div className="econ-section-box waste-box">
        <div className="section-eyebrow danger">The Dead Mile Problem</div>
        <h4 className="section-heading">Monthly Fuel Burned Empty</h4>
        <div className="big-stat-row">
          <div className="big-stat danger mono">
            ₹{Math.round(monthlyDeadMileCost).toLocaleString()}
          </div>
          <span className="stat-qualifier">wasted diesel per month</span>
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-title">Empty Return Distance</span>
            <span className="slider-val mono">{returnKm} km</span>
          </div>
          <input
            type="range"
            min="20"
            max="80"
            step="5"
            value={returnKm}
            onChange={(e) => setReturnKm(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-title">Pickup Mileage (Empty)</span>
            <span className="slider-val mono">{mileageKmpl} km/L</span>
          </div>
          <input
            type="range"
            min="8"
            max="18"
            step="1"
            value={mileageKmpl}
            onChange={(e) => setMileageKmpl(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-title">Working Days / Month</span>
            <span className="slider-val mono">{workingDays} days</span>
          </div>
          <input
            type="range"
            min="15"
            max="30"
            step="1"
            value={workingDays}
            onChange={(e) => setWorkingDays(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="econ-sub-note">
          At ₹{econ.dieselPricePerL.toFixed(2)}/L diesel, that is {(monthlyDeadMileCost / econ.dieselPricePerL).toFixed(0)} liters burned hauling air.
        </div>
      </div>

      {/* 2. Backhaul Fill Opportunity */}
      <div className="econ-section-box opportunity-box">
        <div className="section-eyebrow success">Uber for Harvest Solution</div>
        <h4 className="section-heading">Backhaul Fill Earnings</h4>
        <div className="big-stat-row">
          <div className="big-stat success mono">
            +₹{Math.round(monthlyBackhaulNet).toLocaleString()}
          </div>
          <span className="stat-qualifier">net backhaul income / mo</span>
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-title">Backhauls Matched / Month</span>
            <span className="slider-val mono">{backhaulLoads} trips</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="1"
            value={backhaulLoads}
            onChange={(e) => setBackhaulLoads(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-title">Avg Return Load Fare</span>
            <span className="slider-val mono">₹{avgLoadFare}</span>
          </div>
          <input
            type="range"
            min="250"
            max="900"
            step="50"
            value={avgLoadFare}
            onChange={(e) => setAvgLoadFare(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="backhaul-cargo-chips">
          <span className="cargo-chip">Fertilizer bags</span>
          <span className="cargo-chip">Seed sacks</span>
          <span className="cargo-chip">FMCG / Kirana</span>
          <span className="cargo-chip">Crates</span>
        </div>
      </div>

      {/* 3. EMI Coverage Gauge */}
      <div className="econ-section-box emi-box">
        <div className="section-eyebrow highlight">Vehicle Financing Security</div>
        <h4 className="section-heading">Truck EMI Coverage</h4>

        <div className="emi-gauge-container">
          <div className="gauge-bar-track">
            <div
              className={`gauge-bar-fill ${emiCoveragePct >= 100 ? 'covered' : 'partial'}`}
              style={{ width: `${Math.min(100, (emiCoveragePct / 150) * 100)}%` }}
            />
          </div>
          <div className="gauge-labels mono">
            <span>0%</span>
            <span className="marker-100">100% EMI</span>
            <span>150%+</span>
          </div>
        </div>

        <div className="emi-summary-row">
          <div>
            <div className="lbl">Combined Net Monthly</div>
            <div className="val mono hi">₹{Math.round(totalMonthlyNetEarnings).toLocaleString()}</div>
          </div>
          <div>
            <div className="lbl">SCV Target EMI</div>
            <div className="val mono">₹{monthlyEmi.toLocaleString()}</div>
          </div>
          <div>
            <div className="lbl">Coverage</div>
            <div className={`val mono bold ${emiCoveragePct >= 100 ? 'hi' : 'warn'}`}>
              {emiCoveragePct}%
            </div>
          </div>
        </div>

        <div className="slider-group" style={{ marginTop: '12px' }}>
          <div className="slider-header">
            <span className="slider-title">Monthly Vehicle EMI</span>
            <span className="slider-val mono">₹{monthlyEmi.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="8000"
            max="22000"
            step="1000"
            value={monthlyEmi}
            onChange={(e) => setMonthlyEmi(Number(e.target.value))}
            className="slider"
          />
        </div>
      </div>

      <div className="provenance-footnote">
        <span className="chip REAL">Diesel: ₹{econ.dieselPricePerL.toFixed(2)} REAL</span>
        <span className="chip MODELED">Backhaul MODELED</span>
      </div>
    </div>
  )
}
