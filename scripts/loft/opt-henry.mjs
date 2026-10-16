// Henry (MetaHuman, UE glTF) + MetaHuman-liikeanimaatiot -> yksi kevyt character.glb
// node opt-henry.mjs <henry.gltf> <out.glb> idle=<anim_idle.gltf> walk=<anim_walk.gltf> run=<anim_run.gltf>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, resample, meshopt, quantize, weld } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';

const [IN, OUT, ...rest] = process.argv.slice(2);
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(IN);
const root = doc.getRoot();
for (const a of root.listAnimations()) a.dispose();
const nodesByName = new Map(root.listNodes().map((n) => [n.getName(), n]));
const buffer = root.listBuffers()[0];

// Liikeanimaatiot: kanavat kohdistetaan Henryn luihin nimen perusteella
for (const arg of rest) {
  const [name, file] = arg.split('=');
  const src = await io.read(file);
  const anim = src.getRoot().listAnimations()[0];
  if (!anim) { console.warn('no animation in', file); continue; }
  const out = doc.createAnimation(name);
  let n = 0, miss = 0;
  for (const ch of anim.listChannels()) {
    const target = nodesByName.get(ch.getTargetNode()?.getName());
    if (!target) { miss++; continue; }
    const s = ch.getSampler();
    const input = doc.createAccessor().setType('SCALAR').setArray(s.getInput().getArray().slice()).setBuffer(buffer);
    let arr = s.getOutput().getArray().slice();
    const path = ch.getTargetPath();
    // Paikallaan kävely: juuriluun vaakaliike pois (hahmo liikkuu fysiikan mukana)
    if (path === 'translation' && /^root$/i.test(target.getName())) {
      for (let i = 0; i < arr.length; i += 3) { arr[i] = arr[0]; arr[i + 2] = arr[2]; }
    }
    const output = doc.createAccessor().setType(s.getOutput().getType()).setArray(arr).setBuffer(buffer);
    const sampler = doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation(s.getInterpolation());
    out.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(target).setTargetPath(path).setSampler(sampler));
    n++;
  }
  console.log('anim', name, 'channels', n, 'missing', miss);
}

// Tekstuurit WebP:ksi (iho 1024, muut 512)
doc.createExtension(EXTTextureWebP).setRequired(true);
let tb = 0, ta = 0;
for (const t of root.listTextures()) {
  const img = t.getImage(); if (!img) continue; tb += img.byteLength;
  const big = /base|color|diffuse/i.test(t.getName() + t.getURI());
  const s = big ? 1024 : 512;
  const o = await sharp(Buffer.from(img)).resize(s, s, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  t.setImage(new Uint8Array(o)).setMimeType('image/webp'); t.setURI(''); ta += o.byteLength;
}
console.log('textures', root.listTextures().length, (tb / 1e6).toFixed(1), '->', (ta / 1e6).toFixed(1), 'MB');

await doc.transform(
  weld(),
  resample(),
  dedup(),
  prune({ keepSolidTextures: true }),
  quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeWeight: 8, quantizeTexcoord: 12 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
await io.write(OUT, doc);
let tris = 0;
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() || 0) / 3;
console.log(OUT, (fs.statSync(OUT).size / 1e6).toFixed(2), 'MB', 'tris', tris, 'joints', root.listSkins().map((s) => s.listJoints().length), root.listAnimations().map((a) => a.getName()));
