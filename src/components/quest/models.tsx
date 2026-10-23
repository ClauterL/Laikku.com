import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

import type { QuestTreat } from '@/content'
import { G, PAL, bake, flat, glowMaterial, vcMaterial, type Part } from './kit'

/* Kahvijahdin low-poly-mallit. Staattiset mallit paistetaan yhdeksi geometriaksi (kit.bake), animoidut hahmot
   (pesukarhu, kumiankka, drone) ovat osista koottuja ryhmiä, joita liikutetaan useFramessa ilman React-päivityksiä. */

/* ================= puut ja kivet ================= */

export function pineGeometry() {
  return bake([
    { g: G.cyl(0.13, 0.17, 0.7, 6), c: PAL.trunk },
    { g: G.cone(1.05, 1.5, 7), c: PAL.pine, p: [0, 0.5, 0] },
    { g: G.cone(0.82, 1.3, 7), c: PAL.pine2, p: [0, 1.25, 0], r: [0, 0.4, 0] },
    { g: G.cone(0.56, 1.1, 7), c: PAL.pine3, p: [0, 1.95, 0], r: [0, 0.9, 0] },
  ])
}

export function birchGeometry() {
  return bake([
    { g: G.cyl(0.09, 0.12, 1.5, 6), c: PAL.birchTrunk },
    { g: G.box(0.2, 0.05, 0.2), c: PAL.plum, p: [0, 0.5, 0] },
    { g: G.box(0.2, 0.05, 0.2), c: PAL.plum, p: [0, 0.95, 0] },
    { g: G.ball(0.72, 0), c: PAL.birchLeaf, p: [0, 1.95, 0], s: [1, 1.15, 1] },
    { g: G.ball(0.5, 0), c: PAL.birchLeaf2, p: [0.32, 1.6, 0.2] },
    { g: G.ball(0.45, 0), c: PAL.birchLeaf2, p: [-0.3, 1.7, -0.15] },
  ])
}

export function rockGeometry() {
  return bake([
    { g: G.dodeca(0.6), c: PAL.rock, s: [1.2, 0.7, 1] },
    { g: G.dodeca(0.35), c: PAL.rock2, p: [0.45, -0.05, 0.2], s: [1, 0.7, 1] },
  ])
}

/* ================= herkut ================= */

export function treatGeometry(kind: QuestTreat) {
  if (kind === 'coffee')
    return bake([
      { g: G.cyl(0.19, 0.16, 0.34, 10), c: PAL.white },
      { g: G.cyl(0.165, 0.165, 0.02, 10), c: '#4a1f12', p: [0, 0.32, 0] },
      { g: G.torus(0.09, 0.03, 5, 8), c: PAL.white, p: [0.2, 0.18, 0], r: [0, 0, 0] },
      { g: G.cyl(0.21, 0.21, 0.05, 10), c: PAL.red, p: [0, 0.12, 0] },
      { g: G.ball(0.05, 0), c: '#fff7f0', p: [0.02, 0.45, 0] },
      { g: G.ball(0.04, 0), c: '#fff7f0', p: [-0.05, 0.55, 0.02] },
      { g: G.ball(0.03, 0), c: '#fff7f0', p: [0.03, 0.64, -0.01] },
    ])
  if (kind === 'donut') {
    const parts: Part[] = [
      { g: G.torus(0.22, 0.11, 7, 14), c: '#e6a35c', r: [Math.PI / 2, 0, 0] },
      { g: G.torus(0.22, 0.095, 7, 14), c: '#ff8fbb', r: [Math.PI / 2, 0, 0], p: [0, 0.035, 0], s: [1, 1, 0.75] },
    ]
    const cols = ['#fff6d6', '#7fd3cc', '#ffd23f', '#9b6bff', '#ffffff']
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + (i % 2) * 0.2
      const rr = 0.17 + (i % 3) * 0.05
      parts.push({ g: G.box(0.06, 0.018, 0.018), c: cols[i % cols.length], p: [Math.cos(a) * rr, 0.115, Math.sin(a) * rr], r: [0, a * 1.7, 0] })
    }
    return bake(parts)
  }
  return bake([
    { g: G.capsule(0.13, 0.34, 3, 8), c: '#f0cf98', r: [0, 0, Math.PI / 2] },
    { g: G.cyl(0.14, 0.14, 0.24, 8), c: '#c8c2d2', p: [-0.13, 0, 0], r: [0, 0, Math.PI / 2] },
    { g: G.ball(0.1, 0), c: '#d9473b', p: [0.27, 0.02, 0] },
    { g: G.ball(0.06, 0), c: '#9bbf5a', p: [0.29, 0.07, 0.04] },
  ])
}

/* ================= rakennukset (etupuoli +z) ================= */

export type Built = { solid: THREE.BufferGeometry; glow?: THREE.BufferGeometry }

function logWall(w: number, h: number, d: number, y0: number, wall: string, line: string): Part[] {
  const parts: Part[] = [{ g: G.box(w, h, d), c: wall, p: [0, y0 + h / 2, 0] }]
  for (let y = y0 + 0.32; y < y0 + h - 0.1; y += 0.34) parts.push({ g: G.box(w + 0.08, 0.06, d + 0.08), c: line, p: [0, y, 0] })
  return parts
}

export function saunaModel(): Built {
  return {
    solid: bake([
      { g: G.box(4.4, 0.3, 3.4), c: PAL.woodDark, p: [0, 0.15, 0] },
      ...logWall(3.6, 1.9, 2.6, 0.3, PAL.wood, PAL.woodDark),
      { g: G.gable(4.3, 1.15, 3.5), c: PAL.roof, p: [0, 2.2, 0] },
      { g: G.box(0.55, 1.2, 0.55), c: PAL.stone, p: [-0.95, 2.6, -0.35] },
      { g: G.box(0.65, 0.1, 0.65), c: PAL.cliff, p: [-0.95, 3.22, -0.35] },
      { g: G.box(0.8, 1.45, 0.1), c: PAL.woodDark, p: [0.75, 1.03, 1.32] },
      { g: G.box(1.3, 0.14, 0.7), c: PAL.plank, p: [0.75, 0.22, 1.85] },
      { g: G.cyl(0.13, 0.13, 0.9, 6), c: PAL.woodLight, p: [-1.6, 0.42, 1.55], r: [0, 0, Math.PI / 2] },
      { g: G.cyl(0.13, 0.13, 0.9, 6), c: PAL.woodLight, p: [-1.6, 0.42, 1.85], r: [0, 0, Math.PI / 2] },
      { g: G.cyl(0.13, 0.13, 0.9, 6), c: PAL.woodLight, p: [-1.6, 0.66, 1.7], r: [0, 0, Math.PI / 2] },
    ]),
    glow: bake([{ g: G.box(0.62, 0.46, 0.06), c: PAL.glow, p: [-0.75, 1.5, 1.32] }]),
  }
}

export function workshopModel(): Built {
  const red = '#a83a36'
  return {
    solid: bake([
      { g: G.box(5.8, 0.3, 4.6), c: PAL.stone, p: [0, 0.15, 0] },
      { g: G.box(5.2, 2.7, 0.22), c: red, p: [0, 1.65, -2] },
      { g: G.box(0.22, 2.7, 4.2), c: red, p: [-2.5, 1.65, 0] },
      { g: G.box(0.22, 2.7, 4.2), c: red, p: [2.5, 1.65, 0] },
      { g: G.box(1.25, 2.7, 0.22), c: red, p: [-1.9, 1.65, 2] },
      { g: G.box(1.25, 2.7, 0.22), c: red, p: [1.9, 1.65, 2] },
      { g: G.box(2.6, 0.6, 0.22), c: red, p: [0, 2.7, 2] },
      { g: G.box(1.15, 2.05, 0.1), c: PAL.white, p: [-1.65, 1.33, 2.55], r: [0, -1.15, 0] },
      { g: G.box(1.15, 2.05, 0.1), c: PAL.white, p: [1.65, 1.33, 2.55], r: [0, 1.15, 0] },
      { g: G.gable(6.1, 1.7, 5.1), c: PAL.roof2, p: [0, 3, 0] },
      { g: G.box(2.2, 0.12, 0.75), c: PAL.woodLight, p: [0, 1.15, -1.45] },
      { g: G.box(0.1, 0.85, 0.1), c: PAL.woodDark, p: [-1, 0.72, -1.2] },
      { g: G.box(0.1, 0.85, 0.1), c: PAL.woodDark, p: [1, 0.72, -1.2] },
      { g: G.box(0.5, 0.3, 0.4), c: PAL.plum, p: [-0.5, 1.36, -1.5] },
      { g: G.box(0.7, 0.7, 0.7), c: PAL.plank, p: [2.9, 0.65, 1.9] },
      { g: G.box(0.55, 0.55, 0.55), c: PAL.woodLight, p: [2.95, 1.27, 1.85], r: [0, 0.4, 0] },
    ]),
    glow: bake([
      { g: G.box(4.7, 2.3, 0.05), c: '#ffb36b', p: [0, 1.5, -1.87] },
      { g: G.box(0.3, 0.2, 0.3), c: PAL.glow, p: [0, 2.85, 2.2] },
    ]),
  }
}

export function pavilionModel(): Built {
  const parts: Part[] = [
    { g: G.cyl(2.1, 2.2, 0.28, 6), c: PAL.plank },
    { g: G.cone(2.7, 1.3, 6), c: PAL.roof2, p: [0, 2.5, 0] },
    { g: G.cyl(0.85, 0.85, 0.08, 6), c: PAL.woodLight, p: [0, 0.95, 0] },
    { g: G.cyl(0.12, 0.16, 0.7, 6), c: PAL.woodDark, p: [0, 0.27, 0] },
    { g: G.box(0.5, 0.03, 0.35), c: PAL.plum, p: [-0.25, 1.01, 0.1] },
  ]
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6
    parts.push({ g: G.cyl(0.08, 0.08, 2.3, 5), c: PAL.woodDark, p: [Math.cos(a) * 1.8, 0.2, Math.sin(a) * 1.8] })
  }
  return { solid: bake(parts), glow: bake([{ g: G.box(0.48, 0.3, 0.02), c: '#9ff5ea', p: [-0.25, 1.17, -0.06], r: [-0.25, 0, 0] }]) }
}

export function shedModel(): Built {
  const parts: Part[] = [
    { g: G.box(2.7, 1.8, 2.3), c: PAL.wood, p: [0, 1.75, 0] },
    { g: G.box(2.95, 0.15, 2.55), c: PAL.woodDark, p: [0, 0.82, 0] },
    { g: G.gable(3.4, 1, 3), c: PAL.roof, p: [0, 2.65, 0] },
    { g: G.box(0.75, 1.25, 0.08), c: PAL.woodDark, p: [0.35, 1.55, 1.18] },
    { g: G.box(1, 0.12, 0.45), c: PAL.plank, p: [0.35, 0.55, 1.6] },
    { g: G.box(1, 0.12, 0.45), c: PAL.plank, p: [0.35, 0.25, 1.95] },
    { g: G.cyl(0.3, 0.3, 0.75, 8), c: PAL.woodLight, p: [-1.8, 0, 1.2] },
    { g: G.cyl(0.3, 0.3, 0.75, 8), c: PAL.woodLight, p: [-1.95, 0, 0.5] },
    { g: G.cyl(0.29, 0.29, 0.7, 8), c: PAL.woodLight, p: [-1.85, 0.75, 0.85] },
  ]
  for (const [x, z] of [[-1.15, -0.95], [1.15, -0.95], [-1.15, 0.95], [1.15, 0.95]])
    parts.push({ g: G.cyl(0.16, 0.2, 0.85, 6), c: PAL.stone, p: [x, 0, z] })
  for (let y = 1.2; y < 2.6; y += 0.32) parts.push({ g: G.box(2.78, 0.05, 2.38), c: PAL.woodDark, p: [0, y, 0] })
  return { solid: bake(parts) }
}

export function boathouseModel(): Built {
  const red = '#a83a36'
  return {
    solid: bake([
      { g: G.box(3.8, 0.25, 3.2), c: PAL.stone, p: [0, 0.12, 0] },
      { g: G.box(3.6, 2.3, 3), c: red, p: [0, 1.4, 0] },
      { g: G.gable(4.1, 1.3, 3.6), c: PAL.roof, p: [0, 2.55, 0] },
      { g: G.box(1.6, 1.7, 0.08), c: PAL.white, p: [-0.4, 1.1, 1.52] },
      { g: G.box(0.65, 0.65, 0.65), c: PAL.plank, p: [1.4, 0.55, 1.95] },
      { g: G.box(0.5, 0.5, 0.5), c: PAL.woodLight, p: [1.95, 0.5, 2.05], r: [0, 0.5, 0] },
      { g: G.torus(0.28, 0.08, 5, 10), c: PAL.woodLight, p: [-1.6, 0.3, 2], r: [Math.PI / 2, 0, 0] },
    ]),
    glow: bake([{ g: G.box(0.55, 0.4, 0.06), c: PAL.glow, p: [1.1, 1.6, 1.52] }]),
  }
}

export function campfireModel(): Built {
  const parts: Part[] = []
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    parts.push({ g: G.dodeca(0.22), c: i % 2 ? PAL.stone : PAL.rock2, p: [Math.cos(a) * 0.75, 0.1, Math.sin(a) * 0.75], s: [1, 0.7, 1] })
  }
  parts.push(
    { g: G.cyl(0.09, 0.09, 1, 5), c: PAL.woodDark, p: [0, 0.12, 0], r: [0, 0.3, Math.PI / 2] },
    { g: G.cyl(0.09, 0.09, 1, 5), c: PAL.woodDark, p: [0, 0.16, 0], r: [0, 1.9, Math.PI / 2] },
    { g: G.cyl(0.18, 0.18, 1.8, 7), c: PAL.wood, p: [-0.9, 0.2, 2.2], r: [0, 0.35, Math.PI / 2] },
    { g: G.cyl(0.18, 0.18, 1.8, 7), c: PAL.wood, p: [2.2, 0.2, -0.4], r: [0, 1.6, Math.PI / 2] },
    // teltta
    { g: G.cone(1.5, 1.7, 4), c: '#e8743c', p: [-2.6, 0, -1.8], r: [0, Math.PI / 4 + 0.3, 0] },
    { g: G.box(0.5, 0.9, 0.05), c: PAL.plum, p: [-2.25, 0.45, -1.05], r: [0.32, 0.3, 0] },
  )
  return { solid: bake(parts) }
}

export function towerModel(): Built {
  const parts: Part[] = []
  const H = 7
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    // jalat kallistuvat hieman sisäänpäin
    parts.push({ g: G.box(0.16, H, 0.16), c: PAL.woodDark, p: [x * 1.05, H / 2, z * 1.05], r: [z * 0.05, 0, -x * 0.05] })
  }
  for (const y of [1.4, 3.2, 5]) {
    const w = 2.3 - y * 0.06
    parts.push(
      { g: G.box(w, 0.1, 0.08), c: PAL.wood, p: [0, y, w / 2] },
      { g: G.box(w, 0.1, 0.08), c: PAL.wood, p: [0, y, -w / 2] },
      { g: G.box(0.08, 0.1, w), c: PAL.wood, p: [w / 2, y, 0] },
      { g: G.box(0.08, 0.1, w), c: PAL.wood, p: [-w / 2, y, 0] },
      { g: G.box(w * 1.3, 0.07, 0.06), c: PAL.woodLight, p: [0, y + 0.9, w / 2 - 0.02], r: [0, 0, 0.6] },
      { g: G.box(0.06, 0.07, w * 1.3), c: PAL.woodLight, p: [w / 2 - 0.02, y + 0.9, 0], r: [0.6, 0, 0] },
    )
  }
  parts.push(
    { g: G.box(2.6, 0.2, 2.6), c: PAL.plank, p: [0, H, 0] },
    { g: G.box(2.6, 0.08, 0.08), c: PAL.woodDark, p: [0, H + 0.7, 1.28] },
    { g: G.box(2.6, 0.08, 0.08), c: PAL.woodDark, p: [0, H + 0.7, -1.28] },
    { g: G.box(0.08, 0.08, 2.6), c: PAL.woodDark, p: [1.28, H + 0.7, 0] },
    { g: G.box(0.08, 0.08, 2.6), c: PAL.woodDark, p: [-1.28, H + 0.7, 0] },
    { g: G.cone(2.1, 1.3, 4), c: PAL.roof2, p: [0, H + 1.6, 0], r: [0, Math.PI / 4, 0] },
  )
  for (const [x, z] of [[-1.25, -1.25], [1.25, -1.25], [-1.25, 1.25], [1.25, 1.25]]) parts.push({ g: G.box(0.1, 1.6, 0.1), c: PAL.woodDark, p: [x, H + 0.8, z] })
  // portaat siksakkina
  for (let i = 0; i < 6; i++) parts.push({ g: G.box(0.7, 0.08, 1.6), c: PAL.plank, p: [1.55, 0.6 + i * 1.08, i % 2 ? 0.3 : -0.3], r: [i % 2 ? 0.55 : -0.55, 0, 0] })
  return { solid: bake(parts) }
}

export const TOWER_TOP = 7.7

export function lighthouseModel(): Built {
  const parts: Part[] = [
    { g: G.dodeca(1.6), c: PAL.rock, p: [0, 0.1, 0], s: [1.4, 0.55, 1.3] },
    { g: G.dodeca(0.9), c: PAL.rock2, p: [1.3, 0.1, 0.9], s: [1, 0.6, 1] },
  ]
  const bands = 6
  for (let i = 0; i < bands; i++) {
    const y = 0.6 + i * 0.8
    const r0 = 1.05 - i * 0.06
    parts.push({ g: G.cyl(r0 - 0.06, r0, 0.8, 12), c: i % 2 ? PAL.red : PAL.white, p: [0, y, 0] })
  }
  const top = 0.6 + bands * 0.8
  parts.push(
    { g: G.cyl(1.05, 1.05, 0.14, 12), c: PAL.plum, p: [0, top, 0] },
    { g: G.torus(1, 0.04, 4, 16), c: PAL.plum, p: [0, top + 0.45, 0], r: [Math.PI / 2, 0, 0] },
    { g: G.cone(0.78, 0.75, 10), c: PAL.red, p: [0, top + 0.95, 0] },
    { g: G.box(0.5, 0.9, 0.08), c: PAL.plum, p: [0, 1.05, 1.02] },
  )
  return { solid: bake(parts), glow: bake([{ g: G.cyl(0.55, 0.55, 0.8, 10), c: '#fff1b8', p: [0, top + 0.14, 0] }]) }
}

export const LIGHT_TOP = 0.6 + 6 * 0.8

export function kioskModel(): Built {
  const parts: Part[] = [
    { g: G.box(3.2, 1.05, 1.5), c: '#c94a4f', p: [0, 0.52, 0] },
    { g: G.box(3.4, 0.1, 1.7), c: PAL.white, p: [0, 1.08, 0.05] },
    { g: G.box(3.2, 2.6, 0.2), c: PAL.wood, p: [0, 1.3, -0.9] },
    { g: G.box(0.12, 1.5, 0.12), c: PAL.white, p: [-1.5, 1.85, 0.75] },
    { g: G.box(0.12, 1.5, 0.12), c: PAL.white, p: [1.5, 1.85, 0.75] },
    // jättidonitsi katolla
    { g: G.torus(0.95, 0.42, 8, 18), c: '#e6a35c', p: [0, 3.7, -0.8] },
    { g: G.torus(0.95, 0.36, 8, 18), c: '#ff8fbb', p: [0, 3.7, -0.66], s: [1, 1, 0.8] },
    { g: G.box(0.2, 0.9, 0.2), c: PAL.woodDark, p: [0, 2.75, -0.8] },
  ]
  // raidallinen markiisi
  for (let i = 0; i < 6; i++) parts.push({ g: G.box(0.56, 0.06, 1.3), c: i % 2 ? PAL.white : '#e8584c', p: [-1.4 + i * 0.56, 2.55, 0.25], r: [0.35, 0, 0] })
  return { solid: bake(parts) }
}

/** Laiturit ja silta kävelytasojen mukaan (lankut + tolpat) */
export function walkwayGeometry(w: number, d: number, y: number, rails: boolean) {
  const parts: Part[] = []
  const n = Math.max(2, Math.round(d / 0.42))
  for (let i = 0; i < n; i++) {
    const z = -d / 2 + (i + 0.5) * (d / n)
    parts.push({ g: G.box(w, 0.12, d / n - 0.05), c: i % 3 ? PAL.plank : PAL.woodLight, p: [0, y - 0.06, z] })
  }
  for (let z = -d / 2 + 0.3; z <= d / 2; z += 2)
    for (const x of [-w / 2 + 0.12, w / 2 - 0.12]) parts.push({ g: G.cyl(0.11, 0.11, y + 1.4, 6), c: PAL.woodDark, p: [x, -1.4, z] })
  if (rails)
    for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) {
      parts.push({ g: G.box(0.08, 0.08, d), c: PAL.woodDark, p: [x, y + 0.75, 0] })
      for (let z = -d / 2 + 0.2; z <= d / 2; z += 1.3) parts.push({ g: G.box(0.08, 0.8, 0.08), c: PAL.woodDark, p: [x, y + 0.35, z] })
    }
  return bake(parts)
}

/** Pieni lyhtypylväs laiturille */
export function lampGeometry(): Built {
  return {
    solid: bake([
      { g: G.cyl(0.07, 0.09, 2.2, 6), c: PAL.plum },
      { g: G.box(0.5, 0.06, 0.06), c: PAL.plum, p: [0.2, 2.15, 0] },
      { g: G.cone(0.2, 0.18, 6), c: PAL.plum, p: [0.42, 2.12, 0] },
    ]),
    glow: bake([{ g: G.box(0.2, 0.26, 0.2), c: PAL.glow, p: [0.42, 1.95, 0] }]),
  }
}

/** Opaste aloituksen vieressä: lautoja eri suuntiin */
export function signGeometry() {
  return bake([
    { g: G.cyl(0.07, 0.08, 1.9, 6), c: PAL.woodDark },
    { g: G.box(0.9, 0.24, 0.06), c: PAL.plank, p: [0.35, 1.65, 0], r: [0, 0.3, 0] },
    { g: G.box(0.9, 0.24, 0.06), c: PAL.woodLight, p: [-0.3, 1.32, 0], r: [0, -0.9, 0] },
    { g: G.box(0.8, 0.24, 0.06), c: PAL.plank, p: [0.25, 1.0, 0.05], r: [0, 1.6, 0] },
  ])
}

export function buoyGeometry() {
  return bake([
    { g: G.cyl(0.32, 0.38, 0.5, 8), c: PAL.red, p: [0, -0.2, 0] },
    { g: G.cyl(0.28, 0.32, 0.18, 8), c: PAL.white, p: [0, 0.3, 0] },
  ])
}

export function lilyGeometry() {
  return bake([
    { g: G.cyl(0.75, 0.75, 0.05, 9), c: '#b07a3e' },
    { g: G.ball(0.12, 0), c: '#ff9fc2', p: [0.45, 0.1, 0.3] },
  ])
}

/** Sataman purjevene (laiturin vieressä) */
export function sailboatGeometry() {
  const hull = new THREE.Shape()
  hull.moveTo(-1.9, 0.5)
  hull.lineTo(2.1, 0.5)
  hull.lineTo(1.4, -0.35)
  hull.lineTo(-1.6, -0.35)
  hull.closePath()
  const hullG = new THREE.ExtrudeGeometry(hull, { depth: 1.3, bevelEnabled: false }).translate(0, 0, -0.65)
  const sail = new THREE.Shape()
  sail.moveTo(0, 0)
  sail.lineTo(0, 3.4)
  sail.lineTo(1.6, 0.2)
  sail.closePath()
  const sailG = new THREE.ShapeGeometry(sail)
  sailG.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0))
  return bake([
    { g: hullG, c: PAL.white },
    { g: G.box(4, 0.1, 1.35), c: PAL.plank, p: [0.1, 0.5, 0] },
    { g: G.box(1.2, 0.4, 0.8), c: PAL.white, p: [-0.6, 0.75, 0] },
    { g: G.box(4.1, 0.12, 1.4), c: PAL.red, p: [0.1, 0.1, 0] },
    { g: G.cyl(0.06, 0.06, 4.2, 5), c: PAL.woodDark, p: [0.4, 0.5, 0] },
    { g: sailG, c: '#fff1e2', p: [0.45, 0.95, 0.02] },
    { g: sailG, c: '#fff1e2', p: [0.45, 0.95, -0.02], r: [0, Math.PI, 0], s: [-1, 1, 1] },
  ])
}

/* ================= animoidut hahmot ================= */

/** Hahmojen yhteinen liiketila (päivitetään pelisilmukassa, luetaan hahmojen useFramessa) */
export type Motion = {
  /** 0…1 kävelyn voimakkuus */
  walk: number
  /** kävelyvaiheen kulma */
  phase: number
  /** tabletti ylhäällä (paneeli auki / drone-tila) */
  tablet: number
  /** puhuu (kumiankka) */
  talk: number
}

export const newMotion = (): Motion => ({ walk: 0, phase: 0, tablet: 0, talk: 0 })

const FUR = '#9b8790'
const FUR_DARK = '#6c5864'
const CREAM = '#f6dfcf'
const MASK = '#3a1d33'

/** Pesukarhu: oma hahmo (lämmin harmaa turkki, luumu naamio, oranssit lentäjänlasit otsalla), tabletti tassuissa */
export function Raccoon({ motion }: { motion: Motion }) {
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const arms = useRef<THREE.Group>(null)
  const screen = useRef<THREE.MeshBasicMaterial>(null)

  const tailParts = useMemo(() => {
    const out: { p: [number, number, number]; r: number; c: string; s: number }[] = []
    for (let i = 0; i < 6; i++) out.push({ p: [0, 0.06 + i * 0.13, -0.08 - i * 0.1], r: -0.75 - i * 0.07, c: i % 2 ? MASK : FUR, s: 1 - i * 0.08 })
    return out
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const sw = Math.sin(motion.phase) * 0.7 * motion.walk
    if (legL.current) legL.current.rotation.x = sw
    if (legR.current) legR.current.rotation.x = -sw
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(motion.phase)) * 0.06 * motion.walk + Math.sin(t * 2) * 0.008
      body.current.rotation.z = Math.sin(motion.phase) * 0.06 * motion.walk
      body.current.rotation.x = 0.08 * motion.walk
    }
    if (tail.current) tail.current.rotation.y = Math.sin(t * (2 + motion.walk * 4)) * (0.25 + motion.walk * 0.2)
    if (arms.current) arms.current.rotation.x = -0.35 - motion.tablet * 0.75
    if (screen.current) screen.current.color.setHSL(0.48, 0.65, 0.62 + Math.sin(t * 3) * 0.04 * motion.tablet)
  })

  return (
    <group>
      <group ref={legL} position={[-0.15, 0.3, 0]}>
        <mesh material={flat(FUR_DARK)} position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.14, 2, 6]} />
        </mesh>
      </group>
      <group ref={legR} position={[0.15, 0.3, 0]}>
        <mesh material={flat(FUR_DARK)} position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.14, 2, 6]} />
        </mesh>
      </group>
      <group ref={body}>
        <mesh material={flat(FUR)} position={[0, 0.58, 0]} scale={[1, 1.12, 0.9]} castShadow>
          <icosahedronGeometry args={[0.37, 1]} />
        </mesh>
        <mesh material={flat(CREAM)} position={[0, 0.54, 0.17]} scale={[0.85, 1, 0.5]}>
          <icosahedronGeometry args={[0.3, 1]} />
        </mesh>
        {/* pää */}
        <group position={[0, 1.02, 0.02]}>
          <mesh material={flat(FUR)} scale={[1.18, 0.95, 1]} castShadow>
            <icosahedronGeometry args={[0.31, 1]} />
          </mesh>
          <mesh material={flat(CREAM)} position={[0, -0.06, 0.2]} scale={[1.35, 0.85, 0.7]}>
            <icosahedronGeometry args={[0.2, 1]} />
          </mesh>
          <mesh material={flat(MASK)} position={[0, 0.03, 0.22]} scale={[2.3, 0.55, 0.6]}>
            <icosahedronGeometry args={[0.15, 1]} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh material={flat('#ffffff')} position={[s * 0.11, 0.04, 0.3]}>
                <icosahedronGeometry args={[0.05, 1]} />
              </mesh>
              <mesh material={flat('#1a0b14')} position={[s * 0.11, 0.04, 0.345]}>
                <icosahedronGeometry args={[0.028, 0]} />
              </mesh>
              <mesh material={flat(FUR)} position={[s * 0.2, 0.27, -0.03]} rotation={[0, 0, -s * 0.35]} castShadow>
                <coneGeometry args={[0.1, 0.2, 5]} />
              </mesh>
              <mesh material={flat(MASK)} position={[s * 0.2, 0.26, 0.0]} rotation={[0, 0, -s * 0.35]} scale={0.55}>
                <coneGeometry args={[0.1, 0.2, 5]} />
              </mesh>
              {/* lentäjänlasit otsalla */}
              <mesh material={flat('#f08a3a')} position={[s * 0.1, 0.19, 0.22]} rotation={[-0.9, 0, 0]}>
                <torusGeometry args={[0.065, 0.024, 5, 10]} />
              </mesh>
              <mesh material={flat('#9ff5ea')} position={[s * 0.1, 0.19, 0.225]} rotation={[-0.9, 0, 0]}>
                <circleGeometry args={[0.05, 8]} />
              </mesh>
            </group>
          ))}
          <mesh material={flat('#c4632e')} position={[0, 0.16, 0]} rotation={[Math.PI / 2 + 0.25, 0, 0]}>
            <torusGeometry args={[0.31, 0.022, 4, 16]} />
          </mesh>
          <mesh material={flat(CREAM)} position={[0, -0.07, 0.3]} scale={[1, 0.7, 1]}>
            <icosahedronGeometry args={[0.09, 1]} />
          </mesh>
          <mesh material={flat('#241018')} position={[0, -0.04, 0.39]}>
            <icosahedronGeometry args={[0.045, 0]} />
          </mesh>
        </group>
        {/* kädet ja tabletti */}
        <group ref={arms} position={[0, 0.78, 0.12]}>
          {[-1, 1].map((s) => (
            <mesh key={s} material={flat(FUR_DARK)} position={[s * 0.24, -0.05, 0.16]} rotation={[Math.PI / 2, 0, s * 0.35]} castShadow>
              <capsuleGeometry args={[0.07, 0.22, 2, 6]} />
            </mesh>
          ))}
          <group position={[0, -0.05, 0.36]} rotation={[-0.9, 0, 0]}>
            <mesh material={flat('#2b1626')}>
              <boxGeometry args={[0.46, 0.32, 0.035]} />
            </mesh>
            <mesh position={[0, 0, 0.019]}>
              <planeGeometry args={[0.4, 0.26]} />
              <meshBasicMaterial ref={screen} color="#7fd3cc" toneMapped={false} />
            </mesh>
          </group>
        </group>
        {/* häntä renkaineen */}
        <group ref={tail} position={[0, 0.42, -0.28]}>
          {tailParts.map((p, i) => (
            <mesh key={i} material={flat(p.c)} position={p.p} rotation={[p.r, 0, 0]} scale={p.s} castShadow>
              <cylinderGeometry args={[0.11, 0.12, 0.15, 7]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

/** Kumiankka pyöreillä silmälaseilla (koodarin paras kuuntelija) */
export function Duck({ motion }: { motion: Motion }) {
  const root = useRef<THREE.Group>(null)
  const beak = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (root.current) {
      root.current.position.y = Math.abs(Math.sin(motion.phase * 1.4)) * 0.16 * motion.walk + Math.sin(t * 1.6) * 0.01
      root.current.rotation.z = Math.sin(motion.phase * 1.4) * 0.18 * motion.walk + Math.sin(t * 9) * 0.05 * motion.talk
    }
    if (beak.current) beak.current.scale.y = 0.5 + Math.abs(Math.sin(t * 14)) * 0.5 * motion.talk
  })
  const Y = '#ffd23f'
  return (
    <group ref={root}>
      <mesh material={flat(Y)} position={[0, 0.24, 0]} scale={[1, 0.82, 1.25]} castShadow>
        <icosahedronGeometry args={[0.27, 1]} />
      </mesh>
      <mesh material={flat('#f5b82e')} position={[0, 0.36, -0.3]} rotation={[-0.9, 0, 0]}>
        <coneGeometry args={[0.1, 0.22, 5]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={flat('#f5b82e')} position={[s * 0.24, 0.27, -0.02]} scale={[0.35, 0.6, 1]}>
          <icosahedronGeometry args={[0.2, 1]} />
        </mesh>
      ))}
      <group position={[0, 0.55, 0.13]}>
        <mesh material={flat(Y)} castShadow>
          <icosahedronGeometry args={[0.18, 1]} />
        </mesh>
        <mesh ref={beak} material={flat('#ff8a2a')} position={[0, -0.04, 0.17]} scale={[1.4, 0.5, 1.2]}>
          <icosahedronGeometry args={[0.075, 1]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={flat('#1a0b14')} position={[s * 0.075, 0.035, 0.155]}>
              <icosahedronGeometry args={[0.024, 0]} />
            </mesh>
            <mesh material={flat(MASK)} position={[s * 0.075, 0.035, 0.17]}>
              <torusGeometry args={[0.048, 0.011, 4, 10]} />
            </mesh>
          </group>
        ))}
        <mesh material={flat(MASK)} position={[0, 0.04, 0.175]}>
          <boxGeometry args={[0.06, 0.012, 0.012]} />
        </mesh>
      </group>
    </group>
  )
}

/** Pesukarhun drone: tumma runko, neljä roottoria, kamera ja vilkkuvat valot */
export function Drone({ motion }: { motion: Motion }) {
  const rotors = useRef<(THREE.Mesh | null)[]>([])
  const led = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    rotors.current.forEach((r, i) => {
      if (r) r.rotation.y = t * 38 * (i % 2 ? 1 : -1)
    })
    if (led.current) led.current.color.set(Math.sin(t * 6) > 0 ? '#ff5a4f' : '#4a1418')
  })
  const arms: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]]
  return (
    <group scale={motion.tablet > 0.5 ? 1.15 : 1}>
      <mesh material={flat(PAL.plum)} castShadow>
        <boxGeometry args={[0.34, 0.12, 0.48]} />
      </mesh>
      <mesh material={flat('#5c2647')} position={[0, 0.08, -0.02]}>
        <boxGeometry args={[0.24, 0.06, 0.32]} />
      </mesh>
      <mesh material={flat(PAL.plum)} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[1.0, 0.04, 0.06]} />
      </mesh>
      <mesh material={flat(PAL.plum)} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[1.0, 0.04, 0.06]} />
      </mesh>
      {arms.map(([x, z], i) => (
        <group key={i} position={[x * 0.35, 0.04, z * 0.35]}>
          <mesh material={flat('#2b1626')}>
            <cylinderGeometry args={[0.055, 0.055, 0.08, 6]} />
          </mesh>
          <mesh
            ref={(m) => {
              rotors.current[i] = m
            }}
            position={[0, 0.06, 0]}
          >
            <boxGeometry args={[0.42, 0.01, 0.05]} />
            <meshBasicMaterial color="#ffe4cf" transparent opacity={0.55} />
          </mesh>
        </group>
      ))}
      <mesh material={flat('#2b1626')} position={[0, -0.1, 0.18]}>
        <icosahedronGeometry args={[0.075, 0]} />
      </mesh>
      <mesh position={[0, -0.1, 0.25]}>
        <circleGeometry args={[0.035, 8]} />
        <meshBasicMaterial color="#9ff5ea" toneMapped={false} />
      </mesh>
      <mesh position={[0.12, 0, -0.25]}>
        <boxGeometry args={[0.04, 0.03, 0.02]} />
        <meshBasicMaterial ref={led} color="#ff5a4f" toneMapped={false} />
      </mesh>
      <mesh position={[-0.12, 0, -0.25]}>
        <boxGeometry args={[0.04, 0.03, 0.02]} />
        <meshBasicMaterial color="#64e08a" toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Hehkuvat osat (ikkunat ym.) */
export function Glow({ geometry }: { geometry?: THREE.BufferGeometry }) {
  if (!geometry) return null
  return <mesh geometry={geometry} material={glowMaterial()} />
}

/** Kiinteä verteksivärimalli */
export function Solid({ geometry, shadow = true }: { geometry: THREE.BufferGeometry; shadow?: boolean }) {
  return <mesh geometry={geometry} material={vcMaterial()} castShadow={shadow} receiveShadow />
}
