import Benefits from './components/Benefits'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Impact from './components/Impact'
import Journey from './components/Journey'
import Navbar from './components/Navbar'
import Pricing from './components/Pricing'
import Problem from './components/Problem'
import Roadmap from './components/Roadmap'
import Solution from './components/Solution'
import { useReveal } from './useReveal'
import './index.css'

export default function App() {
  useReveal()
  return (
    <>
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Journey />
      <Pricing />
      <Benefits />
      <Impact />
      <Roadmap />
      <Footer />
    </>
  )
}
