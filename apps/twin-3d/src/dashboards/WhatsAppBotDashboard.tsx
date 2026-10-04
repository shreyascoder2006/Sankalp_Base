import { useState, useEffect, useRef } from 'react'
import { CHAT_FLOWS, type ChatFlow } from '../hud/chatFlows'

interface WhatsAppBotDashboardProps {
  onFocusVillage: (key: string) => void
  onFocusTruck: (id: string) => void
  onReturnTo3D: () => void
}

export default function WhatsAppBotDashboard({
  onFocusVillage,
  onFocusTruck,
  onReturnTo3D,
}: WhatsAppBotDashboardProps) {
  const [selectedFlowId, setSelectedFlowId] = useState<string>('flow-sakore')
  const [messageIndex, setMessageIndex] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeFlow: ChatFlow =
    CHAT_FLOWS.find((f) => f.id === selectedFlowId) || CHAT_FLOWS[0]

  const handleSelectFlow = (flowId: string) => {
    setSelectedFlowId(flowId)
    setMessageIndex(1)
    setIsPlaying(true)
  }

  useEffect(() => {
    if (!isPlaying) return
    if (messageIndex >= activeFlow.messages.length) {
      setIsPlaying(false)
      return
    }

    const timer = setTimeout(() => {
      setMessageIndex((prev) => Math.min(prev + 1, activeFlow.messages.length))
    }, 3000)

    return () => clearTimeout(timer)
  }, [isPlaying, messageIndex, activeFlow])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageIndex, selectedFlowId])

  const visibleMessages = activeFlow.messages.slice(0, messageIndex)
  const currentMsg = activeFlow.messages[messageIndex - 1]

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-meta">
          <div className="dashboard-eyebrow">
            SANKALP Brief Section 5 · Voice-First Interface &amp; IVR Matching Layer
          </div>
          <h1 className="dashboard-title">WhatsApp Voice Bot &amp; Dispatch Studio</h1>
          <p className="dashboard-desc">
            Simulating voice-first WhatsApp and IVR booking flows. Farmers send vernacular voice notes; the engine extracts logistics intents, validates detour economics, and dispatches drivers.
          </p>
        </div>
        <div className="header-actions">
          <button className="dashboard-action-btn primary" onClick={onReturnTo3D}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>View 3D Simulation</span>
          </button>
        </div>
      </header>

      {/* Top 4 KPI Metrics */}
      <div className="dashboard-kpi-grid">
        <div className="dash-kpi-card accent">
          <div className="kpi-top">
            <span className="kpi-title">Regional NLU Accuracy</span>
            <span className="kpi-tag green">ASR + NLP</span>
          </div>
          <div className="kpi-value mono hi">96.8%</div>
          <div className="kpi-sub">Marathi &amp; Hindi vernacular entity extraction</div>
          <div className="kpi-foot mono">Zero app download required</div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Solver Match Latency</span>
            <span className="kpi-tag blue">Engine</span>
          </div>
          <div className="kpi-value mono">340 ms</div>
          <div className="kpi-sub">Average route detour &amp; capacity matching time</div>
          <div className="kpi-foot mono">Deterministic routing index</div>
        </div>

        <div className="dash-kpi-card success-card">
          <div className="kpi-top">
            <span className="kpi-title">Driver 1-Tap Acceptance</span>
            <span className="kpi-tag green">IVR</span>
          </div>
          <div className="kpi-value mono hi">92.1%</div>
          <div className="kpi-sub">Drivers press "1" on phone keypad to accept</div>
          <div className="kpi-foot mono">Audio dispatch over phone call</div>
        </div>

        <div className="dash-kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Active Test Flow</span>
            <span className={`kpi-tag ${activeFlow.outcome === 'matched' ? 'green' : activeFlow.outcome === 'refused' ? 'red' : 'gold'}`}>
              {activeFlow.outcome.toUpperCase()}
            </span>
          </div>
          <div className="kpi-value" style={{ fontSize: '16px' }}>{activeFlow.title}</div>
          <div className="kpi-sub">{activeFlow.subtitle}</div>
          <div className="kpi-foot mono">Step {messageIndex} of {activeFlow.messages.length}</div>
        </div>
      </div>

      {/* Main Multi-Column Section */}
      <div className="dash-content-grid">
        {/* Left Column: Authentic WhatsApp Chat Interface */}
        <div className="dash-column-left">
          {/* Flow Switcher Tabs */}
          <div className="flow-tab-bar">
            {CHAT_FLOWS.map((f) => (
              <button
                key={f.id}
                className={`flow-tab-pill${f.id === selectedFlowId ? ' active' : ''}`}
                onClick={() => handleSelectFlow(f.id)}
              >
                <span className="pill-status-dot" />
                <span>{f.title}</span>
              </button>
            ))}
          </div>

          <div className="whatsapp-dashboard-frame">
            <div className="wa-top-bar">
              <div className="wa-avatar">🌾</div>
              <div className="wa-peer-info">
                <div className="wa-name">
                  <span>Uber for Harvest Bot</span>
                  <span className="wa-verified">✓</span>
                </div>
                <div className="wa-status">
                  {isPlaying && messageIndex < activeFlow.messages.length
                    ? 'typing audio message...'
                    : 'WhatsApp Business API + Regional IVR'}
                </div>
              </div>
              <div className="wa-actions">
                <button
                  className="wa-ctrl-btn"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <button
                  className="wa-ctrl-btn"
                  onClick={() => {
                    setMessageIndex(1)
                    setIsPlaying(true)
                  }}
                  title="Restart Flow"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            <div className="wa-message-feed">
              <div className="wa-encryption-notice">
                🔒 Voice notes processed through vernacular Marathi/Hindi Speech-to-Intent models.
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
                              <span style={{ height: '35%' }} />
                              <span style={{ height: '75%' }} />
                              <span style={{ height: '100%' }} />
                              <span style={{ height: '55%' }} />
                              <span style={{ height: '90%' }} />
                              <span style={{ height: '40%' }} />
                              <span style={{ height: '80%' }} />
                              <span style={{ height: '65%' }} />
                              <span style={{ height: '35%' }} />
                              <span style={{ height: '60%' }} />
                              <span style={{ height: '95%' }} />
                              <span style={{ height: '50%' }} />
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
                          <div className="parsed-title">🤖 Bot Intent &amp; Routing Engine</div>
                          <div className="parsed-grid">
                            <div className="p-item">
                              <span className="p-lbl">Crop:</span>
                              <span className="p-val">{m.parsedData.crop}</span>
                            </div>
                            <div className="p-item">
                              <span className="p-lbl">Quantity:</span>
                              <span className="p-val mono">{m.parsedData.quantity}</span>
                            </div>
                            <div className="p-item">
                              <span className="p-lbl">Origin:</span>
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
                            } else if (m.actionPayload?.kind === 'truck') {
                              onFocusTruck(m.actionPayload.key)
                            }
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>Show {m.actionPayload.key} in 3D &rarr;</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="wa-bottom-bar">
              <button
                className="step-btn"
                disabled={messageIndex <= 1}
                onClick={() => {
                  setIsPlaying(false)
                  setMessageIndex((prev) => Math.max(1, prev - 1))
                }}
              >
                &larr; Prev Step
              </button>

              <span className="step-count mono">
                Message {messageIndex} of {activeFlow.messages.length}
              </span>

              <button
                className="step-btn"
                disabled={messageIndex >= activeFlow.messages.length}
                onClick={() => {
                  setIsPlaying(false)
                  setMessageIndex((prev) => Math.min(activeFlow.messages.length, prev + 1))
                }}
              >
                Next Step &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: NLU Inspector & Dispatch Console */}
        <div className="dash-column-right">
          {/* NLU Extraction Panel */}
          <div className="dash-panel-card">
            <div className="dash-card-header">
              <div>
                <span className="dash-eyebrow-tag">NLU Pipeline</span>
                <h3 className="card-title">Real-Time Intent &amp; Entity Extractor</h3>
              </div>
              <span className="chip REAL">Confidence: 98.4%</span>
            </div>

            <div className="nlu-spec-grid">
              <div className="nlu-row">
                <span className="nlu-key">Detected Language</span>
                <span className="nlu-val">Marathi (Nashik Deola Dialect)</span>
              </div>
              <div className="nlu-row">
                <span className="nlu-key">Recognized Intent</span>
                <span className="nlu-val hi">Logistics_Shipment_Booking</span>
              </div>
              <div className="nlu-row">
                <span className="nlu-key">Commodity Entity</span>
                <span className="nlu-val mono">
                  {currentMsg?.parsedData?.crop || 'Tomato (Solanum lycopersicum)'}
                </span>
              </div>
              <div className="nlu-row">
                <span className="nlu-key">Payload Weight</span>
                <span className="nlu-val mono">
                  {currentMsg?.parsedData?.quantity || '200 kg'}
                </span>
              </div>
              <div className="nlu-row">
                <span className="nlu-key">Geocoded Origin</span>
                <span className="nlu-val mono">
                  {currentMsg?.parsedData?.village || 'Sakore (Settlement ID: sakore)'}
                </span>
              </div>
              <div className="nlu-row">
                <span className="nlu-key">Terminal Destination</span>
                <span className="nlu-val mono">Nashik APMC Main Gate</span>
              </div>
            </div>
          </div>

          {/* Economics & Decision Engine */}
          <div className="dash-panel-card highlight-border" style={{ marginTop: '16px' }}>
            <div className="dash-card-header">
              <div>
                <span className="dash-eyebrow-tag">Matching Engine</span>
                <h3 className="card-title">Routing &amp; Economics Decision</h3>
              </div>
              <span className={`status-pill ${activeFlow.outcome === 'matched' ? 'green' : activeFlow.outcome === 'refused' ? 'red' : 'gold'}`}>
                {activeFlow.outcome.toUpperCase()}
              </span>
            </div>

            <div className="decision-explanation">
              {activeFlow.id === 'flow-sakore' && (
                <div className="decision-body">
                  <p>
                    <b>Decision: APPROVED.</b> Truck MH-15-EG-4412 (Eknath) has 1,300 kg spare capacity and passes through Sakore branch road. Detour distance is only 4.2 km.
                  </p>
                  <div className="decision-metrics mono">
                    <span>Detour fuel: ₹41.10</span>
                    <span>·</span>
                    <span>Fare revenue: ₹168.00</span>
                    <span>·</span>
                    <span className="hi">Net profit: +₹126.90</span>
                  </div>
                </div>
              )}

              {activeFlow.id === 'flow-bhuse' && (
                <div className="decision-body">
                  <p>
                    <b>Decision: CONSOLIDATION REQUIRED.</b> Sunita's 40 kg load generates only ₹33.60 freight revenue, but Bhuse's isolated 14 km solo detour costs ₹137.00 diesel.
                  </p>
                  <div className="decision-metrics mono">
                    <span>Detour fuel: ₹137.00</span>
                    <span>·</span>
                    <span>Fare revenue: ₹33.60</span>
                    <span>·</span>
                    <span className="danger-txt">Net loss: -₹103.40</span>
                  </div>
                </div>
              )}

              {activeFlow.id === 'flow-pooled' && (
                <div className="decision-body">
                  <p>
                    <b>Decision: BRANCH CO-POOLING MATCHED.</b> By pooling Balu (300 kg) and Sunita (50 kg) along Branch 2 (Korhate-Mohadi), branch entry diesel is split 2 ways. Both shipments are accepted profitably!
                  </p>
                  <div className="decision-metrics mono">
                    <span>Branch entry shared: 2 farmers</span>
                    <span>·</span>
                    <span>Total load: 350 kg</span>
                    <span>·</span>
                    <span className="hi">Synergy: +₹182.00 profit</span>
                  </div>
                </div>
              )}
            </div>

            <div className="dispatch-action-row">
              <button
                className="dashboard-action-btn primary wide"
                onClick={() => {
                  onReturnTo3D()
                }}
              >
                Track Matched Route in 3D &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
