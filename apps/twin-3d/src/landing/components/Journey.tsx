import {
  ArrowDown,
  CheckCircle2,
  Database,
  Landmark,
  MapPin,
  Mic,
  PieChart,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { useEffect, useRef } from 'react'

const WAVE = [40, 70, 40, 100, 60, 90, 40, 60, 30, 80, 50, 40, 70, 90, 50]

/** Piecewise-linear ramp: opacity keyframes against scroll progress. */
function ramp(p: number, xs: number[], ys: number[]) {
  if (p <= xs[0]) return ys[0]
  for (let i = 0; i < xs.length - 1; i++) {
    if (p >= xs[i] && p <= xs[i + 1]) {
      const t = (p - xs[i]) / (xs[i + 1] - xs[i])
      return ys[i] + t * (ys[i + 1] - ys[i])
    }
  }
  return ys[ys.length - 1]
}

const PHASES = [
  { xs: [0, 0.25, 0.35], ys: [1, 1, 0] },
  { xs: [0.25, 0.35, 0.6, 0.7], ys: [0, 1, 1, 0] },
  { xs: [0.6, 0.7, 1], ys: [0, 1, 1] },
]

export default function Journey() {
  const gridRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const truckRef = useRef<HTMLDivElement>(null)
  const phaseRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ]

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')

    const onScroll = () => {
      const grid = gridRef.current
      if (!grid) return
      const r = grid.getBoundingClientRect()
      const p = Math.max(0, Math.min(1, (window.innerHeight / 2 - r.top) / r.height))

      if (fillRef.current) fillRef.current.style.transform = `scaleY(${p})`
      if (truckRef.current) truckRef.current.style.top = `calc(${(p * 100).toFixed(2)}% - 20px)`

      // Below 1024px the phases stack and are always visible, so leave them alone.
      if (!desktop.matches) return
      PHASES.forEach(({ xs, ys }, i) => {
        const el = phaseRefs[i].current
        if (!el) return
        const v = ramp(p, xs, ys)
        el.style.opacity = String(v)
        el.style.visibility = v <= 0.01 ? 'hidden' : 'visible'
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id="how" className="journey-sec">
      <img
        className="jbg"
        src="https://images.unsplash.com/photo-1517309230475-6736d926b409?q=80&w=2839&auto=format&fit=crop"
        alt=""
      />
      <div className="jov1" />
      <div className="jov2" />

      <div className="j-head">
        <div className="sec-head reveal" style={{ padding: '0 24px' }}>
          <span className="eyebrow">How it works</span>
          <h2>Follow one booking, end to end.</h2>
          <p className="sub">
            A voice note becomes a matched, fixed-price, proof-backed trip — and the empty
            return leg becomes driver income. Keep scrolling to dispatch.
          </p>
        </div>
      </div>

      <div className="journey">
        <div className="journey-grid" ref={gridRef}>
          <div className="left-col">
            <div className="timeline">
              <div className="track">
                <div className="fill" ref={fillRef} />
              </div>
              <div className="truck" ref={truckRef}>
                <Truck size={20} />
              </div>
            </div>

            <div className="step-wrap">
              <div className="step-card frosted reveal-x">
                <div className="step-head">
                  <div className="icon-box">
                    <Mic size={24} color="var(--emerald-700)" />
                  </div>
                  <div>
                    <div className="kicker" style={{ color: 'var(--emerald-700)' }}>
                      Engine A: Forward Pooling
                    </div>
                    <h2>Voice-First Logistics.</h2>
                  </div>
                </div>
                <p className="body">
                  A farmer with 200kg of tomatoes can't afford a ₹2,000 full-truck hire. She
                  sends a simple WhatsApp voice note. No app downloads. No typing.
                </p>
                <div className="stat-strip glass-in">
                  <ShieldCheck size={20} color="var(--emerald-600)" />
                  <span>Farmers save ~83% on LTL freight.</span>
                </div>
              </div>
            </div>

            <div className="step-wrap">
              <div className="step-card frosted reveal-x">
                <div className="step-head">
                  <div className="icon-box">
                    <MapPin size={24} color="var(--blue-700)" />
                  </div>
                  <div>
                    <div className="kicker" style={{ color: 'var(--blue-700)' }}>
                      Tech Pipeline
                    </div>
                    <h2>Erase the Dead Mile.</h2>
                  </div>
                </div>
                <p className="body">
                  The truck drops the harvest at the Mandi. Our geofence radar triggers
                  instantly, marking the driver available. An input dealer books the empty
                  return leg.
                </p>
                <div className="stat-strip glass-in">
                  <Database size={20} color="var(--blue-600)" />
                  <span>Instantly matches 400kg+ capacity.</span>
                </div>
              </div>
            </div>

            <div className="step-wrap">
              <div className="step-card frosted reveal-x">
                <div className="step-head">
                  <div className="icon-box">
                    <Landmark size={24} color="var(--purple-700)" />
                  </div>
                  <div>
                    <div className="kicker" style={{ color: 'var(--purple-700)' }}>
                      The Ecosystem Wins
                    </div>
                    <h2>Underwriting Mobility.</h2>
                  </div>
                </div>
                <p className="body">
                  The driver earns on both legs. Satin Finserv receives a verified, real-time
                  cash flow stream to confidently underwrite SCV and green EV loans.
                </p>
                <div className="stat-strip glass-in">
                  <CheckCircle2 size={20} color="var(--purple-600)" />
                  <span>+₹7,500/mo extra driver revenue.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="right-col">
            <div className="sticky-wrap">
              <div className="canvas frosted">
                <div className="dots" />

                <div className="phase" ref={phaseRefs[0]} style={{ zIndex: 10 }}>
                  <div className="phase-inner">
                    <div className="audio-bubble glass-in">
                      <div className="audio-row">
                        <div className="mic-circle">
                          <Mic size={20} />
                        </div>
                        <div className="wave">
                          {WAVE.map((h, i) => (
                            <i
                              key={i}
                              style={
                                { '--h': `${h}%`, '--d': `${i * 0.08}s` } as React.CSSProperties
                              }
                            />
                          ))}
                        </div>
                        <span className="dur">0:04</span>
                      </div>
                      <p className="quote">
                        "200 kilo tamatar, Pimpalgaon se Nashik APMC, kal subah."
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="phase"
                  ref={phaseRefs[1]}
                  style={{ zIndex: 11, opacity: 0, visibility: 'hidden' }}
                >
                  <div className="phase-inner">
                    <div className="radar-zone">
                      <div className="radar">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="ring"
                            style={{ '--d': `${i}s` } as React.CSSProperties}
                          />
                        ))}
                        <div className="pin">
                          <MapPin size={32} />
                          <div className="tag">NASHIK APMC</div>
                        </div>
                      </div>
                    </div>
                    <div className="geo-card glass-in">
                      <div className="accent-bar" />
                      <div className="geo-row">
                        <span className="t">MH-15-AB-1234 Arrived</span>
                        <span className="chip chip-blue">GEOFENCE BREACHED</span>
                      </div>
                      <div className="status">
                        <div className="dot" />
                        Status Updated: Available for Return Load
                      </div>
                    </div>
                    <div className="cand glass-in">
                      <div>
                        <div className="name">Input Dealer A</div>
                        <div className="meta">400kg Fertilizer • 2.1 km away</div>
                      </div>
                      <span className="chip chip-blue">98% Match</span>
                    </div>
                  </div>
                </div>

                <div
                  className="phase"
                  ref={phaseRefs[2]}
                  style={{ zIndex: 12, opacity: 0, visibility: 'hidden' }}
                >
                  <div className="phase-inner">
                    <div className="p3-head">
                      <div className="who">
                        <div className="icon-box">
                          <Landmark size={24} color="var(--purple-700)" />
                        </div>
                        <div>
                          <div className="name">Satin Finserv</div>
                          <div className="stream">Live Underwriting Stream</div>
                        </div>
                      </div>
                      <span className="chip-api">API SYNCED</span>
                    </div>
                    <div className="score-box glass-in">
                      <div className="score-circle">
                        <div>
                          <div className="n">94</div>
                          <div className="l">
                            Cash Flow
                            <br />
                            Score
                          </div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                          Cash Flow Health Score
                        </div>
                        <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
                          Low EMI default risk based on real-time trip revenue.
                        </div>
                      </div>
                    </div>
                    <div className="money-grid">
                      <div className="money-card mc-red glass-in">
                        <div className="lbl">
                          <ArrowDown size={16} /> Dead-Mile Cost
                        </div>
                        <div className="val">₹8,150</div>
                      </div>
                      <div className="money-card mc-green glass-in">
                        <div className="lbl">
                          <CheckCircle2 size={16} /> Net Revenue
                        </div>
                        <div className="val">+₹7,500</div>
                      </div>
                    </div>
                    <div className="emi glass-in">
                      <div className="emi-head">
                        <div className="t">
                          <PieChart size={16} /> EMI Default Risk Projection
                        </div>
                        <span className="chip">Low Risk</span>
                      </div>
                      <div className="emi-track">
                        <div className="emi-fill" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
