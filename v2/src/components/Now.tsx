import { useLang } from '@/hooks/useLang'

/* "Nyt"-kaista: havaida.comin avainluku-kaistan vastine, 4 kohtaa */
export function Now() {
  const { t } = useLang()
  return (
    <section aria-label={t.now.heading} className="border-y border-border bg-card/70">
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-6 py-8 md:grid-cols-4 md:py-10">
        {t.now.items.map((it, i) => (
          <div key={it.title} className={`reveal reveal-delay-${Math.min(i, 3)} flex flex-col gap-1 border-l-2 border-accent pl-4`}>
            <p className="font-display text-[1.45rem] font-semibold leading-none text-foreground md:text-[1.7rem]">{it.title}</p>
            <p className="text-[0.8125rem] font-semibold uppercase tracking-wider text-muted-foreground">{it.caption}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
