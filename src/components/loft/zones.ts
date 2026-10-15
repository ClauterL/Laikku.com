import type { LoftZoneId, TabId } from '@/content'

/**
 * Loftikerros (metreinä, glTF-koordinaatit: y ylös). Koko kerros on kahden asunnon kokoinen:
 * - A = koti (Gaming Apartment sellaisenaan): x −4,4…4,4, z −5,2…5,2, ikkunat ja parveke etelässä
 * - hissiaula A:n ja B:n välissä: z 5,16…7,5, hissi aulan länsipäädyssä
 * - B = startup-loft (sama asunto 180° käännettynä, väliseinät pois): z 7,5…17,8, ikkunat pohjoisessa
 */
export const ROOM = { minX: -4.4, maxX: 4.4, minZ: -5.2, maxZ: 17.9, wallTop: 3 } as const
export const LOBBY = { minX: -4.39, maxX: 4.39, minZ: 5.16, maxZ: 7.5, height: 2.75 } as const

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
  // aula
  { id: 'elevator', tab: 'order', hotspot: [-3.0, 6.33], marker: [-3.85, 2.5, 6.33] },
  // B: startup-loft
  { id: 'workshop', tab: 'items', hotspot: [-2.85, 9.3], marker: [-3.75, 2.45, 9.3] },
  // A: koti
  { id: 'library', tab: 'codex', hotspot: [-0.05, 3.3], marker: [-0.8, 2.35, 3.4] },
  { id: 'desk', tab: 'skills', hotspot: [1.15, -3.75], marker: [-0.05, 1.95, -4.05] },
  // B
  { id: 'warroom', tab: 'quests', hotspot: [2.85, 9.1], marker: [3.85, 2.2, 9.1] },
  { id: 'projects', tab: 'inventory', hotspot: [-3.0, 11.6], marker: [-3.75, 2.4, 11.6] },
  // A
  { id: 'hobbies', tab: 'codex', hotspot: [-2.95, -3.05], marker: [-3.35, 2.4, -3.25] },
  { id: 'trophies', tab: 'skills', hotspot: [0.6, -2.25], marker: [-0.2, 1.35, -2.3] },
  { id: 'window', tab: 'map', hotspot: [3.35, -4.45], marker: [3.75, 2.0, -4.65] },
]

/** Kuinka läheltä (m) esineen voi avata */
export const INTERACT_RADIUS = 1.35

/** Aloituspaikka hissin edessä aulassa (katse itään, kodin ja loftin ovet sivuilla) */
export const SPAWN: [number, number, number] = [-2.3, 1.2, 6.33]
export const SPAWN_YAW = Math.PI / 2

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
  // 1 Hissi: ovijulkisivu aulan länsipäädyssä, kori kerroksen ulkopuolella
  { id: 'elevator', file: 'elevator.glb', at: [-4.12, 0, 6.33], rotY: HALF_PI, fit: { h: 2.6 }, anchor: 'front', depthScale: 0.1, collider: 'box', zone: 'elevator' },
  // A (koti) – 3 Kirjasto: hylly eteisen länsiseinällä
  { id: 'bookshelf', file: 'bookshelf.glb', at: [-1.0, 0, 3.4], rotY: HALF_PI, fit: { w: 1.72 }, anchor: 'back', collider: 'box', zone: 'library' },
  // A – 7 Harrastukset: haarniska olohuoneen nurkassa
  { id: 'knight', file: 'knight.glb', at: [-3.4, 0, -3.22], rotY: HALF_PI * 0.6, fit: { h: 1.9 }, anchor: 'bottom', collider: 'box', zone: 'hobbies' },
  // A – 8 Palkinnot: pokaalit makuuhuoneen konsolilla
  { id: 'trophy', file: 'trophy.glb', at: [-0.21, 0.51, -2.45], rotY: HALF_PI, fit: { h: 0.42 }, anchor: 'bottom', collider: false, zone: 'trophies' },
  { id: 'trophy2', file: 'trophy.glb', at: [-0.2, 0.51, -2.08], rotY: HALF_PI, fit: { h: 0.32 }, anchor: 'bottom', collider: false },
  // A – 9 Ikkuna: kaukoputki parvekkeella
  { id: 'telescope', file: 'telescope.glb', at: [3.8, 0, -4.62], rotY: Math.PI * 0.85, fit: { h: 1.45 }, anchor: 'bottom', collider: 'box', zone: 'window' },
  // B (startup-loft) – 2 Paja: työpenkki länsiseinällä + linjavalaisin
  { id: 'workbench', file: 'workbench.glb', at: [-4.14, 0, 9.3], rotY: HALF_PI, fit: { w: 1.8 }, anchor: 'back', collider: 'box', zone: 'workshop' },
  { id: 'lamp', file: 'lamp.glb', at: [-3.55, 2.7, 9.3], rotY: HALF_PI, fit: { h: 1.15 }, anchor: 'top', collider: false, castShadow: false },
  // B – 6 Projektit: arcade-kaappi länsiseinällä
  { id: 'arcade', file: 'arcade.glb', at: [-4.14, 0, 11.6], rotY: HALF_PI, fit: { h: 1.95 }, anchor: 'back', collider: 'box', zone: 'projects' },
  // B – 5 War room: valkotaulu neuvottelupöydän vieressä itäseinällä
  { id: 'whiteboard', file: 'whiteboard.glb', at: [4.14, 0, 9.1], rotY: -HALF_PI, fit: { w: 1.85 }, anchor: 'back', collider: 'thin', zone: 'warroom' },
  // B – maailmankartta kivipaneeliseinällä
  { id: 'worldmap', file: 'worldmap.glb', at: [-4.07, 1.95, 14.7], rotY: HALF_PI, rotX: HALF_PI, fit: { w: 2.0 }, anchor: 'wall', collider: false, castShadow: false },
]

/** Maailmankartan korostetut maat (koti ja seuraava kohde) */
export const MAP_HIGHLIGHT: Record<string, string> = { FI: '#e8cf96', HR: '#3fa7a0' }
