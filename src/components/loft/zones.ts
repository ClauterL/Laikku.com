import type { LoftZoneId, TabId } from '@/content'

/**
 * Loftin pohjapiirros (metreinä). Huone on 24 × 16 m: x −12…12, z −8…8.
 * Ikkunaseinä on pohjoisessa (z = −8), hissi etelässä (z = +8).
 * Reitti 1–9 kulkee alarivistä (menneisyys) ikkunariviin (tulevaisuus).
 */
export const ROOM = { halfX: 12, halfZ: 8, height: 4.2 } as const

export interface ZoneDef {
  id: LoftZoneId
  /** Mikä nykyisen sivun osio aukeaa */
  tab: TabId
  /** Vyöhykkeen keskipiste lattialla (x, z) */
  center: [number, number]
  /** Esine, jonka luona osio avautuu (x, z) */
  hotspot: [number, number]
  /** Vyöhykkeen maton sävy */
  tint: string
}

const COL = { w: -8, c: 0, e: 8 } as const
const ROW = { s: 5.2, m: 0, n: -5.2 } as const

export const ZONES: ZoneDef[] = [
  { id: 'elevator', tab: 'order', center: [COL.w, ROW.s], hotspot: [-11, 5.2], tint: '#2b2f45' },
  { id: 'workshop', tab: 'items', center: [COL.c, ROW.s], hotspot: [0, 6.3], tint: '#3a2a22' },
  { id: 'library', tab: 'codex', center: [COL.e, ROW.s], hotspot: [10.6, 5.2], tint: '#2c2620' },
  { id: 'desk', tab: 'skills', center: [COL.e, ROW.m], hotspot: [9.6, 0], tint: '#242833' },
  { id: 'warroom', tab: 'quests', center: [COL.c, ROW.m], hotspot: [0, 0.9], tint: '#272233' },
  { id: 'projects', tab: 'inventory', center: [COL.w, ROW.m], hotspot: [-8.4, 0], tint: '#2a2028' },
  { id: 'hobbies', tab: 'codex', center: [COL.w, ROW.n], hotspot: [-10.2, -5.6], tint: '#302422' },
  { id: 'trophies', tab: 'skills', center: [COL.c, ROW.n], hotspot: [0, -6.9], tint: '#2e2a1f' },
  { id: 'window', tab: 'map', center: [COL.e, ROW.n], hotspot: [7.6, -4.8], tint: '#1f2a33' },
]

/** Kuinka läheltä (m) esineen voi avata */
export const INTERACT_RADIUS = 2.6

/** Aloituspaikka hissin edessä (hissi on länsiseinällä, jottei se peitä kameraa) */
export const SPAWN: [number, number, number] = [-9.4, 1.6, 5.4]
