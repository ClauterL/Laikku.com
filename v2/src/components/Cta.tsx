import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Picture } from '@/components/Picture'
import { useLang } from '@/hooks/useLang'

/* Tumma hiili-kaista talvikuvalla: "Onko sinulla projekti mielessä?" */
export function Cta() {
  const { t } = useLang()
  const c = t.cta

  return (
    <section className="py-16 md:py-24">
      <div className="container-x">
        <div className="reveal grid overflow-hidden rounded-lg rounded-tr-[var(--radius-hero)] border border-border bg-cta text-cta-foreground md:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col justify-center gap-5 p-8 md:p-12 lg:p-16">
            <span className="eyebrow text-hiekka before:bg-hiekka">{c.eyebrow}</span>
            <h2 className="text-[2.4rem] leading-[1.02] tracking-[-0.02em] text-cta-foreground md:text-[3.2rem]">{c.heading}</h2>
            <p className="max-w-[48ch] text-lg text-cta-foreground/75">{c.text}</p>
            <div className="mt-2">
              <Button asChild size="lg" className="bg-luu text-hiili hover:bg-hiekka hover:text-hiili">
                <a href={c.button.href}>
                  {c.button.label}
                  <ArrowRight />
                </a>
              </Button>
            </div>
          </div>
          <Picture image={c.image} className="min-h-[320px] md:min-h-0" imgClassName="object-[50%_20%]" />
        </div>
      </div>
    </section>
  )
}
