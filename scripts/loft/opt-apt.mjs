// Gaming Apartment (UE glTF) -> kevyt web-GLB
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, weldPrimitive, compactPrimitive, flatten, join, quantize, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';

const [IN, OUT, META] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(IN);
const root = doc.getRoot();
await MeshoptSimplifier.ready; await MeshoptEncoder.ready;

// 0) Valokartat (UE Lightmass): solmukohtaiset UV:t atlakseen + materiaali atlaksittain
const LM_DIR = process.env.LM_DIR;
if (LM_DIR) {
  const LM = JSON.parse(fs.readFileSync(LM_DIR + '/lm-nodes.json', 'utf8'));
  const all = root.listNodes();
  const matClones = new Map();
  let ok = 0, bad = 0;
  for (const m of LM.nodes) {
    const node = all[m.i];
    if (!node || node.getName() !== m.name || !node.getMesh()) { bad++; continue; }
    const [sx, sy, bx, by] = m.scaleBias;
    const src = node.getMesh();
    const mesh = doc.createMesh(src.getName());
    for (const prim of src.listPrimitives()) {
      const p2 = prim.clone();
      const uv = prim.getAttribute('TEXCOORD_' + m.texCoord);
      if (uv) {
        const a = uv.getArray();
        const out = new Float32Array(a.length);
        for (let i = 0; i < a.length; i += 2) { out[i] = a[i] * sx + bx; out[i + 1] = a[i + 1] * sy + by; }
        p2.setAttribute('TEXCOORD_1', doc.createAccessor().setType('VEC2').setArray(out).setBuffer(uv.getBuffer()));
        const mat = prim.getMaterial();
        if (mat) {
          const key = mat.getName() + '|' + m.atlas;
          if (!matClones.has(key)) matClones.set(key, mat.clone().setName(mat.getName() + '__lm' + m.atlas));
          p2.setMaterial(matClones.get(key));
        }
      }
      mesh.addPrimitive(p2);
    }
    node.setMesh(mesh);
    ok++;
  }
  console.log('lightmap nodes', ok, 'mismatched', bad, 'material clones', matClones.size);
}

// 1) Poistot: animaatiot, katto/kattolaatat, kaupunkipallo erikseen, apukappaleet
for (const a of root.listAnimations()) a.dispose();
const DROP = [
  /^SM_Rooftop/, /^Box collision/i, /DrawBox/i, /LightmassPortal/i, /^SM_Environment$/,
  /^SM_Door_entry$/, /^SM_Entry_frame_door$/,
  /^SM_Metal_slingdoor$/, /^SM_Metal_frame_glass_c2$/, /^SM_Line_holder2?$/,
  /^SM_Cabinet_hall_[bc]$/, /^SM_Door_balcony$/,
]
const EXTRA_DROP = (process.env.DROP || '').split(',').filter(Boolean).map((s) => new RegExp('^' + s + '$'));
const dropped = [];
for (const n of root.listNodes()) {
  const name = n.getName();
  if ([...DROP, ...EXTRA_DROP].some((r) => r.test(name))) { dropped.push(name); n.dispose(); }
}
console.log('dropped', dropped.length);
const mem=(t)=>console.log(t, Math.round(process.memoryUsage().rss/1e6),'MB rss', Math.round(process.memoryUsage().arrayBuffers/1e6),'MB ab');
mem('after read');

// 1a) Toinen yksikkö (UNIT_B): asunnon kopio 180° käännettynä hissiaulan toiselle puolelle,
//     väliseinät ja keittiö/kylpyhuone/makuuhuone pois -> avoin startup-loft
if (process.env.UNIT_B) {
  const LOBBY_C = 6.33; // aulan keskilinja z (A:n pohjoisseinä 5.16, B:n eteläseinä 7.5)
  const scene = root.listScenes()[0];
  const KEEP_ALWAYS = [/^SM_Floor_main$/, /^SM_Floor_bathroom$/, /^SM_Floor_balcony$/, /^SM_Balcony_metal/, /^SM_Glass_windows/, /^SM_Curtain\d*$/, /^SM_Drap_Curtain/,
    /^SM_Ceiling_(base|livingroom|bedroom)$/, /^SM_Recessed_Downlight/, /^SM_Downlight_metal/, /^SM_Spotlight_Track/, /^SM_Fabric_Wall_Bed/,
    /^SM_Wall_0(01|02|03|04|05|09|10|11|12|13|16|17|18|19|20|21|23)$/, /^SM_Frame_door_balcony$/, /^SM_Backdrop_livingroom$/, /^SM_Wardrobe_livingroom$/,
    /^SM_Metal_frame_glass_c3?$/, /^SM_DiningRec_Table$/, /^SM_P_Chair\d*$/, /^SM_Ceiling_lamp$/];
  const DROP_ALWAYS = [/^SM_Wall_/, /Kitchen/i, /kichen/i, /Bath|Shower|WC|Washbasin|Toilet|Towel|Poloten|Shampoo|Toothbrush|Soap|Flush|Hand_Wash|Sea_salt/i,
    /^SM_Bed|Mattress|Coverlet|Clay_On_Bed|Benches|Tab_bed/, /Wardrobe|Closet|Clother|Slidingdoor|Metal_holder|Ray_.*floor|ServiceDoor/, /^Door$/, /^SM_Door_/, /^SM_Frame_bathroom/,
    /^SM_Ceiling_(bathroom|closet)$/, /Smart_TV|Wall_Light_Ext|Wall_Mounted_Mirror|Picture_decor_standing|Umbrella|Japan_Bench|Shoes|Cabinet_hall/, /^SM_Art_picture$/];
  const inside = (b, x0, x1, z0, z1) => { const cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2; return cx > x0 && cx < x1 && cz > z0 && cz < z1; };
  const deep = (n) => { const c = doc.createNode(n.getName()).setTranslation(n.getTranslation()).setRotation(n.getRotation()).setScale(n.getScale()).setMesh(n.getMesh()).setExtras({ ...n.getExtras() }); for (const ch of n.listChildren()) c.addChild(deep(ch)); return c; };
  const qy = [0, 1, 0, 0]; // 180° y-akselin ympäri
  const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
  let copied = 0;
  for (const n of [...scene.listChildren()]) {
    const name = n.getName();
    let b; try { b = getBounds(n); } catch { continue; }
    if (!b || !isFinite(b.min[0])) continue;
    let keep = KEEP_ALWAYS.some((r) => r.test(name));
    if (!keep && !DROP_ALWAYS.some((r) => r.test(name))) {
      // alueittain: makuuhuone, vaatehuone, kylpyhuone, keittiö ja eteinen pois
      const bad = inside(b, 1.45, 4.5, -4.0, 5.2) || inside(b, -4.4, -1.0, 1.3, 5.2) || inside(b, -1.05, 1.5, 2.45, 5.2);
      keep = !bad;
    }
    if (!keep) continue;
    const c = deep(n);
    c.setName(name + '__B');
    if (name === 'SM_Floor_bathroom' && c.getMesh()) {
      // kylpyhuoneen laattalattia -> parketti (B:ssä ei kylpyhuonetta)
      const parquet = scene.listChildren().find((x) => x.getName() === 'SM_Floor_main')?.getMesh()?.listPrimitives()[0]?.getMaterial();
      const m2 = doc.createMesh('SM_Floor_patch__B');
      for (const p of c.getMesh().listPrimitives()) { const p2 = p.clone(); if (parquet) p2.setMaterial(parquet); m2.addPrimitive(p2); }
      c.setMesh(m2);
    }
    const t = n.getTranslation();
    c.setTranslation([-t[0], t[1], 2 * LOBBY_C - t[2]]);
    c.setRotation(qmul(qy, n.getRotation()));
    scene.addChild(c);
    copied++;
  }
  console.log('unit B nodes', copied);
}

// 1b) Kerroksen laajennus (EXPAND = mittakerroin x/z): arkkitehtuuri venyy, huonekalut säilyttävät koon
const EXPAND = +(process.env.EXPAND || 1);
if (EXPAND !== 1) {
  const S = EXPAND;
  const ARCH = [/^SM_(Floor|Ceiling)/, /^SM_Wall_\d/, /^SM_Wall_bathroom/, /^SM_Wall_hung/, /^SM_Glass_windows/, /^SM_Curtain\d*$/, /^SM_Drap_Curtain/,
    /^SM_Balcony_metal/, /^SM_Fabric_Wall_Bed/, /^SM_Backdrop/, /^SM_Kitchen_laminate/, /^SM_Metal_frame_glass/, /^SM_Spotlight_Track$/, /^SM_Ray_sliding_floor/,
    /^SM_Metal_holder/, /^SM_Closet_metal_glass/, /^SM_Slidingdoor/, /^SM_Frame_door/, /^SM_Frame_bathroom/];
  const scene = root.listScenes()[0];
  const info = [];
  for (const n of scene.listChildren()) {
    let b; try { b = getBounds(n); } catch { continue; }
    if (!b || !isFinite(b.min[0]) || !isFinite(b.max[0])) continue;
    info.push({ n, name: n.getName(), min: b.min, max: b.max, arch: ARCH.some((r) => r.test(n.getName())) });
  }
  const xf = [], zf = [];
  for (const i of info) {
    if (!i.arch || !/Wall|Backdrop|Glass_windows|Fabric_Wall|laminate|frame_glass/.test(i.name)) continue;
    const sx = i.max[0] - i.min[0], sy = i.max[1] - i.min[1], sz = i.max[2] - i.min[2];
    if (sy < 1.2) continue;
    if (sx < 0.5) xf.push(i.min[0], i.max[0]);
    if (sz < 0.5) zf.push(i.min[2], i.max[2]);
  }
  const near = (v, faces) => faces.some((f) => Math.abs(v - f) < 0.15);
  const axisDelta = (mn, mx, faces) => (near(mn, faces) ? mn : near(mx, faces) ? mx : (mn + mx) / 2) * (S - 1);
  // arkkitehtuuri: venytys origon suhteen (vain y-kierto, joka kommutoi xz-skaalauksen kanssa)
  let stretched = 0, uvScaled = 0;
  for (const i of info.filter((x) => x.arch)) {
    const q = i.n.getRotation();
    if (Math.abs(q[0]) > 1e-3 || Math.abs(q[2]) > 1e-3) { i.arch = false; continue; }
    const t = i.n.getTranslation(), sc = i.n.getScale();
    i.n.setTranslation([t[0] * S, t[1], t[2] * S]);
    i.n.setScale([sc[0] * S, sc[1], sc[2] * S]);
    stretched++;
    // toistuva tekstuuri (lattia, katto): UV:t mukaan, ettei kuvio veny
    const mesh = i.n.getMesh();
    if (mesh && mesh.listParents().filter((p) => p.propertyType === 'Node').length === 1 && /Floor|Ceiling/.test(i.name)) {
      for (const p of mesh.listPrimitives()) {
        const uv = p.getAttribute('TEXCOORD_0'); if (!uv) continue;
        const mn = uv.getMin([]), mx = uv.getMax([]);
        if (mx[0] - mn[0] < 2.5) continue;
        const a = uv.getArray().slice();
        for (let k = 0; k < a.length; k++) a[k] *= S;
        p.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(a).setBuffer(uv.getBuffer()));
        uvScaled++;
      }
    }
  }
  // huonekalut: lattialla seisovat kiinni toisissaan olevat ryhmiksi, ryhmä siirtyy yhtenä
  const objs = info.filter((x) => !x.arch);
  const standing = (o) => o.min[1] < 0.15 && o.max[1] - o.min[1] > 0.06;
  const par = objs.map((_, k) => k);
  const find = (k) => (par[k] === k ? k : (par[k] = find(par[k])));
  const touch = (a, b, g) => a.min[0] <= b.max[0] + g && b.min[0] <= a.max[0] + g && a.min[2] <= b.max[2] + g && b.min[2] <= a.max[2] + g;
  for (let a = 0; a < objs.length; a++) {
    if (!standing(objs[a])) continue;
    for (let b = a + 1; b < objs.length; b++) if (standing(objs[b]) && touch(objs[a], objs[b], 0.04)) par[find(a)] = find(b);
  }
  const clusters = new Map();
  objs.forEach((o, k) => { if (!standing(o)) return; const r = find(k); const c = clusters.get(r) || { min: [...o.min], max: [...o.max] }; for (let d = 0; d < 3; d++) { c.min[d] = Math.min(c.min[d], o.min[d]); c.max[d] = Math.max(c.max[d], o.max[d]); } clusters.set(r, c); });
  const deltaOf = new Map();
  for (const [r, c] of clusters) deltaOf.set(r, [axisDelta(c.min[0], c.max[0], xf), axisDelta(c.min[2], c.max[2], zf)]);
  // muut (pöydillä, hyllyillä, seinillä, katossa): tuen mukana tai oma ankkuri
  const memo = new Map();
  const resolve = (k, depth = 0) => {
    if (memo.has(k)) return memo.get(k);
    const o = objs[k];
    let d;
    if (standing(o)) d = deltaOf.get(find(k));
    else {
      const cx = (o.min[0] + o.max[0]) / 2, cz = (o.min[2] + o.max[2]) / 2;
      let best = -1, bestTop = -Infinity;
      objs.forEach((s2, j) => {
        if (j === k || s2.max[1] > o.min[1] + 0.06 || s2.max[1] < o.min[1] - 0.12) return;
        if (cx < s2.min[0] - 0.05 || cx > s2.max[0] + 0.05 || cz < s2.min[2] - 0.05 || cz > s2.max[2] + 0.05) return;
        if (s2.max[1] > bestTop) { bestTop = s2.max[1]; best = j; }
      });
      d = best >= 0 && depth < 8 ? resolve(best, depth + 1) : [axisDelta(o.min[0], o.max[0], xf), axisDelta(o.min[2], o.max[2], zf)];
    }
    memo.set(k, d);
    return d;
  };
  objs.forEach((o, k) => { const [dx, dz] = resolve(k); const t = o.n.getTranslation(); o.n.setTranslation([t[0] + dx, t[1], t[2] + dz]); });
  console.log('expand', S, 'stretched', stretched, 'uvScaled', uvScaled, 'objects', objs.length, 'clusters', clusters.size, 'xfaces', xf.length, 'zfaces', zf.length);
}

// 2) Ylimääräiset attribuutit pois (valokarttojen UV ja tangentit)
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
  const lit = /__lm\d+$/.test(p.getMaterial()?.getName() || '');
  for (const s of [...(lit ? [] : ['TEXCOORD_1']), 'TEXCOORD_2', 'TEXCOORD_3', 'TANGENT', 'COLOR_0']) { const a = p.getAttribute(s); if (a) p.setAttribute(s, null); }
}
mem('before prune'); await doc.transform(prune({ keepSolidTextures: true })); mem('after prune');

function simplifyPrim(prim, ratio, error) {
  const pos = prim.getAttribute('POSITION'); const idx = prim.getIndices();
  if (!idx || prim.getMode() !== 4) return;
  const P = pos.getArray() instanceof Float32Array ? pos.getArray() : new Float32Array(pos.getArray());
  const I = new Uint32Array(idx.getArray());
  const target = Math.max(3, Math.floor((I.length * ratio) / 3) * 3);
  let [res] = MeshoptSimplifier.simplify(I, P, 3, target, error, ['Permissive']);
  if (res.length > target * 1.6) [res] = MeshoptSimplifier.simplifySloppy(I, P, 3, null, target, error * 2);
  if (res.length < 3) return;
  const arr = res.length && Math.max(...res.subarray(0, Math.min(res.length, 1))) >= 0 ? res : res;
  prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(arr)).setBuffer(idx.getBuffer()));
  compactPrimitive(prim);
}

// 3) Kappalekoko materiaaleittain + meshien yksinkertaistus koon mukaan
const meshSize = new Map(); // mesh -> max diag
const matSize = new Map();
const meta = [];
for (const n of root.listNodes()) {
  const mesh = n.getMesh(); if (!mesh) continue;
  const b = getBounds(n); const d = Math.hypot(b.max[0]-b.min[0], b.max[1]-b.min[1], b.max[2]-b.min[2]);
  meshSize.set(mesh, Math.max(meshSize.get(mesh) || 0, d));
  for (const p of mesh.listPrimitives()) { const mat = p.getMaterial(); if (mat) matSize.set(mat, Math.max(matSize.get(mat) || 0, d)); }
  meta.push({ name: n.getName(), min: b.min.map((v) => +v.toFixed(3)), max: b.max.map((v) => +v.toFixed(3)) });
}
let before = 0, after = 0, done = 0;
for (const [mesh, d] of meshSize) {
  for (const p of mesh.listPrimitives()) weldPrimitive(p);
  let tris = 0; for (const p of mesh.listPrimitives()) tris += p.getIndices().getCount() / 3;
  before += tris;
  // budjetti: pienet esineet ~600, isot huonekalut ~6000
  const budget = d > 20 ? 4000 : Math.max(200, Math.min(4000, Math.round(1500 * d)));
  if (tris > budget) {
    const ratio = budget / tris;
    for (const p of mesh.listPrimitives()) simplifyPrim(p, ratio, d < 0.6 ? 0.08 : d < 2 ? 0.04 : 0.02);
  }
  let t2 = 0; for (const p of mesh.listPrimitives()) t2 += p.getIndices().getCount() / 3; after += t2;
  if (done % 25 === 0) mem('mesh '+done);
  if (++done % 50 === 0) { await doc.transform(prune({ propertyTypes: ['Accessor'], keepSolidTextures: true })); }
}
console.log('tris', before, '->', after);

// 4) Tekstuurit: koko kappaleen koon mukaan, WebP; pienten kappaleiden normaali- ja AO-kartat pois
const texMax = new Map();
for (const mat of root.listMaterials()) {
  const d = matSize.get(mat) || 1;
  const small = d < 0.6;
  if (small) { mat.setNormalTexture(null); mat.setOcclusionTexture(null); }
  for (const [get, slot] of [[() => mat.getBaseColorTexture(), 'base'], [() => mat.getMetallicRoughnessTexture(), 'mr'], [() => mat.getNormalTexture(), 'n'], [() => mat.getOcclusionTexture(), 'ao'], [() => mat.getEmissiveTexture(), 'e']]) {
    const t = get(); if (!t) continue;
    let s = d > 20 ? 1024 : d > 3 ? 1024 : d > 1.2 ? 512 : d > 0.4 ? 256 : 128;
    if (slot !== 'base' && s > 512) s = 512;
    texMax.set(t, Math.max(texMax.get(t) || 0, s));
  }
}
await doc.transform(prune({ keepSolidTextures: true }));
doc.createExtension(EXTTextureWebP).setRequired(true);
let tb = 0, ta = 0;
for (const t of root.listTextures()) {
  const img = t.getImage(); if (!img) continue; tb += img.byteLength;
  const s = texMax.get(t) || 256;
  const out = await sharp(Buffer.from(img)).resize(s, s, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toBuffer();
  t.setImage(new Uint8Array(out)).setMimeType('image/webp'); t.setURI(''); ta += out.byteLength;
}
console.log('textures', root.listTextures().length, (tb/1e6).toFixed(1), 'MB ->', (ta/1e6).toFixed(1), 'MB');

// 5) Yhdistäminen ja pakkaus
await doc.transform(dedup(), flatten(), join({ keepNamed: false }), prune({ keepSolidTextures: true }), quantize({ quantizeNormal: 8, quantizePosition: 14, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(OUT, doc);
fs.writeFileSync(META, JSON.stringify(meta));
console.log('wrote', OUT, (fs.statSync(OUT).size / 1e6).toFixed(2), 'MB; draw prims', root.listMeshes().reduce((a, m) => a + m.listPrimitives().length, 0));
