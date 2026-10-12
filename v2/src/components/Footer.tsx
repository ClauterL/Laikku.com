import { ArrowUp } from 'lucide-react'

import { useLang } from '@/hooks/useLang'

/* Footer samalla tummalla sävyllä kuin CTA-kaista (hiili vaaleassa, viinimusta tummassa) */
export function Footer() {
  const { t } = useLang()

  return (
    <footer className="bg-cta text-cta-foreground">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_auto] md:items-end md:py-14">
        <div>
          <p className="font-display text-3xl font-semibold text-cta-foreground">Claus Laikku</p>
          <p className="mt-1 text-sm text-cta-foreground/60">{t.footer.place}</p>
          <p className="mt-4 max-w-[48ch] text-xs text-cta-foreground/55">{t.footer.built}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm md:gap-12">
          <div>
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-wider text-cta-foreground/60">{t.ui.menu}</p>
            <ul className="flex flex-col gap-1.5">
              {t.nav.items.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-cta-foreground/85 hover:text-hiekka">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-wider text-cta-foreground/60">{t.services.heading}</p>
            <ul className="flex flex-col gap-1.5">
              {t.services.items.map((sv) => (
                <li key={sv.title} className="text-cta-foreground/85">
                  {sv.title}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
            {t.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noreferrer noopener"
                className="font-semibold text-cta-foreground/85 hover:text-hiekka"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-xs text-cta-foreground/60">
            <span>{t.footer.copyright}</span>
            <a
              href="#top"
              className="inline-flex size-9 items-center justify-center rounded-full border border-cta-foreground/30 text-cta-foreground transition-colors hover:border-hiekka hover:text-hiekka"
              aria-label="Top"
            >
              <ArrowUp className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
