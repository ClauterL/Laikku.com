import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react'

import { cn } from '@/lib/utils'

/* Claus Laikun tunnus: kuvake ihmisestä läppärin takana (Higgsfieldillä piirretty, vektoroitu).
   Näytöllä <#>. Pääsiäismuna: #:n perään välähtää YKSI morsemerkki kerrallaan (piste tai viiva) kuin
   vilkkuva kursori – peräkkäin ne ovat · · ·  − −  · −  · − ·  − = SMART. Kirjaimia ei näytetä, eikä
   koko viestiä koskaan näy kerralla, joten morsetusta ei huomaa ellei sitä etsi. Merkit on leikattu
   kuvakkeesta läpi (maski), joten tausta näkyy niiden läpi kuten alkuperäisessä piktogrammissa.
   play: 'loop' toistaa itsestään (aloitusruutu), 'hover' kerran osoittimella / fokuksella / napautuksella. */

/** Kuvakkeen ääriviivat (viewBox 0 0 594 594) */
const PATH =
  'M262.0 573.0L103.5 572.5L98.8 569.7C90.9 565.1 86.0 556.9 86.0 548.5L86.0 544.0L297.1 544.0L508.3 544.0L507.7 549.4C506.6 560.1 499.4 569.4 490.1 572.0C485.2 573.4 446.3 573.6 262.0 573.0ZM136.4 529.7C136.2 529.0 136.1 488.4 136.2 439.5L136.5 350.5L138.8 346.4C140.1 344.2 143.0 341.1 145.3 339.7L149.4 337.0L296.8 337.0L444.2 337.0L448.2 339.2C450.4 340.5 453.3 343.3 454.6 345.6L457.0 349.7L457.0 440.3L457.0 531.0L297.0 531.0C168.1 531.0 136.8 530.8 136.4 529.7ZM102.0 499.9C92.9 496.0 83.9 492.3 81.9 491.5C71.3 487.6 61.4 479.8 56.6 471.6C53.3 466.0 51.0 457.7 51.0 451.4C51.0 446.7 57.2 419.6 69.1 372.5C79.3 332.3 87.3 307.4 93.5 296.8C99.0 287.3 112.7 272.8 121.7 266.8C145.5 250.9 181.7 235.0 209.1 228.6C214.6 227.3 214.7 227.3 218.1 230.1C224.8 235.8 236.8 243.9 243.6 247.3C283.3 267.3 331.2 263.3 366.5 237.0C370.9 233.8 375.6 230.3 376.8 229.4C379.9 227.1 385.9 228.3 406.0 234.9C423.8 240.8 438.7 247.4 456.9 257.5C473.3 266.6 482.2 273.4 490.7 283.2C502.1 296.5 507.0 307.1 515.8 338.0C525.1 370.7 543.0 445.2 543.0 451.2C543.0 464.4 534.0 479.8 522.5 486.6C518.9 488.7 487.5 502.0 477.8 505.5L474.1 506.9L473.8 426.2C473.5 345.7 473.5 345.5 471.3 340.8C467.0 331.4 456.4 322.5 447.1 320.5C445.3 320.1 377.1 319.8 295.5 319.8L147.3 319.8L141.2 322.5C134.0 325.7 126.0 333.6 122.7 340.7C120.5 345.5 120.5 345.5 120.2 426.2C120.1 470.7 119.6 507.0 119.2 506.9C118.8 506.9 111.1 503.7 102.0 499.9ZM281.5 234.3C264.5 231.9 242.9 222.2 229.0 210.7C192.6 180.6 179.5 128.7 197.7 86.0C211.1 54.5 235.7 32.8 268.6 23.3C281.3 19.7 305.2 18.9 319.0 21.8C372.0 32.7 408.5 81.9 403.9 136.3C399.2 192.3 351.9 235.6 296.3 234.9C289.8 234.8 283.1 234.5 281.5 234.3Z'

const SCREEN = { x: 136, y: 337, w: 321, h: 194 }
const CX = SCREEN.x + SCREEN.w / 2
const CY = SCREEN.y + SCREEN.h / 2
/** Fontti ja merkkien mitat */
const F = 86
const CW = F * 0.6
const DOT = 15
const DASH = 34
const BAR = 13
const SP = 12
/** Tila #:n ja >:n välissä, kun merkki välähtää */
const SLOT = SP + DASH + SP
const UNIT = 150

/** SMART morsena */
const MORSE = ['...', '--', '.-', '.-.', '-']
type Sym = '.' | '-' | null

/** Rytmi: [tila auki, näkyvä merkki, kesto yksikköinä] – piste 1, viiva 3, merkkien väli 1, kirjainväli 3 */
const STEPS: [boolean, Sym, number][] = (() => {
  const steps: [boolean, Sym, number][] = [[true, null, 2]]
  MORSE.forEach((letter) => {
    ;[...letter].forEach((c, ci) => {
      steps.push([true, c as Sym, c === '-' ? 3 : 1])
      steps.push([true, null, ci < letter.length - 1 ? 1 : 3])
    })
  })
  steps.push([true, null, 3])
  steps.push([false, null, 0])
  return steps
})()

function useReduced() {
  const [r, setR] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setR(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return r
}

export function Logo({
  play,
  className,
  style,
  label,
}: {
  play?: 'loop' | 'hover'
  className?: string
  style?: CSSProperties
  /** Saavutettava nimi; ilman sitä tunnus on koriste */
  label?: string
}) {
  const id = `logo-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const reduce = useReduced()
  const [state, setState] = useState<{ open: boolean; sym: Sym }>({ open: false, sym: null })
  const timer = useRef(0)
  const running = useRef(false)

  const run = useCallback(
    (loop: boolean, delay = 0) => {
      if (running.current) return
      running.current = true
      let i = 0
      const tick = () => {
        const [open, sym, dur] = STEPS[i]
        setState({ open, sym })
        i++
        if (i < STEPS.length) timer.current = window.setTimeout(tick, dur * UNIT)
        else if (loop) {
          i = 0
          timer.current = window.setTimeout(tick, 34 * UNIT) // tauko: pelkkä <#>
        } else running.current = false
      }
      timer.current = window.setTimeout(tick, delay)
    },
    [],
  )

  useEffect(() => {
    if (play === 'loop' && !reduce) run(true, 2200)
    return () => {
      window.clearTimeout(timer.current)
      running.current = false
    }
  }, [play, reduce, run])

  const trigger = () => {
    if (play === 'hover' && !reduce) run(false)
  }

  // asettelu: "<#" [merkki] ">" keskitettynä; tila avautuu ja sulkeutuu pehmeästi
  const W = CW * 3 + (state.open ? SLOT : 0)
  const move = { transition: 'transform 0.25s ease-out' }
  const font = { fontSize: F, fontWeight: 800, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }
  const slotX = -W / 2 + CW * 2 + SLOT / 2
  const glyphs = (
    <g transform={`translate(${CX} ${CY})`}>
      <g style={{ ...move, transform: `translateX(${-W / 2 + CW * 2}px)` }}>
        <text y={F * 0.35} textAnchor="end" {...font}>
          {'<#'}
        </text>
      </g>
      {state.sym === '-' && <rect x={slotX - DASH / 2} y={-BAR / 2} width={DASH} height={BAR} rx={BAR / 2} />}
      {state.sym === '.' && <circle cx={slotX} cy={0} r={DOT / 2} />}
      <g style={{ ...move, transform: `translateX(${W / 2 - CW}px)` }}>
        <text y={F * 0.35} textAnchor="start" {...font}>
          {'>'}
        </text>
      </g>
    </g>
  )

  return (
    <svg
      viewBox="0 0 594 594"
      className={cn('logo', className)}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      onPointerEnter={trigger}
      onClick={trigger}
    >
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="594" height="594">
          <rect width="594" height="594" fill="#fff" />
          <g fill="#000">{glyphs}</g>
        </mask>
      </defs>
      <path d={PATH} fill="currentColor" mask={`url(#${id})`} />
    </svg>
  )
}
