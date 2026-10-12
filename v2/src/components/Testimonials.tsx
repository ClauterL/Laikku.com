import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SectionHead } from '@/components/SectionHead'
import { useLang } from '@/hooks/useLang'
import { cn } from '@/lib/utils'

/* Suositukset: scroll-snap-karuselli, ei ulkoisia riippuvuuksia.
   Kortit, joilla placeholder: true, saavat näkyvän "paikkamerkki"-merkinnän. */
export function Testimonials() {
  const { t } = useLang()
  const s = t.testimonials
  const track = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = track.current
    if (!el) return
    const onScroll = () => {
      const w = el.clientWidth
      if (!w) return
      const first = el.firstElementChild as HTMLElement | null
      const step = first ? first.offsetWidth + 16 : w
      setActive(Math.round(el.scrollLeft / step))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  function go(i: number) {
    const el = track.current
    if (!el) return
    const first = el.firstElementChild as HTMLElement | null
    const step = first ? first.offsetWidth + 16 : el.clientWidth
    const n = s.items.length
    const idx = ((i % n) + n) % n
    el.scrollTo({ left: idx * step, behavior: 'smooth' })
  }

  return (
    <section id="testimonials" className="scroll-mt-24 py-16 md:py-24">
      <div className="container-x">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHead eyebrow={s.eyebrow} title={s.heading} lead={s.lead} className="mb-0" />
          <div className="reveal mb-2 flex gap-2">
            <Button variant="outline" size="icon" onClick={() => go(active - 1)} aria-label={s.prev}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" onClick={() => go(active + 1)} aria-label={s.next}>
              <ChevronRight />
            </Button>
          </div>
        </div>

        <ul
          ref={track}
          className="reveal mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {s.items.map((it, i) => (
            <li key={i} className="w-[88%] shrink-0 snap-start sm:w-[60%] lg:w-[calc((100%-2rem)/3)]">
              <Card className="h-full gap-0 py-0">
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <Quote className="size-6 text-viini" />
                    {it.placeholder && (
                      <Badge variant="outline" className="font-medium text-muted-foreground" title={s.placeholder}>
                        {s.placeholder.split(' – ')[0]}
                      </Badge>
                    )}
                  </div>
                  <blockquote className="font-display text-[1.25rem] font-semibold italic leading-snug">“{it.quote}”</blockquote>
                  <footer className="mt-auto flex items-center gap-3 pt-2">
                    <span className="grid size-10 place-items-center rounded-full bg-muted font-display text-sm font-semibold text-foreground/70">
                      {it.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)}
                    </span>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold">{it.name}</p>
                      <p className="text-xs text-muted-foreground">{it.role}</p>
                    </div>
                  </footer>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-center gap-2 lg:hidden">
          {s.items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1}/${s.items.length}`}
              className={cn('size-2 rounded-full transition-colors', i === active ? 'bg-viini' : 'bg-border')}
            />
          ))}
        </div>
        {s.items.some((it) => it.placeholder) && <p className="mt-4 text-center text-xs text-muted-foreground">{s.placeholder}</p>}
      </div>
    </section>
  )
}
