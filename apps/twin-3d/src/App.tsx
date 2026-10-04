import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useEffect, useMemo, useRef, useState } from 'react'
import RefusalTrace from './scene/RefusalTrace'
import SceneBoundary from './scene/SceneBoundary'
import Roads from './scene/Roads'
import Terrain from './scene/Terrain'
import Trucks from './scene/Trucks'
import Villages from './scene/Villages'
import { Projection } from './scene/projection'
import type { SceneData } from './scene/types'
import './styles.css'

const DAY_START_HOUR = 4

function clock(min: number) {
  const total = DAY_START_HOUR * 60 + min
  const h = Math.floor(total / 60) % 24
  const m = Math.floor(total % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function Ticker({
  playing,
  speed,
  horizon,
  onTick,
}: {
  playing: boolean
  speed: number
  horizon: number
  onTick: (v: number) => void
}) {
  // Simulated minutes advance per real second; a full day compresses to about a minute.
  useFrame((_, dt) => {
    if (!playing) return
    onTick(dt * speed * 60)
  })
  void horizon
  return null
}

export default function App() {
  const [data, setData] = useState<SceneData | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [now, setNow] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(4)
  const [truck, setTruck] = useState<string | null>(null)
  const [village, setVillage] = useState<string | null>(null)
  const [showRefusals, setShowRefusals] = useState(true)
  const nowRef = useRef(0)

  useEffect(() => {
    fetch('/scene.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e) => setErr(String(e)))
  }, [])

  const proj = useMemo(() => (data ? new Projection(data) : null), [data])

  const advance = (delta: number) => {
    if (!data) return
    nowRef.current = (nowRef.current + delta) % data.horizon_min
    setNow(nowRef.current)
  }

  if (err) return <div className="loading">scene.json missing — run scripts/export_scene.py</div>
  if (!data || !proj) return <div className="loading">loading corridor…</div>

  const active = data.trips.filter((t) => now >= t.depart_min && now <= t.arrive_min)
  const lifted = data.trips.flatMap((t) => t.stops).filter((s) => now >= s.arrive_min)
  const kg = lifted.reduce((a, s) => a + s.load_kg, 0)
  const sel = data.trips.find((t) => t.truck_id === truck)
  const vill = data.villages.find((v) => v.key === village)
  const span = proj.widthUnits

  return (
    <>
      <SceneBoundary>
      <Canvas
        shadows
        camera={{ position: [span * 0.5, span * 0.62, span * 0.88], fov: 40, far: 9000 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#05080c']} />
        <fog attach="fog" args={['#05080c', span * 1.1, span * 3.2]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[120, 180, 60]} intensity={1.1} castShadow />
        <hemisphereLight args={['#2b4a63', '#070b10', 0.5]} />
        <Stars radius={900} depth={120} count={2600} factor={5} fade speed={0.4} />

        <Ticker playing={playing} speed={speed} horizon={data.horizon_min} onTick={advance} />

        <Terrain proj={proj} />
        <Roads data={data} proj={proj} />
        <Villages data={data} proj={proj} now={now} onPick={setVillage} />
        <Trucks data={data} proj={proj} now={now} selected={truck} onPick={setTruck} />
        {showRefusals &&
          data.refusals.map((r) => <RefusalTrace key={r.point_key} refusal={r} proj={proj} />)}

        <OrbitControls
          enableDamping dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={span * 0.12} maxDistance={span * 2.6}
        />
        <EffectComposer>
          <Bloom intensity={0.75} luminanceThreshold={0.22} luminanceSmoothing={0.9} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.75} />
        </EffectComposer>
      </Canvas>
      </SceneBoundary>

      <div className="hud">
        <div className="panel topleft">
          <div className="eyebrow">Uber for Harvest · live corridor</div>
          <div className="title">{data.corridor.name}</div>
          <div className="sub">
            Day {data.day}. Trucks follow the real road the matching engine chose, over real
            terrain. Amber columns are tonnage waiting; they drain as trucks collect.
          </div>
          <div className="chips">
            <span className="chip REAL">roads REAL</span>
            <span className={`chip ${data.terrain.provenance}`}>terrain {data.terrain.provenance}</span>
            <span className="chip REAL">routes REAL</span>
            <span className="chip SIMULATED">behaviour SIMULATED</span>
            <span className="chip MODELED">relief &times;20</span>
          </div>
        </div>

        <div className="panel topright">
          <div className="stat"><span>time</span><b className="mono">{clock(now)}</b></div>
          <div className="stat"><span>trucks moving</span><b className="mono">{active.length}</b></div>
          <div className="stat"><span>pickups done</span><b className="mono">{lifted.length}</b></div>
          <div className="stat"><span>collected</span><b className="mono">{(kg / 1000).toFixed(2)} t</b></div>
          <div className="stat"><span>refused</span><b className="mono" style={{ color: 'var(--danger)' }}>{data.refusals.length}</b></div>
        </div>

        {(sel || vill) && (
          <div className="panel inspect">
            {sel ? (
              <>
                <h4>{sel.truck_id}</h4>
                <div className="row"><span>route</span><b className="mono">{sel.distance_km} km</b></div>
                <div className="row"><span>detour</span><b className="mono">+{sel.detour_km} km</b></div>
                <div className="row"><span>carrying</span><b className="mono">{sel.served_kg} kg</b></div>
                {sel.stops.map((s, i) => (
                  <div className="row" key={`${s.point_key}-${i}`}>
                    <span>{s.name}{s.shares_branch && <span className="free"> · shared</span>}</span>
                    <b className="mono">{s.load_kg} kg · &#8377;{s.fare.toFixed(0)}</b>
                  </div>
                ))}
              </>
            ) : vill ? (
              <>
                <h4>{vill.name}</h4>
                <div className="row"><span>solo detour</span><b className="mono">{vill.solo_detour_km} km</b></div>
                <div className="row">
                  <span>branch</span>
                  <b className="mono">
                    {vill.branch_size > 1 ? <span className="free">shared ×{vill.branch_size}</span> : 'isolated'}
                  </b>
                </div>
              </>
            ) : null}
          </div>
        )}

        <div className="panel bottom">
          <div className="clock">
            <button className="btn" onClick={() => setPlaying((p) => !p)}>
              {playing ? '❚❚ pause' : '▶ play'}
            </button>
            <div className="time mono">{clock(now)}</div>
            <input
              type="range" min={0} max={data.horizon_min} step={0.5} value={now}
              onChange={(e) => { nowRef.current = +e.target.value; setNow(+e.target.value) }}
            />
            {[1, 4, 12].map((s) => (
              <button key={s} className={`btn${speed === s ? ' on' : ''}`} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
            <button className={`btn${showRefusals ? ' on' : ''}`} onClick={() => setShowRefusals((v) => !v)}>
              refusals
            </button>
          </div>

          <div className="ticks">
            {data.trips.flatMap((t) =>
              t.stops.map((s, i) => (
                <div
                  key={`${t.truck_id}-${s.point_key}-${i}`}
                  className={`tick ${s.shares_branch ? 'shared' : 'pickup'}`}
                  style={{ left: `${(s.arrive_min / data.horizon_min) * 100}%` }}
                  title={`${s.name} ${clock(s.arrive_min)}`}
                />
              )),
            )}
          </div>

          <div className="legend">
            <span><i style={{ background: 'var(--real)' }} />pickup</span>
            <span><i style={{ background: 'var(--modeled)' }} />shared branch · waiting tonnage</span>
            <span><i style={{ background: 'var(--danger)' }} />unserved — reason shown on the trace</span>
            <span>drag to orbit · scroll to zoom · hover a truck or village</span>
          </div>
        </div>
      </div>
    </>
  )
}
