import { ArrowUpRight, Flame, GitBranch, GitCommitHorizontal, Star, Trophy } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useLang } from '@/hooks/useLang'
import { cn } from '@/lib/utils'
import { TechIcon } from '@/components/TechIcon'
import github from '@/data/github.json'

type Day = { date: string; level: number; count: number }
type Repo = {
  name: string
  description: string | null
  language: string | null
  stars: number
  url: string
  homepage: string | null
  pushedAt: string
  topics: string[]
}

const data = github as {
  user: string
  fetchedAt: string | null
  contributions: { total: number; weeks: Day[][]; longestStreak: number; currentStreak: number; days: number }
  repos: Repo[]
  languages: Record<string, number>
}

const LEVEL = ['bg-muted', 'bg-blue/35', 'bg-blue/60', 'bg-blue/85', 'bg-blue dark:bg-cyan']

const LANG_COLOR: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Python: '#3572A5',
  Shell: '#89e051',
  'C#': '#178600',
  Java: '#b07219',
}

function formatDate(iso: string, lang: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function relative(iso: string, lang: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (diff < 1) return lang === 'fi' ? 'tänään' : 'today'
  if (diff < 30) return lang === 'fi' ? `${diff} pv sitten` : `${diff}d ago`
  if (diff < 365) return lang === 'fi' ? `${Math.round(diff / 30)} kk sitten` : `${Math.round(diff / 30)}mo ago`
  return lang === 'fi' ? `${Math.round(diff / 365)} v sitten` : `${Math.round(diff / 365)}y ago`
}

/* ---------- GitHub-tyylinen kontribuutiokalenteri (skaalautuu leveyteen) ---------- */
function ContributionGraph() {
  const { t, lang } = useLang()
  const weeks = data.contributions.weeks
  const cols = weeks.length || 53

  // Kuukausiotsikot: viikko, jossa kuukausi vaihtuu (ei kahta liian lähekkäin).
  const monthLabels: { col: number; label: string }[] = []
  let lastMonth = -1
  weeks.forEach((w, col) => {
    const m = new Date(w[0].date + 'T00:00:00').getMonth()
    if (m !== lastMonth) {
      const prev = monthLabels.at(-1)
      if (!prev || col - prev.col > 2) monthLabels.push({ col, label: t.ui.months[m] })
      lastMonth = m
    }
  })

  const colsStyle = { gridTemplateColumns: `28px repeat(${cols}, minmax(0, 1fr))` }

  return (
    <TooltipProvider delayDuration={80}>
      <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div className="min-w-[560px]">
          {/* kuukaudet */}
          <div className="mb-1 grid gap-[2px] text-[0.68rem] leading-4 text-muted-foreground" style={colsStyle}>
            {monthLabels.map((m) => (
              <span
                key={`${m.col}-${m.label}`}
                className="col-span-3 whitespace-nowrap"
                style={{ gridColumnStart: m.col + 2 }}
              >
                {m.label}
              </span>
            ))}
          </div>
          {/* ruudukko: 1. sarake viikonpäivät, loput viikot */}
          <div className="grid grid-rows-7 gap-[2px]" style={colsStyle}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <span
                key={d}
                className="self-center text-[0.62rem] leading-none text-muted-foreground"
                style={{ gridColumn: 1, gridRow: d + 1 }}
              >
                {d % 2 === 1 ? t.ui.weekdays[d] : ''}
              </span>
            ))}
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const label = t.ui.contributionsOn(day.count, formatDate(day.date, lang))
                const offset = wi === 0 ? 7 - week.length : 0
                return (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={label}
                        className={cn(
                          'aspect-square w-full rounded-[2px] outline-none transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-blue',
                          LEVEL[Math.min(day.level, 4)],
                        )}
                        style={{ gridColumn: wi + 2, gridRow: di + 1 + offset }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                )
              }),
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[0.7rem] text-muted-foreground">
        <span>{t.dev.activity.less}</span>
        {LEVEL.map((c, i) => (
          <span key={i} className={cn('size-3 rounded-[2px]', c)} />
        ))}
        <span>{t.dev.activity.more}</span>
      </div>
    </TooltipProvider>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Flame; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue/15 text-blue dark:bg-cyan/15 dark:text-cyan">
        <Icon className="size-4" />
      </span>
      <div className="leading-tight">
        <p className="font-sans text-2xl font-extrabold tabular-nums tracking-tight text-foreground">{value}</p>
        <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/* ---------- Koodi-osio: GitHub-dashboard, havaida.comin sininen korostuksena ---------- */
export function Code() {
  const { t, lang } = useLang()
  const d = t.dev
  const c = data.contributions
  const repos = data.repos.slice(0, 6)
  const languages = Object.entries(data.languages).sort((a, b) => b[1] - a[1])
  const langTotal = languages.reduce((n, [, v]) => n + v, 0) || 1
  const fetched = data.fetchedAt
    ? new Date(data.fetchedAt).toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

  return (
    <section id="code" className="scroll-mt-24 border-t border-border bg-card/60 py-16 md:py-24">
      <div className="container-x">
        <div className="reveal mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[720px]">
            <span className="eyebrow mb-3.5">{d.eyebrow}</span>
            <h2 className="text-[2.4rem] leading-[1.02] tracking-[-0.02em] md:text-[3.2rem]">{d.heading}</h2>
            <p className="mt-4 text-[1.0625rem] text-muted-foreground md:text-lg">{d.lead}</p>
          </div>
          <Button asChild variant="outline" className="w-fit">
            <a href={d.activity.link.href} target="_blank" rel="noreferrer noopener">
              <GitBranch />
              {d.activity.link.label}
              <ArrowUpRight />
            </a>
          </Button>
        </div>

        {/* Rivi 1: aktiivisuus + konepelti */}
        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <Card className="reveal py-0">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="flex flex-wrap items-baseline justify-between gap-2 text-foreground">
                <span className="font-display text-2xl font-semibold">{d.activity.title}</span>
                <span className="text-sm font-medium text-muted-foreground">{d.activity.summary.replace('{n}', String(c.total))}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ContributionGraph />
              <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <Stat icon={GitCommitHorizontal} value={c.total} label={d.activity.contributions} />
                <Stat icon={Flame} value={c.currentStreak} label={d.activity.streak} />
                <Stat icon={Trophy} value={c.longestStreak} label={d.activity.longest} />
                <Stat icon={GitBranch} value={data.repos.length} label={d.activity.repos} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{d.activity.note}</p>
            </CardContent>
          </Card>

          <Card className="reveal reveal-delay-1 py-0">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="font-display text-2xl font-semibold text-foreground">{d.hood.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col px-6 pb-6">
              <dl className="divide-y divide-border">
                {d.hood.rows.map((r) => (
                  <div key={r.label} className="grid grid-cols-[88px_1fr] gap-3 py-2.5 text-sm">
                    <dt className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{r.label}</dt>
                    <dd className="text-foreground">{r.value}</dd>
                  </div>
                ))}
                <div className="grid grid-cols-[88px_1fr] gap-3 py-2.5 text-sm">
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{d.hood.updated}</dt>
                  <dd className="font-mono text-xs text-foreground">{fetched}</dd>
                </div>
              </dl>
              <Separator className="my-4 bg-border" />
              <div className="mt-auto">
                <a
                  href={d.hood.link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline dark:text-cyan"
                >
                  {d.hood.link.label}
                  <ArrowUpRight className="size-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rivi 2: työpöydällä nyt */}
        <div className="mt-6">
          <div className="reveal mb-5 flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
            <h3 className="font-display text-2xl font-semibold text-foreground">{d.desk.title}</h3>
            <p className="text-sm text-muted-foreground">{d.desk.lead}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.desk.items.map((it, i) => (
              <Card key={it.title} className={`reveal reveal-delay-${i} gap-3 py-5`}>
                <CardHeader className="px-5">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-xl font-semibold text-foreground">{it.title}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 font-medium">
                      {it.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-5 text-sm text-muted-foreground">{it.text}</CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Rivi 3: repot + stack */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="reveal py-0">
            <CardHeader className="flex flex-row items-baseline justify-between px-6 pt-6">
              <CardTitle className="font-display text-2xl font-semibold text-foreground">{d.repos.title}</CardTitle>
              <a
                href={d.repos.link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline dark:text-cyan"
              >
                {d.repos.link.label}
                <ArrowUpRight className="size-4" />
              </a>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ul className="divide-y divide-border">
                {repos.map((r) => (
                  <li key={r.name} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-mono text-sm font-semibold text-foreground hover:text-blue hover:underline dark:text-cyan"
                      >
                        {r.name}
                      </a>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.description || d.repos.empty}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      {r.language && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2.5 rounded-full" style={{ background: LANG_COLOR[r.language] ?? '#8088ce' }} />
                          {r.language}
                        </span>
                      )}
                      {r.stars > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3" /> {r.stars}
                        </span>
                      )}
                      <span className="hidden sm:inline">
                        {d.repos.updated} {relative(r.pushedAt, lang)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="reveal reveal-delay-1 py-0">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="font-display text-2xl font-semibold text-foreground">{d.stack.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col px-6 pb-6">
              {/* kielijakauma julkisista repoista */}
              {languages.length > 0 ? (
                <>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    {languages.map(([name, n]) => (
                      <span
                        key={name}
                        title={`${name} · ${n}`}
                        style={{ width: `${(n / langTotal) * 100}%`, background: LANG_COLOR[name] ?? '#8088ce' }}
                      />
                    ))}
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-foreground">
                    {languages.map(([name, n]) => (
                      <li key={name} className="inline-flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full" style={{ background: LANG_COLOR[name] ?? '#8088ce' }} />
                        {name}
                        <span className="text-muted-foreground">{Math.round((n / langTotal) * 100)} %</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
              <Separator className="my-5 bg-border" />
              <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {d.stack.items.map((s) => (
                  <li
                    key={s.name}
                    title={s.name}
                    className="grid aspect-square place-items-center rounded-lg border border-border bg-muted/40 text-foreground transition-colors hover:border-blue/60 dark:hover:border-cyan/60"
                  >
                    <TechIcon name={s.icon} brandColor={false} className="size-5" />
                    <span className="sr-only">{s.name}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-5 bg-border" />
              <div className="mt-auto">
                <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{d.exploring.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.exploring.items.map((x) => (
                    <Badge key={x} variant="secondary" className="font-medium">
                      {x}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
