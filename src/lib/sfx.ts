/**
 * Pelivalikon ääniefektit Web Audio API:lla – ei äänitiedostoja, ei lisenssejä.
 * Tyyli: elokuvallinen pelivalikko – ilmava whoosh välilehdillä, matala
 * sub-jysähdys valinnoissa, metallinen "tink" hoverissa, kevyt digitaalinen
 * glitch ja pitkä riser käynnistyksessä. Kaikki syntetisoidaan; kaiku tehdään
 * generoidulla impulssivasteella.
 *
 * Selaimet sallivat äänen vasta käyttäjän eleen jälkeen → init() kutsutaan
 * aloitusruudun klikkauksesta.
 */
export type Sfx = 'tick' | 'select' | 'back' | 'tab' | 'open' | 'close' | 'boot' | 'error' | 'unlock' | 'glitch' | 'pickup' | 'quack' | 'drone'

const STORAGE_KEY = 'laikku-sound'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let dry: GainNode | null = null
let wet: GainNode | null = null
let ambientNodes: { osc: OscillatorNode[]; gain: GainNode; lfo: OscillatorNode } | null = null
let muted = readMuted()
let lastTick = 0

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'off'
  } catch {
    return false
  }
}

export function isMuted() {
  return muted
}

export function setMuted(v: boolean) {
  muted = v
  try {
    window.localStorage.setItem(STORAGE_KEY, v ? 'off' : 'on')
  } catch {}
  if (master && ctx) master.gain.setTargetAtTime(v ? 0 : 0.9, ctx.currentTime, 0.02)
}

/** Generoitu impulssivaste: eksponentiaalisesti vaimeneva kohina → "iso sali". */
function makeImpulse(c: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

export function init() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return
  }
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.9
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -20
    comp.ratio.value = 5
    comp.attack.value = 0.004
    comp.release.value = 0.18
    master.connect(comp).connect(ctx.destination)

    dry = ctx.createGain()
    dry.gain.value = 1
    dry.connect(master)

    const reverb = ctx.createConvolver()
    reverb.buffer = makeImpulse(ctx, 2.2, 3.2)
    wet = ctx.createGain()
    wet.gain.value = 0.35
    wet.connect(reverb).connect(master)
  } catch {
    ctx = null
  }
}

function out(node: AudioNode, send = 0.5) {
  if (!dry || !wet) return
  node.connect(dry)
  if (send > 0) {
    const g = ctx!.createGain()
    g.gain.value = send
    node.connect(g).connect(wet)
  }
}

function env(gain: GainNode, t: number, peak: number, attack: number, decay: number) {
  gain.gain.cancelScheduledValues(t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.linearRampToValueAtTime(peak, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

function tone(
  type: OscillatorType,
  from: number,
  to: number,
  t: number,
  dur: number,
  peak: number,
  attack = 0.004,
  send = 0.4,
) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur)
  env(g, t, peak, attack, dur)
  osc.connect(g)
  out(g, send)
  osc.start(t)
  osc.stop(t + attack + dur + 0.05)
}

/** Kaistanpäästösuodatettu kohina, jonka keskitaajuus liukuu: whoosh. */
function noise(t: number, dur: number, peak: number, fromHz: number, toHz: number, q = 1.2, send = 0.6, attack = 0.01) {
  if (!ctx) return
  const len = Math.max(1, Math.floor(ctx.sampleRate * (dur + 0.1)))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(fromHz, t)
  filter.frequency.exponentialRampToValueAtTime(toHz, t + dur)
  const g = ctx.createGain()
  env(g, t, peak, attack, dur)
  src.connect(filter).connect(g)
  out(g, send)
  src.start(t)
  src.stop(t + dur + 0.1)
}

/** Metallinen "tink": epäharmoniset osaäänet, lyhyt, kaikuun. */
function tink(t: number, base: number, peak: number, dur = 0.12) {
  ;[1, 1.57, 2.63].forEach((ratio, i) => tone('sine', base * ratio, base * ratio, t, dur * (1 - i * 0.2), peak / (i + 1), 0.002, 0.7))
}

/** Matala sub-jysähdys. */
function boom(t: number, peak: number, dur = 0.45) {
  tone('sine', 110, 38, t, dur, peak, 0.006, 0.3)
  noise(t, 0.08, peak * 0.35, 120, 60, 0.8, 0.2)
}

/** Digitaalinen glitch-stutter: muutama satunnainen kantti-blippi. */
function glitch(t: number, n = 4, peak = 0.05) {
  for (let i = 0; i < n; i++) {
    const at = t + i * 0.028 + Math.random() * 0.01
    const f = 600 + Math.random() * 2400
    tone('square', f, f * (0.6 + Math.random() * 0.8), at, 0.02 + Math.random() * 0.02, peak, 0.001, 0.1)
  }
}

export function play(name: Sfx) {
  if (!ctx || !dry || muted) return
  if (ctx.state === 'suspended') void ctx.resume()
  const t = ctx.currentTime
  switch (name) {
    case 'tick': {
      if (t - lastTick < 0.045) return
      lastTick = t
      tink(t, 2600, 0.05, 0.09)
      noise(t, 0.04, 0.015, 5000, 2000, 2, 0.3)
      break
    }
    case 'select':
      boom(t, 0.26, 0.4)
      tink(t + 0.01, 1900, 0.09, 0.22)
      noise(t, 0.28, 0.07, 400, 5000, 1, 0.7)
      break
    case 'back':
      noise(t, 0.22, 0.07, 3500, 300, 1, 0.6)
      boom(t + 0.02, 0.16, 0.3)
      break
    case 'tab':
      // ilmava whoosh + hento glitch – "näyttö vaihtuu"
      noise(t, 0.34, 0.11, 250, 4200, 0.9, 0.8)
      noise(t + 0.12, 0.26, 0.06, 4200, 700, 1.2, 0.8, 0.02)
      glitch(t + 0.05, 3, 0.035)
      tink(t + 0.2, 2200, 0.04, 0.18)
      break
    case 'open':
      boom(t, 0.3, 0.5)
      noise(t, 0.4, 0.08, 300, 6000, 0.8, 0.9)
      tink(t + 0.12, 1700, 0.08, 0.3)
      glitch(t + 0.02, 3, 0.03)
      break
    case 'close':
      noise(t, 0.3, 0.07, 5000, 250, 1, 0.7)
      boom(t + 0.05, 0.18, 0.35)
      break
    case 'error':
      tone('square', 180, 150, t, 0.1, 0.05, 0.002, 0.2)
      tone('square', 180, 150, t + 0.13, 0.1, 0.05, 0.002, 0.2)
      glitch(t, 2, 0.04)
      break
    case 'glitch':
      glitch(t, 5, 0.04)
      noise(t, 0.08, 0.03, 2000, 6000, 1.5, 0.3)
      break
    case 'unlock':
      ;[880, 1175, 1760].forEach((f, i) => tink(t + i * 0.09, f, 0.09, 0.4))
      noise(t + 0.2, 0.6, 0.04, 2000, 9000, 1, 0.9)
      boom(t + 0.25, 0.14, 0.5)
      break
    case 'pickup':
      // Kahvijahdin herkku: pomppiva nouseva arpeggio
      ;[784, 988, 1319, 1568].forEach((f, i) => tone('triangle', f, f * 1.01, t + i * 0.055, 0.12, 0.07, 0.003, 0.5))
      tink(t + 0.22, 2093, 0.05, 0.25)
      break
    case 'quack':
      // kumiankan vinkaisu: kaksi lyhyttä, alaspäin liukuvaa piipitystä
      tone('square', 1150, 820, t, 0.07, 0.035, 0.004, 0.25)
      tone('sine', 2300, 1640, t, 0.07, 0.03, 0.004, 0.25)
      tone('square', 1050, 700, t + 0.1, 0.1, 0.035, 0.004, 0.3)
      tone('sine', 2100, 1400, t + 0.1, 0.1, 0.03, 0.004, 0.3)
      break
    case 'drone':
      // roottorit kiihtyvät
      tone('sawtooth', 70, 190, t, 0.45, 0.03, 0.05, 0.2)
      noise(t, 0.5, 0.05, 300, 2400, 2, 0.4, 0.08)
      break
    case 'boot': {
      // pitkä riser: kohina nousee, matala drone paisuu, lopussa jysähdys ja kirkas tink
      noise(t, 1.5, 0.12, 120, 6000, 0.7, 0.9, 0.3)
      tone('sine', 40, 55, t, 1.5, 0.22, 0.4, 0.2)
      tone('triangle', 110, 220, t + 0.3, 1.1, 0.05, 0.3, 0.6)
      glitch(t + 0.9, 6, 0.03)
      boom(t + 1.45, 0.34, 0.7)
      tink(t + 1.5, 1568, 0.1, 0.6)
      tink(t + 1.62, 2093, 0.08, 0.7)
      noise(t + 1.5, 0.9, 0.05, 3000, 9000, 1, 1)
      break
    }
  }
}

/** Hyvin hiljainen taustahumina (oletuksena pois päältä). */
export function setAmbient(on: boolean) {
  if (!ctx || !master) return
  if (on && !ambientNodes) {
    const gain = ctx.createGain()
    gain.gain.value = 0
    const oscs = [55, 110, 164.8].map((f, i) => {
      const o = ctx!.createOscillator()
      o.type = i === 0 ? 'sine' : 'triangle'
      o.frequency.value = f
      const g = ctx!.createGain()
      g.gain.value = i === 0 ? 0.5 : 0.08
      o.connect(g).connect(gain)
      o.start()
      return o
    })
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.08
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.03
    lfo.connect(lfoGain).connect(gain.gain)
    lfo.start()
    gain.connect(master)
    if (wet) {
      const send = ctx.createGain()
      send.gain.value = 0.4
      gain.connect(send).connect(wet)
    }
    gain.gain.setTargetAtTime(0.08, ctx.currentTime, 1.5)
    ambientNodes = { osc: oscs, gain, lfo }
  } else if (!on && ambientNodes) {
    const nodes = ambientNodes
    ambientNodes = null
    nodes.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.6)
    window.setTimeout(() => {
      nodes.osc.forEach((o) => o.stop())
      nodes.lfo.stop()
      nodes.gain.disconnect()
    }, 2500)
  }
}

export function ambientOn() {
  return !!ambientNodes
}
