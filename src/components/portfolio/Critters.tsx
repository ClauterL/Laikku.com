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

/** Karhu: viisi Higgsfield-klippiä samassa koordinaatistossa – kävelysykli, pysähdys seisomaan, lähtö,
    käännös ympäri. Jokaisen ruudun siirtymä (dx) on mitattu videosta maassa olevien tassujen liikkeestä, joten
    tassut pysyvät paikallaan. Pysähdys alkaa aina samasta syklin ruudusta (stop.enter = pysähdysklipin 1. ruutu)
    ja lähtö päättyy syklin ruutuun go.exit, joten liitokset ovat saumattomia. Peilaus (scaleX(-1)) kääntää suunnan:
    ruudukko on rajattu videon keskilinjan suhteen symmetrisesti, joten käännösklipin loppu = seisova ruutu peilattuna. */
type Mode = 'walk' | 'stop' | 'stand' | 'turn' | 'go'

export function WalkingBear({ className }: { className?: string }) {
  const track = useRef<HTMLDivElement>(null)
  const bear = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const s = critterSprites.bear

  useEffect(() => {
    const tr = track.current
    const el = bear.current
    if (!tr || !el) return
    const sum = (a: number[]) => a.reduce((p, v) => p + v, 0)
    const cycleDist = s.walk.n * s.walk.dx // ruudun pikseleinä
    const stopDist = sum(s.stop.dx)
    const goDist = sum(s.go.dx)
    const k = () => el.offsetHeight / s.h // ruudun pikseli → näytön pikseli
    const span = () => Math.max(0, tr.clientWidth - el.offsetWidth)
    const room = () => (face > 0 ? span() - x : x) // tilaa kulkusuuntaan

    let face = Math.random() < 0.5 ? 1 : -1 // 1 = oikealle (videon suunta), -1 = peilattu
    let x = rand(0.15, 0.85) * span()
    let mode: Mode = 'stand'
    let i = 0
    let left = rand(800, 3500) // ms seuraavaan ruutuun
    let turnNext = false
    let walked = 0 // kävelyruutuja lähdön jälkeen: satunnainen pysähdys vasta täyden syklin jälkeen
    let last = 0
    let raf = 0

    const draw = (f: number) => {
      show(el, s, f)
      el.style.transform = `translate3d(${x.toFixed(2)}px,0,0) scaleX(${face})`
    }
    const move = (dxCell: number) => {
      x = Math.min(span(), Math.max(0, x + face * dxCell * k()))
    }
    draw(s.stand)
    if (reduce) return watch(el, s, () => {}) // vain kuva, ei liikettä

    /** pysähdytäänkö nyt (kutsutaan, kun sykli on tulossa pysähdyksen aloitusruutuun) */
    const shouldStop = () => {
      const need = (stopDist + cycleDist) * k() + 2
      if (room() < need) {
        turnNext = true // seuraava sykli ei mahtuisi -> pysähdy ja käänny
        return true
      }
      if (walked >= s.walk.n && Math.random() < 0.22) {
        turnNext = Math.random() < 0.25
        return true
      }
      return false
    }

    /** etene yksi ruutu; palauttaa ruudun keston ms */
    const step = (): number => {
      switch (mode) {
        case 'walk': {
          const next = (i + 1) % s.walk.n
          move(s.walk.dx)
          walked++
          if (next === s.stop.enter && shouldStop()) {
            mode = 'stop'
            i = 0
            draw(s.stop.at)
            return s.stop.ms[0]
          }
          i = next
          draw(s.walk.at + i)
          return 1000 / s.fps
        }
        case 'stop': {
          move(s.stop.dx[i])
          i++
          if (i >= s.stop.n - 1) {
            mode = 'stand'
            draw(s.stand)
            return rand(1400, 4200)
          }
          draw(s.stop.at + i)
          return s.stop.ms[i]
        }
        case 'stand': {
          const need = (goDist + cycleDist) * k()
          if (turnNext || (room() < need && span() > need)) {
            turnNext = false
            mode = 'turn'
            i = 0
            draw(s.turn.at)
            return s.turn.ms[0]
          }
          mode = 'go'
          i = 0
          draw(s.go.at)
          return s.go.ms[0]
        }
        case 'turn': {
          move(s.turn.dx[i])
          i++
          if (i >= s.turn.n) {
            face = -face
            mode = 'stand'
            draw(s.stand)
            return rand(500, 1500)
          }
          draw(s.turn.at + i)
          return s.turn.ms[i]
        }
        case 'go': {
          move(s.go.dx[i])
          i++
          if (i >= s.go.n) {
            walked = 0
            mode = 'walk'
            i = s.go.exit
            draw(s.walk.at + i)
            return 1000 / s.fps
          }
          draw(s.go.at + i)
          return s.go.ms[i]
        }
      }
    }

    const frame = (t: number) => {
      const dt = last ? Math.min(t - last, 100) : 0
      last = t
      if (el.offsetHeight > 0) {
        left -= dt
        for (let n = 0; left <= 0 && n < 6; n++) left += step()
      }
      raf = requestAnimationFrame(frame)
    }

    const stop = watch(el, s, (visible) => {
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
      <div ref={bear} className="critter absolute bottom-0 left-0 h-full will-change-transform" style={{ aspectRatio: `${s.w} / ${s.h}` }} />
    </div>
  )
}
