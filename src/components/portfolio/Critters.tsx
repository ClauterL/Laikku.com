import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { critterArt, type CritterKind } from './critterArt'
import { useReducedMotion } from './hooks'

/* Eläinsiluetit alaosioissa kuin bannerin linnut: litteä varjo, joka elää hetken aikaa ruutu kerrallaan.
   Ruutuja vaihdetaan vain, kun eläin on näkyvissä; vähennetty liike → ensimmäinen ruutu paikallaan. */

/** [ruutu, kesto ms] – toistuu */
type Seq = readonly (readonly [number, number])[]

const SEQ: Record<CritterKind, Seq> = {
  // kävelysykli
  bear: [
    [0, 170],
    [1, 170],
    [2, 170],
    [3, 170],
  ],
  // valpas → laiduntaa → nostaa päätä → korva ja häntä
  deer: [
    [0, 4200],
    [1, 3400],
    [0, 1500],
    [2, 900],
    [0, 2600],
    [1, 2400],
    [2, 700],
  ],
  // istuu → pesee tassuja → istuu → vilkaisee olan yli
  raccoon: [
    [0, 2600],
    [1, 260],
    [2, 260],
    [1, 260],
    [2, 260],
    [1, 260],
    [2, 260],
    [0, 1900],
    [3, 2300],
  ],
}

function useFrame(kind: CritterKind, el: React.RefObject<Element | null>) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    const node = el.current
    if (!node || reduce) return
    const seq = SEQ[kind]
    let step = 0
    let timer = 0
    let visible = false
    const tick = () => {
      step = (step + 1) % seq.length
      setI(step)
      timer = window.setTimeout(tick, seq[step][1])
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !visible) {
        visible = true
        timer = window.setTimeout(tick, seq[step][1])
      } else if (!e.isIntersecting && visible) {
        visible = false
        window.clearTimeout(timer)
      }
    })
    io.observe(node)
    return () => {
      io.disconnect()
      window.clearTimeout(timer)
    }
  }, [kind, el, reduce])
  return reduce ? 0 : SEQ[kind][i][0]
}

export function Critter({ kind, className }: { kind: CritterKind; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const frame = useFrame(kind, ref)
  const art = critterArt[kind]
  return (
    <svg ref={ref} viewBox={`0 0 ${art.w} ${art.h}`} className={cn('critter block overflow-visible', className)} aria-hidden>
      <path d={art.frames[frame]} fill="currentColor" />
    </svg>
  )
}

/** Karhu kävelee radan päästä päähän ja kääntyy (rata = vanhemman leveys miinus karhun leveys) */
export function WalkingBear({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute overflow-hidden', className)} aria-hidden>
      <div className="absolute inset-y-0 left-0 right-[var(--bear-w)]">
        <div className="critter-walk absolute inset-0">
          <div className="critter-turn absolute bottom-0 left-0 h-full w-[var(--bear-w)]">
            <Critter kind="bear" className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
