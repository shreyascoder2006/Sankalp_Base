import { useEffect, type ReactNode } from 'react'

export type NavTab =
  | 'landing'
  | 'scenarios'
  | 'sandbox'
  | 'analytics'
  | 'driver'
  | 'farmer'
  | 'chat'
  | 'villages'

interface NavRailProps {
  active: NavTab | null
  onSelect: (tab: NavTab | null) => void
}

const TABS: { key: NavTab; label: string; icon: ReactNode }[] = [
  {
    key: 'landing',
    label: '🌿 Monsoon Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    key: 'scenarios',
    label: '🌐 3D Digital Twin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    key: 'sandbox',
    label: '📊 Corridor Sandbox (2D)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
  {
    key: 'analytics',
    label: '📈 Corridor Analytics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 6-10" />
      </svg>
    ),
  },
  {
    key: 'driver',
    label: '🚚 Driver Economics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v3" /><rect x="9" y="11" width="14" height="10" rx="2" /><circle cx="16" cy="16" r="2" />
      </svg>
    ),
  },
  {
    key: 'farmer',
    label: '🌾 Farmer Pricing',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
      </svg>
    ),
  },
  {
    key: 'chat',
    label: '💬 Voice Bot Studio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    key: 'villages',
    label: '📍 Settlement Network',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 2v4" /><path d="M12 18v4" /><path d="M2 12h4" /><path d="M18 12h4" />
      </svg>
    ),
  },
]

export default function NavRail({ active, onSelect }: NavRailProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active !== 'scenarios') onSelect('scenarios')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, onSelect])

  return (
    <nav className="nav-rail">
      {/* Top Monsoon Brand Button */}
      <button
        className={`nav-brand-btn${active === 'landing' ? ' active' : ''}`}
        onClick={() => onSelect(active === 'landing' ? 'scenarios' : 'landing')}
        title={active === 'landing' ? 'View 3D Simulation' : '🌿 Monsoon Executive Dashboard'}
      >
        <span className="brand-leaf-icon">🌿</span>
      </button>

      <div className="nav-divider" />

      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`nav-icon${active === tab.key ? ' active' : ''}`}
          title={tab.label}
          onClick={() => onSelect(tab.key)}
        >
          {tab.icon}
          <span className="nav-tooltip">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
