import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Heart, Newspaper, RotateCcw, Volume2, VolumeX, X } from 'lucide-react'

import { gameArt, type FlightStation, type Lang } from '@/content'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { Logo } from '@/components/Logo'
import { TechIcon } from '@/components/TechIcon'
import { arm, show } from '@/components/portfolio/Critters'
import { useReducedMotion } from '@/components/portfolio/hooks'
import { StartSky } from '@/components/game/StartSky'
import { cn } from '@/lib/utils'
import { PANELS } from './Panels'
import { Backdrop, Bat, Foreground, Gull, px } from './Scenery'
import {
  FIND_KEYS,
  GRAB,
  GUST,
  HAZARDS,
  HEARTS,
  NEAR,
  NIGHT_OFF,
  NIGHT_ON,
  SHIELD,
  SPLASH_Y,
  STATIONS,
  STUN,
  WATER,
  WIND,
  WORLD,
  X_MAX,
  X_MIN,
  Y_MAX,
  findPath,
} from './world'

/* Pelillistetty portfolio: DRONELENTO.
   Lennät dronella (pesukarhu kyydissä) sivuttain vierivän Järvi-Suomen yli auringonlaskusta revontuliyöhön.
   Rannan kohteet avaavat portfolion osiot – niihin pääsee aina, myös autopilotilla.
   Keräyshaaste: ilmassa liikkuu 12 teknologiaa, jotka kerätään ajanotolla. Lokit (päivällä) ja lepakot (yöllä)
   partioivat löytöjen lähellä, vedenpinta kastelee ja tuulisilla alueilla puuskat työntävät. Kolme osumaa →
   kierroksen löydöt putoavat järveen ja yritys alkaa alusta. Autopilotti on suojattu, mutta se ei kerää löytöjä.
   - Grafiikka ja elävä ympäristö: Scenery.tsx (Higgsfield-kuvat, CSS/SMIL-animaatiot).
   - Päivä ja yö ovat kokonaisia kerrospinoja, jotka ristihäivytetään plus-lighter-sekoituksella → ei reunaviivoja.
   - Liike: yksi requestAnimationFrame-silmukka kirjoittaa vain transformeja (tasot, drone, löydöt, vaarat);
     React piirtää uudelleen vain, kun jokin harvoin muuttuva asia vaihtuu (kohde, yö, osuma, löytö, paneeli).
   - Ohjaus: nuolet/WASD, Enter avaa, 1–9 autopilotti, R uusi yritys, M ääni; kosketuksella nuolinapit ja napautus. */

type Sim = {
  x: number // dronen keskikohta (H)
  y: number // dronen keskikohta laatikon yläreunasta (H)
  vx: number
  vy: number
  cam: number // kameran vasen reuna (px)
  face: 1 | -1
  keys: { l: boolean; r: boolean; u: boolean; d: boolean }
  auto: { x: number; open: FlightStation | null } | null
  t: number // seinäkello (s)
  gt: number // pelin kello: pysähtyy paneelin ajaksi (vaarojen ja löytöjen liike)
  inv: number // osumasuojaa jäljellä (s)
  stun: number // ohjaus pois (s)
  spin: number // pyörähdyksen suunta osumassa
}

/** Keräyskierros */
type Run = { got: Set<string>; hearts: number; t: number; started: boolean; done: boolean; over: boolean; autoTold: boolean }

type Dims = { vw: number; vh: number; H: number; top: number }

const START_X = STATIONS[0].x + 0.05
const CRUISE = 0.05
const MAX_V = 1.45 // H/s
const MAX_VY = 0.85
const STORE = 'laikku-flight'
const RACCOON = gameArt.raccoon
/** Pesukarhun lepoasennon korkeus (H) */
const RAC_H = 0.095
type Clip = keyof typeof RACCOON.clips

function measure(): Dims {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const H = Math.round(Math.max(240, Math.min(vh * 0.6, vw * 1.15, 900)))
  return { vw, vh, H, top: vh - H }
}

type Store = { visited: FlightStation[]; best: number | null }

function readStore(): Store {
  try {
    const v = JSON.parse(window.localStorage.getItem(STORE) ?? '{}')
    return { visited: Array.isArray(v.visited) ? v.visited : [], best: typeof v.best === 'number' ? v.best : null }
  } catch {
    return { visited: [], best: null }
  }
}

function writeStore(v: Store) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(v))
  } catch {}
}

/** Aika muodossa m:ss,d (suomeksi pilkku) */
function fmtTime(sec: number, lang: Lang) {
  const tenths = Math.floor(sec * 10)
  const m = Math.floor(tenths / 600)
  const s = Math.floor((tenths % 600) / 10)
  return `${m}:${String(s).padStart(2, '0')}${lang === 'fi' ? ',' : '.'}${tenths % 10}`
}

const newRun = (): Run => ({ got: new Set(), hearts: HEARTS, t: 0, started: false, done: false, over: false, autoTold: false })

/* ---------------- HUD ---------------- */

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
            'cursor-pointer rounded-full px-2 py-1 text-[0.68rem] font-bold uppercase tracking-wider transition-colors sm:px-2.5',
            lang === l ? 'bg-[var(--st-ink)] text-[var(--st-on)]' : 'st-ink-2 hover:text-[var(--st-ink)]',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

/** Tuulijuovat puuskaisella alueella: [korkeus H, leveys H, kesto s, viive s] */
const STREAKS: [number, number, number, number][] = [
  [-0.36, 0.22, 0.9, 0],
  [-0.22, 0.3, 1.1, -0.4],
  [-0.08, 0.18, 0.8, -0.7],
  [0.04, 0.26, 1, -0.2],
  [0.16, 0.2, 0.85, -0.55],
  [0.28, 0.32, 1.15, -0.9],
  [0.4, 0.22, 0.95, -0.3],
  [0.5, 0.18, 0.8, -0.65],
]

/* ---------------- peli ---------------- */

export default function FlightGame({ onNormal }: { onNormal: () => void }) {
  const { t, lang } = useLang()
  const f = t.flight
  const { muted, toggleMute, play } = useSound()
  const reduce = useReducedMotion()

  const root = useRef<HTMLDivElement>(null)
  const drone = useRef<HTMLDivElement>(null)
  const echo = useRef<HTMLDivElement>(null)
  const wash = useRef<HTMLDivElement>(null)
  const splash = useRef<HTMLDivElement>(null)
  const racWrap = useRef<HTMLDivElement>(null)
  const racBody = useRef<HTMLDivElement>(null)
  const bubbleEl = useRef<HTMLDivElement>(null)
  const marker = useRef<HTMLSpanElement>(null)
  const timeEl = useRef<HTMLSpanElement>(null)
  const orbEls = useRef<(HTMLDivElement | null)[]>([])
  const hazEls = useRef<(HTMLDivElement | null)[]>([])
  const dims = useRef<Dims>(measure())
  const sim = useRef<Sim>({
    x: START_X,
    y: CRUISE,
    vx: 0,
    vy: 0,
    cam: 0,
    face: 1,
    keys: { l: false, r: false, u: false, d: false },
    auto: null,
    t: 0,
    gt: 0,
    inv: 0,
    stun: 0,
    spin: 1,
  })
  const run = useRef<Run>(newRun())
  // kehitystilassa testeille: window.__flight.sim / .run
  if (import.meta.env.DEV) (window as unknown as { __flight?: unknown }).__flight = { sim: sim.current, run }

  const [near, setNear] = useState<FlightStation | null>(null)
  const [night, setNight] = useState(false)
  /** Iltaruskon siirtymä (st-dusk) vasta ensimmäisestä yöstä alkaen, ei heti avattaessa */
  const [dusked, setDusked] = useState(false)
  /** Siirtymä käynnissä → plus-lighter-ristihäivytys päälle (levossa ei tarvita) */
  const [fading, setFading] = useState(false)
  const firstNight = useRef(true)
  useEffect(() => {
    if (firstNight.current) {
      firstNight.current = false
      return
    }
    setFading(true)
    const id = window.setTimeout(() => setFading(false), 2600)
    return () => window.clearTimeout(id)
  }, [night])
  const [panel, setPanel] = useState<FlightStation | null>(null)
  const [store, setStore] = useState(readStore)
  const storeRef = useRef(store)
  storeRef.current = store
  const [hud, setHud] = useState({ got: 0, hearts: HEARTS, done: false })
  const [wind, setWind] = useState<{ g: 0 | 1 | 2; d: number }>({ g: 0, d: 0 })
  const [bubble, setBubble] = useState<{ text: string; key: number } | null>(null)
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null)
  const [touch, setTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches)

  const nearRef = useRef<FlightStation | null>(null)
  const nightRef = useRef(false)
  const panelRef = useRef<FlightStation | null>(null)
  panelRef.current = panel

  /** Löydöt: taitopuun solmut, joille on ikoni; rata kahdeksikkona */
  const finds = useMemo(() => {
    const nodes = t.skills.branches.flatMap((b) => b.nodes)
    return FIND_KEYS.map((k) => nodes.find((n) => n.icon === k))
      .filter((n): n is NonNullable<typeof n> => !!n)
      .map((n, i) => ({ id: n.icon, name: n.name, level: n.level, ...findPath(i, FIND_KEYS.length) }))
  }, [t])
  const findsRef = useRef(finds)
  findsRef.current = finds
  const fmt = useCallback((sec: number) => fmtTime(sec, lang), [lang])

  /* ----- pesukarhu: eleet ruudukosta (sama maski-tekniikka kuin Critters) ----- */
  const rac = useRef({ timer: 0, busy: false })
  const playRaccoon = useCallback(
    (clip: Clip) => {
      const el = racBody.current
      if (!el) return
      window.clearTimeout(rac.current.timer)
      const c = RACCOON.clips[clip]
      if (reduce) return
      let i = 0
      rac.current.busy = true
      const tick = () => {
        if (i >= c.count) {
          show(el, RACCOON, RACCOON.clips.wave.start)
          rac.current.busy = false
          return
        }
        show(el, RACCOON, c.start + i)
        const ms = c.ms[i] ?? 42
        i++
        rac.current.timer = window.setTimeout(tick, ms)
      }
      tick()
    },
    [reduce],
  )

  const say = useCallback(
    (text: string, clip?: Clip) => {
      setBubble({ text, key: Date.now() })
      if (clip) playRaccoon(clip)
    },
    [playRaccoon],
  )

  // puhekupla häviää itsestään
  useEffect(() => {
    if (!bubble) return
    const id = window.setTimeout(() => setBubble(null), Math.min(9000, 2600 + bubble.text.length * 55))
    return () => window.clearTimeout(id)
  }, [bubble])
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  /* ----- keräyskierros ----- */
  const resetRun = useCallback(() => {
    run.current = newRun()
    orbEls.current.forEach((el) => el?.removeAttribute('data-got'))
    if (timeEl.current) timeEl.current.textContent = fmt(0)
    setHud({ got: 0, hearts: HEARTS, done: false })
  }, [fmt])

  /* ----- kohteet ja paneelit ----- */
  const openStation = useCallback(
    (id: FlightStation) => {
      setPanel(id)
      play('open')
      setStore((s) => {
        if (s.visited.includes(id)) return s
        const next = { ...s, visited: [...s.visited, id] }
        writeStore(next)
        if (next.visited.length === STATIONS.length) window.setTimeout(() => say(f.raccoon.allStations, 'cheer'), 400)
        return next
      })
    },
    [play, say, f.raccoon.allStations],
  )

  const flyTo = useCallback(
    (id: FlightStation, open = true) => {
      const st = STATIONS.find((s) => s.id === id)
      if (!st) return
      setPanel(null)
      play('select')
      const s = sim.current
      if (Math.abs(s.x - st.x) < 0.06) {
        if (open) openStation(id)
        return
      }
      s.auto = { x: st.x, open: open ? id : null }
      const r = run.current
      if (r.started && !r.done && !r.autoTold) {
        r.autoTold = true
        window.setTimeout(() => say(f.raccoon.autopilot), 300)
      }
    },
    [play, openStation, say, f.raccoon.autopilot],
  )

  const pickStation = useCallback(
    (id: FlightStation) => {
      if (nearRef.current === id) openStation(id)
      else flyTo(id)
    },
    [openStation, flyTo],
  )

  /* ----- mitat ----- */
  useEffect(() => {
    const el = root.current
    if (!el) return
    const apply = () => {
      const d = measure()
      dims.current = d
      el.style.setProperty('--H', String(d.H))
      el.style.setProperty('--sun-x', `${Math.round(d.vw * (d.vw > d.H * 1.4 ? 0.7 : 0.62))}px`)
      setTouch(window.matchMedia('(pointer: coarse)').matches)
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  /* ----- pesukarhu valmiiksi + tervehdys ----- */
  useEffect(() => {
    const el = racBody.current
    if (!el) return
    arm(el, RACCOON)
    show(el, RACCOON, RACCOON.clips.wave.start)
    const id = window.setTimeout(() => say(touch ? f.raccoon.introTouch : f.raccoon.intro, 'wave'), 900)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // välillä pesukarhu katselee ympärilleen
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      if (!rac.current.busy && !panelRef.current && Math.random() < 0.5) playRaccoon(Math.random() < 0.6 ? 'look' : 'wave')
    }, 9000)
    return () => window.clearInterval(id)
  }, [reduce, playRaccoon])

  /* ----- näppäimet ----- */
  useEffect(() => {
    const map: Record<string, keyof Sim['keys']> = {
      ArrowLeft: 'l',
      a: 'l',
      A: 'l',
      ArrowRight: 'r',
      d: 'r',
      D: 'r',
      ArrowUp: 'u',
      w: 'u',
      W: 'u',
      ArrowDown: 'd',
      s: 'd',
      S: 'd',
    }
    const down = (e: KeyboardEvent) => {
      if (panelRef.current || e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const k = map[e.key]
      if (k) {
        e.preventDefault()
        sim.current.keys[k] = true
        sim.current.auto = null
        return
      }
      if ((e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') && nearRef.current) {
        if (target?.tagName === 'BUTTON' && e.key !== 'e' && e.key !== 'E') return
        e.preventDefault()
        openStation(nearRef.current)
      } else if (/^[1-9]$/.test(e.key)) {
        const st = STATIONS[Number(e.key) - 1]
        if (st) flyTo(st.id)
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute()
      } else if (e.key === 'r' || e.key === 'R') {
        resetRun()
        play('back')
      }
    }
    const up = (e: KeyboardEvent) => {
      const k = map[e.key]
      if (k) sim.current.keys[k] = false
    }
    const blur = () => {
      const k = sim.current.keys
      k.l = k.r = k.u = k.d = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [openStation, flyTo, toggleMute, resetRun, play])

  /* ----- silmukka ----- */
  useEffect(() => {
    let raf = 0
    let last = 0
    // parallaksitasot: [elementti, kerroin] – transform kirjoitetaan suoraan, ettei koko puun tyylejä lasketa uudelleen
    const layers = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-k]') ?? []).map((el) => [el, Number(el.dataset.k)] as const)
    let lastCam = -1e9
    let lastTenth = -1
    let blinking = false
    let windKey = '0:0'
    const gustTold = new Set<number>()

    /** osuma (lokki, lepakko tai vesi): kestävyys −1, isku ja pyörähdys, lyhyt osumasuoja */
    const hit = (kind: 'gull' | 'bat' | 'water', dir: number) => {
      const s = sim.current
      const r = run.current
      r.hearts -= 1
      s.inv = SHIELD
      s.stun = STUN
      s.spin = dir || (Math.random() < 0.5 ? 1 : -1)
      if (kind === 'water') {
        s.vy = -0.75
        s.vx *= 0.4
      } else {
        s.vx = dir * 1.0
        s.vy = 0.5
      }
      play('error')
      drone.current?.setAttribute('data-hit', '')
      blinking = true
      setHud((h) => ({ ...h, hearts: Math.max(0, r.hearts) }))
      if (r.hearts <= 0) {
        r.over = true
        say(f.raccoon.crash)
        window.setTimeout(() => {
          resetRun()
          play('back')
        }, 1600)
      } else {
        say(kind === 'water' ? f.raccoon.splash : kind === 'bat' ? f.raccoon.bat : f.raccoon.gull)
      }
    }

    const splashAt = (x: number, y: number) => {
      const el = splash.current
      if (!el) return
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      el.classList.remove('fl-go')
      void el.offsetWidth // käynnistä animaatio alusta
      el.classList.add('fl-go')
    }

    const finish = () => {
      const r = run.current
      r.done = true
      const time = r.t
      const prev = storeRef.current.best
      const best = prev == null ? time : Math.min(prev, time)
      setStore((st) => {
        const next = { ...st, best }
        writeStore(next)
        return next
      })
      setHud((h) => ({ ...h, done: true }))
      setToast({
        text: f.finishToast.replace('{max}', String(findsRef.current.length)).replace('{time}', fmt(time)).replace('{best}', fmt(best)),
        key: Date.now(),
      })
      if (prev == null || time < prev) say(f.raccoon.record.replace('{time}', fmt(time)), 'cheer')
      else say(f.raccoon.allFinds, 'cheer')
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      const s = sim.current
      const r = run.current
      const d = dims.current
      const el = root.current
      if (!el) return
      const busy = !!panelRef.current
      s.t += dt
      if (!busy) {
        s.gt += dt
        s.inv = Math.max(0, s.inv - dt)
        s.stun = Math.max(0, s.stun - dt)
      }
      if (blinking && s.inv <= 0) {
        blinking = false
        drone.current?.removeAttribute('data-hit')
      }
      const stunned = s.stun > 0

      // ohjaus → tavoitenopeus; autopilotti ohjaa kohti kohdetta ja risteilykorkeutta
      const k = s.keys
      const manual = !s.auto && (k.l || k.r || k.u || k.d)
      if (manual && !r.started && !r.done && !r.over) r.started = true
      if (r.started && !r.done && !r.over && !busy) r.t += dt
      let tvx = busy || stunned ? 0 : ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * MAX_V
      let tvy = busy || stunned ? 0 : ((k.d ? 1 : 0) - (k.u ? 1 : 0)) * MAX_VY
      if (s.auto && !busy) {
        const dx = s.auto.x - s.x
        tvx = Math.max(-MAX_V * 1.35, Math.min(MAX_V * 1.35, dx * 2.6))
        tvy = Math.max(-MAX_VY, Math.min(MAX_VY, (CRUISE - s.y) * 2.5))
        if (Math.abs(dx) < 0.02 && Math.abs(s.vx) < 0.12) {
          const open = s.auto.open
          s.auto = null
          if (open) openStation(open)
        }
      }

      // tuulenpuuskat: varoitus (juovat) → työntö
      let gust: 0 | 1 | 2 = 0
      let gdir = 0
      const zi = WIND.findIndex((z) => s.x > z.a && s.x < z.b)
      if (zi >= 0 && !busy) {
        const ph = s.gt % GUST.period
        gust = ph >= GUST.blow ? 2 : ph >= GUST.warn ? 1 : 0
        gdir = WIND[zi].dir
        if (gust === 2 && !s.auto) {
          tvx += gdir * GUST.push
          tvy += GUST.sink
        }
        if (gust === 1 && !gustTold.has(zi)) {
          gustTold.add(zi)
          say(f.raccoon.gust, 'look')
        }
      } else if (zi < 0) gustTold.clear()
      const wk = `${gust}:${gdir}`
      if (wk !== windKey) {
        windKey = wk
        setWind({ g: gust, d: gdir })
      }

      const ease = 1 - Math.exp(-dt * (stunned ? 2.4 : 4.2))
      s.vx += (tvx - s.vx) * ease
      s.vy += (tvy - s.vy) * ease
      const yMin = (64 - d.top) / d.H + 0.06
      s.x = Math.max(X_MIN, Math.min(X_MAX, s.x + s.vx * dt))
      s.y = Math.max(yMin, Math.min(Y_MAX, s.y + s.vy * dt))
      if (s.x <= X_MIN || s.x >= X_MAX) s.vx = 0
      if (s.vx > 0.05) s.face = 1
      else if (s.vx < -0.05) s.face = -1

      // kamera: drone hieman keskeltä menosuuntaan päin; kohteen kohdalla kamera kääntyy kohteeseen,
      // jotta kohde ja sen kehote näkyvät kapeallakin näytöllä
      const lead = Math.max(-1, Math.min(1, s.vx / MAX_V))
      const nearSt = nearRef.current ? STATIONS.find((st) => st.id === nearRef.current) : undefined
      const focus = nearSt ? (nearSt.x - s.x) * 0.6 : 0
      const target = Math.max(0, Math.min(WORLD * d.H - d.vw, (s.x + focus) * d.H - d.vw * (0.5 - 0.12 * lead)))
      s.cam = reduce || !last ? target : s.cam + (target - s.cam) * (1 - Math.exp(-dt * 4.5))
      if (s.t < 0.05) s.cam = target
      if (Math.abs(s.cam - lastCam) > 0.05) {
        lastCam = s.cam
        for (const [layer, kk] of layers) layer.style.transform = `translate3d(${(-s.cam * kk).toFixed(1)}px, 0, 0)`
      }

      // drone, pesukarhu, heijastus ja potkurivirta vedessä
      const bob = reduce ? 0 : Math.sin(s.t * 2.3) * 0.006 * d.H
      const sx = s.x * d.H - s.cam
      const sy = d.top + s.y * d.H + bob
      const waterY = d.top + WATER * d.H
      const spin = stunned ? Math.sin((1 - s.stun / STUN) * Math.PI) * 36 * s.spin : 0
      const tilt = lead * 11 + spin
      if (drone.current) drone.current.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`
      if (racWrap.current) racWrap.current.style.transform = `scaleX(${s.face === 1 ? -1 : 1})`
      const gap = WATER - (s.y + 0.118) // dronen jalkojen etäisyys vedestä
      if (echo.current) {
        const ry = d.top + (2 * WATER - s.y) * d.H - bob
        echo.current.style.transform = `translate3d(${sx.toFixed(1)}px, ${ry.toFixed(1)}px, 0) rotate(${(-tilt).toFixed(2)}deg) scaleY(-1)`
        echo.current.style.opacity = String(Math.max(0, Math.min(0.42, 0.55 - (WATER - s.y) * 0.75)))
      }
      if (wash.current) {
        wash.current.style.transform = `translate3d(${sx.toFixed(1)}px, ${waterY.toFixed(1)}px, 0)`
        wash.current.style.opacity = String(Math.max(0, Math.min(0.9, (0.3 - gap) / 0.3)).toFixed(2))
      }
      if (bubbleEl.current) {
        const bw = bubbleEl.current.offsetWidth
        const bx = Math.max(10, Math.min(d.vw - bw - 10, sx - bw / 2))
        bubbleEl.current.style.transform = `translate3d(${bx.toFixed(1)}px, ${(sy - 0.17 * d.H).toFixed(1)}px, 0) translateY(-100%)`
      }
      if (marker.current) marker.current.style.left = `${((s.x / WORLD) * 100).toFixed(2)}%`

      // vesi: jalat kastuvat → osuma (suojan aikana vain pomppu)
      if (s.y >= SPLASH_Y && !s.auto) {
        if (s.inv <= 0 && !busy && !r.over) {
          splashAt(sx, waterY)
          hit('water', 0)
        } else if (s.vy > 0) s.vy = -0.45
      }

      // vaarat: lokit ja lepakot partioivat (pelin kello), osuma vain käsiohjauksella
      for (let i = 0; i < HAZARDS.length; i++) {
        const h = HAZARDS[i]
        const ph = (h.v / h.span) * s.gt + h.p
        const hx = h.x + h.span * Math.sin(ph)
        const hy = h.y + h.ay * Math.sin(h.w * s.gt + h.p) + (h.kind === 'bat' ? 0.028 * Math.sin(3.3 * h.w * s.gt) : 0)
        const hel = hazEls.current[i]
        if (hel) hel.style.transform = `translate3d(${(hx * d.H).toFixed(1)}px, ${(hy * d.H).toFixed(1)}px, 0) scaleX(${Math.cos(ph) >= 0 ? 1 : -1})`
        if (s.auto || s.inv > 0 || busy || r.over) continue
        const ex = (hx - s.x) / 0.125
        const ey = (hy - (s.y + 0.02)) / 0.072
        if (ex * ex + ey * ey < 1) hit(h.kind, Math.sign(s.x - hx) || 1)
      }

      // löydöt: kahdeksikkorata; keräys vain käsiohjauksella
      const fl = findsRef.current
      for (let i = 0; i < fl.length; i++) {
        const it = fl[i]
        const fx = it.x + it.ax * Math.sin(it.w * s.gt + it.p)
        const fy = Math.max(yMin + 0.05, it.y + it.ay * Math.sin(2 * it.w * s.gt + 1.3 * it.p))
        const oel = orbEls.current[i]
        if (oel) oel.style.transform = `translate3d(${((fx - it.x) * d.H).toFixed(1)}px, ${((fy - it.y) * d.H).toFixed(1)}px, 0)`
        if (r.got.has(it.id) || s.auto || r.over || r.done || busy) continue
        const dx = fx - s.x
        const dy = fy - s.y
        if (dx * dx + dy * dy < GRAB * GRAB) {
          r.got.add(it.id)
          r.started = true
          oel?.setAttribute('data-got', '')
          play('unlock')
          const n = r.got.size
          setHud((hh) => ({ ...hh, got: n }))
          if (n === fl.length) finish()
          else {
            setToast({ text: `${f.findToast.replace('{n}', String(n)).replace('{max}', String(fl.length))} · ${it.name} · ${f.level} ${it.level}`, key: Date.now() })
            if (!rac.current.busy) playRaccoon('cheer')
          }
        }
      }

      // kello
      const tenth = Math.floor(r.t * 10)
      if (tenth !== lastTenth && timeEl.current) {
        lastTenth = tenth
        timeEl.current.textContent = fmt(r.t)
      }

      // lähin kohde
      let best: FlightStation | null = null
      let bd = NEAR
      for (const st of STATIONS) {
        const dd = Math.abs(st.x - s.x)
        if (dd < bd) {
          bd = dd
          best = st.id
        }
      }
      if (best !== nearRef.current) {
        nearRef.current = best
        setNear(best)
        if (best && !s.auto) {
          play('tick')
          say(f.stations[best].teaser, 'point')
        }
      }

      // yö
      if (!nightRef.current && s.x > NIGHT_ON) {
        nightRef.current = true
        setNight(true)
        setDusked(true)
        window.setTimeout(() => say(f.raccoon.night, 'look'), 1400)
      } else if (nightRef.current && s.x < NIGHT_OFF) {
        nightRef.current = false
        setNight(false)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [reduce, f, fmt, play, say, openStation, playRaccoon, resetRun])

  /* ----- kosketusnapit ----- */
  const hold = (k: keyof Sim['keys'], on: boolean) => (e: RPointerEvent) => {
    if (on) (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    sim.current.keys[k] = on
    if (on) sim.current.auto = null
  }
  const pad = (k: keyof Sim['keys'], label: string, Icon: typeof ChevronLeft, cls: string) => (
    <button
      type="button"
      aria-label={label}
      className={cn('fl-pad', cls)}
      onPointerDown={hold(k, true)}
      onPointerUp={hold(k, false)}
      onPointerCancel={hold(k, false)}
      onLostPointerCapture={hold(k, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Icon className="size-6" aria-hidden />
    </button>
  )

  const visited = new Set(store.visited)
  const nearSt = near ? STATIONS.find((s) => s.id === near) : null
  const Panel = panel ? PANELS[panel] : null

  return (
    <div
      ref={root}
      className="start pf flight fixed inset-0 z-10 overflow-hidden select-none"
      data-night={night ? '' : undefined}
      data-revealed={dusked ? '' : undefined}
      data-fading={fading ? '' : undefined}
      style={{ '--dusk': '2.4s' } as CSSProperties}
    >
      <StartSky />

      {/* maisema: päivä- ja yöpino ristihäivytetään kokonaisina (plus-lighter) */}
      <div className="fl-layer absolute inset-0 isolate">
        <div className="fl-day absolute inset-0">
          <Backdrop onPick={pickStation} />
        </div>
        <div className="fl-night absolute inset-0">
          <Backdrop night onPick={pickStation} />
        </div>
      </div>

      {/* tuulijuovat puuskaisella alueella (varoitus → puhaltaa) */}
      <div className="fl-wind pointer-events-none absolute inset-x-0 bottom-0" data-g={wind.g || undefined} data-dir={wind.d < 0 ? 'l' : 'r'} style={{ height: px(1) }} aria-hidden>
        {STREAKS.map(([y, w, dur, dl], i) => (
          <span key={i} className="fl-streak absolute rounded-full" style={{ top: px(y), width: px(w), animationDuration: `${dur}s`, animationDelay: `${dl}s` }} />
        ))}
      </div>

      {/* löydöt, vaarat ja kohteen kehote maailman tasossa */}
      <div className="fl-plane pointer-events-none absolute bottom-0 left-0" data-k={1} style={{ height: px(1), width: px(WORLD) }}>
        {finds.map((it, i) => (
          <div
            key={it.id}
            ref={(el) => {
              orbEls.current[i] = el
            }}
            className="fl-orb absolute"
            style={{ left: px(it.x), top: px(it.y), width: px(0.085), height: px(0.085), animationDelay: `${-i * 0.7}s` }}
            title={it.name}
          >
            <span className="fl-orb-core">
              <TechIcon name={it.id} className="size-[52%]" />
            </span>
          </div>
        ))}
        {HAZARDS.map((h, i) => (
          <div
            key={i}
            ref={(el) => {
              hazEls.current[i] = el
            }}
            className={cn('fl-hazard absolute left-0 top-0', h.kind === 'bat' ? 'fl-bat' : 'fl-gull')}
            style={
              h.kind === 'bat'
                ? { width: px(0.1), height: px(0.05), marginLeft: px(-0.05), marginTop: px(-0.025) }
                : { width: px(0.115), height: px(0.069), marginLeft: px(-0.0575), marginTop: px(-0.0345) }
            }
          >
            {h.kind === 'bat' ? <Bat /> : <Gull />}
          </div>
        ))}
        {nearSt && !panel && (
          <button
            type="button"
            onClick={() => openStation(nearSt.id)}
            className="fl-prompt pointer-events-auto absolute -translate-x-1/2 -translate-y-full"
            style={{ left: px(nearSt.x), top: px(WATER - nearSt.h - 0.03) }}
          >
            <span className="fl-prompt-key" aria-hidden>
              {touch ? '☝' : '↵'}
            </span>
            <span className="text-left leading-tight">
              <span className="block text-[0.62rem] font-bold uppercase tracking-[0.16em] opacity-75">{f.stations[nearSt.id].name}</span>
              <span className="block text-[0.9rem] font-extrabold">{f.stations[nearSt.id].section}</span>
            </span>
          </button>
        )}
      </div>

      {/* dronen heijastus järvessä, potkurivirta ja roiske */}
      <div ref={echo} className="fl-echo pointer-events-none absolute left-0 top-0" style={{ width: px(0.23), marginLeft: px(-0.115), marginTop: px(-0.026) }}>
        <img src={gameArt.drone.night} alt="" className="block w-full" />
      </div>
      <div ref={wash} className="fl-wash pointer-events-none absolute left-0 top-0" style={{ width: px(0.3), height: px(0.04), marginLeft: px(-0.15), marginTop: px(-0.02) }} aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div ref={splash} className="fl-splash pointer-events-none absolute left-0 top-0" style={{ width: px(0.28), height: px(0.16), marginLeft: px(-0.14), marginTop: px(-0.14) }} aria-hidden>
        <span className="fl-splash-ring" />
        {[-0.8, -0.45, -0.15, 0.15, 0.45, 0.8].map((dx, i) => (
          <span key={i} className="fl-drop" style={{ ['--dx' as string]: dx, ['--dy' as string]: 0.6 + (i % 3) * 0.2 }} />
        ))}
      </div>

      {/* drone + pesukarhu */}
      <div ref={drone} className="fl-drone pointer-events-none absolute left-0 top-0" style={{ width: px(0.23), marginLeft: px(-0.115), marginTop: px(-0.026) }}>
        <div
          ref={racWrap}
          className="fl-raccoon absolute"
          style={{
            height: px(RAC_H / RACCOON.restH),
            aspectRatio: `${RACCOON.w} / ${RACCOON.h}`,
            left: `calc(50% - ${px((RAC_H / RACCOON.restH) * (RACCOON.w / RACCOON.h) * RACCOON.footX)})`,
            bottom: '72%',
            transformOrigin: `${RACCOON.footX * 100}% 100%`,
          }}
        >
          <div ref={racBody} className="fl-raccoon-body size-full" />
        </div>
        <div className="relative isolate">
          <img src={gameArt.drone.day} alt="" className="fl-drone-day block w-full" />
          <img src={gameArt.drone.night} alt="" className="fl-drone-night absolute inset-0 block w-full" />
        </div>
        <span className="fl-rotor left-[0%]" />
        <span className="fl-rotor right-[0%]" />
      </div>

      {/* etualan metsä ja ranta dronen edessä (oma ristihäivytetty pino) */}
      <div className="fl-layer pointer-events-none absolute inset-0 isolate">
        <div className="fl-day absolute inset-0">
          <Foreground />
        </div>
        <div className="fl-night absolute inset-0">
          <Foreground night />
        </div>
      </div>

      {/* puhekupla */}
      {bubble && (
        <div ref={bubbleEl} key={bubble.key} className="fl-bubble pointer-events-none absolute left-0 top-0" role="status">
          {bubble.text}
        </div>
      )}

      {/* HUD */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center gap-x-2 gap-y-2 px-3 pt-[max(10px,env(safe-area-inset-top))] sm:gap-x-3 sm:px-5">
        <div className="st-ink pointer-events-auto flex items-center gap-2">
          <Logo play="hover" className="w-8" />
          <span className="poster hidden text-[0.95rem] lg:inline">{t.name}</span>
        </div>

        <nav aria-label={f.hud.route} className="pointer-events-auto order-last w-full md:order-none md:mx-auto md:w-[min(42vw,520px)]">
          <div className="fl-route relative h-9">
            <span className="fl-route-line" aria-hidden />
            {STATIONS.map((st, i) => (
              <button
                key={st.id}
                type="button"
                onClick={() => flyTo(st.id)}
                aria-label={`${i + 1}. ${f.stations[st.id].section} – ${f.stations[st.id].name}`}
                title={`${i + 1}. ${f.stations[st.id].section}`}
                className="fl-dot"
                data-visited={visited.has(st.id) ? '' : undefined}
                data-near={near === st.id ? '' : undefined}
                style={{ left: `${(st.x / WORLD) * 100}%` }}
              >
                <span>{i + 1}</span>
              </button>
            ))}
            <span ref={marker} className="fl-marker" aria-hidden />
          </div>
        </nav>

        <div className="pointer-events-auto ml-auto flex items-center gap-1 sm:gap-2 md:ml-0">
          <span className="st-chip st-ink hidden rounded-full px-2.5 py-1 text-[0.7rem] font-bold xl:inline-block">
            {f.hud.stations} {store.visited.length}/{STATIONS.length}
          </span>
          {/* keräyshaaste: kestävyys, löydöt, aika (ja ennätys) */}
          <div className="st-chip st-ink fl-score flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2 text-[0.7rem] font-bold sm:gap-2 sm:pl-2 sm:pr-2.5" data-done={hud.done || undefined}>
            <span className="flex gap-px" role="img" aria-label={`${f.hud.hearts} ${hud.hearts}/${HEARTS}`}>
              {Array.from({ length: HEARTS }, (_, i) => (
                <Heart key={i} className="fl-heart size-3 sm:size-3.5" data-on={i < hud.hearts || undefined} aria-hidden />
              ))}
            </span>
            <span>
              <span className="sr-only sm:not-sr-only">{f.hud.finds} </span>
              {hud.got}/{finds.length}
            </span>
            <span className="tabular-nums" title={f.hud.time}>
              <span className="sr-only">{f.hud.time} </span>
              <span ref={timeEl}>{fmt(0)}</span>
            </span>
            {store.best != null && (
              <span className="hidden opacity-70 lg:inline" title={f.hud.best}>
                {f.hud.best} <span className="tabular-nums">{fmt(store.best)}</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              resetRun()
              play('back')
            }}
            aria-label={f.hud.retry}
            title={f.hud.retry}
            className="st-chip st-ink grid size-7 cursor-pointer place-items-center rounded-full sm:size-8"
          >
            <RotateCcw className="size-3.5 sm:size-4" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? f.hud.soundOff : f.hud.sound}
            aria-pressed={!muted}
            className="st-chip st-ink grid size-7 cursor-pointer place-items-center rounded-full sm:size-8"
          >
            {muted ? <VolumeX className="size-3.5 sm:size-4" /> : <Volume2 className="size-3.5 sm:size-4" />}
          </button>
          <LangSwitch />
          <button type="button" onClick={onNormal} aria-label={f.hud.normal} className="st-chip st-ink inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.72rem] font-bold sm:px-3">
            <Newspaper className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{f.hud.normal}</span>
          </button>
        </div>
      </header>

      {toast && (
        <p key={toast.key} className="fl-toast pointer-events-none absolute left-1/2 top-[86px] z-20 -translate-x-1/2 md:top-[64px]" role="status">
          {toast.text}
        </p>
      )}

      {/* ohjeet / kosketusnapit */}
      {touch ? (
        <div className="absolute bottom-[max(12px,env(safe-area-inset-bottom))] left-3 z-20 grid grid-cols-3 grid-rows-2 gap-1.5">
          {pad('u', f.hud.up, ChevronUp, 'col-start-2')}
          {pad('l', f.hud.left, ChevronLeft, 'col-start-1 row-start-2')}
          {pad('d', f.hud.down, ChevronDown, 'col-start-2 row-start-2')}
          {pad('r', f.hud.right, ChevronRight, 'col-start-3 row-start-2')}
        </div>
      ) : (
        <p className="pointer-events-none absolute inset-x-0 bottom-[max(10px,env(safe-area-inset-bottom))] z-20 flex justify-center px-4">
          <span className="rounded-full bg-[#14081a]/60 px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-[#ffe5d4]/90">{f.hud.keys}</span>
        </p>
      )}

      {/* kohteen sisältö */}
      <Dialog.Root
        open={!!panel}
        onOpenChange={(o) => {
          if (!o) {
            setPanel(null)
            play('close')
          }
        }}
      >
        <Dialog.Portal container={root.current}>
          <Dialog.Overlay className="fl-overlay fixed inset-0 z-40 duration-300 animate-in fade-in" />
          <Dialog.Content
            className={cn('fl-panel fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 duration-300 animate-in fade-in zoom-in-95', night && 'fl-panel-night')}
            aria-describedby={undefined}
          >
            {panel && Panel && (
              <>
                <header className="fl-panel-head">
                  <div className="min-w-0">
                    <p className="fp-kicker">
                      {STATIONS.findIndex((s) => s.id === panel) + 1}. {f.stations[panel].name}
                    </p>
                    <Dialog.Title className="poster text-[clamp(1.5rem,4vw,2.2rem)] leading-none">{f.stations[panel].section}</Dialog.Title>
                  </div>
                  <Dialog.Close className="fp-close" aria-label={f.hud.close}>
                    <X className="size-4" />
                  </Dialog.Close>
                </header>
                <div className="fl-panel-body">
                  <Panel t={t} onFly={(id) => flyTo(id)} />
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
