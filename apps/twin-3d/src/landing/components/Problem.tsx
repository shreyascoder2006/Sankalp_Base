const STATS = [
  ['28–43%', "of India's truck-kilometres run empty", 'NITI Aayog–RMI, 2021'],
  ['126M', 'small farmers — 86% of holdings under 2 ha', 'Agriculture Census 2015-16'],
  ['₹1.53 lakh cr', 'lost to post-harvest losses every year', 'NABCONS 2022, via ICRIER'],
  ['33–37%', "farmer's share of the consumer rupee", 'RBI Working Paper, 2024'],
] as const

export default function Problem() {
  return (
    <section id="problem" className="section dark">
      <div className="inner">
        <div className="sec-head reveal">
          <span className="eyebrow">The problem</span>
          <h2>Two failures, five kilometres apart</h2>
          <p className="sub">
            Rural agri-transport fails on both sides at once. The farmer can't reach the
            market, and the truck that could carry her runs home empty. Both lack the same
            thing: a way to find each other.
          </p>
        </div>

        <div className="grid g2">
          <div className="card-d story reveal" style={{ transitionDelay: '.05s' }}>
            <span className="tag">Sunita · farms 1.5 acres, Nashik</span>
            <h3>200 kg of tomatoes, no truck she can afford</h3>
            <p>
              Eight crates ready the same morning a full pickup to the APMC costs ~₹2,000 —
              more than the trip is worth. A trader offers less at her gate. She takes it,
              because tomatoes won't wait.
            </p>
          </div>
          <div className="card-d story reveal" style={{ transitionDelay: '.15s' }}>
            <span className="tag">Ramesh · one Bolero pickup, on loan</span>
            <h3>400 kg of space, then 40 km of nothing</h3>
            <p>
              He delivers 1.1 t of onions at Nashik APMC, passing Sunita's village with space
              unused. Then he drives home empty — burning diesel at ₹97.83/L to earn exactly
              nothing.
            </p>
          </div>
        </div>

        <p className="punchline reveal" style={{ transitionDelay: '.1s' }}>
          One truck had room for her tomatoes going in — and for the dealer's fertiliser
          coming back. <em>Nobody had a way to know.</em>
        </p>

        <div className="stats">
          {STATS.map(([n, l, s], i) => (
            <div key={n} className="stat-cell reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
              <div className="n">{n}</div>
              <div className="l">{l}</div>
              <div className="s">{s}</div>
            </div>
          ))}
        </div>

        <p className="src-note reveal">
          All figures from Government of India, RBI and NITI Aayog publications. Modelled
          projections elsewhere on this page are labelled as such.
        </p>
      </div>
    </section>
  )
}
