// Loftin kulkutarkistus: pääseekö hahmo aloituspaikasta jokaiseen huoneeseen ja vyöhykkeeseen?
// node walk-check.mjs [kartta.png] [reitit.json]
// COLLIDERS=polku.json korvaa src/components/loft/colliders.json (uudet esineet ennen paistoa)
// NAV=nav.json kirjoittaa robottikoiran kulkuruudukon (10 cm, esteet laajennettu koiran säteellä)
// Lukee src/components/loft/colliders.json + zones.ts:n PROPS/ZONES/SPAWN ja esineiden GLB-rajat,
// rasteroi lattian 5 cm ruutuihin, laajentaa esteet hahmon kapselin säteellä ja tulvatäyttää aloituspaikasta.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LOFT = path.join(ROOT, 'src/components/loft');
const MODELS = path.join(ROOT, 'public/models/loft');
const OUT_PNG = process.argv[2];

// --- zones.ts: PROPS, ZONES, SPAWN (vain literaaleja ja HALF_PI/Math.PI) ---
const src = fs.readFileSync(path.join(LOFT, 'zones.ts'), 'utf8');
const grab = (name) => {
  const i = src.indexOf(`export const ${name}`);
  const s = src.indexOf('=', i) + 1;
  // taulukko tai tuple: etsi vastaava sulkeva hakasulku
  let k = src.indexOf('[', s), d = 0;
  for (let j = k; j < src.length; j++) {
    if (src[j] === '[') d++;
    if (src[j] === ']' && --d === 0) return src.slice(k, j + 1);
  }
  throw new Error(name);
};
const HALF_PI = Math.PI / 2;
const evalTs = (t) => new Function('HALF_PI', `return ${t.replace(/\/\/.*$/gm, '')}`)(HALF_PI);
const PROPS = evalTs(grab('PROPS'));
const ZONES = evalTs(grab('ZONES'));
const SPAWN = evalTs(grab('SPAWN'));
const RADIUS = +(/INTERACT_RADIUS = ([\d.]+)/.exec(src)[1]);

// --- staattiset törmäykset ---
const col = JSON.parse(fs.readFileSync(process.env.COLLIDERS || path.join(LOFT, 'colliders.json'), 'utf8'));
const boxes = col.solid.map(([x, y, z, hx, hy, hz]) => ({ x0: x - hx, x1: x + hx, y0: y - hy, y1: y + hy, z0: z - hz, z1: z + hz, src: 'static' }));

// --- esineiden törmäykset samalla logiikalla kuin LoftScene.tsx:n Placed ---
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
await MeshoptDecoder.ready;
const boundsCache = new Map();
async function propBounds(file) {
  if (!boundsCache.has(file)) {
    const doc = await io.read(path.join(MODELS, file));
    const scene = doc.getRoot().listScenes()[0];
    const b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    for (const n of scene.listChildren()) {
      const nb = getBounds(n);
      for (let i = 0; i < 3; i++) { b.min[i] = Math.min(b.min[i], nb.min[i]); b.max[i] = Math.max(b.max[i], nb.max[i]); }
    }
    boundsCache.set(file, b);
  }
  return boundsCache.get(file);
}
for (const def of PROPS) {
  if (!def.collider) continue;
  const b = await propBounds(def.file);
  const size = [0, 1, 2].map((i) => b.max[i] - b.min[i]);
  const c = [0, 1, 2].map((i) => (b.min[i] + b.max[i]) / 2);
  const k = def.fit.h ? def.fit.h / size[1] : (def.fit.w ?? size[0]) / size[0];
  const anchor = def.anchor ?? 'bottom';
  const a = [c[0], anchor === 'top' ? b.max[1] : anchor === 'wall' ? c[1] : b.min[1], anchor === 'back' ? b.min[2] : anchor === 'front' ? b.max[2] : anchor === 'wall' ? b.min[2] : c[2]];
  const kz = k * (def.depthScale ?? 1);
  const sc = [k, k, kz];
  let half = size.map((s, i) => (s * sc[i]) / 2);
  let off = c.map((v, i) => (v - a[i]) * sc[i]);
  if (def.collider === 'thin') { half = [half[0], half[1], 0.07]; off = [off[0], off[1], (b.min[2] - a[2]) * kz + 0.07]; }
  const r = def.rotY ?? 0, cs = Math.cos(r), sn = Math.sin(r);
  // y-kierto: (x, z) -> (x cos + z sin, -x sin + z cos)
  const ox = off[0] * cs + off[2] * sn, oz = -off[0] * sn + off[2] * cs;
  const hx = Math.abs(half[0] * cs) + Math.abs(half[2] * sn), hz = Math.abs(half[0] * sn) + Math.abs(half[2] * cs);
  const px = def.at[0] + ox, py = def.at[1] + off[1], pz = def.at[2] + oz;
  boxes.push({ x0: px - hx, x1: px + hx, y0: py - half[1], y1: py + half[1], z0: pz - hz, z1: pz + hz, src: def.id });
}

// --- ruudukko ---
const CAPSULE_R = 0.26, MARGIN = 0.0, STEP_H = 0.12, HEAD = 1.75;
const X0 = -4.6, X1 = 4.6, Z0 = -5.4, Z1 = 18.0, C = 0.05;
const NX = Math.round((X1 - X0) / C), NZ = Math.round((Z1 - Z0) / C);
const blocked = new Uint8Array(NX * NZ);
const R = CAPSULE_R + MARGIN;
for (const b of boxes) {
  if (b.y1 < STEP_H || b.y0 > HEAD) continue; // matot ja kattorakenteet eivät estä
  const i0 = Math.max(0, Math.floor((b.x0 - R - X0) / C)), i1 = Math.min(NX - 1, Math.ceil((b.x1 + R - X0) / C));
  const j0 = Math.max(0, Math.floor((b.z0 - R - Z0) / C)), j1 = Math.min(NZ - 1, Math.ceil((b.z1 + R - Z0) / C));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const x = X0 + (i + 0.5) * C, z = Z0 + (j + 0.5) * C;
    // pyöristetty laajennus (kapseli): etäisyys laatikkoon <= R
    const dx = Math.max(b.x0 - x, 0, x - b.x1), dz = Math.max(b.z0 - z, 0, z - b.z1);
    if (dx * dx + dz * dz <= R * R) blocked[j * NX + i] = 1;
  }
}
const cell = (x, z) => [Math.floor((x - X0) / C), Math.floor((z - Z0) / C)];
const reach = new Uint8Array(NX * NZ);
const [si, sj] = cell(SPAWN[0], SPAWN[2]);
if (blocked[sj * NX + si]) console.log('VAROITUS: aloituspaikka on esteen sisällä');
const q = [sj * NX + si]; reach[q[0]] = 1;
while (q.length) {
  const p = q.pop(); const i = p % NX, j = (p - i) / NX;
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= NX || b >= NZ) continue;
    const n = b * NX + a; if (reach[n] || blocked[n]) continue;
    reach[n] = 1; q.push(n);
  }
}

// --- robottikoiran kulkuruudukko: NAV=nav.json ---
if (process.env.NAV) {
  const RD = 0.3, CN = 0.1, K = Math.round(CN / C);
  const dogBlock = new Uint8Array(NX * NZ);
  for (const b of boxes) {
    if (b.y1 < 0.06 || b.y0 > 0.5) continue; // koira on matala: pöytälevyt ja hyllyt sen yläpuolella eivät estä
    const i0 = Math.max(0, Math.floor((b.x0 - RD - X0) / C)), i1 = Math.min(NX - 1, Math.ceil((b.x1 + RD - X0) / C));
    const j0 = Math.max(0, Math.floor((b.z0 - RD - Z0) / C)), j1 = Math.min(NZ - 1, Math.ceil((b.z1 + RD - Z0) / C));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = X0 + (i + 0.5) * C, z = Z0 + (j + 0.5) * C;
      const dx = Math.max(b.x0 - x, 0, x - b.x1), dz = Math.max(b.z0 - z, 0, z - b.z1);
      if (dx * dx + dz * dz <= RD * RD) dogBlock[j * NX + i] = 1;
    }
  }
  const nx = Math.floor(NX / K), nz = Math.floor(NZ / K);
  const free = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    let ok = 1;
    for (let b = 0; b < K && ok; b++) for (let a = 0; a < K; a++) if (dogBlock[(j * K + b) * NX + i * K + a] || blocked[(j * K + b) * NX + i * K + a]) { ok = 0; break; }
    free[j * nx + i] = ok;
  }
  // vain aloituspaikasta saavutettava osa (koira ei jää jumiin saarekkeisiin)
  const reachN = new Uint8Array(nx * nz);
  const s = Math.floor((SPAWN[2] - Z0) / CN) * nx + Math.floor((SPAWN[0] - X0) / CN);
  const qn = [s]; reachN[s] = 1;
  while (qn.length) {
    const p = qn.pop(); const i = p % nx, j = (p - i) / nx;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
      const n = b * nx + a; if (reachN[n] || !free[n]) continue;
      reachN[n] = 1; qn.push(n);
    }
  }
  const bytes = new Uint8Array(Math.ceil((nx * nz) / 8));
  let cnt = 0;
  for (let p = 0; p < nx * nz; p++) if (reachN[p]) { bytes[p >> 3] |= 1 << (p & 7); cnt++; }
  fs.writeFileSync(process.env.NAV, JSON.stringify({ x0: X0, z0: Z0, cell: CN, nx, nz, free: Buffer.from(bytes).toString('base64') }));
  console.log('koiran ruudukko', process.env.NAV, nx, 'x', nz, 'kuljettavaa', (cnt * CN * CN).toFixed(1), 'm²');
}

// --- huoneet (kerros 5) ---
const ROOMS = [
  ['Olohuone', -4.14, -0.67, -5.0, 0.4], ['Keittiö', -4.14, -1.14, 0.4, 4.31], ['Eteinen ja kirjasto', -1.0, 1.5, 1.31, 4.91],
  ['Käytävä', -0.42, 1.5, -0.2, 1.31], ['Makuuhuone', -0.42, 2.64, -4.9, -0.23],
  ['Parveke', 2.81, 4.34, -5.09, -3.94], ['Vaatehuone', 1.64, 4.14, -0.11, 1.31], ['Kylpyhuone', 1.65, 4.13, 1.46, 4.61],
  ['Hissiaula', -4.15, 4.15, 5.16, 7.44], ['Arcade-galleria', -4.15, 0.54, 7.56, 11.24], ['Kahvio', 0.66, 4.15, 7.56, 9.34],
  ['WC ja tekniikka', 0.66, 4.15, 9.46, 11.24], ['War room', -4.15, 4.15, 11.36, 14.54], ['Paja', -4.15, 4.15, 14.66, 17.6],
];
let fail = 0;
console.log('huone'.padEnd(22), 'vapaa m²', 'saavutettu m²', '%');
for (const [name, x0, x1, z0, z1] of ROOMS) {
  let free = 0, got = 0;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const x = X0 + (i + 0.5) * C, z = Z0 + (j + 0.5) * C;
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    if (!blocked[j * NX + i]) { free++; if (reach[j * NX + i]) got++; }
  }
  const fm = free * C * C, gm = got * C * C, pct = free ? (100 * got) / free : 0;
  // pienet tilat (vaatehuone, parveke) riittää astua sisään; isommista valtaosan pitää olla kuljettavissa
  const ok = gm >= 0.15 && pct >= 60;
  if (!ok) fail++;
  console.log((ok ? '  ' : '✗ ') + name.padEnd(20), fm.toFixed(1).padStart(8), gm.toFixed(1).padStart(13), pct.toFixed(0).padStart(4));
}
console.log('\nvyöhykkeet (hotspot saavutettavissa hahmon säteellä', RADIUS, 'm):');
for (const z of ZONES) {
  // lähin saavutettava ruutu hotspotista
  let best = Infinity;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    if (!reach[j * NX + i]) continue;
    const x = X0 + (i + 0.5) * C, zz = Z0 + (j + 0.5) * C;
    best = Math.min(best, Math.hypot(x - z.hotspot[0], zz - z.hotspot[1]));
  }
  const ok = best <= RADIUS * 0.6;
  if (!ok) fail++;
  console.log((ok ? '  ' : '✗ ') + z.id.padEnd(10), 'lähin kuljettava kohta', best.toFixed(2), 'm');
}

// --- reitit selaintestiä varten: node walk-check.mjs kartta.png reitit.json ---
const OUT_PATHS = process.argv[3];
if (OUT_PATHS) {
  // väljempi välys reitin suunnitteluun (hahmo ei hankaa seiniä), vara: tarkka kapselisäde
  const R2 = CAPSULE_R + 0.1;
  const wide = new Uint8Array(NX * NZ);
  for (const b of boxes) {
    if (b.y1 < STEP_H || b.y0 > HEAD) continue;
    const i0 = Math.max(0, Math.floor((b.x0 - R2 - X0) / C)), i1 = Math.min(NX - 1, Math.ceil((b.x1 + R2 - X0) / C));
    const j0 = Math.max(0, Math.floor((b.z0 - R2 - Z0) / C)), j1 = Math.min(NZ - 1, Math.ceil((b.z1 + R2 - Z0) / C));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = X0 + (i + 0.5) * C, z = Z0 + (j + 0.5) * C;
      const dx = Math.max(b.x0 - x, 0, x - b.x1), dz = Math.max(b.z0 - z, 0, z - b.z1);
      if (dx * dx + dz * dz <= R2 * R2) wide[j * NX + i] = 1;
    }
  }
  const cost = (p) => (wide[p] ? 6 : 1); // kapeikkoihin vain tarvittaessa
  // Dijkstra 8-naapurustolla aloituspaikasta
  const dist = new Float64Array(NX * NZ).fill(Infinity), par = new Int32Array(NX * NZ).fill(-1);
  const s0 = sj * NX + si; dist[s0] = 0;
  const heap = [[0, s0]];
  const push = (e) => { heap.push(e); let k = heap.length - 1; while (k > 0) { const pk = (k - 1) >> 1; if (heap[pk][0] <= heap[k][0]) break; [heap[pk], heap[k]] = [heap[k], heap[pk]]; k = pk; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  while (heap.length) {
    const [d, p] = pop(); if (d > dist[p]) continue;
    const i = p % NX, j = (p - i) / NX;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= NX || b >= NZ) continue;
      const n = b * NX + a; if (blocked[n]) continue;
      if (di && dj && (blocked[j * NX + a] || blocked[b * NX + i])) continue;
      const nd = d + (di && dj ? Math.SQRT2 : 1) * cost(n);
      if (nd < dist[n]) { dist[n] = nd; par[n] = p; push([nd, n]); }
    }
  }
  const los = (p, q) => { // näköyhteys väljällä ruudukolla
    let i0 = p % NX, j0 = (p - i0) / NX; const i1 = q % NX, j1 = (q - i1) / NX;
    const n = Math.max(Math.abs(i1 - i0), Math.abs(j1 - j0));
    for (let k = 0; k <= n; k++) { const i = Math.round(i0 + ((i1 - i0) * k) / n), j = Math.round(j0 + ((j1 - j0) * k) / n); if (wide[j * NX + i]) return false; }
    return true;
  };
  const target = (x, z) => { let best = -1, bd = Infinity; for (let p = 0; p < NX * NZ; p++) { if (!reach[p]) continue; const i = p % NX, j = (p - i) / NX; const d = Math.hypot(X0 + (i + 0.5) * C - x, Z0 + (j + 0.5) * C - z) + (wide[p] ? 0.25 : 0); if (d < bd) { bd = d; best = p; } } return best; };
  const routes = [];
  const goals = [...ZONES.map((z) => [z.id, z.hotspot[0], z.hotspot[1]]), ...ROOMS.map(([n, x0, x1, z0, z1]) => [n, (x0 + x1) / 2, (z0 + z1) / 2])];
  for (const [name, gx, gz] of goals) {
    const g = target(gx, gz); if (g < 0) continue;
    const path = []; for (let p = g; p !== -1; p = par[p]) path.push(p); path.reverse();
    const pts = [path[0]]; let k = 0;
    while (k < path.length - 1) { let m = path.length - 1; while (m > k + 1 && !los(path[k], path[m])) m--; pts.push(path[m]); k = m; }
    routes.push({ name, goal: [gx, gz], pts: pts.map((p) => { const i = p % NX, j = (p - i) / NX; return [+(X0 + (i + 0.5) * C).toFixed(2), +(Z0 + (j + 0.5) * C).toFixed(2)]; }) });
  }
  fs.writeFileSync(OUT_PATHS, JSON.stringify({ spawn: SPAWN, routes }, null, 1));
  console.log('reitit', OUT_PATHS, routes.length);

  // --- fysiikkatesti: pelin oma Rapier, samat laatikot, kapseli (säde 0,26, puolikorkeus 0,45) kävelee reitit ---
  const RAPIER = (await import(path.join(ROOT, 'node_modules/@dimforge/rapier3d-compat/rapier.mjs'))).default;
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(10, 0.5, 14).setTranslation(0, -0.5, 6.3), fixed);
  for (const b of boxes) {
    world.createCollider(RAPIER.ColliderDesc.cuboid((b.x1 - b.x0) / 2, (b.y1 - b.y0) / 2, (b.z1 - b.z0) / 2)
      .setTranslation((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2), fixed);
  }
  const HALF = 0.45, Y = 0.25 + HALF + CAPSULE_R; // kelluntakorkeus 0,25 kuten ecctrl
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(SPAWN[0], Y, SPAWN[2]));
  const capsule = world.createCollider(RAPIER.ColliderDesc.capsule(HALF, CAPSULE_R), body);
  const kcc = world.createCharacterController(0.02);
  kcc.enableAutostep(0.2, 0.15, false);
  kcc.setSlideEnabled(true);
  world.step();
  console.log('\nfysiikkatesti (Rapier, kävely 2 m/s reittiä pitkin, ei teleporttausta):');
  let pfail = 0;
  for (const r of routes) {
    body.setTranslation({ x: SPAWN[0], y: Y, z: SPAWN[2] }, true); body.setNextKinematicTranslation({ x: SPAWN[0], y: Y, z: SPAWN[2] });
    world.step();
    let ok = true, why = '';
    const dt = 1 / 60, speed = 2.0;
    for (const wp of r.pts.slice(1)) {
      let best = Infinity, sinceBest = 0;
      for (let step = 0; step < 60 * 60; step++) {
        const t = body.translation();
        const dx = wp[0] - t.x, dz = wp[1] - t.z, d = Math.hypot(dx, dz);
        if (d < 0.12) break;
        if (d < best - 0.01) { best = d; sinceBest = 0; } else if (++sinceBest > 120) { ok = false; why = `jumissa (${t.x.toFixed(2)}, ${t.z.toFixed(2)}), ${d.toFixed(2)} m reittipisteeseen`; break; }
        const s = Math.min(speed * dt, d);
        kcc.computeColliderMovement(capsule, { x: (dx / d) * s, y: -0.02, z: (dz / d) * s });
        const m = kcc.computedMovement();
        body.setNextKinematicTranslation({ x: t.x + m.x, y: Math.max(Y - 0.05, t.y + m.y), z: t.z + m.z });
        world.step();
      }
      if (!ok) break;
    }
    const t = body.translation();
    const gd = Math.hypot(r.goal[0] - t.x, r.goal[1] - t.z);
    if (!ok) pfail++;
    console.log((ok ? '  ' : '✗ ') + r.name.padEnd(20), ok ? `perillä (${t.x.toFixed(2)}, ${t.z.toFixed(2)}), tavoitteesta ${gd.toFixed(2)} m` : why);
  }
  fail += pfail;
}

if (OUT_PNG) {
  const sharp = (await import('sharp')).default;
  const S = 2; // px per ruutu
  const W = NZ * S, Hh = NX * S;
  const img = Buffer.alloc(W * Hh * 3);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const p = j * NX + i;
    const col = blocked[p] ? [40, 36, 32] : reach[p] ? [92, 150, 96] : [190, 60, 60];
    for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) {
      const X = j * S + a, Y = i * S + b; const o = (Y * W + X) * 3;
      img[o] = col[0]; img[o + 1] = col[1]; img[o + 2] = col[2];
    }
  }
  for (const z of ZONES) {
    const [i, j] = cell(z.hotspot[0], z.hotspot[1]);
    for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) {
      const X = j * S + a, Y = i * S + b; if (X < 0 || Y < 0 || X >= W || Y >= Hh) continue;
      const o = (Y * W + X) * 3; img[o] = 230; img[o + 1] = 190; img[o + 2] = 90;
    }
  }
  await sharp(img, { raw: { width: W, height: Hh, channels: 3 } }).png().toFile(OUT_PNG);
  console.log('kartta', OUT_PNG);
}
console.log(fail ? `\n${fail} ongelmaa` : '\nKaikkiin huoneisiin ja vyöhykkeisiin pääsee kävelemään.');
process.exit(fail ? 1 : 0);
