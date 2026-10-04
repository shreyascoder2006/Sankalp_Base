import { Environment } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Anchors from './scene/Anchors'
import CameraRig, { type Focus } from './scene/CameraRig'
import Markers from './scene/Markers'
import Roads from './scene/Roads'
import SceneBoundary from './scene/SceneBoundary'
import Terrain from './scene/Terrain'
import Truck from './scene/Truck'
import UnservedTrace from './scene/UnservedTrace'
import { Projection } from './scene/projection'
import type { Scenario, TwinData } from './scene/types'
import './styles.css'

const rupee = (n: number) => `₹${Math.round(n).toLocaleString()}`

function clock(min: number) {
  const total = 4 * 60 + min
  const h = Math.floor(total / 60) % 24
  const m = Math.floor(total % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function Ticker({
  playing,
  speed,
  onTick,
}: {
  playing: boolean
  speed: number
  onTick: (d: number) => void
}) {
  useFrame((_, dt) => {
    if (playing) onTick(dt * speed * 20)
  })
  return null
}

export default function App() {
  const [data, setData] = useState<TwinData | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [idx, setIdx] = useState(0)
  const [now, setNow] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [focus, setFocus] = useState<Focus>({ kind: 'overview' })
  const nowRef = useRef(0)

  useEffect(() => {
    fetch('/scenarios.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e) => setErr(String(e)))
  }, [])

  useEffect(() => {
    nowRef.current = 0
    setNow(0)
    setPlaying(true)
    setFocus({ kind: 'overview' })
  }, [idx])

  const proj = useMemo(() => (data ? new Projection(data) : null), [data])
  const scenario: Scenario | null = data ? (data.scenarios[idx] ?? null) : null

  if (err) {
    return <div className="loading">scenarios.json missing — run scripts/export_scenarios.py</div>
  }
  if (!data || !proj || !scenario) return <div className="loading">loading corridor…</div>

  const advance = (d: number) => {
    const h = scenario.horizon_min + 20
    nowRef.current = (nowRef.current + d) % h
    setNow(nowRef.current)
  }

  const selectedTrip =
    focus.kind === 'truck' ? scenario.trips.find((t) => t.truck_id === focus.id) : undefined
  const picked = scenario.trips.flatMap((t) => t.stops).filter((s) => now >= s.arrive_min)
  const f = scenario.facts

  return (
    <>
      <SceneBoundary>
        <Canvas
          shadows
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ position: [160, 190, 270], fov: 38, near: 0.5, far: 12000 }}
          onPointerMissed={() => setFocus({ kind: 'overview' })}
        >
          <color attach="background" args={['#05080c']} />
          <fog attach="fog" args={['#05080c', proj.widthUnits * 1.2, proj.widthUnits * 3.4]} />

          <hemisphereLight args={['#9fb6d4', '#0b1016', 0.55]} />
          <directionalLight
            position={[160, 230, 110]}
            intensity={1.25}
            color="#e4ecf8"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-260}
            shadow-camera-right={260}
            shadow-camera-top={260}
            shadow-camera-bottom={-260}
            shadow-bias={-0.0005}
          />

          <Ticker playing={playing} speed={speed} onTick={advance} />

          {/* Environment fetches an HDR from a CDN. It sits in its own boundary because
              a decorative light probe must never gate the scene: sharing one Suspense
              with the terrain, trucks and ticker meant a stalled fetch left the whole
              canvas black and the clock frozen, with nothing thrown to show why. */}
          <Suspense fallback={null}>
            <Environment preset="night" environmentIntensity={0.3} />
          </Suspense>

          <Suspense fallback={null}>
            <Terrain proj={proj} />
            <Roads data={data} proj={proj} />
            <Anchors corridor={data.corridor} proj={proj} />
            <Markers
              scenario={scenario}
              villages={data.villages}
              proj={proj}
              now={now}
              onVillage={(key) => setFocus({ kind: 'village', key })}
            />
            {scenario.trips.map((t) => (
              <Truck
                key={t.truck_id}
                trip={t}
                proj={proj}
                now={now}
                selected={focus.kind === 'truck' && focus.id === t.truck_id}
                dimmed={focus.kind === 'truck' && focus.id !== t.truck_id}
                onSelect={(id) => setFocus({ kind: 'truck', id })}
              />
            ))}
            {scenario.unserved.map((u) => (
              <UnservedTrace key={u.point_key} unserved={u} proj={proj} />
            ))}
            <EffectComposer multisampling={4}>
              <Bloom
                luminanceThreshold={0.6}
                luminanceSmoothing={0.3}
                intensity={0.85}
                mipmapBlur
              />
              <Vignette eskil={false} offset={0.22} darkness={0.78} />
            </EffectComposer>
          </Suspense>

          <CameraRig
            focus={focus}
            scenario={scenario}
            villages={data.villages}
            proj={proj}
            playing={playing}
          />
        </Canvas>
      </SceneBoundary>

      <div className="hud">
        <div className="panel scenarios">
          <div className="eyebrow">Scenarios</div>
          {data.scenarios.map((s, i) => (
            <button key={s.key} className={`scn${i === idx ? ' on' : ''}`} onClick={() => setIdx(i)}>
              <span className="scn-n mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="scn-txt">
                <b>{s.title}</b>
                <i>
                  {s.facts.served} served
                  {s.facts.unserved > 0 && ` · ${s.facts.unserved} unserved`}
                </i>
              </span>
            </button>
          ))}
          <div className="chips">
            <span className="chip REAL">roads &amp; routes REAL</span>
            <span className="chip MODELED">fares MODELED</span>
            <span className="chip MODELED">relief &times;20</span>
          </div>
        </div>

        <div className="panel brief">
          <div className="eyebrow">{data.corridor.name}</div>
          <h2>{scenario.title}</h2>
          <p className="q">{scenario.question}</p>

          <div className="facts">
            <div>
              <span>full-truck hire</span>
              <b className="mono">{rupee(f.full_truck_fare)}</b>
            </div>
            {f.served > 0 && (
              <>
                <div>
                  <span>cheapest pooled fare</span>
                  <b className="mono hi">{rupee(f.cheapest_fare)}</b>
                </div>
                <div>
                  <span>saving</span>
                  <b className="mono hi">{Math.round(f.saving_vs_full_truck * 100)}%</b>
                </div>
              </>
            )}
            {f.detour_km > 0 && (
              <div>
                <span>detour driven</span>
                <b className="mono">{f.detour_km} km</b>
              </div>
            )}
          </div>

          {scenario.unserved.map((u) => (
            <div className={`verdict ${u.reason.replace(/\s/g, '-')}`} key={u.point_key}>
              <b>
                {u.farmer} goes unserved — {u.reason}
              </b>
              <span>{u.detail}</span>
            </div>
          ))}

          <p className="take">{scenario.takeaway}</p>
        </div>

        {selectedTrip && (
          <div className="panel inspect">
            <div className="eyebrow">Following</div>
            <h4>{selectedTrip.truck_id}</h4>
            <div className="row">
              <span>route</span>
              <b className="mono">{selectedTrip.distance_km} km</b>
            </div>
            <div className="row">
              <span>detour off trunk</span>
              <b className="mono">+{selectedTrip.detour_km} km</b>
            </div>
            <div className="row">
              <span>spare used</span>
              <b className="mono">
                {selectedTrip.served_kg} / {selectedTrip.spare_kg} kg
              </b>
            </div>
            {selectedTrip.stops.map((s, i) => (
              <div className="row" key={`${s.point_key}-${i}`}>
                <span>
                  {s.name}
                  {s.shares_branch && <em> shared</em>}
                </span>
                <b className="mono">
                  {s.load_kg} kg · {rupee(s.fare)}
                </b>
              </div>
            ))}
            <button className="btn wide" onClick={() => setFocus({ kind: 'overview' })}>
              back to overview
            </button>
          </div>
        )}

        <div className="panel bottom">
          <div className="clock">
            <button className="btn" onClick={() => setPlaying((p) => !p)}>
              {playing ? '❚❚' : '▶'}
            </button>
            <div className="time mono">{clock(now)}</div>
            <input
              type="range"
              min={0}
              max={scenario.horizon_min + 20}
              step={0.5}
              value={now}
              onChange={(e) => {
                nowRef.current = +e.target.value
                setNow(+e.target.value)
              }}
            />
            {[1, 3, 8].map((s) => (
              <button
                key={s}
                className={`btn${speed === s ? ' on' : ''}`}
                onClick={() => setSpeed(s)}
              >
                {s}×
              </button>
            ))}
            <div className="picked mono">
              {picked.length}/{f.served} collected
            </div>
          </div>
          <div className="legend">
            <span>
              click a truck to follow it · click a village to inspect · scroll zooms toward the
              cursor · click empty space to pull back
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
