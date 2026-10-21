import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react'

import { cn } from '@/lib/utils'

export function useReducedMotion() {
  const [reduce, setReduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduce(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduce
}

/** Onko elementti tullut näkyviin (kerran) */
export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(() => !('IntersectionObserver' in window))
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin, inView])
  return [ref, inView] as const
}

/** Liukuu esiin, kun tulee näkyviin. delay ms porrastukseen. */
type RevealTag = 'div' | 'p' | 'header' | 'article' | 'li' | 'dl' | 'figure' | 'form'

export function Reveal({
  as = 'div',
  delay = 0,
  className,
  children,
  ...rest
}: {
  as?: RevealTag
  delay?: number
  className?: string
  children: ReactNode
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  const [ref, inView] = useInView<HTMLElement>()
  const Tag = as as 'div'
  return (
    <Tag
      ref={ref as Ref<HTMLDivElement>}
      data-reveal=""
      className={cn(inView && 'is-in', className)}
      style={{ '--d': `${delay}ms` } as CSSProperties}
      {...(rest as HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </Tag>
  )
}

/** Laskuri: "2+" → 0…2 + "+", kun näkyvissä */
export function useCountUp(value: string, run: boolean, duration = 1200) {
  const m = value.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/)
  const target = m ? parseFloat(m[2].replace(',', '.')) : 0
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce || !m ? target : 0)
  useEffect(() => {
    if (!run || reduce || !m) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      setN(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, reduce, target, duration])
  if (!m) return value
  const decimals = m[2].includes('.') || m[2].includes(',') ? 1 : 0
  return `${m[1]}${n.toFixed(decimals)}${m[3]}`
}

/** Osoitinta seuraava valo (.spot): asettaa --x/--y */
export function spotHandlers() {
  return {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect()
      e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
      e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
    },
  }
}
