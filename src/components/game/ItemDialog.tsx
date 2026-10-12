import { ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RARITY_COLOR } from '@/components/game/Slot'
import { TechIcon } from '@/components/TechIcon'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import type { Item } from '@/content'
import { cn } from '@/lib/utils'

/* Esineen tiedot (Enter / klikkaus) */
export function ItemDialog({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const { t } = useLang()
  const { play } = useSound()
  const inv = t.inventory

  return (
    <Dialog
      open={!!item}
      onOpenChange={(o) => {
        if (!o) {
          play('close')
          onClose()
        }
      }}
    >
      <DialogContent closeLabel={t.ui.close} className="glitch-x max-w-xl">
        {item && (
          <>
            <div className="flex items-start gap-5">
              <div
                className={cn(
                  'relative size-24 shrink-0 overflow-hidden',
                  item.kind === 'good' ? 'rounded-[3px] border border-line-2' : 'rounded-full slot-ring-active',
                )}
                style={{ ['--rarity' as string]: RARITY_COLOR[item.rarity] }}
              >
                {item.logo ? (
                  <span className="grid size-full place-items-center bg-[#1b2229]">
                    <TechIcon name={item.logo} className="size-[52%]" />
                  </span>
                ) : (
                  <img src={item.icon} alt="" className="size-full object-cover" />
                )}
                {item.kind === 'good' && <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'var(--rarity)' }} />}
                {item.count && (
                  <span className="absolute right-1.5 bottom-1 font-display text-[0.8rem] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] tabular-nums">
                    {item.count}
                  </span>
                )}
              </div>
              <DialogHeader className="flex-1 pr-6">
                <p className="label-caps" style={{ color: RARITY_COLOR[item.rarity] }}>
                  {inv.rarity[item.rarity]} · {item.tag}
                </p>
                <DialogTitle className="text-2xl tracking-[0.06em]">{item.name}</DialogTitle>
                <DialogDescription className="text-[0.95rem] text-ink-2">{item.desc}</DialogDescription>
              </DialogHeader>
            </div>

            <dl className="grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
              {item.level !== undefined && (
                <div>
                  <dt className="label-caps mb-1.5">{inv.levelLabel}</dt>
                  <dd className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/60">
                      <div className="h-full rounded-full bg-gradient-to-r from-ember to-gold" style={{ width: `${item.level}%` }} />
                    </div>
                  </dd>
                </div>
              )}
              {item.status && (
                <div>
                  <dt className="label-caps mb-1.5">{inv.statusLabel}</dt>
                  <dd>
                    <Badge variant="outline" className="border-teal/60 text-teal-2">
                      {item.status}
                    </Badge>
                  </dd>
                </div>
              )}
              {item.count && (
                <div>
                  <dt className="label-caps mb-1.5">{t.goods.countLabel}</dt>
                  <dd className="font-display text-brass-2 tabular-nums">{item.count}</dd>
                </div>
              )}
              {item.spec && (
                <div className="sm:col-span-2">
                  <dt className="label-caps mb-1.5">{t.goods.specLabel}</dt>
                  <dd className="grid gap-1">
                    {item.spec.map((s) => (
                      <div key={s.label} className="flex justify-between gap-4 border-b border-line/50 pb-1 last:border-0">
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{s.label}</span>
                        <span className="text-right text-ink">{s.value}</span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
              {item.tech && (
                <div className="sm:col-span-2">
                  <dt className="label-caps mb-1.5">{inv.techLabel}</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {item.tech.map((x) => (
                      <Badge key={x} variant="secondary" className="border border-line font-medium text-ink-2">
                        {x}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
              {item.links && (
                <div className="sm:col-span-2">
                  <dt className="label-caps mb-1.5">{inv.linksLabel}</dt>
                  <dd className="flex flex-wrap gap-3">
                    {item.links.map((l) => (
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
                  </dd>
                </div>
              )}
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
