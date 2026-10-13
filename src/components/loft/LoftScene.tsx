import { useCallback, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { KeyboardControls, useKeyboardControls } from '@react-three/drei'
import { Ecctrl, type EcctrlHandle } from 'ecctrl'
import { EcctrlCameraControls, type EcctrlCameraControlsHandle } from 'ecctrl/camera'
import { useJoystickStore } from 'ecctrl/input'

import type { LoftZoneId } from '@/content'
import { INTERACT_RADIUS, ROOM, SPAWN, ZONES } from './zones'

/* Värit: sivun teema (viini, messinki, hiili) + Havaidan sininen–violetti neon */
const C = {
  floor: '#2f2c2a',
  wall: '#1b1d22',
  wallWarm: '#2a2420',
  brick: '#6a3328',
  wood: '#5a3a24',
  woodDark: '#2e2019',
  steel: '#3a3f47',
  brass: '#c9a86a',
  wine: '#7a2433',
  ink: '#efe6d3',
  blue: '#4c6fff',
  violet: '#8b5cf6',
  teal: '#3fa7a0',
  gold: '#f1c45a',
} as const

const KEYMAP = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

/* ---------- pienet apurit ---------- */

type V3 = [number, number, number]

function Box({ p, s, c, e, ei = 1.5, r = 0.8, m = 0 }: { p: V3; s: V3; c: string; e?: string; ei?: number; r?: number; m?: number }) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={r}
        metalness={m}
        emissive={e ?? '#000000'}
        emissiveIntensity={e ? ei : 0}
        toneMapped={!e}
      />
    </mesh>
  )
}

function Cyl({ p, rt, rb, h, c, m = 0, r = 0.6, e }: { p: V3; rt: number; rb: number; h: number; c: string; m?: number; r?: number; e?: string }) {
  return (
    <mesh position={p}>
      <cylinderGeometry args={[rt, rb, h, 20]} />
      <meshStandardMaterial color={c} metalness={m} roughness={r} emissive={e ?? '#000000'} emissiveIntensity={e ? 1.2 : 0} />
    </mesh>
  )
}

/** Klikattava vyöhyke: hiiri osoittimeksi ja avaus napautuksella */
function Zone({ id, onSelect, children }: { id: LoftZoneId; onSelect: (id: LoftZoneId) => void; children: ReactNode }) {
  return (
    <group
      name={`zone-${id}`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {children}
    </group>
  )
}

/* Kaupunkinäkymä ikkunan taakse: deterministinen proseduurikuva (ei kuvatiedostoa) */
function makeSkyline(): THREE.CanvasTexture {
  const w = 2048
  const h = 512
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const g = cv.getContext('2d')!
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#070b1c')
  sky.addColorStop(0.55, '#1a1638')
  sky.addColorStop(0.85, '#4a2537')
  sky.addColorStop(1, '#6b3a2c')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  const rng = { s: 1337 }
  const rnd = () => {
    rng.s = (rng.s * 1664525 + 1013904223) % 4294967296
    return rng.s / 4294967296
  }
  for (let layer = 0; layer < 3; layer++) {
    const shade = ['#141526', '#0e0f1c', '#08090f'][layer]
    let x = 0
    while (x < w) {
      const bw = 40 + rnd() * 110
      const bh = 80 + rnd() * (220 + layer * 60)
      g.fillStyle = shade
      g.fillRect(x, h - bh, bw, bh)
      for (let wy = h - bh + 10; wy < h - 8; wy += 14) {
        for (let wx = x + 6; wx < x + bw - 6; wx += 11) {
          if (rnd() < 0.28 - layer * 0.06) {
            g.fillStyle = rnd() < 0.8 ? 'rgba(255,196,120,0.85)' : 'rgba(140,170,255,0.8)'
            g.fillRect(wx, wy, 5, 7)
          }
        }
      }
      x += bw + rnd() * 18
    }
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/* ---------- huone ---------- */

function Room() {
  const { halfX: X, halfZ: Z, height: H } = ROOM
  const skyline = useMemo(() => makeSkyline(), [])
  // Ikkuna-aukko pohjoisseinällä x 2.5…11.5, y 0.6…3.8
  const win = { x0: 2.5, x1: 11.5, y0: 0.6, y1: 3.8 }
  const wallMat = <meshStandardMaterial color={C.wall} roughness={0.95} />
  return (
    <>
      {/* Lattia: betoni + puukaistale */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[X * 2, Z * 2]} />
        <meshStandardMaterial color={C.floor} roughness={0.9} />
      </mesh>

      {/* Seinät ovat sisäänpäin katsovia tasoja: ulkopuolelta kamera näkee niiden läpi */}
      <mesh position={[-X, H / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[Z * 2, H]} />
        {wallMat}
      </mesh>
      <mesh position={[X, H / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[Z * 2, H]} />
        {wallMat}
      </mesh>
      {/* Pohjoisseinä ikkuna-aukon ympäriltä */}
      <mesh position={[(-X + win.x0) / 2, H / 2, -Z]}>
        <planeGeometry args={[win.x0 + X, H]} />
        <meshStandardMaterial color={C.wallWarm} roughness={0.95} />
      </mesh>
      <mesh position={[(win.x1 + X) / 2, H / 2, -Z]}>
        <planeGeometry args={[X - win.x1, H]} />
        {wallMat}
      </mesh>
      <mesh position={[(win.x0 + win.x1) / 2, win.y0 / 2, -Z]}>
        <planeGeometry args={[win.x1 - win.x0, win.y0]} />
        {wallMat}
      </mesh>
      <mesh position={[(win.x0 + win.x1) / 2, (win.y1 + H) / 2, -Z]}>
        <planeGeometry args={[win.x1 - win.x0, H - win.y1]} />
        {wallMat}
      </mesh>
      {/* Kaupunki ikkunan takana + karmit */}
      <mesh position={[(win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2 + 0.4, -Z - 1.2]}>
        <planeGeometry args={[(win.x1 - win.x0) * 1.5, (win.y1 - win.y0) * 1.6]} />
        <meshBasicMaterial map={skyline} toneMapped={false} />
      </mesh>
      {[win.x0, 5.5, 8.5, win.x1].map((x) => (
        <Box key={x} p={[x, (win.y0 + win.y1) / 2, -Z + 0.05]} s={[0.12, win.y1 - win.y0, 0.12]} c={C.steel} m={0.6} r={0.4} />
      ))}
      <Box p={[(win.x0 + win.x1) / 2, 2.2, -Z + 0.05]} s={[win.x1 - win.x0, 0.08, 0.1]} c={C.steel} m={0.6} r={0.4} />

      {/* Eteläreuna: matala lasikaide, jonka yli kamera näkee */}
      <Box p={[0, 0.5, Z - 0.05]} s={[X * 2, 1, 0.1]} c="#2a3340" r={0.2} m={0.3} />

      {/* Törmäykset: lattia ja neljä seinää */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[X, 0.5, Z]} position={[0, -0.5, 0]} />
        <CuboidCollider args={[0.3, H, Z]} position={[-X - 0.3, H, 0]} />
        <CuboidCollider args={[0.3, H, Z]} position={[X + 0.3, H, 0]} />
        <CuboidCollider args={[X, H, 0.3]} position={[0, H, -Z - 0.3]} />
        <CuboidCollider args={[X, H, 0.3]} position={[0, H, Z + 0.3]} />
      </RigidBody>
    </>
  )
}

/* ---------- vyöhykkeiden paikkamerkit ---------- */

function Props({ onSelect }: { onSelect: (id: LoftZoneId) => void }) {
  const X = ROOM.halfX
  return (
    <RigidBody type="fixed" colliders="cuboid">
      {/* 1 Hissiaula: hissin ovet länsiseinällä + Havaida-H neonina */}
      <Zone id="elevator" onSelect={onSelect}>
        <Box p={[-X + 0.1, 1.25, 5.2]} s={[0.2, 2.5, 2.2]} c={C.steel} m={0.8} r={0.3} />
        <Box p={[-X + 0.22, 1.2, 5.2]} s={[0.04, 2.3, 0.02]} c="#0b0c10" />
        <Box p={[-X + 0.16, 3.2, 4.85]} s={[0.06, 0.9, 0.12]} c={C.blue} e={C.blue} ei={3} />
        <Box p={[-X + 0.16, 3.2, 5.55]} s={[0.06, 0.9, 0.12]} c={C.violet} e={C.violet} ei={3} />
        <Box p={[-X + 0.16, 3.2, 5.2]} s={[0.06, 0.12, 0.7]} c={C.blue} e="#6b66ff" ei={3} />
        <Box p={[-X + 0.2, 1.3, 6.6]} s={[0.08, 0.16, 0.12]} c="#111" e={C.teal} ei={1.2} />
      </Zone>

      {/* 2 Paja: työpenkki, 3D-tulostin, tiilinen taustaseinä */}
      <Zone id="workshop" onSelect={onSelect}>
        <Box p={[0, 0.45, 6.6]} s={[2.6, 0.9, 0.9]} c={C.woodDark} />
        <Box p={[-0.7, 1.15, 6.6]} s={[0.55, 0.5, 0.5]} c={C.steel} m={0.5} r={0.5} />
        <Box p={[-0.7, 1.12, 6.6]} s={[0.4, 0.04, 0.4]} c="#c2502e" e="#e0693f" ei={0.8} />
        <Box p={[0.6, 0.98, 6.55]} s={[0.6, 0.06, 0.4]} c={C.teal} />
        <Box p={[0, 1.6, 7.5]} s={[3.2, 2.2, 0.15]} c={C.brick} r={1} />
      </Zone>

      {/* 3 Kirjasto: kirjahylly itäseinällä + lukutuoli */}
      <Zone id="library" onSelect={onSelect}>
        <Box p={[X - 0.3, 1.2, 5.2]} s={[0.5, 2.4, 2.6]} c={C.woodDark} />
        {[0.45, 0.95, 1.45, 1.95].map((y, i) => (
          <Box key={y} p={[X - 0.45, y + 0.15, 5.2]} s={[0.22, 0.3, 2.3]} c={[C.wine, '#3a5a7a', C.brass, '#4a6b3a'][i]} />
        ))}
        <Box p={[9.6, 0.45, 5.6]} s={[0.9, 0.9, 0.9]} c={C.wine} r={0.9} />
      </Zone>

      {/* 4 Työpiste: pöytä, kolme näyttöä, valopaneeli */}
      <Zone id="desk" onSelect={onSelect}>
        <Box p={[10.2, 0.75, 0]} s={[1.0, 0.06, 2.4]} c={C.woodDark} />
        <Box p={[10.2, 0.37, -1.05]} s={[0.9, 0.74, 0.08]} c={C.steel} />
        <Box p={[10.2, 0.37, 1.05]} s={[0.9, 0.74, 0.08]} c={C.steel} />
        <Box p={[10.55, 1.2, -0.75]} s={[0.04, 0.45, 0.7]} c="#0b0c10" e={C.teal} ei={0.9} />
        <Box p={[10.6, 1.25, 0]} s={[0.04, 0.5, 0.8]} c="#0b0c10" e={C.blue} ei={1.1} />
        <Box p={[10.55, 1.2, 0.75]} s={[0.04, 0.45, 0.7]} c="#0b0c10" e={C.violet} ei={0.9} />
        <Box p={[9.3, 0.5, 0]} s={[0.55, 1.0, 0.55]} c="#141418" />
        <Box p={[X - 0.08, 1.6, 1.8]} s={[0.04, 0.5, 0.3]} c="#222" e={C.gold} ei={0.6} />
      </Zone>

      {/* 5 War room: lasitaulu roadmapille + pöytä */}
      <Zone id="warroom" onSelect={onSelect}>
        <Box p={[0, 1.3, -0.2]} s={[3.2, 1.8, 0.06]} c="#dfe6ef" r={0.3} />
        <Box p={[-1.55, 0.6, -0.2]} s={[0.06, 1.2, 0.5]} c={C.steel} />
        <Box p={[1.55, 0.6, -0.2]} s={[0.06, 1.2, 0.5]} c={C.steel} />
        {[-1.1, -0.5, 0.1, 0.7, 1.2].map((x, i) => (
          <Box key={x} p={[x, 1.55 - (i % 2) * 0.45, -0.16]} s={[0.32, 0.32, 0.02]} c={[C.gold, '#ff9eb5', '#9be7a3', '#9ec5ff', C.gold][i]} />
        ))}
        <Cyl p={[0, 0.38, 1.5]} rt={0.7} rb={0.7} h={0.06} c={C.wood} />
        <Cyl p={[0, 0.18, 1.5]} rt={0.06} rb={0.25} h={0.36} c={C.steel} m={0.6} />
      </Zone>

      {/* 6 Projektipöytä: pienoismallit + arcade-kaappi */}
      <Zone id="projects" onSelect={onSelect}>
        <Box p={[-8.4, 0.4, 0]} s={[2.4, 0.8, 1.4]} c={C.woodDark} />
        <Box p={[-9.0, 1.0, -0.2]} s={[0.5, 0.4, 0.5]} c={C.teal} />
        <Box p={[-8.2, 1.15, 0.2]} s={[0.35, 0.7, 0.35]} c="#cfd6e0" />
        <Box p={[-7.6, 0.95, -0.3]} s={[0.6, 0.3, 0.4]} c={C.brass} m={0.4} />
        <Box p={[-11.3, 0.9, 1.8]} s={[0.8, 1.8, 0.8]} c="#1a1426" />
        <Box p={[-10.88, 1.3, 1.8]} s={[0.04, 0.5, 0.6]} c="#000" e={C.violet} ei={1.4} />
      </Zone>

      {/* 7 Harrastusnurkka: haarniska, miekka, sukellusmaski */}
      <Zone id="hobbies" onSelect={onSelect}>
        <Cyl p={[-10.2, 0.05, -5.6]} rt={0.35} rb={0.35} h={0.1} c={C.woodDark} />
        <Cyl p={[-10.2, 1.05, -5.6]} rt={0.24} rb={0.3} h={1.0} c="#8a8f99" m={0.9} r={0.3} />
        <mesh position={[-10.2, 1.75, -5.6]}>
          <sphereGeometry args={[0.18, 20, 16]} />
          <meshStandardMaterial color="#8a8f99" metalness={0.9} roughness={0.3} />
        </mesh>
        <Box p={[-X + 0.1, 1.8, -4.4]} s={[0.04, 1.2, 0.08]} c="#c7ccd4" m={0.9} r={0.2} />
        <Box p={[-X + 0.1, 1.4, -4.4]} s={[0.05, 0.08, 0.35]} c={C.brass} m={0.6} />
        <Box p={[-X + 0.1, 1.5, -6.8]} s={[0.05, 0.3, 0.5]} c={C.teal} />
      </Zone>

      {/* 8 Palkintoseinä: hylly ja pokaalit */}
      <Zone id="trophies" onSelect={onSelect}>
        <Box p={[0, 1.3, -7.8]} s={[3.4, 0.06, 0.35]} c={C.woodDark} />
        <Box p={[0, 2.1, -7.8]} s={[3.4, 0.06, 0.35]} c={C.woodDark} />
        {[-1.2, -0.4, 0.4, 1.2].map((x) => (
          <Cyl key={x} p={[x, 1.52, -7.78]} rt={0.12} rb={0.06} h={0.38} c={C.gold} m={0.9} r={0.25} />
        ))}
        {[-0.9, 0, 0.9].map((x) => (
          <Box key={x} p={[x, 2.45, -7.93]} s={[0.6, 0.45, 0.04]} c={C.wine} />
        ))}
      </Zone>

      {/* 9 Ikkuna ja karttapöytä: pöytä, hologrammipallo, kaukoputki */}
      <Zone id="window" onSelect={onSelect}>
        <Box p={[7.6, 0.42, -5.2]} s={[2.6, 0.84, 1.6]} c={C.woodDark} />
        <Box p={[7.6, 0.86, -5.2]} s={[2.4, 0.02, 1.4]} c="#c9b48a" e="#3a2c14" ei={0.4} />
        <mesh position={[7.6, 1.45, -5.2]}>
          <sphereGeometry args={[0.35, 24, 16]} />
          <meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={1.4} wireframe toneMapped={false} />
        </mesh>
        <Cyl p={[10.4, 0.6, -6.6]} rt={0.03} rb={0.12} h={1.2} c={C.steel} m={0.7} />
        <mesh position={[10.4, 1.35, -6.75]} rotation-x={-0.6}>
          <cylinderGeometry args={[0.07, 0.09, 0.9, 16]} />
          <meshStandardMaterial color={C.ink} metalness={0.4} roughness={0.4} />
        </mesh>
      </Zone>
    </RigidBody>
  )
}

/* Vyöhykkeiden matot ja hehkuvat renkaat (ei törmäyksiä) */
function Pads({ getActive, rings }: { getActive: () => LoftZoneId | null; rings: RefObject<Map<LoftZoneId, THREE.MeshStandardMaterial>> }) {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    rings.current?.forEach((mat, id) => {
      const on = getActive() === id
      mat.emissiveIntensity = on ? 2.2 + Math.sin(t * 5) * 0.6 : 0.35
      mat.opacity = on ? 0.95 : 0.45
    })
  })
  return (
    <>
      {ZONES.map((z) => (
        <group key={z.id}>
          <mesh position={[z.center[0], 0.005, z.center[1]]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[6.4, 4.2]} />
            <meshStandardMaterial color={z.tint} roughness={1} />
          </mesh>
          <mesh position={[z.hotspot[0], 0.012, z.hotspot[1]]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.55, 0.68, 40]} />
            <meshStandardMaterial
              ref={(m) => {
                if (m) rings.current?.set(z.id, m)
              }}
              color={C.brass}
              emissive={C.brass}
              emissiveIntensity={0.35}
              transparent
              opacity={0.45}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </>
  )
}

/* Paikkamerkkihahmo: viininpunainen paita + musta liivi (vaihtuu Henryyn myöhemmin) */
function Placeholder() {
  return (
    <group>
      <mesh position={[0, -0.05, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.85, 6, 16]} />
        <meshStandardMaterial color={C.wine} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.5, 20]} />
        <meshStandardMaterial color="#111216" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.2, 24, 18]} />
        <meshStandardMaterial color="#d9a98a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.82, -0.03]}>
        <sphereGeometry args={[0.205, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a1c14" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.38, 0.17]}>
        <boxGeometry args={[0.12, 0.06, 0.04]} />
        <meshStandardMaterial color={C.brass} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

type Keys = 'forward' | 'backward' | 'leftward' | 'rightward' | 'jump' | 'run'
const IDLE = { forward: false, backward: false, leftward: false, rightward: false, run: false, jump: false, joystick: { x: 0, y: 0 } }

/* Ecctrl v2 ei lue näppäimistöä itse: välitetään näppäimet ja joystick joka ruudulla */
function InputBridge({ ecctrl, enabled }: { ecctrl: RefObject<EcctrlHandle | null>; enabled: boolean }) {
  const [, getKeys] = useKeyboardControls<Keys>()
  useFrame(() => {
    const e = ecctrl.current
    if (!e) return
    if (!enabled) {
      e.setMovement(IDLE)
      return
    }
    const k = getKeys()
    const js = Object.values(useJoystickStore.getState().joysticks).find((j) => j.active)
    e.setMovement({
      forward: k.forward,
      backward: k.backward,
      leftward: k.leftward,
      rightward: k.rightward,
      run: k.run,
      jump: k.jump,
      joystick: js ? { x: js.x, y: js.y } : { x: 0, y: 0 },
    })
  })
  return null
}

/* Kamera seuraa hahmoa; lähin vyöhyke raportoidaan ylös vain muuttuessaan */
function Rig({
  ecctrl,
  onNear,
  getActive,
  setActive,
}: {
  ecctrl: RefObject<EcctrlHandle | null>
  onNear: (id: LoftZoneId | null) => void
  getActive: () => LoftZoneId | null
  setActive: (id: LoftZoneId | null) => void
}) {
  const cam = useRef<EcctrlCameraControlsHandle>(null)
  const three = useThree()

  useEffect(() => {
    const [x, y, z] = SPAWN
    const k = three.size.width < three.size.height ? 1.6 : 1
    cam.current?.setLookAt(x + 3.2 * k, y + 2.6 * k, z + 4.6 * k, x, y, z, false)
    // vain alussa: myöhempi ikkunan koon muutos ei siirrä kameraa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    const e = ecctrl.current
    if (!e || !cam.current) return
    const p = e.currPos
    cam.current.moveTo(p.x, p.y + 0.5, p.z, true)

    let best: LoftZoneId | null = null
    let bestD = INTERACT_RADIUS
    for (const z of ZONES) {
      const d = Math.hypot(p.x - z.hotspot[0], p.z - z.hotspot[1])
      if (d < bestD) {
        bestD = d
        best = z.id
      }
    }
    if (best !== getActive()) {
      setActive(best)
      onNear(best)
    }
  })

  return (
    <EcctrlCameraControls
      ref={cam}
      makeDefault
      smoothTime={0.12}
      minDistance={2.5}
      maxDistance={9}
      minPolarAngle={0.35}
      maxPolarAngle={1.32}
    />
  )
}

export function LoftScene({
  enabled,
  onNear,
  onSelect,
}: {
  enabled: boolean
  onNear: (id: LoftZoneId | null) => void
  onSelect: (id: LoftZoneId) => void
}) {
  const ecctrl = useRef<EcctrlHandle>(null)
  const active = useRef<LoftZoneId | null>(null)
  const rings = useRef(new Map<LoftZoneId, THREE.MeshStandardMaterial>())
  const getActive = useCallback(() => active.current, [])
  const setActive = useCallback((id: LoftZoneId | null) => {
    active.current = id
  }, [])

  return (
    <>
      <color attach="background" args={['#0b0c11']} />
      <fog attach="fog" args={['#0b0c11', 22, 46]} />
      <hemisphereLight args={['#c9d2ff', '#3a2618', 1.5]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 9, -12]} intensity={1.1} color="#9fb2ff" />
      {/* Lämpimät riippuvalot vyöhykkeiden yllä */}
      {ZONES.map((z) => (
        <pointLight key={z.id} position={[z.center[0], 3.4, z.center[1]]} intensity={45} distance={11} decay={2} color="#ffb877" />
      ))}

      <Physics>
        <Room />
        <Props onSelect={onSelect} />
        <KeyboardControls map={KEYMAP}>
          <Ecctrl
            ref={ecctrl}
            enable={enabled}
            position={SPAWN}
            capsuleHalfHeight={0.45}
            capsuleRadius={0.3}
            floatHeight={0.25}
            maxWalkVel={3.2}
            maxRunVel={6}
            jumpVel={4}
          >
            <Placeholder />
          </Ecctrl>
          <InputBridge ecctrl={ecctrl} enabled={enabled} />
        </KeyboardControls>
      </Physics>
      <Pads getActive={getActive} rings={rings} />
      <Rig ecctrl={ecctrl} onNear={onNear} getActive={getActive} setActive={setActive} />
    </>
  )
}
