import type { LoftZoneId, TabId } from '@/content'

/**
 * Loftikerros 5 (metreinä, glTF-koordinaatit: y ylös). Huoneet järjestetty aulan ympärille:
 * - koti (Gaming Apartment): x −4,4…4,4, z −5,2…5,16 – eteinen ja kirjasto, olohuone ja keittiö, makuuhuone, parveke
 * - hissiaula: z 5,16…7,5, hissi aulan länsipäädyssä
 * - työ-siipi: z 7,5…17,8 – arcade-galleria, kahvio, WC ja tekniikka, war room ja lasiseinän takana paja
 *   (työkone, robottikäsi ja 3D-tulostin, palvelimet ja näytöt; ikkunat pohjoisessa)
 * Koko kerros on yksi Blenderissä paistettu malli (scripts/loft/floor5).
 */
export const ROOM = { minX: -4.4, maxX: 4.4, minZ: -5.2, maxZ: 17.8, wallTop: 3 } as const

export interface ZoneDef {
  id: LoftZoneId
  /** Mikä nykyisen sivun osio aukeaa (puuttuu linkkikohteilta: ulkoinen sivu tulee sisällöstä, loft.zones[].link) */
  tab?: TabId
  /** Osion kohta, johon vieritetään (elementin id) */
  section?: string
  /** Kohta lattialla, jossa osio avautuu (x, z) */
  hotspot: [number, number]
  /** Leijuva merkki esineen yllä (x, y, z) */
  marker: [number, number, number]
}

/** Reitin järjestys aulasta: koti (eteinen → olohuone → makuuhuone → parveke), sitten työ-siipi pajaan asti */
export const ZONES: ZoneDef[] = [
  // aula
  { id: 'elevator', tab: 'order', hotspot: [-3.0, 6.33], marker: [-3.85, 2.5, 6.33] },
  // koti
  { id: 'library', tab: 'codex', hotspot: [-0.05, 3.3], marker: [-0.8, 2.35, 3.4] },
  { id: 'hobbies', tab: 'codex', hotspot: [-3.05, -2.3], marker: [-3.3, 2.4, -3.1] },
  { id: 'trophies', tab: 'skills', hotspot: [0.6, -2.25], marker: [-0.2, 1.35, -2.3] },
  { id: 'window', tab: 'map', hotspot: [3.2, -4.4], marker: [4.0, 2.0, -4.85] },
  // työ-siipi
  { id: 'arcade', hotspot: [-0.65, 9.4], marker: [0.15, 2.4, 9.4] },
  { id: 'meeting', tab: 'codex', section: 'codex-references', hotspot: [-2.2, 12.95], marker: [-1.05, 1.3, 12.95] },
  { id: 'warroom', tab: 'quests', hotspot: [2.9, 12.95], marker: [3.9, 2.25, 12.95] },
  // paja: web-työpenkki ikkunalla, työkone (laikku.dev) länsiseinällä, robottikäsi + 3D-tulostin itäseinällä, palvelimet (GitHub) lasiseinällä
  { id: 'workshop', tab: 'items', hotspot: [-1.2, 16.25], marker: [-1.2, 2.3, 17.05] },
  { id: 'desk', hotspot: [-2.7, 16.05], marker: [-3.55, 1.55, 16.05] },
  { id: 'maker', tab: 'inventory', hotspot: [2.85, 15.45], marker: [3.3, 1.85, 15.2] },
  { id: 'servers', hotspot: [1.6, 16.05], marker: [1.6, 1.55, 15.04] },
]

/** Kuinka läheltä (m) esineen voi avata */
export const INTERACT_RADIUS = 1.35

/** Aloituspaikka hissin edessä aulassa (katse itään, kodin ja loftin ovet sivuilla) */
export const SPAWN: [number, number, number] = [-1.9, 1.2, 6.33]
export const SPAWN_YAW = Math.PI / 2

/** Mallit: public/models/loft (Fab-lisenssi – eivät ole julkisessa repossa) */
export const MODEL_BASE = `${import.meta.env.BASE_URL}models/loft/`

/** bottom = pohjan keskipiste, back/front = pohja + taka-/etupinta, top = yläpinnan keskipiste, wall = takapinnan keskipiste,
 * origin = mallin oma origo (animoidut esineet, joiden rajat vaihtelevat liikkeen mukaan) */
export type Anchor = 'bottom' | 'back' | 'front' | 'top' | 'wall' | 'origin'

export interface PropDef {
  id: string
  file: string
  /** Ankkuripiste maailmassa (x, y, z) */
  at: [number, number, number]
  /** Kierto y-akselin ympäri: mallin +z (etupuoli) käännetään tähän suuntaan */
  rotY?: number
  /** Kallistus x-akselin ympäri (seinäkartta) */
  rotX?: number
  /** Koko: korkeus (h) tai leveys (w, mallin x-suunta) metreinä, tai suora skaala (s) */
  fit: { h?: number; w?: number; s?: number }
  anchor?: Anchor
  /** Törmäyslaatikko: 'box' koko kappaleelle, 'thin' vain takaosaan, false ei mitään */
  collider?: 'box' | 'thin' | false
  zone?: LoftZoneId
  castShadow?: boolean
  /** Litistä syvyyssuunnassa (hissin kori asunnon ulkopuolella → pelkkä ovijulkisivu) */
  depthScale?: number
  /** Toistettava animaatio (silmukka) ja sen nopeus */
  anim?: string
  animSpeed?: number
}

const HALF_PI = Math.PI / 2

export const PROPS: PropDef[] = [
  // Hissi: ovijulkisivu aulan länsipäädyssä, kori kerroksen ulkopuolella
  { id: 'elevator', file: 'elevator.glb', at: [-4.12, 0, 6.33], rotY: HALF_PI, fit: { h: 2.6 }, anchor: 'front', depthScale: 0.1, collider: 'box', zone: 'elevator' },
  // koti – Kirjasto: hylly eteisen länsiseinällä
  { id: 'bookshelf', file: 'bookshelf.glb', at: [-1.0, 0, 3.4], rotY: HALF_PI, fit: { w: 1.72 }, anchor: 'back', collider: 'box', zone: 'library' },
  // koti – Harrastukset: haarniska olohuoneen nurkassa
  { id: 'knight', file: 'knight.glb', at: [-3.3, 0, -3.1], rotY: HALF_PI * 0.6, fit: { h: 1.9 }, anchor: 'bottom', collider: 'box', zone: 'hobbies' },
  // koti – Palkinnot: pokaalit työhuoneen konsolilla
  { id: 'trophy', file: 'trophy.glb', at: [-0.21, 0.51, -2.45], rotY: HALF_PI, fit: { h: 0.42 }, anchor: 'bottom', collider: false, zone: 'trophies' },
  { id: 'trophy2', file: 'trophy.glb', at: [-0.2, 0.51, -2.08], rotY: HALF_PI, fit: { h: 0.32 }, anchor: 'bottom', collider: false },
  // paja: robottikäsi maker-penkillä 3D-tulostimen vieressä (liike pysyy penkin päällä: x 3,34…4,07, z 15,39…16,01)
  { id: 'robotarm', file: 'robotarm.glb', at: [3.84, 0.9, 15.72], rotY: -HALF_PI, fit: { s: 0.4 }, anchor: 'origin', collider: false, zone: 'maker', anim: 'Animation', animSpeed: 0.55 },
  // koti – Parveke: kaukoputki parvekkeen nurkassa (parvekkeen ovelta jää tilaa astua sisään)
  { id: 'telescope', file: 'telescope.glb', at: [4.02, 0, -4.82], rotY: Math.PI * 0.85, fit: { h: 1.35 }, anchor: 'bottom', collider: 'box', zone: 'window' },
  // työ-siipi – Arcade-galleria: kolme kaappia itäseinällä, keskimmäinen vie Havaida Games -sivulle
  { id: 'arcade', file: 'arcade.glb', at: [0.53, 0, 9.4], rotY: -HALF_PI, fit: { h: 1.95 }, anchor: 'back', collider: 'box', zone: 'arcade' },
  { id: 'arcade2', file: 'arcade.glb', at: [0.53, 0, 8.35], rotY: -HALF_PI, fit: { h: 1.95 }, anchor: 'back', collider: 'box' },
  { id: 'arcade3', file: 'arcade.glb', at: [0.53, 0, 10.45], rotY: -HALF_PI, fit: { h: 1.95 }, anchor: 'back', collider: 'box' },
  // työ-siipi – War room: valkotaulu itäseinällä neuvottelupöydän päädyssä, maailmankartta länsiseinän pähkinäpaneelilla
  { id: 'whiteboard', file: 'whiteboard.glb', at: [4.14, 0, 12.95], rotY: -HALF_PI, fit: { w: 1.85 }, anchor: 'back', collider: 'thin', zone: 'warroom' },
  { id: 'worldmap', file: 'worldmap.glb', at: [-4.1, 1.7, 12.95], rotY: HALF_PI, rotX: HALF_PI, fit: { w: 1.6 }, anchor: 'wall', collider: false, castShadow: false },
  // työ-siipi – Paja: työpenkki ikkunaa vasten + linjavalaisin
  { id: 'workbench', file: 'workbench.glb', at: [-1.2, 0, 17.42], rotY: Math.PI, fit: { w: 1.4 }, anchor: 'back', collider: 'box', zone: 'workshop' },
  { id: 'lamp', file: 'lamp.glb', at: [-1.2, 2.71, 17.0], rotY: Math.PI, fit: { h: 1.15 }, anchor: 'top', collider: false, castShadow: false },
]

/** Maailmankartan korostetut maat (koti ja seuraava kohde) */
export const MAP_HIGHLIGHT: Record<string, string> = { FI: '#e8cf96', HR: '#3fa7a0' }
