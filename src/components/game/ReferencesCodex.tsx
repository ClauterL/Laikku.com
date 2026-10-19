import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowUpRight, ChevronDown, PenLine, Quote } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { emblem, type Content } from '@/content'
import { cn } from '@/lib/utils'

type Refs = Content['codex']['references']
type Ref = Refs['items'][number]

/** Luonnokset (suosittelija ei vielä hyväksynyt) näkyvät vain kehitystilassa ja esikatselussa (VITE_SHOW_DRAFTS=1) */
const SHOW_DRAFTS = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === '1'

/** AC-tyylinen kärkimuoto: oikea reuna nuolena (kuten pelin tietokannan valittu rivi) */
const ARROW = 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'

function initials(name: string) {
  return name
    .replace(/[[\]]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

/** Ohut viiva, jonka keskellä messinkitimantti */
function DiamondRule() {
  return (
    <div className="relative my-4 h-px w-full bg-gradient-to-r from-line-2/30 via-line-2 to-line-2/30" aria-hidden>
      <span className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-brass bg-bg" />
    </div>
  )
}

/* Suosittelijat pelin koodeksin tapaan: ryhmät vasemmalla (avattavat, nähdyt / kaikki),
   merkintä keskellä (nimi, timanttiviiva, suositusteksti), suosittelijan kuva oikealla taustaan häivyttyen. */
export function ReferencesCodex({ onWrite }: { onWrite: () => void }) {
  const { t } = useLang()
  const { play } = useSound()
  const r = t.codex.references
  const items = useMemo(() => r.items.filter((it) => SHOW_DRAFTS || !it.draft), [r.items])
  const groups = useMemo(
    () => r.groups.map((g) => ({ ...g, items: items.filter((it) => it.group === g.id) })).filter((g) => g.items.length > 0),
    [r.groups, items],
  )

  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(r.groups.map((g) => [g.id, true])))
  // valinta ja nähdyt indekseinä, jotta kielen vaihto (uudet sisältöoliot) säilyttää ne
  const [selIdx, setSelIdx] = useState(0)
  const [seenIdx, setSeenIdx] = useState<Set<number>>(() => new Set([0]))
  const sel: Ref | null = items[selIdx] ?? items[0] ?? null
  const seen = { has: (it: Ref) => seenIdx.has(items.indexOf(it)) }
  const listRef = useRef<HTMLDivElement>(null)

  if (items.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-start gap-3 rounded-sm border border-dashed border-line px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-prose text-sm leading-relaxed text-ink-2">{r.empty}</p>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 rounded-sm border-brass/60 font-display text-[0.7rem] uppercase tracking-[0.18em]"
          onMouseEnter={() => play('tick')}
          onClick={onWrite}
        >
          <PenLine />
          {r.cta}
        </Button>
      </div>
    )
  }

  const choose = (it: Ref) => {
    const i = items.indexOf(it)
    if (it !== sel) play('tick')
    setSelIdx(i)
    setSeenIdx((s) => (s.has(i) ? s : new Set(s).add(i)))
  }

  // ylös/alas selaa avoimien ryhmien merkintöjä, kuten pelin tietokannassa
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const flat = groups.flatMap((g) => (open[g.id] ? g.items : []))
    if (!flat.length) return
    e.preventDefault()
    const i = sel ? flat.indexOf(sel) : -1
    const next = flat[(i + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length]
    choose(next)
    listRef.current?.querySelector<HTMLButtonElement>(`[data-ref="${items.indexOf(next)}"]`)?.focus()
  }

  return (
    <div className="panel relative mt-4 overflow-hidden rounded-sm">
      <div className="grid lg:min-h-[460px] lg:grid-cols-[minmax(260px,320px)_1fr_minmax(240px,380px)]">
        {/* ryhmät ja merkinnät */}
        <div ref={listRef} onKeyDown={onKey} className="flex flex-col gap-2 border-b border-line/70 p-4 lg:border-b-0 lg:border-r">
          {groups.map((g) => {
            const isOpen = open[g.id]
            const seenN = g.items.filter((it) => seen.has(it)).length
            return (
              <div key={g.id} className="flex flex-col gap-1.5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    play(isOpen ? 'close' : 'open')
                    setOpen((o) => ({ ...o, [g.id]: !isOpen }))
                  }}
                  style={{ clipPath: ARROW }}
                  className="group flex w-full items-center gap-3 border border-line-2/70 bg-gradient-to-r from-panel-2 via-bg-2 to-bg-2/40 py-2.5 pl-3 pr-6 text-left transition-colors hover:from-brass/20 cursor-pointer outline-none focus-visible:from-brass/25"
                >
                  <ChevronDown className={cn('size-4 shrink-0 text-brass transition-transform', !isOpen && '-rotate-90')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[0.95rem] tracking-[0.06em] text-ink">{g.title}</span>
                    <span className="block font-display text-[0.7rem] tabular-nums text-ink-2">
                      {seenN} / {g.items.length}
                    </span>
                  </span>
                </button>
                {isOpen &&
                  g.items.map((it) => {
                    const active = it === sel
                    return (
                      <button
                        key={items.indexOf(it)}
                        type="button"
                        data-ref={items.indexOf(it)}
                        onClick={() => {
                          play('select')
                          choose(it)
                        }}
                        onFocus={() => choose(it)}
                        style={{ clipPath: ARROW }}
                        className={cn(
                          'relative ml-4 flex items-center gap-2 border py-2 pl-3 pr-7 text-left transition-colors outline-none cursor-pointer',
                          active ? 'border-brass-2 bg-ink/90 text-bg' : 'border-line/70 bg-bg-2/60 text-ink-2 hover:border-line-2 hover:text-ink',
                        )}
                      >
                        {!seen.has(it) && <span className="size-1.5 shrink-0 rotate-45 bg-ember" aria-hidden />}
                        <span className="min-w-0 flex-1 truncate font-display text-[0.82rem] tracking-[0.04em]">{it.name}</span>
                        {active && (
                          <span className="absolute right-6 grid size-6 place-items-center rounded-full border border-bg/50" aria-hidden>
                            <span className="size-1 rounded-full bg-bg/70" />
                          </span>
                        )}
                      </button>
                    )
                  })}
              </div>
            )
          })}
          <div className="mt-auto flex flex-col gap-3 pt-3">
            <p className="hidden items-center gap-1.5 text-[0.68rem] text-muted-foreground lg:flex">
              <span className="key">↑</span>
              <span className="key">↓</span>
              {r.hint}
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-fit rounded-sm border-brass/60 font-display text-[0.68rem] uppercase tracking-[0.18em]"
              onMouseEnter={() => play('tick')}
              onClick={onWrite}
            >
              <PenLine />
              {r.cta}
            </Button>
          </div>
        </div>

        {/* merkintä */}
        {sel && (
          <article key={items.indexOf(sel)} className="screen-in order-last flex min-w-0 flex-col p-5 sm:p-7 lg:order-none">
            <h4 className="font-display text-2xl tracking-[0.04em] text-ink [text-wrap:balance] sm:text-3xl">{sel.name}</h4>
            <p className="label-caps mt-2 text-brass">{[sel.role, sel.org].filter(Boolean).join(' · ')}</p>
            <DiamondRule />
            <blockquote className="relative max-w-[62ch] text-[1.02rem] leading-relaxed text-ink-2">
              <Quote className="mb-2 size-5 text-ember" />
              {sel.quote}
            </blockquote>
            {sel.href && (
              <a
                href={sel.href}
                target="_blank"
                rel="noreferrer noopener"
                onMouseEnter={() => play('tick')}
                className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink hover:text-brass-2"
              >
                <span className="label-caps">{r.profile}</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </a>
            )}
            {sel.draft && (
              <p className="mt-5 w-fit border border-dashed border-ember/60 px-2.5 py-1.5 text-[0.7rem] uppercase tracking-[0.14em] text-ember-2 lg:mt-auto">
                {r.draft}
              </p>
            )}
          </article>
        )}

        {/* suosittelijan kuva, häivytys vasemmalle taustaan */}
        {sel && (
          <figure className="relative h-60 overflow-hidden border-b border-line/70 sm:h-72 lg:h-auto lg:border-b-0">
            {sel.photo ? (
              <img
                key={sel.photo.src}
                src={sel.photo.src}
                srcSet={sel.photo.srcSet}
                sizes="(min-width: 1024px) 380px, 100vw"
                alt={sel.photo.alt}
                width={sel.photo.width}
                height={sel.photo.height}
                loading="lazy"
                className="screen-in absolute inset-0 size-full object-cover object-top [mask-image:linear-gradient(to_left,black_55%,transparent)]"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_60%_40%,rgba(201,168,106,0.16),transparent_65%)]">
                <img src={emblem.poster} alt="" className="absolute size-64 max-w-[80%] opacity-[0.07]" loading="lazy" />
                <div className="relative grid place-items-center gap-3 text-center">
                  <span className="grid size-24 place-items-center rounded-full border border-brass/50 font-display text-3xl tracking-[0.08em] text-brass-2 shadow-[0_0_0_6px_rgba(20,17,15,0.8),0_0_0_7px_rgba(201,168,106,0.25)]">
                    {initials(sel.name) || '?'}
                  </span>
                  <span className="label-caps">{r.photoSoon}</span>
                </div>
              </div>
            )}
          </figure>
        )}
      </div>
    </div>
  )
}
