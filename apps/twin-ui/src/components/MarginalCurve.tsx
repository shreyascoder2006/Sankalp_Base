import { motion } from 'framer-motion'
import type { CurvePoint } from '../types'

export default function MarginalCurve({ curve }: { curve: CurvePoint[] }) {
  const max = Math.max(...curve.map((c) => c.km))
  const free = curve.filter((c) => c.stops > 0 && c.marginal_km < 1)

  return (
    <section>
      <div className="sec-head">
        <h2>Why pooling pays: the second stop is free</h2>
        <span className="chip REAL">measured</span>
      </div>
      <p className="sec-note">
        Leaving the trunk road costs a fixed detour. Every further pickup on the same
        branch is close to free. These are real road distances from the OpenStreetMap
        graph, validated against OSRM — not estimates.
      </p>

      <div className="panel">
        <div className="bars">
          {curve.map((c, i) => (
            <div className="bar-row" key={c.label}>
              <div className="bar-label">{c.label}</div>
              <div className="bar-track">
                <motion.div
                  className={`bar-fill${i > 0 && c.marginal_km < 1 ? ' free' : ''}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(c.km / max) * 100}%` }}
                  transition={{ duration: 0.75, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="bar-val mono">
                {c.km.toFixed(1)} km
                <span className="delta">
                  {i === 0 ? (
                    'baseline'
                  ) : c.marginal_km < 1 ? (
                    <span className="free">+{c.marginal_km.toFixed(2)} km — free</span>
                  ) : (
                    `+${c.marginal_km.toFixed(1)} km`
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {free.length > 0 && (
          <div className="callout">
            Adding <strong>{free[0].label.replace('+ ', '')}</strong> to a run that already
            stops on its branch costs <strong>{free[0].marginal_km.toFixed(2)} km</strong>.
            That reframes cold start: you do not need many farmers across the corridor, you
            need two or three on the same side road on the same morning.
          </div>
        )}
      </div>
    </section>
  )
}
