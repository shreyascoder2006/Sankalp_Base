export default function Solution() {
  return (
    <section id="solution" className="section light">
      <div className="inner">
        <div className="sec-head reveal">
          <span className="eyebrow">The solution</span>
          <h2>One truck. Two engines.</h2>
          <p className="sub">
            No fleet. No app download. A WhatsApp and IVR matching layer over the small
            commercial vehicles already on the road — priced, pooled and confirmed in about
            two minutes.
          </p>
        </div>

        <div className="grid g2">
          <div className="card-l reveal" style={{ transitionDelay: '.05s' }}>
            <span className="dir-pill">Village → Mandi</span>
            <h3>Engine A — Forward pooling</h3>
            <p className="body">
              Several smallholders along one road share one truck to the mandi. Each pays only
              for her own crates: a 200 kg lot rides for ~₹340 instead of a ~₹2,000 full-truck
              hire.
            </p>
            <p className="fix">
              Fixes logistics exclusion — the better market exists; now she can reach it.
            </p>
          </div>
          <div className="card-l reveal" style={{ transitionDelay: '.15s' }}>
            <span className="dir-pill">Mandi → Village</span>
            <h3>Engine B — Backhaul fill</h3>
            <p className="body">
              The same truck carries fertiliser, seed, empty crates and kirana stock on the way
              home, priced 30–50% below normal rates — because it is going that way regardless.
            </p>
            <p className="fix">
              Fixes dead miles — 40–60 km of diesel burned for zero revenue, every day.
            </p>
          </div>
        </div>

        <div className="wins reveal" style={{ transitionDelay: '.15s' }}>
          <span>Farmer pays less</span>
          <span>Driver earns more</span>
          <span>Lender sees steadier cash flow</span>
          <span>CO₂ per tonne-km falls</span>
        </div>
      </div>
    </section>
  )
}
