const LINKS = [
  ['Problem', '#problem'],
  ['Solution', '#solution'],
  ['How it works', '#how'],
  ['Pricing', '#pricing'],
  ['Impact', '#impact'],
  ['Pilot', '#pilot'],
] as const

interface FooterProps {
  onLaunchTwin?: () => void
}

export default function Footer({ onLaunchTwin }: FooterProps) {
  return (
    <footer id="contact" className="section dark" style={{ padding: '120px 24px 40px' }}>
      <div className="inner">
        <div className="cta-block reveal">
          <h2>Put the return leg to work.</h2>
          <p>
            We're looking for pilot partners on the Nashik corridor — FPOs, input dealers,
            driver communities, and the Satin Finserv team.
          </p>
          <div className="cta-btns">
            {onLaunchTwin ? (
              <button
                onClick={onLaunchTwin}
                className="btn btn-white"
                style={{ cursor: 'pointer', border: 'none' }}
              >
                Launch 3D Digital Twin →
              </button>
            ) : (
              <a href="mailto:hello@example.com" className="btn btn-white">
                Partner with the pilot
              </a>
            )}
            <a href="#how" className="btn btn-ghost">
              See how it works
            </a>
          </div>
        </div>

        <div className="footer-bar">
          <div>
            <span className="wordmark">KrishiSetu</span>
            <p className="brand-sub">
              Voice-first freight for rural Bharat · In partnership with Satin Finserv
            </p>
          </div>
          <div className="footer-links">
            {LINKS.map(([label, href]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </div>
        </div>

        <p className="disclaimer">
          "Uber for Harvest" is a working title — not affiliated with Uber Technologies.
          Dashboard figures in the demo are illustrative; modelled projections are labelled as
          such; all other statistics cite government, RBI or NITI Aayog sources.
        </p>
      </div>
    </footer>
  )
}
