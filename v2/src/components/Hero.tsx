import { ArrowRight, Mail, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TechIcon } from '@/components/TechIcon'
import { useLang } from '@/hooks/useLang'
import { links } from '@/content'
import { cn } from '@/lib/utils'

/* Kelluvien teknologiamerkkien paikat kuvan ympärillä (prosentteina lavasta). */
const BADGE_SPOTS = [
  'left-[4%] top-[14%]',
  'right-[3%] top-[9%]',
  'left-[2%] top-[46%]',
  'right-[2%] top-[40%]',
  'left-[8%] bottom-[16%]',
  'right-[6%] bottom-[22%]',
]
const BADGE_DELAYS = ['0s', '1.2s', '2.1s', '0.6s', '1.7s', '2.6s']

function SocialLinks({ className }: { className?: string }) {
  const { t } = useLang()
  const items = [
    { key: 'github', href: links.github, label: 'GitHub' },
    { key: 'instagram', href: links.instagram, label: 'Instagram' },
    { key: 'mail', href: `mailto:${links.email}`, label: t.contact.email },
  ]
  return (
    <ul className={cn('flex items-center gap-2.5', className)}>
      {items.map((s) => (
        <li key={s.key}>
          <a
            href={s.href}
            target={s.key === 'mail' ? undefined : '_blank'}
            rel="noreferrer noopener"
            aria-label={s.label}
            title={s.label}
            className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground/80 transition-colors hover:border-accent hover:text-foreground"
          >
            {s.key === 'mail' ? <Mail className="size-4" /> : <TechIcon name={s.key} brandColor={false} className="size-4" />}
          </a>
        </li>
      ))}
    </ul>
  )
}

/* Lava: hehku + kaaret + cutout-kuva + kelluvat merkit (mallikuvan henkeen). */
function Stage() {
  const { t } = useLang()
  const h = t.hero
  return (
    <div className="animate-in fade-in zoom-in-95 duration-1000 fill-mode-both relative mx-auto w-full max-w-[560px] lg:max-w-none">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg rounded-tr-[var(--radius-hero)] border border-border bg-card lg:aspect-auto lg:h-full lg:min-h-[600px]">
        {/* hehku */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_40%,var(--glow-1),transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_100%,var(--glow-2),transparent_70%)]"
        />
        {/* kaaret */}
        <svg aria-hidden viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--viini)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--viini)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--hiekka)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g fill="none" strokeWidth="1.25">
            <circle cx="200" cy="230" r="150" stroke="var(--border)" strokeDasharray="3 7" />
            <circle cx="200" cy="230" r="196" stroke="var(--border)" strokeDasharray="2 10" opacity="0.8" />
            <circle cx="200" cy="230" r="150" stroke="url(#arc)" strokeDasharray="330 620" strokeLinecap="round" className="animate-[spin_26s_linear_infinite] origin-[200px_230px]" />
            <circle cx="200" cy="230" r="196" stroke="url(#arc)" strokeDasharray="260 980" strokeLinecap="round" className="animate-[spin_38s_linear_infinite_reverse] origin-[200px_230px]" />
          </g>
        </svg>
        {/* cutout */}
        <img
          src={h.cutout.src}
          srcSet={h.cutout.srcSet}
          sizes={h.cutout.sizes}
          alt={h.cutout.alt}
          width={h.cutout.width}
          height={h.cutout.height}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="absolute inset-x-0 bottom-0 mx-auto h-[94%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_24px_40px_rgba(18,18,20,0.35)]"
        />
        {/* kelluvat merkit */}
        {h.badges.map((b, i) => (
          <span
            key={b.label}
            className={cn(
              'absolute inline-flex items-center gap-2 rounded-full border border-border bg-card/90 py-1.5 pl-2 pr-3 text-[0.8rem] font-semibold text-foreground shadow-[0_10px_24px_-12px_rgba(18,18,20,0.5)] backdrop-blur animate-float',
              BADGE_SPOTS[i % BADGE_SPOTS.length],
            )}
            style={{ animationDelay: BADGE_DELAYS[i % BADGE_DELAYS.length] }}
          >
            <span className="grid size-6 place-items-center rounded-full bg-muted">
              <TechIcon name={b.icon} className="size-3.5" />
            </span>
            {b.label}
          </span>
        ))}
      </div>
      {/* pieni allekirjoituskortti */}
      <div className="absolute -bottom-4 left-4 rounded-lg border bg-card/95 px-4 py-3 shadow-[0_10px_30px_rgba(18,18,20,0.10)] backdrop-blur md:left-6">
        <p className="font-display text-lg font-semibold leading-none">{t.footer.place}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.now.items[0].title} · {t.now.items[0].caption}
        </p>
      </div>
    </div>
  )
}

export function Hero() {
  const { t } = useLang()
  const h = t.hero

  return (
    <section id="top" className="relative overflow-hidden pb-14 pt-6 md:pb-20 md:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 size-[520px] rounded-full bg-[radial-gradient(closest-side,var(--glow-2),transparent)]"
      />

      <div className="container-x grid items-stretch gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        {/* copy */}
        <div className="flex flex-col justify-center gap-6 py-4 lg:py-10">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 flex flex-wrap items-center gap-3">
            <span className="eyebrow">{h.eyebrow}</span>
            {h.available && (
              <Badge variant="success" className="gap-1.5 px-3 py-1 text-[0.75rem]">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-metsa/70 dark:bg-cyan/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-metsa dark:bg-cyan" />
                </span>
                {h.availability}
              </Badge>
            )}
          </div>

          <h1 className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 fill-mode-both text-[3.4rem] leading-[0.95] tracking-[-0.025em] sm:text-[4.4rem] lg:text-[5.2rem]">
            {h.firstName}
            <br />
            <span className="italic text-viini">{h.lastName}</span>
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200 fill-mode-both font-display text-[1.6rem] font-semibold italic leading-tight text-foreground/80 md:text-[1.9rem]">
            {h.role}
            <span className="ml-1 inline-block h-[0.9em] w-[2px] translate-y-[0.1em] animate-pulse bg-viini" aria-hidden />
          </p>

          <p className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-both max-w-[46ch] text-[1.0625rem] text-muted-foreground md:text-lg">
            {h.pitch}
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-[400ms] fill-mode-both mt-1 flex flex-wrap gap-3.5">
            <Button asChild size="lg">
              <a href={h.primary.href}>
                {h.primary.label}
                <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={h.secondary.href}>{h.secondary.label}</a>
            </Button>
          </div>

          <div className="animate-in fade-in duration-1000 delay-500 fill-mode-both mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
            <SocialLinks />
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-viini" />
                {t.contact.location}
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="font-display text-base italic text-foreground/70">{h.note}</span>
            </p>
          </div>
        </div>

        <Stage />
      </div>
    </section>
  )
}
