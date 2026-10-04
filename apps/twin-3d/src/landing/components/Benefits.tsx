const CARDS = [
  {
    h: 'Smallholder farmer',
    p: 'Pays for her crates, not the truck — and reaches the mandi of her choice.',
    stat: '~₹340 for 200 kg vs ~₹2,000 full hire',
  },
  {
    h: 'Driver-owner',
    p: 'Both legs earn. Backhaul fill turns the empty return into revenue.',
    stat: '+₹5,000–7,500 / month',
    modelled: true,
  },
  {
    h: 'Input dealer & kirana',
    p: 'Small inbound orders — fertiliser, seed, crates, FMCG stock — ride home at low rates.',
    stat: '30–50% below normal freight',
  },
  {
    h: 'Consumer',
    p: 'Faster farm-to-mandi transfer means less spoilage and steadier prices.',
    stat: 'up to 25% less spoilage (NITI Aayog)',
  },
  {
    h: 'Satin Finserv',
    p: 'Consent-based trip and earnings records make driver borrowers underwriteable.',
    stat: '130 branches · 14 states — the distribution moat',
  },
  {
    h: 'Climate',
    p: 'Every km carries more cargo, so emissions per tonne-km fall.',
    stat: '220–480 t CO₂ avoided / corridor-year',
    modelled: true,
  },
]

export default function Benefits() {
  return (
    <section id="benefits" className="section dark">
      <div className="inner">
        <div className="sec-head reveal">
          <span className="eyebrow">Who benefits</span>
          <h2>Six wins from one match</h2>
        </div>
        <div className="grid g3">
          {CARDS.map((c, i) => (
            <div key={c.h} className="card-d reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
              <h3>{c.h}</h3>
              <p>{c.p}</p>
              <p className="stat">
                {c.stat}
                {c.modelled && <span className="chip-modelled">Modelled</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
