import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Shield } from 'lucide-react'

import { ItemDialog } from '@/components/game/ItemDialog'
import { RARITY_COLOR } from '@/components/game/Slot'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import type { Item } from '@/content'
import github from '@/data/github.json'
import { cn } from '@/lib/utils'

const gh = github as { contributions: { total: number }; repos: unknown[] }

/* Tavarat – Odyssey-tyylinen esineruudukko:
   ylhäällä resurssirivi + kokemuspalkki, alla kolme ryhmää neliöruutuina (4 / rivi).
   Hover/fokus näyttää kelluvan tietopaneelin ruudun vieressä, Enter avaa dialogin.
   Nuolinäppäimet liikkuvat ruudukossa ryhmärajojen yli, Tab vaihtaa ryhmää. */

const COLS = 4
const PANEL_W = 340

type Pos = { g: number; i: number }

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => (typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true))
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return desktop
}

function ResourceStrip() {
  const { t } = useLang()
  const { play } = useSound()
  const g = t.goods
  const dyn: Record<string, string> = { commits: String(gh.contributions.total), repos: String(gh.repos.length) }
  const pct = Math.round((g.xp.value / g.xp.max) * 100)
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line/70 pb-4">
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {g.resources.map((r) => (
          <li key={r.id} className="flex items-center gap-2.5" onMouseEnter={() => play('tick')} title={r.label}>
            <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-sm border border-line/70 bg-bg-2">
              <img src={r.icon} alt="" width={36} height={36} loading="lazy" decoding="async" className="size-full object-cover" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[1.15rem] text-ink tabular-nums">{r.key ? dyn[r.key] : r.value}</span>
              <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">{r.label}</span>
            </span>
          </li>
        ))}
      </ul>
      {/* kokemuspalkki + taso */}
      <div className="ml-auto flex min-w-[220px] flex-1 items-center gap-3 sm:max-w-[360px]" aria-label={`${g.xp.label} ${g.xp.value} / ${g.xp.max}`}>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            <span>{g.xp.label}</span>
            <span className="tabular-nums">
              {g.xp.value.toLocaleString('fi-FI')} / {g.xp.max.toLocaleString('fi-FI')}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-sm border border-line/70 bg-bg-2">
            <div className="h-full bg-gradient-to-r from-brass to-gold" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="relative grid size-11 shrink-0 place-items-center text-brass">
          <Shield className="absolute inset-0 size-full stroke-[1.2]" aria-hidden />
          <span className="relative font-display text-sm text-ink tabular-nums">{t.hud.level.value}</span>
        </div>
      </div>
    </div>
  )
}

export function GoodsScreen() {
  const { t } = useLang()
  const { play } = useSound()
  const g = t.goods
  const desktop = useIsDesktop()
  const [active, setActive] = useState<Pos>({ g: 0, i: 0 })
  const [hovering, setHovering] = useState(false)
  const [open, setOpen] = useState<Item | null>(null)
  const [panel, setPanel] = useState<{ left: number; top: number } | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const key = (p: Pos) => `${p.g}:${p.i}`
  const item = g.groups[active.g]?.items[active.i]

  const focusPos = useCallback(
    (p: Pos) => {
      refs.current[key(p)]?.focus({ preventScroll: false })
      setActive(p)
      setHovering(true)
      play('tick')
    },
    [play],
  )

  // Nuolinäppäimet ruudukossa (siirtyvät ryhmästä toiseen reunalla), Tab ryhmien välillä
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      const cur = Object.entries(refs.current).find(([, b]) => b === el)?.[0]
      const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (!cur) {
        if (arrows.includes(e.key)) {
          e.preventDefault()
          focusPos({ g: 0, i: 0 })
        }
        return
      }
      const [gs, is] = cur.split(':')
      const p: Pos = { g: Number(gs), i: Number(is) }
      const len = (gi: number) => g.groups[gi]?.items.length ?? 0
      const row = Math.floor(p.i / COLS)
      const col = p.i % COLS
      let next: Pos | null = null
      if (e.key === 'ArrowRight') {
        if (col < COLS - 1 && p.i + 1 < len(p.g)) next = { g: p.g, i: p.i + 1 }
        else if (p.g + 1 < g.groups.length) next = { g: p.g + 1, i: Math.min(row * COLS, len(p.g + 1) - 1) }
      } else if (e.key === 'ArrowLeft') {
        if (col > 0) next = { g: p.g, i: p.i - 1 }
        else if (p.g > 0) next = { g: p.g - 1, i: Math.min(row * COLS + COLS - 1, len(p.g - 1) - 1) }
      } else if (e.key === 'ArrowDown') {
        if (p.i + COLS < len(p.g)) next = { g: p.g, i: p.i + COLS }
        else if (row < Math.floor((len(p.g) - 1) / COLS)) next = { g: p.g, i: len(p.g) - 1 }
      } else if (e.key === 'ArrowUp') {
        if (p.i - COLS >= 0) next = { g: p.g, i: p.i - COLS }
      } else if (e.key === 'Tab') {
        const ng = p.g + (e.shiftKey ? -1 : 1)
        if (ng >= 0 && ng < g.groups.length) next = { g: ng, i: 0 }
        else return // ulos ruudukosta normaalisti
      } else return
      e.preventDefault()
      if (next) focusPos(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusPos, g.groups, open])

  // Kelluvan tietopaneelin paikka aktiivisen ruudun vieressä (vain työpöydällä)
  useLayoutEffect(() => {
    if (!desktop || !hovering) {
      setPanel(null)
      return
    }
    const btn = refs.current[key(active)]
    const box = root.current
    if (!btn || !box) return
    const b = btn.getBoundingClientRect()
    const r = box.getBoundingClientRect()
    let left = b.right - r.left + 14
    if (left + PANEL_W > r.width) left = b.left - r.left - 14 - PANEL_W
    left = Math.max(0, Math.min(left, r.width - PANEL_W))
    const top = Math.max(0, b.top - r.top - 24)
    setPanel({ left, top })
  }, [active, hovering, desktop])

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-3 py-5 sm:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="brass-rule decode text-2xl tracking-[0.1em] text-ink">{g.title}</h2>
          <p className="mt-2 max-w-[70ch] text-sm text-muted-foreground">{g.lead}</p>
        </div>
        <p className="hidden text-xs text-muted-foreground lg:block">{g.hint}</p>
      </div>

      <ResourceStrip />

      <div ref={root} className="relative" onMouseLeave={() => setHovering(false)}>
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-3">
          {g.groups.map((grp, gi) => (
            <section key={grp.id} aria-label={grp.title}>
              <h3 className="mb-3 border-b border-line/70 pb-2 font-display text-[0.78rem] uppercase tracking-[0.22em] text-ink-2">{grp.title}</h3>
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                {grp.items.map((it, ii) => {
                  const isActive = active.g === gi && active.i === ii
                  return (
                    <button
                      key={it.id}
                      ref={(el) => {
                        refs.current[`${gi}:${ii}`] = el
                      }}
                      type="button"
                      aria-label={it.name}
                      data-active={isActive || undefined}
                      onMouseEnter={() => {
                        if (!isActive) play('tick')
                        setActive({ g: gi, i: ii })
                        setHovering(true)
                      }}
                      onFocus={() => {
                        setActive({ g: gi, i: ii })
                        setHovering(true)
                      }}
                      onClick={() => {
                        play('open')
                        setOpen(it)
                      }}
                      className={cn(
                        'group relative aspect-square overflow-hidden rounded-[3px] border bg-[#1b2229] outline-none transition-[transform,border-color,box-shadow] duration-150 cursor-pointer',
                        isActive && hovering
                          ? 'z-10 scale-[1.04] border-ink shadow-[0_0_0_1px_rgba(239,230,211,0.5),0_10px_30px_-10px_rgba(0,0,0,0.8)]'
                          : 'border-line/70 hover:border-line-2',
                      )}
                      style={{ ['--rarity' as string]: RARITY_COLOR[it.rarity] }}
                    >
                      {/* harvinaisuusviiva ylhäällä (Mirage) */}
                      <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-[3px]" style={{ background: 'var(--rarity)', opacity: it.rarity === 'common' ? 0.35 : 0.95 }} />
                      <img
                        src={it.icon}
                        alt=""
                        width={512}
                        height={512}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.06] group-data-[active]:scale-[1.06]"
                      />
                      {it.count && (
                        <span className="absolute right-1.5 bottom-1 font-display text-[0.78rem] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] tabular-nums">
                          {it.count}
                        </span>
                      )}
                      {/* sisäkehys */}
                      <span aria-hidden className="pointer-events-none absolute inset-[3px] border border-white/5" />
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Kelluva tietopaneeli (Odyssey) */}
        {desktop && panel && item && (
          <div
            key={item.id}
            className="absolute z-20 w-[340px] overflow-hidden rounded-[3px] border border-line-2 bg-[#121a20]/95 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ left: panel.left, top: panel.top }}
            aria-hidden
          >
            <div className="border-b border-line/70 bg-[#1b2229] px-4 py-3">
              <p className="label-caps" style={{ color: RARITY_COLOR[item.rarity] }}>
                {t.inventory.rarity[item.rarity]} · {item.tag}
              </p>
              <p className="mt-0.5 font-display text-[1.15rem] tracking-[0.04em] text-ink">{item.name}</p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#161d23]">
              <img src={item.icon} alt="" className="absolute inset-0 size-full object-cover" />
              {item.count && (
                <span className="absolute right-3 bottom-2 font-display text-lg font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] tabular-nums">
                  {item.count}
                </span>
              )}
            </div>
            <div className="px-4 py-3">
              <p className="text-[0.9rem] leading-relaxed text-ink-2">{item.desc}</p>
              {item.spec && (
                <dl className="mt-3 grid gap-1 border-t border-line/70 pt-3 text-xs">
                  {item.spec.map((s) => (
                    <div key={s.label} className="flex justify-between gap-4">
                      <dt className="uppercase tracking-[0.16em] text-muted-foreground">{s.label}</dt>
                      <dd className="text-right text-ink">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        )}
      </div>

      <ItemDialog item={open} onClose={() => setOpen(null)} />
    </div>
  )
}
