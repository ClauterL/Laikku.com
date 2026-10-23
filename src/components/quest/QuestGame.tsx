import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as Dialog from '@radix-ui/react-dialog'
import { MapPin, Navigation, Newspaper, Volume2, VolumeX, X } from 'lucide-react'

import { questArt, type Content, type FlightStation, type Lang, type QuestTreat } from '@/content'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { Logo } from '@/components/Logo'
import { useReducedMotion } from '@/components/portfolio/hooks'
import { PANELS } from '@/components/flight/Panels'
import { cn } from '@/lib/utils'
import { ScreenAnchor, World, newState, YAW, type GameEvents } from './Scene'
import { EDGE_R, ISLANDS, LAKES, PLACES, TREATS, type Treat } from './world'

/* Pelillistetty portfolio: KAHVIJAHTI.
   Avoin low-poly-Järvi-Suomi (React Three Fiber, isometrinen ortokamera). Pesukarhu kulkee saarella tabletti
   tassuissa; yhdeksän paikkaa avaavat portfolion osiot tabletissa (samat paneelit kuin Dronelennossa).
   Ympäriinsä on piilotettu kahvia, donitseja ja burritoja – katoilla ja vedessä olevat haetaan dronella.
   Kumiankka seuraa perässä, vitsailee ja antaa vihjeitä (rubber duck debugging).
   - Maailma, mallit ja pelisilmukka: Scene.tsx, models.tsx, world.ts (kaikki koodilla, ei 3D-tiedostoja).
   - React piirtää uudelleen vain harvoista tapahtumista (paikka lähellä, herkku löytyi, puhekupla).
   - Ohjaus: WASD/nuolet, Shift juoksu, E/Enter avaa, Q drone, H vihje, M ääni; kosketuksella sauva ja napit.
   - Edistyminen localStoragessa (`laikku-quest`: löydetyt herkut ja nähdyt paikat). */

type Store = { got: string[]; seen: FlightStation[] }
const STORE = 'laikku-quest'
const KINDS: QuestTreat[] = ['coffee', 'donut', 'burrito']
const TOTAL = Object.fromEntries(KINDS.map((k) => [k, TREATS.filter((t) => t.kind === k).length])) as Record<QuestTreat, number>

function readStore(): Store {
  try {
    const raw = window.localStorage.getItem(STORE)
    if (raw) {
      const v = JSON.parse(raw) as Partial<Store>
      const ids = new Set(TREATS.map((t) => t.id))
      const places = new Set(PLACES.map((p) => p.id))
      return { got: (v.got ?? []).filter((id) => ids.has(id)), seen: (v.seen ?? []).filter((id) => places.has(id)) }
    }
  } catch {}
  return { got: [], seen: [] }
}

function writeStore(s: Store) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(s))
  } catch {}
}

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))

/* ---------------- pienet osat ---------------- */

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

/** Laiturin paneeli: ohjeet ja pikamatka (Dronelennon Näin lennät -paneelin vastine) */
function QuestHowto({ t, onFly, seen }: { t: Content; onFly: (id: FlightStation) => void; seen: FlightStation[] }) {
  const h = t.quest.howto
  return (
    <>
      <p className="fp-lead">{h.lead}</p>
      <ol className="mt-4 grid gap-2">
        {h.steps.map((s, i) => (
          <li key={i} className="fp-card flex items-start gap-3 px-3 py-2.5">
            <span className="fp-num">{i + 1}</span>
            <span className="text-[0.92rem] leading-snug">{s}</span>
          </li>
        ))}
      </ol>
      <h3 className="fp-kicker mb-2 mt-6">{h.travelTitle}</h3>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {PLACES.filter((p) => p.id !== 'dock').map((p, i) => {
          const st = t.flight.stations[p.id]
          return (
            <li key={p.id}>
              <button type="button" onClick={() => onFly(p.id)} className="fp-card fp-hover flex w-full items-center gap-3 px-3 py-2 text-left">
                <span className="fp-num">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.92rem] font-bold leading-tight">{st.section}</span>
                  <span className="fp-muted block text-[0.75rem]">{st.name}</span>
                </span>
                {seen.includes(p.id) ? <MapPin className="fp-accent size-4" aria-hidden /> : <Navigation className="size-4 opacity-60" aria-hidden />}
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/** Pieni kartta: käännetty kameran mukaan (ylös = näytön ylös), paikat ja pesukarhu */
function Minimap({ seen, near, racRef, hintRef }: { seen: FlightStation[]; near: FlightStation | null; racRef: React.RefObject<SVGGElement | null>; hintRef: React.RefObject<SVGCircleElement | null> }) {
  const R = EDGE_R + 2
  return (
    <svg viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} className="qs-map" aria-hidden>
      <defs>
        <clipPath id="qs-map-clip">
          <circle r={R} />
        </clipPath>
      </defs>
      <g clipPath="url(#qs-map-clip)" transform={`rotate(${(YAW * 180) / Math.PI})`}>
        <rect x={-R} y={-R} width={R * 2} height={R * 2} fill="#f3a066" />
        <circle r={EDGE_R - 2} fill="#b95d4b" />
        <rect x={43} y={-R} width={R} height={R * 2} fill="#f3a066" />
        {LAKES.map(([x, z, rx, rz], i) => (
          <ellipse key={i} cx={x} cy={z} rx={rx} ry={rz} fill="#f3a066" />
        ))}
        {ISLANDS.map(([x, z, r], i) => (
          <circle key={i} cx={x} cy={z} r={r} fill="#b95d4b" />
        ))}
        {PLACES.map((p) => (
          <circle key={p.id} cx={p.x} cy={p.z} r={near === p.id ? 4.2 : 3.2} fill={seen.includes(p.id) ? '#7fd3cc' : '#ffd27a'} stroke="#3a1530" strokeWidth={1.2} />
        ))}
        <circle ref={hintRef} r={2.6} fill="#fff1c2" className="qs-map-hint" style={{ display: 'none' }} />
        <g ref={racRef}>
          <path d="M0 5 L3.6 -3 L0 -1.2 L-3.6 -3 Z" fill="#fff6ee" stroke="#3a1530" strokeWidth={1} />
        </g>
      </g>
      <circle r={R - 0.8} fill="none" stroke="rgba(58,21,48,0.45)" strokeWidth={1.6} />
    </svg>
  )
}

/* ---------------- peli ---------------- */

type Bubble = { text: string; key: number }

export default function QuestGame({ onNormal }: { onNormal: () => void }) {
  const { t } = useLang()
  const q = t.quest
  const f = t.flight
  const { muted, toggleMute, play } = useSound()
  const reduce = useReducedMotion()

  const root = useRef<HTMLDivElement>(null)
  const bubbleEl = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLSpanElement>(null)
  const mapRac = useRef<SVGGElement>(null)
  const mapHint = useRef<SVGCircleElement>(null)
  const state = useMemo(() => newState(), [])

  const [store, setStore] = useState<Store>(readStore)
  const storeRef = useRef(store)
  storeRef.current = store
  const [near, setNear] = useState<FlightStation | null>(null)
  const [panel, setPanel] = useState<FlightStation | null>(null)
  const [drone, setDrone] = useState(false)
  const [bubble, setBubble] = useState<Bubble | null>(null)
  const [toast, setToast] = useState<{ text: string; key: number; kind?: QuestTreat } | null>(null)
  const [touch, setTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const [ready, setReady] = useState(false)
  /** heikko laite: ei varjoja, pikselitiheys 1 */
  const [low, setLow] = useState(false)
  /** suorituskykyä seurataan vasta, kun alun varjostinkäännökset ovat ohi */
  const [watch, setWatch] = useState(false)
  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => setWatch(true), 3000)
    return () => window.clearTimeout(id)
  }, [ready])

  // kehitystilassa testeille: window.__quest.state
  if (import.meta.env.DEV) {
    const w = window as unknown as { __quest?: Record<string, unknown> }
    w.__quest = { ...w.__quest, state }
  }

  // tallennettu edistyminen peliin
  useEffect(() => {
    for (const id of storeRef.current.got) state.got.add(id)
  }, [state])

  useEffect(() => {
    state.reduce = reduce
  }, [reduce, state])

  useEffect(() => {
    state.busy = !!panel
  }, [panel, state])

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const on = () => setTouch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  /* ----- puhekupla ja ilmoitukset ----- */
  const lastSaid = useRef(performance.now())
  const bubbleTimer = useRef<number | undefined>(undefined)
  const say = useCallback(
    (text: string, quack = true) => {
      window.clearTimeout(bubbleTimer.current)
      setBubble({ text, key: performance.now() })
      state.duck.talk = 1
      lastSaid.current = performance.now()
      if (quack) play('quack')
      bubbleTimer.current = window.setTimeout(() => setBubble(null), Math.min(10000, 2600 + text.length * 50))
    },
    [play, state],
  )
  useEffect(() => () => window.clearTimeout(bubbleTimer.current), [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(id)
  }, [toast])

  // tervetuloa
  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => say(touch ? q.duck.introTouch : q.duck.intro), 900)
    return () => window.clearTimeout(id)
    // vain kerran, kun maailma on valmis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // kumiankka vitsailee, kun on hiljaista
  const jokeIdx = useRef(Math.floor(Math.random() * 10))
  useEffect(() => {
    const id = window.setInterval(() => {
      if (state.busy || document.hidden) return
      if (performance.now() - lastSaid.current < 42000) return
      const jokes = q.duck.jokes
      jokeIdx.current = (jokeIdx.current + 1 + Math.floor(Math.random() * (jokes.length - 1))) % jokes.length
      say(jokes[jokeIdx.current])
    }, 2000)
    return () => window.clearInterval(id)
  }, [q, say, state])

  /* ----- tapahtumat pelisilmukasta ----- */
  const toldPlaces = useRef(new Set<FlightStation>())
  const events = useRef<GameEvents>({ onNear: () => {}, onCollect: () => {}, onRange: () => {} })
  events.current.onNear = (id) => {
    setNear(id)
    if (id) {
      play('tick')
      if (!toldPlaces.current.has(id)) {
        toldPlaces.current.add(id)
        say(q.places[id], false)
      }
    }
  }
  events.current.onCollect = (tr: Treat) => {
    const got = [...state.got]
    const next = { ...storeRef.current, got }
    storeRef.current = next
    setStore(next)
    writeStore(next)
    play('pickup')
    setToast({ text: q.treats[tr.kind].found, key: performance.now(), kind: tr.kind })
    if (got.length === TREATS.length) {
      window.setTimeout(() => {
        play('unlock')
        say(q.duck.allDone)
        setToast({ text: fill(q.finish, { n: TREATS.length }), key: performance.now() })
      }, 900)
    }
  }
  events.current.onRange = () => say(q.duck.droneRange)
  const ev = useMemo<GameEvents>(
    () => ({ onNear: (id) => events.current.onNear(id), onCollect: (tr) => events.current.onCollect(tr), onRange: () => events.current.onRange() }),
    [],
  )

  /* ----- toiminnot ----- */
  const markSeen = useCallback(
    (id: FlightStation) => {
      const cur = storeRef.current
      if (cur.seen.includes(id)) return
      const next = { ...cur, seen: [...cur.seen, id] }
      storeRef.current = next
      setStore(next)
      writeStore(next)
      if (next.seen.length === PLACES.length) window.setTimeout(() => say(q.duck.allPlaces), 600)
    },
    [q, say],
  )

  const open = useCallback(
    (id: FlightStation) => {
      setPanel(id)
      markSeen(id)
      play('open')
    },
    [markSeen, play],
  )

  const toggleDrone = useCallback(() => {
    if (state.busy) return
    const on = !state.drone
    state.drone = on
    if (on) {
      state.dvx = state.dvz = 0
      state.rangeWarned = false
      play('drone')
    } else play('back')
    setDrone(on)
    say(on ? q.duck.droneOn : q.duck.droneBack, false)
  }, [play, q, say, state])

  const hint = useCallback(() => {
    const left = TREATS.filter((tr) => !state.got.has(tr.id))
    if (!left.length) {
      say(q.duck.hintNone)
      state.hint = null
      return
    }
    const ox = state.drone ? state.dx : state.px
    const oz = state.drone ? state.dz : state.pz
    // lähin; sama vihje uudestaan → seuraava
    const sorted = left.map((tr) => ({ tr, d: Math.hypot(tr.x - ox, tr.z - oz) })).sort((a, b) => a.d - b.d)
    const cur = sorted.findIndex((x) => x.tr.id === state.hint)
    const pick = sorted[cur >= 0 && sorted.length > 1 ? (cur + 1) % Math.min(3, sorted.length) : 0].tr
    state.hint = pick.id
    say(fill(q.duck.hint, { treat: q.treats[pick.kind].one, where: q.where[pick.where] }) + (pick.drone ? q.duck.hintDrone : ''))
  }, [q, say, state])

  /** Pikamatka paikan sisäänkäynnille ja paneeli auki */
  const fly = useCallback(
    (id: FlightStation) => {
      const p = PLACES.find((x) => x.id === id)
      if (!p) return
      state.teleport = { x: p.sx, z: p.sz }
      state.face = Math.atan2(p.x - p.sx, p.z - p.sz)
      state.vx = state.vz = 0
      setDrone(false)
      setPanel(id)
      markSeen(id)
      play('tab')
    },
    [markSeen, play, state],
  )

  /* ----- näppäimistö ----- */
  useEffect(() => {
    const k = state.keys
    const set = (e: KeyboardEvent, on: boolean) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          k.f = on
          break
        case 'KeyS':
        case 'ArrowDown':
          k.b = on
          break
        case 'KeyA':
        case 'ArrowLeft':
          k.l = on
          break
        case 'KeyD':
        case 'ArrowRight':
          k.r = on
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          k.run = on
          break
        default:
          return false
      }
      return true
    }
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tgt = e.target as HTMLElement | null
      if (tgt && (tgt.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName))) return
      // painikkeen oma Enter/välilyönti ei avaa paikkaa samalla
      if ((e.code === 'Enter' || e.code === 'Space') && tgt?.closest('button, a')) return
      if (state.busy) return
      if (set(e, true)) {
        e.preventDefault()
        return
      }
      if (e.repeat) return
      if ((e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') && state.near) {
        e.preventDefault()
        open(state.near)
      } else if (e.code === 'KeyQ') toggleDrone()
      else if (e.code === 'KeyH') hint()
      else if (e.code === 'KeyM') toggleMute()
      else if (e.code === 'Equal' || e.code === 'NumpadAdd') state.zoom = Math.min(1.8, state.zoom * 1.15)
      else if (e.code === 'Minus' || e.code === 'NumpadSubtract') state.zoom = Math.max(0.6, state.zoom / 1.15)
    }
    const up = (e: KeyboardEvent) => {
      set(e, false)
    }
    const blur = () => {
      k.f = k.b = k.l = k.r = k.run = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [hint, open, state, toggleDrone, toggleMute])

  // paneelin auetessa näppäimet irti
  useEffect(() => {
    if (!panel) return
    const k = state.keys
    k.f = k.b = k.l = k.r = k.run = false
    state.stick.x = state.stick.y = 0
  }, [panel, state])

  // hiiren rulla zoomaa
  useEffect(() => {
    const el = root.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (state.busy || (e.target as HTMLElement).closest('.fl-panel')) return
      state.zoom = Math.min(1.8, Math.max(0.6, state.zoom * Math.exp(-e.deltaY * 0.0012)))
    }
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => el.removeEventListener('wheel', onWheel)
  }, [state])

  /* ----- pienoiskartta (päivitetään omassa rAF-silmukassa, ei Reactin kautta) ----- */
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const g = mapRac.current
      if (g) {
        const x = state.drone ? state.dx : state.px
        const z = state.drone ? state.dz : state.pz
        const rot = state.drone ? Math.atan2(state.dvx, state.dvz) : state.face
        g.setAttribute('transform', `translate(${x.toFixed(2)} ${z.toFixed(2)}) rotate(${((-rot * 180) / Math.PI).toFixed(1)})`)
      }
      const h = mapHint.current
      if (h) {
        const tr = state.hint ? TREATS.find((x) => x.id === state.hint) : null
        h.style.display = tr ? '' : 'none'
        if (tr) {
          h.setAttribute('cx', String(tr.x))
          h.setAttribute('cy', String(tr.z))
        }
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state])

  /* ----- kosketussauva ----- */
  const stick = useRef<{ id: number; cx: number; cy: number } | null>(null)
  const STICK_R = 44
  const stickMove = (e: RPointerEvent) => {
    const s = stick.current
    if (!s || s.id !== e.pointerId) return
    let dx = e.clientX - s.cx
    let dy = e.clientY - s.cy
    const d = Math.hypot(dx, dy)
    if (d > STICK_R) {
      dx = (dx / d) * STICK_R
      dy = (dy / d) * STICK_R
    }
    state.stick.x = dx / STICK_R
    state.stick.y = -dy / STICK_R
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`
  }
  const stickEnd = (e: RPointerEvent) => {
    if (stick.current?.id !== e.pointerId) return
    stick.current = null
    state.stick.x = state.stick.y = 0
    if (knob.current) knob.current.style.transform = ''
  }

  const visited = useMemo(() => new Set(store.seen), [store.seen])
  const nearPlace = near && !drone ? near : null
  const Panel = panel && panel !== 'dock' ? PANELS[panel] : null
  const gotBy = (k: QuestTreat) => store.got.filter((id) => TREATS.find((tr) => tr.id === id)?.kind === k).length

  return (
    <div ref={root} className="start pf flight quest fixed inset-0 z-10 overflow-hidden select-none" data-ready={ready || undefined}>
      <Canvas
        className="qs-canvas"
        orthographic
        shadows
        flat
        dpr={low ? 1 : [1, 2]}
        camera={{ position: [40, 40, 40], zoom: 30, near: 1, far: 260 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={(st) => {
          setReady(true)
          if (import.meta.env.DEV) Object.assign((window as unknown as { __quest: object }).__quest, { three: st, setLow })
        }}
      >
        {watch && <PerformanceMonitor bounds={() => [30, 60]} flipflops={1} onDecline={() => setLow(true)} />}
        <World state={state} events={ev} visited={visited} low={low} />
        <ScreenAnchor state={state} el={bubbleEl} />
      </Canvas>

      {!ready && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="poster st-ink animate-pulse text-xl">{q.loading}…</p>
        </div>
      )}

      {/* kumiankan puhekupla (paikka kirjoitetaan suoraan pelisilmukasta) */}
      <div ref={bubbleEl} className="qs-bubble-wrap pointer-events-none absolute left-0 top-0 z-10" data-on={(bubble && !panel) || undefined}>
        {bubble && (
          <div key={bubble.key} className="fl-bubble qs-bubble" role="status">
            <img src={questArt.duck} alt="" className="qs-bubble-face" />
            <span>
              <span className="qs-bubble-name">{q.duck.name}</span>
              {bubble.text}
            </span>
          </div>
        )}
      </div>

      {/* HUD */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center gap-x-2 gap-y-2 px-3 pt-[max(10px,env(safe-area-inset-top))] sm:gap-x-3 sm:px-5">
        <div className="st-chip st-ink pointer-events-auto flex items-center gap-2 rounded-full py-1 pl-1.5 pr-1.5 sm:pr-3.5">
          <Logo play="hover" className="w-7" />
          <span className="poster hidden text-[0.9rem] sm:inline">{q.title}</span>
        </div>

        <div className="st-chip st-ink pointer-events-auto flex items-center gap-2 rounded-full py-1 pl-1.5 pr-3 text-[0.74rem] font-bold sm:mx-auto sm:gap-3" role="group" aria-label={q.hud.treats}>
          {KINDS.map((k) => (
            <span key={k} className="qs-count flex items-center gap-1" data-full={gotBy(k) === TOTAL[k] || undefined} title={q.treats[k].many}>
              <img src={questArt[k]} alt={q.treats[k].many} className="size-6 sm:size-7" />
              <span className="tabular-nums">
                {gotBy(k)}/{TOTAL[k]}
              </span>
            </span>
          ))}
          <span className="qs-count flex items-center gap-1 border-l border-[var(--st-line)] pl-2 sm:pl-3" title={q.hud.places}>
            <MapPin className="size-4" aria-hidden />
            <span className="sr-only">{q.hud.places} </span>
            <span className="tabular-nums">
              {store.seen.length}/{PLACES.length}
            </span>
          </span>
        </div>

        <div className="pointer-events-auto ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
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
          <button type="button" onClick={onNormal} aria-label={q.hud.normal} className="st-chip st-ink inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.72rem] font-bold sm:px-3">
            <Newspaper className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{q.hud.normal}</span>
          </button>
        </div>
      </header>

      <div className="qs-map-wrap pointer-events-none absolute right-3 top-[104px] z-20 sm:right-5 sm:top-[60px]">
        <Minimap seen={store.seen} near={nearPlace} racRef={mapRac} hintRef={mapHint} />
      </div>

      {toast && (
        <p key={toast.key} className="fl-toast qs-toast pointer-events-none absolute left-1/2 top-[104px] z-20 flex -translate-x-1/2 items-center gap-2 sm:top-[64px]" role="status">
          {toast.kind && <img src={questArt[toast.kind]} alt="" className="size-6" />}
          {toast.text}
        </p>
      )}

      {/* paikan kehote */}
      {nearPlace && !panel && (
        <button type="button" onClick={() => open(nearPlace)} className="fl-prompt qs-prompt pointer-events-auto absolute left-1/2 z-20 -translate-x-1/2">
          <span className="fl-prompt-key" aria-hidden>
            {touch ? '☝' : 'E'}
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[0.62rem] font-bold uppercase tracking-[0.16em] opacity-75">{f.stations[nearPlace].name}</span>
            <span className="block text-[0.9rem] font-extrabold">{nearPlace === 'dock' ? q.howto.title : f.stations[nearPlace].section}</span>
          </span>
        </button>
      )}

      {/* toiminnot: drone ja ankan vihje (kosketuksella isot napit, hiirellä pienet) */}
      <div className={cn('absolute z-20 flex items-end gap-2', touch ? 'bottom-[max(16px,env(safe-area-inset-bottom))] right-3' : 'bottom-[max(12px,env(safe-area-inset-bottom))] right-4')}>
        <button type="button" onClick={hint} className={cn('qs-act', touch && 'qs-act-big')} aria-label={q.hud.hint} title={q.hud.hint}>
          <img src={questArt.duck} alt="" />
          <span className="qs-act-label">{q.hud.hint}</span>
          {!touch && <kbd>H</kbd>}
        </button>
        <button type="button" onClick={toggleDrone} className={cn('qs-act', touch && 'qs-act-big')} data-on={drone || undefined} aria-pressed={drone} title={drone ? q.hud.droneBack : q.hud.drone}>
          <img src={questArt.raccoon} alt="" />
          <span className="qs-act-label">{drone ? q.hud.droneBack : q.hud.drone}</span>
          {!touch && <kbd>Q</kbd>}
        </button>
      </div>

      {touch ? (
        <div
          className="qs-stick absolute bottom-[max(16px,env(safe-area-inset-bottom))] left-4 z-20"
          role="application"
          aria-label={q.hud.move}
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
            stick.current = { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }
            stickMove(e)
          }}
          onPointerMove={stickMove}
          onPointerUp={stickEnd}
          onPointerCancel={stickEnd}
          onLostPointerCapture={stickEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          <span ref={knob} className="qs-knob" />
        </div>
      ) : (
        <p className="pointer-events-none absolute inset-x-0 bottom-[max(10px,env(safe-area-inset-bottom))] z-10 hidden justify-center px-4 md:flex">
          <span className="rounded-full bg-[#14081a]/60 px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-[#ffe5d4]/90">{q.hud.keys}</span>
        </p>
      )}

      {/* tabletti: paikan sisältö */}
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
          <Dialog.Content className="fl-panel qs-tablet fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 duration-300 animate-in fade-in zoom-in-95" aria-describedby={undefined}>
            {panel && (
              <>
                <header className="fl-panel-head">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={questArt.raccoon} alt="" className="qs-tablet-face" />
                    <div className="min-w-0">
                      <p className="fp-kicker">
                        {q.hud.tablet} · {f.stations[panel].name}
                      </p>
                      <Dialog.Title className="poster text-[clamp(1.5rem,4vw,2.2rem)] leading-none">{panel === 'dock' ? q.howto.title : f.stations[panel].section}</Dialog.Title>
                    </div>
                  </div>
                  <Dialog.Close className="fp-close" aria-label={q.hud.close}>
                    <X className="size-4" />
                  </Dialog.Close>
                </header>
                <div className="fl-panel-body">{Panel ? <Panel t={t} onFly={fly} /> : <QuestHowto t={t} onFly={fly} seen={store.seen} />}</div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
