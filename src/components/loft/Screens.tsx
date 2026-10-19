import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

import type { Content } from '@/content'
import github from '@/data/github.json'
import { MODEL_BASE } from './zones'

/**
 * Työhuoneen näytöt: screens.glb sisältää näyttöjen pinnat (scripts/loft/floor5/s5_screens.py, UV 0…1 koko ruudulle).
 * Jokaiseen piirretään oma canvas: TV-seinä (ohjauspaneeli + GitHub-aktiivisuus), työkoneen ultrawide (laikku.dev)
 * ja pystynäyttö (koodi kirjoittuu). Tekstit tulevat sisällöstä (loft.screens), GitHub-luvut src/data/github.json:sta.
 */

type ScreenText = Content['loft']['screens']
type Draw = (g: CanvasRenderingContext2D, w: number, h: number, t: number) => void

const FILE = `${MODEL_BASE}screens.glb`
const COL = {
  bg: '#0c0e12',
  panel: '#151a21',
  line: '#2a3039',
  brass: '#c9a86a',
  brassLight: '#e8cf96',
  teal: '#3fa7a0',
  ember: '#c2502e',
  ink: '#efe6d3',
  muted: '#8b8577',
} as const
const HEAT = ['#1a1f26', '#3b3322', '#6b5530', '#a8844a', '#e8cf96']

function fonts() {
  const css = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null
  return {
    display: css?.getPropertyValue('--font-display').trim() || 'Georgia, serif',
    body: css?.getPropertyValue('--font-body').trim() || 'system-ui, sans-serif',
    mono: 'ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace',
  }
}

/** Toistuva pseudosatunnaisuus (LEDit, käyrät) ilman tilaa */
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function makeOps(txt: ScreenText['ops']): Draw {
  const F = fonts()
  return (g, w, h, t) => {
    g.fillStyle = COL.bg
    g.fillRect(0, 0, w, h)
    // otsikko ja kello
    g.fillStyle = COL.brass
    g.font = `600 34px ${F.display}`
    g.textBaseline = 'alphabetic'
    g.fillText(txt.title, 36, 58)
    const now = new Date()
    g.fillStyle = COL.ink
    g.font = `600 30px ${F.body}`
    g.textAlign = 'right'
    g.fillText(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, w - 36, 58)
    g.textAlign = 'left'
    g.fillStyle = COL.line
    g.fillRect(36, 76, w - 72, 2)

    // verkkoliikenne: kaksi vierivää käyrää
    const gx = 36
    const gy = 104
    const gw = 600
    const gh = 330
    g.fillStyle = COL.panel
    g.fillRect(gx, gy, gw, gh)
    g.strokeStyle = COL.line
    g.lineWidth = 1
    for (let i = 1; i < 6; i++) {
      g.beginPath()
      g.moveTo(gx, gy + (gh * i) / 6)
      g.lineTo(gx + gw, gy + (gh * i) / 6)
      g.stroke()
    }
    g.fillStyle = COL.muted
    g.font = `500 22px ${F.body}`
    g.fillText(txt.net, gx + 16, gy + 34)
    const series = (amp: number, base: number, k: number, color: string) => {
      g.strokeStyle = color
      g.lineWidth = 3
      g.beginPath()
      for (let x = 0; x <= gw; x += 6) {
        const u = x * 0.018 + t * 0.9 * k
        const v = base + amp * (0.55 * Math.sin(u) + 0.3 * Math.sin(u * 2.3 + 1.7) + 0.15 * Math.sin(u * 5.1 + k))
        const y = gy + gh - v * gh
        if (x === 0) g.moveTo(gx + x, y)
        else g.lineTo(gx + x, y)
      }
      g.stroke()
    }
    series(0.22, 0.5, 1, COL.teal)
    series(0.12, 0.24, 1.6, COL.ember)

    // palvelut
    const px = 672
    g.fillStyle = COL.muted
    g.font = `500 22px ${F.body}`
    g.fillText(txt.services, px, gy + 34)
    txt.items.forEach((name, i) => {
      const y = gy + 92 + i * 74
      g.fillStyle = COL.brass
      g.beginPath()
      g.moveTo(px + 8, y - 18)
      g.lineTo(px + 16, y - 10)
      g.lineTo(px + 8, y - 2)
      g.lineTo(px, y - 10)
      g.closePath()
      g.fill()
      g.fillStyle = COL.ink
      g.font = `600 28px ${F.body}`
      g.fillText(name, px + 30, y)
      // aktiivisuuspalkki
      const a = 0.35 + 0.65 * hash(i, Math.floor(t * 2))
      g.fillStyle = COL.line
      g.fillRect(px + 30, y + 14, 270, 6)
      g.fillStyle = i % 2 ? COL.teal : COL.brassLight
      g.fillRect(px + 30, y + 14, 270 * a, 6)
    })

    // räkin LED-rivi
    for (let i = 0; i < 40; i++) {
      const on = hash(i, Math.floor(t * 5 + i * 0.3)) > 0.35
      g.fillStyle = on ? (i % 7 === 3 ? COL.ember : COL.teal) : '#1d232b'
      g.fillRect(36 + i * 23.8, h - 70, 14, 14)
    }
  }
}

function makeGit(txt: ScreenText['git']): Draw {
  const F = fonts()
  const weeks = github.contributions.weeks.slice(-53)
  const repos = [...github.repos].sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1)).slice(0, 4)
  return (g, w, h, t) => {
    g.fillStyle = COL.bg
    g.fillRect(0, 0, w, h)
    g.fillStyle = COL.brass
    g.font = `600 34px ${F.display}`
    g.fillText(txt.title, 36, 58)
    g.fillStyle = COL.line
    g.fillRect(36, 76, w - 72, 2)
    // kontribuutiokartta (53 viikkoa × 7 päivää)
    const cs = 15.4
    const gap = 2.8
    const x0 = 36
    const y0 = 104
    const sweep = (t * 9) % (weeks.length + 20)
    weeks.forEach((wk, i) =>
      wk.forEach((d, j) => {
        const lift = Math.max(0, 1 - Math.abs(i - sweep) / 3) * 0.6
        g.fillStyle = HEAT[Math.min(4, d.level + (lift > 0.3 && d.level > 0 ? 1 : 0))]
        g.globalAlpha = 0.8 + lift * 0.33
        g.fillRect(x0 + i * (cs + gap), y0 + j * (cs + gap), cs, cs)
      }),
    )
    g.globalAlpha = 1
    // yhteismäärä
    g.fillStyle = COL.brassLight
    g.font = `700 64px ${F.display}`
    const totalText = String(github.contributions.total)
    g.fillText(totalText, 36, 300)
    const tw = g.measureText(totalText).width
    g.fillStyle = COL.muted
    g.font = `500 24px ${F.body}`
    g.fillText(txt.contributions, 36 + tw + 18, 292)
    // repot
    g.fillStyle = COL.muted
    g.font = `500 22px ${F.body}`
    g.fillText(txt.repos, 36, 352)
    repos.forEach((r, i) => {
      const y = 396 + i * 44
      g.fillStyle = COL.ink
      g.font = `600 26px ${F.body}`
      g.fillText(r.name, 36, y)
      g.fillStyle = COL.muted
      g.font = `500 22px ${F.mono}`
      g.textAlign = 'right'
      g.fillText(r.pushedAt.slice(0, 10), w - 36, y)
      g.textAlign = 'left'
    })
  }
}

function makeDev(txt: ScreenText['dev']): Draw {
  const F = fonts()
  return (g, w, h, t) => {
    g.fillStyle = COL.bg
    g.fillRect(0, 0, w, h)
    // reunus jää ruudun kehyksen alle
    const m = 26
    g.fillStyle = COL.brassLight
    g.font = `700 46px ${F.display}`
    g.fillText(txt.title, m + 14, m + 56)
    const titleW = g.measureText(txt.title).width
    g.fillStyle = COL.muted
    g.font = `500 22px ${F.body}`
    g.fillText(txt.lead, m + 14 + titleW + 22, m + 52)
    g.fillStyle = COL.line
    g.fillRect(m + 14, m + 76, w - 2 * m - 28, 2)
    // projektilaatat: 3 + 2
    const n = txt.tiles.length
    const cols = 3
    const tw = (w - 2 * m - 28 - (cols - 1) * 16) / cols
    const th = 120
    const hi = Math.floor(t / 2.5) % n
    txt.tiles.forEach((name, i) => {
      const c = i % cols
      const r = Math.floor(i / cols)
      const x = m + 14 + c * (tw + 16)
      const y = m + 100 + r * (th + 16)
      g.fillStyle = i === hi ? '#1d232c' : COL.panel
      g.fillRect(x, y, tw, th)
      g.fillStyle = [COL.brass, COL.teal, COL.ember, COL.brassLight, COL.teal][i % 5]
      g.fillRect(x, y, tw, 5)
      g.fillStyle = COL.ink
      g.font = `600 30px ${F.body}`
      g.fillText(name, x + 18, y + 54)
      // pieni käyrä laatan pohjalle
      g.strokeStyle = i === hi ? COL.brassLight : COL.line
      g.lineWidth = 2
      g.beginPath()
      for (let k = 0; k <= 12; k++) {
        const yy = y + th - 22 - 20 * hash(i, k)
        if (k === 0) g.moveTo(x + 18, yy)
        else g.lineTo(x + 18 + (k * (tw - 36)) / 12, yy)
      }
      g.stroke()
    })
  }
}

const KEYWORDS = /\b(const|for|of|await|if|function|return)\b/g

function makeCode(lines: string[]): Draw {
  const F = fonts()
  const total = lines.reduce((s, l) => s + l.length + 4, 0)
  return (g, w, h, t) => {
    g.fillStyle = COL.bg
    g.fillRect(0, 0, w, h)
    const lh = 50
    const x0 = 64
    const y0 = 80
    // kirjoitus etenee ~18 merkkiä/s, sitten tauko ja alusta
    const cycle = total / 18 + 4
    let budget = Math.floor(((t % cycle) / cycle) * (total + 72))
    g.font = `500 21px ${F.mono}`
    lines.forEach((line, i) => {
      const y = y0 + i * lh
      g.fillStyle = '#3a414b'
      g.textAlign = 'right'
      g.fillText(String(i + 1), x0 - 18, y)
      g.textAlign = 'left'
      if (budget <= 0) return
      const shown = line.slice(0, Math.max(0, budget))
      budget -= line.length + 4
      if (shown.trimStart().startsWith('//')) {
        g.fillStyle = COL.teal
        g.fillText(shown, x0, y)
      } else {
        // avainsanat messingillä, muu teksti vaaleana
        let x = x0
        let last = 0
        for (const m of shown.matchAll(KEYWORDS)) {
          const before = shown.slice(last, m.index)
          g.fillStyle = COL.ink
          g.fillText(before, x, y)
          x += g.measureText(before).width
          g.fillStyle = COL.brass
          g.fillText(m[0], x, y)
          x += g.measureText(m[0]).width
          last = (m.index ?? 0) + m[0].length
        }
        g.fillStyle = COL.ink
        g.fillText(shown.slice(last), x, y)
      }
      // kursori rivin lopussa, kun kirjoitus on tällä rivillä
      if (shown.length < line.length || (budget < 0 && budget > -4)) {
        if (Math.floor(t * 2.5) % 2 === 0) {
          g.fillStyle = COL.brassLight
          g.fillRect(x0 + g.measureText(shown).width + 2, y - 20, 11, 24)
        }
      }
    })
  }
}

interface Surface {
  name: string
  w: number
  h: number
  hz: number
  draw: Draw
}

export function Screens({ text }: { text: ScreenText }) {
  const { scene } = useGLTF(FILE, false, true)
  const model = useMemo(() => scene.clone(true), [scene])

  const surfaces = useMemo<Surface[]>(
    () => [
      { name: 'scr_ops', w: 1024, h: 576, hz: 6, draw: makeOps(text.ops) },
      { name: 'scr_git', w: 1024, h: 576, hz: 4, draw: makeGit(text.git) },
      { name: 'scr_dev', w: 1024, h: 440, hz: 2, draw: makeDev(text.dev) },
      { name: 'scr_code', w: 384, h: 896, hz: 8, draw: makeCode(text.code) },
    ],
    [text],
  )

  const live = useMemo(
    () =>
      surfaces.map((s) => {
        const canvas = document.createElement('canvas')
        canvas.width = s.w
        canvas.height = s.h
        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 4
        // glTF-vienti kääntää v:n (origo vasemmassa yläkulmassa), joten canvas ilman flipY:tä on oikein päin
        tex.flipY = false
        const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(0.86, 0.86, 0.86) })
        return { ...s, canvas, g: canvas.getContext('2d')!, tex, mat, next: 0 }
      }),
    [surfaces],
  )

  useEffect(() => {
    for (const s of live) {
      const mesh = model.getObjectByName(s.name) as THREE.Mesh | undefined
      if (mesh?.isMesh) mesh.material = s.mat
      else model.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh && (m.name.startsWith(s.name) || m.parent?.name === s.name)) m.material = s.mat
      })
    }
    return () => {
      for (const s of live) {
        s.tex.dispose()
        s.mat.dispose()
      }
    }
  }, [live, model])

  const clock = useRef(0)
  useFrame((_, dt) => {
    clock.current += dt
    const t = clock.current
    for (const s of live) {
      if (t < s.next) continue
      s.next = t + 1 / s.hz
      s.draw(s.g, s.w, s.h, t)
      s.tex.needsUpdate = true
    }
  })

  return <primitive object={model} />
}

useGLTF.preload(FILE, false, true)
