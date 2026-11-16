"""Peuran pako (Higgsfield Kling 3.0 -video) → public/images/critter-deer-flee.webp + src/data/critters-extra.json.

Lähde: assets-src/critters/deer-flee.mp4 (5 s, 24 fps, mustasta peurasiluetista, paikallaan pysyvä leveä kamera):
peura laiduntaa, säikähtää (pää ylös) ja loikkii vasemmalle ulos kuvasta. Käytetään ruudut START…END (säikähdys → loikat).
Ruudut kynnystetään siluetiksi (valkoinen + alfa, CSS-maskina currentColor-värillä kuten Critters.tsx).
Ankkurit (rump = selän/peräpään oikea reuna, feet = jalkojen taso) kertovat, mihin kohtaan solua lepoasennon peura osuu,
jolloin pako-kerros voidaan asettaa täsmälleen laiduntavan peuran päälle.

Ajo:  python scripts/critters-extra.py   (vaatii ffmpeg, Pillow, numpy)
"""
import json, subprocess, tempfile
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src" / "critters" / "deer-flee.mp4"
START, END = 84, 114          # säikähtänyt seisoma (pää ylhäällä) → viimeinen loikka kuvassa (0-pohjainen @24 fps)
X0, X1, Y0, Y1 = 0, 620, 165, 312  # solun rajaus 640 px leveässä kehyksessä
S = 0.9                        # lisäskaalaus (solun korkeus ≈ 132 px)
COLS = 6

def alpha(p: Path) -> np.ndarray:
    g = np.asarray(Image.open(p).convert("L")).astype(np.float32)
    return np.clip((200 - g) / 140, 0, 1)

with tempfile.TemporaryDirectory() as d:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(SRC), "-vf", "fps=24,scale=640:-1", f"{d}/%03d.png"], check=True)
    files = sorted(Path(d).glob("*.png"))[START : END + 1]
    cw, ch = round((X1 - X0) * S), round((Y1 - Y0) * S)
    cells = []
    for f in files:
        a = alpha(f)[Y0:Y1, X0:X1]
        im = Image.fromarray((a * 255).astype("uint8"), "L").resize((cw, ch), Image.LANCZOS)
        cells.append(np.asarray(im))
    first = alpha(files[0])[Y0:Y1, X0:X1] > 0.5
    ys, xs = np.where(first)
    rump, feet, top = xs.max() * S, ys.max() * S, ys.min() * S
    n = len(cells)
    # ilmassa-aste (0 = jalat maassa, 1 = täysi ojennus): siluetin leveys, jolla loikkakaaret (translateY) tahdistetaan ruutuihin
    wd = np.array([(np.ptp(np.where((c > 128).any(axis=0))[0]) if (c > 128).any() else 0) for c in cells], dtype=float)
    wd = (wd - wd.min()) / max(1e-6, wd.max() - wd.min())
    pad = np.pad(wd, 1, mode="edge")
    lift = (0.25 * pad[:-2] + 0.5 * pad[1:-1] + 0.25 * pad[2:]) ** 1.4
    rows = (n + COLS - 1) // COLS
    sheet = np.zeros((rows * ch, COLS * cw, 4), dtype=np.uint8)
    sheet[..., :3] = 255
    for i, c in enumerate(cells):
        r, k = divmod(i, COLS)
        sheet[r * ch : (r + 1) * ch, k * cw : (k + 1) * cw, 3] = c
    out = ROOT / "public" / "images" / "critter-deer-flee.webp"
    Image.fromarray(sheet, "RGBA").save(out, quality=80, method=6)
    meta = {
        "deerFlee": {
            "src": "/images/critter-deer-flee.webp", "w": cw, "h": ch, "cols": COLS, "rows": rows, "frames": n,
            "ms": [42] * n, "rump": round(float(rump) / cw, 4), "feet": round(float(feet) / ch, 4),
            "deerH": round(float(feet - top), 1),
            "lift": [round(float(v), 3) for v in lift],
        }
    }
    (ROOT / "src" / "data" / "critters-extra.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(meta, out.stat().st_size // 1024, "kB")
