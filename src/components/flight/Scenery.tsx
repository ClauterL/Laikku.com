import { useId, type CSSProperties, type ReactNode } from 'react'

import { gameArt, heroNight, heroScene, type FlightStation } from '@/content'
import { cn } from '@/lib/utils'
import { STATIONS, TILE, WATER, WORLD, type StationDef } from './world'

/* Dronelennon maisema ja elävä ympäristö. Päivä- ja yöpino piirretään kumpikin kokonaan (FlightGame), joten
   tämän tiedoston osat saavat yön tiedon propsina tai .fl-night-esivanhemmasta (värit index.css:ssä).
   Kaikki liike on CSS- tai SMIL-animaatiota (transform/opacity tai pienten SVG-polkujen muoto): pelisilmukka
   liikuttaa vain tasoja (data-k). Piilossa olevan pinon animaatiot pysäytetään (index.css). */

export const px = (h: number) => `calc(var(--H) * ${h} * 1px)`

/** Syvyys k (parallaksi, 1 = kohteiden taso) → vedenpinnan korkeus laatikon yläreunasta. Sovitettu niin, että
    vastaranta (k 0.16) on 0.188 ja kohteet (k 1) WATER: kaukaiset asiat ovat pienempiä ja lähempänä horisonttia. */
export const waterAt = (k: number) => 0.098 + 0.562 * k
/** Maailman kohta x (kohteiden tasossa) → tason k kohta, joka näkyy samassa kohdassa ruutua, kun drone on x:ssä */
const atDepth = (x: number, k: number) => x * k + 0.8 * (1 - k)

/** Toistettava näennäissatunnainen luku 0…1 */
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return v - Math.floor(v)
}

type Vars = CSSProperties & Record<`--${string}`, string | number>

/** Parallaksitaso: pelisilmukka siirtää kaikkia [data-k]-elementtejä kameran mukaan kertoimella k */
function Plane({ k, children, className }: { k: number; children: ReactNode; className?: string }) {
  return (
    <div className={cn('fl-plane pointer-events-none absolute bottom-0 left-0', className)} data-k={k} style={{ height: px(1), width: px(WORLD * k + 4.4) }}>
      {children}
    </div>
  )
}

/* ---------------- nauhat, järvi, taivas ---------------- */

/** Toistuva nauha (joka toinen ruutu peilattuna → saumaton). k = parallaksi. */
export function Strip({
  k,
  src,
  srcSet,
  sizes,
  ar,
  h,
  bottom,
  className,
}: {
  k: number
  src: string
  srcSet?: string
  sizes?: string
  ar: number
  h: number
  bottom: number
  className?: string
}) {
  const tile = h * ar
  const count = Math.ceil((WORLD * k + 4.4) / tile) + 1
  return (
    <div className={cn('fl-strip absolute left-0', className)} data-k={k} style={{ bottom: px(bottom), height: px(h), width: px(tile * count) }}>
      {Array.from({ length: count }, (_, i) => (
        <img
          key={i}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt=""
          draggable={false}
          decoding="async"
          className="absolute top-0 h-full max-w-none select-none"
          style={{ left: px(tile * i), width: px(tile), transform: i % 2 ? 'scaleX(-1)' : undefined }}
        />
      ))}
    </div>
  )
}

/** Välkkeet järven aurinkojuovassa (x, y, leveys % järvikuvasta) – samat kuin hero-maisemassa */
const GLINTS: [number, number, number][] = [
  [61.6, 21.5, 1.6],
  [60.8, 25, 1.1],
  [62.8, 28.5, 1.3],
  [61.3, 33, 2],
  [60.1, 38, 0.9],
  [62.4, 42, 1.5],
  [61.0, 47.5, 1.2],
  [63.2, 52, 0.9],
  [61.8, 57, 1.4],
]

/** Järvi pysyy paikallaan (vesi on vaakasuunnassa tasainen), juova auringon/revontulten alla */
function Lake({ night }: { night?: boolean }) {
  const L = night ? heroNight.lake : heroScene.lake
  const w = TILE
  return (
    <div className="fl-lake absolute bottom-0 left-[var(--sun-x)]" style={{ height: px(1), width: px(w), transform: `translateX(${px(-0.618 * w)})` }}>
      {[-1, 0, 1].map((i) => (
        <img
          key={i}
          src={L.src}
          srcSet={L.srcSet}
          sizes="206vh"
          alt=""
          draggable={false}
          decoding="async"
          className="absolute top-0 h-full w-full max-w-none select-none"
          style={{ left: `${i * 100}%`, transform: i ? 'scaleX(-1)' : undefined }}
        />
      ))}
      {GLINTS.map(([x, y, gw], i) => (
        <span
          key={i}
          className={cn('fl-glint absolute h-[0.28%] min-h-[2px] -translate-x-1/2 rounded-full', night ? 'bg-[#c8fff0]' : 'bg-[#fff0c0]')}
          style={{ left: `${x}%`, top: `${y}%`, width: `${gw}%`, animationDelay: `${(i * 0.53) % 2.6}s` }}
        />
      ))}
    </div>
  )
}

/** Pilvijuovat päivän taivaalla: [y (H laatikon yläreunasta, negatiivinen = ylempänä), leveys %, kesto s, viive s] */
const CLOUDS: [number, number, number, number][] = [
  [-0.5, 30, 190, -60],
  [-0.32, 38, 240, -150],
  [-0.14, 24, 170, -95],
]

function Clouds() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height: px(1) }}>
      {CLOUDS.map(([y, w, dur, delay], i) => (
        <div
          key={i}
          className="hero-cloud absolute inset-x-0"
          style={{ top: px(y), height: px(0.018 + (i % 2) * 0.01), animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
        >
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,244,228,0.6)_25%,rgba(255,236,214,0.5)_70%,transparent)] blur-[3px]"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  )
}

function Sun() {
  return (
    <div className="fl-sun pointer-events-none absolute inset-x-0 bottom-0" style={{ height: px(1) }}>
      <div
        className="fl-sun-glow absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,232,170,0.7)_0%,rgba(255,210,140,0.42)_16%,rgba(255,190,120,0.16)_40%,rgba(255,190,120,0)_66%)]"
        style={{ left: 'var(--sun-x)', top: px(0.09), width: px(1.6) }}
      />
      <div
        className="absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_42%_38%,#fff2bf,#ffd977_58%,#ffc457)] shadow-[0_0_28px_6px_rgba(255,200,100,0.45)]"
        style={{ left: 'var(--sun-x)', top: px(0.091), width: px(0.185) }}
      />
    </div>
  )
}

/** Lintuparvi lentää hitaasti taivaan poikki (kuten hero-maisemassa) */
function Bird({ x, y, s, d }: { x: number; y: number; s: number; d: number }) {
  return (
    <svg viewBox="0 0 20 8" className="absolute overflow-visible" style={{ left: `${x}%`, top: `${y}%`, width: `${s}%` }} aria-hidden>
      <path
        className="hero-wing"
        style={{ animationDelay: `${d}s` }}
        d="M0 2 Q5 -1 10 4 Q15 -1 20 2"
        fill="none"
        stroke="var(--pf-deep)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Birds() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height: px(1) }}>
      <div className="hero-flock absolute inset-x-0" style={{ top: px(-0.42), height: px(0.3) }}>
        <Bird x={30} y={10} s={1.5} d={0} />
        <Bird x={32.2} y={24} s={1.2} d={0.2} />
        <Bird x={28.8} y={36} s={1.1} d={0.35} />
        <Bird x={34.5} y={2} s={1} d={0.1} />
        <Bird x={27} y={20} s={0.95} d={0.45} />
      </div>
    </div>
  )
}

/* ---------------- vesi ---------------- */

/** Aallonharjat: kohteiden takana (kauempana pienemmät ja lähempänä horisonttia) ja niiden edessä */
const FAR_WAVES = [0.3, 0.45, 0.62, 0.8]
const NEAR_WAVES = [1.12]

function Waves({ ks }: { ks: number[] }) {
  return (
    <>
      {ks.map((k, j) => {
        const len = WORLD * k + 4.4
        const n = Math.round(len * 0.7)
        return (
          <Plane key={k} k={k}>
            {Array.from({ length: n }, (_, i) => {
              const r1 = hash(i, j + 1)
              const r2 = hash(i, j + 7)
              const r3 = hash(i, j + 13)
              return (
                <span
                  key={i}
                  className="fl-wave absolute rounded-full"
                  style={{
                    left: px(((i + r1 * 0.85) * len) / n),
                    top: px(waterAt(k) + (r2 - 0.35) * 0.05 * k),
                    width: px((0.045 + 0.075 * r3) * k),
                    height: `max(1.5px, ${px(0.0045 * k)})`,
                    animationDuration: `${(4.2 + 3.2 * r2).toFixed(2)}s`,
                    animationDelay: `${(-r1 * 7.4).toFixed(2)}s`,
                  }}
                />
              )
            })}
          </Plane>
        )
      })}
    </>
  )
}

type BoatId = 'rowboat' | 'sailboat' | 'waterdrone'
/** Veneet järvellä: syvyys k, reitti maailman kohdasta x kohtaan to ja takaisin (kesto s), korkeus kohteiden
    mittakaavassa (h), keinunnan jakso (rock s). Vesidrone on Clausin oma suunnitteilla oleva hanke. */
const VOYAGES: { boat: BoatId; k: number; x: number; to: number; h: number; dur: number; delay: number; rock: number }[] = [
  { boat: 'sailboat', k: 0.42, x: 1.1, to: 5.3, h: 0.42, dur: 160, delay: -38, rock: 6.4 },
  { boat: 'rowboat', k: 0.7, x: 2.5, to: 4.2, h: 0.085, dur: 120, delay: -24, rock: 4.1 },
  { boat: 'waterdrone', k: 0.86, x: 6.8, to: 10.5, h: 0.072, dur: 64, delay: -14, rock: 2.9 },
  { boat: 'sailboat', k: 0.5, x: 7.6, to: 11.4, h: 0.42, dur: 180, delay: -110, rock: 7.2 },
]

function Boats({ night }: { night?: boolean }) {
  return (
    <>
      {VOYAGES.map((v, i) => {
        const a = gameArt[v.boat]
        const src = night ? a.night : a.day
        const h = v.h * v.k
        const w = h * a.ar
        const x0 = atDepth(v.x, v.k)
        const x1 = atDepth(v.to, v.k)
        // kuinka syvällä runko on (osuus kuvan korkeudesta): purjeveneen kuvassa on korkea masto
        const sink = v.boat === 'sailboat' ? 0.05 : 0.16
        const style: Vars = {
          left: px(x0 - w / 2),
          top: px(waterAt(v.k) - h * (1 - sink)),
          width: px(w),
          height: px(h),
          '--d': (x1 - x0).toFixed(3),
          animationDuration: `${v.dur}s`,
          animationDelay: `${v.delay}s`,
        }
        return (
          <Plane key={i} k={v.k}>
            <div className="fl-voyage absolute" style={style}>
              {v.boat === 'waterdrone' && (
                <svg className="fl-wake absolute" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
                  <path d="M100 12 L0 4 M100 13 L0 19" />
                </svg>
              )}
              <div className="fl-rock size-full" style={{ animationDuration: `${v.rock}s` }}>
                <img src={src} alt="" draggable={false} decoding="async" className="block size-full select-none" />
                <img src={src} alt="" aria-hidden draggable={false} decoding="async" className="fl-boat-echo absolute left-0 w-full select-none" style={{ top: `${(1 - sink) * 100}%`, height: '100%' }} />
              </div>
            </div>
          </Plane>
        )
      })}
    </>
  )
}

/** Kalat hyppäävät välillä (renkaat vedessä hypyn alussa ja lopussa) */
const FISH_X = [1.45, 2.8, 4.35, 5.5, 8.1, 9.55, 10.8]

function Fish() {
  const k = 1.05
  return (
    <Plane k={k}>
      {FISH_X.map((x, i) => {
        const r = hash(i, 3)
        const style: Vars = {
          left: px(atDepth(x, k)),
          top: px(waterAt(k) + 0.012),
          '--fd': `${(9 + 7 * r).toFixed(1)}s`,
          '--fdl': `${(-r * 15).toFixed(1)}s`,
          '--fs': i % 2 ? -1 : 1,
        }
        return (
          <div key={i} className="fl-fishspot absolute" style={style}>
            <span className="fl-ring fl-ring-a" />
            <span className="fl-ring fl-ring-b" />
            <div className="fl-fish-arc">
              <svg className="fl-fish" viewBox="0 0 40 16" aria-hidden>
                <path d="M2 8 Q12 1 26 6 L36 2 L33 8 L36 14 L26 10 Q12 15 2 8 Z" />
              </svg>
            </div>
          </div>
        )
      })}
    </Plane>
  )
}

/** Sorsaemo ja poikaset uivat rannan tuntumassa */
const DUCKS: { x: number; to: number; dur: number; delay: number }[] = [
  { x: 2.45, to: 3.05, dur: 70, delay: -12 },
  { x: 8.95, to: 9.55, dur: 80, delay: -46 },
]
const DUCK = 'M4 16 Q6 9 16 10 L22 10 Q21 3 28 3 Q33 3 33 8 L38 9 L33 11 Q30 13 30 15 Q30 21 18 21 Q8 21 4 16 Z'

function Ducks() {
  const k = 1.1
  return (
    <Plane k={k}>
      {DUCKS.map((d, i) => {
        const x0 = atDepth(d.x, k)
        const style: Vars = {
          left: px(x0),
          top: px(waterAt(k) - 0.032),
          width: px(0.15),
          height: px(0.04),
          '--d': (atDepth(d.to, k) - x0).toFixed(3),
          animationDuration: `${d.dur}s`,
          animationDelay: `${d.delay}s`,
        }
        return (
          <div key={i} className="fl-voyage absolute" style={style}>
            {[
              [0.6, 1, 0],
              [0.3, 0.58, 0.4],
              [0.06, 0.52, 0.9],
            ].map(([l, s, dl], j) => (
              <div key={j} className="fl-duck absolute bottom-0" style={{ left: `${l * 100}%`, width: `${s * 34}%`, animationDelay: `${dl}s` }}>
                <svg viewBox="0 0 40 24" className="block w-full overflow-visible" aria-hidden>
                  <path d={DUCK} />
                </svg>
                <span className="fl-ring fl-ring-duck" style={{ animationDelay: `${dl * 2}s` }} />
              </div>
            ))}
          </div>
        )
      })}
    </Plane>
  )
}

/* ---------------- kohteet ---------------- */

/** Valo kohteessa: lyhty, lamppu, nuotio tai majakan valokeila */
function StationLights({ st, night }: { st: StationDef; night?: boolean }) {
  if (!st.lights) return null
  return (
    <>
      {st.lights.map((l, i) => {
        if (l.kind === 'fire')
          return (
            <span
              key={i}
              className="fl-fire absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${l.x * 100}%`, top: `${l.y * 100}%`, width: px(night ? 0.34 : 0.2) }}
            />
          )
        if (!night) return null
        if (l.kind === 'beam')
          return (
            <span key={i} className="fl-beam-pivot absolute" style={{ left: `${l.x * 100}%`, top: `${l.y * 100}%` }}>
              <span className="fl-beam absolute top-0 left-0" style={{ width: px(1.5), height: px(0.12) }} />
              <span className="fl-lamp absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: px(0.16) }} />
            </span>
          )
        return (
          <span
            key={i}
            className="fl-lamp absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${l.x * 100}%`, top: `${l.y * 100}%`, width: px(0.14) }}
          />
        )
      })}
    </>
  )
}

/** Savupiiput (osuus kuvasta): saunan kiuas ja työpajan kamina */
const SMOKE: Partial<Record<FlightStation, [number, number]>> = { sauna: [0.4375, 0.404], workshop: [0.652, 0.143] }

/** Tulikärpäset nuotion ympärillä yöllä: [dx, dy (H), liike px, kesto s, viive s] */
const FLIES: [number, number, number, number, number, number][] = [
  [-0.32, -0.05, 14, -10, 7, 0],
  [-0.18, -0.16, -12, -16, 8.4, -2.6],
  [0.12, -0.2, 18, 8, 7.6, -1.2],
  [0.3, -0.08, -16, -12, 6.6, -4.1],
  [0.42, -0.22, 10, -18, 9.2, -3.3],
]

function StationFx({ st, night }: { st: StationDef; night?: boolean }) {
  const smoke = SMOKE[st.id]
  return (
    <>
      {smoke &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="fl-smoke absolute aspect-square rounded-full"
            style={{ left: `${smoke[0] * 100}%`, top: `${smoke[1] * 100}%`, width: px(0.03), animationDelay: `${i * 2.3}s` }}
          />
        ))}
      {st.id === 'campfire' &&
        Array.from({ length: 7 }, (_, i) => {
          const style: Vars = {
            left: `${50.5 + (hash(i, 1) - 0.5) * 5}%`,
            top: '69%',
            width: px(0.007),
            '--sx': px((hash(i, 2) - 0.5) * 0.09),
            animationDuration: `${(1.9 + hash(i, 3) * 1.5).toFixed(2)}s`,
            animationDelay: `${(-i * 0.47).toFixed(2)}s`,
          }
          return <span key={i} className="fl-spark absolute aspect-square rounded-full" style={style} />
        })}
      {night && st.id === 'campfire' && (
        <div className="absolute left-1/2 top-[70%]">
          {FLIES.map(([dx, dy, fx, fy, d, dl], i) => (
            <span
              key={i}
              className="fl-fly absolute aspect-square w-[3px] rounded-full bg-[#eaffa6] shadow-[0_0_6px_2px_rgba(205,255,120,0.55)]"
              style={{ left: px(dx), top: px(dy), ['--fx' as string]: `${fx}px`, ['--fy' as string]: `${fy}px`, ['--fd' as string]: `${d}s`, ['--fdl' as string]: `${dl}s` }}
            />
          ))}
        </div>
      )}
    </>
  )
}

/** Liehuva siniristilippu sataman salossa: polkujen muodot lasketaan kerran (kulkeva aalto, vapaa pää lepattaa)
    ja niiden välillä interpoloidaan SMILillä – sileä liike kaikissa selaimissa, ei sivun piirtoa JavaScriptillä. */
const FLAG = (() => {
  const W = 180
  const Hh = 110
  const N = 10
  const disp = (x: number, ph: number) => {
    const u = x / W
    return 8 * u ** 1.1 * Math.sin(2 * Math.PI * (u * 1.15 - ph)) + 2.6 * u * Math.sin(2 * Math.PI * (u * 2.3 - 2 * ph))
  }
  const sx = (x: number, ph: number) => x * (1 - 0.06 * (x / W) ** 2 * (1 + 0.5 * Math.sin(2 * Math.PI * ph)))
  const band = (xa: number, xb: number, y0: number, y1: number, ph: number, n: number) => {
    const top: string[] = []
    const bot: string[] = []
    for (let i = 0; i <= n; i++) {
      const x = xa + ((xb - xa) * i) / n
      top.push(`${sx(x, ph).toFixed(1)} ${(y0 + disp(x, ph)).toFixed(1)}`)
      bot.push(`${sx(x, ph).toFixed(1)} ${(y1 + disp(x, ph)).toFixed(1)}`)
    }
    return `M${top.join('L')}L${bot.reverse().join('L')}Z`
  }
  const make = (xa: number, xb: number, y0: number, y1: number, n: number) => ({
    d: band(xa, xb, y0, y1, 0, n),
    values: Array.from({ length: N + 1 }, (_, f) => band(xa, xb, y0, y1, f / N, n)).join(';'),
  })
  // Suomen lippu 18 × 11: ristin leveys 3, pystyosa x 5–8, vaakaosa y 4–7
  return { cloth: make(0, W, 0, Hh, 12), h: make(0, W, 40, 70, 12), v: make(50, 80, 0, Hh, 3), wave: W / 1.15 }
})()

function Morph({ shape, className, fill }: { shape: { d: string; values: string }; className?: string; fill?: string }) {
  return (
    <path className={className} d={shape.d} fill={fill}>
      <animate attributeName="d" dur="1.5s" repeatCount="indefinite" values={shape.values} />
    </path>
  )
}

function HarborFlag() {
  const id = useId().replace(/:/g, '')
  return (
    <svg className="fl-flag absolute overflow-visible" viewBox="0 0 180 110" style={{ left: '11.9%', top: '19.4%', width: '18.6%' }} aria-hidden>
      <defs>
        <linearGradient id={`fold${id}`} gradientUnits="userSpaceOnUse" x1="0" x2={FLAG.wave} y1="0" y2="0" spreadMethod="repeat">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0.2" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
          <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to={`${FLAG.wave} 0`} dur="1.5s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      <Morph shape={FLAG.cloth} className="fl-flag-cloth" />
      <Morph shape={FLAG.h} className="fl-flag-cross" />
      <Morph shape={FLAG.v} className="fl-flag-cross" />
      <Morph shape={FLAG.cloth} fill={`url(#fold${id})`} />
    </svg>
  )
}

/** Kohteen kuva. Satama on kerroksina: keinuva vene laiturin takana, liehuva lippu ja laituri. mirror = heijastus. */
function StationArt({ st, night, onPick, mirror }: { st: StationDef; night?: boolean; onPick?: (id: FlightStation) => void; mirror?: boolean }) {
  const onClick = mirror || !onPick ? undefined : () => onPick(st.id)
  const cls = cn('absolute inset-0 size-full max-w-none select-none', !mirror && 'cursor-pointer')
  const img = (src: string, extra?: string, style?: CSSProperties) => (
    <img src={src} alt="" aria-hidden={mirror || undefined} draggable={false} decoding="async" className={cn(cls, extra)} style={style} onClick={onClick} />
  )
  if (st.id === 'harbor') {
    const boat = night ? gameArt.harborBoat.night : gameArt.harborBoat.day
    const pier = night ? gameArt.harborPier.night : gameArt.harborPier.day
    return (
      <>
        {img(boat, 'fl-moor', { transformOrigin: '77.8% 86%' })}
        <HarborFlag />
        {img(pier)}
      </>
    )
  }
  return img(night ? gameArt[st.id].night : gameArt[st.id].day)
}

function Stations({ night, onPick }: { night?: boolean; onPick: (id: FlightStation) => void }) {
  return (
    <div className="fl-plane absolute left-0 bottom-0" data-k={1} style={{ height: px(1), width: px(WORLD) }}>
      {STATIONS.map((st) => {
        const w = st.h * st.ar
        const box: CSSProperties = { left: px(st.x - w / 2), width: px(w), height: px(st.h) }
        return (
          <div key={st.id}>
            {/* heijastus: peilattu kohde vesirajan alla, vesi rikkoo sen juoviksi ja huojuttaa */}
            <div className="fl-reflect absolute" style={{ ...box, top: px(WATER) }} aria-hidden>
              <div className="fl-reflect-flip absolute inset-0">
                <StationArt st={st} night={night} mirror />
              </div>
            </div>
            <div className="fl-station absolute" style={{ ...box, top: px(WATER - st.h) }}>
              <div className="fl-art absolute inset-0">
                <StationArt st={st} night={night} onPick={onPick} />
              </div>
              <StationLights st={st} night={night} />
              <StationFx st={st} night={night} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Maisema dronen takana: taivas, vaarat, järvi aaltoineen ja veneineen, kohteet, kalat ja sorsat */
export function Backdrop({ night, onPick }: { night?: boolean; onPick: (id: FlightStation) => void }) {
  const L = night ? heroNight : heroScene
  const forest = night ? gameArt.forest.night : gameArt.forest.day
  return (
    <>
      {!night && <Clouds />}
      {!night && <Sun />}
      {!night && <Birds />}
      <Strip k={0.05} src={L.far.src} srcSet={L.far.srcSet} sizes="206vh" ar={TILE} h={1} bottom={0} />
      <Lake night={night} />
      {/* kaukainen vastaranta */}
      <Strip k={0.16} src={forest} ar={2688 / 616} h={0.075} bottom={1 - 0.188} className="opacity-90" />
      <Waves ks={FAR_WAVES} />
      <Boats night={night} />
      <Stations night={night} onPick={onPick} />
      <Waves ks={NEAR_WAVES} />
      <Fish />
      <Ducks />
    </>
  )
}

/** Etualan metsä ja ranta dronen edessä */
export function Foreground({ night }: { night?: boolean }) {
  return (
    <>
      <Strip k={1.14} src={night ? gameArt.forest.night : gameArt.forest.day} ar={2688 / 616} h={0.23} bottom={-0.01} />
      <Strip k={1.4} src={night ? gameArt.shore.night : gameArt.shore.day} ar={2688 / 366} h={0.12} bottom={-0.015} />
    </>
  )
}

/* ---------------- vaarat ---------------- */

/** Lokin siipi (lähempi): ylhäällä → keskellä → alhaalla, interpoloidaan SMILillä */
const GULL_WING = ['M36 30 Q44 6 70 0 Q58 15 54 30 Z', 'M36 30 Q50 21 76 22 Q62 27 54 31 Z', 'M36 31 Q44 46 64 58 Q56 42 54 32 Z']
const flap = (f: string[]) => [f[0], f[1], f[2], f[1], f[0]].join(';')

/** Lokki sivulta, nokka oikealle */
export function Gull() {
  return (
    <svg viewBox="0 0 100 60" className="size-full overflow-visible" aria-hidden>
      <g transform="translate(7 -2)">
        <path className="fl-gull-far" d={GULL_WING[0]}>
          <animate attributeName="d" dur="0.56s" repeatCount="indefinite" values={flap(GULL_WING)} keyTimes="0;0.3;0.5;0.7;1" />
        </path>
      </g>
      <path className="fl-gull-body" d="M14 32 L3 27 L6 34 L14 35 Q28 41 50 39 Q66 38 76 34 L90 34 L80 30 Q74 26 66 27 Q46 26 30 29 Q20 30 14 32 Z" />
      <circle className="fl-gull-eye" cx="76" cy="30" r="1.6" />
      <path className="fl-gull-wing" d={GULL_WING[0]}>
        <animate attributeName="d" dur="0.56s" repeatCount="indefinite" values={flap(GULL_WING)} keyTimes="0;0.3;0.5;0.7;1" />
      </path>
    </svg>
  )
}

/** Lepakon vasen siipi kulmassa a (1 = ylhäällä, −1 = alhaalla); oikea siipi on peilikuva */
function batWing(a: number) {
  const ty = 24 - 20 * a
  const my = 26 - 9 * a
  const f = (v: number) => v.toFixed(1)
  return `M47 22 Q28 ${f(my - 9)} 5 ${f(ty)} Q13 ${f(ty + 6)} 15 ${f(ty + 12)} Q22 ${f(my + 2)} 27 ${f(my + 8)} Q34 ${f(my + 4)} 38 ${f(my + 10)} Q43 ${f(my + 8)} 47 31 Z`
}
const BAT = [1, 0.25, -0.8, 0.25, 1].map(batWing).join(';')

/** Lepakko edestä, siivet räpyttävät nopeasti */
export function Bat() {
  const wing = (
    <path d={batWing(1)}>
      <animate attributeName="d" dur="0.32s" repeatCount="indefinite" values={BAT} />
    </path>
  )
  return (
    <svg viewBox="0 0 100 50" className="fl-bat-svg size-full overflow-visible" aria-hidden>
      {wing}
      <g transform="matrix(-1 0 0 1 100 0)">{wing}</g>
      <ellipse cx="50" cy="27" rx="6" ry="9" />
      <path d="M45 20 L45.5 12 L49 18 Z M55 20 L54.5 12 L51 18 Z" />
    </svg>
  )
}
