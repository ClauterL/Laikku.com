import type { FlightStation } from '@/content'

/* Dronelennon maailma. Kaikki mitat ovat maiseman korkeuden H kerrannaisia (H = alhaalle ankkuroidun
   maisemalaatikon korkeus, ks. FlightGame → measure), joten maailma skaalautuu yhtenä kappaleena. */

/** Hero-tasojen kuvasuhde (3840 × 1118) – kaukaiset vaarat ja järvi */
export const TILE = 3840 / 1118
/** Vesiraja maisemalaatikon yläreunasta (kohteiden alareuna) */
export const WATER = 0.66
/** Maailman pituus */
export const WORLD = 12.4
/** Yö laskeutuu, kun drone ohittaa tämän kohdan (ja palaa päivään hieman ennen sitä) */
export const NIGHT_ON = 6.8
export const NIGHT_OFF = 6.5
/** Kohteen kohdalla, kun dronen etäisyys keskikohdasta on alle tämän */
export const NEAR = 0.42
/** Löydön keräyssäde (dronen keskikohdasta) */
export const GRAB = 0.075
/** Kestävyys: osumia ennen kuin kierroksen löydöt putoavat järveen */
export const HEARTS = 3
/** Dronen keskikohdan alin korkeus (jalat kastuvat jo ennen tätä) ja korkeus, jossa jalat koskettavat vettä */
export const Y_MAX = WATER - 0.085
export const SPLASH_Y = WATER - 0.116
/** Osumasuoja osuman jälkeen (s) ja aika, jonka ohjaus on pois (s) */
export const SHIELD = 1.6
export const STUN = 0.65

/** Valo kohteessa (osuus kuvan leveydestä/korkeudesta): lyhty, lamppu, nuotio tai majakan valokeila */
export type Light = { x: number; y: number; kind: 'lamp' | 'fire' | 'beam' }

export type StationDef = {
  id: FlightStation
  /** keskikohta maailmassa */
  x: number
  /** kuvan korkeus */
  h: number
  /** kuvan leveys / korkeus */
  ar: number
  lights?: Light[]
}

/** Kohteet vasemmalta oikealle: auringonlasku → (NIGHT_ON) → revontuliyö */
export const STATIONS: StationDef[] = [
  { id: 'dock', x: 0.95, h: 0.27, ar: 1200 / 504, lights: [{ x: 0.31, y: 0.13, kind: 'lamp' }] },
  { id: 'sauna', x: 2.25, h: 0.4, ar: 1200 / 706 },
  { id: 'workshop', x: 3.55, h: 0.44, ar: 1200 / 838, lights: [{ x: 0.52, y: 0.46, kind: 'lamp' }] },
  { id: 'island', x: 4.85, h: 0.36, ar: 1200 / 629 },
  { id: 'shed', x: 6.1, h: 0.42, ar: 1100 / 758 },
  { id: 'harbor', x: 7.45, h: 0.58, ar: 900 / 1163 },
  { id: 'campfire', x: 8.75, h: 0.4, ar: 1200 / 730, lights: [{ x: 0.505, y: 0.72, kind: 'fire' }] },
  { id: 'tower', x: 10.05, h: 0.62, ar: 800 / 928 },
  { id: 'lighthouse', x: 11.4, h: 0.52, ar: 900 / 844, lights: [{ x: 0.507, y: 0.16, kind: 'beam' }] },
]

/** Löydöt: taitopuun teknologiat (TechIcon-avain), järjestyksessä reitin varrella */
export const FIND_KEYS = ['react', 'typescript', 'tailwind', 'nodejs', 'supabase', 'nextjs', 'claude', 'python', 'docker', 'playwright', 'blender', 'raspberrypi']

/** Toistettava näennäissatunnainen luku 0…1 */
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return v - Math.floor(v)
}

/** Löytöjen korkeudet reitin varrella: osa korkealla taivaalla, osa aivan vedenpinnan yllä */
const FIND_Y = [0.02, -0.22, 0.4, -0.06, 0.47, -0.3, 0.22, 0.45, -0.2, 0.1, -0.28, 0.36]

/** Löydön rata: perusta (x, y) + liike kahdeksikkona (ax, ay, kulmanopeus w, vaihe p). y laatikon yläreunasta,
    negatiivinen = taivaalla. Paikka hetkellä t: x + ax·sin(w·t + p), y + ay·sin(2w·t + 1.3p) */
export type FindPath = { x: number; y: number; ax: number; ay: number; w: number; p: number }

export function findPath(i: number, n: number): FindPath {
  const x = 1.55 + (i * (STATIONS[STATIONS.length - 1].x - 0.6 - 1.55)) / Math.max(1, n - 1)
  return {
    x,
    y: FIND_Y[i % FIND_Y.length],
    ax: 0.08 + 0.2 * hash(i, 1),
    ay: 0.025 + 0.05 * hash(i, 2),
    w: 0.55 + 0.7 * hash(i, 3),
    p: hash(i, 4) * Math.PI * 2,
  }
}

/** Ilman vaarat: lokit päivällä, lepakot yöllä. Partioi x ± span (sinimuotoisesti, huippunopeus v H/s),
    korkeus y ± ay (kulmanopeus w). Osuma vie yhden kestävyyden; autopilotti on suojattu. */
export type Hazard = { kind: 'gull' | 'bat'; x: number; y: number; span: number; v: number; ay: number; w: number; p: number }

export const HAZARDS: Hazard[] = [
  { kind: 'gull', x: 1.85, y: -0.04, span: 0.45, v: 0.42, ay: 0.05, w: 1.3, p: 0.4 },
  { kind: 'gull', x: 2.95, y: 0.3, span: 0.55, v: 0.5, ay: 0.04, w: 1.1, p: 2.1 },
  { kind: 'gull', x: 3.3, y: -0.24, span: 0.5, v: 0.55, ay: 0.06, w: 0.9, p: 4.0 },
  { kind: 'gull', x: 4.25, y: 0.12, span: 0.6, v: 0.6, ay: 0.07, w: 1.2, p: 1.2 },
  { kind: 'gull', x: 5.35, y: -0.14, span: 0.55, v: 0.62, ay: 0.05, w: 1.4, p: 3.3 },
  { kind: 'gull', x: 5.75, y: 0.38, span: 0.4, v: 0.5, ay: 0.03, w: 1.0, p: 5.1 },
  { kind: 'bat', x: 7.05, y: 0.04, span: 0.45, v: 0.7, ay: 0.08, w: 1.9, p: 0.9 },
  { kind: 'bat', x: 7.95, y: 0.32, span: 0.5, v: 0.75, ay: 0.06, w: 2.2, p: 2.7 },
  { kind: 'bat', x: 8.3, y: -0.2, span: 0.55, v: 0.8, ay: 0.08, w: 1.7, p: 4.4 },
  { kind: 'bat', x: 9.3, y: 0.16, span: 0.6, v: 0.85, ay: 0.09, w: 2.0, p: 1.6 },
  { kind: 'bat', x: 10.65, y: -0.12, span: 0.5, v: 0.85, ay: 0.08, w: 2.3, p: 3.9 },
  { kind: 'bat', x: 10.95, y: 0.42, span: 0.35, v: 0.7, ay: 0.04, w: 1.8, p: 0.2 },
]

/** Puuskaiset alueet: puuska toistuu jaksolla PERIOD; ensin varoitus (tuulijuovat), sitten työntö suuntaan dir */
export const WIND: { a: number; b: number; dir: 1 | -1 }[] = [
  { a: 4.05, b: 5.6, dir: -1 },
  { a: 9.25, b: 10.85, dir: 1 },
]
/** push ja sink = tuulen lisäämä tavoitenopeus (H/s) sivulle ja alas */
export const GUST = { period: 6.5, warn: 3.9, blow: 4.6, push: 0.62, sink: 0.2 }

/** Kuinka pitkälle drone saa lentää */
export const X_MIN = 0.35
export const X_MAX = WORLD - 0.35
