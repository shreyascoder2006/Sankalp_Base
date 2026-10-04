import type { NavTab } from '../../hud/NavRail'

const LINKS = [
  ['Problem', '#problem'],
  ['Solution', '#solution'],
  ['How it works', '#how'],
  ['Pricing', '#pricing'],
  ['Impact', '#impact'],
  ['Pilot', '#pilot'],
] as const

interface NavbarProps {
  onLaunchTwin: () => void
  onSelectTab?: (tab: NavTab) => void
}

export default function Navbar({ onLaunchTwin, onSelectTab }: NavbarProps) {
  return (
    <div className="nav-wrap">
      <nav className="nav frosted">
        <span className="wordmark" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🌿</span> KrishiSetu
        </span>
        <div className="nav-links">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}

          {onSelectTab && (
            <button
              onClick={() => onSelectTab('sandbox')}
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                color: '#1a1a1a',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '999px',
                padding: '6px 13px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s',
              }}
            >
              <span>📊 2D Sandbox</span>
            </button>
          )}

          <button
            onClick={onLaunchTwin}
            style={{
              background: '#0d131f',
              color: '#ffffff',
              border: '1px solid rgba(61, 220, 151, 0.5)',
              borderRadius: '999px',
              padding: '7px 16px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 12px rgba(61, 220, 151, 0.25)',
              transition: 'transform 0.15s, background 0.15s',
            }}
          >
            <span>🌐 3D Digital Twin</span>
            <span style={{ color: '#3ddc97', fontSize: '10px' }}>●</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
