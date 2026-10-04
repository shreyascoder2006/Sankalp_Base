import type { EconRow, SharingRow } from '../types'

const rupee = (n: number) => `₹${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

export default function Pricing({
  sharing,
  economics,
}: {
  sharing: SharingRow[]
  economics: EconRow[]
}) {
  const solo = sharing.find((s) => s.shared_by === 1)
  const three = sharing.find((s) => s.shared_by === 3)
  const gap = solo ? ((solo.ours - solo.brief) / solo.brief) * 100 : 0

  return (
    <section>
      <div className="sec-head">
        <h2>What the flat detour charge actually assumes</h2>
        <span className="chip MODELED">modeled</span>
      </div>
      <p className="sec-note">
        A 200 kg lot over the measured 30.2 km corridor, priced our way versus the brief's
        flat &#8377;50 detour charge. That charge is close to correct at three-way sharing
        and under-recovers badly below it — and on this corridor most bookings are solo,
        because only 3 of 15 branches support sharing at all.
      </p>

      <div className="grid-2">
        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>farmers sharing</th>
                <th className="num">our fare</th>
                <th className="num">brief</th>
                <th className="num">gap</th>
              </tr>
            </thead>
            <tbody>
              {sharing.map((s) => {
                const d = s.ours - s.brief
                return (
                  <tr key={s.shared_by}>
                    <td>{s.shared_by === 1 ? '1 (solo)' : s.shared_by}</td>
                    <td className="num mono">{rupee(s.ours)}</td>
                    <td className="num mono dim">{rupee(s.brief)}</td>
                    <td className={`num mono ${Math.abs(d) > 40 ? 'lo' : ''}`}>
                      {d >= 0 ? '+' : ''}
                      {rupee(d)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {solo && three && (
            <div className="callout" style={{ background: 'rgba(255,107,107,0.06)', borderColor: 'rgba(255,107,107,0.2)', color: '#f3c9c9' }}>
              A solo pickup under-recovers by <strong>{gap.toFixed(0)}%</strong>. The
              flat &#8377;50 implicitly assumes roughly three-way sharing — which is the
              exception here, not the rule.
            </div>
          )}
        </div>

        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>parameter</th>
                <th className="num">value</th>
                <th>source</th>
              </tr>
            </thead>
            <tbody>
              {economics.map((e) => (
                <tr key={e.name}>
                  <td style={{ fontSize: 12 }}>{e.name.toLowerCase().replace(/_/g, ' ')}</td>
                  <td className="num mono">{e.value}</td>
                  <td>
                    <span className={`chip ${e.provenance}`}>{e.provenance}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="stage-detail" style={{ marginTop: 14 }}>
            Four of these are MODELED — they are exactly what field interviews replace.
            The fare moves directly with the truck rate and laden mileage, neither of
            which has a source better than the brief's own worked example.
          </p>
        </div>
      </div>
    </section>
  )
}
