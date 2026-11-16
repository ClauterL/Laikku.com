import { useEffect, useRef } from 'react'

import { critterSprites, gameArt } from '@/content'
import deerExtra from '@/data/critters-extra.json'
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

/* ---------- Pesukarhu: seuraa hiirtä katseellaan ----------
   Lepotilassa pesukarhu pesee tassujaan (critter-ruudukko). Kun hiirtä liikutetaan, se vaihtuu lennon pesukarhun
   Higgsfield-klippiin "look" (katse nousee ylös, ruudut siirretään korkeuskulman mukaan) ja peilautuu oikealle,
   kun hiiri on sen oikealla puolella; 2,5 s liikkumattomuuden jälkeen palataan tassujen pesuun. */
const LOOK = gameArt.raccoon
const LOOK_START = LOOK.clips.look.start
const LOOK_RAMP = 38 // klipin alkuosa, jossa pää nousee ylös ja pysähtyy
const WATCH_IDLE_MS = 2500
const HEAD = { x: 0.36, y: 0.3 } // pään kohta (osuus ruudusta), josta katsesuunta lasketaan

/* ---------- Peura: säikähtää klikkauksesta ----------
   Klikkaus: hätkähdys (pieni hyppy) → Higgsfield-video peuran pakenemisesta (pää ylös, loikat vasemmalle ulos
   kuvasta) lepoasennon päälle → piilossa → takaisin DEER_RETURN_MS klikkauksesta. */
const FLEE = deerExtra.deerFlee
const DEER_RETURN_MS = 20_000
const FLEE_MS = 42 // pakoruudun kesto (video 24 fps)
const FLEE_SPEED = 1.35 // nopeutus videon omaan etenemiseen verrattuna
const BASE_DEER = { rump: 0.893, feet: 0.993, alertH: 148, cellH: 150 } // laiduntavan peuran lepoasento (critter-deer, ruutu 0)

/** Peura ja pesukarhu: videon ruudut sen omalla ajoituksella, sitten lyhyt tauko alkuasennossa (video alkaa ja
    päättyy samaan). Aloittaa satunnaisesta ruudusta heti, ettei eläimiä nähdä seisomassa odottamassa. */
export function Critter({ kind, className }: { kind: ClipKind; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const s = critterSprites[kind]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const base = el.querySelector<HTMLElement>('.cp-base')!
    const extra = el.querySelector<HTMLElement>('.cp-extra')! // raccoon: look-kerros, deer: pako-kerros
    let i = Math.floor(Math.random() * s.frames) // eläimet eivät ole samassa vaiheessa
    show(base, s, reduce ? 0 : i)
    const unarms = [armSoon(base, s)]
    let frozen = false // pysäyttää perusanimaation
    const cleanups: Array<() => void> = []

    /* ----- pesukarhu: katse seuraa hiirtä ----- */
    if (kind === 'raccoon' && !reduce) {
      arm(extra, LOOK)
      show(extra, LOOK, LOOK_START)
      let watching = false
      let tp = 0 // tavoite: katseen nousu 0…1
      let tf = 1 // tavoite: suunta (1 = vasemmalle kuten videossa, -1 = peilattu oikealle)
      let p = 0
      let f = 1
      let raf = 0
      let idleT = 0
      const setLayers = (look: boolean) => {
        base.style.visibility = look ? 'hidden' : 'visible'
        extra.style.visibility = look ? 'visible' : 'hidden'
        frozen = look
      }
      const frame = () => {
        raf = 0
        p += (tp - p) * 0.2
        f += (tf - f) * 0.25
        show(extra, LOOK, LOOK_START + Math.round(p * LOOK_RAMP))
        el.style.transform = `scaleX(${f.toFixed(3)})`
        const settled = Math.abs(tp - p) < 0.01 && Math.abs(tf - f) < 0.02
        if (!watching && settled) {
          el.style.transform = ''
          setLayers(false)
          return
        }
        raf = requestAnimationFrame(frame)
      }
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        if (r.width === 0) return
        const dx = e.clientX - (r.left + r.width * HEAD.x)
        const dy = e.clientY - (r.top + r.height * HEAD.y)
        if (!watching) {
          watching = true
          setLayers(true)
        }
        if (dx > r.width * 0.35) tf = -1
        else if (dx < -r.width * 0.05) tf = 1
        const elev = (Math.atan2(-dy, Math.max(Math.abs(dx), 40)) * 180) / Math.PI // asteina, ylös = positiivinen
        tp = Math.max(0, Math.min(1, (elev - 4) / 46))
        window.clearTimeout(idleT)
        idleT = window.setTimeout(() => {
          watching = false
          tp = 0
          tf = 1
          if (!raf) raf = requestAnimationFrame(frame)
        }, WATCH_IDLE_MS)
        if (!raf) raf = requestAnimationFrame(frame)
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      cleanups.push(() => {
        window.removeEventListener('pointermove', onMove)
        window.clearTimeout(idleT)
        cancelAnimationFrame(raf)
      })
    }

    /* ----- peura: säikähtää klikkauksesta ----- */
    if (kind === 'deer') {
      let back = 0
      let step = 0
      const anims: Animation[] = []
      const onClick = () => {
        if (frozen) return
        frozen = true
        show(base, s, 0) // pää ylös, korvat pystyssä
        el.style.cursor = 'default'
        const gone = () => {
          extra.style.visibility = 'hidden'
          el.style.visibility = 'hidden'
        }
        if (reduce) {
          base.style.visibility = 'hidden'
          gone()
        } else {
          // pako-kerros lepoasennon peuran päälle: oikea reuna (peräpää) ja jalat samaan kohtaan
          const bw = el.offsetWidth
          const bh = el.offsetHeight
          const k = (BASE_DEER.alertH / FLEE.deerH) * (bh / BASE_DEER.cellH) // pako-solun pikseli → näytön pikseli
          const lw = FLEE.w * k
          const lh = FLEE.h * k
          extra.style.width = `${lw}px`
          extra.style.height = `${lh}px`
          extra.style.left = `${BASE_DEER.rump * bw - FLEE.rump * lw}px`
          extra.style.top = `${BASE_DEER.feet * bh - FLEE.feet * lh}px`
          arm(extra, FLEE)
          extra.style.transformOrigin = `50% ${FLEE.feet * 100 - 8}%` // peuran vartalon keskikohta (ruudut vakautettu keskelle)
          show(extra, FLEE, 0)
          // hätkähdys: pieni hyppy ylös ennen kuin loikat alkavat
          const startle = el.animate(
            [{ transform: 'translateY(0)' }, { transform: `translateY(${-bh * 0.14}px)`, offset: 0.45 }, { transform: 'translateY(0)' }],
            { duration: 300, easing: 'ease-out' },
          )
          anims.push(startle)
          // vaihto pakokerrokseen hypyn huipulla, jolloin asennon muutos jää hypyn peittoon
          step = window.setTimeout(() => {
            base.style.visibility = 'hidden'
            extra.style.visibility = 'visible'
            let n = 0 // ruutulaskuri: alku (säikähdys → 1. loikka) ja sen jälkeen loikkasykli silmukkana
            let pos = 0 // kuljettu matka vasemmalle (px)
            const air = FLEE.lift
            const cycleLen = FLEE.cycleB - FLEE.cycleA
            const hop = bh * 0.5 // lisäkaaren korkeus (videon oma pystyliike päälle)
            const startX = el.getBoundingClientRect().left + BASE_DEER.rump * bw // peräpään paikka ruudulla lähdössä
            const play = () => {
              const idx = n < FLEE.cycleA ? n : FLEE.cycleA + ((n - FLEE.cycleA) % cycleLen)
              show(extra, FLEE, idx)
              // eteneminen: videon oma vauhti (sykleissä keskiarvo), hieman nopeutettuna
              pos += (n < FLEE.cycleA ? FLEE.dx[idx] : FLEE.cycleDx) * k * FLEE_SPEED
              // loikkakaari: ilmassa-aste nostaa peuraa, nokka nousee noustessa ja laskee laskeutuessa
              const l = air[idx] ?? 0
              const dl = (air[Math.min(FLEE.frames - 1, idx + 1)] ?? l) - (air[Math.max(0, idx - 1)] ?? l)
              extra.style.transform = `translate(${(-pos).toFixed(1)}px, ${(-l * hop).toFixed(1)}px) rotate(${(dl * 14).toFixed(1)}deg)`
              n += 1
              if (startX - pos < -lw || n > 600) {
                gone() // peura on loikannut ruudun vasemman reunan yli
                return
              }
              step = window.setTimeout(play, FLEE_MS)
            }
            play()
          }, 130)
        }
        // takaisin 20 s klikkauksesta
        back = window.setTimeout(() => {
          window.clearTimeout(step)
          anims.forEach((a) => a.cancel())
          extra.style.visibility = 'hidden'
          base.style.visibility = 'visible'
          el.style.visibility = 'visible'
          i = 0
          frozen = false
          el.style.cursor = 'pointer'
          if (!reduce) el.animate([{ opacity: 0, transform: 'translateX(60px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 1400, easing: 'ease-out' })
        }, DEER_RETURN_MS)
      }
      el.style.cursor = 'pointer'
      el.addEventListener('click', onClick)
      cleanups.push(() => {
        el.removeEventListener('click', onClick)
        window.clearTimeout(back)
        window.clearTimeout(step)
        anims.forEach((a) => a.cancel())
      })
    }

    const cleanup = () => {
      unarms.forEach((u) => u())
      cleanups.forEach((c) => c())
    }
    if (reduce) return cleanup
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
      show(base, s, i)
      const ms = s.ms[i] ?? 42
      i = (i + 1) % s.frames
      if (i === 0) wait = rand(600, 2400)
      timer = window.setTimeout(tick, ms)
    }
    tick()
    return () => {
      cleanup()
      window.clearTimeout(timer)
    }
  }, [reduce, s, kind])

  return (
    <div ref={ref} className={cn('critter', className)} style={{ aspectRatio: `${s.w} / ${s.h}` }} aria-hidden>
      <div className="cp-base absolute inset-0" />
      <div
        className="cp-extra absolute"
        style={kind === 'raccoon' ? { inset: 0, visibility: 'hidden' } : { visibility: 'hidden' }}
      />
    </div>
  )
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
