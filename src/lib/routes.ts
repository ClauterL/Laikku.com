import type { TabId } from '@/content'

/** Pelivalikon välilehdet osoitteen järjestyksessä (#skills …) */
export const TAB_IDS: TabId[] = ['skills', 'inventory', 'items', 'map', 'quests', 'order', 'codex']

/** Normaalin portfolion osoite */
export const PORTFOLIO_HASH = '#portfolio'
/** Pelillistetty portfolio: Kahvijahti (avoin maailma) */
export const QUEST_HASH = '#quest'
/** Edellinen pelillistetty portfolio (Dronelento) – varmuuskopio, avautuu tällä osoitteella */
export const FLIGHT_HASH = '#flight'

export const isLoftHash = (hash = window.location.hash) => hash === '#loft'
export const isTabHash = (hash = window.location.hash) => TAB_IDS.includes(hash.slice(1) as TabId)
/** Vanhan pelillistetyn portfolion (3D-loft, varmuuskopio) osoitteet: #loft ja välilehdet (#map …) */
export const isGameHash = (hash = window.location.hash) => isLoftHash(hash) || isTabHash(hash)

export const setHash = (hash: string) => {
  try {
    window.history.replaceState(null, '', hash)
  } catch {}
}
