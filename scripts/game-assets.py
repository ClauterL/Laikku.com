"""Dronelento-pelin kuvat Higgsfield-lähteistä → public/images/game/*.webp (päivä + yö).

Lähteet (eivät ole repossa, ks. assets-src/game/):
  raw/<nimi>.png  Higgsfield GPT Image 2.5 -kuva puhtaalla valkoisella taustalla (tyyliviite: hero-maisema)
  cut/<nimi>.png  sama kuva Higgsfieldin taustanpoistolla

Alfa = max(Higgsfieldin maski, valkoisen avainnus). Higgsfieldin poisto hoitaa valkoiset osat (majakan torni),
avainnus palauttaa sen poistamat tummat puut. Reunapikseleistä poistetaan valkoinen sekoitus, ettei yöllä näy
vaaleaa sädekehää. Yöversio väritetään luminanssin liukuvärillä (kuten scripts/hero-night.py), mutta lämpimät
valot (tuli, lyhty, majakan lamppu, työpajan ikkuna) jätetään hehkumaan.

Ajo:  python scripts/game-assets.py assets-src/game
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images" / "game"

# nimi → (suurin leveys, suurin korkeus)
ASSETS = {
    "dock": (1200, 800),
    "sauna": (1200, 900),
    "workshop": (1200, 1000),
    "island": (1200, 800),
    "shed": (1100, 1000),
    "harbor": (900, 1200),
    "campfire": (1200, 900),
    "tower": (800, 1400),
    "lighthouse": (900, 1100),
    "drone": (640, 400),
    "shore": (2688, 600),
    "forest": (2688, 700),
}

NIGHT = [(0, "#04070f"), (40, "#080e24"), (70, "#0d1633"), (100, "#142046"), (130, "#1c2c58"), (160, "#283f6c"), (185, "#38587e"), (210, "#5b8d9c"), (235, "#a3dccd"), (255, "#e2f6f0")]


def hex_rgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=float)


def smoothstep(e0: float, e1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def cutout(raw: Image.Image, cut: Image.Image) -> np.ndarray:
    rgb = np.asarray(raw.convert("RGB")).astype(float)
    ai = np.asarray(cut.convert("RGBA").resize(raw.size)).astype(float)[..., 3] / 255
    dist = (255 - rgb).max(axis=2)  # kuinka kaukana valkoisesta
    key = smoothstep(14, 58, dist)
    a = np.maximum(ai, key)
    # valkoisen sekoituksen poisto reunoilta: C = a·F + (1 − a)·255
    safe = np.maximum(a, 1e-3)[..., None]
    fg = np.where(a[..., None] < 0.999, (rgb - (1 - a[..., None]) * 255) / safe, rgb)
    fg = np.clip(fg, 0, 255)
    # erittäin haaleat reunat pois (yksittäiset harmaat pisteet)
    a = np.where(a < 0.04, 0, a)
    return np.dstack([fg, a * 255])


def night(rgba: np.ndarray) -> np.ndarray:
    rgb = rgba[..., :3]
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    xs = np.array([s[0] for s in NIGHT])
    cols = np.stack([hex_rgb(s[1]) for s in NIGHT])
    out = rgba.copy()
    for c in range(3):
        out[..., c] = np.interp(lum, xs, cols[:, c])
    # lämpimät valot hehkumaan: kirkas + selvästi lämmin (punainen ≫ sininen)
    warm = smoothstep(165, 205, lum) * smoothstep(60, 115, rgb[..., 0] - rgb[..., 2]) * smoothstep(205, 238, rgb[..., 0])
    glow = np.clip(rgb * 1.05 + np.array([6, 0, -10]), 0, 255)
    out[..., :3] = out[..., :3] * (1 - warm[..., None]) + glow * warm[..., None]
    return out


def crop_alpha(rgba: np.ndarray, pad: int = 6) -> np.ndarray:
    a = rgba[..., 3]
    ys, xs = np.where(a > 10)
    y0, y1 = max(0, ys.min() - pad), min(a.shape[0], ys.max() + 1)  # alareuna = vesiraja, ei tyhjää
    x0, x1 = max(0, xs.min() - pad), min(a.shape[1], xs.max() + 1 + pad)
    return rgba[y0:y1, x0:x1]


def save(rgba: np.ndarray, path: Path, size: tuple[int, int]) -> None:
    img = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA")
    img.thumbnail(size, Image.LANCZOS)
    img.save(path, "WEBP", quality=84, method=6, alpha_quality=95)
    print(f"{path.relative_to(ROOT)}  {img.width}×{img.height}  {path.stat().st_size // 1024} kt")


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "assets-src" / "game")
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in ASSETS.items():
        raw = Image.open(src / "raw" / f"{name}.png")
        cut = Image.open(src / "cut" / f"{name}.png")
        day = crop_alpha(cutout(raw, cut))
        if name in ("shore", "forest"):
            # nauhat: koko leveys, alareuna tasaiseksi (viimeiset rivit voivat olla valkoista reunaa)
            a = day[..., 3]
            rows = np.where((a > 200).mean(axis=1) > 0.98)[0]
            if len(rows):
                day = day[: rows.max() + 1]
        save(day, OUT / f"{name}.webp", size)
        save(night(day), OUT / f"{name}-night.webp", size)


if __name__ == "__main__":
    main()
