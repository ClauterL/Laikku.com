/**
 * Robottikoiran kulkuruudukko ja reitinhaku (puhdas TS, testattavissa ilman selainta).
 * nav.json tulee scripts/loft/walk-check.mjs:stä (NAV=…): 10 cm ruudut, esteet laajennettu koiran säteellä,
 * vain aloituspaikasta saavutettava alue.
 */
export interface NavData {
  x0: number
  z0: number
  cell: number
  nx: number
  nz: number
  /** Bittikartta base64:nä, bitti p = ruutu (p % nx, p / nx) */
  free: string
}

export interface Grid {
  nx: number
  nz: number
  x0: number
  z0: number
  c: number
  free: Uint8Array
  /** Etäisyys lähimpään esteeseen ruutuina */
  dist: Uint8Array
  /** Väljät kohdat satunnaisiksi määränpäiksi */
  cand: number[]
}

const N8: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
]

export function decodeGrid(nav: NavData): Grid {
  const { nx, nz } = nav
  const n = nx * nz
  const bin = atob(nav.free)
  const free = new Uint8Array(n)
  for (let p = 0; p < n; p++) free[p] = (bin.charCodeAt(p >> 3) >> (p & 7)) & 1
  const dist = new Uint8Array(n).fill(255)
  const q: number[] = []
  for (let p = 0; p < n; p++) if (!free[p]) (dist[p] = 0), q.push(p)
  for (let h = 0; h < q.length; h++) {
    const p = q[h]
    const i = p % nx
    const j = (p - i) / nx
    for (const [di, dj] of N8) {
      const a = i + di
      const b = j + dj
      if (a < 0 || b < 0 || a >= nx || b >= nz) continue
      const m = b * nx + a
      if (dist[m] > dist[p] + 1) {
        dist[m] = dist[p] + 1
        q.push(m)
      }
    }
  }
  const cand: number[] = []
  for (let p = 0; p < n; p++) if (free[p] && dist[p] >= 4) cand.push(p)
  return { nx, nz, x0: nav.x0, z0: nav.z0, c: nav.cell, free, dist, cand }
}

export const toCell = (g: Grid, x: number, z: number) => {
  const i = Math.min(g.nx - 1, Math.max(0, Math.floor((x - g.x0) / g.c)))
  const j = Math.min(g.nz - 1, Math.max(0, Math.floor((z - g.z0) / g.c)))
  return j * g.nx + i
}
export const cellXZ = (g: Grid, p: number): [number, number] => {
  const i = p % g.nx
  return [g.x0 + (i + 0.5) * g.c, g.z0 + ((p - i) / g.nx + 0.5) * g.c]
}

/** Lähin kuljettava ruutu (jos koira on työnnetty esteen viereen) */
export function nearestFree(g: Grid, p: number): number {
  if (g.free[p]) return p
  let best = -1
  let bd = Infinity
  const pi = p % g.nx
  const pj = (p - pi) / g.nx
  for (let j = Math.max(0, pj - 8); j < Math.min(g.nz, pj + 9); j++)
    for (let i = Math.max(0, pi - 8); i < Math.min(g.nx, pi + 9); i++) {
      const m = j * g.nx + i
      const d = (i - pi) ** 2 + (j - pj) ** 2
      if (g.free[m] && d < bd) (bd = d), (best = m)
    }
  return best
}

/** A* 8-naapurustolla; seinien vieressä kalliimpaa, jotta koira kulkee käytävien keskellä */
export function astar(g: Grid, s: number, t: number): number[] | null {
  const n = g.nx * g.nz
  const gs = new Float32Array(n).fill(Infinity)
  const par = new Int32Array(n).fill(-1)
  const closed = new Uint8Array(n)
  const tx = t % g.nx
  const tz = (t - tx) / g.nx
  const h = (p: number) => {
    const i = p % g.nx
    return Math.hypot(i - tx, (p - i) / g.nx - tz)
  }
  const heap: [number, number][] = [[h(s), s]]
  gs[s] = 0
  const push = (e: [number, number]) => {
    heap.push(e)
    let k = heap.length - 1
    while (k > 0) {
      const pk = (k - 1) >> 1
      if (heap[pk][0] <= heap[k][0]) break
      ;[heap[pk], heap[k]] = [heap[k], heap[pk]]
      k = pk
    }
  }
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()!
    if (heap.length) {
      heap[0] = last
      let k = 0
      for (;;) {
        const l = 2 * k + 1
        const r = l + 1
        let m = k
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r
        if (m === k) break
        ;[heap[m], heap[k]] = [heap[k], heap[m]]
        k = m
      }
    }
    return top
  }
  while (heap.length) {
    const [, p] = pop()
    if (p === t) break
    if (closed[p]) continue
    closed[p] = 1
    const i = p % g.nx
    const j = (p - i) / g.nx
    for (const [di, dj, w] of N8) {
      const a = i + di
      const b = j + dj
      if (a < 0 || b < 0 || a >= g.nx || b >= g.nz) continue
      const m = b * g.nx + a
      if (!g.free[m] || closed[m]) continue
      if (di && dj && (!g.free[j * g.nx + a] || !g.free[b * g.nx + i])) continue
      const pen = g.dist[m] >= 4 ? 0 : (4 - g.dist[m]) * 0.7
      const ng = gs[p] + w * (1 + pen)
      if (ng < gs[m]) {
        gs[m] = ng
        par[m] = p
        push([ng + h(m), m])
      }
    }
  }
  if (par[t] < 0 && s !== t) return null
  const path: number[] = []
  for (let p = t; p !== -1; p = par[p]) path.push(p)
  return path.reverse()
}

/** Näköyhteys ruudukolla (väljyys >= 2 ruutua) */
export function los(g: Grid, a: number, b: number): boolean {
  const ai = a % g.nx
  const aj = (a - ai) / g.nx
  const bi = b % g.nx
  const bj = (b - bi) / g.nx
  const n = Math.max(Math.abs(bi - ai), Math.abs(bj - aj))
  for (let k = 0; k <= n; k++) {
    const i = Math.round(ai + ((bi - ai) * k) / Math.max(1, n))
    const j = Math.round(aj + ((bj - aj) * k) / Math.max(1, n))
    if (g.dist[j * g.nx + i] < 2) return false
  }
  return true
}

/** Reitti suoristettuna: vain kulmapisteet, joiden välillä on näköyhteys */
export function smooth(g: Grid, path: number[]): [number, number][] {
  const pts: number[] = [path[0]]
  let k = 0
  while (k < path.length - 1) {
    let m = path.length - 1
    while (m > k + 1 && !los(g, path[k], path[m])) m--
    pts.push(path[m])
    k = m
  }
  return pts.slice(1).map((p) => cellXZ(g, p))
}

