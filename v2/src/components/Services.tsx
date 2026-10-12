import { ArrowUpRight, Bot, GraduationCap, Globe } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SectionHead } from '@/components/SectionHead'
import { useLang } from '@/hooks/useLang'

const icons = [Globe, Bot, GraduationCap]

export function Services() {
  const { t } = useLang()
  const s = t.services

  return (
    <section id="services" className="scroll-mt-24 border-y border-border bg-card/60 py-16 md:py-24">
      <div className="container-x">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHead eyebrow={s.eyebrow} title={s.heading} lead={s.lead} className="mb-0" />
          <Button asChild variant="outline" className="reveal mb-2 w-fit">
            <a href={s.link.href} target="_blank" rel="noreferrer noopener">
              {s.link.label}
              <ArrowUpRight />
            </a>
          </Button>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
          {s.items.map((item, i) => {
            const Icon = icons[i % icons.length]
            return (
              <Card
                key={item.title}
                className={`reveal reveal-delay-${i} gap-4 border-border bg-card py-7 transition-colors hover:border-accent`}
              >
                <CardContent className="flex flex-col gap-4 px-7">
                  <span className="grid size-11 place-items-center rounded-full bg-viini/10 text-viini">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="text-[1.65rem] leading-tight">{item.title}</h3>
                  <p className="text-[0.95rem] text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
