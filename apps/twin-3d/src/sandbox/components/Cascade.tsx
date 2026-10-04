import { motion } from 'framer-motion'
import type { Stage, Provenance } from '../types'

export default function Cascade({
  stages,
  confidence,
}: {
  stages: Stage[]
  confidence: Provenance
}) {
  return (
    <section>
      <div className="sec-head">
        <h2>Cascade — one simulated day, stage by stage</h2>
        <span className={`chip ${confidence}`}>chain confidence: {confidence}</span>
      </div>
      <p className="sec-note">
        Each stage derives from the one before it and carries its own provenance.
        Confidence is the weakest <em>evidenced</em> stage — a stage with no data is
        excluded rather than scored zero, so an absent backhaul market cannot drag down a
        routing result it has nothing to do with.
      </p>

      <div className="panel">
        {stages.map((s, i) => (
          <motion.div
            key={s.key}
            className={`stage${s.evidenced ? '' : ' unevidenced'}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: s.evidenced ? 1 : 0.5, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <div className="stage-n mono">{String(i + 1).padStart(2, '0')}</div>
            <div>
              <div className="stage-title">{s.headline}</div>
              <div className="stage-detail">{s.detail}</div>
            </div>
            <div className="stage-val">
              <b className="mono">
                {s.evidenced
                  ? `${s.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}`
                  : '—'}
              </b>
              <span>{s.evidenced ? s.unit : 'no evidence'}</span>
              <div style={{ marginTop: 6 }}>
                <span className={`chip ${s.evidenced ? s.provenance : 'none'}`}>
                  {s.evidenced ? s.provenance : 'excluded'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
