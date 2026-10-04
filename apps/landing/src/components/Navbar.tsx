const LINKS = [
  ['Problem', '#problem'],
  ['Solution', '#solution'],
  ['How it works', '#how'],
  ['Pricing', '#pricing'],
  ['Impact', '#impact'],
  ['Pilot', '#pilot'],
] as const

export default function Navbar() {
  return (
    <div className="nav-wrap">
      <nav className="nav frosted">
        <span className="wordmark">Monsoon</span>
        <div className="nav-links">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}
