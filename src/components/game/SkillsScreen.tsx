import { useState } from 'react'

import { TechIcon } from '@/components/TechIcon'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
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
    </div>
  )
}
