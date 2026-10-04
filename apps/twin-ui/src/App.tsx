import { useEffect, useState } from 'react'
import Cascade from './components/Cascade'
import CorridorMap from './components/CorridorMap'
import MarginalCurve from './components/MarginalCurve'
import Pricing from './components/Pricing'
import Tension from './components/Tension'
import type { TwinData } from './types'
import './styles.css'

export default function App() {
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
      <div className="wrap">
        <h1>No data</h1>
        <p className="sub">
          twin.json is missing. Generate it with{' '}
          <code>python scripts/export_twin.py</code> in services/api.
        </p>
      </div>
    )
  }
  if (!data) return <div className="wrap"><p className="sub">Loading corridor…</p></div>

  const shared = data.branches.filter((b) => b.branch_size > 1)
  const branchCount = new Set(data.branches.map((b) => b.branch_id)).size

  return (
    <div className="wrap">
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
        regenerate with <code>python scripts/export_twin.py</code>
      </footer>
    </div>
  )
}
