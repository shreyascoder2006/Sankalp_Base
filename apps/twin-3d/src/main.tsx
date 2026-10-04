import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { installResizeShim } from './resize-shim'
import App from './App'

class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; stack: string }
> {
  state = { error: null as Error | null, stack: '' }

  static getDerivedStateFromError(error: Error) {
    return { error, stack: '' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, stack: (info.componentStack ?? '').slice(0, 900) })
    console.error('[global] crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#05080c',
          color: '#e9eef6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Inter', system-ui, sans-serif",
          zIndex: 99999,
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            width: '100%',
            background: 'rgba(23, 27, 38, 0.85)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}
        >
          <h3 style={{ color: '#ef4444', margin: '0 0 12px 0', fontSize: '18px' }}>
            Application Encountered an Error
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            {this.state.error.message}
          </p>
          {this.state.stack && (
            <pre
              style={{
                background: '#0f172a',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#cbd5e1',
                overflowX: 'auto',
                maxHeight: '200px',
              }}
            >
              {this.state.stack}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload Simulation
          </button>
        </div>
      </div>
    )
  }
}

try {
  installResizeShim()
} catch (e) {
  console.warn('installResizeShim error:', e)
}

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </StrictMode>,
  )
}
