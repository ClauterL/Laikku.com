// R3F-pelisilmukka muuttaa three.js-olioita ja pelitilaa suoraan useFramessa (ei React-tilaa) – tarkoituksella.
/* eslint-disable react/immutability */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

import type { FlightStation } from '@/content'
import { G, PAL, bake, flat } from './kit'
import {
  Drone,
  Duck,
  Glow,
  LIGHT_TOP,
  Raccoon,
  Solid,
  TOWER_TOP,
  birchGeometry,
  boathouseModel,
  buoyGeometry,
  campfireModel,
  kioskModel,
  lampGeometry,
  lighthouseModel,
  lilyGeometry,
  pavilionModel,
  pineGeometry,
  rockGeometry,
  sailboatGeometry,
  saunaModel,
  shedModel,
  signGeometry,
  towerModel,
  treatGeometry,
  walkwayGeometry,
  workshopModel,
  type Built,
  type Motion,
} from './models'
import {
  BUOYS,
  EDGE_R,
  KIOSK,
  NEAR,
  PLACES,
  SEA_ROCKS,
  SPAWN,
  TREATS,
  WALKWAYS,
  WATER_Y,
  groundAt,
  height,
  makeRocks,
  makeTrees,
  noise,
  pathDist,
  rand,
  smoothstep,
  treatY,
  waterField,
  type Blocker,
  type Treat,
  type Tree,
} from './world'

/* Kahvijahdin 3D-maailma ja pelisilmukka. Yksi useFrame liikuttaa pesukarhua, dronea ja kumiankkaa, hoitaa
   törmäykset, keräilyn ja kameran; React-puu päivittyy vain harvinaisista tapahtumista (callbackit). */

/** Kameran suunta: kaakosta luoteeseen (isometrinen), korkeuskulma ~35° */
export const YAW = Math.PI / 4
const PITCH = 0.62
const CAM_D = 70
const OFFSET = new THREE.Vector3(Math.sin(YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(YAW) * Math.cos(PITCH)).multiplyScalar(CAM_D)
/** Näkymän korkeus maailman yksiköissä zoomilla 1 */
const VIEW_H = 16
/** …ja leveys vähintään (pystynäytöt) */
const VIEW_W = 15
const SUN = new THREE.Vector3(-22, 34, 14)
const DRONE_RANGE = 24

export type GameState = {
  keys: { f: boolean; b: boolean; l: boolean; r: boolean; run: boolean }
  stick: { x: number; y: number }
  px: number
  pz: number
  py: number
  face: number
  vx: number
  vz: number
  drone: boolean
  dx: number
  dy: number
  dz: number
  dvx: number
  dvz: number
  ux: number
  uz: number
  uy: number
  uface: number
  busy: boolean
  got: Set<string>
  zoom: number
  near: FlightStation | null
  teleport: { x: number; z: number } | null
  rangeWarned: boolean
  /** vihjeen kohde (herkun id) – nuoli maassa ja valopylväs */
  hint: string | null
  /** klikattu kohde maastossa (kävele / lennä sinne) */
  goal: { x: number; z: number } | null
  goalStuck: number
  reduce: boolean
  raccoon: Motion
  duck: Motion
  droneMotion: Motion
}

export type GameEvents = {
  onNear: (id: FlightStation | null) => void
  onCollect: (t: Treat) => void
  onRange: () => void
}

export function newState(): GameState {
  return {
    keys: { f: false, b: false, l: false, r: false, run: false },
    stick: { x: 0, y: 0 },
    px: SPAWN.x,
    pz: SPAWN.z,
    py: height(SPAWN.x, SPAWN.z),
    face: SPAWN.face,
    vx: 0,
    vz: 0,
    drone: false,
    dx: SPAWN.x + 0.8,
    dy: 3,
    dz: SPAWN.z + 0.6,
    dvx: 0,
    dvz: 0,
    ux: SPAWN.x - 1.2,
    uz: SPAWN.z + 1,
    uy: 0,
    uface: SPAWN.face,
    busy: false,
    got: new Set(),
    zoom: 1,
    near: null,
    teleport: null,
    rangeWarned: false,
    hint: null,
    goal: null,
    goalStuck: 0,
    reduce: false,
    raccoon: { walk: 0, phase: 0, tablet: 0, talk: 0 },
    duck: { walk: 0, phase: 0, tablet: 0, talk: 0 },
    droneMotion: { walk: 0, phase: 0, tablet: 0, talk: 0 },
  }
}

/* ================= maasto ja vesi ================= */

const _c = new THREE.Color()
const _c2 = new THREE.Color()

function terrainColor(x: number, z: number, h: number) {
  const r = Math.hypot(x, z)
  if (r > EDGE_R - 3.5) return _c.set(PAL.cliff)
  if (h < WATER_Y - 0.15) return _c.set('#c96d50')
  const w = waterField(x, z)
  if (w > -0.32 && h < 0.42) return _c.set(PAL.sand)
  if (pathDist(x, z) < 1.15) return _c.set(PAL.path)
  const forest = smoothstep(0.5, 0.7, noise(x * 0.045 + 11, z * 0.045 - 5)) + smoothstep(EDGE_R - 14, EDGE_R - 6, r)
  const n = noise(x * 0.2 + 3, z * 0.2 - 8)
  _c.set(n < 0.35 ? PAL.meadow2 : n > 0.68 ? PAL.meadowLight : PAL.meadow)
  if (forest > 0) _c.lerp(_c2.set(PAL.forestFloor), Math.min(1, forest))
  return _c
}

/** Maasto ruutuina (16 × 16 yksikköä): ruudun ulkopuoliset jäävät piirtämättä (frustum culling) */
const TILE = 16
const TILES = 9

function terrainTile(cx: number, cz: number) {
  const g = new THREE.PlaneGeometry(TILE, TILE, TILE, TILE).rotateX(-Math.PI / 2).translate(cx, 0, cz)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) pos.setY(i, Math.max(-3.2, height(pos.getX(i), pos.getZ(i))))
  const ng = g.toNonIndexed()
  g.dispose()
  const p = ng.attributes.position as THREE.BufferAttribute
  const col = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i += 3) {
    const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3
    const z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3
    const c = terrainColor(x, z, y)
    const v = 0.975 + rand(Math.round(x * 7.3 + z * 13.1), 3) * 0.05
    for (let k = 0; k < 3; k++) {
      col[(i + k) * 3] = c.r * v
      col[(i + k) * 3 + 1] = c.g * v
      col[(i + k) * 3 + 2] = c.b * v
    }
  }
  ng.setAttribute('color', new THREE.BufferAttribute(col, 3))
  ng.computeVertexNormals()
  ng.computeBoundingSphere()
  return ng
}

function Terrain() {
  const tiles = useMemo(() => {
    const out: THREE.BufferGeometry[] = []
    const half = (TILES * TILE) / 2
    for (let j = 0; j < TILES; j++)
      for (let i = 0; i < TILES; i++) {
        const cx = -half + (i + 0.5) * TILE
        const cz = -half + (j + 0.5) * TILE
        // lähin kohta origosta: kokonaan meren alla olevat ruudut pois
        const nx = Math.max(0, Math.abs(cx) - TILE / 2)
        const nz = Math.max(0, Math.abs(cz) - TILE / 2)
        if (Math.hypot(nx, nz) > EDGE_R + 5) continue
        out.push(terrainTile(cx, cz))
      }
    return out
  }, [])
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), [])
  return (
    <>
      {tiles.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} receiveShadow />
      ))}
    </>
  )
}

/** Vesi: valaisematon auringonlaskun heijastus. Syvyys luetaan maastosta leivotusta tekstuurista → rannoilla vaalea
    matalikko ja vaahtoraita, syvällä kylläisempi oranssi; välke ja loiva aaltoilu varjostimessa. */
const DEPTH_HALF = 66
function depthTexture() {
  const N = 256
  const data = new Uint8Array(N * N)
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const x = ((i + 0.5) / N) * DEPTH_HALF * 2 - DEPTH_HALF
      const z = ((j + 0.5) / N) * DEPTH_HALF * 2 - DEPTH_HALF
      const d = Math.min(1, Math.max(0, (WATER_Y - height(x, z)) / 2))
      data[j * N + i] = Math.round(d * 255)
    }
  const tex = new THREE.DataTexture(data, N, N, THREE.RedFormat, THREE.UnsignedByteType)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

function Water({ state }: { state: GameState }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uTime: { value: 0 },
            uDepth: { value: null },
            uShallow: { value: new THREE.Color('#ffd2a0') },
            uDeep: { value: new THREE.Color('#f2955c') },
            uFoam: { value: new THREE.Color('#fff4e6') },
            uGlint: { value: new THREE.Color('#fff2cc') },
          },
        ]),
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying vec3 vW;
          #include <fog_pars_vertex>
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            w.y += sin(w.x * 0.42 + uTime * 1.1) * 0.05 + cos(w.z * 0.37 - uTime * 0.85) * 0.05;
            vW = w.xyz;
            vec4 mvPosition = viewMatrix * w;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform sampler2D uDepth;
          uniform vec3 uShallow;
          uniform vec3 uDeep;
          uniform vec3 uFoam;
          uniform vec3 uGlint;
          varying vec3 vW;
          #include <fog_pars_fragment>
          void main() {
            vec2 uv = (vW.xz + ${DEPTH_HALF}.0) / ${DEPTH_HALF * 2}.0;
            float d = (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? 1.0 : texture2D(uDepth, uv).r;
            vec3 col = mix(uShallow, uDeep, smoothstep(0.0, 0.6, d));
            // välke: näytön vaakasuuntaisia viiruja (u = vaaka, v = pysty kameran suunnasta)
            float u = (vW.x - vW.z) * 0.7071;
            float v = (vW.x + vW.z) * 0.7071;
            float s = sin(v * 2.6 + uTime * 0.7 + sin(u * 0.3 + uTime * 0.25) * 1.6) * sin(u * 0.42 - uTime * 0.5 + v * 0.15);
            col = mix(col, uGlint, smoothstep(0.86, 0.98, s) * 0.7 * smoothstep(0.08, 0.3, d));
            float f = 1.0 - smoothstep(0.012, 0.05 + 0.025 * sin(uTime * 1.6 + vW.x * 0.5 + vW.z * 0.4), d);
            col = mix(col, uFoam, f * 0.9);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    [],
  )
  useEffect(() => {
    const tex = depthTexture()
    mat.uniforms.uDepth.value = tex
    return () => tex.dispose()
  }, [mat])
  const geo = useMemo(() => new THREE.PlaneGeometry(320, 320, 80, 80), [])
  useFrame(({ clock }) => {
    // vähennetty liike: vesi pysähtyy
    if (!state.reduce) mat.uniforms.uTime.value = clock.elapsedTime
  })
  return <mesh geometry={geo} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y - 0.02, 0]} />
}

/* ================= metsä ja kivet ================= */

/** Metsä: puut ryhmitellään maaston ruutujen mukaan omiksi instanssiverkoikseen → näkymän ulkopuoliset ohitetaan */
function Forest({ trees }: { trees: ReturnType<typeof makeTrees> }) {
  const meshes = useMemo(() => {
    const geos = [pineGeometry(), birchGeometry()]
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })
    const buckets = new Map<string, Tree[]>()
    for (const t of trees) {
      const k = `${t.kind}:${Math.floor(t.x / TILE)}:${Math.floor(t.z / TILE)}`
      const b = buckets.get(k)
      if (b) b.push(t)
      else buckets.set(k, [t])
    }
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const v = new THREE.Vector3()
    const sc = new THREE.Vector3()
    const c = new THREE.Color()
    const out: THREE.InstancedMesh[] = []
    for (const list of buckets.values()) {
      const mesh = new THREE.InstancedMesh(geos[list[0].kind], mat, list.length)
      list.forEach((t, i) => {
        m.compose(v.set(t.x, height(t.x, t.z) - 0.05, t.z), q.setFromEuler(e.set((t.tint - 0.5) * 0.08, t.rot, 0)), sc.set(t.s, t.s * (0.9 + t.tint * 0.3), t.s))
        mesh.setMatrixAt(i, m)
        mesh.setColorAt(i, c.setHSL(0, 0, 0.86 + t.tint * 0.16))
      })
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.computeBoundingSphere()
      out.push(mesh)
    }
    return out
  }, [trees])
  return (
    <>
      {meshes.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </>
  )
}

function Rocks({ rocks }: { rocks: ReturnType<typeof makeRocks> }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => rockGeometry(), [])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    rocks.forEach((r, i) => {
      m.compose(new THREE.Vector3(r.x, Math.max(height(r.x, r.z), WATER_Y - 0.3) + 0.05, r.z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r.rot), new THREE.Vector3(r.s, r.s, r.s))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [rocks])
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), [])
  return <instancedMesh ref={ref} args={[geo, mat, rocks.length]} castShadow receiveShadow />
}

/* ================= paikat ja rekvisiitta ================= */

const MODELS: Record<FlightStation, (() => Built) | null> = {
  dock: null,
  sauna: saunaModel,
  workshop: workshopModel,
  island: pavilionModel,
  shed: shedModel,
  harbor: boathouseModel,
  campfire: campfireModel,
  tower: towerModel,
  lighthouse: lighthouseModel,
}

/** Rakennuksen korkeus merkin paikkaa varten */
const TOPS: Record<FlightStation, number> = {
  dock: 2.6,
  sauna: 3.9,
  workshop: 5.1,
  island: 4.2,
  shed: 4,
  harbor: 4.2,
  campfire: 2.4,
  tower: TOWER_TOP + 2.6,
  lighthouse: LIGHT_TOP + 2,
}

function Smoke({ x, y, z }: { x: number; y: number; z: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (!m) return
      const k = (t * 0.28 + i / 4) % 1
      m.position.set(x + k * 1.6, y + k * 3.2, z - k * 0.4)
      m.scale.setScalar(0.25 + k * 0.6)
      ;(m.material as THREE.MeshLambertMaterial).opacity = 0.55 * (1 - k)
    })
  })
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m
          }}
        >
          <icosahedronGeometry args={[0.5, 0]} />
          <meshLambertMaterial color="#fff0e4" transparent opacity={0.5} flatShading depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

function Flame() {
  const g = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (g.current) {
      g.current.children.forEach((c, i) => {
        const s = 1 + Math.sin(t * (9 + i * 3) + i) * 0.14
        c.scale.set(s, 1 + Math.sin(t * (7 + i * 2)) * 0.2, s)
      })
    }
    if (light.current) light.current.intensity = 6 + Math.sin(t * 11) * 1.2 + Math.sin(t * 17) * 0.8
  })
  return (
    <group position={[0, 0.15, 0]}>
      <group ref={g}>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.38, 0.9, 6]} />
          <meshBasicMaterial color="#ff7a2e" toneMapped={false} />
        </mesh>
        <mesh position={[0.08, 0.3, 0.05]}>
          <coneGeometry args={[0.24, 0.7, 6]} />
          <meshBasicMaterial color="#ffc04d" toneMapped={false} />
        </mesh>
        <mesh position={[-0.05, 0.25, -0.04]}>
          <coneGeometry args={[0.12, 0.45, 5]} />
          <meshBasicMaterial color="#fff2b0" toneMapped={false} />
        </mesh>
      </group>
      <pointLight ref={light} color="#ff9a4a" distance={9} decay={1.6} position={[0, 0.9, 0]} />
    </group>
  )
}

function Beam() {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.7
  })
  return (
    <group ref={g} position={[0, LIGHT_TOP + 0.2, 0]}>
      <mesh position={[4.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[1.1, 9, 12, 1, true]} />
        <meshBasicMaterial color="#fff1b8" transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Siniristilippu: tekstuuri piirretään kerran, liehunta verteksivarjostimessa */
function Flag() {
  const mat = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 72
    cv.height = 44
    const ctx = cv.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#fff4ec'
      ctx.fillRect(0, 0, 72, 44)
      ctx.fillStyle = '#3d4c92'
      ctx.fillRect(20, 0, 12, 44)
      ctx.fillRect(0, 16, 72, 12)
    }
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    const m = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })
    const u = { uTime: { value: 0 } }
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = u.uTime
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float k = (position.x + 0.75) / 1.5;
           transformed.z += sin(position.x * 4.0 - uTime * 6.0) * 0.12 * k;
           transformed.y += sin(position.x * 3.0 - uTime * 5.0) * 0.03 * k;`,
        )
    }
    m.userData.u = u
    return m
  }, [])
  const geo = useMemo(() => new THREE.PlaneGeometry(1.5, 0.92, 10, 1), [])
  useFrame(({ clock }) => {
    ;(mat.userData.u as { uTime: { value: number } }).uTime.value = clock.elapsedTime
  })
  return (
    <group>
      <mesh material={flat(PAL.white)} position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 4, 5]} />
      </mesh>
      <mesh geometry={geo} material={mat} position={[0.78, 3.5, 0]} castShadow />
    </group>
  )
}

function Boat({ x, z, rot }: { x: number; z: number; rot: number }) {
  const g = useRef<THREE.Group>(null)
  const geo = useMemo(() => sailboatGeometry(), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (g.current) {
      g.current.rotation.z = Math.sin(t * 0.9) * 0.05
      g.current.rotation.x = Math.sin(t * 0.7 + 1) * 0.03
      g.current.position.y = WATER_Y - 0.05 + Math.sin(t * 1.1) * 0.05
    }
  })
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <group ref={g}>
        <Solid geometry={geo} />
      </group>
    </group>
  )
}

function Floaty({ x, z, children, amp = 0.05 }: { x: number; z: number; children: React.ReactNode; amp?: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (g.current) {
      g.current.position.y = WATER_Y + Math.sin(t * 1.3 + x) * amp
      g.current.rotation.z = Math.sin(t * 1.1 + z) * 0.08
    }
  })
  return (
    <group position={[x, 0, z]}>
      <group ref={g}>{children}</group>
    </group>
  )
}

function Places({ visited }: { visited: Set<FlightStation> }) {
  const built = useMemo(() => {
    const out: Partial<Record<FlightStation, Built>> = {}
    for (const p of PLACES) {
      const f = MODELS[p.id]
      if (f) out[p.id] = f()
    }
    return out
  }, [])
  const extras = useMemo(
    () => ({
      walk: WALKWAYS.map((w, i) => ({ w, g: walkwayGeometry(w.w, w.d, w.y, i === 1) })),
      kiosk: kioskModel(),
      lamp: lampGeometry(),
      sign: signGeometry(),
      buoy: buoyGeometry(),
      lily: lilyGeometry(),
      seaRock: bake([
        { g: G.dodeca(1), c: PAL.rock, s: [1.3, 0.8, 1.1] },
        { g: G.dodeca(0.55), c: PAL.rock2, p: [0.8, -0.1, 0.4] },
      ]),
    }),
    [],
  )
  return (
    <>
      {PLACES.map((p) => {
        const b = built[p.id]
        const y = height(p.x, p.z)
        return (
          <group key={p.id} position={[p.x, y, p.z]} rotation={[0, p.rot, 0]}>
            {b && <Solid geometry={b.solid} />}
            {b && <Glow geometry={b.glow} />}
            {p.id === 'sauna' && <Smoke x={-0.95} y={3.3} z={-0.35} />}
            {p.id === 'workshop' && <Smoke x={1.6} y={4.2} z={-1.2} />}
            {p.id === 'campfire' && <Flame />}
            {p.id === 'lighthouse' && <Beam />}
            {p.id === 'harbor' && (
              <group position={[-2.6, 0, 1.6]}>
                <Flag />
              </group>
            )}
          </group>
        )
      })}
      {extras.walk.map(({ w, g }, i) => (
        <group key={i} position={[w.x, 0, w.z]} rotation={[0, w.rot, 0]}>
          <Solid geometry={g} />
        </group>
      ))}
      <Boat x={6.6} z={-12.6} rot={Math.PI / 2 + 0.1} />
      <group position={[KIOSK.x, height(KIOSK.x, KIOSK.z), KIOSK.z]} rotation={[0, KIOSK.rot, 0]}>
        <Solid geometry={extras.kiosk.solid} />
      </group>
      <group position={[-3.4, 0.36, 8.6]}>
        <Solid geometry={extras.lamp.solid} />
        <Glow geometry={extras.lamp.glow} />
      </group>
      <group position={[1.4, height(1.4, 12.6), 12.6]} rotation={[0, 0.5, 0]}>
        <Solid geometry={extras.sign} />
      </group>
      {BUOYS.map(([x, z], i) => (
        <Floaty key={i} x={x} z={z}>
          <Solid geometry={extras.buoy} />
        </Floaty>
      ))}
      <Floaty x={24} z={15} amp={0.02}>
        <Solid geometry={extras.lily} shadow={false} />
      </Floaty>
      {SEA_ROCKS.map(([x, z, s], i) => (
        <group key={i} position={[x, -0.15, z]} scale={s} rotation={[0, i * 1.3, 0]}>
          <Solid geometry={extras.seaRock} />
        </group>
      ))}
      <Markers visited={visited} />
    </>
  )
}

/** Leijuvat merkit paikkojen yllä: oranssi = näkemättä, teal = nähty */
function Markers({ visited }: { visited: Set<FlightStation> }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (!g) return
      g.rotation.y = t * 1.2 + i
      g.position.y = Math.sin(t * 2 + i) * 0.15
    })
  })
  return (
    <>
      {PLACES.map((p, i) => (
        <group key={p.id} position={[p.x, height(p.x, p.z) + TOPS[p.id] + 0.9, p.z]}>
          <group
            ref={(g) => {
              refs.current[i] = g
            }}
          >
            <mesh scale={[0.32, 0.5, 0.32]}>
              <octahedronGeometry args={[1, 0]} />
              <meshBasicMaterial color={visited.has(p.id) ? PAL.teal : '#ff8a3d'} toneMapped={false} />
            </mesh>
          </group>
        </group>
      ))}
    </>
  )
}

/** Hitaat pilvet: näkymättömiä, vain varjot liukuvat maiseman yli */
const cloudMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
function Clouds() {
  const g = useRef<THREE.Group>(null)
  const geo = useMemo(
    () =>
      bake([
        { g: G.ball(1.6, 0), c: '#fff1e6', s: [1.4, 0.7, 1] },
        { g: G.ball(1.2, 0), c: '#ffe6d6', p: [1.6, 0.2, 0.3], s: [1.2, 0.7, 1] },
        { g: G.ball(1.1, 0), c: '#ffe6d6', p: [-1.5, 0.1, -0.2], s: [1.1, 0.65, 1] },
      ]),
    [],
  )
  const spots = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ x: -55 + rand(i, 31) * 110, z: -55 + rand(i, 32) * 110, s: 0.8 + rand(i, 33) * 0.8 })), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!g.current) return
    g.current.children.forEach((c, i) => {
      const s = spots[i]
      c.position.x = ((s.x + t * 0.9 + 70) % 140) - 70
    })
  })
  return (
    <group ref={g}>
      {spots.map((s, i) => (
        <mesh key={i} geometry={geo} material={cloudMat} position={[s.x, 16 + (i % 3), s.z]} scale={s.s * 1.6} castShadow />
      ))}
    </group>
  )
}

/* ================= herkut ================= */

function Treats({ state }: { state: GameState }) {
  const geos = useMemo(() => ({ coffee: treatGeometry('coffee'), donut: treatGeometry('donut'), burrito: treatGeometry('burrito') }), [])
  const refs = useRef<(THREE.Group | null)[]>([])
  const steamRefs = useRef<(THREE.Group | null)[]>([])
  const pop = useRef<number[]>(TREATS.map(() => 1))
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    TREATS.forEach((tr, i) => {
      const g = refs.current[i]
      if (!g) return
      const got = state.got.has(tr.id)
      pop.current[i] = got ? Math.max(0, pop.current[i] - dt * 3.5) : 1
      const k = pop.current[i]
      g.visible = k > 0.01
      if (!g.visible) return
      const item = g.children[0]
      item.rotation.y = t * 1.1 + i
      item.position.y = 0.12 + Math.sin(t * 2.4 + i) * 0.1 + (1 - k) * 1.2
      item.scale.setScalar(1.6 * (got ? 1 + (1 - k) * 0.6 : 1) * (k < 1 ? k : 1))
      // kahvin höyry nousee pystysuoraan, ei pyöri mukin mukana
      const steam = steamRefs.current[i]
      if (steam) {
        steam.position.y = item.position.y + 0.5
        steam.scale.setScalar(k < 1 ? k : 1)
        steam.children.forEach((c, j) => {
          const u = (t * 0.45 + j / steam.children.length + i * 0.37) % 1
          c.position.set(Math.sin(u * 6 + j * 2) * 0.05, 0.1 + u * 0.55, 0)
          c.scale.setScalar(0.04 + Math.sin(u * Math.PI) * 0.06)
        })
      }
    })
  })
  return (
    <>
      {TREATS.map((tr, i) => (
        <group
          key={tr.id}
          ref={(g) => {
            refs.current[i] = g
          }}
          position={[tr.x, treatY(tr), tr.z]}
        >
          <group>
            <mesh geometry={geos[tr.kind]} material={treatMaterial()} castShadow />
          </group>
          {tr.kind === 'coffee' && (
            <group
              ref={(sg) => {
                steamRefs.current[i] = sg
              }}
            >
              {[0, 1, 2].map((j) => (
                <mesh key={j} material={steamMaterial()}>
                  <icosahedronGeometry args={[1, 0]} />
                </mesh>
              ))}
            </group>
          )}
          {!tr.drone && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.58, 0]}>
              <ringGeometry args={[0.42, 0.62, 20]} />
              <meshBasicMaterial color="#fff1c2" transparent opacity={0.55} depthWrite={false} toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
    </>
  )
}

let _steamMat: THREE.MeshBasicMaterial | null = null
function steamMaterial() {
  if (!_steamMat) _steamMat = new THREE.MeshBasicMaterial({ color: '#fff6ee', transparent: true, opacity: 0.45, depthWrite: false, toneMapped: false })
  return _steamMat
}

let _treatMat: THREE.MeshLambertMaterial | null = null
function treatMaterial() {
  if (!_treatMat) _treatMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: '#3a1a10' })
  return _treatMat
}

/* ================= hahmot + pelisilmukka ================= */

/** Esteet: rakennukset, puunrungot, kivet; ruudukko nopeaan hakuun */
function useBlockers(trees: ReturnType<typeof makeTrees>, rocks: ReturnType<typeof makeRocks>) {
  return useMemo(() => {
    const list: Blocker[] = [
      ...PLACES.filter((p) => p.r > 0).map((p) => ({ x: p.x, z: p.z, r: p.r })),
      { x: KIOSK.x, z: KIOSK.z - 0.3, r: KIOSK.r },
      { x: -3.4, z: 8.6, r: 0.2 },
      { x: 1.4, z: 12.6, r: 0.25 },
      ...trees.map((t) => ({ x: t.x, z: t.z, r: 0.32 * t.s })),
      ...rocks.filter((r) => height(r.x, r.z) > WATER_Y).map((r) => ({ x: r.x, z: r.z, r: 0.55 * r.s })),
    ]
    const cell = 4
    const grid = new Map<string, Blocker[]>()
    for (const b of list) {
      const cx = Math.floor(b.x / cell)
      const cz = Math.floor(b.z / cell)
      for (let i = -1; i <= 1; i++)
        for (let j = -1; j <= 1; j++) {
          const k = `${cx + i},${cz + j}`
          const arr = grid.get(k)
          if (arr) arr.push(b)
          else grid.set(k, [b])
        }
    }
    return (x: number, z: number, r: number) => {
      const arr = grid.get(`${Math.floor(x / cell)},${Math.floor(z / cell)}`)
      if (!arr) return false
      for (const b of arr) if (Math.hypot(x - b.x, z - b.z) < b.r + r) return true
      return false
    }
  }, [trees, rocks])
}

/** Dronen lentokorkeus: puiden yläpuolella, rakennusten yli, herkun kohdalla alas noukkimaan */
function droneAlt(x: number, z: number, got: Set<string>) {
  for (const t of TREATS) if (t.drone && !got.has(t.id) && Math.hypot(t.x - x, t.z - z) < 2.2) return treatY(t) + 0.3
  let y = Math.max(height(x, z), WATER_Y) + 4.6
  for (const p of PLACES) if (Math.hypot(x - p.x, z - p.z) < p.r + 2.4) y = Math.max(y, height(p.x, p.z) + TOPS[p.id] - 0.2)
  return y
}

const lerpAngle = (a: number, b: number, t: number) => {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

function Actors({ state, events, trees, rocks, low }: { state: GameState; events: GameEvents; trees: ReturnType<typeof makeTrees>; rocks: ReturnType<typeof makeRocks>; low: boolean }) {
  const racc = useRef<THREE.Group>(null)
  const duck = useRef<THREE.Group>(null)
  const drone = useRef<THREE.Group>(null)
  const tether = useRef<THREE.Mesh>(null)
  const arrow = useRef<THREE.Group>(null)
  const goalMark = useRef<THREE.Mesh>(null)
  const { gl, camera, size } = useThree()

  // klikkaus / napautus maastoon → kävele (tai lennä dronella) sinne
  useEffect(() => {
    const el = gl.domElement
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3()
    let down: { x: number; y: number; id: number } | null = null
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      down = { x: e.clientX, y: e.clientY, id: e.pointerId }
    }
    const onUp = (e: PointerEvent) => {
      if (!down || down.id !== e.pointerId) return
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
      down = null
      if (moved > 12 || state.busy) return
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      plane.constant = -(state.drone ? Math.max(height(state.dx, state.dz), WATER_Y) : state.py)
      if (!ray.ray.intersectPlane(plane, hit)) return
      state.goal = { x: hit.x, z: hit.z }
      state.goalStuck = 0
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
    }
  }, [gl, camera, state])
  const sun = useRef<THREE.DirectionalLight>(null)
  const blocked = useBlockers(trees, rocks)
  const target = useMemo(() => new THREE.Vector3(state.px, state.py, state.pz), [state])
  const ev = useRef(events)
  useLayoutEffect(() => {
    ev.current = events
  }, [events])

  useEffect(() => {
    if (sun.current) {
      sun.current.target.position.copy(target)
      sun.current.target.updateMatrixWorld()
    }
  }, [target])

  useFrame((_, delta) => {
    const s = state
    const dt = Math.min(0.05, delta)
    const cam = camera as THREE.OrthographicCamera

    // pikamatka
    if (s.teleport) {
      s.px = s.teleport.x
      s.pz = s.teleport.z
      s.py = groundAt(s.px, s.pz) ?? s.py
      s.ux = s.px - 1.2
      s.uz = s.pz + 0.8
      s.dx = s.px + 0.8
      s.dz = s.pz + 0.5
      s.drone = false
      s.teleport = null
    }

    // syöte → maailman suunta (kameran mukaan: ylös = luoteeseen)
    let ix = (s.keys.r ? 1 : 0) - (s.keys.l ? 1 : 0) + s.stick.x
    let iy = (s.keys.f ? 1 : 0) - (s.keys.b ? 1 : 0) + s.stick.y
    const il = Math.hypot(ix, iy)
    if (il > 1) {
      ix /= il
      iy /= il
    }
    if (s.busy) ix = iy = 0
    const fx = -Math.sin(YAW)
    const fz = -Math.cos(YAW)
    const rx = Math.cos(YAW)
    const rz = -Math.sin(YAW)
    let wx = fx * iy + rx * ix
    let wz = fz * iy + rz * ix
    // klikattu kohde: ohjaa sinne, kunnes perillä tai jumissa; näppäimet ohittavat
    let goalRun = false
    if (il > 0.05 || s.busy) s.goal = null
    else if (s.goal) {
      const gx = s.goal.x - (s.drone ? s.dx : s.px)
      const gz = s.goal.z - (s.drone ? s.dz : s.pz)
      const gd = Math.hypot(gx, gz)
      if (gd < 0.3) s.goal = null
      else {
        const k = Math.min(1, gd / 1.1)
        wx = (gx / gd) * k
        wz = (gz / gd) * k
        goalRun = gd > 7
      }
    }

    // ---- pesukarhu ----
    const speed = s.drone ? 0 : s.keys.run || goalRun || Math.hypot(s.stick.x, s.stick.y) > 0.95 ? 7.2 : 4.6
    const ease = 1 - Math.exp(-dt * 10)
    s.vx += (wx * speed - s.vx) * ease
    s.vz += (wz * speed - s.vz) * ease
    const nx = s.px + s.vx * dt
    const nz = s.pz + s.vz * dt
    const ok = (x: number, z: number) => groundAt(x, z) !== null && !blocked(x, z, 0.32)
    if (ok(nx, nz)) {
      s.px = nx
      s.pz = nz
    } else if (ok(nx, s.pz)) {
      s.px = nx
      s.vz *= 0.5
    } else if (ok(s.px, nz)) {
      s.pz = nz
      s.vx *= 0.5
    } else {
      s.vx *= 0.3
      s.vz *= 0.3
    }
    const gy = groundAt(s.px, s.pz) ?? s.py
    s.py += (gy - s.py) * (1 - Math.exp(-dt * 14))
    const sp = Math.hypot(s.vx, s.vz)
    if (s.goal && !s.drone) {
      s.goalStuck = sp < 0.6 ? s.goalStuck + dt : 0
      if (s.goalStuck > 0.5) s.goal = null
    }
    if (sp > 0.3) s.face = lerpAngle(s.face, Math.atan2(s.vx, s.vz), 1 - Math.exp(-dt * 12))
    const rm = s.raccoon
    rm.walk += (Math.min(1, sp / 4.6) - rm.walk) * (1 - Math.exp(-dt * 10))
    rm.phase += dt * sp * 2.6
    rm.tablet += ((s.drone || s.busy ? 1 : 0) - rm.tablet) * (1 - Math.exp(-dt * 8))
    if (racc.current) {
      racc.current.position.set(s.px, s.py, s.pz)
      racc.current.rotation.y = s.face
    }

    // ---- drone ----
    if (s.drone) {
      const dsp = 8
      s.dvx += (wx * dsp - s.dvx) * (1 - Math.exp(-dt * 5))
      s.dvz += (wz * dsp - s.dvz) * (1 - Math.exp(-dt * 5))
      let nxd = s.dx + s.dvx * dt
      let nzd = s.dz + s.dvz * dt
      const dd = Math.hypot(nxd - s.px, nzd - s.pz)
      if (dd > DRONE_RANGE) {
        nxd = s.px + ((nxd - s.px) / dd) * DRONE_RANGE
        nzd = s.pz + ((nzd - s.pz) / dd) * DRONE_RANGE
        if (!s.rangeWarned) {
          s.rangeWarned = true
          ev.current.onRange()
        }
      } else if (dd < DRONE_RANGE - 3) s.rangeWarned = false
      s.dx = nxd
      s.dz = nzd
      s.dy += (droneAlt(s.dx, s.dz, s.got) - s.dy) * (1 - Math.exp(-dt * 3))
    } else {
      // seuraa olan yläpuolella
      const ox = s.px + Math.sin(s.face + 2.4) * 0.9
      const oz = s.pz + Math.cos(s.face + 2.4) * 0.9
      const k = 1 - Math.exp(-dt * 3.2)
      s.dvx = (ox - s.dx) * 3.2
      s.dvz = (oz - s.dz) * 3.2
      s.dx += (ox - s.dx) * k
      s.dz += (oz - s.dz) * k
      s.dy += (s.py + 2.1 - s.dy) * k
    }
    if (drone.current) {
      const bob = s.reduce ? 0 : Math.sin(performance.now() / 420) * 0.08
      drone.current.position.set(s.dx, s.dy + bob, s.dz)
      drone.current.rotation.set(Math.max(-0.4, Math.min(0.4, s.dvz * 0.05)), 0, Math.max(-0.4, Math.min(0.4, -s.dvx * 0.05)))
    }
    if (tether.current) {
      tether.current.visible = s.drone
      tether.current.position.set(s.px, s.py + 0.05, s.pz)
    }

    // ---- kumiankka seuraa (ui vedessä) ----
    {
      const tx = s.px - Math.sin(s.face) * 1.2 + Math.cos(s.face) * 0.75
      const tz = s.pz - Math.cos(s.face) * 1.2 - Math.sin(s.face) * 0.75
      const ddx = tx - s.ux
      const ddz = tz - s.uz
      const d = Math.hypot(ddx, ddz)
      if (d > 14) {
        s.ux = tx
        s.uz = tz
      } else if (d > 0.35) {
        const v = Math.min(d * 3.2, 8) * dt
        s.ux += (ddx / d) * v
        s.uz += (ddz / d) * v
        s.uface = lerpAngle(s.uface, Math.atan2(ddx, ddz), 1 - Math.exp(-dt * 10))
      } else s.uface = lerpAngle(s.uface, Math.atan2(s.px - s.ux, s.pz - s.uz), 1 - Math.exp(-dt * 4))
      const g = groundAt(s.ux, s.uz)
      const uy = g ?? WATER_Y - 0.1
      s.uy += (uy - s.uy) * (1 - Math.exp(-dt * 12))
      const um = s.duck
      um.walk += ((d > 0.35 ? 1 : 0) - um.walk) * (1 - Math.exp(-dt * 8))
      um.phase += dt * 9 * um.walk
      um.talk = Math.max(0, um.talk - dt * 0.35)
      if (duck.current) {
        duck.current.position.set(s.ux, s.uy, s.uz)
        duck.current.rotation.y = s.uface
      }
    }

    // ---- keräily ----
    for (const t of TREATS) {
      if (s.got.has(t.id)) continue
      const ty = treatY(t)
      const hit = s.drone
        ? Math.hypot(t.x - s.dx, t.z - s.dz) < 1.4 && Math.abs(ty - s.dy) < 2.2
        : !t.drone && Math.hypot(t.x - s.px, t.z - s.pz) < 1.05 && Math.abs(ty - (s.py + 0.65)) < 1.1
      if (hit) {
        s.got.add(t.id)
        if (s.hint === t.id) s.hint = null
        ev.current.onCollect(t)
      }
    }

    // ---- lähin paikka ----
    let best: FlightStation | null = null
    if (!s.drone) {
      let bd = NEAR
      for (const p of PLACES) {
        const d = Math.hypot(p.sx - s.px, p.sz - s.pz)
        if (d < bd) {
          bd = d
          best = p.id
        }
      }
    }
    if (best !== s.near) {
      s.near = best
      ev.current.onNear(best)
    }

    // ---- vihjenuoli pesukarhun ympärillä ----
    if (arrow.current) {
      const ht = s.hint ? TREATS.find((t) => t.id === s.hint) : null
      const show = !!ht && !s.busy
      arrow.current.visible = show
      if (ht && show) {
        const ox = s.drone ? s.dx : s.px
        const oz = s.drone ? s.dz : s.pz
        const a = Math.atan2(ht.x - ox, ht.z - oz)
        const far = Math.hypot(ht.x - ox, ht.z - oz)
        const rr = Math.min(1.5, Math.max(0.6, far * 0.3))
        const pulse = s.reduce ? 0 : Math.sin(performance.now() / 180) * 0.12
        arrow.current.position.set(ox + Math.sin(a) * (rr + pulse), (s.drone ? Math.max(height(ox, oz), WATER_Y) : s.py) + 0.12, oz + Math.cos(a) * (rr + pulse))
        arrow.current.rotation.set(0, a, 0)
        arrow.current.scale.setScalar(far < 1.6 ? 0.001 : 1)
      }
    }

    // ---- klikkauskohteen rengas ----
    if (goalMark.current) {
      goalMark.current.visible = !!s.goal
      if (s.goal) {
        const gy = s.drone ? Math.max(height(s.goal.x, s.goal.z), WATER_Y) : (groundAt(s.goal.x, s.goal.z) ?? Math.max(height(s.goal.x, s.goal.z), WATER_Y))
        goalMark.current.position.set(s.goal.x, gy + 0.08, s.goal.z)
        goalMark.current.scale.setScalar(s.reduce ? 1 : 1 + Math.sin(performance.now() / 160) * 0.12)
      }
    }

    // ---- kamera ja aurinko ----
    const fxT = s.drone ? s.dx : s.px
    const fzT = s.drone ? s.dz : s.pz
    const fyT = s.drone ? Math.max(height(s.dx, s.dz), WATER_Y) : s.py
    const k = s.reduce ? 1 : 1 - Math.exp(-dt * 5)
    target.x += (fxT - target.x) * k
    target.y += (fyT - target.y) * k
    target.z += (fzT - target.z) * k
    cam.position.copy(target).add(OFFSET)
    cam.lookAt(target)
    const zoom = Math.min(size.height / VIEW_H, size.width / VIEW_W) * s.zoom
    if (Math.abs(cam.zoom - zoom) > 0.01) {
      cam.zoom = zoom
      cam.updateProjectionMatrix()
    }
    if (sun.current) {
      sun.current.position.copy(target).add(SUN)
      sun.current.target.position.copy(target)
      sun.current.target.updateMatrixWorld()
    }
  })

  return (
    <>
      <group ref={racc}>
        <Raccoon motion={state.raccoon} />
      </group>
      <group ref={duck}>
        <Duck motion={state.duck} />
      </group>
      <group ref={drone}>
        <group scale={1.5}>
          <Drone motion={state.droneMotion} />
        </group>
      </group>
      <group ref={arrow} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
          <coneGeometry args={[0.32, 0.62, 3]} />
          <meshBasicMaterial color="#fff1c2" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={goalMark} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.32, 0.46, 24]} />
        <meshBasicMaterial color="#fff1c2" transparent opacity={0.85} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={tether} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[DRONE_RANGE - 0.15, DRONE_RANGE, 64]} />
        <meshBasicMaterial color="#9ff5ea" transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </mesh>
      <directionalLight
        ref={sun}
        color="#ffd2a6"
        intensity={1.55}
        castShadow={!low}
        shadow-mapSize={[1536, 1536]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={110}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
    </>
  )
}

/** Valopylväs vihjeen kohteen päällä (näkyy kauas) */
function Beacon({ state }: { state: GameState }) {
  const g = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    if (!g.current) return
    const t = state.hint ? TREATS.find((x) => x.id === state.hint) : null
    g.current.visible = !!t
    if (!t) return
    g.current.position.set(t.x, treatY(t), t.z)
    if (mat.current) mat.current.opacity = 0.22 + Math.sin(clock.elapsedTime * 3) * 0.08
  })
  return (
    <group ref={g} visible={false}>
      <mesh position={[0, 7, 0]}>
        <cylinderGeometry args={[0.32, 0.55, 14, 10, 1, true]} />
        <meshBasicMaterial ref={mat} color="#fff1c2" transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Kirjoittaa DOM-elementin paikaksi maailman pisteen projektion (puhekupla ankan yllä) */
export function ScreenAnchor({ state, el }: { state: GameState; el: React.RefObject<HTMLElement | null> }) {
  const { camera, size } = useThree()
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const e = el.current
    if (!e) return
    v.set(state.ux, state.uy + 1.9, state.uz).project(camera)
    const w = e.offsetWidth / 2 + 10
    const x = Math.min(size.width - w, Math.max(w, ((v.x + 1) / 2) * size.width))
    const y = Math.min(size.height - 20, Math.max(e.offsetHeight + 70, ((1 - v.y) / 2) * size.height))
    e.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
  })
  return null
}

/** Koko maailma */
export function World({ state, events, visited, low = false }: { state: GameState; events: GameEvents; visited: Set<FlightStation>; low?: boolean }) {
  const trees = useMemo(() => makeTrees(), [])
  const rocks = useMemo(() => makeRocks(), [])
  const { scene } = useThree()
  useEffect(() => {
    scene.background = new THREE.Color(PAL.sky)
    scene.fog = new THREE.Fog(PAL.fog, 95, 175)
  }, [scene])
  return (
    <>
      <hemisphereLight args={['#ffd9b8', '#5a2340', 1.05]} />
      <Terrain />
      <Water state={state} />
      <Forest trees={trees} />
      <Rocks rocks={rocks} />
      <Places visited={visited} />
      <Treats state={state} />
      <Beacon state={state} />
      <Clouds />
      <Actors state={state} events={events} trees={trees} rocks={rocks} low={low} />
    </>
  )
}
