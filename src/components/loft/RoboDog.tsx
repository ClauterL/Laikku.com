import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import type { EcctrlHandle } from 'ecctrl'

import nav from './nav.json'
import { astar, cellXZ, decodeGrid, nearestFree, smooth, toCell } from './dogNav'
import { MODEL_BASE } from './zones'

/**
 * Robottikoira (Unitree Go1 -malli, Fab): vaeltaa satunnaisesti kerroksen kuljettavilla alueilla (reitinhaku: dogNav.ts).
 * Mallin animaatiot: 1LYP = ravi eteenpäin (paikallaan, 1,19 m/s nopeudella 1), 1RXP/1RXN = käännös paikallaan,
 * 1Idle = seisoskelu, Playing = leikkisä tervehdys. Malli katsoo +x-suuntaan.
 */

const FILE = `${MODEL_BASE}robodog.glb`
/** Ravin nopeus animaation nopeudella 1 (jalan liukuma tukivaiheessa) */
const TROT = 1.19
const WALK_TS = 0.55
const SPEED = TROT * WALK_TS
/** Käännös paikallaan: ~75°/s animaation nopeudella 1 */
const TURN_TS = 0.9
const TURN_RATE = 1.3 * TURN_TS
const PLAYER_STOP = 0.95
const GREET_DIST = 1.5

type Mode = 'idle' | 'turn' | 'walk' | 'wait' | 'greet'

/** Kulmaero välille −π…π */
const angDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b))
/** Mallin +x kohti suuntaa (dx, dz): rotation.y = atan2(−dz, dx) */
const yawTo = (dx: number, dz: number) => Math.atan2(-dz, dx)

export function RoboDog({ ecctrl, shadows }: { ecctrl: RefObject<EcctrlHandle | null>; shadows: boolean }) {
  const { scene, animations } = useGLTF(FILE, false, true)
  const grid = useMemo(() => decodeGrid(nav), [])
  const body = useRef<RapierRigidBody>(null)
  const group = useRef<THREE.Group>(null)

  const model = useMemo(() => {
    const obj = scene.clone(true)
    obj.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = shadows
        m.receiveShadow = true
      }
    })
    return obj
  }, [scene, shadows])

  const anim = useMemo(() => {
    const mixer = new THREE.AnimationMixer(model)
    const get = (name: string) => {
      const clip = animations.find((c) => c.name === name)
      return clip ? mixer.clipAction(clip) : null
    }
    const acts = { idle: get('1Idle'), walk: get('1LYP'), right: get('1RXP'), left: get('1RXN'), greet: get('Playing') }
    if (acts.walk) acts.walk.timeScale = WALK_TS
    if (acts.right) acts.right.timeScale = TURN_TS
    if (acts.left) acts.left.timeScale = TURN_TS
    if (acts.greet) {
      acts.greet.setLoop(THREE.LoopOnce, 1)
      acts.greet.clampWhenFinished = true
    }
    return { mixer, acts }
  }, [model, animations])
  useEffect(() => () => void anim.mixer.stopAllAction(), [anim])

  // Tila: aloitus aulasta (satunnainen väljä kohta hissin ja työ-siiven välillä)
  const st = useRef({
    mode: 'idle' as Mode,
    x: 0.6,
    z: 6.3,
    yaw: Math.PI,
    path: [] as [number, number][],
    timer: 2,
    waits: 0,
    greetCooldown: 0,
    clip: '' as keyof typeof anim.acts | '',
  })
  useEffect(() => {
    const lobby = grid.cand.filter((p) => {
      const [x, z] = cellXZ(grid, p)
      return z > 5.6 && z < 7.0 && x > -1.5 && x < 3.5
    })
    if (lobby.length) {
      const [x, z] = cellXZ(grid, lobby[Math.floor(Math.random() * lobby.length)])
      st.current.x = x
      st.current.z = z
    }
  }, [grid])

  const play = (name: keyof typeof anim.acts) => {
    const s = st.current
    if (s.clip === name) return
    const next = anim.acts[name]
    if (!next) return
    const prev = s.clip ? anim.acts[s.clip] : null
    next.reset().play()
    if (prev && prev !== next) next.crossFadeFrom(prev, 0.25, false)
    s.clip = name
  }

  const newTarget = () => {
    const s = st.current
    const start = nearestFree(grid, toCell(grid, s.x, s.z))
    if (start < 0) return false
    for (let tries = 0; tries < 12; tries++) {
      const t = grid.cand[Math.floor(Math.random() * grid.cand.length)]
      const [tx, tz] = cellXZ(grid, t)
      const d = Math.hypot(tx - s.x, tz - s.z)
      if (d < 2 || d > 14) continue
      const path = astar(grid, start, t)
      if (path && path.length > 1) {
        s.path = smooth(grid, path)
        return true
      }
    }
    return false
  }

  const tmpQ = useMemo(() => new THREE.Quaternion(), [])
  const UP = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const s = st.current
    const player = ecctrl.current?.currPos
    const pdx = player ? player.x - s.x : 99
    const pdz = player ? player.z - s.z : 99
    const pd = Math.hypot(pdx, pdz)
    s.greetCooldown = Math.max(0, s.greetCooldown - dt)
    s.timer -= dt

    switch (s.mode) {
      case 'idle': {
        play('idle')
        if (pd < GREET_DIST && s.greetCooldown === 0) {
          s.mode = 'greet'
          s.timer = 3.2
          s.greetCooldown = 14
          break
        }
        if (s.timer <= 0) {
          if (newTarget()) s.mode = 'turn'
          else s.timer = 1
        }
        break
      }
      case 'greet': {
        // käänny pelaajaa kohti ja tervehdi
        const want = yawTo(pdx, pdz)
        const d = angDiff(want, s.yaw)
        if (Math.abs(d) > 0.25) {
          play(d > 0 ? 'left' : 'right')
          s.yaw += Math.sign(d) * Math.min(Math.abs(d), TURN_RATE * dt)
          s.timer = Math.max(s.timer, 2.8)
        } else {
          play('greet')
        }
        if (s.timer <= 0) {
          s.mode = 'idle'
          s.timer = 1.5 + Math.random() * 2
        }
        break
      }
      case 'turn': {
        const wp = s.path[0]
        if (!wp) {
          s.mode = 'idle'
          s.timer = 2 + Math.random() * 4
          break
        }
        const want = yawTo(wp[0] - s.x, wp[1] - s.z)
        const d = angDiff(want, s.yaw)
        if (Math.abs(d) < 0.35) {
          s.mode = 'walk'
          break
        }
        play(d > 0 ? 'left' : 'right')
        s.yaw += Math.sign(d) * Math.min(Math.abs(d), TURN_RATE * dt)
        break
      }
      case 'walk': {
        const wp = s.path[0]
        if (!wp) {
          s.mode = 'idle'
          s.timer = 2 + Math.random() * 5
          break
        }
        // pelaaja edessä: pysähdy odottamaan
        if (player && pd < PLAYER_STOP) {
          const fx = Math.cos(s.yaw)
          const fz = -Math.sin(s.yaw)
          if ((pdx * fx + pdz * fz) / pd > 0.2) {
            s.mode = 'wait'
            s.timer = 1.6
            break
          }
        }
        const dx = wp[0] - s.x
        const dz = wp[1] - s.z
        const dist = Math.hypot(dx, dz)
        if (dist < 0.12) {
          s.path.shift()
          if (s.path.length && Math.abs(angDiff(yawTo(s.path[0][0] - s.x, s.path[0][1] - s.z), s.yaw)) > 1.1) s.mode = 'turn'
          break
        }
        const want = yawTo(dx, dz)
        const d = angDiff(want, s.yaw)
        if (Math.abs(d) > 1.2) {
          s.mode = 'turn'
          break
        }
        s.yaw += Math.sign(d) * Math.min(Math.abs(d), 2.2 * dt)
        // hidasta jyrkissä mutkissa
        const v = SPEED * (1 - Math.min(0.6, Math.abs(d) * 0.6))
        const step = Math.min(dist, v * dt)
        s.x += (dx / dist) * step
        s.z += (dz / dist) * step
        play('walk')
        if (anim.acts.walk) anim.acts.walk.timeScale = WALK_TS * (v / SPEED)
        break
      }
      case 'wait': {
        play('idle')
        const clear = !player || pd > PLAYER_STOP + 0.2
        if (clear) {
          s.mode = 'walk'
          s.waits = 0
        } else if (s.timer <= 0) {
          // pelaaja ei väisty: uusi kohde
          s.waits++
          s.mode = 'idle'
          s.timer = s.waits > 1 ? 0.5 : 1.5
          if (s.waits > 1) s.path = []
        }
        break
      }
    }

    anim.mixer.update(dt)
    const g = group.current
    if (g) {
      g.position.set(s.x, 0, s.z)
      g.rotation.y = s.yaw
    }
    const b = body.current
    if (b) {
      b.setNextKinematicTranslation({ x: s.x, y: 0.2, z: s.z })
      tmpQ.setFromAxisAngle(UP, s.yaw)
      b.setNextKinematicRotation(tmpQ)
    }
  })

  return (
    <>
      <group ref={group}>
        <primitive object={model} />
      </group>
      {/* pelaaja ei kävele koiran läpi */}
      <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[st.current.x, 0.2, st.current.z]}>
        <CuboidCollider args={[0.32, 0.2, 0.15]} position={[-0.03, 0, 0]} />
      </RigidBody>
    </>
  )
}

useGLTF.preload(FILE, false, true)
