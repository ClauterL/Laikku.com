// Kerros 5: Blenderin vienti (floor5.glb, valokartta-UV = TEXCOORD_1, materiaalit __lmK) -> kevyt web-GLB
// node opt5.mjs <floor5.glb> <apartment.glb>
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, flatten, join, quantize, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';

const [IN, OUT] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await MeshoptEncoder.ready;
const doc = await io.read(IN);
const root = doc.getRoot();

// 1) ylimääräiset attribuutit: valokartta-UV vain valokartallisille materiaaleille
let lmPrims = 0;
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
  const lit = /__lm\d+$/.test(p.getMaterial()?.getName() || '');
  if (lit) lmPrims++;
  for (const s of [...(lit ? [] : ['TEXCOORD_1']), 'TEXCOORD_2', 'TEXCOORD_3', 'TANGENT', 'COLOR_0']) if (p.getAttribute(s)) p.setAttribute(s, null);
}
console.log('lightmapped prims', lmPrims);

// 2) tekstuurit WebP:ksi kappaleen koon mukaan (pienten kappaleiden normaali- ja AO-kartat pois)
const matSize = new Map();
for (const n of root.listNodes()) {
  const mesh = n.getMesh(); if (!mesh) continue;
  const b = getBounds(n); const d = Math.hypot(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
  for (const p of mesh.listPrimitives()) { const mat = p.getMaterial(); if (mat) matSize.set(mat, Math.max(matSize.get(mat) || 0, d)); }
}
const texMax = new Map();
for (const mat of root.listMaterials()) {
  const d = matSize.get(mat) || 1;
  if (d < 0.6) { mat.setNormalTexture(null); mat.setOcclusionTexture(null); }
  for (const [t, slot] of [[mat.getBaseColorTexture(), 'base'], [mat.getMetallicRoughnessTexture(), 'mr'], [mat.getNormalTexture(), 'n'], [mat.getOcclusionTexture(), 'ao'], [mat.getEmissiveTexture(), 'e']]) {
    if (!t) continue;
    let s = d > 3 ? 1024 : d > 1.2 ? 512 : d > 0.4 ? 256 : 128;
    if (slot !== 'base' && s > 512) s = 512;
    texMax.set(t, Math.max(texMax.get(t) || 0, s));
  }
}
await doc.transform(prune({ keepSolidTextures: true, keepAttributes: true }));
doc.createExtension(EXTTextureWebP).setRequired(true);
let tb = 0, ta = 0;
for (const t of root.listTextures()) {
  const img = t.getImage(); if (!img) continue; tb += img.byteLength;
  const s = texMax.get(t) || 256;
  const out = await sharp(Buffer.from(img)).resize(s, s, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toBuffer();
  t.setImage(new Uint8Array(out)).setMimeType('image/webp'); t.setURI(''); ta += out.byteLength;
}
console.log('textures', root.listTextures().length, (tb / 1e6).toFixed(1), 'MB ->', (ta / 1e6).toFixed(1), 'MB');

// 3) yhdistäminen ja pakkaus (valokartta-UV:lle tarkempi kvantisointi: pienet laatat 2048-atlaksessa)
await doc.transform(dedup({ keepUniqueNames: true }), flatten(), join({ keepNamed: false }), prune({ keepSolidTextures: true, keepAttributes: true }),
  quantize({ quantizeNormal: 8, quantizePosition: 14, quantizeTexcoord: 14 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
let a = 0, b = 0;
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) if (/__lm\d+$/.test(p.getMaterial()?.getName() || '')) { a++; if (p.getAttribute('TEXCOORD_1')) b++; }
console.log('final lightmapped prims', a, 'with UV1', b);
await io.write(OUT, doc);
console.log('wrote', OUT, (fs.statSync(OUT).size / 1e6).toFixed(2), 'MB; draw prims', root.listMeshes().reduce((s, m) => s + m.listPrimitives().length, 0));
