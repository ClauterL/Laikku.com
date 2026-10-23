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

/** Kerrokset, joiden päivä/yö-siirtymän pitää olla valmis ennen seuraavaa (hämärän keyframe-animaatio ja pinot) */
const SKY_LAYERS = '.st-dusk, .st-night-sky, .hero-day-stack, .hero-night-stack'
/** Tauko päivä/yö-siirtymien välissä (ms): valinnan vahvistuksen jälkeen lyhyt, selaillessa pidempi */
const SETTLE = { picked: 40, browse: 280 }
/** Kaikki päivä/yö-siirtymän kerrokset (kiihdytetään yhdessä, kun valinta vaihtuu kesken) */
const SKY_ALL = `${SKY_LAYERS}, .st-stars, .st-moon, .st-aurora, .st-shoot, .hero-sun, .hero-clouds, .hero-birds, .hero-door, .hero-fireflies`

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
   - Nopea edestakainen vaihto ei vilku: taivas vaihtuu vain kokonaisina siirtyminä (ks. sky alla), hiiri valitsee
     vasta viipyessään kortilla ja pesukarhu hyppää seuraavaan korttiin vasta laskeuduttuaan.
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

  /* Päivä ↔ yö. Valinta (kortti + pesukarhu) vaihtuu heti, mutta taivas seuraa sitä vain kokonaisina siirtyminä:
     käynnissä olevaa siirtymää ei koskaan käännetä kesken, vaan uusi alkaa vasta, kun edellinen on valmis, ja se
     kulkee aina viimeisimpään valintaan. Kesken käännetty siirtymä käynnistäisi hämäräkerroksen keyframe-
     animaation alusta ja vaihtaisi pinojen näkyvyyden ja sekoitustilan kesken – se näkyi vilkkumisena.
     Siirtymien väliin jää lisäksi pieni tauko, joten edestakainen heiluttelu ei saa taivasta vilkkumaan.
     Vasta valinnan vahvistus (klikkaus/Enter) kiihdyttää käynnissä olevan siirtymän sujuvasti loppuun
     (playbackRate). Ensimmäinen hämärä laskeutuu hitaasti (ellei kävijä ole jo valinnut). */
  const want = revealed && (picked ?? sel) === 'game'
  const [sky, setSky] = useState<{ night: boolean; dusk: number; dir?: 'in' | 'out' }>({ night: false, dusk: 2.8 })
  const night = sky.night
  const dusk = sky.dusk
  /** onko taivas jo kertaalleen vaihtunut (sekoitustila tarvitaan vasta silloin) */
  const skyStarted = useRef(false)
  /** milloin edellinen siirtymä oikeasti päättyi (tauko lasketaan tästä, ei turhaa viivettä levosta) */
  const skyEnded = useRef(0)
  /** taivaan nykytila odottajille (go) */
  const skyNow = useRef(false)
  useEffect(() => {
    skyNow.current = sky.night
  }, [sky.night])
  const touched = useRef(false)
  const root = useRef<HTMLDivElement>(null)

  /** Lupaus, joka täyttyy, kun annettujen kerrosten päivä/yö-animaatiot ja -siirtymät ovat oikeasti valmiita.
      Raskaassa ruudussa ne voivat alkaa satoja millisekunteja Reactin tilamuutoksen jälkeen, joten kello ei riitä.
      (getAnimations päivittää tyylit, joten juuri luodut siirtymät ovat mukana; päättymättömät luupit ohitetaan.) */
  const settled = useCallback((selector: string) => {
    const el = root.current
    if (!el) return Promise.resolve()
    const running = Array.from(el.querySelectorAll(selector))
      .flatMap((n) => n.getAnimations())
      .filter((a) => a.playState !== 'finished' && a.effect?.getTiming().iterations !== Infinity)
    return Promise.all(running.map((a) => a.finished.catch(() => undefined))).then(() => undefined)
  }, [])

  /** Käynnissä oleva päivä/yö-siirtymä loppuun nopeammin – sujuva kiihdytys, ei katkoa eikä alusta aloitusta */
  const hurry = useCallback((rate: number) => {
    root.current?.querySelectorAll(SKY_ALL).forEach((n) =>
      n.getAnimations().forEach((a) => {
        if (a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity && a.playbackRate < rate) a.updatePlaybackRate(rate)
      }),
    )
  }, [])

  /** Täyttyy, kun taivas on tilassa target ja sen siirtymä on valmis */
  const skyAt = useCallback(
    (target: boolean) =>
      new Promise<void>((resolve) => {
        const check = () => {
          if (skyNow.current !== target) return void window.setTimeout(check, 80)
          void settled(SKY_LAYERS).then(() => (skyNow.current === target ? resolve() : window.setTimeout(check, 80)))
        }
        check()
      }),
    [settled],
  )

  /** Yöpinon kuvat ladattu ja purettu (kerran) */
  const nightDecoded = useRef<Promise<void> | null>(null)
  const nightReady = useCallback(() => {
    if (!nightDecoded.current) {
      const imgs = Array.from(root.current?.querySelectorAll<HTMLImageElement>('.hero-night-stack img') ?? [])
      const all = Promise.all(imgs.map((img) => img.decode().catch(() => undefined))).then(() => undefined)
      nightDecoded.current = Promise.race([all, new Promise<void>((r) => window.setTimeout(r, 2500))])
    }
    return nightDecoded.current
  }, [])

  useEffect(() => {
    if (want === sky.night) return
    let alive = true
    const apply = () => {
      if (!alive) return
      skyStarted.current = true
      setSky({ night: want, dusk: touched.current ? 1.1 : 2.8, dir: want ? 'in' : 'out' })
    }
    // edellinen siirtymä kiihdytetään ja odotetaan loppuun (hämärän keyframe-animaatio ja pinojen häivytys),
    // sitten uusi. Ensimmäinen yö odottaa myös yökuvien purkua (enintään 2,5 s), ettei maisema ilmesty palasina.
    if (picked) hurry(4)
    let id = 0
    void settled(SKY_LAYERS)
      .then(() => (want ? nightReady() : undefined))
      .then(() => {
        if (!alive) return
        // tauko vain peräkkäisten siirtymien väliin; levosta liikkeelle heti
        const gap = picked ? SETTLE.picked : Math.max(0, skyEnded.current + SETTLE.browse - performance.now())
        id = window.setTimeout(apply, gap)
      })
    return () => {
      alive = false
      window.clearTimeout(id)
    }
  }, [want, sky.night, picked, settled, hurry, nightReady])

  /** Päivä/yö-siirtymä käynnissä → maiseman pinot ristihäivytetään plus-lighterillä (levossa ei tarvita).
      Sekoitus poistetaan vasta, kun pinojen häivytys on oikeasti valmis – kesken poistettuna kaksi puoliksi
      läpinäkyvää pinoa näkyisi hetken tummempana (välähdys). Varalla aikaraja, jos jokin siirtymä ei päättyisi. */
  const [fading, setFading] = useState(false)
  useEffect(() => {
    if (!skyStarted.current) return
    setFading(true)
    let alive = true
    const off = () => alive && setFading(false)
    const raf = requestAnimationFrame(
      () =>
        void settled(SKY_LAYERS).then(() => {
          if (alive) skyEnded.current = performance.now()
          window.setTimeout(off, 120)
        }),
    )
    const cap = window.setTimeout(off, dusk * 1000 + 2500)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      window.clearTimeout(cap)
    }
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
      touched.current = true
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
      touched.current = true
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
      ref={root}
      className={cn(
        'start pf @container fixed inset-0 z-[60] overflow-hidden transition-opacity duration-700',
        phase === 'out' && 'pointer-events-none opacity-0',
      )}
      data-night={night ? '' : undefined}
      data-revealed={revealed ? '' : undefined}
      data-dusk={sky.dir}
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
        <p className="rounded-2xl bg-[#14081a]/50 px-3 py-1 text-center sm:rounded-full text-[0.7rem] font-medium text-[#ffe5d4]/90 backdrop-blur-sm">
          {t.start.hint}
        </p>
      </div>
    </div>
  )
}
