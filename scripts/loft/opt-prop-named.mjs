// Fab-esine -> kevyt web-GLB:  node opt-prop.mjs in out maxTex targetTris
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, weldPrimitive, compactPrimitive, flatten, join, quantize, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
const [IN, OUT, MAXTEX = '1024', TARGET = '8000'] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
const doc = await io.read(IN);
const root = doc.getRoot();
for (const a of root.listAnimations()) a.dispose();
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) for (const s of ['TEXCOORD_1', 'TEXCOORD_2', 'TANGENT', 'COLOR_0']) if (p.getAttribute(s)) p.setAttribute(s, null);
await doc.transform(prune({ keepSolidTextures: true }), flatten());
let tris = 0; for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { weldPrimitive(p); tris += (p.getIndices()?.getCount() || 0) / 3; }
const target = +TARGET;
if (tris > target) {
  const ratio = target / tris;
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
    const pos = p.getAttribute('POSITION'), idx = p.getIndices(); if (!idx) continue;
    const P = pos.getArray() instanceof Float32Array ? pos.getArray() : new Float32Array(pos.getArray());
    const I = new Uint32Array(idx.getArray());
    const t = Math.max(3, Math.floor((I.length * ratio) / 3) * 3);
    let [res] = MeshoptSimplifier.simplify(I, P, 3, t, 0.02, ['Permissive']);
    if (res.length > t * 1.6) [res] = MeshoptSimplifier.simplifySloppy(I, P, 3, null, t, 0.04);
    if (res.length < 3) continue;
    p.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(res)).setBuffer(idx.getBuffer()));
    compactPrimitive(p);
  }
}
let t2 = 0; for (const m of root.listMeshes()) for (const p of m.listPrimitives()) t2 += (p.getIndices()?.getCount() || 0) / 3;
doc.createExtension(EXTTextureWebP).setRequired(true);
let tb = 0, ta = 0;
for (const t of root.listTextures()) {
  const img = t.getImage(); if (!img) continue; tb += img.byteLength;
  const isNormal = root.listMaterials().some((m) => m.getNormalTexture() === t);
  const s = isNormal ? Math.min(+MAXTEX, 512) : +MAXTEX;
  const out = await sharp(Buffer.from(img)).resize(s, s, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  t.setImage(new Uint8Array(out)).setMimeType('image/webp').setURI(''); ta += out.byteLength;
}
await doc.transform(dedup(), join({ keepNamed: true }), prune({ keepSolidTextures: true }), quantize({ quantizeNormal: 8, quantizePosition: 14, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(OUT, doc);
const b = getBounds(root.listScenes()[0]);
console.log(JSON.stringify({ out: OUT.split('/').pop(), kb: Math.round(fs.statSync(OUT).size / 1024), tris: [tris, t2], tex: [(tb / 1e6).toFixed(1), (ta / 1e6).toFixed(2)], size: b.max.map((v, i) => +(v - b.min[i]).toFixed(3)), min: b.min.map((v) => +v.toFixed(3)) }));
