const ROWS = [
  ['Driver return legs carrying a load', 'measured by platform trip logs', '50%+'],
  ['Extra income per active driver', 'measured by UPI payout records', '+₹5,000–7,500 / mo'],
  ['Cost to move a 200 kg lot', 'measured by quoted fares', '~₹340, from ~₹2,000'],
  ['CO₂ avoided per corridor-year', 'measured by avoided trips × km × 2.68 kg CO₂/L', '220–480 t'],
  ['Farmers re-booking within 60 days', 'measured by booking history', '40%+'],
  [
    'Drivers with a credit-ready income record',
    'measured by monthly statements shared with SFL on consent',
    '200',
  ],
] as const

export default function Impact() {
  return (
    <section id="impact" className="section light">
      <div className="inner">
        <div className="sec-head reveal">
          <span className="eyebrow">Impact — what we will measure</span>
          <h2>Modelled targets, measured honestly</h2>
          <p className="sub">
            One pilot corridor, 200 drivers, 12 months. These are projections, not results —
            each one has a measurement plan attached.
          </p>
        </div>
        <div className="impact-list reveal" style={{ transitionDelay: '.05s' }}>
          {ROWS.map(([m, h, t]) => (
            <div className="impact-row" key={m}>
              <div>
                <div className="m">{m}</div>
                <div className="h">{h}</div>
              </div>
              <div className="t">{t}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
