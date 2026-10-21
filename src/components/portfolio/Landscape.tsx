import { useEffect, useMemo, useRef, type ReactNode } from 'react'

import { heroScene } from '@/content'
import { cn } from '@/lib/utils'
import { useReducedMotion } from './hooks'

/* Normaalin portfolion maisemat: hero-näkymä (Higgsfield-tasot + koodilla tehty elävöitys)
   ja alatunnisteen koodilla piirretty matala harjanne. */

const W = 1600

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

/* ---------- Hero-maisema ----------
   Higgsfieldillä tehty oma sommitelma (Järvi-Suomi auringonlaskussa, ei kopiota mistään pelistä),
   leikattu viideksi läpinäkyväksi syvyystasoksi. Koko näkymä skaalautuu yhtenä kappaleena:
   leveys = max(104 % heron leveydestä, 960 px), korkeus kuvasuhteesta – joten aurinko, savu, välke
   ja drone pysyvät aina samoissa kohdissa ja samassa mittakaavassa. Koodilla elävöitetty:
   auringon hehku, ohi lipuvat pilvijuovat, lintuparvi, järven välke, saunan savu ja lentävä drone.
   Parallaksi vierityksestä (--sy) ja osoittimesta (--mx); vähennetty liike → kaikki paikallaan. */

/** Syvyystaso: vieritys siirtää kauempia enemmän alas, osoitin lähempiä enemmän sivulle */
function Depth({ k, dx, className, children }: { k: number; dx: number; className?: string; children?: ReactNode }) {
  return (
    <div
      className={cn('absolute inset-0', className)}
      style={{ transform: `translate3d(calc(var(--mx, 0) * ${-dx}px), calc(var(--sy, 0) * ${k}px), 0)`, willChange: 'transform' }}
    >
      {children}
    </div>
  )
}

function LayerImg({ layer, priority }: { layer: { src: string; srcSet: string }; priority?: boolean }) {
  return (
    <img
      src={layer.src}
      srcSet={layer.srcSet}
      sizes={heroScene.sizes}
      width={heroScene.width}
      height={heroScene.height}
      alt=""
      draggable={false}
      loading="eager"
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      className="absolute inset-0 size-full select-none"
    />
  )
}

/** Välkkeet auringon heijastuksessa (x, y, leveys % näkymästä) */
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

/** Pilvijuovat: [y %, leveys %, kesto s, viive s] */
const CLOUDS: [number, number, number, number][] = [
  [-10, 26, 170, -40],
  [-3.5, 34, 210, -130],
  [3, 20, 150, -80],
]

function Drone() {
  return (
    <svg viewBox="-40 -16 80 32" className="drone block w-full overflow-visible" aria-hidden>
      <g fill="var(--pf-deep)">
        <path d="M-31 -4 H31" stroke="var(--pf-deep)" strokeWidth={3} strokeLinecap="round" />
        <ellipse className="hero-prop" cx={-31} cy={-8} rx={11} ry={1.8} opacity={0.7} />
        <ellipse className="hero-prop" style={{ animationDelay: '-0.05s' }} cx={31} cy={-8} rx={11} ry={1.8} opacity={0.7} />
        <rect x={-33} y={-8} width={4} height={6} rx={1} />
        <rect x={29} y={-8} width={4} height={6} rx={1} />
        <path d="M-11 -7 H11 L8 5 H-8 Z" />
        <path d="M-7 5 L-11 12 M7 5 L11 12" stroke="var(--pf-deep)" strokeWidth={2} strokeLinecap="round" />
        <circle cx={0} cy={7} r={2.6} />
      </g>
      <circle className="blink" cx={-31} cy={-2} r={1.8} fill="#ff5b4a" />
      <circle className="blink-2" cx={31} cy={-2} r={1.8} fill="#7dff9a" />
    </svg>
  )
}

function Bird({ x, y, s, d }: { x: number; y: number; s: number; d: number }) {
  return (
    <svg
      viewBox="0 0 20 8"
      className="absolute overflow-visible"
      style={{ left: `${x}%`, top: `${y}%`, width: `${s}%` }}
      aria-hidden
    >
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

export function HeroScene({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  // Parallaksi + animaatioiden tauko, kun hero ei ole näkyvissä
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-off', !e.isIntersecting))
    io.observe(el)
    if (reduce) return () => io.disconnect()
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
      sy = Math.min(window.scrollY, 1200)
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
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduce])

  return (
    <div
      ref={root}
      aria-hidden
      className={cn(
        'hero-scene pointer-events-none absolute bottom-0 left-1/2 aspect-[3840/1118] w-[max(104cqw,960px)] -translate-x-[58%] md:-translate-x-1/2',
        className,
      )}
    >
      {/* aurinko, hehku ja pilvijuovat */}
      <Depth k={0.34} dx={2}>
        <div className="hero-glow absolute left-[61.8%] top-[9%] aspect-square w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,232,170,0.7)_0%,rgba(255,210,140,0.42)_16%,rgba(255,190,120,0.16)_40%,rgba(255,190,120,0)_66%)]" />
        <div className="absolute left-[61.8%] top-[9.1%] aspect-square w-[5.4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_42%_38%,#fff2bf,#ffd977_58%,#ffc457)] shadow-[0_0_28px_6px_rgba(255,200,100,0.45)]" />
        {CLOUDS.map(([y, w, dur, delay], i) => (
          <div
            key={i}
            className="hero-cloud absolute inset-x-0 min-h-[3px]"
            style={{ top: `${y}%`, height: `${1.6 + (i % 2) * 0.8}%`, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
          >
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,244,228,0.6)_25%,rgba(255,236,214,0.5)_70%,transparent)] blur-[3px]"
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </Depth>

      <Depth k={0.24} dx={4}>
        <LayerImg layer={heroScene.far} priority />
      </Depth>

      {/* järvi + niemi, sauna ja saari liikkuvat yhdessä (sama vedenpinta) */}
      <Depth k={0.15} dx={7}>
        <LayerImg layer={heroScene.lake} priority />
        {GLINTS.map(([x, y, w], i) => (
          <span
            key={i}
            className="hero-glint absolute h-[0.28%] min-h-[2px] -translate-x-1/2 rounded-full bg-[#fff0c0]"
            style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, animationDelay: `${(i * 0.53) % 2.6}s` }}
          />
        ))}
        <LayerImg layer={heroScene.mid} />
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="hero-smoke absolute left-[21.35%] top-[35.2%] aspect-square w-[0.45%] min-w-[3px] -translate-x-1/2 -translate-y-full rounded-full bg-[#fde6d4] blur-[1.5px]"
            style={{ animationDelay: `${i * 2.2}s` }}
          />
        ))}
      </Depth>

      {/* lintuparvi lentää hitaasti taivaan poikki */}
      <Depth k={0.2} dx={-5}>
        <div className="hero-flock absolute inset-0">
          <Bird x={30} y={-16} s={1.1} d={0} />
          <Bird x={31.6} y={-13.5} s={0.9} d={0.2} />
          <Bird x={29.2} y={-11} s={0.8} d={0.35} />
          <Bird x={33.2} y={-18.5} s={0.75} d={0.1} />
          <Bird x={27.8} y={-14.2} s={0.7} d={0.45} />
        </div>
      </Depth>

      {/* drone kiertelee järven yllä */}
      <Depth k={0.12} dx={8}>
        <div className="hero-fly absolute inset-0">
          <div className="hero-tilt absolute left-[67%] top-[24%] w-[clamp(34px,3.4%,84px)]">
            <Drone />
          </div>
        </div>
      </Depth>

      <Depth k={0.07} dx={12}>
        <LayerImg layer={heroScene.near} />
      </Depth>
      <Depth k={0} dx={18}>
        <LayerImg layer={heroScene.front} />
      </Depth>
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
