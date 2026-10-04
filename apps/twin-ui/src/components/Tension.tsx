import { motion } from 'framer-motion'
import type { SweepRow } from '../types'

const W = 760
const H = 320
const PAD = 52

export default function Tension({ sweep }: { sweep: SweepRow[] }) {
  const pts = [...sweep].sort((a, b) => a.per_truck - b.per_truck)
  const maxRatio = Math.max(...pts.map((p) => p.per_truck))

  const x = (r: number) => PAD + (Math.log10(r + 1) / Math.log10(maxRatio + 1)) * (W - PAD * 2)
  const y = (v: number) => H - PAD - v * (H - PAD * 2)

  const line = (key: 'forward_fill_rate' | 'match_rate') =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.per_truck)},${y(p[key])}`).join(' ')

  const fiftyPct = pts.find((p) => p.forward_fill_rate >= 0.5)

  return (
    <section>
      <div className="sec-head">
        <h2>Your two targets compete</h2>
        <span className="chip SIMULATED">simulated</span>
      </div>
      <p className="sec-note">
        The brief targets <em>both</em> 50%+ of return legs carrying a load <em>and</em>{' '}
        1,500 smallholders served. Scarce trucks fill well but strand farmers; plentiful
        trucks serve everyone and mostly run unpooled. No configuration maximises both, so
        the plan has to say which it optimises.
      </p>

      <div className="panel">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={PAD} y1={y(v)} x2={W - PAD} y2={y(v)} stroke="var(--grid)" />
              <text x={PAD - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--ink-faint)">
                {(v * 100).toFixed(0)}%
              </text>
            </g>
          ))}

          <line
            x1={PAD} y1={y(0.5)} x2={W - PAD} y2={y(0.5)}
            stroke="var(--modeled)" strokeOpacity="0.45" strokeDasharray="5 4"
          />
          <text x={W - PAD} y={y(0.5) - 8} textAnchor="end" fontSize="11" fill="var(--modeled)">
            brief's 50% fill target
          </text>

          <motion.path
            d={line('forward_fill_rate')} fill="none" stroke="var(--real)" strokeWidth="2.5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1 }}
          />
          <motion.path
            d={line('match_rate')} fill="none" stroke="var(--accent)" strokeWidth="2.5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, delay: 0.2 }}
          />

          {pts.map((p) => (
            <g key={`${p.farmers}-${p.trucks}`}>
              <circle cx={x(p.per_truck)} cy={y(p.forward_fill_rate)} r="3.5" fill="var(--real)" />
              <circle cx={x(p.per_truck)} cy={y(p.match_rate)} r="3.5" fill="var(--accent)" />
            </g>
          ))}

          <text x={W / 2} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--ink-faint)">
            farmers per truck (log scale)
          </text>
        </svg>

        <div className="legend">
          <span><i style={{ background: 'var(--real)' }} />forward fill rate</span>
          <span><i style={{ background: 'var(--accent)' }} />lots matched</span>
        </div>

        {fiftyPct && (
          <div className="callout" style={{ background: 'rgba(240,180,41,0.07)', borderColor: 'rgba(240,180,41,0.22)', color: '#e6d8b4' }}>
            50% forward fill first appears around{' '}
            <strong>{fiftyPct.per_truck.toFixed(0)} farmers per truck</strong> — where only{' '}
            <strong>{(fiftyPct.match_rate * 100).toFixed(0)}%</strong> of lots find a
            truck. Hitting the fill target means leaving roughly{' '}
            {(100 - fiftyPct.match_rate * 100).toFixed(0)}% of farmers unserved.
          </div>
        )}
      </div>
    </section>
  )
}
