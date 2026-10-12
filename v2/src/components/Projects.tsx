import { ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Picture } from '@/components/Picture'
import { SectionHead } from '@/components/SectionHead'
import { useLang } from '@/hooks/useLang'

export function Projects() {
  const { t } = useLang()
  const p = t.projects

  return (
    <section id="projects" className="scroll-mt-24 border-t border-border bg-card/60 py-16 md:py-24">
      <div className="container-x">
        <SectionHead eyebrow={p.eyebrow} title={p.heading} lead={p.lead} />

        <div className="grid gap-6 md:grid-cols-3">
          {p.items.map((item, i) => {
            const Wrapper = item.href ? 'a' : 'div'
            const wrapperProps = item.href
              ? { href: item.href, target: '_blank', rel: 'noreferrer noopener' }
              : {}
            return (
              <Card
                key={item.title}
                className={`reveal reveal-delay-${i} group gap-0 overflow-hidden py-0 transition-shadow hover:shadow-[0_18px_40px_-20px_rgba(18,18,20,0.35)]`}
              >
                <Wrapper {...wrapperProps} className="block">
                  <Picture
                    image={item.image}
                    className="aspect-[16/10] border-b"
                    imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </Wrapper>
                <CardContent className="flex flex-1 flex-col gap-3 px-6 pb-6 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="sand">{item.tag}</Badge>
                    {item.href && (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-viini hover:underline"
                      >
                        {item.linkLabel}
                        <ArrowUpRight className="size-4" />
                        <span className="sr-only">({t.ui.externalLink})</span>
                      </a>
                    )}
                  </div>
                  <h3 className="text-[1.65rem] leading-tight">{item.title}</h3>
                  <p className="text-[0.95rem] text-muted-foreground">{item.text}</p>
                  <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
                    {item.tech.map((tech) => (
                      <li key={tech}>
                        <Badge variant="outline" className="font-medium">
                          {tech}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
