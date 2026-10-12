import { forwardRef, type ButtonHTMLAttributes } from 'react'

import type { Rarity } from '@/content'
import { cn } from '@/lib/utils'

export const RARITY_COLOR: Record<Rarity, string> = {
  common: 'var(--brass)',
  rare: 'var(--teal-2)',
  epic: '#b48ce6',
  legendary: 'var(--gold)',
}

/* Pyöreä esineslotti: ikoni, harvinaisuuskehä, tasomerkki tai tilapiste. */
export const Slot = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: string
    name: string
    rarity: Rarity
    badge?: string
    active?: boolean
    size?: 'sm' | 'md' | 'lg'
    dim?: boolean
  }
>(function Slot({ icon, name, rarity, badge, active, size = 'md', dim, className, ...props }, ref) {
  const px = size === 'lg' ? 'size-24 md:size-28' : size === 'sm' ? 'size-14' : 'size-20 md:size-[5.5rem]'
  return (
    <button
      ref={ref}
      type="button"
      aria-label={name}
      data-active={active || undefined}
      className={cn(
        'group relative grid shrink-0 place-items-center rounded-full outline-none transition-transform duration-200 hover:scale-[1.06] focus-visible:scale-[1.06] cursor-pointer',
        px,
        active ? 'slot-ring-active slot-burst' : 'slot-ring',
        dim && 'opacity-60',
        className,
      )}
      style={{ ['--rarity' as string]: RARITY_COLOR[rarity] }}
      {...props}
    >
      {/* harvinaisuushehku */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full opacity-70 transition-opacity group-hover:opacity-100 group-data-[active]:opacity-100"
        style={{ background: 'radial-gradient(closest-side, color-mix(in oklab, var(--rarity) 35%, transparent), transparent 75%)' }}
      />
      <img src={icon} alt="" width={512} height={512} loading="lazy" decoding="async" className="relative size-full rounded-full object-cover" />
      {/* kehän harvinaisuusviiva */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border" style={{ borderColor: 'color-mix(in oklab, var(--rarity) 70%, transparent)' }} />
      {badge && (
        <span className="absolute -right-1 -bottom-1 grid min-w-6 place-items-center rounded-full border border-line-2 bg-bg-2 px-1.5 py-0.5 font-display text-[0.62rem] font-bold tracking-wider text-brass-2">
          {badge}
        </span>
      )}
    </button>
  )
})
