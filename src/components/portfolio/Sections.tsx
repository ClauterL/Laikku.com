import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  AtSign,
  BadgeCheck,
  Check,
  Circle,
  Copy,
  Globe,
  Mail,
  MapPin,
  MousePointer2,
  Pause,
  PenLine,
  Play,
  Quote,
  Send,
  User,
} from 'lucide-react'

import { Picture } from '@/components/Picture'
import { TechIcon, hasTechIcon } from '@/components/TechIcon'
import { useLang } from '@/hooks/useLang'
import { images, links, pfIcons, type PortfolioSection, type Quest } from '@/content'
import { SHOW_DRAFTS } from '@/lib/env'
import { sendContact } from '@/lib/contact'
import {
  ACTIVE_MIN,
  ACTIVE_POOL,
  DIFFICULTIES,
  fill,
  fmtDate,
  fmtNum,
  hasLeetCode,
  langIcon,
  langLabel,
  leetcode,
  poolMillions,
  RANK_SCALE,
  topicUrl,
  topPercent,
} from '@/lib/leetcode'
import { cn } from '@/lib/utils'
import { Reveal, spotHandlers, useCountUp, useInView, useReducedMotion } from './hooks'
import { Critter, WalkingBear } from './Critters'
import { HeroScene } from './Landscape'
import { Marquee } from './Marquee'
import { goToSection, sectionId } from './nav'

const INFO_ICONS = [User, AtSign, MapPin, BadgeCheck]
const card = 'rounded-2xl border border-pf-line bg-pf-bg-2/70'
const chip = 'rounded-full border border-pf-line-2/70 bg-pf-bg/40 px-2.5 py-0.5 text-[0.72rem] font-semibold text-pf-ink-2'
const btn =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.98] cursor-pointer [&_svg]:size-4'
const btnPrimary = `${btn} bg-pf-orange text-pf-bg hover:bg-pf-sun`
const btnGhost = `${btn} border border-pf-line-2 text-pf-ink hover:border-pf-orange hover:text-pf-orange`
const field =
  'w-full rounded-xl border border-pf-line bg-pf-bg px-3.5 py-2.5 text-sm text-pf-ink placeholder:text-pf-muted/70 outline-none transition-colors focus-visible:border-pf-orange'

/** Osion runko: numero, otsikko julistefontilla, ingressi */
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
    <section id={sectionId(id)} tabIndex={-1} aria-labelledby={`${sectionId(id)}-title`} className={cn('relative scroll-mt-16 outline-none', className)}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal as="header" className="mb-12 flex max-w-3xl flex-col gap-4">
          <p className="flex items-center gap-3 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-pf-orange">
            <span className="tabular-nums text-pf-muted">{index}</span>
            <span className="h-px w-10 bg-gradient-to-r from-pf-sun to-pf-red" aria-hidden />
            {kicker ?? title}
          </p>
          <h2 id={`${sectionId(id)}-title`} className="poster text-[clamp(2.1rem,5.4vw,3.8rem)] leading-[0.95] text-pf-ink [text-wrap:balance]">
            {title}
          </h2>
          {lead && <p className="max-w-2xl text-[1.05rem] leading-relaxed text-pf-ink-2">{lead}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  )
}

/** Edistymispalkki, joka täyttyy näkyviin tullessa */
function Bar({ value, label, thin }: { value: number; label: string; thin?: boolean }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <div className="flex items-center gap-3">
      <div
        ref={ref}
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn('flex-1 overflow-hidden rounded-full bg-pf-line/80', thin ? 'h-1' : 'h-1.5')}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-pf-red via-pf-orange to-pf-sun transition-[width] duration-[1200ms] ease-out"
          style={{ width: inView ? `${value}%` : '0%' }}
        />
      </div>
      {!thin && <span className="w-11 text-right text-xs font-semibold tabular-nums text-pf-muted">{value} %</span>}
    </div>
  )
}

function Socials({ light }: { light?: boolean }) {
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
            className={cn(
              'grid size-10 place-items-center rounded-full border transition-colors',
              light ? 'border-pf-deep/25 text-pf-deep hover:bg-pf-deep hover:text-pf-sky' : 'border-pf-line-2 text-pf-ink-2 hover:border-pf-orange hover:text-pf-orange',
            )}
          >
            {s.icon}
          </a>
        </li>
      ))}
    </ul>
  )
}

/** "Rakennan ___" – sana vaihtuu muutaman sekunnin välein */
function RotatingWord({ words }: { words: string[] }) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduce || words.length < 2) return
    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), 2600)
    return () => window.clearInterval(id)
  }, [reduce, words.length])
  return (
    <span key={i} className="word-in inline-block bg-gradient-to-r from-pf-crimson via-pf-red to-pf-orange bg-clip-text text-transparent">
      {words[i % words.length]}
    </span>
  )
}

function Stat({ value, label, delay }: { value: string; label: string; delay: number }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const shown = useCountUp(value, inView)
  return (
    <Reveal delay={delay} className="flex flex-col-reverse gap-1.5 py-7">
      <dt className="text-[0.74rem] font-semibold uppercase leading-snug tracking-wider text-pf-muted">{label}</dt>
      <dd className="poster text-4xl tabular-nums text-pf-sun sm:text-5xl">
        <div ref={ref}>{shown}</div>
      </dd>
    </Reveal>
  )
}

/* ---------- Hero ----------
   Taivas on CSS-liukuväri, maisema HeroScene (Higgsfield-tasot) ankkuroituna alareunaan. Sisältö on
   normaalissa virrassa ja sen alla varataan tila maisemalle, joten teksti ei koskaan mene metsän päälle:
   matalilla näytöillä hero vain kasvaa. Muotokuvakortti seisoo maiseman edessä (md+), mobiilissa avatar. */
export function Hero() {
  const { t } = useLang()
  const h = t.portfolio.hero
  return (
    <section id="pf-hero" aria-labelledby="pf-hero-title" className="@container relative isolate overflow-hidden">
      <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[linear-gradient(180deg,#fde4cd_0%,#fdd6b5_42%,#fcc297_72%,#f9a874_100%)]">
        <HeroScene />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6 sm:pt-28">
          <div className="flex items-center gap-3 duration-700 animate-in fade-in">
            <img
              src={h.photo.src}
              alt=""
              width={h.photo.width}
              height={h.photo.height}
              className="size-12 shrink-0 rounded-full object-cover object-[50%_14%] ring-2 ring-white/60 md:hidden"
            />
            <p className="inline-flex items-center gap-2 rounded-full border border-pf-deep/15 bg-white/35 px-3 py-1 text-xs font-bold text-pf-deep backdrop-blur">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2f9e5b] opacity-50 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-[#2f9e5b]" />
              </span>
              {h.available}
            </p>
          </div>

          <div className="mt-6 text-pf-deep duration-700 animate-in fade-in slide-in-from-bottom-3">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-pf-plum">{h.eyebrow}</p>
            <h1 id="pf-hero-title" className="poster mt-3 text-[clamp(2.6rem,min(8.6vw,13svh),6.6rem)] leading-[0.88] text-pf-deep [text-wrap:balance]">
              {t.name}
            </h1>
          </div>

          <div className="relative mt-5 text-pf-deep md:pr-[250px] lg:pr-[310px] xl:pr-[330px]">
            <p className="whitespace-nowrap text-[clamp(1.3rem,3vw,2.1rem)] font-extrabold leading-tight [font-family:var(--font-poster)]">
              <span className="sr-only">{h.title}</span>
              <span aria-hidden>
                {h.build} <RotatingWord words={h.words} />
              </span>
            </p>
            <p className="mt-5 max-w-[56ch] text-[1.05rem] font-medium leading-relaxed text-pf-deep/80 duration-1000 animate-in fade-in">{h.lead}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 duration-1000 animate-in fade-in">
              <button type="button" className={`${btn} bg-pf-deep text-pf-sky hover:bg-pf-plum`} onClick={() => goToSection('contact')}>
                <Mail />
                {h.contact}
              </button>
              <button type="button" className={`${btn} border border-pf-deep/30 text-pf-deep hover:border-pf-deep hover:bg-pf-deep/5`} onClick={() => goToSection('projects')}>
                {h.projects}
                <ArrowDown />
              </button>
              <span className="mx-1 hidden h-6 w-px bg-pf-deep/20 sm:block" aria-hidden />
              <Socials light />
            </div>

            {/* muotokuva seisoo maiseman edessä */}
            <figure className="absolute right-0 top-0 hidden w-[220px] rotate-[2.5deg] 2xl:-right-24 rounded-2xl border border-white/45 bg-white/25 p-2 shadow-2xl shadow-pf-deep/30 backdrop-blur-md duration-1000 animate-in fade-in zoom-in-95 md:block lg:w-[270px] xl:w-[290px]">
              <Picture image={h.photo} priority className="aspect-[4/5] rounded-xl" imgClassName="object-[50%_16%]" />
              <figcaption className="px-1.5 pb-0.5 pt-2 text-pf-deep">
                <p className="poster text-[0.8rem]">{h.photoCaption}</p>
                <p className="text-[0.7rem] font-semibold opacity-75">{h.photoNote}</p>
              </figcaption>
            </figure>
          </div>
        </div>

        {/* tila maisemalle: ~86 % sen korkeudesta, ylin osa (puiden latvat, kaukaiset vaarat) saa jäädä sisällön taakse */}
        <div aria-hidden className="mt-auto h-[calc(max(104cqw,960px)/3.435*0.86)] shrink-0" />

        <button
          type="button"
          onClick={() => goToSection('about')}
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-pf-ink-2/80 hover:text-pf-ink"
        >
          <MousePointer2 className="size-3.5 rotate-[200deg]" aria-hidden />
          {h.scroll}
        </button>
      </div>

      {/* tilastot */}
      <div className="border-b border-pf-line bg-pf-bg">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 px-4 sm:px-6 md:grid-cols-4">
          {t.codex.stats.map((s, i) => (
            <Stat key={s.label} value={s.value} label={s.label} delay={i * 90} />
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
  return (
    <Section id="about" index="01" title={c.book.entries.about.title} kicker={t.portfolio.nav[0].label}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14">
        <div className="flex flex-col gap-8">
          <Reveal as="p" className="text-xl font-medium leading-relaxed text-pf-ink sm:text-2xl sm:leading-relaxed">
            {c.paragraphs[0]}
          </Reveal>
          <Reveal delay={80} className="grid gap-6 sm:grid-cols-2">
            <div className={cn(card, 'p-5')}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-pf-orange">{c.book.sections.free}</h3>
              <p className="leading-relaxed text-pf-ink-2">{c.paragraphs[1]}</p>
            </div>
            <figure className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pf-crimson via-pf-red to-pf-orange p-5 text-pf-sky">
              <Quote className="mb-2 size-6 opacity-80" aria-hidden />
              <blockquote className="text-lg font-bold leading-snug [font-family:var(--font-poster)]">{c.quote}</blockquote>
              <figcaption className="mt-3 text-xs font-bold uppercase tracking-[0.2em] opacity-80">— {t.name}</figcaption>
            </figure>
          </Reveal>
        </div>
        <Reveal delay={120} as="dl" className={cn(card, 'h-fit divide-y divide-pf-line px-5')}>
          {c.info.map((row, i) => {
            const Icon = INFO_ICONS[i % INFO_ICONS.length]
            return (
              <div key={row.label} className="flex items-center gap-4 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pf-orange/12 text-pf-orange">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-[0.7rem] font-bold uppercase tracking-wider text-pf-muted">{row.label}</dt>
                  <dd className="break-words text-sm font-bold text-pf-ink">
                    {row.href ? (
                      <a href={row.href} className="hover:text-pf-orange hover:underline">
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              </div>
            )
          })}
        </Reveal>
      </div>
    </Section>
  )
}

/* ---------- Osaaminen: bento, taitomatriisi, marquee ---------- */
export function Skills() {
  const { t } = useLang()
  const p = t.portfolio
  const inv = t.inventory
  const tools = useMemo(() => t.skills.branches.flatMap((b) => b.nodes), [t.skills.branches])
  return (
    <Section id="skills" index="02" title={p.skills.title} lead={p.skills.lead} className="bg-pf-bg-2/40">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-pf-orange">{p.focus.title}</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {inv.gear.map((g, i) => (
          <Reveal
            key={g.id}
            delay={i * 70}
            as="article"
            {...spotHandlers()}
            className={cn(card, 'spot flex flex-col gap-4 p-6 transition-colors hover:border-pf-line-2', i === 0 && 'lg:col-span-2')}
          >
            <div className="flex items-center gap-4">
              <img
                src={pfIcons[g.id] ?? g.icon}
                alt=""
                width={80}
                height={80}
                loading="lazy"
                className="size-16 shrink-0 rounded-2xl object-cover shadow-lg shadow-black/30 ring-1 ring-pf-line-2 sm:size-20"
              />
              <div className="min-w-0 flex-1">
                <h4 className="poster break-words text-lg text-pf-ink sm:text-xl">{g.name}</h4>
                <p className="text-[0.72rem] font-bold uppercase tracking-wider text-pf-orange">{g.tag}</p>
                {g.level !== undefined && (
                  <span className="mt-2 block w-28">
                    <Bar value={g.level} label={g.name} thin />
                  </span>
                )}
              </div>
            </div>
            <p className={cn('leading-relaxed text-pf-ink-2', i === 0 ? 'text-[1.02rem] lg:max-w-[60ch]' : 'text-sm')}>{g.desc}</p>
            {g.tech && (
              <ul className="mt-auto flex flex-wrap gap-1.5">
                {g.tech.map((x) => (
                  <li key={x} className={chip}>
                    {x}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        ))}
        {/* kielet ja työkalut logoina */}
        <Reveal delay={280} className={cn(card, 'relative flex flex-col gap-4 bg-gradient-to-br from-pf-bg-3 to-pf-bg-2 p-6 md:col-span-2 lg:col-span-1')}>
          {/* pesukarhu istuu kortin kulmassa ja pesee tassujaan */}
          <Critter kind="raccoon" className="pointer-events-none absolute right-5 top-3 h-[60px] text-pf-line-2" />
          <h4 className="poster pr-16 text-lg text-pf-ink">{p.skills.stack}</h4>
          <ul className="grid grid-cols-3 gap-2">
            {inv.languages.map((l) => (
              <li key={l.id} className="flex flex-col items-center gap-1.5 rounded-xl border border-pf-line bg-pf-bg/50 px-2 py-3 text-center" title={l.desc}>
                {l.logo && <TechIcon name={l.logo} className="size-6" />}
                <span className="text-[0.72rem] font-bold text-pf-ink">{l.name}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <div className="relative mb-4 mt-16">
        <h3 className="relative z-10 text-xs font-bold uppercase tracking-[0.22em] text-pf-orange">{p.skills.matrix}</h3>
        {/* karhu kävelee korttien yläreunaa pitkin (mobiilissa koko leveydellä otsikon takana, jotta pysähdys mahtuu) */}
        <WalkingBear className="-bottom-4 left-2 right-2 h-[52px] text-pf-line-2 md:left-[42%]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {t.skills.branches.map((b, bi) => (
          <Reveal key={b.title} delay={bi * 90} className={cn(card, 'p-6')}>
            <h4 className="poster text-base text-pf-ink">{b.title}</h4>
            <ul className="mt-5 flex flex-col gap-4">
              {b.nodes.map((n) => (
                <li key={n.name}>
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center text-pf-ink-2">
                      {hasTechIcon(n.icon) ? <TechIcon name={n.icon} className="size-4" /> : <Circle className="size-2 fill-pf-orange text-pf-orange" />}
                    </span>
                    <span className="text-sm font-bold text-pf-ink">{n.name}</span>
                    <span className="ml-auto w-20">
                      <Bar value={n.level} label={n.name} thin />
                    </span>
                  </div>
                  <p className="ml-[1.875rem] mt-0.5 text-xs text-pf-muted">{n.desc}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      {hasLeetCode && <LeetCodeStats />}

      {/* liukuva työkalunauha (vedettävissä, Marquee.tsx) */}
      <Marquee
        duration={38}
        className="mt-14 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        trackClassName="gap-3 py-1 pr-3 motion-reduce:flex-wrap"
        render={(copy) =>
          tools.map((n) => (
            <li
              key={n.name}
              aria-hidden={copy || undefined}
              className="flex shrink-0 items-center gap-2 rounded-full border border-pf-line bg-pf-bg/60 px-4 py-2"
            >
              {hasTechIcon(n.icon) && <TechIcon name={n.icon} className="size-4" />}
              <span className="text-sm font-bold text-pf-ink-2">{n.name}</span>
            </li>
          ))
        }
      />
    </Section>
  )
}

/* ---------- LeetCode (osa osaamista) ----------
   Luvut generoidusta datasta (scripts/fetch-leetcode.mjs): sijoitus, ratkaistut vaikeustasoittain,
   ratkaisukielet ja aihealueet. Rengas näyttää ratkaistujen jakauman vaikeustasoittain. */
const LC_COLOR = { easy: 'var(--pf-sun)', medium: 'var(--pf-orange)', hard: 'var(--pf-red)' } as const

function LcRing({ run }: { run: boolean }) {
  const r = 40
  const c = 2 * Math.PI * r
  const all = leetcode.solved.all || 1
  const gap = 3
  // segmentit peräkkäin: [vaikeustaso, pituus, alkukohta]
  const segs = DIFFICULTIES.map((k, i) => {
    const start = DIFFICULTIES.slice(0, i).reduce((sum, p) => sum + (leetcode.solved[p] / all) * c, 0)
    return [k, (leetcode.solved[k] / all) * c, start] as const
  })
  return (
    <div className="relative grid size-28 shrink-0 place-items-center sm:size-32">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--pf-line)" strokeWidth="8" />
        {segs.map(([k, len, start]) => (
          <circle
            key={k}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={LC_COLOR[k]}
            strokeWidth="8"
            strokeDasharray={`${run ? Math.max(len - gap, 0) : 0} ${c}`}
            strokeDashoffset={-start}
            className="transition-[stroke-dasharray] duration-1000 ease-out motion-reduce:transition-none"
          />
        ))}
      </svg>
      <span className="grid size-12 place-items-center rounded-full bg-pf-bg/70 ring-1 ring-pf-line-2 sm:size-14">
        <TechIcon name="leetcode" className="size-6 sm:size-7" />
      </span>
    </div>
  )
}

function LcBar({ value, max, color, run, label }: { value: number; max: number; color: string; run: boolean; label: string }) {
  const pct = Math.round((value / (max || 1)) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} className="h-1.5 flex-1 overflow-hidden rounded-full bg-pf-line/80">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none"
        style={{ width: run ? `${pct}%` : '0%', background: color }}
      />
    </div>
  )
}

/** Sijoitus sanallisesti + asteikko #1 → #5 000 000 (LeetCoden viimeinen sijoitettu) */
function LcRank({ rank, run }: { rank: number; run: boolean }) {
  const { t, lang } = useLang()
  const l = t.leetcode
  const pos = Math.max((rank / ACTIVE_POOL) * 100, 0.8)
  const vars = { pct: fmtNum(topPercent(rank), lang), pool: poolMillions(lang), min: String(ACTIVE_MIN), max: fmtNum(RANK_SCALE, lang) }
  return (
    <div className="rounded-xl border border-pf-sun/45 bg-[radial-gradient(130%_120%_at_0%_0%,rgba(249,178,51,0.2),transparent_60%)] px-4 py-4 shadow-[0_0_40px_-12px_rgba(249,178,51,0.45)]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.72rem] font-bold uppercase tracking-wider text-pf-muted">{l.rank}</span>
        <span className="poster text-lg tabular-nums text-pf-ink-2">#{fmtNum(rank, lang)}</span>
      </div>
      <p className="poster mt-1 bg-gradient-to-r from-pf-sun via-pf-amber to-pf-orange bg-clip-text text-[clamp(2.8rem,6vw,3.6rem)] leading-[0.95] text-transparent">
        {fill(l.topBadge, vars)}
      </p>
      <p className="mt-2 text-sm leading-snug text-pf-ink-2">
        <strong className="font-bold text-pf-ink">{fill(l.rankTop, vars)}</strong> {fill(l.rankBasis, vars)}
      </p>
      <div className="relative mt-3 h-1.5 rounded-full bg-[linear-gradient(90deg,var(--pf-sun),var(--pf-orange)_10%,var(--pf-line)_35%)]" aria-hidden>
        <span
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pf-sun shadow-[0_0_10px_rgba(249,178,51,0.7)] ring-2 ring-pf-bg transition-[left] duration-1000 ease-out motion-reduce:transition-none"
          style={{ left: run ? `${pos}%` : '50%' }}
        />
      </div>
      <div className="mt-1.5 flex justify-between gap-2 text-[0.66rem] font-semibold tabular-nums text-pf-muted">
        <span>#1 · {l.rankFirst}</span>
        <span className="text-right">{fill(l.rankLast, vars)}</span>
      </div>
      <p className="mt-2 text-[0.7rem] leading-snug text-pf-muted">{fill(l.rankNote, vars)}</p>
    </div>
  )
}

function LeetCodeStats() {
  const { t, lang } = useLang()
  const l = t.leetcode
  const d = leetcode
  const [ref, inView] = useInView<HTMLDivElement>()
  const shown = useCountUp(String(d.solved.all), inView)
  const maxLang = d.languages[0]?.solved ?? 1
  return (
    <>
      <h3 className="mb-4 mt-16 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-pf-orange">
        <TechIcon name="leetcode" className="size-4" />
        {l.title}
        {d.ranking && (
          <span className="ml-1 rounded-full bg-gradient-to-r from-pf-sun to-pf-orange px-2.5 py-0.5 text-[0.7rem] font-extrabold tracking-[0.12em] text-pf-bg shadow-[0_0_16px_rgba(249,178,51,0.45)]">
            {fill(l.topBadge, { pct: fmtNum(topPercent(d.ranking), lang) })}
          </span>
        )}
      </h3>
      <Reveal className={cn(card, 'p-6 lg:p-8')}>
        <p className="mb-6 max-w-[70ch] text-sm leading-relaxed text-pf-ink-2">{l.lead}</p>
        <div ref={ref} className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          {/* määrä, jakauma ja sijoitus */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-5">
              <LcRing run={inView} />
              <div className="min-w-0">
                <p className="poster whitespace-nowrap text-[clamp(2.4rem,5vw,3.2rem)] leading-none tabular-nums text-pf-ink">{fmtNum(Number(shown), lang)}</p>
                <p className="mt-2 text-[0.72rem] font-bold uppercase tracking-wider text-pf-muted">
                  {l.solved} <span className="whitespace-nowrap tabular-nums text-pf-ink-2">/ {fmtNum(d.total.all, lang)}</span>
                </p>
              </div>
            </div>
            {d.ranking && <LcRank rank={d.ranking} run={inView} />}
            <ul className="flex flex-col gap-3">
              {DIFFICULTIES.map((k) => (
                <li key={k}>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-bold" style={{ color: LC_COLOR[k] }}>
                      {l.difficulty[k]}
                    </span>
                    <span className="tabular-nums font-bold text-pf-ink">
                      {fmtNum(d.solved[k], lang)} <span className="font-semibold text-pf-muted">/ {fmtNum(d.total[k], lang)}</span>
                    </span>
                  </div>
                  <LcBar value={d.solved[k]} max={d.total[k]} color={LC_COLOR[k]} run={inView} label={l.difficulty[k]} />
                </li>
              ))}
            </ul>
          </div>

          {/* kielet */}
          <div>
            <h4 className="poster text-base text-pf-ink">{l.languages}</h4>
            <ul className="mt-4 flex flex-col gap-3">
              {d.languages.map((x) => {
                const icon = langIcon(x.name)
                return (
                  <li key={x.name} className="flex items-center gap-3">
                    <span className="grid size-5 shrink-0 place-items-center text-pf-ink-2">
                      {icon ? <TechIcon name={icon} className="size-4" /> : <Circle className="size-2 fill-pf-orange text-pf-orange" />}
                    </span>
                    <span className="w-24 shrink-0 text-sm font-bold text-pf-ink">{langLabel(x.name)}</span>
                    <LcBar value={x.solved} max={maxLang} color="linear-gradient(90deg,var(--pf-crimson),var(--pf-orange),var(--pf-sun))" run={inView} label={langLabel(x.name)} />
                    <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-pf-ink-2">{x.solved}</span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 text-xs text-pf-muted">{l.languagesNote}</p>
          </div>

          {/* aihealueet */}
          <div className="flex flex-col">
            <h4 className="poster text-base text-pf-ink">{l.topics}</h4>
            <ul className="mt-4 flex flex-wrap gap-2">
              {d.topics.slice(0, 12).map((tp) => (
                <li key={tp.slug}>
                  <a
                    href={topicUrl(tp.slug)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={cn(chip, 'inline-flex items-center gap-1.5 py-1 transition-colors hover:border-pf-orange hover:text-pf-ink')}
                  >
                    {tp.name}
                    <span className="tabular-nums text-pf-orange">{tp.solved}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
              <a href={d.url} target="_blank" rel="noreferrer noopener" className={cn(btnGhost, 'px-5 py-2.5')}>
                {l.profile}
                <ArrowUpRight />
              </a>
              {d.fetchedAt && (
                <span className="text-xs text-pf-muted">
                  {l.updated} {fmtDate(d.fetchedAt, lang)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </>
  )
}

/* ---------- Projektit ---------- */
/** Projektin kuvake; jos projektilla on selainversio, kuvake on linkki siihen (uusi välilehti) */
function ProjectIcon({ src, link, name }: { src: string; link?: { label: string; href: string }; name: string }) {
  const img = (
    <img
      src={src}
      alt=""
      width={128}
      height={128}
      loading="lazy"
      className="relative size-28 rounded-2xl object-cover shadow-lg shadow-black/30 ring-1 ring-pf-line-2 transition-transform duration-500 group-hover:-rotate-2 group-hover:scale-[1.04] sm:size-32"
    />
  )
  const glow = (
    <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-pf-orange/25 to-pf-crimson/10 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
  )
  if (!link) {
    return (
      <div className="relative shrink-0">
        {glow}
        {img}
      </div>
    )
  }
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${name}: ${link.label}`}
      title={link.label}
      className="relative shrink-0 self-start rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pf-orange"
    >
      {glow}
      {img}
      <span className="absolute bottom-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-pf-bg/85 text-pf-ink ring-1 ring-pf-line-2 transition-colors group-hover:bg-pf-orange group-hover:text-pf-bg" aria-hidden>
        <ArrowUpRight className="size-4" />
      </span>
    </a>
  )
}

export function Projects() {
  const { t } = useLang()
  const p = t.portfolio
  const items = t.inventory.items
  const statuses = useMemo(() => [...new Set(items.map((it) => it.status).filter((s): s is string => !!s))], [items])
  const [filter, setFilter] = useState<string | null>(null)
  const shown = filter ? items.filter((it) => it.status === filter) : items
  const more = t.loft.zones.filter((z) => z.link)
  return (
    <Section id="projects" index="03" title={p.projects.title} lead={p.projects.lead}>
      <div role="group" aria-label={p.projects.title} className="-mt-4 mb-8 flex flex-wrap gap-2">
        {[null, ...statuses].map((s) => (
          <button
            key={s ?? 'all'}
            type="button"
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-[0.8rem] font-bold capitalize transition-colors cursor-pointer',
              filter === s ? 'border-pf-orange bg-pf-orange text-pf-bg' : 'border-pf-line-2 text-pf-ink-2 hover:border-pf-orange hover:text-pf-orange',
            )}
          >
            {s ?? p.projects.all}
            <span className="ml-1.5 tabular-nums opacity-70">{s ? items.filter((it) => it.status === s).length : items.length}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {shown.map((it, i) => (
          <Reveal
            key={it.id}
            delay={i * 70}
            as="article"
            {...spotHandlers()}
            className={cn(card, 'spot group flex flex-col gap-5 overflow-hidden p-6 transition-colors hover:border-pf-line-2 sm:flex-row')}
          >
            {/* kuvake vie suoraan projektin selainversioon (demo, esittely tai pelit) */}
            <ProjectIcon src={pfIcons[it.id] ?? it.icon} link={it.links?.[0]} name={it.name} />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="poster text-xl text-pf-ink">{it.name}</h3>
                {it.status && <span className="rounded-full bg-pf-orange/15 px-2.5 py-0.5 text-[0.66rem] font-bold uppercase tracking-wider text-pf-orange">{it.status}</span>}
              </div>
              <p className="-mt-1 text-[0.72rem] font-bold uppercase tracking-wider text-pf-muted">{it.tag}</p>
              <p className="text-sm leading-relaxed text-pf-ink-2">{it.desc}</p>
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
                    <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm font-bold text-pf-ink hover:text-pf-orange">
                      {l.label}
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      {more.length > 0 && (
        <>
          <h3 className="mb-4 mt-14 text-xs font-bold uppercase tracking-[0.22em] text-pf-orange">{p.projects.more}</h3>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((z, i) => (
              <Reveal as="li" key={z.id} delay={i * 70}>
                <a
                  href={z.link!.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  {...spotHandlers()}
                  className={cn(card, 'spot group flex h-full flex-col gap-2 p-5 transition-colors hover:border-pf-orange/60')}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate font-bold text-pf-ink group-hover:text-pf-orange">{z.link!.label}</span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pf-orange/12 text-pf-orange transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      <ArrowUpRight className="size-4" />
                    </span>
                  </span>
                  <span className="text-sm leading-relaxed text-pf-ink-2">{z.link!.desc}</span>
                </a>
              </Reveal>
            ))}
          </ul>
        </>
      )}
    </Section>
  )
}

/* ---------- Työn alla ---------- */
function QuestStatus({ q }: { q: Quest }) {
  const { t } = useLang()
  const tone =
    q.status === 'done'
      ? 'bg-[#2f9e5b]/20 text-[#7fe0a3]'
      : q.status === 'active'
        ? 'bg-pf-orange/15 text-pf-orange'
        : 'bg-pf-line/60 text-pf-muted'
  return <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[0.66rem] font-bold uppercase tracking-wider', tone)}>{t.quests.status[q.status]}</span>
}

/** Pyöreä edistymismittari */
function Ring({ value, label }: { value: number; label: string }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const R = 52
  const L = 2 * Math.PI * R
  return (
    <div ref={ref} className="relative grid size-36 shrink-0 place-items-center" role="img" aria-label={`${label}: ${value} %`}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="pf-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--pf-sun)" />
            <stop offset="100%" stopColor="var(--pf-red)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--pf-line)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="url(#pf-ring)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={L}
          strokeDashoffset={inView ? L * (1 - value / 100) : L}
          className="transition-[stroke-dashoffset] duration-[1400ms] ease-out"
        />
      </svg>
      <span className="poster text-3xl text-pf-ink">
        {value}
        <span className="text-base text-pf-muted">%</span>
      </span>
    </div>
  )
}

export function Now() {
  const { t } = useLang()
  const p = t.portfolio
  const q = t.quests
  const main = q.main
  return (
    <Section id="now" index="04" title={p.now.title} lead={p.now.lead} className="bg-pf-bg-2/40">
      <Reveal as="article" className={cn(card, 'relative overflow-hidden p-6 sm:p-8')}>
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(242,115,63,0.28),transparent)]" />
        <div className="relative grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
          <Ring value={main.progress} label={q.progress} />
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-pf-orange">{p.now.main}</span>
              <QuestStatus q={main} />
            </div>
            <h3 className="poster text-2xl text-pf-ink sm:text-3xl">{main.title}</h3>
            {main.giver && <p className="text-xs font-bold uppercase tracking-wider text-pf-muted">{main.giver}</p>}
            <p className="leading-relaxed text-pf-ink-2">{main.desc}</p>
            {main.links && (
              <div className="flex flex-wrap gap-4">
                {main.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm font-bold text-pf-ink hover:text-pf-orange">
                    {l.label}
                    <ArrowUpRight className="size-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-pf-muted">{q.objectives}</p>
            <ul className="flex flex-col gap-2.5">
              {main.objectives.map((o) => (
                <li key={o.text} className="flex items-start gap-3 text-sm">
                  <span
                    className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full', o.done ? 'bg-pf-orange text-pf-bg' : 'border border-pf-line-2 text-transparent')}
                    aria-hidden
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className={o.done ? 'text-pf-ink-2 line-through decoration-pf-line-2' : 'font-semibold text-pf-ink'}>{o.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      <div className="relative mb-4 mt-12">
        <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-pf-orange">{p.now.side}</h3>
        {/* peura laiduntaa korttien reunalla */}
        <Critter kind="deer" className="pointer-events-none absolute -bottom-4 right-8 h-[68px] text-pf-line-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.side.map((s, i) => (
          <Reveal key={s.id} delay={(i % 3) * 80} as="article" {...spotHandlers()} className={cn(card, 'spot flex flex-col gap-3 p-5')}>
            <div className="flex items-start justify-between gap-3">
              <h4 className="poster text-base text-pf-ink">{s.title}</h4>
              <QuestStatus q={s} />
            </div>
            <p className="text-sm leading-relaxed text-pf-ink-2">{s.desc}</p>
            <div className="mt-auto pt-1">
              <Bar value={s.progress} label={`${s.title}: ${q.progress}`} />
            </div>
          </Reveal>
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
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <Reveal as="figure" className="relative pb-10">
          <Picture image={{ ...images.havaida, alt: o.name }} className="aspect-[8/5] rounded-2xl ring-1 ring-pf-line" />
          <figcaption className="absolute -bottom-0 left-4 right-4 rounded-2xl border border-white/10 bg-pf-bg-3/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-md sm:left-auto sm:right-6 sm:w-72">
            <p className="text-lg font-extrabold leading-tight text-pf-sun [font-family:var(--font-poster)]">{o.tagline}</p>
            <p className="mt-1 text-xs font-semibold text-pf-muted">{o.founded}</p>
          </figcaption>
        </Reveal>
        <Reveal delay={100} className="flex flex-col gap-6">
          <p className="text-[1.08rem] leading-relaxed text-pf-ink">{o.desc}</p>
          <ol className="grid gap-3">
            {o.services.map((s, i) => (
              <li key={s.title} className={cn(card, 'flex gap-4 p-4')}>
                <span className="poster grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pf-orange to-pf-red text-sm text-pf-bg">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-[1rem] font-extrabold text-pf-ink">{s.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-pf-ink-2">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <a href={o.link.href} target="_blank" rel="noreferrer noopener" className={btnPrimary}>
              {o.link.label}
              <ArrowUpRight />
            </a>
            <button type="button" className={btnGhost} onClick={() => goToSection('contact')}>
              <Mail />
              {o.cta.label}
            </button>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

/* ---------- Suosittelijat: liukuva, vedettävä nauha kuten työkaluissa ---------- */
export function References() {
  const { t } = useLang()
  const p = t.portfolio
  const r = t.codex.references
  const items = r.items.filter((it) => SHOW_DRAFTS || !it.draft)
  const [paused, setPaused] = useState(false)
  // n. 40 px/s, jotta lainaukset ehtii lukea; nauhaa voi myös vetää itse (Marquee)
  const dur = Math.max(items.length, 3) * 9

  return (
    <Section id="refs" index="06" title={r.title} lead={r.lead} className="bg-pf-bg-2/40">
      {items.length ? (
        <Reveal>
          <div className="-mt-6 mb-6 flex justify-end motion-reduce:hidden">
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
              aria-label={paused ? p.carousel.play : p.carousel.pause}
              title={paused ? p.carousel.play : p.carousel.pause}
              className="grid size-11 cursor-pointer place-items-center rounded-full border border-pf-line-2 text-pf-ink transition-colors hover:border-pf-orange hover:text-pf-orange"
            >
              {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
            </button>
          </div>
          <Marquee
            duration={dur}
            paused={paused}
            className="-mx-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:[mask-image:none] sm:-mx-6"
            trackClassName="py-1 pb-4"
            render={(copy) =>
              items.map((it) => (
                <li key={it.name} aria-hidden={copy || undefined} className="w-[300px] shrink-0 pl-5 sm:w-[360px]">
                  <figure className={cn(card, 'flex h-full flex-col overflow-hidden')}>
                    {it.photo ? (
                      <Picture image={{ ...it.photo, alt: copy ? '' : it.photo.alt, sizes: '(min-width: 640px) 340px, 280px' }} className="aspect-[4/3.4]" imgClassName="object-[50%_18%]" />
                    ) : (
                      <div className="poster grid aspect-[4/3.4] place-items-center bg-pf-bg text-5xl text-pf-orange">{it.name.slice(0, 1)}</div>
                    )}
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <blockquote className="leading-relaxed text-pf-ink-2">
                        <Quote className="mb-2 size-5 text-pf-orange" aria-hidden />
                        {it.quote}
                      </blockquote>
                      <figcaption className="mt-auto">
                        <p className="poster text-base text-pf-ink">{it.name}</p>
                        {(it.role || it.org) && <p className="text-xs font-semibold text-pf-muted">{[it.role, it.org].filter(Boolean).join(' · ')}</p>}
                        {it.href && (
                          <a
                            href={it.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            tabIndex={copy ? -1 : undefined}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-pf-ink hover:text-pf-orange"
                          >
                            {r.profile}
                            <ArrowUpRight className="size-3" />
                          </a>
                        )}
                        {it.draft && (
                          <p className="mt-3 w-fit rounded-lg border border-dashed border-pf-red/70 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-pf-red">{r.draft}</p>
                        )}
                      </figcaption>
                    </div>
                  </figure>
                </li>
              ))
            }
          />
        </Reveal>
      ) : (
        <p className="max-w-2xl text-[1.05rem] leading-relaxed text-pf-ink-2">{r.empty}</p>
      )}
      <button type="button" className={`${btnGhost} mt-8`} onClick={() => goToSection('contact', 'pf-message')}>
        <PenLine />
        {r.cta}
      </button>
    </Section>
  )
}

/* ---------- Yhteys ---------- */
export function Contact() {
  const { t } = useLang()
  const p = t.portfolio
  const c = t.codex
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [copied, setCopied] = useState(false)
  const email = c.info[1]?.value ?? links.email
  const emailRef = useRef<HTMLAnchorElement>(null)
  /** roskapostiansa (Netlify-honeypot): piilotettu kenttä, jota ihminen ei täytä */
  const botRef = useRef<HTMLInputElement>(null)

  /** Kenttää muokattaessa edellinen "lähetetty" -ilmoitus poistuu */
  const edit = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }))
    if (status === 'sent') setStatus('idle')
  }

  /** Viesti lähtee suoraan Netlify Formsin kautta (src/lib/contact.ts) – ei sähköpostiohjelmaa */
  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    try {
      await sendContact({ ...form, subject: `${c.form.subject} – ${form.name}`, botField: botRef.current?.value })
      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }
  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(c.form.subject)}&body=${encodeURIComponent(`${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ''}`)}`

  const copy = () => {
    const done = () => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    }
    navigator.clipboard?.writeText(email).then(done, () => {
      // varakeino: valitaan osoite, jotta sen voi kopioida itse
      const el = emailRef.current
      if (!el) return
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    })
  }

  return (
    <Section id="contact" index="07" title={p.contact.title} lead={p.contact.lead}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <Reveal className="flex flex-col gap-6">
          <div className={cn(card, 'relative overflow-hidden p-6')}>
            <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-[radial-gradient(closest-side,rgba(249,178,51,0.22),transparent)]" />
            <p className="relative mb-2 text-xs font-bold uppercase tracking-[0.2em] text-pf-muted">{p.contact.direct}</p>
            <a ref={emailRef} href={`mailto:${email}`} className="relative block break-all text-2xl font-extrabold text-pf-sun hover:underline sm:text-3xl">
              {email}
            </a>
            <button
              type="button"
              onClick={copy}
              className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-pf-line-2 px-4 py-1.5 text-xs font-bold text-pf-ink-2 transition-colors hover:border-pf-orange hover:text-pf-orange cursor-pointer"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span aria-live="polite">{copied ? p.contact.copied : p.contact.copy}</span>
            </button>
          </div>
          <ul className="divide-y divide-pf-line overflow-hidden rounded-2xl border border-pf-line">
            {c.links
              .filter((l) => !l.href.startsWith('mailto:'))
              .map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noreferrer noopener" className="group flex items-center gap-4 px-5 py-4 text-sm transition-colors hover:bg-pf-bg-2">
                    <span className="w-24 shrink-0 text-[0.7rem] font-bold uppercase tracking-wider text-pf-muted">{l.label}</span>
                    <span className="min-w-0 flex-1 truncate font-bold text-pf-ink group-hover:text-pf-orange">{l.value}</span>
                    <ArrowUpRight className="size-4 text-pf-muted group-hover:text-pf-orange" />
                  </a>
                </li>
              ))}
          </ul>
          <p className="flex items-center gap-2 text-sm font-semibold text-pf-ink-2">
            <MapPin className="size-4 text-pf-orange" aria-hidden />
            {c.info[2]?.value} · {t.ui.place}
          </p>
        </Reveal>

        <Reveal delay={100} as="form" onSubmit={onSubmit} className={cn(card, 'grid gap-4 p-6 sm:p-8')}>
          <h3 className="poster text-xl text-pf-ink">{c.contactTitle}</h3>
          <input type="hidden" name="form-name" value="contact" />
          <p className="sr-only" aria-hidden>
            <label>
              Bot field
              <input ref={botRef} name="bot-field" tabIndex={-1} autoComplete="off" />
            </label>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold text-pf-ink-2">
              {c.form.name}
              <input name="name" autoComplete="name" required value={form.name} onChange={(e) => edit({ name: e.target.value })} className={field} />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-pf-ink-2">
              {c.form.email}
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => edit({ email: e.target.value })}
                className={field}
              />
            </label>
          </div>
          <label className="grid gap-1.5 text-xs font-bold text-pf-ink-2">
            {c.form.message}
            <textarea
              id="pf-message"
              name="message"
              required
              rows={6}
              value={form.message}
              onChange={(e) => edit({ message: e.target.value })}
              className={cn(field, 'resize-y')}
            />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={status === 'sending'} className={cn(btnPrimary, 'disabled:cursor-wait disabled:opacity-70')}>
              {status === 'sending' ? c.form.sending : c.form.submit}
              {status === 'sent' ? <Check /> : <Send />}
            </button>
            <p className="text-xs text-pf-muted">{c.form.hint}</p>
          </div>
          <p aria-live="polite" className={cn('text-sm font-semibold', status === 'error' ? 'text-pf-orange' : 'text-pf-sun', (status === 'idle' || status === 'sending') && 'sr-only')}>
            {status === 'sent' && c.form.sent}
            {status === 'error' && (
              <>
                {c.form.error}{' '}
                <a href={mailtoHref} className="underline underline-offset-2 hover:text-pf-orange">
                  {email}
                </a>
              </>
            )}
          </p>
        </Reveal>
      </div>
    </Section>
  )
}
