import { useId, useMemo } from 'react'

/* Aloitusruudun taivas: päivän persikkaliukuväri (sama kuin normaalin portfolion herossa) ja sen päälle
   häivytettävä revontuliyö – tähdet, kuunsirppi, kaksi revontuliverhoa ja harvakseltaan tähdenlento.
   Kaikki on staattista SVG:tä / CSS:ää: verhot rasteroidaan kerran ja niitä liikutetaan vain transformilla.
   Näkyvyys tulee .start[data-night] -säännöistä (index.css). */

/** Toistettava satunnaisluku (sama taivas joka kerta) */
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Star = { x: number; y: number; s: number; o: number; t: number; d: number }

/** Tuikeryhmät: [kesto s, viive s] */
const GROUPS: [number, number][] = [
  [3.1, 0],
  [4.7, -1.3],
  [5.9, -2.9],
  [7.3, -0.6],
]

function makeStars(n: number): Star[] {
  const r = rng(7)
  return Array.from({ length: n }, () => {
    const big = r() < 0.12
    return {
      x: r() * 100,
      y: Math.pow(r(), 1.35) * 68, // tiheämpi ylhäällä
      s: big ? 2 + r() * 0.8 : 1 + r() * 0.8,
      o: big ? 0.95 : 0.35 + r() * 0.5,
      t: 2.5 + r() * 5,
      d: -r() * 6,
    }
  })
}

/** Revontuliverho: pystysuoria säteitä aaltoilevan alareunan varaan (viewBox 1600 × 700) */
function curtain(seed: number, o: { x0: number; x1: number; y0: number; amp: number; hMin: number; hMax: number }) {
  const r = rng(seed)
  const p = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28]
  const rays: { x: number; y: number; h: number; op: number }[] = []
  for (let x = o.x0; x <= o.x1; x += 5) {
    const u = (x - o.x0) / (o.x1 - o.x0)
    const env = Math.pow(Math.sin(Math.PI * u), 0.8)
    const base = o.y0 + o.amp * (0.62 * Math.sin(x / 240 + p[0]) + 0.38 * Math.sin(x / 92 + p[1]))
    const n = 0.5 + 0.5 * Math.sin(x / 37 + p[2]) * Math.sin(x / 13 + p[3])
    const h = (o.hMin + (o.hMax - o.hMin) * n) * (0.45 + 0.55 * env)
    rays.push({ x, y: base - h, h: h + 10, op: env * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(x / 21 + p[1] * 3))) })
  }
  return rays
}

function Curtain({ seed, opts, colors, className }: { seed: number; opts: Parameters<typeof curtain>[1]; colors: [string, string, string]; className?: string }) {
  const id = `au-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const rays = useMemo(() => curtain(seed, opts), [seed, opts])
  const [top, mid, edge] = colors
  const g = (
    <g fill={`url(#${id}-g)`}>
      {rays.map((ray, i) => (
        <rect key={i} x={ray.x} y={ray.y} width={6} height={ray.h} opacity={ray.op.toFixed(3)} />
      ))}
    </g>
  )
  return (
    <div className={`st-curtain ${className ?? ''}`}>
      <svg viewBox="0 0 1600 700" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <defs>
          {/* jokaisella säteellä oma pystyliukuväri: kirkas alareuna, häipyy ylös violettiin */}
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={top} stopOpacity="0" />
            <stop offset="0.4" stopColor={top} stopOpacity="0.22" />
            <stop offset="0.74" stopColor={mid} stopOpacity="0.6" />
            <stop offset="0.93" stopColor={edge} stopOpacity="0.95" />
            <stop offset="1" stopColor={edge} stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-soft`} x="-5%" y="-20%" width="110%" height="140%">
            <feGaussianBlur stdDeviation="3 6" />
          </filter>
          <filter id={`${id}-glow`} x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        <g filter={`url(#${id}-glow)`} opacity="0.65">
          {g}
        </g>
        <g filter={`url(#${id}-soft)`}>{g}</g>
      </svg>
    </div>
  )
}

const CURTAIN_A = { x0: 420, x1: 1560, y0: 360, amp: 70, hMin: 120, hMax: 300 }
const CURTAIN_B = { x0: 20, x1: 980, y0: 250, amp: 55, hMin: 90, hMax: 220 }

function Moon() {
  const id = `moon-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg viewBox="0 0 40 40" className="st-moon absolute right-[13%] top-[12%] w-[clamp(22px,2.6vw,40px)] drop-shadow-[0_0_14px_rgba(230,240,255,0.55)]">
      <defs>
        <mask id={id}>
          <rect width="40" height="40" fill="#fff" />
          <circle cx="27" cy="15" r="14.5" fill="#000" />
        </mask>
      </defs>
      <circle cx="20" cy="20" r="16" fill="#f3f0de" mask={`url(#${id})`} />
    </svg>
  )
}

export function StartSky() {
  const stars = useMemo(() => makeStars(120), [])
  return (
    // isolate: revontulien screen-sekoitus rajautuu taivaaseen (maisema piirretään sen päälle joka tapauksessa).
    // Ilman sitä selain yhdistää koko näkymän välipintaan joka ruudussa – myös päivällä, kun revontulet ovat piilossa.
    <div aria-hidden className="pointer-events-none absolute inset-0 isolate overflow-hidden">
      <div className="st-day absolute inset-0" />
      <div className="st-night-sky absolute inset-0" />
      {/* hämärä: violetti–roosa iltarusko vain siirtymän puolivälissä, ettei päivä ja yö sekoitu harmaaksi */}
      <div className="st-dusk absolute inset-0" />
      <div className="st-stars absolute inset-0">
        {GROUPS.map(([t, d], g) => (
          <div key={g} className="st-star-group" style={{ ['--t' as string]: `${t}s`, ['--dl' as string]: `${d}s` }}>
            {stars
              .filter((_, i) => i % GROUPS.length === g)
              .map((s, i) => (
                <span
                  key={i}
                  className="st-star"
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    width: s.s,
                    height: s.s,
                    boxShadow: s.s > 1.9 ? '0 0 6px 1px rgba(220,235,255,0.7)' : undefined,
                    ['--o' as string]: s.o,
                  }}
                />
              ))}
          </div>
        ))}
      </div>
      <Moon />
      <div className="st-aurora absolute inset-x-0 top-0 h-[66svh]">
        <Curtain seed={11} opts={CURTAIN_B} colors={['#8a7dff', '#4fd1c5', '#9dffd0']} className="st-curtain-b opacity-70" />
        <Curtain seed={5} opts={CURTAIN_A} colors={['#7a6cff', '#3fd0b8', '#b4ffd6']} />
      </div>
      <div className="st-shoot absolute inset-0">
        <span className="st-meteor left-[64%] top-[9%]" />
      </div>
    </div>
  )
}
