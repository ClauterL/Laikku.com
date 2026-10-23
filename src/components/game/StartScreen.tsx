import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, Gamepad2, Newspaper, Volume2, VolumeX } from 'lucide-react'

import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { Logo } from '@/components/Logo'
import type { Lang } from '@/content'
import { cn } from '@/lib/utils'
import { SKY_DURATION, StartBackdrop } from './StartBackdrop'
import { StartRaccoon } from './StartRaccoon'

export type Mode = 'normal' | 'game'
const MODES: Mode[] = ['normal', 'game']
const MODE_ICON = { normal: Newspaper, game: Gamepad2 }
const SOUND_ICON = { normal: VolumeX, game: Volume2 }
/** Selaimen teemaväri: päivä = taivaan persikka, yö = yötaivas */
const THEME = { day: '#fde4cd', night: '#050a1e' }

type Phase = 'idle' | 'loading' | 'out'

/** Päivä/yö-siirtymän nopeus: ensimmäinen hämärä luonnollisella nopeudella, selaillessa reippaammin,
    valinnan vahvistus kiihdyttää käynnissä olevan loppuun */
const RATE = { first: 1, browse: 2, picked: 3 }

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
   - Sama Järvi-Suomen maisema kuin normaalin portfolion herossa: Normaali = kultainen auringonlasku,
     Pelillistetty = revontuliyö. Siirtymä on Higgsfieldillä esirenderöity video (StartBackdrop.tsx), joka toistuu
     sujuvasti ja kääntyy kesken saumattomasti. Valinta vaihtaa vuorokaudenajan, joten kävijä näkee molempien
     tunnelman ennen valintaa.
   - Tunnus (morse-pääsiäismuna) ja nimi tulevat esiin, sitten valinta osuu Pelillistettyyn ja hämärä laskeutuu.
   - Hiiri valitsee vasta viipyessään kortilla, ja pesukarhu hyppää seuraavaan korttiin vasta laskeuduttuaan.
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
  const buttons = useRef<Partial<Record<Mode, HTMLButtonElement | null>>>({})
  const grid = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  /** hiiren viipymä kortin päällä ennen valintaa (ohi liukuva osoitin ei vaihda valintaa) */
  const hover = useRef(0)

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  // Nimi ja valinta tulevat esiin, kun tunnus on näkynyt hetken
  useEffect(() => {
    later(1400, () => setRevealed(true))
    const ids = timers.current
    return () => {
      ids.forEach((id) => window.clearTimeout(id))
      window.clearTimeout(hover.current)
    }
  }, [later])

  /* Päivä ↔ yö. Taustavideo kulkee aina viimeisimpään valintaan; kesken oleva siirtymä kääntyy saumattomasti
     (StartBackdrop). Käyttöliittymän värit seuraavat sitä suuntaa, johon tausta oikeasti liikkuu (heading). */
  const want = revealed && (picked ?? sel) === 'game'
  const [touched, setTouched] = useState(false)
  const rate = picked ? RATE.picked : touched ? RATE.browse : RATE.first
  const [night, setNight] = useState(false)
  /** taustan lepotila odottajille (go): true = yö, false = päivä, null = liikkeellä */
  const skyNow = useRef<boolean | null>(false)
  const onRest = useCallback((n: boolean | null) => {
    skyNow.current = n
  }, [])

  /** Täyttyy, kun tausta on levossa tilassa target */
  const skyAt = useCallback(
    (target: boolean) =>
      new Promise<void>((resolve) => {
        const check = () => (skyNow.current === target ? resolve() : window.setTimeout(check, 60))
        check()
      }),
    [],
  )

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
      setTouched(true)
      setRevealed(true)
      setSel(mode)
    },
    [phase],
  )

  /** Hiiri: valitaan vasta, kun osoitin viipyy kortilla hetken (nopea liuku korttien yli ei vaihda mitään) */
  const hoverIn = (mode: Mode) => {
    window.clearTimeout(hover.current)
    hover.current = window.setTimeout(() => choose(mode), 110)
  }
  const hoverOut = () => window.clearTimeout(hover.current)

  const go = useCallback(
    (mode: Mode) => {
      if (phase !== 'idle') return
      window.clearTimeout(hover.current)
      setTouched(true)
      setRevealed(true)
      setSel(mode)
      setPicked(mode)
      setCheer((c) => c + 1)
      setPhase('loading')
      const ready = Promise.resolve(onPick?.(mode)).catch(() => undefined)
      if (mode === 'game') {
        start()
        play('boot')
        // peli piirtyy aloitusruudun alle latauspalkin aikana, sitten ruutu häivytetään sen päältä
        const min = Promise.all([skyAt(true), new Promise((r) => window.setTimeout(r, 1650))])
        const cap = new Promise((r) => window.setTimeout(r, 5000))
        void Promise.race([Promise.all([ready, min]), cap]).then(() => {
          onDone(mode)
          later(300, () => setPhase('out'))
          later(300 + 720, () => onExited?.())
        })
        return
      }
      // Normaali: odotetaan portfolion paketti (enintään 4 s) ja että aamu on valjennut, sitten portfolio
      // piirtyy tämän alle samaan maisemaan ja tämä häivytetään pois sen päältä.
      const min = Promise.all([skyAt(false), new Promise((r) => window.setTimeout(r, 650))])
      const cap = new Promise((r) => window.setTimeout(r, 4000))
      void Promise.race([Promise.all([ready, min]), cap]).then(() => {
        onDone(mode)
        later(260, () => setPhase('out'))
        later(260 + 720, () => onExited?.())
      })
    },
    [phase, start, play, onPick, onDone, onExited, later, skyAt],
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
      data-phase={phase}
      style={{ '--dusk': `${(SKY_DURATION / rate).toFixed(2)}s` } as CSSProperties}
    >
      <StartBackdrop night={want} rate={rate} excited={phase !== 'idle' && picked === 'game'} onHeading={setNight} onRest={onRest} />

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
                      onMouseEnter={() => hoverIn(mode)}
                      onMouseLeave={hoverOut}
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

              <p id="start-keys" className="st-chip st-ink-2 mt-5 hidden rounded-full px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.22em] sm:block">
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
        <p className="rounded-2xl bg-[#14081a]/60 px-3 py-1 text-center sm:rounded-full text-[0.7rem] font-medium text-[#ffe5d4]/90">
          {t.start.hint}
        </p>
      </div>
    </div>
  )
}
