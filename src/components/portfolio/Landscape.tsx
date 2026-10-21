import { useEffect, useMemo, useRef, type ReactNode } from 'react'

import { useReducedMotion } from './hooks'

/* Normaalin portfolion hero-maisema: oma, koodilla piirretty suomalainen järvi- ja tunturimaisema
   auringonlaskun sävyissä – kerrokselliset harjanteet, järvi ja auringon heijastus, rannan mökki,
   kuusimetsä ja leijuva drone. Kerrokset liikkuvat eri tahtiin vierittäessä ja hiiren mukana. */

const W = 1600
const H = 520

/** Toistettava satunnaisluku (sama maisema joka kerta) */
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

/** Harjanteen korkeus x:n kohdalla: pyöreähköjä tuntureita (pitkä aalto) + pientä rosoa */
function ridgeFn(seed: number, base: number, amp: number, rough = 1) {
  const r = rng(seed)
  const p = [r() * 6.28, r() * 6.28, r() * 6.28]
  const f = [210 + r() * 120, 80 + r() * 40, 31 + r() * 12]
  return (x: number) =>
    base - amp * (0.58 * Math.sin(x / f[0] + p[0]) + 0.3 * Math.sin(x / f[1] + p[1]) + 0.12 * rough * Math.sin(x / f[2] + p[2]))
}

function ridgePath(y: (x: number) => number, x0 = 0, x1 = W, step = 16) {
  let d = `M${x0} ${H} L${x0} ${y(x0).toFixed(1)}`
  for (let x = x0 + step; x <= x1; x += step) d += ` L${x} ${y(x).toFixed(1)}`
  return `${d} L${x1} ${H} Z`
}

/** Kerroksellinen kuusi */
function pine(x: number, by: number, h: number) {
  const w = h * 0.36
  let d = ''
  for (let i = 0; i < 3; i++) {
    const top = by - h + i * h * 0.24
    const bot = top + h * 0.42
    const half = w * (0.5 + i * 0.26)
    d += `M${x.toFixed(1)} ${top.toFixed(1)} L${(x + half).toFixed(1)} ${bot.toFixed(1)} L${(x - half).toFixed(1)} ${bot.toFixed(1)} Z`
  }
  return d + `M${(x - h * 0.03).toFixed(1)} ${(by - h * 0.12).toFixed(1)} h${(h * 0.06).toFixed(1)} V${by + 2} h${(-h * 0.06).toFixed(1)} Z`
}

/** Metsärivi: kuusia välillä x0–x1 maanpinnan y(x) mukaan */
function forest(seed: number, y: (x: number) => number, x0: number, x1: number, gap: [number, number], hmin: number, hmax: number, density = 1) {
  const r = rng(seed)
  let d = ''
  for (let x = x0; x < x1; ) {
    d += pine(x, y(x) + 6, hmin + r() * (hmax - hmin))
    x += (gap[0] + r() * (gap[1] - gap[0])) / density
  }
  return d
}

function Layer({ k, dx = 0, children }: { k: number; dx?: number; children: ReactNode }) {
  return <g style={{ transform: `translate3d(calc(var(--mx, 0) * ${dx}px), calc(var(--sy, 0) * ${k}px), 0)`, willChange: 'transform' }}>{children}</g>
}

export function Landscape({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const art = useMemo(() => {
    const far = ridgeFn(11, 205, 46, 0.6)
    const mid = ridgeFn(23, 252, 54, 0.9)
    const near = ridgeFn(37, 298, 40, 1)
    const shoreL = (x: number) => 352 - 34 * Math.max(0, 1 - x / 760) - 6 * Math.sin(x / 47)
    const shoreR = (x: number) => 350 - 30 * Math.max(0, (x - 1080) / 520) - 5 * Math.sin(x / 53)
    const band = ridgeFn(51, 430, 10, 1)
    const front = ridgeFn(67, 492, 8, 1)
    return {
      far: ridgePath(far),
      mid: ridgePath(mid),
      near: ridgePath(near),
      nearTrees: forest(5, near, 0, W, [16, 34], 14, 26, 0.9),
      shoreL: ridgePath(shoreL, 0, 760),
      shoreR: ridgePath(shoreR, 1080, W),
      shoreTrees: forest(7, shoreL, 0, 600, [12, 22], 22, 42) + forest(8, shoreR, 1120, W, [12, 22], 22, 44),
      band: ridgePath(band),
      bandTrees: forest(9, band, -10, W + 10, [14, 26], 46, 92),
      front: ridgePath(front),
      frontTrees: forest(13, front, -20, 520, [20, 34], 90, 160) + forest(14, front, 1120, W + 20, [20, 34], 90, 170),
      cabinY: shoreL(640),
    }
  }, [])

  // Parallaksi: vieritys (--sy) ja osoitin (--mx), vain näkyvissä ja ilman vähennettyä liikettä
  useEffect(() => {
    const el = root.current
    if (!el || reduce) return
    let raf = 0
    let sy = 0
    let mx = 0
    const apply = () => {
      raf = 0
      el.style.setProperty('--sy', String(sy))
      el.style.setProperty('--mx', mx.toFixed(3))
    }
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const onScroll = () => {
      sy = Math.min(window.scrollY, 1000)
      queue()
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mx = (e.clientX / window.innerWidth) * 2 - 1
      queue()
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduce])

  const sun = { x: 900, y: 238 }
  return (
    <div ref={root} className={className} aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="block size-full">
        <defs>
          <radialGradient id="pf-glow">
            <stop offset="0%" stopColor="#ffe08a" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ffc163" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffc163" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pf-lake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f9ad66" />
            <stop offset="100%" stopColor="#e5643f" />
          </linearGradient>
          <linearGradient id="pf-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde2cf" stopOpacity="0" />
            <stop offset="100%" stopColor="#fde2cf" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        <Layer k={0.16} dx={-3}>
          <circle cx={sun.x} cy={sun.y} r={240} fill="url(#pf-glow)" />
          <circle cx={sun.x} cy={sun.y} r={66} fill="var(--pf-sun)" />
        </Layer>

        <Layer k={0.13} dx={-4}>
          <path d={art.far} fill="#f8ab80" />
          <path d={art.far} fill="url(#pf-haze)" />
        </Layer>
        <Layer k={0.1} dx={-6}>
          <path d={art.mid} fill="var(--pf-amber)" />
        </Layer>
        <Layer k={0.075} dx={-8}>
          <path d={art.near} fill="var(--pf-orange)" />
          <path d={art.nearTrees} fill="#e8613c" />
        </Layer>

        {/* järvi ja auringon heijastus */}
        <Layer k={0.055} dx={-9}>
          <rect x={0} y={322} width={W} height={H - 322} fill="url(#pf-lake)" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect
              key={i}
              className="shimmer"
              style={{ animationDelay: `${i * 0.37}s` }}
              x={sun.x - (60 - i * 7)}
              y={334 + i * 8}
              width={(60 - i * 7) * 2}
              height={2.4}
              rx={1.2}
              fill="#ffe08a"
            />
          ))}
        </Layer>

        <Layer k={0.045} dx={-10}>
          <path d={art.shoreL} fill="var(--pf-red)" />
          <path d={art.shoreR} fill="var(--pf-red)" />
          <path d={art.shoreTrees} fill="#c93c40" />
          {/* mökki/työpaja rannalla, ikkunassa valo */}
          <g transform={`translate(640 ${art.cabinY - 2})`}>
            <path d="M-20 0 V-18 L0 -32 L20 -18 V0 Z" fill="var(--pf-deep)" />
            <rect x={-12} y={-15} width={8} height={7} fill="var(--pf-sun)" />
            <rect x={5} y={-26} width={4} height={10} fill="var(--pf-deep)" />
          </g>
        </Layer>

        <Layer k={0.025} dx={-12}>
          <path d={art.band} fill="var(--pf-crimson)" />
          <path d={art.bandTrees} fill="var(--pf-crimson)" />
        </Layer>
        <Layer k={0.01} dx={-15}>
          <path d={art.front} fill="var(--pf-plum)" />
          <path d={art.frontTrees} fill="var(--pf-plum)" />
        </Layer>
        <path d={`M0 ${H} L0 506 Q400 498 800 504 T${W} 500 L${W} ${H} Z`} fill="var(--pf-bg)" />

        {/* leijuva drone */}
        <Layer k={-0.12} dx={10}>
          <g transform="translate(985 176)">
            <g className="drone">
              <path d="M-34 -3 H34" stroke="var(--pf-deep)" strokeWidth={3} strokeLinecap="round" />
              <ellipse cx={-34} cy={-7} rx={14} ry={2.2} fill="var(--pf-deep)" opacity={0.75} />
              <ellipse cx={34} cy={-7} rx={14} ry={2.2} fill="var(--pf-deep)" opacity={0.75} />
              <rect x={-36} y={-7} width={4} height={6} fill="var(--pf-deep)" />
              <rect x={32} y={-7} width={4} height={6} fill="var(--pf-deep)" />
              <path d="M-12 -6 H12 L9 6 H-9 Z" fill="var(--pf-deep)" />
              <path d="M-7 6 L-11 13 M7 6 L11 13" stroke="var(--pf-deep)" strokeWidth={2} strokeLinecap="round" />
              <circle cx={0} cy={8} r={2.6} fill="var(--pf-deep)" />
              <circle className="blink" cx={-34} cy={-1} r={2} fill="#ff5b4a" />
              <circle className="blink-2" cx={34} cy={-1} r={2} fill="#7dff9a" />
            </g>
          </g>
        </Layer>
      </svg>
    </div>
  )
}

/** Matala vuoristosiluetti (alatunniste) */
export function Ridgeline({ className }: { className?: string }) {
  const art = useMemo(() => {
    const a = ridgeFn(71, 120, 34, 0.7)
    const b = ridgeFn(83, 150, 28, 1)
    const c = ridgeFn(97, 176, 12, 1)
    const H2 = 220
    const p = (y: (x: number) => number) => {
      let d = `M0 ${H2} L0 ${y(0).toFixed(1)}`
      for (let x = 16; x <= W; x += 16) d += ` L${x} ${y(x).toFixed(1)}`
      return `${d} L${W} ${H2} Z`
    }
    return { a: p(a), b: p(b), c: p(c), trees: forest(19, c, -10, W + 10, [14, 28], 30, 64) }
  }, [])
  return (
    <svg viewBox={`0 0 ${W} 220`} preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <path d={art.a} fill="var(--pf-crimson)" opacity={0.55} />
      <path d={art.b} fill="var(--pf-plum)" opacity={0.8} />
      <path d={art.c} fill="var(--pf-bg-3)" />
      <path d={art.trees} fill="var(--pf-bg-3)" />
    </svg>
  )
}
