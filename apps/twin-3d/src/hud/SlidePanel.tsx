import { useEffect, useRef } from 'react'

interface SlidePanelProps {
  title: string
  eyebrow?: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function SlidePanel({ title, eyebrow, open, onClose, children }: SlidePanelProps) {
  const ref = useRef<HTMLDivElement>(null)

  /* Reset scroll when panel opens */
  useEffect(() => {
    if (open && ref.current) ref.current.scrollTop = 0
  }, [open])

  return (
    <div className={`slide-panel${open ? ' open' : ''}`} ref={ref}>
      <div className="slide-header">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h3 className="slide-title">{title}</h3>
        </div>
        <button className="slide-close" onClick={onClose} title="Close panel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="slide-body">{children}</div>
    </div>
  )
}
