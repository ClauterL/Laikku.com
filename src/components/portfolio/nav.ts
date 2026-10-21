import type { PortfolioSection } from '@/content'

/** Osion DOM-id (etuliite, ettei törmää pelivalikon id:ihin) */
export const sectionId = (id: PortfolioSection) => `pf-${id}`

/** Vierittää osioon ja siirtää fokuksen sinne (osoite pysyy #portfolio, jotta reititys ei muutu) */
export function goToSection(id: PortfolioSection, focus?: string) {
  const el = document.getElementById(sectionId(id))
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  const target = (focus && document.getElementById(focus)) || el
  window.setTimeout(() => target.focus({ preventScroll: true }), reduce ? 0 : 450)
}
