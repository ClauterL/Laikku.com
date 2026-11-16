import { useEffect, useRef } from 'react'

import { critterSprites } from '@/content'
import { cn } from '@/lib/utils'
import { useReducedMotion } from './hooks'

/* Eläinvarjot alaosioissa kuin bannerin linnut: litteä siluetti, joka elää omaa elämäänsä.
   Ruudut on irrotettu Higgsfield-videoista (oikea, jatkuva liike), ruudukko on CSS-maski (väri = currentColor)
   ja ruutu vaihdetaan siirtämällä maskia – ei React-renderöintejä. Kuva ladataan heti sivun asetuttua ja
   animaatio pyörii koko ajan (myös näkymän ulkopuolella), joten eläin on jo liikkeessä, kun sen kohdalle
   vieritetään; vähennetty liike → yksi ruutu paikallaan. */

export type Sheet = { src: string; w: number; h: number; cols: number; rows: number; frames: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** näytä ruutu i (maskin sijainti ruudukossa 0…1 kumpaankin suuntaan) */
export function show(el: HTMLElement, s: Sheet, i: number) {
  const col = i % s.cols
  const row = Math.floor(i / s.cols)
  el.style.setProperty('--cx', String(s.cols > 1 ? col / (s.cols - 1) : 0))
  el.style.setProperty('--cy', String(s.rows > 1 ? row / (s.rows - 1) : 0))
}

/** maski ja väri vasta, kun eläin on lähellä näkymää (ennen sitä elementti on tyhjä) */
export function arm(el: HTMLElement, s: Sheet) {
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

/** arm() heti, kun selain ehtii (ei kilpaile hero-kuvien kanssa); palauttaa peruutuksen */
function armSoon(el: HTMLElement, s: Sheet) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(() => arm(el, s), { timeout: 1500 })
    return () => w.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(() => arm(el, s), 600)
  return () => window.clearTimeout(id)
}

type ClipKind = 'deer' | 'raccoon'

/* Pesukarhun pää: siluetti jaetaan kaulan kohdalta kahtia (runko + pää samasta ruudukosta, pää hieman päällekkäin),
   jolloin pää voi kääntyä hiiren suuntaan ilman että ruutuanimaatio (tassujen pesu) katkeaa. */
const HEAD_PIVOT = { x: 0.36, y: 0.37 } // kaula, osuus ruudun koosta
const BODY_CLIP = 'inset(34% 0 0 0)'
const HEAD_CLIP = 'inset(0 0 59% 0)'

/** Peura säikähtää klikkauksesta, pomppii pois ja palaa tämän ajan kuluttua */
const DEER_RETURN_MS = 20_000

/** Peura ja pesukarhu: videon ruudut sen omalla ajoituksella, sitten lyhyt tauko alkuasennossa (video alkaa ja
    päättyy samaan). Aloittaa satunnaisesta ruudusta heti, ettei eläimiä nähdä seisomassa odottamassa.
    Pesukarhun pää seuraa hiirtä; peura säikähtää klikkauksesta (ks. startleDeer). */
export function Critter({ kind, className }: { kind: ClipKind; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const s = critterSprites[kind]
  const split = kind === 'raccoon' // pää erillisenä kerroksena

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const parts = split ? Array.from(el.querySelectorAll<HTMLElement>('.cp')) : [el]
    const showAll = (n: number) => parts.forEach((p) => show(p, s, n))
    let i = Math.floor(Math.random() * s.frames) // eläimet eivät ole samassa vaiheessa
    showAll(reduce ? 0 : i)
    const unarms = parts.map((p) => armSoon(p, s))
    const unarm = () => unarms.forEach((u) => u())

    /* ----- pesukarhu: pää seuraa hiirtä ----- */
    let stopTrack = () => {}
    if (split && !reduce) {
      const head = el.querySelector<HTMLElement>('.cp-head')!
      let tx = 0 // tavoite: kulma (astetta) ja suunta (-1 = vasen, 1 = oikea)
      let tf = -1
      let rot = 0
      let flip = -1 // nykyinen scaleX: pää kääntyy (kutistuu ja leviää) kun suunta vaihtuu
      let raf = 0
      const frame = () => {
        raf = 0
        rot += (tx - rot) * 0.18
        flip += (tf - flip) * 0.22
        head.style.transform = `rotate(${rot.toFixed(2)}deg) scaleX(${flip.toFixed(3)})`
        if (Math.abs(tx - rot) > 0.05 || Math.abs(tf - flip) > 0.01) raf = requestAnimationFrame(frame)
      }
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        const px = r.left + r.width * HEAD_PIVOT.x
        const py = r.top + r.height * HEAD_PIVOT.y
        const dx = e.clientX - px
        const dy = e.clientY - py
        // pesukarhu katsoo videossa vasemmalle; kun hiiri on selvästi oikealla, pää peilataan
        if (dx > r.width * 0.25) tf = 1
        else if (dx < -r.width * 0.05) tf = -1
        const ang = (Math.atan2(dy, Math.max(Math.abs(dx), 30)) * 180) / Math.PI // ylös = negatiivinen
        const lim = 28
        tx = Math.max(-lim, Math.min(lim, tf < 0 ? -ang * 0.8 : ang * 0.8))
        if (!raf) raf = requestAnimationFrame(frame)
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      stopTrack = () => {
        window.removeEventListener('pointermove', onMove)
        cancelAnimationFrame(raf)
      }
    }

    /* ----- peura: säikähtää klikkauksesta ----- */
    let frozen = false
    let stopDeer = () => {}
    if (kind === 'deer') {
      let back = 0
      let anim: Animation | undefined
      const onClick = () => {
        if (frozen) return
        frozen = true
        showAll(0) // pää ylös, korvat pystyssä
        el.style.cursor = 'default'
        const finish = () => {
          el.style.visibility = 'hidden'
        }
        if (reduce) finish()
        else {
          const r = el.getBoundingClientRect()
          anim = startleDeer(el, r)
          anim.onfinish = finish
        }
        // takaisin 20 s klikkauksesta
        back = window.setTimeout(() => {
          anim?.cancel()
          el.style.visibility = 'visible'
          i = 0
          frozen = false
          el.style.cursor = 'pointer'
          if (!reduce) el.animate([{ opacity: 0, transform: 'translateX(60px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 1400, easing: 'ease-out' })
        }, DEER_RETURN_MS)
      }
      el.style.cursor = 'pointer'
      el.addEventListener('click', onClick)
      stopDeer = () => {
        el.removeEventListener('click', onClick)
        window.clearTimeout(back)
        anim?.cancel()
      }
    }

    if (reduce) return () => {
      unarm()
      stopDeer()
    }
    let timer = 0
    let wait = 0
    const tick = () => {
      if (frozen) {
        timer = window.setTimeout(tick, 120)
        return
      }
      if (wait > 0) {
        const w = wait
        wait = 0
        timer = window.setTimeout(tick, w)
        return
      }
      showAll(i)
      const ms = s.ms[i] ?? 42
      i = (i + 1) % s.frames
      if (i === 0) wait = rand(600, 2400)
      timer = window.setTimeout(tick, ms)
    }
    tick()
    return () => {
      unarm()
      stopTrack()
      stopDeer()
      window.clearTimeout(timer)
    }
  }, [reduce, s, split, kind])

  const box = { aspectRatio: `${s.w} / ${s.h}` }
  if (!split) return <div ref={ref} className={cn('critter', className)} style={box} aria-hidden />
  return (
    <div ref={ref} className={cn('critter', className)} style={box} aria-hidden>
      <div className="cp cp-body absolute inset-0" style={{ clipPath: BODY_CLIP }} />
      <div
        className="cp cp-head absolute inset-0 will-change-transform"
        style={{ clipPath: HEAD_CLIP, transformOrigin: `${HEAD_PIVOT.x * 100}% ${HEAD_PIVOT.y * 100}%` }}
      />
    </div>
  )
}

/** Säikähtänyt peura: hätkähtää (pieni hyppy ylös), kääntää katseen ja pomppii vasemmalle yli ruudun reunan.
    Kaaret lasketaan avainruuduiksi (Web Animations), jolloin liike on pehmeä ilman React-renderöintejä. */
function startleDeer(el: HTMLElement, r: DOMRect): Animation {
  const dist = r.right + 80 // kunnes koko peura on ruudun vasemman reunan ulkopuolella
  const startle = 380 // hätkähdys
  const hop = 340 // yhden loikan kesto
  const hops = Math.max(4, Math.ceil(dist / 260))
  const total = startle + hops * hop
  const kf: Keyframe[] = []
  const add = (t: number, x: number, y: number, rot: number, sy = 1) =>
    kf.push({ offset: Math.min(1, t / total), transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scaleY(${sy})` })
  // hätkähdys: kyyristyy, nykäisee ylös
  add(0, 0, 0, 0)
  add(90, 0, 3, 0, 0.94)
  add(startle * 0.6, 0, -14, -3)
  add(startle, 0, 0, 0)
  // loikat
  const step = dist / hops
  const h = Math.min(46, r.height * 0.7)
  for (let k = 0; k < hops; k++) {
    const t0 = startle + k * hop
    const x0 = -step * k
    for (let j = 1; j <= 8; j++) {
      const u = j / 8
      const y = -4 * h * u * (1 - u) // paraabeli
      const rot = (u < 0.5 ? -1 : 1) * 16 * Math.sin(u * Math.PI) // nokka ylös lähdössä, alas laskussa
      add(t0 + u * hop, x0 - step * u, y, rot, u > 0.9 ? 0.95 : 1)
    }
  }
  return el.animate(kf, { duration: total, easing: 'linear', fill: 'forwards' })
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
    // liikkeellä heti: kävelysyklin satunnaisesta ruudusta
    let mode: Mode = reduce ? 'stand' : 'walk'
    let i = Math.floor(Math.random() * s.walk.n)
    let left = 1000 / s.fps // ms seuraavaan ruutuun
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
    const unarm = armSoon(el, s)
    draw(reduce ? s.stand : s.walk.at + i)
    if (reduce) return unarm // vain kuva, ei liikettä

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

    // pyörii koko ajan, myös näkymän ulkopuolella (selain hidastaa itse taustavälilehdellä)
    const frame = (t: number) => {
      const dt = last ? Math.min(t - last, 100) : 0
      last = t
      if (el.offsetHeight > 0) {
        left -= dt
        for (let n = 0; left <= 0 && n < 6; n++) left += step()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      unarm()
      cancelAnimationFrame(raf)
    }
  }, [reduce, s])

  return (
    <div ref={track} className={cn('pointer-events-none absolute overflow-hidden', className)} aria-hidden>
      <div ref={bear} className="critter absolute bottom-0 left-0 h-full will-change-transform" style={{ aspectRatio: `${s.w} / ${s.h}` }} />
    </div>
  )
}
