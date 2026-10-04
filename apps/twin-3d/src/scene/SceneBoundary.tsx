import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * A throw inside the R3F tree otherwise unmounts the canvas silently: the HUD keeps
 * rendering, the page looks fine, and the 3D view is simply black with no message.
 */
export default class SceneBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; stack: string }
> {
  state = { error: null as Error | null, stack: '' }

  static getDerivedStateFromError(error: Error) {
    return { error, stack: '' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, stack: (info.componentStack ?? '').slice(0, 900) })
    console.error('[scene] crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="panel scene-error">
        <h4>3D scene failed to start</h4>
        <pre>{this.state.error.message}</pre>
        {this.state.stack && <pre className="dim">{this.state.stack}</pre>}
      </div>
    )
  }
}
