import { useEffect, useRef } from 'react'

import { critterSprites } from '@/content'
import { cn } from '@/lib/utils'
import { useReducedMotion } from './hooks'

/* Eläinvarjot alaosioissa kuin bannerin linnut: litteä siluetti, joka elää omaa elämäänsä.
   Ruudut on irrotettu Higgsfield-videoista (oikea, jatkuva liike), ruudukko on CSS-maski (väri = currentColor)
   ja ruutu vaihdetaan siirtämällä maskia – ei React-renderöintejä. Kuva ladataan vasta lähellä näkymää,
   animaatio pyörii vain näkyvissä; vähennetty liike → yksi ruutu paikallaan. */

type Sheet = { src: string; w: number; h: number; cols: number; rows: number; frames: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** näytä ruutu i (maskin sijainti ruudukossa 0…1 kumpaankin suuntaan) */
function show(el: HTMLElement, s: Sheet, i: number) {
  const col = i % s.cols
  const row = Math.floor(i / s.cols)
  el.style.setProperty('--cx', String(s.cols > 1 ? col / (s.cols - 1) : 0))
  el.style.setProperty('--cy', String(s.rows > 1 ? row / (s.rows - 1) : 0))
}

/** maski ja väri vasta, kun eläin on lähellä näkymää (ennen sitä elementti on tyhjä) */
function arm(el: HTMLElement, s: Sheet) {
  const img = `url(${s.src})`
  const size = `${s.cols * 100}% ${s.rows * 100}%`
  const pos = 'calc(var(--cx, 0) * 100%) calc(var(--cy, 0) * 100%)'
  const st = el.style
  for (const [k, v] of [
    ['mask-image', img],
    ['mask-size', size],
    ['mask-position', pos],
    ['mask-repeat', 'no-repeat'],
  ] as const) {
    st.setProperty(k, v)
    st.setProperty(`-webkit-${k}`, v)
  }
  st.backgroundColor = 'currentColor'
}

/** Kutsuu fn(true/false), kun elementti tulee näkyviin / poistuu; arm() jo 400 px ennen */
function watch(el: HTMLElement, s: Sheet, fn: (visible: boolean) => void) {
  let armed = false
  let visible = false
  const near = new IntersectionObserver(
    ([e]) => {
      if (e?.isIntersecting && !armed) {
        armed = true
        arm(el, s)
        near.disconnect()
      }
    },
    { rootMargin: '400px 0px' },
  )
  const io = new IntersectionObserver(([e]) => {
    if (!e || e.isIntersecting === visible) return
    visible = e.isIntersecting
    fn(visible)
  })
  near.observe(el)
  io.observe(el)
  return () => {
    near.disconnect()
    io.disconnect()
  }
}

type ClipKind = 'deer' | 'raccoon'

/** Peura ja pesukarhu: videon ruudut sen omalla ajoituksella, sitten tauko alkuasennossa (video alkaa ja päättyy samaan) */
export function Critter({ kind, className }: { kind: ClipKind; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const s = critterSprites[kind]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    show(el, s, 0)
    let i = 0
    let timer = 0
    let wait = rand(800, 5000) // eläimet eivät aloita yhtä aikaa
    const tick = () => {
      if (wait > 0) {
        const w = wait
        wait = 0
        timer = window.setTimeout(tick, w)
        return
      }
      show(el, s, i)
      const ms = s.ms[i] ?? 42
      i = (i + 1) % s.frames
      if (i === 0) wait = rand(2600, 7000)
      timer = window.setTimeout(tick, ms)
    }
    const stop = watch(el, s, (visible) => {
      window.clearTimeout(timer)
      if (visible && !reduce) tick()
    })
    return () => {
      stop()
      window.clearTimeout(timer)
    }
  }, [reduce, s])

  return <div ref={ref} className={cn('critter', className)} style={{ aspectRatio: `${s.w} / ${s.h}` }} aria-hidden />
}

/** Karhu kävelee radan päästä päähän. Eteneminen lasketaan videosta mitatusta askelpituudesta, joten tassut eivät
    liu'u: ruutu = kuljettu matka / askel ruutua kohden. Se pysähtyy aina seisovaan ruutuun (rest), päissä kääntyy. */
export function WalkingBear({ className }: { className?: string }) {
  const track = useRef<HTMLDivElement>(null)
  const bear = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const s = critterSprites.bear

  useEffect(() => {
    const tr = track.current
    const el = bear.current
    if (!tr || !el) return
    const rest = new Set(s.rest)
    const span = () => Math.max(0, tr.clientWidth - el.offsetWidth)
    const strideD = () => (s.stride * el.offsetHeight) / s.h // näyttöpikseleinä ruutua kohden
    let x = Math.random() * span()
    let dir = Math.random() < 0.5 ? 1 : -1
    let dist = s.rest[0] * strideD() // aloitus seisovasta ruudusta
    let stopAt = dist // matka, jossa seuraava pysähdys on
    let atEnd = false // pysähdys radan päässä → käänny tauon jälkeen
    let wait = rand(600, 2500)
    let ramp = 0
    let last = 0
    let raf = 0
    const place = () => {
      el.style.transform = `translate3d(${x.toFixed(2)}px,0,0) scaleX(${dir})`
    }
    show(el, s, s.rest[0])
    place()

    /** seuraava osuus: radan päähän tai satunnaiseen kohtaan; pysähdys siirretään lähimpään seisovaan ruutuun */
    const plan = () => {
      const sd = strideD()
      const end = dir > 0 ? span() : 0
      let target = end
      atEnd = true
      if (Math.random() < 0.4) {
        const mid = rand(0.2, 0.8) * span()
        if ((mid - x) * dir > 40) {
          target = mid
          atEnd = false
        }
      }
      const reach = dist + Math.max(0, (target - x) * dir)
      let f = Math.floor(reach / sd)
      while (f * sd > dist && !rest.has(f % s.frames)) f--
      stopAt = Math.max(dist, (f + 0.5) * sd)
      if (stopAt > reach) stopAt = reach
    }

    const frame = (t: number) => {
      const dt = last ? Math.min(t - last, 64) : 0
      last = t
      const sd = strideD()
      if (sd > 0) {
        if (wait > 0) {
          wait -= dt
          if (wait <= 0) {
            if (atEnd) dir = -dir
            ramp = 0
            plan()
            place()
          }
        } else {
          const left = stopAt - dist
          ramp = Math.min(1, ramp + dt / 600)
          // kiihdytys lähdössä ja jarrutus lopussa – jalat hidastuvat samassa tahdissa
          const k = Math.max(0.15, Math.min(1, left / (sd * 10))) * (0.2 + 0.8 * ramp)
          const move = Math.min(left, sd * s.fps * (dt / 1000) * k)
          x = Math.min(span(), Math.max(0, x + dir * move))
          dist += move
          show(el, s, Math.floor(dist / sd) % s.frames)
          place()
          if (left - move <= 0.01) wait = atEnd ? rand(1800, 4500) : rand(1200, 3500)
        }
      }
      raf = requestAnimationFrame(frame)
    }

    const stop = watch(el, s, (visible) => {
      cancelAnimationFrame(raf)
      if (visible && !reduce) {
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
      <div ref={bear} className="critter absolute bottom-0 left-0 h-full will-change-transform" style={{ aspectRatio: `${s.w} / ${s.h}` }} />
    </div>
  )
}
