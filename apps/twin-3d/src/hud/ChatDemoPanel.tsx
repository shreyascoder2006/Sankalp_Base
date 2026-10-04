import { useState, useEffect, useRef } from 'react'
import { CHAT_FLOWS, type ChatFlow } from './chatFlows'

interface ChatDemoPanelProps {
  onFocusVillage: (key: string) => void
}

export default function ChatDemoPanel({ onFocusVillage }: ChatDemoPanelProps) {
  const [selectedFlowId, setSelectedFlowId] = useState<string>('flow-sakore')
  const [messageIndex, setMessageIndex] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeFlow: ChatFlow =
    CHAT_FLOWS.find((f) => f.id === selectedFlowId) || CHAT_FLOWS[0]

  // Reset when flow changes
  const handleSelectFlow = (flowId: string) => {
    setSelectedFlowId(flowId)
    setMessageIndex(1)
    setIsPlaying(true)
  }

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return
    if (messageIndex >= activeFlow.messages.length) {
      setIsPlaying(false)
      return
    }

    const timer = setTimeout(() => {
      setMessageIndex((prev) => Math.min(prev + 1, activeFlow.messages.length))
    }, 2800)

    return () => clearTimeout(timer)
  }, [isPlaying, messageIndex, activeFlow])

  // Scroll to bottom of message list on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageIndex, selectedFlowId])

  const visibleMessages = activeFlow.messages.slice(0, messageIndex)

  return (
    <div className="chat-demo-panel">
      {/* Flow Selector Pills */}
      <div className="flow-tabs">
        {CHAT_FLOWS.map((f) => (
          <button
            key={f.id}
            className={`flow-tab-btn${f.id === selectedFlowId ? ' active' : ''}`}
            onClick={() => handleSelectFlow(f.id)}
          >
            <span className="flow-tab-badge">
              {f.outcome === 'matched' ? '✓' : f.outcome === 'refused' ? '✗' : '🤝'}
            </span>
            <span>{f.title.split(':')[0]}</span>
          </button>
        ))}
      </div>

      <div className="flow-header-desc">
        <b>{activeFlow.title}</b>
        <span>{activeFlow.subtitle}</span>
      </div>

      {/* WhatsApp Styled Container */}
      <div className="whatsapp-frame">
        <div className="wa-top-bar">
          <div className="wa-avatar">🌾</div>
          <div className="wa-peer-info">
            <div className="wa-name">
              <span>Uber for Harvest Bot</span>
              <span className="wa-verified" title="Verified WhatsApp Business">✓</span>
            </div>
            <div className="wa-status">
              {isPlaying && messageIndex < activeFlow.messages.length
                ? 'typing...'
                : 'online · IVR + WhatsApp Voice'}
            </div>
          </div>
          <div className="wa-actions">
            <button
              className="wa-ctrl-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              className="wa-ctrl-btn"
              onClick={() => {
                setMessageIndex(1)
                setIsPlaying(true)
              }}
              title="Restart"
            >
              ↺
            </button>
          </div>
        </div>

        {/* Message Bubble List */}
        <div className="wa-message-feed">
          <div className="wa-encryption-notice">
            🔒 Voice messages processed with regional Hindi &amp; Marathi NLU.
          </div>

          {visibleMessages.map((m) => {
            const isFarmer = m.sender === 'farmer'
            const isDriver = m.sender === 'driver'

            return (
              <div
                key={m.id}
                className={`wa-msg-row ${
                  isFarmer ? 'farmer-row' : isDriver ? 'driver-row' : 'bot-row'
                }`}
              >
                <div
                  className={`wa-bubble ${
                    isFarmer
                      ? 'farmer-bubble'
                      : isDriver
                      ? 'driver-bubble'
                      : m.type === 'confirmation'
                      ? 'confirm-bubble'
                      : 'bot-bubble'
                  }`}
                >
                  <div className="sender-tag">{m.senderName}</div>

                  {m.type === 'voice' && (
                    <div className="voice-message-body">
                      <div className="voice-audio-bar">
                        <button className="voice-play-icon">▶</button>
                        <div className="voice-waveform">
                          <span style={{ height: '30%' }} />
                          <span style={{ height: '70%' }} />
                          <span style={{ height: '100%' }} />
                          <span style={{ height: '60%' }} />
                          <span style={{ height: '90%' }} />
                          <span style={{ height: '40%' }} />
                          <span style={{ height: '80%' }} />
                          <span style={{ height: '65%' }} />
                          <span style={{ height: '30%' }} />
                          <span style={{ height: '50%' }} />
                          <span style={{ height: '85%' }} />
                        </div>
                        <span className="voice-duration mono">{m.audioDuration}</span>
                      </div>
                      <div className="voice-transcript">{m.content}</div>
                      {m.translation && (
                        <div className="voice-translation">{m.translation}</div>
                      )}
                    </div>
                  )}

                  {m.type === 'json' && m.parsedData && (
                    <div className="parsed-card">
                      <div className="parsed-title">🤖 NLU Intent Parsed</div>
                      <div className="parsed-grid">
                        <div className="p-item">
                          <span className="p-lbl">Crop:</span>
                          <span className="p-val">{m.parsedData.crop}</span>
                        </div>
                        <div className="p-item">
                          <span className="p-lbl">Load:</span>
                          <span className="p-val mono">{m.parsedData.quantity}</span>
                        </div>
                        <div className="p-item">
                          <span className="p-lbl">Village:</span>
                          <span className="p-val">{m.parsedData.village}</span>
                        </div>
                        <div className="p-item">
                          <span className="p-lbl">Market:</span>
                          <span className="p-val">{m.parsedData.destination}</span>
                        </div>
                      </div>
                      {m.parsedData.quotedFare && (
                        <div className="p-quote mono hi">
                          {m.parsedData.quotedFare}
                        </div>
                      )}
                    </div>
                  )}

                  {(m.type === 'text' || m.type === 'confirmation') && (
                    <div className="bubble-text">{m.content}</div>
                  )}

                  {m.actionPayload && (
                    <button
                      className="scene-link-btn"
                      onClick={() => {
                        if (m.actionPayload?.kind === 'village') {
                          onFocusVillage(m.actionPayload.key)
                        }
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>Highlight {m.actionPayload.key} in 3D &rarr;</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Stepper Footer Controls */}
        <div className="wa-bottom-bar">
          <button
            className="step-btn"
            disabled={messageIndex <= 1}
            onClick={() => {
              setIsPlaying(false)
              setMessageIndex((prev) => Math.max(1, prev - 1))
            }}
          >
            &larr; Prev
          </button>

          <span className="step-count mono">
            {messageIndex} / {activeFlow.messages.length}
          </span>

          <button
            className="step-btn"
            disabled={messageIndex >= activeFlow.messages.length}
            onClick={() => {
              setIsPlaying(false)
              setMessageIndex((prev) => Math.min(activeFlow.messages.length, prev + 1))
            }}
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
