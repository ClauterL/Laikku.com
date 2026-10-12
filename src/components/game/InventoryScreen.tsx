import { useCallback, useEffect, useRef, useState } from 'react'

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

import { Slot, RARITY_COLOR } from '@/components/game/Slot'
import { ItemDialog } from '@/components/game/ItemDialog'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { images, type Item } from '@/content'
import github from '@/data/github.json'
import { cn } from '@/lib/utils'

const gh = github as { contributions: { total: number }; repos: unknown[] }

/* Slottien paikat lavalla (prosentteina) – vasen kaari varusteille, oikea projekteille */
const LEFT = ['left-[7%] top-[9%]', 'left-[1%] top-[32%]', 'left-[1%] top-[55%]', 'left-[7%] top-[78%]']
const RIGHT = ['right-[7%] top-[9%]', 'right-[1%] top-[32%]', 'right-[1%] top-[55%]', 'right-[7%] top-[78%]']

function LevelDial() {
  const { t } = useLang()
  const l = t.hud.level
  return (
    <div className="relative grid size-28 place-items-center rounded-full border border-brass/50 bg-bg-2/80 shadow-[0_0_40px_-12px_rgba(201,168,106,0.6)]">
      <span aria-hidden className="absolute inset-[-6px] rounded-full border border-line animate-pulse-ring" />
      <span aria-hidden className="absolute inset-[5px] rounded-full border border-dashed border-line-2 animate-spin-slow" />
      <div className="text-center leading-none">
        <p className="font-display text-[2.4rem] text-brass-2 tabular-nums">{l.value}</p>
        <p className="label-caps mt-1 text-ink-2">{l.label}</p>
      </div>
      <p className="absolute -bottom-6 whitespace-nowrap font-display text-[0.62rem] uppercase tracking-[0.25em] text-muted-foreground">
        {l.caption}
      </p>
    </div>
  )
}

function HudSlot({ name, icon, meter, caption }: { name: string; icon: string; meter: number; caption: string }) {
  const { play } = useSound()
  return (
    <div className="flex flex-col items-center gap-2" onMouseEnter={() => play('tick')}>
      <div className="relative size-20 overflow-hidden rounded-full slot-ring">
        <img src={icon} alt="" className="size-full object-cover" loading="lazy" />
      </div>
      <p className="font-display text-[0.7rem] uppercase tracking-[0.2em] text-ink-2">{name}</p>
      <div className="flex gap-1" aria-label={caption} title={caption}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={cn('size-1.5 rounded-full', i < meter ? 'bg-brass' : 'bg-line')} />
        ))}
      </div>
    </div>
  )
}

function Bag() {
  const { t } = useLang()
  const b = t.hud.bag
  const values: Record<string, string> = {
    commits: String(gh.contributions.total),
    repos: String(gh.repos.length),
    projects: String(t.inventory.items.length),
  }
  return (
    <div className="panel corners rounded-sm px-4 py-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="size-12 overflow-hidden rounded-full slot-ring">
          <img src="/images/icon-waretrack.webp" alt="" className="size-full object-cover" loading="lazy" />
        </div>
        <p className="font-display text-[0.78rem] uppercase tracking-[0.22em] text-ink">{b.title}</p>
      </div>
      <ul className="divide-y divide-line/70">
        {b.rows.map((r) => (
          <li key={r.key} className="flex items-baseline justify-between gap-3 py-2">
            <span className="font-display text-xl text-brass-2 tabular-nums">{r.value ?? values[r.key] ?? '—'}</span>
            <span className="text-right text-[0.72rem] uppercase tracking-wider text-muted-foreground">{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DetailStrip({ item }: { item: Item | null }) {
  const { t } = useLang()
  if (!item) return null
  return (
    <div
      key={item.id}
      className="panel corners animate-in fade-in-0 slide-in-from-bottom-2 duration-300 mx-auto flex max-w-2xl items-center gap-4 rounded-sm px-4 py-3"
    >
      <span className="size-2 shrink-0 rounded-full" style={{ background: RARITY_COLOR[item.rarity] }} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-[0.8rem] uppercase tracking-[0.18em] text-ink">
          {item.name}
          <span className="ml-2 text-[0.62rem] text-muted-foreground">
            {t.inventory.rarity[item.rarity]} · {item.tag}
          </span>
        </p>
        <p className="truncate text-sm text-ink-2">{item.desc}</p>
      </div>
      {item.status && <span className="text-[0.68rem] uppercase tracking-wider text-teal-2">{item.status}</span>}
    </div>
  )
}

export function InventoryScreen() {
  const { t } = useLang()
  const { play } = useSound()
  const inv = t.inventory
  const all: Item[] = [...inv.gear, ...inv.items, ...inv.languages]
  const [hover, setHover] = useState<Item | null>(null)
  const [open, setOpen] = useState<Item | null>(null)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const desktop = useIsDesktop()

  const focusIndex = useCallback((i: number) => {
    const n = all.length
    const idx = ((i % n) + n) % n
    refs.current[idx]?.focus()
    setHover(all[idx])
    play('tick')
  }, [all, play])

  // Nuolinäppäimet: vasen kaari (varusteet), oikea kaari (projektit) ja alarivi (kielet)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return
      const active = document.activeElement as HTMLElement | null
      const cur = refs.current.findIndex((r) => r === active)
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return
      if (cur < 0) {
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
        focusIndex(0)
        e.preventDefault()
        return
      }
      e.preventDefault()
      const nL = inv.gear.length
      const nR = inv.items.length
      const nB = inv.languages.length
      const inL = cur < nL
      const inR = cur >= nL && cur < nL + nR
      const b = cur - nL - nR // indeksi alarivillä
      if (inL) {
        if (e.key === 'ArrowUp') focusIndex(cur === 0 ? nL - 1 : cur - 1)
        else if (e.key === 'ArrowDown') focusIndex(cur === nL - 1 ? nL + nR : cur + 1) // alas viimeisestä → alarivi
        else if (e.key === 'ArrowRight') focusIndex(nL + Math.min(cur, nR - 1))
        else focusIndex(nL + nR)
      } else if (inR) {
        const r = cur - nL
        if (e.key === 'ArrowUp') focusIndex(r === 0 ? nL + nR - 1 : cur - 1)
        else if (e.key === 'ArrowDown') focusIndex(r === nR - 1 ? nL + nR + nB - 1 : cur + 1)
        else if (e.key === 'ArrowLeft') focusIndex(Math.min(r, nL - 1))
        else focusIndex(nL + nR + nB - 1)
      } else {
        if (e.key === 'ArrowLeft') focusIndex(b === 0 ? nL - 1 : cur - 1)
        else if (e.key === 'ArrowRight') focusIndex(b === nB - 1 ? nL + nR - 1 : cur + 1)
        else if (e.key === 'ArrowUp') focusIndex(b < nB / 2 ? nL - 1 : nL + nR - 1)
        else focusIndex(cur)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusIndex, inv.gear.length, inv.items.length, inv.languages.length, open])

  const slot = (item: Item, i: number, pos: string, floating = true) => (
    <div
      key={item.id}
      className={cn(floating ? 'absolute -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 lg:translate-y-0' : 'flex flex-col items-center gap-2', pos)}
    >
      <Slot
        ref={(el) => {
          refs.current[i] = el
        }}
        icon={item.icon}
        logo={item.logo}
        name={item.name}
        rarity={item.rarity}
        active={hover?.id === item.id}
        onMouseEnter={() => {
          setHover(item)
          play('tick')
        }}
        onFocus={() => setHover(item)}
        onClick={() => {
          play('open')
          setOpen(item)
        }}
      />
      <p
        className={cn(
          'pointer-events-none font-display text-[0.6rem] uppercase tracking-[0.2em] text-ink-2',
          floating ? 'absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap' : 'text-center leading-snug',
        )}
      >
        {item.name}
      </p>
    </div>
  )

  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 px-3 py-4 sm:px-5 lg:min-h-[calc(100svh-7.5rem)] lg:grid-cols-[180px_1fr_240px] lg:items-center lg:gap-4 lg:py-4">
      {/* vasen pylväs */}
      <aside className="order-2 flex items-start justify-around gap-6 lg:order-1 lg:flex-col lg:items-center lg:gap-10 lg:pt-6">
        <LevelDial />
        <div className="mt-6 flex gap-6 lg:mt-0 lg:flex-col lg:gap-8">
          {t.hud.slots.map((s) => (
            <HudSlot key={s.id} {...s} />
          ))}
        </div>
      </aside>

      {/* lava: hahmo + slotit */}
      <section className="order-1 lg:order-2" aria-label={inv.title}>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[640px] sm:aspect-[5/4] lg:aspect-[16/13] lg:max-w-[760px]">
          {/* koristerengas */}
          <div aria-hidden className="emblem absolute left-1/2 top-[8%] size-[72%] -translate-x-1/2 rounded-full sm:top-[6%] sm:size-[68%]" />
          <div aria-hidden className="absolute left-1/2 top-[16%] size-[56%] -translate-x-1/2 rounded-full border border-brass/25" />
          <div
            aria-hidden
            className="absolute inset-x-[20%] bottom-0 h-[10%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,0.8),transparent)]"
          />
          {/* hahmo */}
          <img
            src={images.character.src}
            srcSet={images.character.srcSet}
            sizes={images.character.sizes}
            alt={t.name}
            width={images.character.width}
            height={images.character.height}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-x-0 bottom-0 mx-auto h-[96%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_30px_40px_rgba(0,0,0,0.7)]"
          />
          {/* slotit (desktop: kaaret hahmon ympärillä) */}
          {desktop && (
            <>
              {inv.gear.map((it, i) => slot(it, i, LEFT[i]))}
              {inv.items.map((it, i) => slot(it, i + inv.gear.length, RIGHT[i]))}
            </>
          )}
        </div>
        {/* kielet & työkalut: pikarivi hahmon alla */}
        {desktop && (
          <div className="relative mx-auto -mt-2 flex max-w-[760px] items-end justify-center gap-5">
            <span aria-hidden className="absolute inset-x-[8%] top-1/2 h-px bg-gradient-to-r from-transparent via-line-2 to-transparent" />
            {inv.languages.map((it, i) => (
              <div key={it.id} className="relative flex flex-col items-center gap-1.5">
                <Slot
                  ref={(el) => {
                    refs.current[inv.gear.length + inv.items.length + i] = el
                  }}
                  size="sm"
                  icon={it.icon}
                  logo={it.logo}
                  name={it.name}
                  rarity={it.rarity}
                  active={hover?.id === it.id}
                  onMouseEnter={() => {
                    setHover(it)
                    play('tick')
                  }}
                  onFocus={() => setHover(it)}
                  onClick={() => {
                    play('open')
                    setOpen(it)
                  }}
                />
                <p className="pointer-events-none font-display text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">{it.name}</p>
              </div>
            ))}
          </div>
        )}
        {/* mobiili/tabletti: slotit ruudukkona */}
        {!desktop && (
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4">
            {all.map((item, i) => slot(item, i, '', false))}
          </div>
        )}
        <div className="mt-8 min-h-[64px] lg:mt-6">
          <DetailStrip item={hover ?? all[0]} />
        </div>
      </section>

      {/* oikea: reppu */}
      <aside className="order-3 lg:pt-6">
        <Bag />
        <p className="mt-3 text-center text-[0.68rem] uppercase tracking-wider text-muted-foreground lg:text-left">
          {inv.gearTitle} ← · → {inv.itemsTitle}
        </p>
      </aside>

      <ItemDialog item={open} onClose={() => setOpen(null)} />
    </div>
  )
}
