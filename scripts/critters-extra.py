"""Peuran pako (Higgsfield Kling 3.0 -video) → public/images/critter-deer-flee.webp + src/data/critters-extra.json.

Lähde: assets-src/critters/deer-flee.mp4 (5 s, 24 fps, mustasta peurasiluetista, paikallaan pysyvä leveä kamera):
peura laiduntaa, säikähtää (pää ylös) ja loikkii vasemmalle ulos kuvasta. Käytetään ruudut START…END.
Ruudut kynnystetään siluetiksi (valkoinen + alfa, CSS-maskina currentColor-värillä kuten Critters.tsx) ja VAKAUTETAAN:
peura pidetään solun keskellä (massakeskipisteen mukaan) ja videon eteneminen tallennetaan ruutukohtaisesti (dx),
jolloin liike voidaan toistaa mielivaltaisen pitkälle: ensin alku (säikähdys → ensimmäinen loikka, ruudut 0…CYCLE_A-1),
sitten loikkasykli CYCLE_A…CYCLE_B-1 silmukkana, ja Critters.tsx siirtää peuraa sivun poikki. lift = ilmassa-aste (0…1)
siluetin leveydestä (loikkakaaren korkeus), rump/feet = lepoasennon peräpään oikea reuna ja jalkojen taso solussa.

Ajo:  python scripts/critters-extra.py   (vaatii ffmpeg, Pillow, numpy)
"""
import json, subprocess, tempfile
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src" / "critters" / "deer-flee.mp4"
START, END = 84, 110          # säikähtänyt seisoma (pää ylhäällä) → loikkia (0-pohjainen @24 fps)
X0, X1, Y0, Y1 = 0, 640, 165, 312  # rajaus 640 px leveässä kehyksessä
S = 0.9                        # lisäskaalaus (solun korkeus ≈ 132 px)
WC = 250                       # vakautetun solun leveys
COLS = 6
CYCLE_A, CYCLE_B = 13, 26      # loikkasykli (täysi loikka: jalat maassa → ilmaan → maassa), B poissulkeva

def alpha(p: Path) -> np.ndarray:
    g = np.asarray(Image.open(p).convert("L")).astype(np.float32)
    return np.clip((200 - g) / 140, 0, 1)

with tempfile.TemporaryDirectory() as d:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(SRC), "-vf", "fps=24,scale=640:-1", f"{d}/%03d.png"], check=True)
    files = sorted(Path(d).glob("*.png"))[START : END + 1]
    ch = round((Y1 - Y0) * S)
    raw, cxs = [], []
    for f in files:
        a = alpha(f)[Y0:Y1, X0:X1]
        im = Image.fromarray((a * 255).astype("uint8"), "L")
        im = im.resize((round((X1 - X0) * S), ch), Image.LANCZOS)
        arr = np.asarray(im).astype(np.float32)
        xs = np.arange(arr.shape[1])[None, :]
        cxs.append(float((arr * xs).sum() / max(1e-6, arr.sum())))
        raw.append(arr)
    cells = []
    for arr, cx in zip(raw, cxs):
        pad = np.pad(arr, ((0, 0), (WC, WC)))
        x0 = round(cx + WC - WC / 2)
        cells.append(pad[:, x0 : x0 + WC].astype("uint8"))
    n = len(cells)
    dx = [0.0] + [round(cxs[i - 1] - cxs[i], 2) for i in range(1, n)]  # eteneminen vasemmalle (solun px)
    wd = np.array([(np.ptp(np.where((c > 128).any(axis=0))[0]) if (c > 128).any() else 0) for c in cells], dtype=float)
    wd = (wd - wd.min()) / max(1e-6, wd.max() - wd.min())
    pad1 = np.pad(wd, 1, mode="edge")
    lift = (0.25 * pad1[:-2] + 0.5 * pad1[1:-1] + 0.25 * pad1[2:]) ** 1.4
    first = cells[0] > 128
    ys, xs = np.where(first)
    rump, feet, top = xs.max(), ys.max(), ys.min()
    rows = (n + COLS - 1) // COLS
    sheet = np.zeros((rows * ch, COLS * WC, 4), dtype=np.uint8)
    sheet[..., :3] = 255
    for i, c in enumerate(cells):
        r, k = divmod(i, COLS)
        sheet[r * ch : (r + 1) * ch, k * WC : (k + 1) * WC, 3] = c
    out = ROOT / "public" / "images" / "critter-deer-flee.webp"
    Image.fromarray(sheet, "RGBA").save(out, quality=80, method=6)
    cyc = dx[CYCLE_A + 1 : CYCLE_B]
    meta = {
        "deerFlee": {
            "src": "/images/critter-deer-flee.webp", "w": WC, "h": ch, "cols": COLS, "rows": rows, "frames": n,
            "rump": round(float(rump) / WC, 4), "feet": round(float(feet) / ch, 4), "deerH": round(float(feet - top), 1),
            "lift": [round(float(v), 3) for v in lift], "dx": dx,
            "cycleA": CYCLE_A, "cycleB": CYCLE_B, "cycleDx": round(float(np.mean(cyc)), 2),
        }
    }
    (ROOT / "src" / "data" / "critters-extra.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(n, "ruutua", out.stat().st_size // 1024, "kB", "cycleDx", meta["deerFlee"]["cycleDx"], "deerH", meta["deerFlee"]["deerH"])
