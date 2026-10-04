const ROWS = [
  { load: '100 kg', pooled: '₹200', full: '₹2,000', save: '~90%' },
  { load: '200 kg', note: "Sunita's 8 crates", pooled: '₹340', full: '₹2,000', save: '~83%', hl: true },
  { load: '500 kg', pooled: '₹775', full: '₹2,000', save: '~61%' },
  { load: '1,000 kg', pooled: '₹1,495', full: '₹2,000', save: '~25%' },
]

export default function Pricing() {
  return (
    <section id="pricing" className="section light">
      <div className="inner">
        <div className="sec-head reveal">
          <span className="eyebrow">Pricing</span>
          <h2>Pay for your crates, not the whole truck</h2>
        </div>

        <div className="formula-pill reveal">
          <span>Fare = (full-truck fare ÷ capacity × your load) + detour + platform fee</span>
        </div>

        <div className="table-wrap reveal" style={{ transitionDelay: '.05s' }}>
          <table className="pricing">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Load</th>
                <th style={{ textAlign: 'right' }}>Pooled fare</th>
                <th style={{ textAlign: 'right' }}>Full-truck hire</th>
                <th style={{ textAlign: 'right' }}>You save</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.load} className={r.hl ? 'hl' : undefined}>
                  <td style={{ fontWeight: 600 }}>
                    {r.load}
                    {r.note && <span className="td-note">{r.note}</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.pooled}</td>
                  <td style={{ textAlign: 'right', color: 'rgba(31,31,31,0.5)' }}>{r.full}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>
                    {r.save}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="reveal" style={{ transitionDelay: '.1s' }}>
          <p className="honest">
            <strong>The honest math:</strong> pooling helps most for small lots — the headline
            beneficiary is the 100–300 kg smallholder. A 1,000 kg load is already two-thirds of
            a truck. Backhaul cargo ships 30–50% cheaper still.
          </p>
          <p className="pricing-disclaimer">
            Illustrative: Bolero pickup, 1,500 kg capacity, 40 km hire ≈ ₹2,000, detour ₹50, 8%
            platform fee. Local rates to be validated in the pilot.
          </p>
        </div>
      </div>
    </section>
  )
}
