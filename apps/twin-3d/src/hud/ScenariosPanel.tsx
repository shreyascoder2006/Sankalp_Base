import type { Scenario, TwinData } from '../scene/types'

interface ScenariosPanelProps {
  data?: TwinData
  scenarios: Scenario[]
  activeIdx: number
  onSelect: (idx: number) => void
}

export default function ScenariosPanel({ scenarios, activeIdx, onSelect }: ScenariosPanelProps) {
  return (
    <>
      {scenarios.map((s, i) => (
        <button key={s.key} className={`scn${i === activeIdx ? ' on' : ''}`} onClick={() => onSelect(i)}>
          <span className="scn-n mono">{String(i + 1).padStart(2, '0')}</span>
          <span className="scn-txt">
            <b>{s.title}</b>
            <i>
              {s.facts.served} served
              {s.facts.unserved > 0 && ` · ${s.facts.unserved} unserved`}
            </i>
          </span>
        </button>
      ))}
      <div className="chips">
        <span className="chip REAL">roads &amp; routes REAL</span>
        <span className="chip MODELED">fares MODELED</span>
        <span className="chip MODELED">relief &times;20</span>
      </div>
    </>
  )
}
