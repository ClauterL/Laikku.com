import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Now } from '@/components/Now'
import { Pillars } from '@/components/Pillars'
import { Projects } from '@/components/Projects'
import { Code } from '@/components/Code'
import { About } from '@/components/About'
import { Skills } from '@/components/Skills'
import { Testimonials } from '@/components/Testimonials'
import { Services } from '@/components/Services'
import { Cta } from '@/components/Cta'
import { Contact } from '@/components/Contact'
import { Footer } from '@/components/Footer'
import { LangContext, useLangState } from '@/hooks/useLang'
import { useReveal } from '@/hooks/useReveal'

export default function App() {
  const lang = useLangState()
  // Kielen vaihto renderöi osiot uudelleen → paljastus ajetaan uudelleen.
  useReveal([lang.lang])

  return (
    <LangContext.Provider value={lang}>
      <Header />
      <main id="main">
        <Hero />
        <Now />
        <Pillars />
        <Projects />
        <Code />
        <About />
        <Skills />
        <Services />
        <Testimonials />
        <Cta />
        <Contact />
      </main>
      <Footer />
    </LangContext.Provider>
  )
}
