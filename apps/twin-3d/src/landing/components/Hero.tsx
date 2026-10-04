import type { NavTab } from '../../hud/NavRail'

const SPONSORS = ['Northwind', 'Vantage', 'Kestrel', 'Meridian', 'Sonaris']

interface HeroProps {
  onLaunchTwin: () => void
  onSelectTab?: (tab: NavTab) => void
}

export default function Hero({ onLaunchTwin, onSelectTab }: HeroProps) {
  return (
    <header className="hero">
      {/* served from public/hero.mp4 */}
      <video src="/hero.mp4" autoPlay muted loop playsInline />
      <div className="ov1" />
      <div className="ov2" />
      <div className="ov3" />
      <div className="hero-content">
        <span className="hero-eyebrow">🌿 Voice-First Rural Logistics Network</span>
        <h1 style={{ fontSize: 'clamp(3rem, 6.8vw, 5.4rem)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.02, color: 'var(--ink)', marginBottom: '8px' }}>
          KrishiSetu
        </h1>
        <div style={{ fontSize: 'clamp(1.22rem, 2.4vw, 1.7rem)', fontWeight: 600, letterSpacing: '-0.015em', color: 'rgba(25, 25, 25, 0.92)', marginBottom: '12px' }}>
          Every Kilo Deserves a Ride.
        </div>
        <p className="hero-sub" style={{ marginTop: '4px', maxWidth: '500px' }}>
          Voice-first freight pooling that fills empty truck beds across rural India.
          Turning stranded 40 kg harvests into profitable APMC mandi runs.
        </p>
        <div className="hero-ctas">
          <button
            onClick={onLaunchTwin}
            className="btn btn-dark"
            style={{
              cursor: 'pointer',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(61, 220, 151, 0.3)',
            }}
          >
            <span>Launch 3D Digital Twin</span>
            <span>→</span>
          </button>

          {onSelectTab && (
            <button
              onClick={() => onSelectTab('sandbox')}
              className="btn btn-light"
              style={{
                cursor: 'pointer',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Explore 2D Sandbox</span>
              <span>↗</span>
            </button>
          )}

          <a href="#solution" className="btn btn-light" style={{ opacity: 0.9 }}>
            Overview &amp; Features
          </a>
        </div>
      </div>
      <div className="sponsors">
        <p className="label">Trusted by teams at</p>
        <div className="sponsor-row">
          {SPONSORS.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
    </header>
  )
}
