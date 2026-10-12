import { AtSign, BadgeCheck, Download, MapPin, Quote, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Picture } from '@/components/Picture'
import { SectionHead } from '@/components/SectionHead'
import { useLang } from '@/hooks/useLang'

const infoIcons = [User, AtSign, MapPin, BadgeCheck]

export function About() {
  const { t } = useLang()
  const a = t.about

  return (
    <section id="about" className="scroll-mt-24 py-16 md:py-24">
      <div className="container-x grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        {/* vasen: muotokuva + lainaus */}
        <div className="reveal relative lg:sticky lg:top-28">
          <Picture
            image={a.portrait}
            className="aspect-[4/5] rounded-lg rounded-tl-[var(--radius-hero)]"
            imgClassName="object-top"
          />
          <figure className="absolute -bottom-6 -right-2 max-w-[300px] rounded-lg border bg-card p-5 shadow-[0_18px_40px_-18px_rgba(18,18,20,0.35)] md:-right-8">
            <Quote className="mb-2 size-5 text-viini" />
            <blockquote className="font-display text-[1.2rem] font-semibold italic leading-snug">{a.quote}</blockquote>
          </figure>
        </div>

        {/* oikea: otsikko, teksti, tietokortti, lukutiilet, allekirjoitus */}
        <div className="pt-2">
          <SectionHead eyebrow={a.eyebrow} title={a.title} className="mb-6 max-w-[640px]" />
          <div className="reveal space-y-4 text-[1.0625rem] leading-relaxed text-foreground/85 md:text-lg">
            {a.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <div className="reveal reveal-delay-1 mt-8 grid gap-5 md:grid-cols-[1fr_1fr]">
            {/* tietokortti */}
            <Card className="gap-0 py-0">
              <CardContent className="px-5 py-4">
                <dl className="divide-y divide-border">
                  {a.info.map((row, i) => {
                    const Icon = infoIcons[i % infoIcons.length]
                    return (
                      <div key={row.label} className="grid grid-cols-[auto_84px_1fr] items-start gap-3 py-2.5 text-sm">
                        <Icon className="size-4 text-viini" />
                        <dt className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">{row.label}</dt>
                        <dd className="min-w-0 break-words font-semibold">
                          {row.href ? (
                            <a href={row.href} className="hover:underline">
                              {row.value}
                            </a>
                          ) : (
                            row.value
                          )}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </CardContent>
            </Card>

            {/* lukutiilet */}
            <div className="grid grid-cols-2 gap-3">
              {a.stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col justify-center rounded-lg border bg-card px-4 py-3 transition-colors hover:border-accent"
                >
                  <p className="font-display text-[2rem] font-semibold leading-none text-viini tabular-nums">{s.value}</p>
                  <p className="mt-1.5 text-[0.72rem] font-semibold uppercase leading-snug tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal reveal-delay-2 mt-7 flex flex-wrap items-center justify-between gap-5">
            <p className="font-script text-[2.4rem] leading-none text-foreground/80" aria-hidden>
              {a.signature}
            </p>
            {a.cv && (
              <Button asChild variant="outline">
                <a href={a.cv.href} download>
                  <Download />
                  {a.cv.label}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
