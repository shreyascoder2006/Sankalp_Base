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
        <span className="hero-eyebrow">🌿 Uber for Harvest · SANKALP 2026</span>
        <h1>Weather any storm</h1>
        <p className="hero-sub">
          Voice-first freight matching that fills the trucks rural India already runs,
          in both directions. Forward pooling for smallholders, backhaul monetization for SCV drivers.
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
