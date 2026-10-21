import { useEffect, useMemo, useState } from 'react'
import { ArrowUp, Gamepad2, Menu } from 'lucide-react'

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useLang } from '@/hooks/useLang'
import { emblem, links, type Lang, type PortfolioSection } from '@/content'
import { cn } from '@/lib/utils'
import { goToSection, sectionId } from './nav'
import { About, Contact, Havaida, Hero, Now, Projects, References, Skills } from './Sections'

function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang()
  return (
    <div role="group" aria-label={t.ui.langToggle} className={cn('flex rounded-full border border-line p-0.5', className)}>
      {(['fi', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider transition-colors cursor-pointer',
            lang === l ? 'bg-brass text-bg' : 'text-ink-2 hover:text-ink',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

/** Mikä osio on näkyvissä (navigaation korostus); hero = ei mitään */
function useActiveSection(ids: PortfolioSection[]) {
  const [active, setActive] = useState<PortfolioSection | null>(null)
  useEffect(() => {
    const els = ['pf-hero', ...ids.map(sectionId)].map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          setActive(e.target.id === 'pf-hero' ? null : (e.target.id.replace('pf-', '') as PortfolioSection))
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ids])
  return active
}

/* Normaali portfolio: perinteinen yhden sivun portfolio samasta sisällöstä kuin pelillistetty versio.
   Ei ääniä, ei 3D:tä, ei pelivalikon koristeita. onGame vaihtaa pelillistettyyn (loft). */
export default function Portfolio({ onGame }: { onGame: () => void }) {
  const { t } = useLang()
  const p = t.portfolio
  const ids = useMemo(() => p.nav.map((n) => n.id), [p.nav])
  const active = useActiveSection(ids)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  const gameButton = (className?: string) => (
    <button
      type="button"
      onClick={onGame}
      title={p.gameModeHint}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-brass/60 px-3.5 py-1.5 text-[0.78rem] font-semibold text-brass-2 transition-colors hover:border-brass hover:bg-brass/10 cursor-pointer',
        className,
      )}
    >
      <Gamepad2 className="size-4" />
      {p.gameMode}
    </button>
  )

  return (
    <div className="pf min-h-svh bg-bg text-ink">
      <a
        href="#pf-main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('pf-main')?.focus()
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-brass focus:px-3 focus:py-2 focus:text-bg"
      >
        {p.skip}
      </a>

      <header
        className={cn(
          'sticky top-0 z-40 border-b pt-[env(safe-area-inset-top,0px)] transition-colors duration-300',
          scrolled ? 'border-line/70 bg-bg/90 backdrop-blur-md' : 'border-transparent bg-bg/0',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <button type="button" onClick={toTop} className="flex min-w-0 items-center gap-3 text-left cursor-pointer">
            <img src={emblem.poster} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover ring-1 ring-line-2" />
            <span className="min-w-0">
              <span className="block truncate font-display text-[0.98rem] tracking-[0.08em] text-ink">{t.name}</span>
              <span className="hidden text-[0.7rem] text-muted-foreground sm:block">{p.hero.eyebrow}</span>
            </span>
          </button>

          <nav aria-label={p.menu} className="ml-auto hidden items-center gap-0.5 lg:flex">
            {p.nav.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => goToSection(n.id)}
                aria-current={active === n.id ? 'true' : undefined}
                className={cn(
                  'relative rounded-full px-3 py-1.5 text-[0.82rem] font-semibold transition-colors cursor-pointer',
                  active === n.id ? 'text-brass-2' : 'text-ink-2 hover:text-ink',
                )}
              >
                {n.label}
                {active === n.id && <span className="absolute inset-x-3 -bottom-0.5 h-px bg-brass" aria-hidden />}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            <LangSwitch className="hidden sm:flex" />
            {gameButton('hidden md:inline-flex')}
            <button
              type="button"
              onClick={onGame}
              aria-label={p.gameMode}
              title={p.gameMode}
              className="grid size-10 place-items-center rounded-full border border-brass/60 text-brass-2 hover:border-brass hover:bg-brass/10 md:hidden cursor-pointer"
            >
              <Gamepad2 className="size-5" />
            </button>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label={p.menu}
                  className="grid size-10 place-items-center rounded-full border border-line text-ink-2 hover:border-brass hover:text-brass-2 lg:hidden cursor-pointer"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" closeLabel={t.ui.close} className="w-[86vw] max-w-sm border-line bg-bg-2 p-0">
                <div className="border-b border-line px-6 py-5">
                  <SheetTitle className="font-display text-lg tracking-[0.08em] text-ink">{t.name}</SheetTitle>
                  <p className="mt-1 text-xs text-muted-foreground">{p.hero.eyebrow}</p>
                </div>
                <nav aria-label={p.menu} className="flex flex-col px-3 py-3">
                  {p.nav.map((n) => (
                    <SheetClose asChild key={n.id}>
                      <button
                        type="button"
                        onClick={() => window.setTimeout(() => goToSection(n.id), 50)}
                        className={cn(
                          'rounded-sm px-3 py-3 text-left text-[0.95rem] font-semibold transition-colors hover:bg-brass/10 cursor-pointer',
                          active === n.id ? 'text-brass-2' : 'text-ink-2',
                        )}
                      >
                        {n.label}
                      </button>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-4 border-t border-line px-6 py-5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span>{t.ui.langToggle}</span>
                    <LangSwitch />
                  </div>
                  <SheetClose asChild>{gameButton('justify-center')}</SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="pf-main" tabIndex={-1} className="outline-none">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Now />
        <Havaida />
        <References />
        <Contact />
      </main>

      <footer className="border-t border-line/70 bg-bg-2/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={emblem.poster} alt="" width={40} height={40} className="size-10 rounded-full object-cover ring-1 ring-line-2" />
            <div>
              <p className="font-display text-ink">{t.name}</p>
              <p className="text-xs text-muted-foreground">
                {t.ui.copyright} · {p.footer.built}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <a href={links.repo} target="_blank" rel="noreferrer noopener" className="text-ink-2 hover:text-brass-2">
              {t.ui.source}
            </a>
            <a href={links.github} target="_blank" rel="noreferrer noopener" className="text-ink-2 hover:text-brass-2">
              GitHub
            </a>
            {gameButton()}
            <button type="button" onClick={toTop} className="inline-flex items-center gap-1.5 text-ink-2 hover:text-brass-2 cursor-pointer">
              <ArrowUp className="size-4" />
              {p.footer.top}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
