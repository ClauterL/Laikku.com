import { useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { SectionHead } from '@/components/SectionHead'
import { TechIcon } from '@/components/TechIcon'
import { useLang } from '@/hooks/useLang'

/* Taitopalkit täyttyvät, kun osio vieritetään näkyviin. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    const safety = window.setTimeout(() => setInView(true), 2500)
    return () => {
      io.disconnect()
      window.clearTimeout(safety)
    }
  }, [])
  return { ref, inView }
}

export function Skills() {
  const { t } = useLang()
  const s = t.skills
  const { ref, inView } = useInView<HTMLUListElement>()

  return (
    <section id="skills" className="scroll-mt-24 border-t border-border bg-card/60 py-16 md:py-24">
      <div className="container-x">
        <SectionHead eyebrow={s.eyebrow} title={s.heading} lead={s.lead} />

        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          {/* taitopalkit */}
          <ul ref={ref} className="reveal flex flex-col gap-4">
            {s.bars.map((b, i) => (
              <li key={b.name}>
                <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-semibold">{b.name}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{b.level} %</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={b.level}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={b.name}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-viini to-viini-2 transition-[width] duration-1000 ease-out"
                    style={{ width: inView ? `${b.level}%` : '0%', transitionDelay: `${i * 90}ms` }}
                  />
                </div>
              </li>
            ))}
            <li className="mt-3 grid gap-4 sm:grid-cols-3">
              {s.groups.map((g) => (
                <div key={g.title}>
                  <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{g.title}</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {g.items.map((x) => (
                      <li key={x}>
                        <Badge variant="secondary" className="font-medium">
                          {x}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </li>
          </ul>

          {/* ikoniruudukko */}
          <div className="reveal reveal-delay-1">
            <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{s.gridTitle}</p>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {s.grid.map((g) => (
                <li
                  key={g.name}
                  className="group flex flex-col items-center justify-center gap-2 rounded-lg border bg-card px-2 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_14px_30px_-18px_rgba(18,18,20,0.4)]"
                >
                  <span className="grid size-11 place-items-center rounded-full bg-muted transition-colors group-hover:bg-accent/30">
                    <TechIcon name={g.icon} className="size-6" />
                  </span>
                  <span className="text-xs font-semibold">{g.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
