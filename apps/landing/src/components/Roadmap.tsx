const PHASES = [
  {
    tag: 'Months 0–3',
    h: 'Pilot',
    p: 'One corridor: Pimpalgaon → Nashik APMC, onion & tomato belt. Manual matching; the bot handles intake.',
    gate: 'Gate: 100+ trips, 40%+ of farmers re-book.',
  },
  {
    tag: 'Months 3–6',
    h: 'Automate',
    p: 'Automatic matching, pooling and pricing; IVR live; SFL data-sharing agreed.',
    gate: 'Gate: half of return legs carry a load.',
  },
  {
    tag: 'Months 6–12',
    h: 'Scale in Maharashtra',
    p: '5–8 corridors around Nashik, Pune and Ahmednagar, onboarded through SFL branches.',
    gate: 'Gate: positive contribution per booking.',
  },
  {
    tag: 'Year 2',
    h: 'New states',
    p: 'Expand where Satin Finserv has branches; add EV pickups financed through green loans.',
    gate: 'Gate: repeat use holds across corridors.',
  },
]

const TRUST = [
  'Fixed price up front',
  'RC & licence verified',
  'OTP + crate-photo proof',
  'Instant UPI payout',
  'DPDP 2023 consent for lender data',
]

export default function Roadmap() {
  return (
    <section id="pilot" className="section dark">
      <div className="inner">
        <div className="sec-head reveal">
          <span className="eyebrow">The pilot</span>
          <h2>One corridor first. Then copy what works.</h2>
          <p className="sub">
            The Uber playbook, rural edition: supply first, backhaul shippers second, farmers
            through people they already trust.
          </p>
        </div>
        <div className="grid g4">
          {PHASES.map((p, i) => (
            <div key={p.h} className="card-d reveal" style={{ transitionDelay: `${i * 0.06}s` }}>
              <span className="tag">{p.tag}</span>
              <h3 style={{ margin: '10px 0 0' }}>{p.h}</h3>
              <p>{p.p}</p>
              <p className="phase-g">{p.gate}</p>
            </div>
          ))}
        </div>
        <div className="trust-chips reveal" style={{ transitionDelay: '.15s' }}>
          {TRUST.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
