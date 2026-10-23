import { useEffect, useRef } from 'react'

import { startScene } from '@/content'
import sky from '@/data/start-sky.json'
import { HERO_BOX, HeroLife } from '@/components/portfolio/Landscape'
import { cn } from '@/lib/utils'
import { Stars } from './StartSky'

/* Aloitusruudun tausta: auringonlasku ↔ revontuliyö esirenderöitynä videona (Higgsfield, scripts/start-video.py).
   Selain purkaa videon laitteistolla yhtenä tasona – ei kahden kuvapinon ristihäivytystä, joka nyki ja jonka aikana
   näytönohjaimen muisti loppui (kortti katosi, taivas leikkautui).
   - dn = päivä → yö, nd = sama ruutu ruudulta käänteisenä. Suunta vaihtuu kesken siirtymän hyppäämällä toiseen
     videoon peilikuvaruutuun (sama kuva), joten kesken käännetty siirtymä jatkuu saumattomasti.
   - Levossa päivä on tarkka still-kuva (siirtymän ensimmäinen ruutu); yöllä revontulet aaltoilevat silmukassa.
   - Kehys on 16:9 ja sijoitettu hero-maiseman laatikkoon, joten maisema on täsmälleen samassa kohdassa kuin
     normaalin portfolion herossa (Normaali-valinnassa ruutu häivytetään sen päältä). Videon yläpuolelle jäävä taivas
     (korkeat näkymät, puhelin) täytetään videon yläreunan värillä ruutu ruudulta (start-sky.json) + tähdillä.
   - Pienet elävät yksityiskohdat (drone, välke, savu, linnut, tulikärpäset) piirretään videon päälle (HeroLife).
   - Ilman videota (vähennetty liike, datansäästö, virhe tai estetty toisto) kuvat ristihäivytetään. */

type Clip = 'dn' | 'nd'
const N = sky.frames
const FPS = sky.fps
/** siirtymän luonnollinen kesto (s) – nopeus playbackRatella */
export const SKY_DURATION = (N - 1) / FPS
/** kuinka kauan ensimmäistä siirtymää odotetaan videon latautumista, ennen kuin kuvat ristihäivytetään */
const WAIT_MS = 2500

const smooth = (x: number) => x * x * (3 - 2 * x)
/** Toistonopeus muuttuu sujuvasti kesken toiston (ei hyppyä) */
const setRate = (el: HTMLMediaElement | null | undefined, r: number) => {
  if (el && el.playbackRate !== r) el.playbackRate = r
}

export function StartBackdrop({
  night,
  rate,
  excited,
  onHeading,
  onRest,
}: {
  /** tavoite: yö (Pelillistetty) vai päivä (Normaali) */
  night: boolean
  /** siirtymän toistonopeus (1 = SKY_DURATION) */
  rate: number
  /** pelin lataus: revontulet kiihtyvät */
  excited?: boolean
  /** siirtymä alkoi tai kääntyi kohti yötä/päivää (käyttöliittymän värit seuraavat tätä) */
  onHeading?: (night: boolean) => void
  /** siirtymä valmis (true = yö, false = päivä) tai liikkeellä (null) */
  onRest?: (night: boolean | null) => void
}) {
  const scene = useRef<HTMLDivElement>(null)
  const dayImg = useRef<HTMLImageElement>(null)
  const nightImg = useRef<HTMLImageElement>(null)
  const dn = useRef<HTMLVideoElement>(null)
  const nd = useRef<HTMLVideoElement>(null)
  const loop = useRef<HTMLVideoElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const seam = useRef<HTMLDivElement>(null)
  const stars = useRef<HTMLDivElement>(null)

  const cb = useRef({ onHeading, onRest, rate, excited })
  useEffect(() => {
    cb.current = { onHeading, onRest, rate, excited }
  })

  /** Ohjaimen tila (ei Reactin tilaa: muutokset tehdään suoraan elementteihin) */
  const st = useRef({
    target: night,
    /** levossa: false = päivä, true = yö; null = liikkeellä */
    rest: false as boolean | null,
    heading: false,
    clip: null as Clip | null,
    busy: false,
    /** kuvien ristihäivytys kesken */
    fading: false,
    /** videot käytössä (pois: vähennetty liike, datansäästö, virhe, estetty toisto) */
    video: true,
    /** video ladattu kokonaan kerran (loppuun soinut video ei enää ilmoita canplaythrough-tilaa) */
    ready: { dn: false, nd: false, loop: false },
    z: 2,
    raf: 0,
    hide: 0,
    fadeEnd: 0,
    drive: () => {},
  })

  // ---------- ohjain ----------
  useEffect(() => {
    const s = st.current
    const v = { dn: dn.current!, nd: nd.current!, loop: loop.current! }
    const day = dayImg.current!
    const nightStill = nightImg.current!
    const layers = [day, nightStill, v.dn, v.nd, v.loop]

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
    if (reduce || saveData) s.video = false

    /** Taivaan täyttö ja tähdet videon yläpuolella: ruutu f (0 = päivä … N − 1 = yö) */
    const paint = (f: number) => {
      const i = Math.max(0, Math.min(N - 1, Math.round(f)))
      const c = sky.top[i]
      if (fill.current) fill.current.style.backgroundColor = c
      if (seam.current) seam.current.style.background = `linear-gradient(${c}, ${c}00)`
      if (stars.current) stars.current.style.opacity = String(smooth(Math.max(0, i / (N - 1) - 0.35) / 0.65))
    }

    // yön still ristihäivytykseen: heti päivän kuvan jälkeen (pieni), ilman videota heti
    const loadNight = () => {
      if (!nightStill.srcset) {
        nightStill.srcset = startScene.night.srcSet
        nightStill.src = startScene.night.src
      }
    }

    /** Näkyvä ruutu siirtymävideosta (dn-järjestyksessä) */
    const frameOf = (clip: Clip) => {
      const i = Math.min(N - 1, Math.max(0, Math.floor(v[clip].currentTime * FPS + 1e-3)))
      return clip === 'dn' ? i : N - 1 - i
    }
    const tick = () => {
      s.raf = 0
      if (!s.clip) return
      paint(frameOf(s.clip))
      if (!v[s.clip].paused) s.raf = requestAnimationFrame(tick)
    }
    const run = () => {
      if (!s.raf) s.raf = requestAnimationFrame(tick)
    }

    /** el eteen (ms > 0: häivyttäen), muut piiloon kun se peittää ne */
    const front = (el: HTMLElement, ms: number) => {
      el.style.zIndex = String(++s.z)
      el.style.transition = ms ? `opacity ${ms}ms linear` : 'none'
      el.style.opacity = '1'
      window.clearTimeout(s.hide)
      s.hide = window.setTimeout(() => {
        for (const o of layers) {
          if (o === el) continue
          o.style.transition = 'none'
          o.style.opacity = '0'
          if (o instanceof HTMLVideoElement && !(s.clip && o === v[s.clip]) && !o.paused) o.pause()
        }
      }, ms + 60)
    }

    const play = (el: HTMLVideoElement) =>
      el.play().then(
        () => true,
        (e: DOMException) => {
          // iOS:n virransäästö tms. estää toiston → kuvat ristihäivytetään jatkossa
          if (e?.name === 'NotAllowedError') disableVideo()
          return false
        },
      )

    /** Odota, että videon ruutu kohdassa t on näkyvissä (haku + ruudun esitys, varalla aikaraja) */
    const seek = (el: HTMLVideoElement, t: number) =>
      new Promise<void>((resolve) => {
        let done = false
        const fin = () => {
          if (done) return
          done = true
          el.removeEventListener('seeked', onSeeked)
          resolve()
        }
        const onSeeked = () => {
          if ('requestVideoFrameCallback' in el) el.requestVideoFrameCallback(() => fin())
          requestAnimationFrame(fin)
        }
        el.addEventListener('seeked', onSeeked)
        window.setTimeout(fin, 900)
        el.currentTime = t
      })

    const heading = (n: boolean) => {
      if (s.heading !== n || s.rest !== null) {
        s.heading = n
        scene.current?.toggleAttribute('data-night', n)
        cb.current.onHeading?.(n)
      }
      s.rest = null
      cb.current.onRest?.(null)
    }
    const arrive = (n: boolean) => {
      s.rest = n
      s.clip = null
      paint(n ? N - 1 : 0)
      cb.current.onRest?.(n)
    }

    /** Yön lepotila: revontulet aaltoilevat silmukassa (ristihäivytys siirtymän viimeisestä ruudusta) */
    const startLoop = () => {
      if (!s.video || s.rest !== true || s.clip || !(s.ready.loop || v.loop.readyState >= 3)) return
      if (Number(v.loop.style.opacity) === 1 && !v.loop.paused) return
      v.loop.currentTime = 0
      v.loop.playbackRate = cb.current.excited ? 1.7 : 1
      void play(v.loop).then((ok) => ok && s.rest === true && !s.clip && front(v.loop, 450))
    }

    /** Ilman videota: kuvat ristihäivytetään (myös kesken käännettävissä, CSS-siirtymä) */
    const fade = (n: boolean) => {
      const ms = reduce ? 500 : (SKY_DURATION * 1000) / cb.current.rate
      const wasNight = s.rest === true
      heading(n)
      for (const o of [v.dn, v.nd, v.loop]) {
        o.pause()
        o.style.transition = 'none'
        o.style.opacity = '0'
      }
      window.clearTimeout(s.hide)
      loadNight()
      day.style.transition = 'none'
      day.style.opacity = '1'
      day.style.zIndex = '1'
      nightStill.style.zIndex = '2'
      if (!s.fading) {
        // lähtökohta = nykyinen näkymä (video saattoi olla edessä)
        nightStill.style.transition = 'none'
        nightStill.style.opacity = wasNight ? '1' : '0'
        void nightStill.offsetWidth
      }
      s.fading = true
      nightStill.style.transition = `opacity ${ms}ms ease-in-out`
      nightStill.style.opacity = n ? '1' : '0'
      if (fill.current) fill.current.style.transition = `background-color ${ms}ms ease-in-out`
      if (stars.current) stars.current.style.transition = `opacity ${ms}ms ease-in-out`
      paint(n ? N - 1 : 0)
      window.clearTimeout(s.fadeEnd)
      s.fadeEnd = window.setTimeout(() => {
        s.fading = false
        if (fill.current) fill.current.style.transition = ''
        if (stars.current) stars.current.style.transition = ''
        arrive(n)
        s.z = 3
        if (n) startLoop()
        s.drive()
      }, ms)
    }

    const disableVideo = () => {
      if (!s.video) return
      s.video = false
      cancelAnimationFrame(s.raf)
      s.raf = 0
      s.clip = null
      s.busy = false
      fade(s.target)
    }

    /** Siirtymä levosta */
    const start = (clip: Clip) => {
      const el = v[clip]
      const toNight = clip === 'dn'
      s.busy = true
      void seek(el, 0).then(() => {
        s.busy = false
        if (!s.video) return
        if (s.target !== toNight) return s.drive()
        heading(toNight)
        s.clip = clip
        el.playbackRate = cb.current.rate
        void play(el)
        // päivän still → video: sama ruutu, lyhyt häivytys peittää terävyyseron; yön silmukka → video: sulava
        front(el, toNight ? 120 : 380)
        run()
      })
    }

    /** Suunnan vaihto kesken: toinen video peilikuvaruutuun (sama kuva) ja jatketaan sieltä */
    const reverse = (from: Clip) => {
      const to: Clip = from === 'dn' ? 'nd' : 'dn'
      const a = v[from]
      const b = v[to]
      if (b.readyState < 2) return // ei vielä ladattu: nykyinen soi loppuun ja käännetään sitten
      a.pause()
      const i = Math.min(N - 1, Math.floor(a.currentTime * FPS + 1e-3))
      const t = (N - 1 - i + 0.5) / FPS
      s.busy = true
      void seek(b, t).then(() => {
        s.busy = false
        if (!s.video) return
        if (s.target === (from === 'dn')) {
          // käännettiin takaisin odottaessa
          void play(a)
          run()
          return
        }
        heading(to === 'dn')
        s.clip = to
        b.playbackRate = cb.current.rate
        front(b, 0)
        void play(b)
        run()
      })
    }

    s.drive = () => {
      if (s.busy) return
      const want = s.target
      if (s.fading) {
        if (s.heading !== want) fade(want) // ristihäivytys kääntyy kesken (CSS-siirtymä)
        return
      }
      if (!s.video) {
        if (s.rest !== want) fade(want)
        return
      }
      if (s.clip) {
        const el = v[s.clip]
        if ((s.clip === 'dn') === want) {
          setRate(el, cb.current.rate)
          if (el.paused && !el.ended) {
            void play(el)
            run()
          }
          return
        }
        return reverse(s.clip)
      }
      if (s.rest === want) return
      const clip: Clip = want ? 'dn' : 'nd'
      if (s.ready[clip] || v[clip].readyState >= 3) return start(clip)
      // ensimmäinen siirtymä: odotetaan videota hetki, sitten kuvat
      s.busy = true
      const ready = () => {
        cleanup()
        s.busy = false
        if (s.target !== want || !s.video) return s.drive()
        start(clip)
      }
      const late = window.setTimeout(() => {
        cleanup()
        s.busy = false
        if (s.target === want && s.rest !== want) fade(want)
        else s.drive()
      }, WAIT_MS)
      const cleanup = () => {
        window.clearTimeout(late)
        v[clip].removeEventListener('canplaythrough', ready)
      }
      v[clip].addEventListener('canplaythrough', ready)
    }

    const onEnded = (clip: Clip) => () => {
      if (s.clip !== clip) return
      cancelAnimationFrame(s.raf)
      s.raf = 0
      const n = clip === 'dn'
      arrive(n)
      if (n) startLoop()
      else front(day, 260) // terävä päivän still siirtymän viimeisen ruudun päälle
      s.drive()
    }
    const endDn = onEnded('dn')
    const endNd = onEnded('nd')
    v.dn.addEventListener('ended', endDn)
    v.nd.addEventListener('ended', endNd)
    const marks = (['dn', 'nd', 'loop'] as const).map((k) => {
      const on = () => (s.ready[k] = true)
      v[k].addEventListener('canplaythrough', on)
      return () => v[k].removeEventListener('canplaythrough', on)
    })
    const onLoopReady = () => startLoop()
    v.loop.addEventListener('canplaythrough', onLoopReady)
    const onError = () => disableVideo()

    // ---------- lataus: ensin päivä → yö (ensimmäinen hämärä), sitten paluu ja silmukka ----------
    const w = window.innerWidth >= 924 && Math.max(window.innerWidth, 923) * window.devicePixelRatio > 1400 ? 1920 : 1280
    const mp4 = v.dn.canPlayType('video/mp4; codecs="avc1.640028"') !== ''
    const webm = v.dn.canPlayType('video/webm; codecs="vp9"') !== ''
    if (!mp4 && !webm) s.video = false
    const src = startScene.video(w, mp4 ? 'mp4' : 'webm')
    for (const el of [v.dn, v.nd, v.loop]) {
      el.muted = true
      el.defaultMuted = true
      el.playsInline = true
    }
    let later = 0
    if (s.video) {
      v.dn.addEventListener('error', onError)
      v.dn.src = src.dn
      v.dn.preload = 'auto'
      const rest = () => {
        if (!v.nd.src) {
          v.nd.src = src.nd
          v.nd.preload = 'auto'
          v.loop.src = src.loop
          v.loop.preload = 'auto'
        }
      }
      v.dn.addEventListener('canplaythrough', rest, { once: true })
      later = window.setTimeout(rest, 3000)
    }
    if (!s.video || day.complete) loadNight()
    else day.addEventListener('load', loadNight, { once: true })

    paint(0)
    s.drive()

    return () => {
      cancelAnimationFrame(s.raf)
      window.clearTimeout(s.hide)
      window.clearTimeout(s.fadeEnd)
      window.clearTimeout(later)
      day.removeEventListener('load', loadNight)
      v.dn.removeEventListener('ended', endDn)
      v.nd.removeEventListener('ended', endNd)
      v.loop.removeEventListener('canplaythrough', onLoopReady)
      marks.forEach((off) => off())
      v.dn.removeEventListener('error', onError)
      // vapautetaan purkajat
      for (const el of [v.dn, v.nd, v.loop]) {
        el.pause()
        el.removeAttribute('src')
        el.load()
      }
    }
  }, [])

  // tavoite vaihtuu → ohjain (kesken oleva siirtymä kääntyy saumattomasti)
  useEffect(() => {
    st.current.target = night
    st.current.drive()
  }, [night])

  // nopeus: käynnissä oleva siirtymä kiihtyy sujuvasti (valinnan vahvistus)
  useEffect(() => {
    const s = st.current
    setRate(s.clip === 'dn' ? dn.current : s.clip === 'nd' ? nd.current : null, rate)
  }, [rate])

  useEffect(() => setRate(loop.current, excited ? 1.7 : 1), [excited])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* korkeissa näkymissä videon yläpuolinen taivas: videon yläreunan väri + tähdet */}
      <div ref={fill} className="sb-fill absolute inset-0">
        <Stars ref={stars} className="sb-stars absolute inset-0" />
      </div>
      <div ref={scene} className={cn('hero-scene', HERO_BOX)}>
        <div className="sb-frame">
          <img
            ref={dayImg}
            src={startScene.day.src}
            srcSet={startScene.day.srcSet}
            sizes={startScene.sizes}
            width={startScene.width}
            height={startScene.height}
            alt=""
            draggable={false}
            fetchPriority="high"
            decoding="async"
            style={{ opacity: 1, zIndex: 1 }}
          />
          <img
            ref={nightImg}
            sizes={startScene.sizes}
            width={startScene.width}
            height={startScene.height}
            alt=""
            draggable={false}
            decoding="async"
          />
          <video ref={dn} muted playsInline preload="none" disablePictureInPicture disableRemotePlayback tabIndex={-1} />
          <video ref={nd} muted playsInline preload="none" disablePictureInPicture disableRemotePlayback tabIndex={-1} />
          <video ref={loop} muted playsInline loop preload="none" disablePictureInPicture disableRemotePlayback tabIndex={-1} />
          <div ref={seam} className="sb-seam" />
        </div>
        <HeroLife />
      </div>
    </div>
  )
}
