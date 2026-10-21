import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUpRight, AtSign, BadgeCheck, Check, Circle, Globe, Mail, MapPin, PenLine, Quote, Send, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Picture } from '@/components/Picture'
import { TechIcon, hasTechIcon } from '@/components/TechIcon'
import { useLang } from '@/hooks/useLang'
import { images, links, type PortfolioSection, type Quest } from '@/content'
import { SHOW_DRAFTS } from '@/lib/env'
import { cn } from '@/lib/utils'
import { goToSection, sectionId } from './nav'

const INFO_ICONS = [User, AtSign, MapPin, BadgeCheck]
const chip = 'rounded-full border border-line px-2.5 py-0.5 text-[0.72rem] text-ink-2'
const card = 'rounded-sm border border-line bg-bg-2/60'
const field =
  'w-full rounded-sm border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted-foreground/70 outline-none transition-colors focus-visible:border-brass'

/** Osion runko: numeroitu otsikko, ingressi ja sisältö */
function Section({
  id,
  index,
  title,
  lead,
  kicker,
  children,
  className,
}: {
  id: PortfolioSection
  index: string
  title: string
  lead?: string
  kicker?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={sectionId(id)} tabIndex={-1} aria-labelledby={`${sectionId(id)}-title`} className={cn('scroll-mt-16 outline-none', className)}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <header className="mb-12 flex max-w-2xl flex-col gap-3">
          <p className="flex items-center gap-3 font-display text-[0.7rem] uppercase tracking-[0.28em] text-brass">
            <span className="tabular-nums text-muted-foreground">{index}</span>
            <span className="h-px w-8 bg-line-2" aria-hidden />
            {kicker ?? title}
          </p>
          <h2 id={`${sectionId(id)}-title`} className="text-3xl tracking-[0.03em] text-ink [text-wrap:balance] sm:text-4xl">
            {title}
          </h2>
          {lead && <p className="text-[1.02rem] leading-relaxed text-ink-2">{lead}</p>}
        </header>
        {children}
      </div>
    </section>
  )
}

function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/70"
      >
        <div className="h-full rounded-full bg-gradient-to-r from-ember to-brass" style={{ width: `${value}%` }} />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{value} %</span>
    </div>
  )
}

function Socials() {
  const { t } = useLang()
  const items = [
    { href: links.github, label: 'GitHub', icon: <TechIcon name="github" brandColor={false} className="size-4" /> },
    { href: links.instagram, label: 'Instagram', icon: <TechIcon name="instagram" brandColor={false} className="size-4" /> },
    { href: links.havaida, label: 'Havaida', icon: <Globe className="size-4" /> },
    { href: `mailto:${links.email}`, label: t.codex.info[1]?.label ?? 'Email', icon: <Mail className="size-4" /> },
  ]
  return (
    <ul className="flex items-center gap-2">
      {items.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target={s.href.startsWith('mailto:') ? undefined : '_blank'}
            rel="noreferrer noopener"
            aria-label={s.label}
            title={s.label}
            className="grid size-10 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-brass hover:text-brass-2"
          >
            {s.icon}
          </a>
        </li>
      ))}
    </ul>
  )
}

/* ---------- Hero ---------- */
export function Hero() {
  const { t } = useLang()
  const h = t.portfolio.hero
  const c = t.codex
  return (
    <section id="pf-hero" aria-labelledby="pf-hero-title" className="relative -mt-16 overflow-hidden pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_65%_at_80%_38%,rgba(201,168,106,0.13),transparent_70%),radial-gradient(45%_55%_at_5%_100%,rgba(194,80,46,0.10),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-10 sm:px-6 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-16">
        <div className="flex flex-col items-start gap-7 duration-700 animate-in fade-in slide-in-from-bottom-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-2/70 px-3 py-1 text-xs font-semibold text-ink-2">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-50 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-green" />
            </span>
            {h.available}
          </p>
          <div>
            <p className="label-caps text-brass">{h.eyebrow}</p>
            <h1 id="pf-hero-title" className="mt-3 text-[2.9rem] leading-[1.02] tracking-[0.03em] text-ink sm:text-6xl lg:text-7xl">
              {t.name}
            </h1>
            <p className="mt-5 max-w-[26ch] text-xl font-semibold leading-snug text-ink-2 [text-wrap:balance] sm:text-2xl">{h.title}</p>
          </div>
          <p className="max-w-[58ch] text-[1.02rem] leading-relaxed text-muted-foreground">{h.lead}</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="rounded-full px-6" onClick={() => goToSection('contact')}>
              <Mail />
              {h.contact}
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-line-2 px-6" onClick={() => goToSection('projects')}>
              {h.projects}
              <ArrowDown />
            </Button>
          </div>
          <Socials />
        </div>

        <figure className="relative mx-auto w-full max-w-[400px] duration-1000 animate-in fade-in zoom-in-95 lg:max-w-none">
          <div className="absolute -inset-3 rounded-sm border border-line/70" aria-hidden />
          <div className="absolute -right-3 -top-3 size-10 border-r-2 border-t-2 border-brass" aria-hidden />
          <div className="absolute -bottom-3 -left-3 size-10 border-b-2 border-l-2 border-brass" aria-hidden />
          <Picture image={c.portrait} priority className="relative aspect-[4/5] rounded-sm" imgClassName="object-[50%_22%]" />
          <figcaption className="absolute -bottom-6 left-5 rounded-sm border border-line bg-bg-2/95 px-4 py-3 shadow-lg backdrop-blur">
            <p className="font-display text-sm tracking-[0.06em] text-ink">{t.order.name}</p>
            <p className="text-xs text-muted-foreground">{t.order.founded}</p>
          </figcaption>
        </figure>
      </div>

      <div className="relative border-y border-line/60 bg-bg-2/50">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
          {c.stats.map((s, i) => (
            <div key={s.label} className={cn('flex flex-col-reverse gap-1 py-7', i % 2 === 1 && 'pl-6 md:pl-0', i > 0 && 'md:border-l md:border-line/60 md:pl-8')}>
              <dt className="text-[0.72rem] uppercase leading-snug tracking-wider text-muted-foreground">{s.label}</dt>
              <dd className="font-display text-3xl tabular-nums text-brass-2 sm:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ---------- Minusta ---------- */
export function About() {
  const { t } = useLang()
  const c = t.codex
  const nav = t.portfolio.nav
  return (
    <Section id="about" index="01" title={c.book.entries.about.title} kicker={nav[0].label}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <p className="text-lg leading-relaxed text-ink-2 sm:text-xl">{c.paragraphs[0]}</p>
          <div>
            <h3 className="label-caps mb-2 text-brass">{c.book.sections.free}</h3>
            <p className="text-[1.02rem] leading-relaxed text-ink-2">{c.paragraphs[1]}</p>
          </div>
          <figure className="mt-2 border-l-2 border-ember/70 pl-5">
            <Quote className="mb-2 size-5 text-ember" aria-hidden />
            <blockquote className="font-display text-xl italic leading-snug text-ink [text-wrap:balance] sm:text-2xl">{c.quote}</blockquote>
            <figcaption className="label-caps mt-3 text-brass">— {t.name}</figcaption>
          </figure>
        </div>
        <dl className={cn(card, 'h-fit divide-y divide-line/70 px-5')}>
          {c.info.map((row, i) => {
            const Icon = INFO_ICONS[i % INFO_ICONS.length]
            return (
              <div key={row.label} className="flex items-center gap-4 py-4">
                <Icon className="size-4 shrink-0 text-brass" aria-hidden />
                <dt className="w-28 shrink-0 text-xs uppercase tracking-wider text-muted-foreground">{row.label}</dt>
                <dd className="min-w-0 break-words text-sm font-semibold text-ink">
                  {row.href ? (
                    <a href={row.href} className="hover:text-brass-2 hover:underline">
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </Section>
  )
}

/* ---------- Osaaminen: osaamisalueet, taitomatriisi, työkalut ---------- */
export function Skills() {
  const { t } = useLang()
  const p = t.portfolio
  const inv = t.inventory
  return (
    <Section id="skills" index="02" title={p.skills.title} lead={p.skills.lead} className="border-t border-line/50 bg-bg-2/30">
      <h3 className="label-caps mb-4 text-brass">{p.focus.title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {inv.gear.map((g) => (
          <article key={g.id} className={cn(card, 'flex flex-col gap-4 p-5 transition-colors hover:border-line-2')}>
            <div className="flex items-center gap-4">
              <img src={g.icon} alt="" width={56} height={56} loading="lazy" className="size-14 shrink-0 rounded-full object-cover ring-1 ring-line" />
              <div className="min-w-0">
                <h4 className="font-display text-base tracking-[0.04em] text-ink">{g.name}</h4>
                <p className="text-[0.7rem] uppercase tracking-wider text-brass">{g.tag}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-ink-2">{g.desc}</p>
            {g.tech && (
              <ul className="mt-auto flex flex-wrap gap-1.5">
                {g.tech.map((x) => (
                  <li key={x} className={chip}>
                    {x}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {t.skills.branches.map((b) => (
          <div key={b.title} className={cn(card, 'p-5')}>
            <h3 className="font-display text-base tracking-[0.04em] text-ink">{b.title}</h3>
            <ul className="mt-5 flex flex-col gap-4">
              {b.nodes.map((n) => (
                <li key={n.name}>
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center text-ink-2">
                      {hasTechIcon(n.icon) ? <TechIcon name={n.icon} className="size-4" /> : <Circle className="size-2 fill-brass text-brass" />}
                    </span>
                    <span className="text-sm font-semibold text-ink">{n.name}</span>
                    <div className="ml-auto h-1 w-20 overflow-hidden rounded-full bg-line/70" role="meter" aria-label={n.name} aria-valuenow={n.level} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full rounded-full bg-brass" style={{ width: `${n.level}%` }} />
                    </div>
                  </div>
                  <p className="ml-[1.875rem] mt-0.5 text-xs text-muted-foreground">{n.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h3 className="label-caps mb-4 mt-14 text-brass">{p.skills.stack}</h3>
      <ul className="flex flex-wrap gap-3">
        {inv.languages.map((l) => (
          <li key={l.id} className="flex items-center gap-3 rounded-full border border-line bg-bg/60 py-2 pl-3 pr-4">
            {l.logo && <TechIcon name={l.logo} className="size-5" />}
            <span className="text-sm font-semibold text-ink">{l.name}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">{l.tag}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ---------- Projektit ---------- */
export function Projects() {
  const { t } = useLang()
  const p = t.portfolio
  const more = t.loft.zones.filter((z) => z.link)
  return (
    <Section id="projects" index="03" title={p.projects.title} lead={p.projects.lead}>
      <div className="grid gap-5 md:grid-cols-2">
        {t.inventory.items.map((it) => (
          <article key={it.id} className={cn(card, 'group flex flex-col gap-5 p-6 transition-colors hover:border-line-2 sm:flex-row')}>
            <img
              src={it.icon}
              alt=""
              width={112}
              height={112}
              loading="lazy"
              className="size-24 shrink-0 rounded-sm object-cover ring-1 ring-line transition-transform duration-500 group-hover:scale-[1.03] sm:size-28"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="text-xl tracking-[0.03em] text-ink">{it.name}</h3>
                {it.status && (
                  <span className="rounded-full border border-brass/50 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-brass-2">{it.status}</span>
                )}
              </div>
              <p className="-mt-1 text-[0.72rem] uppercase tracking-wider text-brass">{it.tag}</p>
              <p className="text-sm leading-relaxed text-ink-2">{it.desc}</p>
              {it.tech && (
                <ul className="flex flex-wrap gap-1.5">
                  {it.tech.map((x) => (
                    <li key={x} className={chip}>
                      {x}
                    </li>
                  ))}
                </ul>
              )}
              {it.links && (
                <div className="mt-auto flex flex-wrap gap-4 pt-1">
                  {it.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-brass-2">
                      {l.label}
                      <ArrowUpRight className="size-3.5 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {more.length > 0 && (
        <>
          <h3 className="label-caps mb-4 mt-14 text-brass">{p.projects.more}</h3>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((z) => (
              <li key={z.id}>
                <a
                  href={z.link!.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cn(card, 'group flex h-full flex-col gap-2 p-5 transition-colors hover:border-brass/60')}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold text-ink group-hover:text-brass-2">{z.link!.label}</span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brass-2" />
                  </span>
                  <span className="text-sm leading-relaxed text-ink-2">{z.link!.desc}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  )
}

/* ---------- Työn alla (tehtävät) ---------- */
function QuestStatus({ q }: { q: Quest }) {
  const { t } = useLang()
  const tone =
    q.status === 'done'
      ? 'border-green/50 text-green'
      : q.status === 'active'
        ? 'border-ember-2/50 text-ember-2'
        : 'border-line-2 text-muted-foreground'
  return <span className={cn('rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider', tone)}>{t.quests.status[q.status]}</span>
}

export function Now() {
  const { t } = useLang()
  const p = t.portfolio
  const q = t.quests
  const main = q.main
  return (
    <Section id="now" index="04" title={p.now.title} lead={p.now.lead} className="border-t border-line/50 bg-bg-2/30">
      <article className={cn(card, 'relative overflow-hidden p-6 sm:p-8')}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_100%_0%,rgba(194,80,46,0.12),transparent_70%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="label-caps text-brass">{p.now.main}</span>
              <QuestStatus q={main} />
            </div>
            <h3 className="text-2xl tracking-[0.03em] text-ink sm:text-3xl">{main.title}</h3>
            {main.giver && <p className="text-xs uppercase tracking-wider text-muted-foreground">{main.giver}</p>}
            <p className="text-[1.02rem] leading-relaxed text-ink-2">{main.desc}</p>
            <Progress value={main.progress} label={q.progress} />
            {main.links && (
              <div className="flex flex-wrap gap-4">
                {main.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-brass-2">
                    {l.label}
                    <ArrowUpRight className="size-3.5 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="label-caps mb-3">{q.objectives}</p>
            <ul className="flex flex-col gap-2.5">
              {main.objectives.map((o) => (
                <li key={o.text} className="flex items-start gap-3 text-sm">
                  <span
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border',
                      o.done ? 'border-green/60 bg-green/15 text-green' : 'border-line-2 text-transparent',
                    )}
                    aria-hidden
                  >
                    <Check className="size-3" />
                  </span>
                  <span className={o.done ? 'text-ink-2' : 'text-ink'}>{o.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <h3 className="label-caps mb-4 mt-12 text-brass">{p.now.side}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.side.map((s) => (
          <article key={s.id} className={cn(card, 'flex flex-col gap-3 p-5')}>
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-display text-base tracking-[0.04em] text-ink">{s.title}</h4>
              <QuestStatus q={s} />
            </div>
            <p className="text-sm leading-relaxed text-ink-2">{s.desc}</p>
            <div className="mt-auto pt-1">
              <Progress value={s.progress} label={`${s.title}: ${q.progress}`} />
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}

/* ---------- Havaida ---------- */
export function Havaida() {
  const { t } = useLang()
  const o = t.order
  return (
    <Section id="havaida" index="05" title={o.name} kicker={t.portfolio.havaida.kicker}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
        <figure className="relative">
          <Picture image={{ ...images.havaida, alt: o.name }} className="aspect-[8/5] rounded-sm ring-1 ring-line" />
          <figcaption className="mt-3 text-xs text-muted-foreground">{o.founded}</figcaption>
        </figure>
        <div className="flex flex-col gap-6">
          <p className="font-display text-xl italic text-brass-2">{o.tagline}</p>
          <p className="text-[1.02rem] leading-relaxed text-ink-2">{o.desc}</p>
          <ol className="flex flex-col divide-y divide-line/70 border-y border-line/70">
            {o.services.map((s, i) => (
              <li key={s.title} className="flex gap-4 py-4">
                <span className="font-display text-sm tabular-nums text-brass">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-[0.98rem] font-bold tracking-normal text-ink [font-family:var(--font-body)]">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <a href={o.link.href} target="_blank" rel="noreferrer noopener">
                {o.link.label}
                <ArrowUpRight />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-line-2 px-6" onClick={() => goToSection('contact')}>
              <Mail />
              {o.cta.label}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ---------- Suosittelijat ---------- */
export function References() {
  const { t } = useLang()
  const r = t.codex.references
  const items = r.items.filter((it) => SHOW_DRAFTS || !it.draft)
  const write = () => goToSection('contact', 'pf-message')
  return (
    <Section id="refs" index="06" title={r.title} lead={r.lead} className="border-t border-line/50 bg-bg-2/30">
      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <figure key={it.name} className={cn(card, 'flex flex-col overflow-hidden')}>
              {it.photo ? (
                <Picture image={{ ...it.photo, sizes: '(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw' }} className="aspect-[4/3]" imgClassName="object-[50%_18%]" />
              ) : (
                <div className="grid aspect-[4/3] place-items-center bg-bg font-display text-4xl text-brass-2">{it.name.slice(0, 1)}</div>
              )}
              <div className="flex flex-1 flex-col gap-4 p-5">
                <blockquote className="text-[0.95rem] leading-relaxed text-ink-2">
                  <Quote className="mb-2 size-4 text-ember" aria-hidden />
                  {it.quote}
                </blockquote>
                <figcaption className="mt-auto">
                  <p className="font-display text-base tracking-[0.04em] text-ink">{it.name}</p>
                  {(it.role || it.org) && <p className="text-xs text-muted-foreground">{[it.role, it.org].filter(Boolean).join(' · ')}</p>}
                  {it.href && (
                    <a href={it.href} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink hover:text-brass-2">
                      {r.profile}
                      <ArrowUpRight className="size-3" />
                    </a>
                  )}
                  {it.draft && <p className="mt-3 w-fit border border-dashed border-ember/60 px-2 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-ember-2">{r.draft}</p>}
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      ) : (
        <p className="max-w-2xl text-[1.02rem] leading-relaxed text-ink-2">{r.empty}</p>
      )}
      <Button variant="outline" className="mt-10 rounded-full border-line-2 px-5" onClick={write}>
        <PenLine />
        {r.cta}
      </Button>
    </Section>
  )
}

/* ---------- Yhteys ---------- */
export function Contact() {
  const { t } = useLang()
  const p = t.portfolio
  const c = t.codex
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const email = c.info[1]?.value ?? links.email

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const body = `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ''}`
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(c.form.subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <Section id="contact" index="07" title={p.contact.title} lead={p.contact.lead}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="flex flex-col gap-6">
          <div>
            <p className="label-caps mb-2">{p.contact.direct}</p>
            <a href={`mailto:${email}`} className="break-all text-2xl font-bold text-brass-2 hover:underline sm:text-3xl">
              {email}
            </a>
          </div>
          <ul className="divide-y divide-line/70 border-y border-line/70">
            {c.links
              .filter((l) => !l.href.startsWith('mailto:'))
              .map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noreferrer noopener" className="group flex items-center gap-4 py-3.5 text-sm">
                    <span className="w-24 shrink-0 text-xs uppercase tracking-wider text-muted-foreground">{l.label}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink group-hover:text-brass-2">{l.value}</span>
                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-brass-2" />
                  </a>
                </li>
              ))}
          </ul>
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <MapPin className="size-4 text-brass" aria-hidden />
            {c.info[2]?.value} · {t.ui.place}
          </p>
        </div>

        <form onSubmit={onSubmit} className={cn(card, 'grid gap-4 p-5 sm:p-7')}>
          <h3 className="font-display text-lg tracking-[0.04em] text-ink">{c.contactTitle}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
              {c.form.name}
              <input name="name" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
              {c.form.email}
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={field}
              />
            </label>
          </div>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            {c.form.message}
            <textarea
              id="pf-message"
              name="message"
              required
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={cn(field, 'resize-y')}
            />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" className="rounded-full px-6">
              {c.form.submit}
              <Send />
            </Button>
            <p className="text-xs text-muted-foreground">{c.form.hint}</p>
          </div>
        </form>
      </div>
    </Section>
  )
}
