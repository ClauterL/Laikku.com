import { useEffect, useRef, type RefObject } from 'react'

import { critterSprites } from '@/content'
import { arm, show } from '@/components/portfolio/Critters'
import { useReducedMotion } from '@/components/portfolio/hooks'

/* Aloitusruudun pesukarhu (sama Higgsfield/Kling-siluetti kuin normaalin portfolion Päivittäiset työkalut -osiossa).
   Istuu valitun kortin yläreunalla kortin ulkolaidalla ja katsoo keskelle päin. Kun valinta vaihtuu, se
   kyykistyy, hyppää kaarena toiselle kortille (venyy ilmassa, litistyy laskeutuessa) ja kääntyy.
   Välillä se toistaa videonsa (tassujen hieronta); valinnan vahvistus (cheer) käynnistää sen heti.
   Sijainti: transform kortin offsetLeft/Top mukaan, hyppy Web Animations API:lla – ei React-renderöintejä.
   Vähennetty liike → siirtyy suoraan, ei hyppyä eikä videota. */

type Side = 'left' | 'right'
const SHEET = critterSprites.raccoon
const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function StartRaccoon({
  grid,
  target,
  visible,
  cheer,
}: {
  /** korttien kääre (position: relative) */
  grid: RefObject<HTMLDivElement | null>
  /** valitun kortin data-mode */
  target: 'normal' | 'game'
  visible: boolean
  /** kasvaa, kun valinta vahvistetaan → video heti */
  cheer: number
}) {
  const pos = useRef<HTMLDivElement>(null)
  const face = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const state = useRef({ x: 0, y: 0, placed: false, target, clip: 0, frame: 0, wait: 0, hopping: false })
  const timers = useRef<{ clip: number; land: number }>({ clip: 0, land: 0 })

  // video: ruudut omalla ajoituksellaan, sitten tauko alkuasennossa. delay < 0 = pysäytä istuma-asentoon.
  const playClip = useRef<(delay: number) => void>(() => {})
  useEffect(() => {
    const el = body.current
    if (!el) return
    arm(el, SHEET)
    show(el, SHEET, 0)
    let i = 0
    const tick = () => {
      show(el, SHEET, i)
      const ms = SHEET.ms[i] ?? 42
      i = (i + 1) % SHEET.frames
      timers.current.clip = window.setTimeout(i === 0 ? () => playClip.current(rand(3500, 8000)) : tick, ms)
    }
    playClip.current = (delay: number) => {
      window.clearTimeout(timers.current.clip)
      i = 0
      show(el, SHEET, 0)
      if (reduce || delay < 0) return
      timers.current.clip = window.setTimeout(tick, delay)
    }
    const t = timers.current
    return () => window.clearTimeout(t.clip)
  }, [reduce])

  /** kortin kohta: ulkolaita, karhun jalat kortin yläreunalla (aktiivinen kortti on nostettu 4 px) */
  const spot = (mode: 'normal' | 'game') => {
    const card = grid.current?.querySelector<HTMLElement>(`[data-mode="${mode}"]`)
    const el = pos.current
    if (!card || !el) return null
    const side: Side = mode === 'normal' ? 'left' : 'right'
    const w = el.offsetWidth
    const h = el.offsetHeight
    const inset = Math.min(card.offsetWidth * 0.1, 28)
    const x = side === 'left' ? card.offsetLeft + inset : card.offsetLeft + card.offsetWidth - inset - w
    return { x, y: card.offsetTop - 4 - h + 3, side }
  }

  const setFace = (side: Side) => {
    // ruudut katsovat vasemmalle; vasemmalla kortilla käännetään katsomaan keskelle
    if (face.current) face.current.style.transform = side === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
  }

  const place = (x: number, y: number) => {
    state.current.x = x
    state.current.y = y
    if (pos.current) pos.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  // valinnan vaihto → hyppy
  useEffect(() => {
    const st = state.current
    const to = spot(target)
    if (!to) return
    if (!st.placed || reduce || !visible) {
      place(to.x, to.y)
      setFace(to.side)
      st.placed = true
      st.target = target
      return
    }
    if (st.target === target) return
    st.target = target
    const from = { x: st.x, y: st.y }
    const dist = Math.hypot(to.x - from.x, to.y - from.y)
    const flight = Math.min(900, 520 + dist * 0.35)
    const crouch = 120
    const peak = Math.min(from.y, to.y) - Math.max(34, dist * 0.2)
    playClip.current(-1) // istuma-asento hypyn ajaksi
    pos.current?.getAnimations().forEach((a) => a.cancel())
    body.current?.getAnimations().forEach((a) => a.cancel())
    setFace(to.x > from.x ? 'left' : 'right') // katse menosuuntaan (scaleX(-1) = oikealle)
    pos.current?.animate(
      [
        { transform: `translate3d(${from.x}px, ${from.y}px, 0)`, easing: 'cubic-bezier(.2,.65,.4,1)' },
        { transform: `translate3d(${(from.x + to.x) / 2}px, ${peak}px, 0)`, offset: 0.5, easing: 'cubic-bezier(.6,0,.8,.35)' },
        { transform: `translate3d(${to.x}px, ${to.y}px, 0)` },
      ],
      { duration: flight, delay: crouch, fill: 'backwards' },
    )
    const T = crouch + flight
    const D = T + 180
    const at = (ms: number) => ms / D
    // kyykky → venyy ponnistaessa → normaali → litistyy laskeutuessa → palautuu
    body.current?.animate(
      [
        { scale: '1 1' },
        { scale: '1.12 0.8', offset: at(crouch) },
        { scale: '0.9 1.14', offset: at(crouch + flight * 0.22) },
        { scale: '1 1', offset: at(crouch + flight * 0.6) },
        { scale: '1.15 0.8', offset: at(T + 30) },
        { scale: '1 1' },
      ],
      { duration: D },
    )
    place(to.x, to.y)
    window.clearTimeout(timers.current.land)
    timers.current.land = window.setTimeout(() => {
      setFace(to.side)
      playClip.current(rand(900, 2200))
    }, T + 120)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, visible, reduce])

  // näkyviin tullessa video käyntiin hetken päästä
  useEffect(() => {
    if (visible) playClip.current(rand(1600, 3200))
  }, [visible])

  useEffect(() => {
    if (cheer) playClip.current(0)
  }, [cheer])

  // koon muutos → uusi paikka ilman hyppyä
  useEffect(() => {
    const g = grid.current
    if (!g) return
    const ro = new ResizeObserver(() => {
      const to = spot(state.current.target)
      if (!to) return
      pos.current?.getAnimations().forEach((a) => a.finish())
      place(to.x, to.y)
    })
    ro.observe(g)
    const t = timers.current
    return () => {
      ro.disconnect()
      window.clearTimeout(t.land)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={pos} className="st-raccoon" data-on={visible ? '' : undefined} aria-hidden>
      <div ref={face} className="st-raccoon-face">
        <div ref={body} className="st-raccoon-body" />
      </div>
    </div>
  )
}
