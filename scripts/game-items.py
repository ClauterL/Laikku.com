"""Dronelennon Tavarat-esineet (aitta) Higgsfield-kuvista → public/images/game/items/<id>.webp.

Lähteet: assets-src/game/items/<id>.png – Higgsfield GPT Image 2.5, 1:1, puhdas valkoinen tausta, tyyliviitteinä
hero-maisema ja pelin työpaja-kohde (litteä auringonlaskun kuvitus, ei tekstiä eikä logoja; ohjelmistot esineinä).
Tausta = reunaan yhteydessä oleva lähes valkoinen alue (täyttö reunoilta) sekä esineen sisään jäävät
puhtaanvalkoiset aukot (kuulokkeiden kaari, avainrengas …); esineen omat vaaleat, lämpimät kohdat pysyvät kiinteinä. Reunoilta poistetaan valkoinen sekoitus, esine rajataan ja keskitetään neliöön.

Ajo:  python scripts/game-items.py assets-src/game/items   (vaatii Pillow, numpy, scipy)
Kahvijahdin herkut ja muotokuvat samalla leikkauksella:  python scripts/game-items.py assets-src/quest public/images/quest
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images" / "game" / "items"
SIZE = 256


def smoothstep(e0: float, e1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def cut(path: Path) -> Image.Image:
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(float)
    dist = (255 - rgb).max(axis=2)
    near = dist < 36
    lab, n = ndimage.label(near)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    ids = np.arange(1, n + 1)
    area = ndimage.sum(near, lab, ids)
    med = ndimage.median(dist, lab, ids)
    holes = ids[(area >= 250) & (med <= 3)]
    bg |= np.isin(lab, holes)
    a = np.where(bg, smoothstep(6, 36, dist), 1.0)
    a = np.where(a < 0.05, 0, a)
    safe = np.maximum(a, 1e-3)[..., None]
    fg = np.clip(np.where(a[..., None] < 0.999, (rgb - (1 - a[..., None]) * 255) / safe, rgb), 0, 255)
    rgba = np.dstack([fg, a * 255]).astype(np.uint8)
    ys, xs = np.where(a > 0.1)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    img = Image.fromarray(rgba, "RGBA").crop((x0, y0, x1, y1))
    side = int(max(img.width, img.height) * 1.08)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "assets-src" / "game" / "items")
    out = ROOT / sys.argv[2] if len(sys.argv) > 2 else OUT
    out.mkdir(parents=True, exist_ok=True)
    for p in sorted(src.glob("*.png")):
        img = cut(p)
        dst = out / f"{p.stem}.webp"
        img.save(dst, "WEBP", quality=88, method=6, alpha_quality=95)
        print(f"{dst.relative_to(ROOT)}  {dst.stat().st_size // 1024} kt")


if __name__ == "__main__":
    main()
