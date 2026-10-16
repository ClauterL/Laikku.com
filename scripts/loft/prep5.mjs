// Gaming Apartment (UE glTF, nimetty) -> kevyempi nimetty GLB Blenderiä varten (kerros 5)
// node prep5.mjs <apt-raw.glb> <out.glb>
// Säilyttää solmujen nimet; yksinkertaistaa raskaat meshit ja pienentää tekstuurit.
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, weldPrimitive, compactPrimitive } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [IN, OUT] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(IN);
const root = doc.getRoot();
await MeshoptSimplifier.ready;

for (const a of root.listAnimations()) a.dispose();
const DROP = [
  /^SM_Rooftop/, /^Box collision/i, /DrawBox/i, /LightmassPortal/i, /^SM_Environment$/,
  /^SM_Door_entry$/, /^SM_Entry_frame_door$/,
  /^SM_Metal_slingdoor$/, /^SM_Metal_frame_glass_c2$/, /^SM_Line_holder2?$/,
  /^SM_Cabinet_hall_[bc]$/, /^SM_Door_balcony$/,
];
let dropped = 0;
for (const n of root.listNodes()) if (DROP.some((r) => r.test(n.getName()))) { n.dispose(); dropped++; }
// eteisen kaappien b/c sisällä olleet koriste-esineet (kaapit korvataan kirjahyllyllä)
const scene = root.listScenes()[0];
const STRUCT = /^SM_(Wall|Floor|Ceiling|Recessed|Downlight|Spotlight|Backdrop)/;
for (const n of [...scene.listChildren()]) {
  if (STRUCT.test(n.getName())) continue;
  let b; try { b = getBounds(n); } catch { continue; }
  if (!b || !isFinite(b.min[0])) continue;
  const cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2;
  if (cx > -1.02 && cx < -0.38 && cz > 2.5 && cz < 4.31 && b.min[1] > 0.03) { n.dispose(); dropped++; }
}
console.log('dropped', dropped);

for (const m of root.listMeshes()) for (const p of m.listPrimitives()) for (const s of ['TEXCOORD_2', 'TEXCOORD_3', 'TANGENT', 'COLOR_0']) if (p.getAttribute(s)) p.setAttribute(s, null);
await doc.transform(prune({ keepSolidTextures: true, keepAttributes: true }));

// koko solmuittain -> meshin ja materiaalin koko
const meshSize = new Map(), matSize = new Map();
for (const n of root.listNodes()) {
  const mesh = n.getMesh(); if (!mesh) continue;
  const b = getBounds(n); const d = Math.hypot(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
  meshSize.set(mesh, Math.max(meshSize.get(mesh) || 0, d));
  for (const p of mesh.listPrimitives()) { const mat = p.getMaterial(); if (mat) matSize.set(mat, Math.max(matSize.get(mat) || 0, d)); }
}

// yksinkertaistus kuten web-versiossa (valokartta-UV:t luodaan Blenderissä uudelleen)
let before = 0, after = 0;
for (const [mesh, d] of meshSize) {
  for (const p of mesh.listPrimitives()) weldPrimitive(p);
  let tris = 0; for (const p of mesh.listPrimitives()) tris += p.getIndices().getCount() / 3;
  before += tris;
  const budget = d > 20 ? 4000 : Math.max(200, Math.min(4000, Math.round(1500 * d)));
  if (tris > budget) {
    const ratio = budget / tris;
    for (const p of mesh.listPrimitives()) {
      const pos = p.getAttribute('POSITION'); const idx = p.getIndices();
      if (!idx || p.getMode() !== 4) continue;
      const P = pos.getArray() instanceof Float32Array ? pos.getArray() : new Float32Array(pos.getArray());
      const I = new Uint32Array(idx.getArray());
      const target = Math.max(3, Math.floor((I.length * ratio) / 3) * 3);
      const err = d < 0.6 ? 0.08 : d < 2 ? 0.04 : 0.02;
      let [res] = MeshoptSimplifier.simplify(I, P, 3, target, err, ['Permissive']);
      if (res.length > target * 1.6) [res] = MeshoptSimplifier.simplifySloppy(I, P, 3, null, target, err * 2);
      if (res.length < 3) continue;
      p.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(res)).setBuffer(idx.getBuffer()));
      compactPrimitive(p);
    }
  }
  for (const p of mesh.listPrimitives()) after += p.getIndices().getCount() / 3;
}
console.log('tris', before, '->', after);

// tekstuurit kappaleen koon mukaan (alkuperäinen muoto)
const texMax = new Map();
for (const mat of root.listMaterials()) {
  const d = matSize.get(mat) || 1;
  for (const [t, slot] of [[mat.getBaseColorTexture(), 'base'], [mat.getMetallicRoughnessTexture(), 'mr'], [mat.getNormalTexture(), 'n'], [mat.getOcclusionTexture(), 'ao'], [mat.getEmissiveTexture(), 'e']]) {
    if (!t) continue;
    let s = d > 3 ? 1024 : d > 1.2 ? 512 : d > 0.4 ? 256 : 128;
    if (slot !== 'base' && s > 512) s = 512;
    texMax.set(t, Math.max(texMax.get(t) || 0, s));
  }
}
let tb = 0, ta = 0;
for (const t of root.listTextures()) {
  const img = t.getImage(); if (!img) continue; tb += img.byteLength;
  const s = texMax.get(t) || 256;
  const png = t.getMimeType() === 'image/png';
  let pipe = sharp(Buffer.from(img)).resize(s, s, { fit: 'inside', withoutEnlargement: true });
  pipe = png ? pipe.png({ compressionLevel: 8 }) : pipe.jpeg({ quality: 88 });
  const out = await pipe.toBuffer();
  t.setImage(new Uint8Array(out)); t.setURI(''); ta += out.byteLength;
}
console.log('textures', (tb / 1e6).toFixed(1), 'MB ->', (ta / 1e6).toFixed(1), 'MB');
await doc.transform(prune({ keepSolidTextures: true, keepAttributes: true }));
await io.write(OUT, doc);
console.log('wrote', OUT, 'nodes', root.listNodes().length);
