import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

import { TechIcon } from '@/components/TechIcon'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { ACTIVE_MIN, DIFFICULTIES, fill, fmtDate, fmtNum, hasLeetCode, langIcon, langLabel, leetcode, poolMillions, RANK_SCALE, topicUrl, topPercent } from '@/lib/leetcode'
import { cn } from '@/lib/utils'

/* Taitopuu: kolme haaraa, solmut pyöreinä ikoneina ja tasorenkaalla (SVG). */
function Node({
  name,
  icon,
  level,
  desc,
  active,
  onHover,
}: {
  name: string
  icon: string
  level: number
  desc: string
  active: boolean
  onHover: () => void
}) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onFocus={onHover}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-sm border px-3 py-2 text-left transition-colors outline-none cursor-pointer',
        active ? 'border-brass bg-brass/10' : 'border-line/70 bg-bg-2/50 hover:border-line-2',
      )}
      aria-label={`${name} ${level} %`}
    >
      <span className="relative grid size-14 shrink-0 place-items-center">
        <svg viewBox="0 0 60 60" className="absolute inset-0 size-full -rotate-90">
          <circle cx="30" cy="30" r={r} fill="none" stroke="var(--line)" strokeWidth="3" />
          <circle
            cx="30"
            cy="30"
            r={r}
            fill="none"
            stroke={active ? 'var(--gold)' : 'var(--brass)'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - level / 100)}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <span className="grid size-9 place-items-center rounded-full bg-bg text-ink">
          <TechIcon name={icon} className="size-5" brandColor={active} />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[0.74rem] uppercase tracking-[0.16em] text-ink">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">{desc}</span>
      </span>
      <span className="font-display text-base text-brass-2 tabular-nums">{level}</span>
    </button>
  )
}

/* Harjoitusareena: LeetCode-tilastot pelin tyylillä (helppo = teal, keskitaso = kulta, vaikea = hiillos). */
const ARENA_COLOR = { easy: 'var(--teal)', medium: 'var(--gold)', hard: 'var(--ember-2)' } as const

function Arena() {
  const { t, lang } = useLang()
  const l = t.leetcode
  const d = leetcode
  const maxLang = d.languages[0]?.solved ?? 1
  const vars = {
    pct: d.ranking ? fmtNum(topPercent(d.ranking), lang) : '',
    pool: poolMillions(lang),
    min: String(ACTIVE_MIN),
    max: fmtNum(RANK_SCALE, lang),
  }
  return (
    <section className="panel corners mt-5 rounded-sm p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full border border-brass/60 text-brass-2">
            <TechIcon name="leetcode" className="size-3.5" brandColor={false} />
          </span>
          <h3 className="font-display text-[0.8rem] uppercase tracking-[0.22em] text-ink">
            {l.arena} <span className="text-brass">·</span> {l.title}
          </h3>
          {d.ranking && (
            <span className="rounded-sm border border-gold/60 bg-gold/15 px-2 py-0.5 font-display text-[0.7rem] uppercase tracking-[0.16em] text-gold">{fill(l.topBadge, vars)}</span>
          )}
        </div>
        <a href={d.url} target="_blank" rel="noreferrer noopener" className="label-caps inline-flex items-center gap-1.5 hover:text-brass-2">
          {l.profile}
          <ExternalLink className="size-3" aria-hidden />
        </a>
      </header>

      <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <div className="flex flex-wrap gap-x-8 gap-y-3 lg:flex-col lg:border-r lg:border-line/70 lg:pr-8">
          <div>
            <p className="font-display text-4xl text-brass-2 tabular-nums">{fmtNum(d.solved.all, lang)}</p>
            <p className="label-caps">
              {l.solved} <span className="text-muted-foreground">/ {fmtNum(d.total.all, lang)}</span>
            </p>
          </div>
          {d.ranking && (
            <div className="max-w-[16rem]" title={fill(l.rankNote, vars)}>
              <p className="font-display text-4xl leading-none text-gold [text-shadow:0_0_18px_rgba(241,196,90,0.45)]">{fill(l.topBadge, vars)}</p>
              <p className="label-caps mt-1.5">
                {l.rank} <span className="tabular-nums text-brass-2">#{fmtNum(d.ranking, lang)}</span>
              </p>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                <span className="text-ink">{fill(l.rankTop, vars)}</span> {fill(l.rankBasis, vars)}
              </p>
            </div>
          )}
        </div>

        <ul className="flex flex-col justify-center gap-3">
          {DIFFICULTIES.map((k) => (
            <li key={k}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-display text-[0.72rem] uppercase tracking-[0.18em]" style={{ color: ARENA_COLOR[k] }}>
                  {l.difficulty[k]}
                </span>
                <span className="text-sm tabular-nums text-ink">
                  {fmtNum(d.solved[k], lang)} <span className="text-muted-foreground">/ {fmtNum(d.total[k], lang)}</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line/70" role="progressbar" aria-label={l.difficulty[k]} aria-valuenow={d.solved[k]} aria-valuemin={0} aria-valuemax={d.total[k]}>
                <div className="h-full rounded-full" style={{ width: `${(d.solved[k] / (d.total[k] || 1)) * 100}%`, background: ARENA_COLOR[k] }} />
              </div>
            </li>
          ))}
        </ul>

        <div>
          <p className="label-caps mb-2">{l.languages}</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {d.languages.map((x) => {
              const icon = langIcon(x.name)
              return (
                <li key={x.name} className="flex items-center gap-2" title={`${langLabel(x.name)}: ${x.solved}`}>
                  <span className="grid size-5 shrink-0 place-items-center text-ink-2">{icon && <TechIcon name={icon} className="size-4" brandColor={false} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between text-xs">
                      <span className="truncate text-ink">{langLabel(x.name)}</span>
                      <span className="tabular-nums text-brass-2">{x.solved}</span>
                    </span>
                    <span className="mt-0.5 block h-0.5 overflow-hidden rounded-full bg-line/70">
                      <span className="block h-full bg-brass" style={{ width: `${(x.solved / maxLang) * 100}%` }} />
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="mt-5 border-t border-line/70 pt-4">
        <p className="label-caps mb-2">{l.topics}</p>
        <ul className="flex flex-wrap gap-1.5">
          {d.topics.slice(0, 12).map((tp) => (
            <li key={tp.slug}>
              <a
                href={topicUrl(tp.slug)}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-sm border border-line/80 bg-bg-2/50 px-2 py-0.5 text-xs text-ink-2 transition-colors hover:border-brass hover:text-ink"
              >
                {tp.name}
                <span className="tabular-nums text-brass-2">{tp.solved}</span>
              </a>
            </li>
          ))}
        </ul>
        {d.fetchedAt && (
          <p className="mt-3 text-[0.7rem] text-muted-foreground">
            {l.updated} {fmtDate(d.fetchedAt, lang)}
          </p>
        )}
      </div>
    </section>
  )
}

export function SkillsScreen() {
  const { t } = useLang()
  const { play } = useSound()
  const s = t.skills
  const [activeKey, setActive] = useState<string>(s.branches[0].nodes[0].name)
  const total = s.branches.reduce((n, b) => n + b.nodes.length, 0)
  const avg = Math.round(s.branches.flatMap((b) => b.nodes).reduce((n, x) => n + x.level, 0) / total)

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="brass-rule decode text-2xl tracking-[0.1em] text-ink">{s.title}</h2>
          <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">{s.lead}</p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="font-display text-2xl text-brass-2 tabular-nums">{total}</p>
            <p className="label-caps">{s.unlocked}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl text-brass-2 tabular-nums">{avg} %</p>
            <p className="label-caps">{s.mastery}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {s.branches.map((b, bi) => (
          <section key={b.title} className="panel corners rounded-sm p-4">
            <header className="mb-3 flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full border border-brass/60 font-display text-[0.7rem] text-brass-2">
                {['I', 'II', 'III'][bi]}
              </span>
              <h3 className="font-display text-[0.8rem] uppercase tracking-[0.22em] text-ink">{b.title}</h3>
            </header>
            <div className="relative flex flex-col gap-2 pl-4">
              <span aria-hidden className="tree-line absolute left-1 top-4 bottom-4 w-px" />
              {b.nodes.map((n) => (
                <div key={n.name} className="relative">
                  <span aria-hidden className="absolute -left-3 top-1/2 h-px w-3 bg-line-2" />
                  <Node
                    {...n}
                    active={activeKey === n.name}
                    onHover={() => {
                      if (activeKey !== n.name) play('tick')
                      setActive(n.name)
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {hasLeetCode && <Arena />}
    </div>
  )
}
