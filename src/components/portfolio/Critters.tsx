import { useEffect, useRef, type CSSProperties, type RefObject } from 'react'

import { critterSprites } from '@/content'
import { cn } from '@/lib/utils'
import { useReducedMotion } from './hooks'

/* Eläinvarjot alaosioissa kuin bannerin linnut: litteä siluetti, joka elää omaa elämäänsä.
   Ruutunauha on CSS-maski (väri = currentColor), ruutu vaihdetaan siirtämällä maskia – ei React-renderöintejä.
   Animaatio pyörii vain, kun eläin on näkyvissä; vähennetty liike → ensimmäinen ruutu paikallaan. */

type Kind = keyof typeof critterSprites
type Sprite = (typeof critterSprites)[Kind]
/** [ruutu, kesto ms] */
type Step = readonly [frame: number, ms: number]

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))

function spriteStyle(s: Sprite): CSSProperties {
  const img = `url(${s.src})`
  const size = `${s.frames * 100}% 100%`
  const pos = 'calc(var(--critter-f, 0) * 100%) 0'
  return {
    aspectRatio: `${s.w} / ${s.h}`,
    backgroundColor: 'currentColor',
    WebkitMaskImage: img,
    maskImage: img,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: size,
    maskSize: size,
    WebkitMaskPosition: pos,
    maskPosition: pos,
  }
}

/** näytä ruutu i (maskin sijainti 0…1 nauhan pituudesta) */
function show(el: HTMLElement, s: Sprite, i: number) {
  el.style.setProperty('--critter-f', String(i / (s.frames - 1)))
}

/* Ruutujen ryhmät: sama järjestys kuin nauhoissa */
const DEER = {
  lower: range(0, 12), // valpas → pää alas laiduntamaan
  nods: [12, ...range(13, 21)], // laidunnyökkäykset
  flick: [0, ...range(22, 27)], // hännän heilautus valppaana
}
const RACCOON = {
  lift: [0, 1, 2, 3], // tassut rinnalle
  wash: range(3, 13), // pesee tassuja
  lower: [13, 14, 15, 0], // tassut alas
  sniff: range(16, 22), // nuuhkaisee ilmaa
  ear: range(23, 25), // korva nykäisee
}

function* run(frames: readonly number[], ms: number): Generator<Step> {
  for (const f of frames) yield [f, ms]
}

function* deerLife(): Generator<Step> {
  for (;;) {
    yield [0, rand(2600, 5400)]
    if (Math.random() < 0.6) {
      yield* run(DEER.flick.slice(1), 55)
      yield [0, rand(900, 2400)]
    }
    yield* run(DEER.lower.slice(1), 72)
    for (let n = randInt(2, 4); n > 0; n--) {
      yield* run(DEER.nods.slice(1), 115)
      yield [DEER.nods[0], rand(300, 1800)]
    }
    // ylös nopeammin kuin alas – kuin jokin olisi rasahtanut
    yield* run(DEER.lower.slice(0, -1).reverse(), 48)
  }
}

function* raccoonLife(): Generator<Step> {
  for (;;) {
    yield [0, rand(2200, 4800)]
    const r = Math.random()
    if (r < 0.5) {
      yield* run(RACCOON.lift.slice(1), 70)
      const w = RACCOON.wash
      yield* run(w.slice(1), 78)
      for (let n = randInt(1, 2); n > 0; n--) {
        yield* run(w.slice(0, -1).reverse(), 78)
        yield* run(w.slice(1), 78)
      }
      yield* run(RACCOON.lower.slice(1, -1), 70)
    } else if (r < 0.8) {
      yield* run(RACCOON.sniff, 95)
      if (Math.random() < 0.5) yield* run(RACCOON.sniff.slice(2), 95)
    } else {
      yield* run(RACCOON.ear, 50)
      if (Math.random() < 0.4) {
        yield [0, 260]
        yield* run(RACCOON.ear, 50)
      }
    }
  }
}

const LIFE = { deer: deerLife, raccoon: raccoonLife } as const

/** Kutsuu fn(true/false), kun elementti tulee näkyviin / poistuu näkyvistä */
function watch(el: Element, fn: (visible: boolean) => void) {
  let visible = false
  const io = new IntersectionObserver(([e]) => {
    if (!e || e.isIntersecting === visible) return
    visible = e.isIntersecting
    fn(visible)
  })
  io.observe(el)
  return () => io.disconnect()
}

function useLife(ref: RefObject<HTMLDivElement | null>, kind: keyof typeof LIFE) {
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const s = critterSprites[kind]
    show(el, s, 0)
    if (reduce) return
    const life = LIFE[kind]()
    let timer = 0
    const tick = () => {
      const [f, ms] = life.next().value as Step
      show(el, s, f)
      timer = window.setTimeout(tick, ms)
    }
    const stop = watch(el, (visible) => (visible ? tick() : window.clearTimeout(timer)))
    return () => {
      stop()
      window.clearTimeout(timer)
    }
  }, [ref, kind, reduce])
}

/** Paikallaan oleva eläin (peura, pesukarhu). Koko: anna korkeus className:ssa, leveys tulee kuvasuhteesta. */
export function Critter({ kind, className }: { kind: keyof typeof LIFE; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useLife(ref, kind)
  return <div ref={ref} className={cn('critter', className)} style={spriteStyle(critterSprites[kind])} aria-hidden />
}

const BEAR_FRAME_MS = 46 // yksi ruutu ≈ 22 fps; askelsykli 24 ruutua ≈ 1,1 s

/** Karhu kävelee radan päästä päähän. Eteneminen lasketaan askelpituudesta, joten tassut eivät liu'u:
    ruutu = kuljettu matka / askel ruutua kohden. Päissä (ja joskus keskellä) se pysähtyy hetkeksi ja kääntyy. */
export function WalkingBear({ className }: { className?: string }) {
  const track = useRef<HTMLDivElement>(null)
  const bear = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const s = critterSprites.bear

  useEffect(() => {
    const tr = track.current
    const el = bear.current
    if (!tr || !el) return
    let x = Math.random() * Math.max(0, tr.clientWidth - el.offsetWidth)
    let dir = Math.random() < 0.5 ? 1 : -1
    let dist = 0
    let last = 0
    let wait = 0 // pysähdyksen jäljellä oleva aika (ms)
    let turn = false // käänny, kun pysähdys loppuu
    let stopAt: number | null = null // satunnainen pysähdyskohta tällä matkalla
    let ramp = 0 // 0 → 1 lähdön kiihdytys
    let raf = 0
    const place = () => {
      el.style.transform = `translate3d(${x.toFixed(2)}px,0,0) scaleX(${dir})`
    }
    show(el, s, 0)
    place()
    if (reduce) return

    const pickStop = (max: number) => {
      stopAt = Math.random() < 0.45 ? rand(0.25, 0.75) * max : null
      if (stopAt !== null && (stopAt - x) * dir <= 20) stopAt = null
    }

    const frame = (t: number) => {
      const dt = last ? Math.min(t - last, 64) : 0
      last = t
      const max = Math.max(0, tr.clientWidth - el.offsetWidth)
      const strideD = (s.stride * el.offsetHeight) / s.h // näyttöpikseleinä
      if (strideD <= 0) {
        raf = requestAnimationFrame(frame)
        return
      }
      if (wait > 0) {
        wait -= dt
        if (wait <= 0 && turn) {
          dir = -dir
          turn = false
          pickStop(max)
          place()
        }
        if (wait <= 0) ramp = 0
      } else {
        const target = stopAt ?? (dir > 0 ? max : 0)
        const left = (target - x) * dir
        ramp = Math.min(1, ramp + dt / 500)
        // jarrutus viimeisillä pikseleillä ja kiihdytys lähdössä – jalat hidastuvat samassa tahdissa
        const k = Math.max(0.18, Math.min(1, left / 28)) * (0.25 + 0.75 * ramp)
        const move = Math.min(left, (strideD / BEAR_FRAME_MS) * dt * k)
        x += dir * Math.max(0, move)
        dist += Math.max(0, move)
        if (left - move <= 0.25) {
          if (stopAt !== null) {
            stopAt = null
            wait = rand(1400, 3200)
          } else {
            x = dir > 0 ? max : 0
            wait = rand(1600, 4200)
            turn = true
          }
        }
        show(el, s, Math.floor(dist / strideD) % s.frames)
        place()
      }
      raf = requestAnimationFrame(frame)
    }

    pickStop(Math.max(0, tr.clientWidth - el.offsetWidth))
    const stop = watch(tr, (visible) => {
      cancelAnimationFrame(raf)
      if (visible) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    })
    return () => {
      stop()
      cancelAnimationFrame(raf)
    }
  }, [reduce, s])

  return (
    <div ref={track} className={cn('pointer-events-none absolute overflow-hidden', className)} aria-hidden>
      <div ref={bear} className="critter absolute bottom-0 left-0 h-full will-change-transform" style={spriteStyle(s)} />
    </div>
  )
}
