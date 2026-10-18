"""Paistetut valokartat (EXR, lineaarinen) -> 8-bittiset PNG-atlakset web-käyttöön + manifesti.
Koodaus kuten scripts/loft/lightmaps.mjs: arvo = (väri / M)^(1/2.2), M = 99,5 %:n kirkkaus; ajossa lightMapIntensity = M * gain.
python -c "import sys; sys.argv=['x','tone=0']; exec(open('s3_encode.py').read())" """
import bpy, sys, json, numpy as np
ARGS = dict(a.split('=', 1) for a in sys.argv if '=' in a)
OUT = '/home/claude/work/p5/out'
TONE = float(ARGS.get('tone', 0))
info = json.load(open(f'{OUT}/bake.json'))
man = {'gain': float(ARGS.get('gain', 1.0)), 'atlases': []}
for k in range(info['atlases']):
    img = bpy.data.images.load(f'{OUT}/lm{k}_dn.exr')
    W, H = img.size
    px = np.empty(W * H * 4, np.float32); img.pixels.foreach_get(px)
    px = px.reshape(H, W, 4)[..., :3].copy()
    px = np.maximum(px, 0)
    if TONE > 0:
        lum = 0.2126 * px[..., 0] + 0.7152 * px[..., 1] + 0.0722 * px[..., 2]
        px *= (1.0 / (1.0 + lum / TONE))[..., None]
    mx = px.max(axis=2)
    vals = mx[mx > 1e-5]
    M = float(max(0.02, np.percentile(vals, 99.5))) if vals.size else 1.0
    enc = np.clip(px / M, 0, 1) ** (1 / 2.2)
    out = bpy.data.images.new(f'atlas{k}', W, H, alpha=False)
    rgba = np.ones((H, W, 4), np.float32); rgba[..., :3] = enc
    out.pixels.foreach_set(rgba.ravel())
    out.filepath_raw = f'{OUT}/atlas-{k}.png'; out.file_format = 'PNG'; out.save()
    med = float(np.median(vals)) if vals.size else 0
    man['atlases'].append({'file': f'lm/atlas-{k}.webp', 'M': round(M, 4)})
    print('atlas', k, W, 'x', H, 'M', round(M, 4), 'median', round(med, 4))
json.dump(man, open(f'{OUT}/lightmaps.json', 'w'), indent=1)
print('wrote manifest')
