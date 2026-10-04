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
import NavRail, { type NavTab } from './hud/NavRail'
import MonsoonHeader from './hud/MonsoonHeader'
import ScenariosPanel from './hud/ScenariosPanel'
import AnalyticsDashboard from './dashboards/AnalyticsDashboard'
import DriverEconDashboard from './dashboards/DriverEconDashboard'
import FarmerPricingDashboard from './dashboards/FarmerPricingDashboard'
import WhatsAppBotDashboard from './dashboards/WhatsAppBotDashboard'
import SettlementExplorerDashboard from './dashboards/SettlementExplorerDashboard'
import SandboxDashboard from './dashboards/SandboxDashboard'
import LandingPage from './landing/LandingPage'
import { RealisticTruckIcon } from './scene/realisticIcons'
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

const getInitialTab = (): NavTab => {
  const hash = typeof window !== 'undefined' ? window.location.hash.toLowerCase() : ''
  if (hash.includes('simulation') || hash.includes('twin') || hash.includes('3d') || hash.includes('scenario')) {
    return 'scenarios'
  }
  if (hash.includes('sandbox')) return 'sandbox'
  if (hash.includes('analytics')) return 'analytics'
  if (hash.includes('driver')) return 'driver'
  if (hash.includes('farmer')) return 'farmer'
  if (hash.includes('chat') || hash.includes('bot') || hash.includes('voice')) return 'chat'
  if (hash.includes('village') || hash.includes('settlement')) return 'villages'
  if (hash.includes('landing') || hash.includes('monsoon')) return 'landing'
  // Default directly to the Monsoon Executive Dashboard
  return 'landing'
}

export default function App() {
  const [data, setData] = useState<TwinData | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [idx, setIdx] = useState(1)
  const [now, setNow] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(0.5)
  const [focus, setFocus] = useState<Focus>({ kind: 'overview' })
  const [zoomFactor, setZoomFactor] = useState(1.15)
  const [briefCollapsed, setBriefCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<NavTab | null>(getInitialTab)
  const nowRef = useRef(0)

  const handleZoomIn = () => setZoomFactor((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))
  const handleZoomOut = () => setZoomFactor((z) => Math.min(3.5, Math.round((z + 0.35) * 100) / 100))
  const handleSetZoomPreset = (factor: number) => setZoomFactor(factor)

  useEffect(() => {
    if (activeTab) {
      if (activeTab === 'landing') {
        window.location.hash = 'monsoon'
      } else if (activeTab === 'scenarios') {
        window.location.hash = 'simulation'
      } else {
        window.location.hash = activeTab
      }
    }
  }, [activeTab])

  useEffect(() => {
    const handleHash = () => {
      const tab = getInitialTab()
      setActiveTab(tab)
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  useEffect(() => {
    fetch('/scenarios.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        setData(d)
        // Default to zoomed-out overview and paused state
        setFocus({ kind: 'overview' })
        setPlaying(false)
      })
      .catch((e) => setErr(String(e)))
  }, [])

  useEffect(() => {
    nowRef.current = 0
    setNow(0)
    setPlaying(false)
    setZoomFactor(1.15)
    setFocus({ kind: 'overview' })
  }, [idx])

  const proj = useMemo(() => (data ? new Projection(data) : null), [data])
  const scenario: Scenario | null = data ? (data.scenarios[idx] ?? null) : null

  // Fast direct render for views that don't depend on scenarios.json
  if (activeTab === 'landing') {
    return (
      <>
        <LandingPage
          onLaunchTwin={() => {
            setActiveTab('scenarios')
            setFocus({ kind: 'overview' })
            setPlaying(false)
          }}
          onSelectTab={(tab) => setActiveTab(tab)}
        />
        <NavRail active={activeTab} onSelect={setActiveTab} />
      </>
    )
  }

  if (activeTab === 'sandbox') {
    return (
      <>
        <SandboxDashboard
          onReturnTo3D={() => setActiveTab('scenarios')}
          onReturnToLanding={() => setActiveTab('landing')}
        />
        <NavRail active={activeTab} onSelect={setActiveTab} />
      </>
    )
  }

  if (activeTab === 'chat') {
    return (
      <>
        <WhatsAppBotDashboard
          onFocusVillage={(key) => {
            setActiveTab('scenarios')
            setFocus({ kind: 'village', key })
          }}
          onFocusTruck={(id) => {
            setActiveTab('scenarios')
            setFocus({ kind: 'truck', id })
          }}
          onReturnTo3D={() => setActiveTab('scenarios')}
        />
        <NavRail active={activeTab} onSelect={setActiveTab} />
      </>
    )
  }

  if (err) {
    return (
      <div className="loading" style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
        <div>scenarios.json missing — run scripts/export_scenarios.py</div>
        <button className="btn" onClick={() => setActiveTab('landing')}>
          🌿 View KrishiSetu Dashboard
        </button>
      </div>
    )
  }

  if (!data || !proj || !scenario) {
    return (
      <div className="loading" style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
        <div>Loading corridor simulation…</div>
        <button className="btn" onClick={() => setActiveTab('landing')}>
          🌿 View KrishiSetu Dashboard
        </button>
      </div>
    )
  }

  const advance = (d: number) => {
    const h = scenario.horizon_min + 20
    nowRef.current = (nowRef.current + d) % h
    setNow(nowRef.current)
  }

  const handleStartSimulation = () => {
    nowRef.current = 0
    setNow(0)
    setPlaying(true)
  }

  const handleToggleFollowTruck = () => {
    if (focus.kind === 'truck') {
      setFocus({ kind: 'overview' })
    } else if (scenario && scenario.trips.length > 0) {
      setFocus({ kind: 'truck', id: scenario.trips[0].truck_id })
    }
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
          camera={{ position: [200, 270, 350], fov: 38, near: 0.5, far: 15000 }}
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
            zoomFactor={zoomFactor}
          />
        </Canvas>
      </SceneBoundary>

      <NavRail active={activeTab} onSelect={setActiveTab} />

      {/* Top Monsoon Platform Header Bar */}
      {activeTab === 'scenarios' && (
        <MonsoonHeader
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          corridorName={data.corridor.name}
          playing={playing}
          onStartSimulation={handleStartSimulation}
        />
      )}

      {/* 3D Simulation HUD (active when 3D tab is selected) */}
      {activeTab === 'scenarios' && (
        <div className="hud">
          {/* Quick Simulation & Truck Tracking Controls */}
          <div className="sim-control-banner">
            <button
              className="btn sim-start-btn"
              onClick={handleStartSimulation}
              title="Start physical simulation: watch truck drive from Pimpalgaon to Nashik APMC"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: '1px solid #34d399',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.45)',
                fontWeight: 700,
              }}
            >
              <span className="sim-pulse-dot" />
              <span>▶ Start Simulation</span>
            </button>
            <button
              className={`btn sim-cam-btn${focus.kind === 'truck' ? ' on' : ''}`}
              onClick={handleToggleFollowTruck}
              title={focus.kind === 'truck' ? 'Camera is currently locked onto truck' : 'Follow large truck with chase camera'}
            >
              <span>{focus.kind === 'truck' ? '🎥 Following Truck (Chase Cam)' : '🎥 Follow Large Truck'}</span>
            </button>
            <button
              className={`btn sim-cam-btn${focus.kind === 'overview' ? ' on' : ''}`}
              onClick={() => setFocus({ kind: 'overview' })}
              title="Reset to whole corridor overview"
            >
              <span>🌐 Overview</span>
            </button>

            {/* Dedicated Zoom Out / In Quick Options */}
            <button
              className={`btn sim-cam-btn${zoomFactor > 1.15 ? ' on' : ''}`}
              onClick={handleZoomOut}
              title="Zoom out: pull camera further back for wide landscape perspective"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <span>🔭 Zoom Out</span>
              {zoomFactor > 1.05 && (
                <span style={{ fontSize: '10.5px', color: '#ffd166' }}>
                  ({zoomFactor.toFixed(1)}×)
                </span>
              )}
            </button>
            <button
              className="btn sim-cam-btn"
              onClick={handleZoomIn}
              title="Zoom closer in"
              style={{ padding: '8px 11px' }}
            >
              <span>🔍+</span>
            </button>
            {Math.abs(zoomFactor - 1.0) > 0.05 && (
              <button
                className="btn sim-cam-btn"
                onClick={() => setZoomFactor(1.0)}
                title="Reset zoom to 1.0×"
                style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--dim)' }}
              >
                <span>↺ 1×</span>
              </button>
            )}
          </div>

          {/* Dedicated Floating GIS Zoom Controls (Right Dock) */}
          <div className="map-zoom-controls">
            <button
              className="zoom-btn"
              onClick={handleZoomIn}
              title="Zoom in closer (+)"
            >
              +
            </button>
            <div className="zoom-indicator mono" title="Current Zoom Level">
              {zoomFactor.toFixed(1)}×
            </div>
            <button
              className="zoom-btn"
              onClick={handleZoomOut}
              title="Zoom out further (−)"
            >
              −
            </button>
            <div className="zoom-sep" />
            <button
              className={`zoom-btn-icon${zoomFactor >= 1.8 ? ' on' : ''}`}
              onClick={() => handleSetZoomPreset(2.0)}
              title="Wide Zoom Out (2.0× Panoramic)"
            >
              🔭
            </button>
            <button
              className={`zoom-btn-icon${focus.kind === 'truck' ? ' on' : ''}`}
              onClick={handleToggleFollowTruck}
              title="Lock Camera onto Moving Truck"
            >
              🚚
            </button>
            <button
              className={`zoom-btn-icon${focus.kind === 'overview' && zoomFactor === 1.0 ? ' on' : ''}`}
              onClick={() => {
                setFocus({ kind: 'overview' })
                setZoomFactor(1.0)
              }}
              title="Reset Overview"
            >
              🌐
            </button>
          </div>

          <div className="panel scenarios">
            <div className="eyebrow">Corridor Scenarios</div>
            <ScenariosPanel
              scenarios={data.scenarios}
              activeIdx={idx}
              onSelect={(i) => setIdx(i)}
            />
          </div>

          <div className={`panel brief${briefCollapsed ? ' collapsed' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
              <div className="eyebrow" style={{ margin: 0 }}>{data.corridor.name}</div>
              <button
                onClick={() => setBriefCollapsed((c) => !c)}
                title={briefCollapsed ? 'Expand scenario brief' : 'Minimize scenario brief'}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '4px',
                  color: 'var(--dim)',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '10px',
                  lineHeight: '1',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>{briefCollapsed ? '▲ Expand' : '▼ Minimize'}</span>
              </button>
            </div>
            <h2>{scenario.title}</h2>
            {!briefCollapsed && (
              <>
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
              </>
            )}
          </div>

          {selectedTrip && (
            <div className="panel inspect">
              <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RealisticTruckIcon width={24} height={16} accentColor="#ffd166" />
                <span>Following SCV</span>
              </div>
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
              <button
                className="btn"
                onClick={handleStartSimulation}
                style={{
                  padding: '7px 15px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  borderColor: '#34d399',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
                }}
                title="Start physical simulation from origin"
              >
                <span>▶ Start Simulation</span>
              </button>
              <button
                className={`btn${playing ? ' on' : ''}`}
                onClick={() => setPlaying((p) => !p)}
                style={{
                  padding: '7px 12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                }}
                title={playing ? 'Pause clock' : 'Resume clock'}
              >
                <span>{playing ? '❚❚ Pause' : '▶ Resume'}</span>
              </button>
              <button
                className={`btn${focus.kind === 'truck' ? ' on' : ''}`}
                onClick={handleToggleFollowTruck}
                style={{
                  padding: '7px 12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: focus.kind === 'truck' ? 'rgba(255, 209, 102, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                  color: focus.kind === 'truck' ? '#ffd166' : '#e2e8f0',
                  borderColor: focus.kind === 'truck' ? '#ffd166' : 'rgba(255, 255, 255, 0.15)',
                }}
                title="Lock camera onto moving truck"
              >
                <span>🚚 Focus Truck</span>
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
              <div className="speed-group" style={{ display: 'flex', gap: '4px' }}>
                {[0.25, 0.5, 1, 3, 8].map((s) => (
                  <button
                    key={s}
                    className={`btn${speed === s ? ' on' : ''}`}
                    style={{ padding: '6px 9px', fontSize: '11px', minWidth: '38px' }}
                    onClick={() => setSpeed(s)}
                    title={`${s}× Playback Speed`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
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
      )}

      {/* Dedicated Full-Screen Dashboard Views */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboard
          data={data}
          onReturnTo3D={() => setActiveTab('scenarios')}
        />
      )}

      {activeTab === 'driver' && (
        <DriverEconDashboard
          data={data}
          onReturnTo3D={() => setActiveTab('scenarios')}
        />
      )}

      {activeTab === 'farmer' && (
        <FarmerPricingDashboard
          data={data}
          onFocusVillage={(key) => {
            setActiveTab('scenarios')
            setFocus({ kind: 'village', key })
          }}
          onReturnTo3D={() => setActiveTab('scenarios')}
        />
      )}

      {activeTab === 'villages' && (
        <SettlementExplorerDashboard
          data={data}
          onFocusVillage={(key) => {
            setActiveTab('scenarios')
            setFocus({ kind: 'village', key })
          }}
          onReturnTo3D={() => setActiveTab('scenarios')}
        />
      )}
    </>
  )
}
