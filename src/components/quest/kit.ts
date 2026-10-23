import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/* Low-poly-mallien rakennuspalikat. Malli kootaan osista (geometria + väri + sijainti/kierto/koko), ja osat
   "paistetaan" yhdeksi geometriaksi, jossa väri on verteksiväreinä → yksi piirtokutsu per rakennus/puulaji.
   Kaikki pinnat ovat litteästi varjostettuja (flatShading), joten tyyli pysyy kuvituksen kaltaisena. */

/** Auringonlaskun paletti (sama henki kuin sivuston hero-maisemassa: tumma maa, hehkuva vesi) */
export const PAL = {
  sky: '#f7c9a3',
  fog: '#f4b98f',
  meadow: '#b95d4b',
  meadow2: '#b05547',
  meadowLight: '#c36550',
  forestFloor: '#8f3e46',
  sand: '#eeac80',
  path: '#e69f74',
  cliff: '#6b2c43',
  water: '#f3a066',
  waterDeep: '#e07f58',
  pine: '#7d2639',
  pine2: '#952f42',
  pine3: '#ab3b48',
  trunk: '#4d1f2c',
  birchTrunk: '#f6dfcf',
  birchLeaf: '#f28a4a',
  birchLeaf2: '#f7a659',
  rock: '#6f3a4f',
  rock2: '#84475a',
  wood: '#8a3a32',
  woodDark: '#5c2430',
  woodLight: '#b5583f',
  plank: '#c46a48',
  roof: '#4b1d33',
  roof2: '#632640',
  stone: '#7a5560',
  white: '#fbe9dc',
  red: '#d9473b',
  glow: '#ffd27a',
  teal: '#7fd3cc',
  plum: '#3a1530',
} as const

export type Vec3 = [number, number, number]

export type Part = {
  g: THREE.BufferGeometry
  c: string
  p?: Vec3
  r?: Vec3
  s?: Vec3 | number
}

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _v = new THREE.Vector3()
const _s = new THREE.Vector3()

/** Osat yhdeksi geometriaksi (verteksivärit, ei indeksejä → litteät tahkot) */
export function bake(parts: Part[]): THREE.BufferGeometry {
  const geos = parts.map(({ g, c, p = [0, 0, 0], r = [0, 0, 0], s = 1 }) => {
    const ng = (g.index ? g.toNonIndexed() : g.clone()) as THREE.BufferGeometry
    for (const k of Object.keys(ng.attributes)) if (k !== 'position' && k !== 'normal') ng.deleteAttribute(k)
    const sc = typeof s === 'number' ? _s.set(s, s, s) : _s.set(s[0], s[1], s[2])
    _m.compose(_v.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(r[0], r[1], r[2])), sc)
    ng.applyMatrix4(_m)
    const col = new THREE.Color(c)
    const n = ng.attributes.position.count
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      arr[i * 3] = col.r
      arr[i * 3 + 1] = col.g
      arr[i * 3 + 2] = col.b
    }
    ng.setAttribute('color', new THREE.BufferAttribute(arr, 3))
    if (!ng.attributes.normal) ng.computeVertexNormals()
    return ng
  })
  const out = mergeGeometries(geos, false)
  geos.forEach((g) => g.dispose())
  out.computeBoundingSphere()
  return out
}

/* ---------- perusmuodot (yksikkökoko, keskitetty origoon ellei toisin mainita) ---------- */

export const G = {
  box: (w = 1, h = 1, d = 1) => new THREE.BoxGeometry(w, h, d),
  /** sylinteri, pohja y = 0 */
  cyl: (rt = 0.5, rb = 0.5, h = 1, seg = 8) => new THREE.CylinderGeometry(rt, rb, h, seg).translate(0, h / 2, 0),
  /** kartio, pohja y = 0 */
  cone: (r = 0.5, h = 1, seg = 7) => new THREE.ConeGeometry(r, h, seg).translate(0, h / 2, 0),
  ball: (r = 0.5, detail = 1) => new THREE.IcosahedronGeometry(r, detail),
  sphere: (r = 0.5, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h),
  dodeca: (r = 0.5) => new THREE.DodecahedronGeometry(r, 0),
  torus: (r = 0.5, t = 0.18, rs = 6, ts = 12) => new THREE.TorusGeometry(r, t, rs, ts),
  /** harjakatto: kolmioprisma, harja x-akselin suuntainen, pohja y = 0 */
  gable: (w = 1, h = 0.6, d = 1) => {
    const s = new THREE.Shape()
    s.moveTo(-d / 2, 0)
    s.lineTo(d / 2, 0)
    s.lineTo(0, h)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }).translate(0, 0, -w / 2).rotateY(Math.PI / 2)
  },
  capsule: (r = 0.3, len = 0.6, cap = 3, rad = 8) => new THREE.CapsuleGeometry(r, len, cap, rad),
}

/** Yhteinen materiaali verteksivärillisille malleille */
let _mat: THREE.MeshLambertMaterial | null = null
export function vcMaterial() {
  if (!_mat) _mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })
  return _mat
}

/** Hehkuvat osat (ikkunat, lamput): valaisematon, verteksiväri */
let _glow: THREE.MeshBasicMaterial | null = null
export function glowMaterial() {
  if (!_glow) _glow = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })
  return _glow
}

const _lamb = new Map<string, THREE.MeshLambertMaterial>()
/** Yksivärinen litteä materiaali (animoidut osat) */
export function flat(color: string) {
  let m = _lamb.get(color)
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true })
    _lamb.set(color, m)
  }
  return m
}
