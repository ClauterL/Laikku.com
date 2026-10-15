// UE:n EPIC_lightmap_textures (HQ-valokartat) -> dekoodatut valokartta-atlakset + solmukohtaiset UV-muunnokset
// node lightmaps.mjs <lightmaps.gltf> <outDir>
// Tuottaa outDir/lm-nodes.json ja outDir/atlas-K.png (sRGB, arvo = (väri / M)^(1/2.2), M tallessa jsonissa)
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const [GLTF, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const json = JSON.parse(fs.readFileSync(GLTF, 'utf8'));
const dir = path.dirname(GLTF);
const extKey = Object.keys(json.extensions || {}).find((k) => /lightmap/i.test(k));
if (!extKey) throw new Error('ei valokarttalaajennusta');
const lightmaps = json.extensions[extKey].lightmaps;
console.log('lightmaps', lightmaps.length, 'ext', extKey);

// solmu -> valokartta
const nodes = json.nodes.map((n, i) => {
  const e = n.extensions && n.extensions[extKey];
  return { i, name: n.name, mesh: n.mesh, lm: e ? e.lightmap : null };
});
const withLm = nodes.filter((n) => n.lm != null);
console.log('nodes', nodes.length, 'with lightmap', withLm.length);

// atlas = tekstuurin kuva
const texToImg = (ti) => json.textures[ti].source;
const atlasOf = new Map(); // image index -> atlas k
const atlases = [];
for (const lm of lightmaps) {
  const img = texToImg(lm.texture.index);
  if (!atlasOf.has(img)) {
    atlasOf.set(img, atlases.length);
    atlases.push({ img, uri: json.images[img].uri, regions: [] });
  }
  lm.atlas = atlasOf.get(img);
  atlases[lm.atlas].regions.push(lm);
}
console.log('atlases', atlases.length);

const LOG_BLACK = 0.01858136;
const meta = { atlases: [], nodes: [] };
for (let k = 0; k < atlases.length; k++) {
  const a = atlases[k];
  const { data, info } = await sharp(path.join(dir, decodeURIComponent(a.uri))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const half = H / 2;
  const outF = new Float32Array(W * half * 3);
  const vals = [];
  for (const lm of a.regions) {
    const [sx, sy, bx, by] = lm.coordinateScaleBias;
    const S = lm.lightmapScale, A = lm.lightmapAdd;
    // UV0 = (uv * scale + bias) * (1, 0.5): yläpuolisko; alapuolisko = +0.5
    const x0 = Math.max(0, Math.floor(bx * W)), x1 = Math.min(W, Math.ceil((bx + sx) * W));
    const y0 = Math.max(0, Math.floor(by * 0.5 * H)), y1 = Math.min(half, Math.ceil((by + sy) * 0.5 * H));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const p0 = (y * W + x) * C, p1 = ((y + half) * W + x) * C;
      const r = data[p0] / 255, g = data[p0 + 1] / 255, b = data[p0 + 2] / 255, la = data[p0 + 3] / 255;
      let logL = la + (data[p1 + 3] / 255) * (1 / 255) - 0.5 / 255;
      logL = logL * S[3] + A[3];
      const L = Math.max(0, Math.pow(2, logL) - LOG_BLACK);
      const o = (y * W + x) * 3;
      outF[o] = L * Math.max(0, r * r * S[0] + A[0]);
      outF[o + 1] = L * Math.max(0, g * g * S[1] + A[1]);
      outF[o + 2] = L * Math.max(0, b * b * S[2] + A[2]);
      vals.push(Math.max(outF[o], outF[o + 1], outF[o + 2]));
    }
  }
  vals.sort((p, q) => p - q);
  const M = Math.max(0.05, vals[Math.floor(vals.length * 0.995)] || 1);
  const out8 = Buffer.alloc(W * half * 3);
  for (let i = 0; i < outF.length; i++) out8[i] = Math.round(255 * Math.min(1, Math.pow(outF[i] / M, 1 / 2.2)));
  // täytetään tyhjät tekselit naapureista (vähentää reunavuotoa suodatuksessa)
  const file = `atlas-${k}.png`;
  await sharp(out8, { raw: { width: W, height: half, channels: 3 } }).png().toFile(path.join(OUT, file));
  meta.atlases.push({ k, file, width: W, height: half, M: +M.toFixed(4), regions: a.regions.length, median: +(vals[Math.floor(vals.length / 2)] || 0).toFixed(4) });
  console.log('atlas', k, W + 'x' + H, 'regions', a.regions.length, 'M', M.toFixed(3));
}
for (const n of withLm) {
  const lm = lightmaps[n.lm];
  meta.nodes.push({ i: n.i, name: n.name, atlas: lm.atlas, texCoord: lm.texture.texCoord ?? 1, scaleBias: lm.coordinateScaleBias });
}
fs.writeFileSync(path.join(OUT, 'lm-nodes.json'), JSON.stringify(meta));
console.log('wrote', meta.nodes.length, 'node mappings');
