import { useEffect, useMemo, useState } from 'react'
import { ArrowUp, Gamepad2, Menu } from 'lucide-react'

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useLang } from '@/hooks/useLang'
import { emblem, links, type Lang, type PortfolioSection } from '@/content'
import { cn } from '@/lib/utils'
import { Ridgeline } from './Landscape'
import { goToSection, sectionId } from './nav'
import { About, Contact, Havaida, Hero, Now, Projects, References, Skills } from './Sections'

function LangSwitch({ className, light }: { className?: string; light?: boolean }) {
  const { lang, setLang, t } = useLang()
  return (
    <div
      role="group"
      aria-label={t.ui.langToggle}
      className={cn('flex rounded-full border p-0.5', light ? 'border-pf-deep/20' : 'border-pf-line-2', className)}
    >
      {(['fi', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider transition-colors cursor-pointer',
            lang === l
              ? light
                ? 'bg-pf-deep text-pf-sky'
                : 'bg-pf-orange text-pf-bg'
              : light
                ? 'text-pf-deep/70 hover:text-pf-deep'
                : 'text-pf-ink-2 hover:text-pf-ink',
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

/* Normaali (classic) portfolio: perinteinen yhden sivun portfolio samasta sisällöstä kuin pelillistetty.
   Auringonlaskun paletti (persikka → oranssi → punainen → munakoiso), oma maisemakuvitus, ei ääniä eikä 3D:tä.
   onGame vaihtaa pelillistettyyn (loft). */
export default function Portfolio({ onGame }: { onGame: () => void }) {
  const { t } = useLang()
  const p = t.portfolio
  const ids = useMemo(() => p.nav.map((n) => n.id), [p.nav])
  const active = useActiveSection(ids)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  // Sivun tausta ja selaimen teemaväri tämän sivun ajaksi
  useEffect(() => {
    const html = document.documentElement
    const meta = document.querySelector('meta[name="theme-color"]')
    const prev = { bg: html.style.background, theme: meta?.getAttribute('content') }
    html.style.background = '#22101e'
    meta?.setAttribute('content', '#22101e')
    return () => {
      html.style.background = prev.bg
      if (prev.theme) meta?.setAttribute('content', prev.theme)
    }
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const max = document.documentElement.scrollHeight - window.innerHeight
        setScrolled(window.scrollY > 24)
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }
  const onSky = !scrolled

  const gameButton = (className?: string, light?: boolean) => (
    <button
      type="button"
      onClick={onGame}
      title={p.gameModeHint}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.78rem] font-bold transition-colors cursor-pointer',
        light
          ? 'border-pf-deep/30 text-pf-deep hover:border-pf-deep hover:bg-pf-deep hover:text-pf-sky'
          : 'border-pf-orange/60 text-pf-orange hover:border-pf-orange hover:bg-pf-orange hover:text-pf-bg',
        className,
      )}
    >
      <Gamepad2 className="size-4" />
      {p.gameMode}
    </button>
  )

  return (
    <div className="pf min-h-svh bg-pf-bg text-pf-ink">
      <a
        href="#pf-main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('pf-main')?.focus()
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-pf-orange focus:px-4 focus:py-2 focus:font-bold focus:text-pf-bg"
      >
        {p.skip}
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top,0px)] transition-[background-color,box-shadow,color] duration-300',
          onSky ? 'text-pf-deep' : 'bg-pf-bg/85 text-pf-ink shadow-[0_1px_0_var(--pf-line)] backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <button type="button" onClick={toTop} className="flex min-w-0 items-center gap-3 text-left cursor-pointer">
            <img src={emblem.poster} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover ring-1 ring-black/20" />
            <span className="poster truncate text-[0.95rem] tracking-[0.04em]">{t.name}</span>
          </button>

          <nav aria-label={p.menu} className="ml-auto hidden items-center gap-0.5 lg:flex">
            {p.nav.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => goToSection(n.id)}
                aria-current={active === n.id ? 'true' : undefined}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[0.82rem] font-bold transition-colors cursor-pointer',
                  active === n.id
                    ? onSky
                      ? 'bg-pf-deep text-pf-sky'
                      : 'bg-pf-orange/15 text-pf-orange'
                    : onSky
                      ? 'text-pf-deep/75 hover:text-pf-deep'
                      : 'text-pf-ink-2 hover:text-pf-ink',
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            <LangSwitch className="hidden sm:flex" light={onSky} />
            {gameButton('hidden md:inline-flex', onSky)}
            <button
              type="button"
              onClick={onGame}
              aria-label={p.gameMode}
              title={p.gameMode}
              className={cn(
                'grid size-10 place-items-center rounded-full border md:hidden cursor-pointer',
                onSky ? 'border-pf-deep/30 text-pf-deep' : 'border-pf-orange/60 text-pf-orange',
              )}
            >
              <Gamepad2 className="size-5" />
            </button>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label={p.menu}
                  className={cn(
                    'grid size-10 place-items-center rounded-full border lg:hidden cursor-pointer',
                    onSky ? 'border-pf-deep/30 text-pf-deep' : 'border-pf-line-2 text-pf-ink-2',
                  )}
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" closeLabel={t.ui.close} className="pf w-[86vw] max-w-sm border-pf-line bg-pf-bg-2 p-0 text-pf-ink">
                <div className="border-b border-pf-line px-6 py-5">
                  <SheetTitle className="poster text-lg text-pf-ink">{t.name}</SheetTitle>
                  <p className="mt-1 text-xs text-pf-muted">{p.hero.eyebrow}</p>
                </div>
                <nav aria-label={p.menu} className="flex flex-col px-3 py-3">
                  {p.nav.map((n) => (
                    <SheetClose asChild key={n.id}>
                      <button
                        type="button"
                        onClick={() => window.setTimeout(() => goToSection(n.id), 50)}
                        className={cn(
                          'rounded-xl px-3 py-3 text-left text-[0.98rem] font-bold transition-colors hover:bg-pf-orange/10 cursor-pointer',
                          active === n.id ? 'text-pf-orange' : 'text-pf-ink-2',
                        )}
                      >
                        {n.label}
                      </button>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-4 border-t border-pf-line px-6 py-5">
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
        {/* vierityksen edistyminen */}
        <div className="h-0.5 w-full overflow-hidden" aria-hidden>
          <div
            className={cn('h-full origin-left bg-gradient-to-r from-pf-sun via-pf-orange to-pf-red transition-opacity', onSky && 'opacity-0')}
            style={{ transform: `scaleX(${progress})` }}
          />
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

      <footer className="relative overflow-hidden bg-pf-bg-3">
        <Ridgeline className="block h-28 w-full bg-pf-bg sm:h-40" />
        <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-10">
          <p
            className="poster select-none whitespace-nowrap text-[clamp(2.4rem,10.5vw,8.6rem)] leading-none text-transparent [-webkit-text-stroke:1px_var(--pf-line-2)]"
            aria-hidden
          >
            {t.name}
          </p>
          <div className="mt-8 flex flex-col gap-6 border-t border-pf-line pt-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <img src={emblem.poster} alt="" width={40} height={40} className="size-10 rounded-full object-cover ring-1 ring-pf-line-2" />
              <div>
                <p className="poster text-sm text-pf-ink">{t.name}</p>
                <p className="text-xs text-pf-muted">
                  {t.ui.copyright} · {p.footer.built}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold">
              <a href={links.repo} target="_blank" rel="noreferrer noopener" className="text-pf-ink-2 hover:text-pf-orange">
                {t.ui.source}
              </a>
              <a href={links.github} target="_blank" rel="noreferrer noopener" className="text-pf-ink-2 hover:text-pf-orange">
                GitHub
              </a>
              {gameButton()}
            </div>
          </div>
        </div>
      </footer>

      {/* takaisin ylös */}
      <button
        type="button"
        onClick={toTop}
        aria-label={p.footer.top}
        title={p.footer.top}
        className={cn(
          'fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-[max(1.25rem,env(safe-area-inset-right,0px))] z-30 grid size-11 place-items-center rounded-full bg-pf-orange text-pf-bg shadow-lg shadow-black/30 transition-[opacity,transform] duration-300 hover:bg-pf-sun cursor-pointer',
          progress > 0.12 ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
        )}
      >
        <ArrowUp className="size-5" />
      </button>
    </div>
  )
}
