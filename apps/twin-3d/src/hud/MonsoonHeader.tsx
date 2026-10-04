import type { NavTab } from './NavRail'

interface MonsoonHeaderProps {
  activeTab: NavTab | null
  onSelectTab: (tab: NavTab) => void
  corridorName?: string
  playing?: boolean
  onStartSimulation?: () => void
}

export default function MonsoonHeader({
  activeTab,
  onSelectTab,
  corridorName = 'Nashik – Pimpalgaon Corridor',
  playing: _playing = false,
  onStartSimulation,
}: MonsoonHeaderProps) {
  return (
    <header className="monsoon-header-bar">
      <div className="monsoon-header-left">
        {/* Brand Logo & Tag */}
        <button
          className="monsoon-brand-badge-btn"
          onClick={() => onSelectTab('landing')}
          title="Return to Monsoon Executive Dashboard"
        >
          <div className="monsoon-leaf-glow">🌿</div>
          <div className="monsoon-brand-col">
            <span className="monsoon-brand-name">Monsoon</span>
            <span className="monsoon-brand-sub">LOGISTICS OS</span>
          </div>
        </button>

        <div className="monsoon-header-sep" />

        {/* Quick Corridor Breadcrumb */}
        <div className="monsoon-corridor-tag">
          <span className="monsoon-pulse-dot" />
          <span className="monsoon-corridor-name">{corridorName}</span>
        </div>
      </div>

      {/* Center Tab Navigation Pills */}
      <nav className="monsoon-header-nav">
        <button
          className={`monsoon-nav-pill${activeTab === 'landing' ? ' active' : ''}`}
          onClick={() => onSelectTab('landing')}
        >
          <span className="pill-icon">🌿</span>
          <span>Monsoon Dashboard</span>
        </button>

        <button
          className={`monsoon-nav-pill${activeTab === 'scenarios' ? ' active' : ''}`}
          onClick={() => onSelectTab('scenarios')}
        >
          <span className="pill-icon">🌐</span>
          <span>3D Simulation</span>
        </button>

        <button
          className={`monsoon-nav-pill${activeTab === 'sandbox' ? ' active' : ''}`}
          onClick={() => onSelectTab('sandbox')}
        >
          <span className="pill-icon">📊</span>
          <span>2D Sandbox</span>
        </button>

        <button
          className={`monsoon-nav-pill${activeTab === 'analytics' ? ' active' : ''}`}
          onClick={() => onSelectTab('analytics')}
        >
          <span className="pill-icon">📈</span>
          <span>Analytics</span>
        </button>

        <button
          className={`monsoon-nav-pill${activeTab === 'driver' ? ' active' : ''}`}
          onClick={() => onSelectTab('driver')}
        >
          <span className="pill-icon">🚚</span>
          <span>Driver Econ</span>
        </button>

        <button
          className={`monsoon-nav-pill${activeTab === 'farmer' ? ' active' : ''}`}
          onClick={() => onSelectTab('farmer')}
        >
          <span className="pill-icon">🌾</span>
          <span>Farmer Pricing</span>
        </button>

        <button
          className={`monsoon-nav-pill${activeTab === 'chat' ? ' active' : ''}`}
          onClick={() => onSelectTab('chat')}
        >
          <span className="pill-icon">💬</span>
          <span>WhatsApp Bot</span>
        </button>

        <button
          className={`monsoon-nav-pill${activeTab === 'villages' ? ' active' : ''}`}
          onClick={() => onSelectTab('villages')}
        >
          <span className="pill-icon">📍</span>
          <span>Network</span>
        </button>
      </nav>

      {/* Right Action */}
      <div className="monsoon-header-right">
        {activeTab === 'scenarios' && onStartSimulation && (
          <button
            className="sim-start-btn"
            onClick={onStartSimulation}
            style={{
              padding: '7px 15px',
              fontSize: '12.5px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.45)',
              border: '1px solid #34d399',
            }}
            title="Start physical simulation: watch truck drive from Pimpalgaon to Nashik APMC"
          >
            <span className="sim-pulse-dot" />
            <span>▶ Start Simulation</span>
          </button>
        )}

        {activeTab !== 'landing' ? (
          <button
            className="monsoon-quick-action-btn"
            onClick={() => onSelectTab('landing')}
          >
            <span>🌿 Monsoon Dashboard</span>
            <span className="action-arrow">↗</span>
          </button>
        ) : (
          <button
            className="monsoon-quick-action-btn primary"
            onClick={() => onSelectTab('scenarios')}
          >
            <span>🌐 Open 3D Digital Twin</span>
            <span className="action-arrow">→</span>
          </button>
        )}
      </div>
    </header>
  )
}
