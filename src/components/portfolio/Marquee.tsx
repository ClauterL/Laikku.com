import { useEffect, useRef, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { useReducedMotion } from './hooks'

/* Liukuva nauha (työkalut, suosittelijat), jota voi myös selata itse:
   - painamalla ja vetämällä sivuttain (hiiri, kosketus, kynä) – irrotuksen jälkeen hidastuva liuku (inertia)
   - vaakasuuntaisella vierityksellä (kosketuslevy, Shift + rulla)
   Sisältö piirretään kahdesti, ja siirtymä kiertää yhden jakson ympäri, joten nauha on loputon kumpaankin suuntaan.
   Automaattinen liike pysähtyy pehmeästi, kun hiiri on päällä, sormi painaa, fokus on sisällä tai paused on päällä,
   ja jatkuu pehmeästi. Pystysuuntainen pyyhkäisy puhelimella vierittää sivua normaalisti (touch-action: pan-y).
   Liike vain transformilla yhdessä rAF-silmukassa, joka pyörii vain nauhan ollessa näkyvissä.
   Vähennetty liike: ei automaattista liikettä eikä kopioita – natiivi vaakavieritys. */

/** Kosketuksen jälkeen automaattinen liike odottaa hetken, jotta kortin ehtii lukea (ms) */
const HOLD_AFTER_TOUCH = 1600
/** Inertian vaimennus (1/s) */
const FRICTION = 3.2

export function Marquee({
  duration,
  paused = false,
  className,
  trackClassName,
  render,
}: {
  /** yhden jakson kesto automaattisesti liukuessa (s) */
  duration: number
  paused?: boolean
  className?: string
  trackClassName?: string
  /** listan kohteet; copy = toinen (aria-hidden) kierros */
  render: (copy: boolean) => ReactNode
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLUListElement>(null)
  const reduce = useReducedMotion()
  const opts = useRef({ duration, paused })
  useEffect(() => {
    opts.current = { duration, paused }
  })

  useEffect(() => {
    const el = wrap.current
    const tr = track.current
    if (reduce || !el || !tr) return

    let period = tr.scrollWidth / 2
    let x = 0
    /** automaattinen nopeus (px/s, lähestyy tavoitetta pehmeästi) ja inertia */
    let v = 0
    let fling = 0
    let hover = false
    let focus = false
    let holdUntil = 0
    let drag: null | { id: number; x0: number; px0: number; moved: boolean; samples: [number, number][] } = null
    let suppressClick = false
    let raf = 0
    let visible = false
    let last = 0

    const apply = () => {
      if (period > 0) x = (((x % period) + period) % period) - period // aina välillä [−jakso, 0)
      tr.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`
    }

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      if (!drag) {
        if (Math.abs(fling) > 4) {
          x += fling * dt
          fling *= Math.exp(-FRICTION * dt)
        } else {
          fling = 0
          const still = opts.current.paused || hover || focus || now < holdUntil
          const target = still ? 0 : -period / Math.max(1, opts.current.duration)
          v += (target - v) * Math.min(1, dt * 2.5)
          x += v * dt
        }
      }
      apply()
      raf = visible ? requestAnimationFrame(frame) : 0
    }
    const run = () => {
      if (!raf && visible) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }

    const ro = new ResizeObserver(() => {
      period = tr.scrollWidth / 2
      apply()
    })
    ro.observe(tr)
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting
      if (visible) run()
    })
    io.observe(el)

    // ---------- vetäminen ----------
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      drag = { id: e.pointerId, x0: x, px0: e.clientX, moved: false, samples: [[performance.now(), e.clientX]] }
      fling = 0
      v = 0
    }
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      const dx = e.clientX - drag.px0
      if (!drag.moved) {
        if (Math.abs(dx) < 5) return
        drag.moved = true
        el.setAttribute('data-dragging', '')
        el.setPointerCapture?.(e.pointerId)
      }
      x = drag.x0 + dx
      const now = performance.now()
      drag.samples.push([now, e.clientX])
      while (drag.samples.length > 2 && now - drag.samples[0][0] > 90) drag.samples.shift()
      apply()
    }
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      if (drag.moved) {
        const [t0, x0] = drag.samples[0]
        const [t1, x1] = drag.samples[drag.samples.length - 1]
        const vel = t1 > t0 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0
        fling = e.type === 'pointercancel' ? 0 : Math.max(-3000, Math.min(3000, vel))
        suppressClick = true
        el.removeAttribute('data-dragging')
        if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId)
      }
      if (e.pointerType !== 'mouse') holdUntil = performance.now() + HOLD_AFTER_TOUCH
      drag = null
    }
    // vedon jälkeen ei avata linkkiä vahingossa
    const onClick = (e: MouseEvent) => {
      if (!suppressClick) return
      suppressClick = false
      e.preventDefault()
      e.stopPropagation()
    }
    // kosketuslevyn vaakavieritys ja Shift + rulla; pystyvieritys jää sivulle
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0
      if (!dx) return
      e.preventDefault()
      x -= dx * (e.deltaMode === 1 ? 16 : 1)
      fling = 0
      v = 0
      holdUntil = performance.now() + HOLD_AFTER_TOUCH
      apply()
    }
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') hover = true
    }
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') hover = false
    }
    const onFocusIn = () => (focus = true)
    const onFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node | null)) focus = false
    }
    const noDrag = (e: DragEvent) => e.preventDefault()

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('click', onClick, true)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('focusin', onFocusIn)
    el.addEventListener('focusout', onFocusOut)
    el.addEventListener('dragstart', noDrag)
    apply()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('click', onClick, true)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('focusin', onFocusIn)
      el.removeEventListener('focusout', onFocusOut)
      el.removeEventListener('dragstart', noDrag)
      tr.style.transform = ''
    }
  }, [reduce])

  return (
    <div ref={wrap} className={cn('marquee relative', reduce ? 'overflow-x-auto' : 'overflow-hidden', className)}>
      <ul ref={track} className={cn('marquee-track flex', reduce ? 'w-auto' : 'w-max', trackClassName)}>
        {render(false)}
        {!reduce && render(true)}
      </ul>
    </div>
  )
}
