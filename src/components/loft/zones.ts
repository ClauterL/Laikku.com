import type { LoftZoneId, TabId } from '@/content'

/**
 * Loftin pohjapiirros (metreinä, glTF-koordinaatit: y ylös).
 * Asunto on Gaming Apartment -tasosta viety 8,8 × 10,3 m:n huoneisto:
 * x −4,4…4,4 (länsi–itä), z −5,2…5,2 (ikkunat ja parveke etelässä z < 0, hissi pohjoisessa z > 0).
 */
export const ROOM = { minX: -4.4, maxX: 4.4, minZ: -5.2, maxZ: 5.2, wallTop: 3 } as const

export interface ZoneDef {
  id: LoftZoneId
  /** Mikä nykyisen sivun osio aukeaa */
  tab: TabId
  /** Kohta lattialla, jossa osio avautuu (x, z) */
  hotspot: [number, number]
  /** Leijuva merkki esineen yllä (x, y, z) */
  marker: [number, number, number]
}

export const ZONES: ZoneDef[] = [
  { id: 'elevator', tab: 'order', hotspot: [0.6, 4.05], marker: [0.6, 3.05, 4.7] },
  { id: 'workshop', tab: 'items', hotspot: [-2.55, 2.3], marker: [-3.35, 2.45, 2.3] },
  { id: 'library', tab: 'codex', hotspot: [-0.05, 3.3], marker: [-0.8, 2.35, 3.4] },
  { id: 'desk', tab: 'skills', hotspot: [1.15, -3.75], marker: [-0.05, 1.95, -4.05] },
  { id: 'warroom', tab: 'quests', hotspot: [-3.0, -1.55], marker: [-3.5, 2.15, -1.75] },
  { id: 'projects', tab: 'inventory', hotspot: [0.25, 0.8], marker: [1.05, 2.4, 0.84] },
  { id: 'hobbies', tab: 'codex', hotspot: [-2.95, -3.05], marker: [-3.35, 2.4, -3.25] },
  { id: 'trophies', tab: 'skills', hotspot: [0.6, -2.25], marker: [-0.2, 1.35, -2.3] },
  { id: 'window', tab: 'map', hotspot: [3.35, -4.45], marker: [3.75, 2.0, -4.65] },
]

/** Kuinka läheltä (m) esineen voi avata */
export const INTERACT_RADIUS = 1.35

/** Aloituspaikka hissin edessä */
export const SPAWN: [number, number, number] = [0.6, 1.2, 2.75]

/** Mallit: public/models/loft (Fab-lisenssi – eivät ole julkisessa repossa) */
export const MODEL_BASE = `${import.meta.env.BASE_URL}models/loft/`

/** bottom = pohjan keskipiste, back/front = pohja + taka-/etupinta, top = yläpinnan keskipiste, wall = takapinnan keskipiste */
export type Anchor = 'bottom' | 'back' | 'front' | 'top' | 'wall'

export interface PropDef {
  id: string
  file: string
  /** Ankkuripiste maailmassa (x, y, z) */
  at: [number, number, number]
  /** Kierto y-akselin ympäri: mallin +z (etupuoli) käännetään tähän suuntaan */
  rotY?: number
  /** Kallistus x-akselin ympäri (seinäkartta) */
  rotX?: number
  /** Koko: korkeus (h) tai leveys (w, mallin x-suunta) metreinä */
  fit: { h?: number; w?: number }
  anchor?: Anchor
  /** Törmäyslaatikko: 'box' koko kappaleelle, 'thin' vain takaosaan, false ei mitään */
  collider?: 'box' | 'thin' | false
  zone?: LoftZoneId
  castShadow?: boolean
  /** Litistä syvyyssuunnassa (hissin kori asunnon ulkopuolella → pelkkä ovijulkisivu) */
  depthScale?: number
}

const HALF_PI = Math.PI / 2

export const PROPS: PropDef[] = [
  // 1 Hissi: ovet seinässä, kori ulottuu asunnon ulkopuolelle
  { id: 'elevator', file: 'elevator.glb', at: [0.6, 0, 4.9], rotY: Math.PI, fit: { h: 2.75 }, anchor: 'front', depthScale: 0.1, collider: 'box', zone: 'elevator' },
  // 2 Paja: työpenkki keittiön puolella + linjavalaisin
  { id: 'workbench', file: 'workbench.glb', at: [-3.76, 0, 2.3], rotY: HALF_PI, fit: { w: 1.8 }, anchor: 'back', collider: 'box', zone: 'workshop' },
  { id: 'lamp', file: 'lamp.glb', at: [-3.15, 2.7, 2.3], rotY: HALF_PI, fit: { h: 1.15 }, anchor: 'top', collider: false, castShadow: false },
  // 3 Kirjasto: hylly eteisen länsiseinällä
  { id: 'bookshelf', file: 'bookshelf.glb', at: [-1.0, 0, 3.4], rotY: HALF_PI, fit: { w: 1.72 }, anchor: 'back', collider: 'box', zone: 'library' },
  // 5 War room: valkotaulu olohuoneen TV-seinän edessä
  { id: 'whiteboard', file: 'whiteboard.glb', at: [-3.74, 0, -1.75], rotY: HALF_PI, fit: { w: 1.85 }, anchor: 'back', collider: 'thin', zone: 'warroom' },
  // 6 Projektit: arcade-kaappi keskialueen itäseinällä
  { id: 'arcade', file: 'arcade.glb', at: [1.49, 0, 0.84], rotY: -HALF_PI, fit: { h: 1.95 }, anchor: 'back', collider: 'box', zone: 'projects' },
  // 7 Harrastukset: haarniska olohuoneen nurkassa
  { id: 'knight', file: 'knight.glb', at: [-3.4, 0, -3.22], rotY: HALF_PI * 0.6, fit: { h: 1.9 }, anchor: 'bottom', collider: 'box', zone: 'hobbies' },
  // 8 Palkinnot: pokaalit makuuhuoneen konsolilla
  { id: 'trophy', file: 'trophy.glb', at: [-0.21, 0.51, -2.45], rotY: HALF_PI, fit: { h: 0.42 }, anchor: 'bottom', collider: false, zone: 'trophies' },
  { id: 'trophy2', file: 'trophy.glb', at: [-0.2, 0.51, -2.08], rotY: HALF_PI, fit: { h: 0.32 }, anchor: 'bottom', collider: false },
  // 9 Ikkuna: kaukoputki parvekkeella ja maailmankartta sängyn yllä
  { id: 'telescope', file: 'telescope.glb', at: [3.8, 0, -4.62], rotY: Math.PI * 0.85, fit: { h: 1.45 }, anchor: 'bottom', collider: 'box', zone: 'window' },
  { id: 'worldmap', file: 'worldmap.glb', at: [4.05, 1.95, -2.1], rotY: -HALF_PI, rotX: HALF_PI, fit: { w: 1.7 }, anchor: 'wall', collider: false, castShadow: false },
]

/** Maailmankartan korostetut maat (koti ja seuraava kohde) */
export const MAP_HIGHLIGHT: Record<string, string> = { FI: '#e8cf96', HR: '#3fa7a0' }
