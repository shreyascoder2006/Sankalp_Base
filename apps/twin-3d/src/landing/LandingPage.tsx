import { useReveal } from './useReveal'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Problem from './components/Problem'
import Solution from './components/Solution'
import Journey from './components/Journey'
import Pricing from './components/Pricing'
import Benefits from './components/Benefits'
import Impact from './components/Impact'
import Roadmap from './components/Roadmap'
import Footer from './components/Footer'
import type { NavTab } from '../hud/NavRail'
import './landing.css'

interface LandingPageProps {
  onLaunchTwin: () => void
  onSelectTab: (tab: NavTab) => void
}

export default function LandingPage({ onLaunchTwin, onSelectTab }: LandingPageProps) {
  useReveal()

  return (
    <div className="landing-page-wrap">
      <Navbar onLaunchTwin={onLaunchTwin} onSelectTab={onSelectTab} />
      <Hero onLaunchTwin={onLaunchTwin} onSelectTab={onSelectTab} />
      <Problem />
      <Solution />
      <Journey />
      <Pricing />
      <Benefits />
      <Impact />
      <Roadmap />
      <Footer onLaunchTwin={onLaunchTwin} />
    </div>
  )
}
