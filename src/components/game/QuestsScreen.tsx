import { useState } from 'react'
import { ArrowUpRight, Check, Circle, Crown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import type { Quest, QuestStatus } from '@/content'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<QuestStatus, string> = {
  active: 'var(--teal-2)',
  done: 'var(--green)',
  planned: 'var(--brass)',
  idea: 'var(--gold)',
}

function QuestRow({ q, active, onSelect }: { q: Quest; active: boolean; onSelect: () => void }) {
  const { t } = useLang()
  const { play } = useSound()
  return (
    <button
      type="button"
      onMouseEnter={() => {
        if (!active) play('tick')
        onSelect()
      }}
      onFocus={onSelect}
      onClick={() => {
        play('select')
        onSelect()
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors outline-none cursor-pointer',
        active ? 'border-brass bg-brass/10' : 'border-line/70 bg-bg-2/40 hover:border-line-2',
      )}
    >
      {q.type === 'main' ? (
        <Crown className="size-4 shrink-0 text-gold" />
      ) : (
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[q.status] }} />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[0.76rem] uppercase tracking-[0.14em] text-ink">{q.title}</span>
        <span className="block text-[0.68rem] uppercase tracking-wider text-muted-foreground">{t.quests.status[q.status]}</span>
      </span>
      <span className="font-display text-sm text-brass-2 tabular-nums">{q.progress} %</span>
    </button>
  )
}

export function QuestsScreen() {
  const { t } = useLang()
  const { play } = useSound()
  const qs = t.quests
  const all = [qs.main, ...qs.side]
  const [active, setActive] = useState<Quest>(qs.main)

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-3 py-5 sm:px-5 lg:grid-cols-[360px_1fr]">
      <aside className="flex flex-col gap-4">
        <div>
          <h2 className="brass-rule decode text-2xl tracking-[0.1em] text-ink">{qs.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{qs.lead}</p>
        </div>
        <div>
          <p className="label-caps mb-2">{qs.mainTitle}</p>
          <QuestRow q={qs.main} active={active.id === qs.main.id} onSelect={() => setActive(qs.main)} />
        </div>
        <div>
          <p className="label-caps mb-2">{qs.sideTitle}</p>
          <div className="flex flex-col gap-1.5">
            {qs.side.map((q) => (
              <QuestRow key={q.id} q={q} active={active.id === q.id} onSelect={() => setActive(q)} />
            ))}
          </div>
        </div>
      </aside>

      <section key={active.id} className="panel corners glitch-x animate-in fade-in-0 rounded-sm p-5 duration-300 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="label-caps" style={{ color: STATUS_COLOR[active.status] }}>
              {active.type === 'main' ? qs.mainTitle : qs.sideTitle} · {qs.status[active.status]}
            </p>
            <h3 className="mt-1 text-2xl tracking-[0.08em] text-ink md:text-3xl">{active.title}</h3>
            {active.giver && <p className="mt-1 text-xs text-muted-foreground">{active.giver}</p>}
          </div>
          <Badge variant="outline" className="border-brass/60 font-display text-brass-2">
            {all.indexOf(active) + 1}/{all.length}
          </Badge>
        </div>

        <p className="mt-4 max-w-[62ch] text-[0.95rem] text-ink-2">{active.desc}</p>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="label-caps">{qs.progress}</span>
            <span className="font-display text-brass-2 tabular-nums">{active.progress} %</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ember to-gold transition-[width] duration-700"
              style={{ width: `${active.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="label-caps mb-2">{qs.objectives}</p>
          <ul className="flex flex-col gap-2">
            {active.objectives.map((o) => (
              <li key={o.text} className="flex items-start gap-3 text-sm">
                {o.done ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-green" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-line-2" />
                )}
                <span className={cn(o.done ? 'text-muted-foreground line-through decoration-line-2' : 'text-ink')}>{o.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {(active.reward || active.links) && (
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-4 text-sm">
            {active.reward && (
              <div>
                <p className="label-caps">{qs.reward}</p>
                <p className="mt-1 text-gold">{active.reward}</p>
              </div>
            )}
            {active.links?.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => play('select')}
                className="inline-flex items-center gap-1 font-semibold text-brass hover:underline"
              >
                {l.label}
                <ArrowUpRight className="size-4" />
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
