import { useState, type ReactNode } from 'react'
import { ArrowUpRight, Check, Circle, Mail, Plane, X } from 'lucide-react'

import { gameItems, pfIcons, type Content, type FlightStation, type Item, type Quest } from '@/content'
import { TechIcon, hasTechIcon } from '@/components/TechIcon'
import github from '@/data/github.json'
import { SHOW_DRAFTS } from '@/lib/env'
import { cn } from '@/lib/utils'
import { STATIONS } from './world'

/* Dronelennon kohteiden sisällöt. Kaikki tekstit tulevat samoista sisältötiedostoista kuin muissa
   portfolioissa (fi.ts / en.ts). Värit tulevat .fl-panel-muuttujista: päivällä persikkapaperi,
   yöllä yönsininen lasi tealilla (index.css). */

type PanelProps = { t: Content; onFly: (id: FlightStation) => void }

const gh = github as { contributions: { total: number }; repos: unknown[] }

/** Aitan esinekuva: pelin oma (images/game/items, id tai vanhan good-*-kuvan nimi), muuten vanha kuva */
function itemIcon(src: string, id?: string) {
  return (id && gameItems[id]) || gameItems[/good-([\w-]+)\./.exec(src)?.[1] ?? ''] || src
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="fp-kicker mb-2 mt-6 first:mt-0">{children}</h3>
}

function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('fp-bar', className)} role="presentation">
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  )
}

function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const external = /^https?:/.test(href)
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={cn('fp-btn', className)}
    >
      {children}
      {external && <ArrowUpRight className="size-3.5" aria-hidden />}
    </a>
  )
}

function Howto({ t, onFly }: PanelProps) {
  const h = t.flight.howto
  return (
    <>
      <p className="fp-lead">{h.lead}</p>
      <ol className="mt-4 grid gap-2">
        {h.steps.map((s, i) => (
          <li key={i} className="fp-card flex items-start gap-3 px-3 py-2.5">
            <span className="fp-num">{i + 1}</span>
            <span className="text-[0.92rem] leading-snug">{s}</span>
          </li>
        ))}
      </ol>
      <H3>{h.routeTitle}</H3>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {STATIONS.filter((s) => s.id !== 'dock').map((s, i) => {
          const st = t.flight.stations[s.id]
          return (
            <li key={s.id}>
              <button type="button" onClick={() => onFly(s.id)} className="fp-card fp-hover flex w-full items-center gap-3 px-3 py-2 text-left">
                <span className="fp-num">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.92rem] font-bold leading-tight">{st.section}</span>
                  <span className="fp-muted block text-[0.75rem]">{st.name}</span>
                </span>
                <Plane className="size-4 opacity-60" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function About({ t }: PanelProps) {
  const c = t.codex
  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,200px)_1fr]">
      <img
        src={c.portrait.src}
        srcSet={c.portrait.srcSet}
        sizes="200px"
        alt={c.portrait.alt}
        width={c.portrait.width}
        height={c.portrait.height}
        className="aspect-[4/5] w-full max-w-[220px] rounded-xl object-cover object-[50%_18%]"
      />
      <div>
        {c.paragraphs.map((p, i) => (
          <p key={i} className={cn('text-[0.95rem] leading-relaxed', i > 0 && 'mt-3')}>
            {p}
          </p>
        ))}
        <blockquote className="fp-quote mt-4">“{c.quote}”</blockquote>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.label} className="fp-card px-3 py-2">
              <dt className="fp-muted text-[0.68rem] leading-tight">{s.label}</dt>
              <dd className="poster text-[1.35rem] leading-none">{s.value}</dd>
            </div>
          ))}
        </dl>
        <dl className="mt-4 grid gap-1 text-[0.88rem]">
          {c.info.map((row) => (
            <div key={row.label} className="flex gap-2">
              <dt className="fp-muted w-28 shrink-0">{row.label}</dt>
              <dd className="min-w-0 break-words font-semibold">{row.href ? <a href={row.href} className="underline underline-offset-2">{row.value}</a> : row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

function Skills({ t }: PanelProps) {
  const s = t.skills
  return (
    <>
      <p className="fp-lead">{s.lead}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {s.branches.map((b) => (
          <section key={b.title} className="fp-card p-3">
            <h3 className="fp-kicker mb-3">{b.title}</h3>
            <ul className="grid gap-2.5">
              {b.nodes.map((n) => (
                <li key={n.name} title={n.desc}>
                  <div className="flex items-center gap-2">
                    <span className="fp-icon">{hasTechIcon(n.icon) ? <TechIcon name={n.icon} className="size-4" /> : <Circle className="size-3" />}</span>
                    <span className="min-w-0 flex-1 truncate text-[0.88rem] font-semibold">{n.name}</span>
                    <span className="fp-muted text-[0.72rem] tabular-nums">{n.level} %</span>
                  </div>
                  <Bar value={n.level} className="mt-1" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

function ProjectCard({ item, t }: { item: Item; t: Content }) {
  const icon = pfIcons[item.id] ?? item.icon
  return (
    <article className="fp-card flex flex-col gap-2 p-3">
      <div className="flex items-start gap-3">
        <img src={icon} alt="" width={48} height={48} loading="lazy" className="size-12 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[1rem] font-extrabold leading-tight">{item.name}</h3>
          <p className="fp-muted text-[0.75rem]">{item.tag}</p>
        </div>
        {item.status && <span className="fp-chip shrink-0">{item.status}</span>}
      </div>
      <p className="text-[0.88rem] leading-snug">{item.desc}</p>
      {item.tech && (
        <ul className="flex flex-wrap gap-1" aria-label={t.inventory.techLabel}>
          {item.tech.map((x) => (
            <li key={x} className="fp-chip">
              {x}
            </li>
          ))}
        </ul>
      )}
      {item.links && item.links.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {item.links.map((l) => (
            <ExtLink key={l.href} href={l.href}>
              {l.label}
            </ExtLink>
          ))}
        </div>
      )}
    </article>
  )
}

function Projects({ t }: PanelProps) {
  const inv = t.inventory
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {inv.items.map((it) => (
          <ProjectCard key={it.id} item={it} t={t} />
        ))}
      </div>
      <H3>{inv.gearTitle}</H3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {inv.gear.map((g) => (
          <li key={g.id} className="fp-card px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.9rem] font-bold">{g.name}</span>
              <span className="fp-muted text-[0.72rem]">{g.tag}</span>
            </div>
            {g.level != null && <Bar value={g.level} className="mt-1.5" />}
          </li>
        ))}
      </ul>
    </>
  )
}

function ItemDetail({ item, t, picked, onClose }: { item: Item; t: Content; picked: boolean; onClose: () => void }) {
  const g = t.goods
  return (
    <aside className="fp-detail" data-picked={picked || undefined} aria-live="polite">
      <button type="button" className="fp-close fp-detail-close" onClick={onClose} aria-label={t.flight.hud.close}>
        <X className="size-3.5" />
      </button>
      <div key={item.id} className="flex items-center gap-3 duration-200 animate-in fade-in md:flex-col md:text-center">
        <span className="fp-slot fp-slot-big" data-rarity={item.rarity}>
          <img src={itemIcon(item.icon, item.id)} alt="" width={128} height={128} decoding="async" />
        </span>
        <div className="min-w-0 max-md:pr-8">
          <p className="fp-rarity" data-rarity={item.rarity}>
            {t.inventory.rarity[item.rarity]}
          </p>
          <h3 className="poster text-[1.3rem] leading-none md:text-[1.5rem]">{item.name}</h3>
          <p className="fp-muted mt-0.5 text-[0.76rem]">{item.tag}</p>
        </div>
      </div>
      <p className="mt-2.5 text-[0.86rem] leading-snug">{item.desc}</p>
      {(item.count || (item.spec && item.spec.length > 0)) && (
        <dl className="mt-2.5 grid gap-1 border-t border-[var(--fp-line)] pt-2 text-[0.78rem]" aria-label={g.specLabel}>
          {item.count && (
            <div className="flex justify-between gap-3">
              <dt className="fp-muted">{g.countLabel}</dt>
              <dd className="text-right font-bold">{item.count}</dd>
            </div>
          )}
          {item.spec?.map((r) => (
            <div key={r.label} className="flex justify-between gap-3">
              <dt className="fp-muted shrink-0">{r.label}</dt>
              <dd className="text-right font-bold">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  )
}

function Goods({ t }: PanelProps) {
  const g = t.goods
  const all = g.groups.flatMap((grp) => grp.items)
  const [selId, setSelId] = useState(all[0]?.id)
  /** mobiilissa tietokortti näkyy vasta valinnan jälkeen (työpöydällä aina sivussa) */
  const [picked, setPicked] = useState(false)
  const pick = (id: string) => {
    setSelId(id)
    setPicked(true)
  }
  const sel = all.find((x) => x.id === selId) ?? all[0]
  const values: Record<string, string> = { repos: String(gh.repos.length), commits: String(gh.contributions.total) }
  return (
    <>
      <p className="fp-lead">{g.lead.split('. ').slice(0, 1).join('. ')}.</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {g.resources.map((r) => (
          <li key={r.id} className="fp-card flex min-w-0 items-center gap-1.5 py-1.5 pl-1 pr-3 sm:flex-[1_1_auto]">
            <img src={itemIcon(r.icon)} alt="" width={36} height={36} loading="lazy" decoding="async" className="fp-res-icon" />
            <span className="min-w-0">
              <b className="poster block text-[1.05rem] leading-none tabular-nums">{r.value ?? (r.key && values[r.key]) ?? '—'}</b>
              <span className="fp-muted block whitespace-nowrap text-[0.64rem] leading-tight">{r.label}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="fp-muted mt-4 text-[0.78rem]">{t.flight.itemsHint}</p>
      <div className="mt-2 grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start">
        <div>
          {g.groups.map((grp) => (
            <section key={grp.id} className="mt-5 first:mt-0">
              <H3>
                {grp.title} <span className="fp-muted">· {grp.items.length}</span>
              </H3>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
                {grp.items.map((it) => (
                  <li key={it.id}>
                    <button
                      type="button"
                      className="fp-slot"
                      data-rarity={it.rarity}
                      aria-pressed={it.id === sel?.id}
                      onClick={() => pick(it.id)}
                      onFocus={() => pick(it.id)}
                      onPointerEnter={(e) => e.pointerType === 'mouse' && setSelId(it.id)}
                    >
                      <img src={itemIcon(it.icon, it.id)} alt="" width={64} height={64} loading="lazy" decoding="async" />
                      <span className="fp-slot-name">{it.name}</span>
                      {it.count && <span className="fp-slot-count">{it.count}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {sel && <ItemDetail item={sel} t={t} picked={picked} onClose={() => setPicked(false)} />}
      </div>
    </>
  )
}

function Havaida({ t, onFly }: PanelProps) {
  const o = t.order
  return (
    <>
      <p className="poster text-[1.6rem] leading-none">{o.name}</p>
      <p className="fp-accent mt-1 text-[0.9rem] font-bold">{o.tagline}</p>
      <p className="fp-muted mt-1 text-[0.75rem]">{o.founded}</p>
      <p className="mt-3 text-[0.95rem] leading-relaxed">{o.desc}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {o.services.map((s) => (
          <section key={s.title} className="fp-card p-3">
            <h3 className="text-[0.92rem] font-extrabold leading-tight">{s.title}</h3>
            <p className="fp-muted mt-1 text-[0.82rem] leading-snug">{s.text}</p>
          </section>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ExtLink href={o.link.href} className="fp-btn-solid">
          {o.link.label}
        </ExtLink>
        <button type="button" className="fp-btn" onClick={() => onFly('lighthouse')}>
          <Mail className="size-3.5" aria-hidden />
          {o.cta.label}
        </button>
      </div>
    </>
  )
}

function QuestCard({ q, t, big }: { q: Quest; t: Content; big?: boolean }) {
  const qs = t.quests
  return (
    <article className={cn('fp-card p-3', big && 'p-4')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={cn('font-extrabold leading-tight', big ? 'text-[1.15rem]' : 'text-[0.95rem]')}>{q.title}</h3>
          {q.giver && <p className="fp-muted text-[0.72rem]">{q.giver}</p>}
        </div>
        <span className="fp-chip shrink-0">{qs.status[q.status]}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Bar value={q.progress} className="flex-1" />
        <span className="fp-muted text-[0.72rem] tabular-nums">{q.progress} %</span>
      </div>
      <p className="mt-2 text-[0.88rem] leading-snug">{q.desc}</p>
      {big && (
        <ul className="mt-2 grid gap-1" aria-label={qs.objectives}>
          {q.objectives.map((o) => (
            <li key={o.text} className={cn('flex items-start gap-2 text-[0.86rem]', o.done && 'fp-muted line-through decoration-1')}>
              {o.done ? <Check className="fp-accent mt-0.5 size-4 shrink-0" /> : <Circle className="mt-1 size-3 shrink-0 opacity-50" />}
              {o.text}
            </li>
          ))}
        </ul>
      )}
      {big && q.reward && (
        <p className="mt-2 text-[0.8rem]">
          <span className="fp-muted">{qs.reward}: </span>
          <b>{q.reward}</b>
        </p>
      )}
    </article>
  )
}

function Quests({ t }: PanelProps) {
  const q = t.quests
  return (
    <>
      <p className="fp-lead">{q.lead}</p>
      <H3>{q.mainTitle}</H3>
      <QuestCard q={q.main} t={t} big />
      <H3>{q.sideTitle}</H3>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.side.map((s) => (
          <QuestCard key={s.id} q={s} t={t} />
        ))}
      </div>
    </>
  )
}

function MapPanel({ t }: PanelProps) {
  const m = t.map
  const kinds = (['home', 'travel', 'bucket', 'quest'] as const).filter((k) => m.markers.some((x) => x.kind === k))
  return (
    <>
      {m.routes.length > 0 && (
        <p className="fp-card fp-accent px-3 py-2 text-[0.95rem] font-bold">
          <Plane className="mr-2 inline size-4 -translate-y-px" aria-hidden />
          {m.routes.map((r) => r.label).join(' · ')}
        </p>
      )}
      {kinds.map((k) => (
        <section key={k} className="mt-5 first:mt-0">
          <H3>{m.legend[k] ?? k}</H3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {m.markers
              .filter((x) => x.kind === k)
              .map((x) => (
                <li key={x.id} className="fp-card px-3 py-2">
                  <p className="text-[0.92rem] font-bold leading-tight">{x.name}</p>
                  <p className="fp-muted text-[0.72rem]">{x.caption}</p>
                  <p className="mt-1 text-[0.84rem] leading-snug">{x.desc}</p>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </>
  )
}

function Contact({ t }: PanelProps) {
  const c = t.codex
  const refs = c.references
  const items = refs.items.filter((r) => SHOW_DRAFTS || !r.draft)
  return (
    <>
      <p className="fp-lead">{c.lead}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {c.links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target={/^https?:/.test(l.href) ? '_blank' : undefined}
              rel="noreferrer"
              className="fp-card fp-hover flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <span className="min-w-0">
                <span className="fp-muted block text-[0.7rem]">{l.label}</span>
                <span className="block truncate text-[0.95rem] font-bold">{l.value}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 opacity-60" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <H3>{refs.title}</H3>
      {items.length === 0 ? (
        <p className="fp-muted text-[0.88rem]">{refs.empty}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((r) => (
            <figure key={r.name} className="fp-card flex gap-3 p-3">
              {r.photo && (
                <img src={r.photo.src} alt="" width={48} height={48} loading="lazy" className="size-12 shrink-0 rounded-full object-cover" />
              )}
              <div className="min-w-0">
                <blockquote className="text-[0.86rem] leading-snug">“{r.quote}”</blockquote>
                <figcaption className="fp-muted mt-1.5 text-[0.72rem]">
                  <b className="fp-ink">{r.name}</b> · {r.role}
                  {r.org ? `, ${r.org}` : ''}
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      )}
    </>
  )
}

export const PANELS: Record<FlightStation, (p: PanelProps) => ReactNode> = {
  dock: Howto,
  sauna: About,
  workshop: Skills,
  island: Projects,
  shed: Goods,
  harbor: Havaida,
  campfire: Quests,
  tower: MapPanel,
  lighthouse: Contact,
}
