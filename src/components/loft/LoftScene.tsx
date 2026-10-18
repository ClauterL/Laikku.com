import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { Environment, KeyboardControls, Lightformer, useAnimations, useGLTF, useKeyboardControls } from '@react-three/drei'
import { Ecctrl, type EcctrlHandle } from 'ecctrl'
import { EcctrlCameraControls, type EcctrlCameraControlsHandle } from 'ecctrl/camera'
import { useJoystickStore } from 'ecctrl/input'
import { EcctrlAnimationStateController, useEcctrlAnimationStore, type EcctrlAnimationState } from 'ecctrl/animation'

import type { Content, LoftZoneId } from '@/content'
import colliders from './colliders.json'
import { RoboDog } from './RoboDog'
import { Screens } from './Screens'
import { INTERACT_RADIUS, MAP_HIGHLIGHT, MODEL_BASE, PROPS, SPAWN, SPAWN_YAW, ZONES, type Anchor, type PropDef } from './zones'

export type CamView = 'tps' | 'fps'

/* Värit: sivun teema (viini, messinki, hiili) */
const C = {
  brass: '#c9a86a',
  brassLight: '#e8cf96',
  wine: '#7a2433',
  teal: '#3fa7a0',
  mapLand: '#6b5a3e',
  mapBoard: '#17120e',
} as const

const KEYMAP = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

const url = (file: string) => MODEL_BASE + file

/* ---------- läpinäkymä: hahmon ja kameran väliin jäävät seinät aukeavat ---------- */

const CUTOUT = {
  uPlayer: { value: new THREE.Vector3() },
  uCam: { value: new THREE.Vector3() },
  uCutR: { value: 0.45 },
}

/** Lisää materiaaliin pyöreän aukon kameran ja hahmon väliselle janalle (lattia jää ehjäksi) */
function withCutout(material: THREE.Material) {
  if (material.userData.cutout) return
  material.userData.cutout = true
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, CUTOUT)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCutWorld;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
vec4 cutWp = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
cutWp = instanceMatrix * cutWp;
#endif
vCutWorld = (modelMatrix * cutWp).xyz;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCutWorld;\nuniform vec3 uPlayer;\nuniform vec3 uCam;\nuniform float uCutR;')
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
if (vCutWorld.y > 0.06) {
  vec3 seg = uPlayer - uCam;
  float segL = length(seg);
  vec3 dir = seg / max(segL, 0.001);
  vec3 rel = vCutWorld - uCam;
  float t = dot(rel, dir);
  if (t > 0.0 && t < segL - 0.5) {
    float d = length(rel - dir * t);
    float r = uCutR * clamp(t / segL + 0.2, 0.0, 1.0);
    if (d < r) discard;
  }
}`,
      )
  }
  material.customProgramCacheKey = () => 'loft-cutout'
}

function cutoutAll(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    mats.forEach(withCutout)
  })
}

/* ---------- asunto ---------- */

function isEnvMaterial(m: THREE.Material) {
  return /hdri/i.test(m.name)
}

interface LightmapManifest {
  gain: number
  atlases: { file: string; M: number }[]
}

/**
 * Unrealin Lightmass-valokartat (jos viety): materiaalit, joiden nimi päättyy __lmK,
 * saavat atlaksen K valokartaksi uv1-kanavalle. Ilman tiedostoa käytetään pelkkiä reaaliaikavaloja.
 */
function useLightmaps(scene: THREE.Object3D, onReady: (lit: boolean) => void) {
  useEffect(() => {
    let alive = true
    // oma latausmanageri: valokartat eivät nosta latausruutua uudelleen esiin
    const loader = new THREE.TextureLoader(new THREE.LoadingManager())
    fetch(url('lightmaps.json'))
      .then((r) => (r.ok ? (r.json() as Promise<LightmapManifest>) : null))
      .then(async (man) => {
        if (!man || !alive) return
        const tex = await Promise.all(
          man.atlases.map(async (a) => {
            const t = await loader.loadAsync(url(a.file))
            t.flipY = false
            t.channel = 1
            t.colorSpace = THREE.SRGBColorSpace
            return { t, M: a.M }
          }),
        )
        if (!alive) return
        scene.traverse((o) => {
          const mesh = o as THREE.Mesh
          if (!mesh.isMesh) return
          const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[]
          for (const m of mats) {
            const k = /__lm(\d+)$/.exec(m.name)
            const lm = k ? tex[Number(k[1])] : undefined
            if (!lm) continue
            m.lightMap = lm.t
            m.lightMapIntensity = lm.M * man.gain
            // epäsuora valo tulee jo kartasta: ympäristöstä vain heijastukset
            m.envMapIntensity = 0.4
            m.needsUpdate = true
          }
        })
        onReady(true)
      })
      .catch(() => onReady(false))
    return () => {
      alive = false
    }
  }, [scene, onReady])
}

function Apartment({ shadows, onLit }: { shadows: boolean; onLit: (lit: boolean) => void }) {
  const { scene } = useGLTF(url('apartment.glb'), false, true)
  useLightmaps(scene, onLit)
  useLayoutEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (mats.some(isEnvMaterial)) {
        // Kaupunkipanoraama: nähdään pallon sisältä, ei valaistusta
        for (const m of mats) {
          m.side = THREE.BackSide
          m.toneMapped = false
        }
        mesh.renderOrder = -1
        return
      }
      mesh.castShadow = shadows
      mesh.receiveShadow = true
    })
    cutoutAll(scene)
  }, [scene, shadows])
  return <primitive object={scene} />
}

/** Kaikki törmäykset: lattia + kerroksen seinät ja isot huonekalut (generoitu mallista ja pohjasta) */
function ApartmentColliders() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[10, 0.5, 14]} position={[0, -0.5, 6.3]} />
      {colliders.solid.map(([x, y, z, hx, hy, hz], i) => (
        <CuboidCollider key={i} args={[hx, hy, hz]} position={[x, y, z]} />
      ))}
    </RigidBody>
  )
}

/** Näkymättömät laatikot kameran törmäyksiin: seinät + katto (kamera pysyy huoneen sisällä) */
function useCameraBlockers() {
  return useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1)
    const mat = new THREE.MeshBasicMaterial({ visible: false })
    // + katto koko kerroksen yllä
    const boxes: number[][] = [...colliders.camera, [0, 2.97, 6.3, 6, 0.22, 13]]
    return boxes.map(([x, y, z, hx, hy, hz]) => {
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, y, z)
      m.scale.set(hx * 2, hy * 2, hz * 2)
      m.updateMatrixWorld(true)
      return m
    })
  }, [])
}

/* ---------- esineet ---------- */

function anchorPoint(box: THREE.Box3, anchor: Anchor): THREE.Vector3 {
  const c = box.getCenter(new THREE.Vector3())
  switch (anchor) {
    case 'back':
      return new THREE.Vector3(c.x, box.min.y, box.min.z)
    case 'front':
      return new THREE.Vector3(c.x, box.min.y, box.max.z)
    case 'top':
      return new THREE.Vector3(c.x, box.max.y, c.z)
    case 'wall':
      return new THREE.Vector3(c.x, c.y, box.min.z)
    case 'origin':
      return new THREE.Vector3(0, 0, 0)
    default:
      return new THREE.Vector3(c.x, box.min.y, c.z)
  }
}

/** Esineen erikoiskäsittely latauksen jälkeen (materiaalit) */
function prepareProp(id: string, root: THREE.Object3D) {
  if (id === 'worldmap') {
    const land = new THREE.MeshStandardMaterial({ color: C.mapLand, metalness: 0.55, roughness: 0.45 })
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      // maakoodi on solmun tai sen vanhemman nimessä (FI, HR …)
      const code = [mesh.name, mesh.parent?.name ?? ''].find((n) => MAP_HIGHLIGHT[n])
      mesh.material = code
        ? new THREE.MeshStandardMaterial({ color: MAP_HIGHLIGHT[code], emissive: MAP_HIGHLIGHT[code], emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.4 })
        : land
    })
  }
  if (id === 'arcade') {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat.map) {
        mat.emissive = new THREE.Color('#ffffff')
        mat.emissiveMap = mat.map
        mat.emissiveIntensity = 0.32
      }
    })
  }
}

function Placed({ def, shadows, onSelect }: { def: PropDef; shadows: boolean; onSelect: (id: LoftZoneId) => void }) {
  const { scene, animations } = useGLTF(url(def.file), false, true)

  const placed = useMemo(() => {
    const obj = scene.clone(true)
    prepareProp(def.id, obj)
    cutoutAll(obj)
    const tilt = new THREE.Group()
    tilt.rotation.x = def.rotX ?? 0
    tilt.add(obj)
    tilt.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(tilt)
    const size = box.getSize(new THREE.Vector3())
    const k = def.fit.s ?? (def.fit.h ? def.fit.h / size.y : (def.fit.w ?? size.x) / size.x)
    const a = anchorPoint(box, def.anchor ?? 'bottom')
    const center = box.getCenter(new THREE.Vector3())
    const cast = def.castShadow ?? true
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = shadows && cast
        mesh.receiveShadow = true
      }
    })
    const kz = k * (def.depthScale ?? 1)
    const scale = new THREE.Vector3(k, k, kz)
    const half = size.clone().multiply(scale).multiplyScalar(0.5)
    const offset = center.clone().sub(a).multiply(scale)
    let collider: { args: [number, number, number]; pos: [number, number, number] } | null = null
    if (def.collider === 'box') collider = { args: [half.x, half.y, half.z], pos: [offset.x, offset.y, offset.z] }
    if (def.collider === 'thin') collider = { args: [half.x, half.y, 0.07], pos: [offset.x, offset.y, (box.min.z - a.z) * kz + 0.07] }
    return { tilt, obj, scale, a, collider }
  }, [scene, def, shadows])

  // Animoitu esine (robottikäsi): klooni saa oman mikserin, solmujen nimet säilyvät
  const mixer = useMemo(() => {
    const clip = def.anim ? animations.find((c) => c.name === def.anim) : undefined
    if (!clip) return null
    const m = new THREE.AnimationMixer(placed.obj)
    const action = m.clipAction(clip)
    action.timeScale = def.animSpeed ?? 1
    action.play()
    return m
  }, [animations, def, placed.obj])
  useEffect(() => () => void mixer?.stopAllAction(), [mixer])
  useFrame((_, dt) => mixer?.update(Math.min(dt, 0.1)))

  const rotY = def.rotY ?? 0
  const body = (
    <group position={def.at} rotation-y={rotY}>
      <group scale={placed.scale} position={[-placed.a.x * placed.scale.x, -placed.a.y * placed.scale.y, -placed.a.z * placed.scale.z]}>
        <primitive object={placed.tilt} />
      </group>
    </group>
  )

  return (
    <>
      {def.zone ? (
        <ZoneHit id={def.zone} onSelect={onSelect}>
          {body}
        </ZoneHit>
      ) : (
        body
      )}
      {placed.collider && (
        <RigidBody type="fixed" colliders={false} position={def.at} rotation={[0, rotY, 0]}>
          <CuboidCollider args={placed.collider.args} position={placed.collider.pos} />
        </RigidBody>
      )}
      {def.id === 'worldmap' && (
        // tumma taustalevy kartan taakse
        <mesh position={[def.at[0] - Math.sin(rotY) * 0.02, def.at[1], def.at[2] - Math.cos(rotY) * 0.02]} rotation-y={rotY}>
          <boxGeometry args={[(def.fit.w ?? 1.7) + 0.16, (def.fit.w ?? 1.7) * 0.68 + 0.16, 0.02]} />
          <meshStandardMaterial color={C.mapBoard} roughness={0.8} />
        </mesh>
      )}
    </>
  )
}

/** Klikattava vyöhyke: hiiri osoittimeksi ja avaus napautuksella */
function ZoneHit({ id, onSelect, children }: { id: LoftZoneId; onSelect: (id: LoftZoneId) => void; children: ReactNode }) {
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

/* Vyöhykkeiden lattiarenkaat ja leijuvat merkit */
function Beacons({ getActive, onSelect }: { getActive: () => LoftZoneId | null; onSelect: (id: LoftZoneId) => void }) {
  const rings = useRef(new Map<LoftZoneId, THREE.MeshStandardMaterial>())
  const gems = useRef(new Map<LoftZoneId, THREE.Mesh>())
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const active = getActive()
    rings.current.forEach((mat, id) => {
      const on = active === id
      mat.emissiveIntensity = on ? 1.3 + Math.sin(t * 4) * 0.35 : 0.35
      mat.opacity = on ? 0.85 : 0.32
    })
    gems.current.forEach((m, id) => {
      const z = ZONES.find((x) => x.id === id)
      if (!z) return
      m.position.y = z.marker[1] + Math.sin(t * 1.6 + z.hotspot[0]) * 0.06
      m.rotation.y = t * 0.8
      const s = active === id ? 1.25 : 1
      m.scale.setScalar(s)
    })
  })
  return (
    <>
      {ZONES.map((z) => (
        <group key={z.id}>
          <mesh position={[z.hotspot[0], 0.015, z.hotspot[1]]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.42, 0.5, 48]} />
            <meshStandardMaterial
              ref={(m) => {
                if (m) rings.current.set(z.id, m)
              }}
              color={C.brass}
              emissive={C.brass}
              emissiveIntensity={0.5}
              transparent
              opacity={0.4}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
          <mesh
            ref={(m) => {
              if (m) gems.current.set(z.id, m)
            }}
            position={z.marker}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(z.id)
            }}
          >
            <octahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial color={C.brassLight} emissive={C.brass} emissiveIntensity={1.6} metalness={0.6} roughness={0.25} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/* ---------- valot ---------- */

/** Lämpimät huonevalot (ei varjoja) – katoton asunto valaistaan näillä + ympäristöllä */
const ROOM_LIGHTS: { p: [number, number, number]; c: string; i: number; d: number }[] = [
  { p: [-2.3, 2.45, -2.0], c: '#ffc58a', i: 9, d: 6 }, // koti: olohuone
  { p: [-1.6, 2.45, 2.4], c: '#ffd2a0', i: 8, d: 6 }, // koti: ruokailu + eteinen
  { p: [2.4, 2.45, -2.1], c: '#ffc58a', i: 7, d: 6 }, // koti: makuuhuone
  { p: [-3.4, 1.5, 16.05], c: '#7d8cff', i: 4, d: 3.5 }, // paja: työpisteen RGB-hehku
  { p: [-1.0, 2.45, 6.33], c: '#ffe2bd', i: 9, d: 7.5 }, // aula
  { p: [-1.8, 2.45, 9.4], c: '#ffbe7a', i: 7, d: 5.5 }, // arcade-galleria
  { p: [-0.2, 1.6, 9.4], c: '#c45cff', i: 2.5, d: 2.8 }, // arcade-hehku
  { p: [2.4, 2.45, 9.2], c: '#ffd2a0', i: 6, d: 4.5 }, // kahvio + WC
  { p: [0.0, 2.3, 12.95], c: '#ffd2a0', i: 8, d: 6.5 }, // war room
  { p: [0.0, 2.45, 16.2], c: '#fff0dc', i: 8, d: 6.5 }, // paja
]

function Lights({ lit }: { lit: boolean }) {
  // Valokarttojen kanssa huonevalot hiljaisemmiksi (epäsuora valo on jo kartoissa)
  const k = lit ? 0.35 : 1
  return (
    <>
      <hemisphereLight args={['#c3ccff', '#2a1d14', 0.55 * k]} />
      {/* Kuunvalo/kaupungin hehku ikkunoista (katto estäisi varjot, joten ilman varjoja) */}
      <directionalLight position={[-2, 4, -9]} intensity={0.55} color="#aebcff" />
      {ROOM_LIGHTS.map((l, i) => (
        <pointLight key={i} position={l.p} color={l.c} intensity={l.i * k} distance={l.d} decay={2} />
      ))}
      {/* Ympäristöheijastukset ilman ulkoisia tiedostoja: ruudun sisällä renderöidyt valopaneelit */}
      <Environment resolution={128} frames={1} environmentIntensity={lit ? 0.45 : 0.7}>
        <Lightformer form="rect" intensity={1.6} color="#ffe0bd" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#8ea2ff" position={[0, 2, -9]} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#ffb070" position={[-9, 2, 0]} rotation-y={Math.PI / 2} scale={[12, 3, 1]} />
        <Lightformer form="ring" intensity={2} color="#c9a86a" position={[6, 3, 4]} scale={2} />
      </Environment>
    </>
  )
}

/* ---------- hahmo ja ohjaus ---------- */

/* Hahmo: riggattu malli (idle/walk/run), sävytetty sivun viininpunaiseksi ja messingiksi */
const ANIM: Record<EcctrlAnimationState, string> = {
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'run',
  JUMP_START: 'run',
  JUMP_IDLE: 'idle',
  JUMP_FALL: 'idle',
  JUMP_LAND: 'idle',
}
/** Kapselin keskipisteestä jalkoihin: capsuleHalfHeight + capsuleRadius + floatHeight */
const FEET = -(0.45 + 0.26 + 0.25)
const CHAR_HEIGHT = 1.78
/** Kehitystila: ?spawn=x,z,yaw siirtää aloituspaikan (testikuvia varten, ei tuotannossa) */
const DEV_SPAWN = (() => {
  if (!import.meta.env.DEV || typeof location === 'undefined') return null
  const v = new URLSearchParams(location.search).get('spawn')
  const n = v?.split(',').map(Number)
  return n && n.length >= 2 && n.every(Number.isFinite) ? { pos: [n[0], 1.2, n[1]] as [number, number, number], yaw: n[2] ?? SPAWN_YAW } : null
})()
const START = DEV_SPAWN?.pos ?? SPAWN
const START_YAW = DEV_SPAWN?.yaw ?? SPAWN_YAW

/** Kameran tähtäys kapselin keskipisteestä: niska/olkapää */
const HEAD = 0.58

/** Pehmeä varjo hahmon alle (katon takia ei suoraa valoa ylhäältä) */
function makeBlob(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62)
  grd.addColorStop(0, 'rgba(0,0,0,0.55)')
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

function Character({ shadows, hidden }: { shadows: boolean; hidden: boolean }) {
  const blob = useMemo(() => makeBlob(), [])
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(url('character.glb'), false, true)
  const { actions } = useAnimations(animations, group)
  const state = useEcctrlAnimationStore((s) => s.animationState)

  const k = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    return CHAR_HEIGHT / Math.max(0.01, box.max.y - box.min.y)
  }, [scene])

  useLayoutEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh
      if (!mesh.isMesh) return
      mesh.castShadow = shadows
      mesh.receiveShadow = true
      mesh.frustumCulled = false
      const old = mesh.material as THREE.MeshStandardMaterial
      // Oma hahmomalli (esim. MetaHuman) pitää omat materiaalinsa; vain Mixamon mallinukke sävytetään
      if (!/alpha|beta/i.test(old.name)) return
      const joint = /joint/i.test(old.name)
      mesh.material = new THREE.MeshStandardMaterial({
        color: joint ? C.brass : C.wine,
        metalness: joint ? 0.85 : 0.25,
        roughness: joint ? 0.3 : 0.45,
      })
    })
  }, [scene, shadows])

  /* Ristihäivytys vain, kun klippi oikeasti vaihtuu: saman klipin uudelleenkäynnistys (esim. laskeutuminen → idle)
     nollaisi painon ja näyttäisi hetken T-asennon */
  const current = useRef<THREE.AnimationAction | null>(null)
  useFrame(() => {
    const next = actions[ANIM[state]] ?? actions.idle
    if (!next || (next === current.current && next.isRunning())) return
    const prev = current.current
    next.reset().setEffectiveWeight(1).play()
    if (prev && prev !== next && prev.isRunning()) prev.crossFadeTo(next, 0.2, false)
    current.current = next
  })

  return (
    <group visible={!hidden}>
      <group ref={group} position={[0, FEET, 0]} scale={k}>
        <primitive object={scene} />
      </group>
      <mesh position={[0, FEET + 0.012, 0]} rotation-x={-Math.PI / 2} renderOrder={1}>
        <planeGeometry args={[0.95, 0.95]} />
        <meshBasicMaterial map={blob} transparent depthWrite={false} />
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

/** Kamerat: kolmas persoona olan yli (GTA/AC) ja ensimmäinen persoona silmien korkeudelta */
const VIEW = {
  tps: { min: 1.1, max: 4.2, dist: 2.6, polar: [0.7, 1.78] as const, offset: 0.42 },
  fps: { min: 0.05, max: 0.05, dist: 0.05, polar: [0.25, Math.PI - 0.3] as const, offset: 0 },
}
/** Silmät kapselin keskipisteestä (n. 1,62 m lattiasta) */
const EYE = 0.66
/** Hiirikatseen herkkyys (rad / px) */
const LOOK_SPEED = 0.0024

/* Kamera seuraa hahmoa; lähin vyöhyke raportoidaan ylös vain muuttuessaan */
function Rig({
  ecctrl,
  view,
  enabled,
  onNear,
  getActive,
  setActive,
}: {
  ecctrl: RefObject<EcctrlHandle | null>
  view: CamView
  enabled: boolean
  onNear: (id: LoftZoneId | null) => void
  getActive: () => LoftZoneId | null
  setActive: (id: LoftZoneId | null) => void
}) {
  const cam = useRef<EcctrlCameraControlsHandle>(null)
  const three = useThree()
  const blockers = useCameraBlockers()
  const portrait = three.size.width < three.size.height

  // Alku: hahmon takaa hissin puolelta, katse aulaa pitkin itään (W vie eteenpäin)
  useEffect(() => {
    const c = cam.current
    if (!c) return
    c.colliderMeshes = blockers
    const [x, y, z] = START
    const fx = Math.sin(START_YAW)
    const fz = Math.cos(START_YAW)
    c.setLookAt(x - fx * 1.9, y + HEAD + 0.45, z - fz * 1.9, x + fx, y + HEAD, z + fz, false)
    // vain alussa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockers])

  // Näkymän vaihto: etäisyys, kulmarajat ja olkasiirtymä
  useEffect(() => {
    const c = cam.current
    if (!c) return
    const v = VIEW[view]
    c.minDistance = v.min
    c.maxDistance = portrait && view === 'tps' ? 4.6 : v.max
    c.minPolarAngle = v.polar[0]
    c.maxPolarAngle = v.polar[1]
    c.setFocalOffset(portrait ? 0 : v.offset, view === 'tps' ? 0.05 : 0, 0, true)
    c.dollyTo(portrait && view === 'tps' ? 3.3 : v.dist, true)
    // pystynäytöllä laajempi kuvakulma, ettei hahmo täytä koko ruutua
    const pc = three.camera as THREE.PerspectiveCamera
    pc.fov = portrait ? 68 : 55
    pc.updateProjectionMatrix()
  }, [view, portrait, three.camera])

  // Hiirikatse: kun osoitin on lukittu näkymään, hiiren liike kääntää katsetta (kuten peleissä)
  useEffect(() => {
    const el = three.gl.domElement
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el || !cam.current) return
      cam.current.rotate(-e.movementX * LOOK_SPEED, -e.movementY * LOOK_SPEED, false)
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [three.gl])

  // Paneelin avautuessa hiiri vapautetaan
  useEffect(() => {
    if (!enabled && document.pointerLockElement) document.exitPointerLock()
  }, [enabled])

  // Kehitystila: testikuvien ja kulkutestien kahva (window.__loft), ei tuotannossa
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __loft?: unknown }).__loft = { ecctrl, cam }
  }, [ecctrl])

  useFrame(() => {
    const e = ecctrl.current
    if (!e || !cam.current) return
    const p = e.currPos
    cam.current.moveTo(p.x, p.y + (view === 'fps' ? EYE : HEAD), p.z, true)
    CUTOUT.uPlayer.value.set(p.x, p.y + 0.2, p.z)
    CUTOUT.uCam.value.copy(three.camera.position)

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
      smoothTime={0.08}
      minDistance={VIEW.tps.min}
      maxDistance={portrait ? 4.6 : VIEW.tps.max}
      minPolarAngle={VIEW.tps.polar[0]}
      maxPolarAngle={VIEW.tps.polar[1]}
    />
  )
}

export function LoftScene({
  enabled,
  shadows,
  view,
  screens,
  onNear,
  onSelect,
}: {
  enabled: boolean
  shadows: boolean
  view: CamView
  /** Näyttöjen tekstit (loft.screens) – Canvasin sisällä ei käytetä kielikontekstia */
  screens: Content['loft']['screens']
  onNear: (id: LoftZoneId | null) => void
  onSelect: (id: LoftZoneId) => void
}) {
  const ecctrl = useRef<EcctrlHandle>(null)
  const active = useRef<LoftZoneId | null>(null)
  const [lit, setLit] = useState(false)
  const getActive = useCallback(() => active.current, [])
  const setActive = useCallback((id: LoftZoneId | null) => {
    active.current = id
  }, [])

  return (
    <>
      <color attach="background" args={['#07080c']} />
      <Lights lit={lit} />
      <Apartment shadows={shadows} onLit={setLit} />
      <Screens text={screens} />

      <Physics>
        <ApartmentColliders />
        {PROPS.map((p) => (
          <Placed key={p.id} def={p} shadows={shadows} onSelect={onSelect} />
        ))}
        <KeyboardControls map={KEYMAP}>
          <Ecctrl
            ref={ecctrl}
            enable={enabled}
            position={START}
            rotation={[0, START_YAW, 0]}
            capsuleHalfHeight={0.45}
            capsuleRadius={0.26}
            floatHeight={0.25}
            maxWalkVel={2.4}
            maxRunVel={4.6}
            jumpVel={3.6}
            enabledRotations={[false, true, false]}
          >
            <Character shadows={shadows} hidden={view === 'fps'} />
          </Ecctrl>
          <InputBridge ecctrl={ecctrl} enabled={enabled} />
          <EcctrlAnimationStateController ecctrl={ecctrl} />
        </KeyboardControls>
        <RoboDog ecctrl={ecctrl} shadows={shadows} />
      </Physics>
      <Beacons getActive={getActive} onSelect={onSelect} />
      <Rig ecctrl={ecctrl} view={view} enabled={enabled} onNear={onNear} getActive={getActive} setActive={setActive} />
    </>
  )
}

/* Ladataan mallit taustalla heti kun loftin koodi on haettu */
useGLTF.preload(url('apartment.glb'), false, true)
useGLTF.preload(url('character.glb'), false, true)
for (const p of new Set(PROPS.map((x) => x.file))) useGLTF.preload(url(p), false, true)
