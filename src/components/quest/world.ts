import type { FlightStation, QuestTreat, QuestWhere } from '@/content'

/* Kahvijahdin maailma: pyöreä Järvi-Suomi-saari (säde ~58). Koordinaatit: x itään, z etelään, y ylös; maan pinta
   n. 0.2–0.6, vedenpinta WATER_Y. Kaikki on deterministististä (sama maailma joka kerta), ja samoja funktioita
   käytetään sekä maaston piirtämiseen että liikkumisen rajoihin. */

export const WATER_Y = 0
/** Kävelyalueen säde (metsä reunalla, ulompana maa viettää reunaan) */
export const WALK_R = 54
export const EDGE_R = 60

/* ---------- kohina ---------- */

function hash2(ix: number, iz: number) {
  const v = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453
  return v - Math.floor(v)
}

/** Arvokohina 0…1, pehmeä interpolointi */
export function noise(x: number, z: number) {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const ux = fx * fx * (3 - 2 * fx)
  const uz = fz * fz * (3 - 2 * fz)
  const a = hash2(ix, iz)
  const b = hash2(ix + 1, iz)
  const c = hash2(ix, iz + 1)
  const d = hash2(ix + 1, iz + 1)
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz
}

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/** Toistettava näennäissatunnainen luku 0…1 */
export const rand = (i: number, k = 0) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return v - Math.floor(v)
}

/* ---------- vesi ja maa ---------- */

/** Järvi lahtineen ja lampi: [x, z, säde x, säde z] */
export const LAKES: [number, number, number, number][] = [
  [6, -4, 20, 13],
  [-16, -16, 10.5, 8],
  [-3, -15, 8, 6],
  [24, 15, 6.5, 5],
]
/** Saaret (maata veden keskellä): [x, z, säde] */
export const ISLANDS: [number, number, number][] = [
  [6, -6, 5.6], // projektisaari
  [-17, -17, 2.7], // luoto lahdessa
]
/** Kukkulat: [x, z, säde, korkeus] */
const HILLS: [number, number, number, number][] = [
  [36, -13, 9, 3.4], // näkötornin mäki
  [-36, -28, 11, 2.2],
  [-38, 18, 9, 1.4],
  [14, 34, 8, 1.1],
]

/** >0 veden sisällä (järvet + itärannan meri), reunat aaltoilevat kohinalla */
export function waterField(x: number, z: number) {
  let f = -1
  const wob = (noise(x * 0.13 + 3.1, z * 0.13 - 1.7) - 0.5) * 0.36
  for (const [lx, lz, rx, rz] of LAKES) {
    const dx = (x - lx) / rx
    const dz = (z - lz) / rz
    f = Math.max(f, 1 - (dx * dx + dz * dz) + wob)
  }
  // meri idässä: rannikko x ≈ 43
  const coast = 43 + (noise(z * 0.09, 4.2) - 0.5) * 7
  f = Math.max(f, (x - coast) / 6)
  for (const [ix, iz, r] of ISLANDS) {
    const d = Math.hypot(x - ix, z - iz) / r
    f = Math.min(f, d - 1 + wob * 0.4)
  }
  return f
}

/** Maaston korkeus */
export function height(x: number, z: number) {
  let h = 0.18 + 0.32 * noise(x * 0.07, z * 0.07) + 0.12 * noise(x * 0.23 + 7, z * 0.23 + 3)
  for (const [hx, hz, r, hh] of HILLS) {
    const d = Math.hypot(x - hx, z - hz) / r
    if (d < 1) h += hh * (1 - smoothstep(0, 1, d)) * (0.85 + 0.3 * noise(x * 0.4, z * 0.4))
  }
  const w = waterField(x, z)
  if (w > -0.12) h = h * (1 - smoothstep(-0.12, 0.02, w)) - smoothstep(-0.05, 0.4, w) * 2.2 - smoothstep(-0.12, 0.02, w) * 0.15
  // maailman reuna: maa viettää alas
  const r = Math.hypot(x, z)
  if (r > EDGE_R - 4) h -= (r - (EDGE_R - 4)) * 0.9
  return h
}

/* ---------- laiturit ja silta (kävely veden päällä) ---------- */

/** Kävelytaso: keskikohta, koko (leveys x, pituus z ennen kiertoa), kierto y-akselin ympäri, pinnan korkeus */
export type Walkway = { x: number; z: number; w: number; d: number; rot: number; y: number }

export const WALKWAYS: Walkway[] = [
  { x: -2, z: 5.2, w: 2.2, d: 8, rot: 0, y: 0.42 }, // laituri (aloitus)
  { x: 6, z: 4.6, w: 2.6, d: 10.5, rot: 0, y: 0.5 }, // silta projektisaarelle
  { x: -24.1, z: -14.4, w: 1.8, d: 6.4, rot: Math.PI / 2 - 0.3, y: 0.42 }, // saunan laituri
  { x: 10, z: -13.5, w: 2.4, d: 7, rot: 0.05, y: 0.45 }, // sataman laituri
]

/** Onko piste kävelytasolla; palauttaa pinnan korkeuden tai null */
export function walkwayAt(x: number, z: number): number | null {
  for (const w of WALKWAYS) {
    const c = Math.cos(-w.rot)
    const s = Math.sin(-w.rot)
    const dx = x - w.x
    const dz = z - w.z
    const lx = dx * c - dz * s
    const lz = dx * s + dz * c
    if (Math.abs(lx) <= w.w / 2 && Math.abs(lz) <= w.d / 2) return w.y
  }
  return null
}

/* ---------- paikat (portfolion osiot) ---------- */

export type Place = {
  id: FlightStation
  /** rakennuksen keskikohta */
  x: number
  z: number
  /** kierto y-akselin ympäri (rakennuksen etupuoli +z:n suuntaan ennen kiertoa) */
  rot: number
  /** kohta, jossa paikka "avautuu" (sisäänkäynti) */
  sx: number
  sz: number
  /** törmäysympyrä rakennukselle (säde, 0 = ei) */
  r: number
}

export const PLACES: Place[] = [
  { id: 'dock', x: -2, z: 9.6, rot: 0, sx: -2, sz: 10.8, r: 0 },
  { id: 'sauna', x: -29, z: -12, rot: Math.PI / 2 - 0.3, sx: -26.2, sz: -12.6, r: 2.6 },
  { id: 'workshop', x: -30, z: 8, rot: Math.PI / 2 + 0.2, sx: -26.6, sz: 8.9, r: 3.3 },
  { id: 'island', x: 6, z: -7.5, rot: 0, sx: 6, sz: -3.6, r: 2.1 },
  { id: 'shed', x: -9, z: -32, rot: 0.15, sx: -8.6, sz: -28.6, r: 2.2 },
  { id: 'harbor', x: 13.5, z: -21.5, rot: 0.05, sx: 10.6, sz: -18.8, r: 2.8 },
  { id: 'campfire', x: 24, z: -30, rot: 0, sx: 24, sz: -27, r: 1.3 },
  { id: 'tower', x: 36, z: -13, rot: -0.5, sx: 33.2, sz: -10.4, r: 1.9 },
  { id: 'lighthouse', x: 41, z: 16, rot: -Math.PI / 2, sx: 38, sz: 16.5, r: 2 },
]

/** Aloituspaikka ja -suunta */
export const SPAWN = { x: -2, z: 15, face: Math.PI }
/** Donitsikioski aloituksen vieressä (koriste + yksi donitsi) */
export const KIOSK = { x: 6.5, z: 16.5, rot: -0.35, r: 2 }

/** Kuinka lähellä sisäänkäyntiä paikka avautuu */
export const NEAR = 3.4

/* ---------- herkut ---------- */

export type Treat = {
  id: string
  kind: QuestTreat
  x: number
  z: number
  /** korkeus pinnan (maa, laituri tai vesi) yläpuolella; oletus 0.65 */
  lift?: number
  /** vain dronella (katolla, vedessä, korkealla) */
  drone?: boolean
  where: QuestWhere
}

export const TREATS: Treat[] = [
  // kahvit
  { id: 'c-dock', kind: 'coffee', x: -2, z: 1.8, where: 'dock' },
  { id: 'c-sauna', kind: 'coffee', x: -29.2, z: -12.1, lift: 3.95, drone: true, where: 'sauna' },
  { id: 'c-workshop', kind: 'coffee', x: -25.8, z: 6.4, where: 'workshop' },
  { id: 'c-harbor', kind: 'coffee', x: 6.6, z: -12.6, lift: 1.45, drone: true, where: 'harbor' },
  { id: 'c-tower', kind: 'coffee', x: 36, z: -13, lift: 7.75, drone: true, where: 'tower' },
  { id: 'c-north', kind: 'coffee', x: 2, z: -40, where: 'north' },
  // donitsit
  { id: 'd-kiosk', kind: 'donut', x: 5.2, z: 18.4, where: 'kiosk' },
  { id: 'd-islet', kind: 'donut', x: -17, z: -17, where: 'islet', drone: true },
  { id: 'd-island', kind: 'donut', x: 9, z: -9.2, where: 'island' },
  { id: 'd-buoy', kind: 'donut', x: -6, z: -5, lift: 0.85, drone: true, where: 'lake' },
  { id: 'd-campfire', kind: 'donut', x: 26.2, z: -31.4, where: 'campfire' },
  { id: 'd-lighthouse', kind: 'donut', x: 41, z: 16, lift: 7.4, drone: true, where: 'lighthouse' },
  { id: 'd-pond', kind: 'donut', x: 24, z: 15, lift: 0.45, drone: true, where: 'pond' },
  { id: 'd-shed', kind: 'donut', x: -9.5, z: -36, where: 'shed' },
  // burritot
  { id: 'b-west', kind: 'burrito', x: -45, z: -4, where: 'west' },
  { id: 'b-tower', kind: 'burrito', x: 39.5, z: -8, where: 'tower' },
  { id: 'b-sea', kind: 'burrito', x: 50, z: 2, lift: 1.25, drone: true, where: 'sea' },
  { id: 'b-south', kind: 'burrito', x: -22, z: 36, where: 'south' },
]

/** Pinta, jolla herkku lepää: laituri, maa tai vedenpinta */
export const surfaceAt = (x: number, z: number) => walkwayAt(x, z) ?? Math.max(height(x, z), WATER_Y)

export const treatY = (t: Treat) => surfaceAt(t.x, t.z) + (t.lift ?? 0.65)

/** Poiju ja merikivi herkkujen alle */
export const BUOYS: [number, number][] = [[-6, -5]]
export const SEA_ROCKS: [number, number, number][] = [
  [50, 2, 1.4],
  [53, -6, 1],
  [48.5, 9, 0.8],
]

/* ---------- polut (vain maan väri) ---------- */

export const PATHS: [number, number][][] = [
  [[-2, 11], [-2, 16], [3, 18.5], [6, 19]],
  [[-2, 14], [-10, 13], [-19, 11.5], [-26.5, 9]],
  [[-26.5, 9], [-31, 0], [-28, -7], [-26.2, -12.6]],
  [[-2, 14], [3, 12], [6, 9.8]],
  [[3, 18.5], [14, 19], [22, 21.5], [31, 20], [38, 16.5]],
  [[38, 16.5], [37, 6], [33.2, -10.4]],
  [[33.2, -10.4], [30, -20], [24, -27]],
  [[24, -27], [18, -24], [10.6, -18.8]],
  [[10.6, -18.8], [0, -24.5], [-8.6, -28.6]],
  [[-8.6, -28.6], [-20, -26], [-28, -18], [-26.2, -12.6]],
]

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax
  const dz = bz - az
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz))
}

/** Etäisyys lähimpään polkuun */
export function pathDist(x: number, z: number) {
  let d = Infinity
  for (const p of PATHS) for (let i = 1; i < p.length; i++) d = Math.min(d, segDist(x, z, p[i - 1][0], p[i - 1][1], p[i][0], p[i][1]))
  return d
}

/* ---------- puut ja kivet ---------- */

export type Tree = { x: number; z: number; s: number; rot: number; kind: 0 | 1; tint: number }

/** Metsä: tiheys kohinasta, ei veteen, poluille eikä paikkojen ja herkkujen viereen */
export function makeTrees(): Tree[] {
  const out: Tree[] = []
  const clear: [number, number, number][] = [
    ...PLACES.map((p) => [p.x, p.z, p.id === 'campfire' ? 6.5 : 5.5] as [number, number, number]),
    ...PLACES.map((p) => [p.sx, p.sz, 3] as [number, number, number]),
    [SPAWN.x, SPAWN.z, 6],
    [KIOSK.x, KIOSK.z, 4.5],
    ...TREATS.filter((t) => !t.drone).map((t) => [t.x, t.z, 2.2] as [number, number, number]),
  ]
  let i = 0
  for (let gx = -EDGE_R; gx <= EDGE_R; gx += 2.3) {
    for (let gz = -EDGE_R; gz <= EDGE_R; gz += 2.3) {
      i++
      const x = gx + (rand(i, 1) - 0.5) * 2.1
      const z = gz + (rand(i, 2) - 0.5) * 2.1
      const r = Math.hypot(x, z)
      if (r > EDGE_R - 2.5) continue
      const edge = smoothstep(WALK_R - 10, WALK_R + 2, r) // reunalla tiheä metsä
      const dens = 0.18 + 0.75 * smoothstep(0.45, 0.72, noise(x * 0.045 + 11, z * 0.045 - 5)) + edge
      if (rand(i, 3) > dens) continue
      if (waterField(x, z) > -0.18) continue
      if (pathDist(x, z) < 2.2) continue
      if (clear.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr)) continue
      const birch = rand(i, 4) < 0.16 && edge < 0.5
      out.push({ x, z, s: 0.8 + rand(i, 5) * 0.65 + edge * 0.35, rot: rand(i, 6) * Math.PI * 2, kind: birch ? 1 : 0, tint: rand(i, 7) })
    }
  }
  return out
}

export type Rock = { x: number; z: number; s: number; rot: number }

/** Kiviä rannoille ja niityille */
export function makeRocks(): Rock[] {
  const out: Rock[] = []
  for (let i = 0; i < 900 && out.length < 110; i++) {
    const a = rand(i, 11) * Math.PI * 2
    const r = rand(i, 12) * (EDGE_R - 4)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const w = waterField(x, z)
    if (w > -0.03) continue // ei veteen (näyttäisivät pinnalla kelluvilta hiutaleilta)
    const shore = w > -0.3
    if (!shore && rand(i, 13) > 0.12) continue
    if (pathDist(x, z) < 1.6 || walkwayAt(x, z) !== null) continue
    if (PLACES.some((p) => Math.hypot(x - p.x, z - p.z) < 5 || Math.hypot(x - p.sx, z - p.sz) < 2.5)) continue
    out.push({ x, z, s: 0.35 + rand(i, 14) * (shore ? 0.9 : 0.6), rot: rand(i, 15) * 6.28 })
  }
  return out
}

/* ---------- liikkumisen rajat ---------- */

export type Blocker = { x: number; z: number; r: number }

/** Voiko pesukarhu seistä tässä: maata (ei vettä) kävelyalueella, tai laiturilla/sillalla */
export function groundAt(x: number, z: number): number | null {
  const ww = walkwayAt(x, z)
  if (ww !== null) return ww
  if (Math.hypot(x, z) > WALK_R) return null
  const h = height(x, z)
  if (h < WATER_Y + 0.12) return null
  return h
}
