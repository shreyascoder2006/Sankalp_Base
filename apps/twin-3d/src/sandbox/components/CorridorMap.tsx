import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Branch, TwinData } from '../types'

const W = 1000
const H = 520
const PAD = 54

export default function CorridorMap({ data }: { data: TwinData }) {
  const [hover, setHover] = useState<Branch | null>(null)
  const anchors = data.points.filter((p) => !p.key.startsWith('v'))
  const all = [...data.branches, ...anchors.map((a) => ({ ...a, branch_id: -1 }))]

  const lons = all.map((p) => p.lon)
  const lats = all.map((p) => p.lat)
  const [lo, hi] = [Math.min(...lons), Math.max(...lons)]
  const [la, ha] = [Math.min(...lats), Math.max(...lats)]

  // Equirectangular; over one corridor the distortion is far below what matters here.
  const x = (lon: number) => PAD + ((lon - lo) / (hi - lo || 1)) * (W - PAD * 2)
  const y = (lat: number) => H - PAD - ((lat - la) / (ha - la || 1)) * (H - PAD * 2)

  const shared = data.branches.filter((b) => b.branch_size > 1)
  const sharedIds = new Set(shared.map((b) => b.branch_id))
  const origin = anchors.find((a) => a.key === 'pimpalgaon')
  const dest = anchors.find((a) => a.key === 'nashik_apmc')

  return (
    <section>
      <div className="sec-head">
        <h2>Corridor</h2>
        <span className="chip REAL">real coordinates</span>
      </div>
      <p className="sec-note">
        Every settlement OpenStreetMap maps on this corridor, positioned by its real
        coordinates. Green means the village shares a branch with a neighbour, so pooling
        is cheap there. Grey means it is isolated — reaching it costs a dedicated detour.
      </p>

      <div className="panel map-wrap">
        <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Corridor map">
          <defs>
            <pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M50 0H0V50" fill="none" stroke="var(--grid)" strokeWidth="1" />
            </pattern>
            <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5b9dff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#3ddc97" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#g)" />

          {origin && dest && (
            <motion.line
              x1={x(origin.lon)} y1={y(origin.lat)} x2={x(dest.lon)} y2={y(dest.lat)}
              stroke="url(#trunk)" strokeWidth="2.5" strokeDasharray="7 5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }}
            />
          )}

          {shared.map((b) => {
            const mates = data.branches.filter(
              (o) => o.branch_id === b.branch_id && o.key !== b.key,
            )
            return mates.map((m) => (
              <line
                key={`${b.key}-${m.key}`}
                x1={x(b.lon)} y1={y(b.lat)} x2={x(m.lon)} y2={y(m.lat)}
                stroke="var(--real)" strokeOpacity="0.3" strokeWidth="1.5"
              />
            ))
          })}

          {data.branches.map((b, i) => {
            const isShared = sharedIds.has(b.branch_id)
            const r = 5 + Math.min(b.solo_detour_km / 6, 6)
            return (
              <motion.g
                key={b.key}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.03, duration: 0.4 }}
                onMouseEnter={() => setHover(b)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={x(b.lon)} cy={y(b.lat)} r={r}
                  fill={isShared ? 'rgba(61,220,151,0.22)' : 'rgba(123,134,153,0.16)'}
                  stroke={isShared ? 'var(--real)' : 'var(--simulated)'}
                  strokeWidth={hover?.key === b.key ? 2.4 : 1.2}
                />
                <text
                  x={x(b.lon)} y={y(b.lat) - r - 6} textAnchor="middle"
                  fontSize="11" fill={isShared ? '#bfe9d5' : 'var(--ink-faint)'}
                >
                  {b.name}
                </text>
              </motion.g>
            )
          })}

          {[origin, dest].map(
            (a) =>
              a && (
                <g key={a.key}>
                  <rect
                    x={x(a.lon) - 6} y={y(a.lat) - 6} width="12" height="12"
                    fill="var(--accent)" stroke="#fff" strokeOpacity="0.5" transform={`rotate(45 ${x(a.lon)} ${y(a.lat)})`}
                  />
                  <text x={x(a.lon)} y={y(a.lat) + 24} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">
                    {a.name}
                  </text>
                </g>
              ),
          )}
        </svg>

        <div className="legend">
          <span><i style={{ background: 'var(--real)' }} />shares a branch — pooling is cheap</span>
          <span><i style={{ background: 'var(--simulated)' }} />isolated — dedicated detour</span>
          <span className="dim">circle size = solo detour cost</span>
          {hover && (
            <span className="mono" style={{ color: 'var(--ink)' }}>
              {hover.name}: {hover.solo_detour_km.toFixed(1)} km solo
              {hover.branch_size > 1 && `, branch of ${hover.branch_size}`}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
