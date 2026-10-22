import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, Gamepad2, Newspaper, Volume2, VolumeX } from 'lucide-react'

import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { Logo } from '@/components/Logo'
import { HeroScene } from '@/components/portfolio/Landscape'
import type { Lang } from '@/content'
import { cn } from '@/lib/utils'
import { StartRaccoon } from './StartRaccoon'
import { StartSky } from './StartSky'

export type Mode = 'normal' | 'game'
const MODES: Mode[] = ['normal', 'game']
const MODE_ICON = { normal: Newspaper, game: Gamepad2 }
const SOUND_ICON = { normal: VolumeX, game: Volume2 }
/** Selaimen teemaväri: päivä = taivaan persikka, yö = yötaivas */
const THEME = { day: '#fde4cd', night: '#050a1e' }

type Phase = 'idle' | 'loading' | 'out'

function LangSwitch() {
  const { lang, setLang, t } = useLang()
  return (
    <div role="group" aria-label={t.ui.langToggle} className="st-chip flex rounded-full p-0.5">
      {(['fi', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn(
            'cursor-pointer rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider transition-colors',
            lang === l ? 'bg-[var(--st-ink)] text-[var(--st-on)]' : 'st-ink-2 hover:text-[var(--st-ink)]',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

/* Aloitusruutu: Järvi-Suomen maisema, jossa kävijä valitsee portfolion.
   - Sama Higgsfield-maisema (HeroScene) kuin normaalin portfolion herossa: Normaali = kultainen auringonlasku,
     Pelillistetty = revontuliyö (yötasot scripts/hero-night.py, revontulet ja tähdet StartSky.tsx).
     Valinta vaihtaa vuorokaudenajan, joten kävijä näkee molempien tunnelman ennen valintaa.
   - Tunnus (morse-pääsiäismuna) ja nimi tulevat esiin, sitten valinta osuu Pelillistettyyn ja hämärä laskeutuu.
   - Pesukarhu istuu valitun kortin päällä ja hyppää kortilta toiselle (StartRaccoon.tsx).
   - Normaali: käyttöliittymä häipyy, portfolio piirtyy alle samaan maisemaan ja ruutu häivytetään sen päältä.
     Pelillistetty: ääni päälle (selaimet vaativat eleen), revontulet kiihtyvät, latauspalkki ja loft.
   onPick kutsutaan heti (ennakkolataus, voi palauttaa lupauksen), onDone vaihtaa näkymän ja onExited poistaa ruudun. */
export function StartScreen({
  onPick,
  onDone,
  onExited,
}: {
  onPick?: (mode: Mode) => Promise<unknown> | void
  onDone: (mode: Mode) => void
  onExited?: () => void
}) {
  const { t } = useLang()
  const { start, play } = useSound()
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealed, setRevealed] = useState(false)
  const [sel, setSel] = useState<Mode>('game')
  const [picked, setPicked] = useState<Mode | null>(null)
  const [cheer, setCheer] = useState(0)
  /** Päivä ↔ yö -siirtymän kesto: ensimmäinen hämärä laskeutuu hitaasti, sen jälkeen vaihto on nopea */
  const [dusk, setDusk] = useState(2.8)
  const buttons = useRef<Partial<Record<Mode, HTMLButtonElement | null>>>({})
  const grid = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  const night = revealed && (picked ?? sel) === 'game'
  /** Milloin päivä/yö viimeksi vaihtui – normaali odottaa, että aamu on ehtinyt valjeta */
  const switched = useRef({ at: 0, ms: 0 })

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  // Nimi ja valinta tulevat esiin, kun tunnus on näkynyt hetken; ensimmäisen hämärän jälkeen nopeampi vaihto
  useEffect(() => {
    later(1400, () => setRevealed(true))
    later(1400 + 3000, () => setDusk(1.1))
    const ids = timers.current
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [later])

  /** Päivä/yö-siirtymä käynnissä → maiseman pinot ristihäivytetään plus-lighterillä (levossa ei tarvita) */
  const [fading, setFading] = useState(false)
  useEffect(() => {
    switched.current = { at: performance.now(), ms: dusk * 1000 }
    if (!revealed) return
    setFading(true)
    const id = window.setTimeout(() => setFading(false), dusk * 1000 + 150)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [night])

  // Selaimen yläpalkin väri seuraa taivasta (palautetaan, ellei joku muu ole jo vaihtanut sitä)
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    const prev = meta.getAttribute('content')
    const mine = night ? THEME.night : THEME.day
    meta.setAttribute('content', mine)
    return () => {
      if (prev && meta.getAttribute('content') === mine) meta.setAttribute('content', prev)
    }
  }, [night])

  const choose = useCallback(
    (mode: Mode) => {
      if (phase !== 'idle') return
      setRevealed(true)
      setSel(mode)
      setDusk((d) => Math.min(d, 1.1))
    },
    [phase],
  )

  const go = useCallback(
    (mode: Mode) => {
      if (phase !== 'idle') return
      setRevealed(true)
      setSel(mode)
      setPicked(mode)
      setCheer((c) => c + 1)
      setDusk((d) => Math.min(d, 1.1))
      setPhase('loading')
      const ready = Promise.resolve(onPick?.(mode)).catch(() => undefined)
      if (mode === 'game') {
        start()
        play('boot')
        // peli piirtyy aloitusruudun alle latauspalkin aikana, sitten ruutu häivytetään sen päältä
        const min = new Promise((r) => window.setTimeout(r, 1650))
        const cap = new Promise((r) => window.setTimeout(r, 5000))
        void Promise.race([Promise.all([ready, min]), cap]).then(() => {
          onDone(mode)
          later(300, () => setPhase('out'))
          later(300 + 720, () => onExited?.())
        })
        return
      }
      // Normaali: odotetaan portfolion paketti (enintään 4 s) ja mahdollinen yö → päivä, sitten portfolio
      // piirtyy tämän alle samaan maisemaan ja tämä häivytetään pois sen päältä.
      const left = night ? Math.min(dusk, 1.1) * 1000 : switched.current.ms - (performance.now() - switched.current.at)
      const min = new Promise((r) => window.setTimeout(r, Math.max(650, left + 80)))
      const cap = new Promise((r) => window.setTimeout(r, 4000))
      void Promise.race([Promise.all([ready, min]), cap]).then(() => {
        onDone(mode)
        later(260, () => setPhase('out'))
        later(260 + 720, () => onExited?.())
      })
    },
    [phase, night, dusk, start, play, onPick, onDone, onExited, later],
  )

  // Näppäimet: nuolet vaihtavat valintaa, Enter/välilyönti aloittaa, 1/2 valitsee suoraan
  useEffect(() => {
    if (phase !== 'idle') return
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
        const next: Mode = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? 'normal' : 'game'
        choose(next)
        buttons.current[next]?.focus({ preventScroll: true })
      } else if (e.key === '1' || e.key === '2') {
        go(e.key === '1' ? 'normal' : 'game')
      } else if ((e.key === 'Enter' || e.key === ' ') && !(document.activeElement instanceof HTMLButtonElement)) {
        e.preventDefault()
        go(sel)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, sel, go, choose])

  return (
    <div
      className={cn(
        'start pf @container fixed inset-0 z-[60] overflow-hidden transition-opacity duration-700',
        phase === 'out' && 'pointer-events-none opacity-0',
      )}
      data-night={night ? '' : undefined}
      data-revealed={revealed ? '' : undefined}
      data-fading={fading ? '' : undefined}
      data-phase={phase}
      style={{ '--dusk': `${dusk}s` } as CSSProperties}
    >
      <StartSky />
      <HeroScene night={night} className="duration-1000 animate-in fade-in" />

      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
        <div className="st-ui st-main relative flex min-h-full flex-col items-center px-4 pb-[clamp(88px,20svh,230px)] sm:px-6">
          <header className="flex w-full max-w-6xl items-center justify-between gap-3 pt-[max(14px,env(safe-area-inset-top))]">
            <p className="st-ink-2 st-rise text-[0.66rem] font-bold uppercase tracking-[0.24em] sm:text-[0.7rem]">{t.start.eyebrow}</p>
            <div className="st-rise">
              <LangSwitch />
            </div>
          </header>

          <main className="flex w-full max-w-[1100px] flex-1 flex-col items-center pt-[clamp(6px,4.5svh,60px)] text-center">
            {/* tunnus: kuvake läppärin takana, <#> – pääsiäismunana SMART morsena */}
            <Logo play="loop" className="st-ink st-rise w-[clamp(54px,11svh,124px)]" />
            <h1
              className="poster st-ink st-rise mt-[clamp(8px,1.6svh,18px)] text-[clamp(2.2rem,min(7vw,9.5svh),7rem)] leading-[0.9] [--d:160ms] md:whitespace-nowrap"
            >
              {t.name}
            </h1>

            <div
              className={cn(
                'st-choice flex w-full max-w-[min(860px,max(680px,42vw))] flex-col items-center transition-opacity duration-700',
                revealed ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <p id="start-choose" className="st-ink-2 mt-[clamp(12px,3svh,30px)] text-[0.68rem] font-bold uppercase tracking-[0.26em]">
                {t.start.choose}
              </p>

              <div
                ref={grid}
                role="group"
                aria-labelledby="start-choose"
                className="relative mt-[clamp(52px,8.5svh,80px)] grid w-full grid-cols-2 gap-3 sm:gap-4"
              >
                <StartRaccoon grid={grid} target={sel} visible={revealed && phase !== 'out'} cheer={cheer} />
                {MODES.map((mode, i) => {
                  const Icon = MODE_ICON[mode]
                  const Sound = SOUND_ICON[mode]
                  const m = t.start.modes[mode]
                  return (
                    <button
                      key={mode}
                      ref={(el) => {
                        buttons.current[mode] = el
                      }}
                      type="button"
                      data-mode={mode}
                      data-active={sel === mode ? '' : undefined}
                      onClick={() => go(mode)}
                      onMouseEnter={() => choose(mode)}
                      onFocus={() => choose(mode)}
                      aria-describedby="start-keys"
                      className="st-card"
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="st-icon">
                          <Icon className="size-5" strokeWidth={1.9} />
                        </span>
                        <span className="st-num" aria-hidden>
                          {i + 1}
                        </span>
                      </span>
                      <span className="poster mt-1 text-[clamp(0.9rem,3.5vw,1.3rem)] leading-none [overflow-wrap:anywhere]">{m.title}</span>
                      <span className="text-[0.8rem] font-medium leading-snug opacity-80 sm:text-[0.86rem]">{m.desc}</span>
                      <span className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1">
                        <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] opacity-60">
                          <Sound className="size-3.5" aria-hidden />
                          {m.badge}
                        </span>
                        <span className="st-cta" aria-hidden>
                          {m.cta}
                          <ArrowRight className="size-3.5" />
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <p id="start-keys" className="st-ink-2 mt-5 hidden text-[0.64rem] font-bold uppercase tracking-[0.22em] sm:block">
                {t.start.keys}
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* pelillistetty: latauspalkki revontulten alla */}
      {phase !== 'idle' && picked === 'game' && (
        <div className="pointer-events-none absolute inset-x-0 top-[40%] flex flex-col items-center gap-3 px-4 duration-500 animate-in fade-in">
          <p className="st-ink text-center text-[0.72rem] font-bold uppercase tracking-[0.25em]">
            {t.start.modes.game.title} · {t.start.loading}
          </p>
          <div className="h-[3px] w-56 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-full origin-left animate-[st-grow_1.5s_ease-out_forwards] bg-teal-2 shadow-[0_0_12px_rgba(127,211,204,0.8)]" />
          </div>
        </div>
      )}

      <div
        className={cn(
          'st-ui pointer-events-none absolute inset-x-0 bottom-[max(10px,env(safe-area-inset-bottom))] flex justify-center px-4 transition-opacity duration-700',
          revealed ? 'opacity-100' : 'opacity-0',
        )}
      >
        <p className="rounded-2xl bg-[#14081a]/50 px-3 py-1 text-center sm:rounded-full text-[0.7rem] font-medium text-[#ffe5d4]/90 backdrop-blur-sm">
          {t.start.hint}
        </p>
      </div>
    </div>
  )
}
