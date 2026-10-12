import { useEffect } from 'react'

/**
 * Paljastaa .reveal-elementit vieritettäessä (lisää .in-view).
 * Turvaverkko: jos IntersectionObserver puuttuu tai jokin jää näkymättä,
 * kaikki paljastetaan 2,5 sekunnin kuluttua.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.in-view)'))
    if (!els.length) return

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in-view'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in-view')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    els.forEach((el) => io.observe(el))

    const safety = window.setTimeout(() => els.forEach((el) => el.classList.add('in-view')), 2500)
    return () => {
      io.disconnect()
      window.clearTimeout(safety)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
