import { useEffect, useState } from 'react'
import Cascade from '../sandbox/components/Cascade'
import CorridorMap from '../sandbox/components/CorridorMap'
import MarginalCurve from '../sandbox/components/MarginalCurve'
import Pricing from '../sandbox/components/Pricing'
import Tension from '../sandbox/components/Tension'
import type { TwinData } from '../sandbox/types'
import '../sandbox/sandbox.css'

interface SandboxDashboardProps {
  onReturnTo3D: () => void
  onReturnToLanding: () => void
}

export default function SandboxDashboard({ onReturnTo3D, onReturnToLanding }: SandboxDashboardProps) {
  const [data, setData] = useState<TwinData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/twin.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])

  if (error) {
    return (
      <div className="corridor-sandbox-wrap">
        <div className="wrap">
          <div className="top-nav-bar">
            <button className="back-btn" onClick={onReturnTo3D}>
              ← Return to 3D Twin
            </button>
            <button className="back-btn" onClick={onReturnToLanding}>
              🌿 Monsoon Home
            </button>
          </div>
          <h1>No data</h1>
          <p className="sub">twin.json is missing.</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="corridor-sandbox-wrap">
        <div className="wrap">
          <p className="sub">Loading corridor sandbox…</p>
        </div>
      </div>
    )
  }

  const shared = data.branches.filter((b) => b.branch_size > 1)
  const branchCount = new Set(data.branches.map((b) => b.branch_id)).size

  return (
    <div className="corridor-sandbox-wrap">
      <div className="wrap">
        <div className="top-nav-bar">
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="back-btn" onClick={onReturnTo3D}>
              🌐 Return to 3D Simulation
            </button>
            <button className="back-btn" onClick={onReturnToLanding}>
              🌿 Monsoon Executive Dashboard
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8d9aad' }}>CORRIDOR SANDBOX (2D)</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3ddc97' }} />
          </div>
        </div>

        <header className="masthead">
          <div className="eyebrow">Uber for Harvest · corridor sandbox</div>
          <h1>{data.corridor.name}</h1>
          <p className="sub">
            A {data.corridor.trunk_km} km corridor modelled on real road geometry.{' '}
            {data.branches.length} settlements, {branchCount} detour branches, of which{' '}
            {new Set(shared.map((b) => b.branch_id)).size} support cheap pooling.
          </p>
        </header>

        <div className="banner">
          <div>
            <strong>This is a simulation, not a digital twin.</strong> Road geometry and the
            landholding distribution are real; farmer and driver behaviour are uncalibrated
            simulated parameters.{' '}
            {!data.calibrated && (
              <>
                The harvest model has <strong>not</strong> been validated against observed
                mandi arrivals — the Agmarknet API was unreachable from the build
                environment, so no backtest has run. Treat every volume, revenue and fill
                figure below as describing the model's assumptions rather than the corridor.
              </>
            )}
          </div>
        </div>

        <MarginalCurve curve={data.marginal_curve} />
        <CorridorMap data={data} />
        <Pricing sharing={data.sharing} economics={data.economics} />
        <Tension sweep={data.sweep} />
        <Cascade stages={data.cascade} confidence={data.cascade_confidence} />

        <footer className="foot">
          Road network &amp; settlements: {data.corridor.licence}. Routing distances
          validated against OSRM. Landholding distribution: Agriculture Census 2015-16.
          Farmer and driver behaviour: uncalibrated simulated parameters.
          <br />
          Generated <code>{new Date(data.generated_at).toLocaleString()}</code> ·
          Nashik-Pimpalgaon Horticultural Belt
        </footer>
      </div>
    </div>
  )
}
