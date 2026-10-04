const SPONSORS = ['Northwind', 'Vantage', 'Kestrel', 'Meridian', 'Sonaris']

export default function Hero() {
  return (
    <header className="hero">
      {/* served from public/, so the page does not depend on the CDN copy */}
      <video src="/hero.mp4" autoPlay muted loop playsInline />
      <div className="ov1" />
      <div className="ov2" />
      <div className="ov3" />
      <div className="hero-content">
        <span className="hero-eyebrow">For teams that never stop</span>
        <h1>Weather any storm</h1>
        <p className="hero-sub">
          Resilient operations software that keeps your business running through outages,
          spikes, and everything in between.
        </p>
        <div className="hero-ctas">
          <a href="#problem" className="btn btn-dark">
            Get Started
          </a>
          <a href="#solution" className="btn btn-light">
            See Plans
          </a>
        </div>
      </div>
      <div className="sponsors">
        <p className="label">Trusted by teams at</p>
        <div className="sponsor-row">
          {SPONSORS.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
    </header>
  )
}
