import { ArrowUpRight, Bot, Globe, GraduationCap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { images, icons, type TabId } from '@/content'

const ICONS = [Globe, Bot, GraduationCap]

/* "Kilta": Havaida Oy ja sen palvelulinjat */
export function OrderScreen({ onSelectTab }: { onSelectTab: (id: TabId) => void }) {
  const { t } = useLang()
  const { play } = useSound()
  const o = t.order

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-3 py-5 sm:px-5 lg:grid-cols-[1fr_1.1fr]">
      <section className="panel corners relative overflow-hidden rounded-sm p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="size-16 shrink-0 overflow-hidden rounded-full slot-ring">
            <img src={icons.compass} alt="" className="size-full object-cover" />
          </div>
          <div>
            <p className="label-caps">{o.lead}</p>
            <h2 className="text-2xl tracking-[0.1em] text-ink md:text-3xl">{o.name}</h2>
            <p className="text-xs text-muted-foreground">{o.founded}</p>
          </div>
        </div>
        <p className="mt-5 font-display text-[1.05rem] italic text-brass-2">“{o.tagline}”</p>
        <p className="mt-3 max-w-[60ch] text-[0.95rem] text-ink-2">{o.desc}</p>

        <ul className="mt-6 flex flex-col gap-3">
          {o.services.map((s, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <li
                key={s.title}
                onMouseEnter={() => play('tick')}
                className="flex items-start gap-3 rounded-sm border border-line/70 bg-bg-2/40 px-3 py-3 transition-colors hover:border-brass/60"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-brass/50 text-brass">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="font-display text-[0.78rem] uppercase tracking-[0.16em] text-ink">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-sm font-display text-[0.7rem] uppercase tracking-[0.18em]">
            <a href={o.link.href} target="_blank" rel="noreferrer noopener" onClick={() => play('select')}>
              {o.link.label}
              <ArrowUpRight />
            </a>
          </Button>
          <Button
            variant="outline"
            className="rounded-sm border-brass/60 font-display text-[0.7rem] uppercase tracking-[0.18em]"
            onClick={() => {
              play('select')
              onSelectTab('codex')
            }}
          >
            {o.cta.label}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <figure className="relative overflow-hidden rounded-sm border border-line sm:col-span-2">
          <img src={images.havaida.src} alt="havaida.com" width={800} height={500} loading="lazy" className="w-full object-cover" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg to-transparent px-4 pb-3 pt-10 font-display text-[0.68rem] uppercase tracking-[0.2em] text-ink-2">
            havaida.com
          </figcaption>
        </figure>
        <figure className="relative overflow-hidden rounded-sm border border-line">
          <img src={images.demot.src} alt="" width={800} height={500} loading="lazy" className="w-full object-cover" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg to-transparent px-4 pb-3 pt-10 font-display text-[0.68rem] uppercase tracking-[0.2em] text-ink-2">
            havaida.com/demot
          </figcaption>
        </figure>
        <figure className="relative overflow-hidden rounded-sm border border-line">
          <img src={images.tyopaja.src} alt="" width={900} height={502} loading="lazy" className="h-full w-full object-cover" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg to-transparent px-4 pb-3 pt-10 font-display text-[0.68rem] uppercase tracking-[0.2em] text-ink-2">
            Lab
          </figcaption>
        </figure>
      </section>
    </div>
  )
}
