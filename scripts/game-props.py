"""Dronelennon liikkuvat osat → public/images/game/*.webp (päivä + yö).

1) Järvellä liikkuvat veneet: assets-src/game/props/raw/<nimi>.png – Higgsfield GPT Image 2.5, sivukuva puhtaalla
   valkoisella taustalla (tyyliviitteenä hero-maisema ja työpaja-kohde). Tausta = reunoihin yhteydessä oleva lähes
   valkoinen alue (täyttö reunoilta), joten purjeiden vaaleat kohdat pysyvät kiinteinä. Yöversio samalla
   liukuvärillä kuin muut kohteet (scripts/game-assets.py → night).

2) Sataman jako kerroksiksi, jotta vene voi keinua ja lippu liehua: luetaan game-assets.py:n tulokset
   harbor.webp / harbor-night.webp ja kirjoitetaan
     harbor-boat(-night).webp  purjevene (laiturin takana; laiturin peittämä kaistale täytetään reunan väreillä,
                               ettei keinunta paljasta rakoa)
     harbor-pier(-night).webp  laituri, lipputanko ja köysi ilman venettä ja maalattua viiriä
   Raja on mitattu kuvan pikseliväreistä (laiturin lankut oranssit, palkki tumma, rungon laudat purppuraiset).

Ajo:  python scripts/game-props.py   (vaatii Pillow, numpy, scipy; aja game-assets.py:n jälkeen)
"""

import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images" / "game"
SRC = ROOT / "assets-src" / "game" / "props" / "raw"

_spec = importlib.util.spec_from_file_location("game_assets", Path(__file__).with_name("game-assets.py"))
ga = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ga)  # type: ignore[union-attr]

# nimi → suurin koko (leveys, korkeus)
PROPS = {"rowboat": (560, 260), "sailboat": (420, 620), "waterdrone": (620, 300)}


def cut(path: Path) -> np.ndarray:
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(float)
    dist = (255 - rgb).max(axis=2)
    lab, n = ndimage.label(dist < 36)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    ids = np.arange(1, n + 1)
    holes = ids[(ndimage.sum(dist < 36, lab, ids) >= 250) & (ndimage.median(dist, lab, ids) <= 3)]
    bg |= np.isin(lab, holes)
    a = np.where(bg, ga.smoothstep(6, 36, dist), 1.0)
    a = np.where(a < 0.05, 0, a)
    safe = np.maximum(a, 1e-3)[..., None]
    fg = np.clip(np.where(a[..., None] < 0.999, (rgb - (1 - a[..., None]) * 255) / safe, rgb), 0, 255)
    rgba = np.dstack([fg, a * 255])
    ys, xs = np.where(rgba[..., 3] > 10)
    return rgba[ys.min() : ys.max() + 1, max(0, xs.min() - 4) : xs.max() + 5]


def props() -> None:
    for name, size in PROPS.items():
        day = cut(SRC / f"{name}.png")
        ga.save(day, OUT / f"{name}.webp", size)
        ga.save(ga.night(day), OUT / f"{name}-night.webp", size)


def deck_top(x: np.ndarray) -> np.ndarray:
    """laiturin kannen yläreuna (kuvan px) rungon kohdalla: 921 vasemmalla → 926 kannen päässä"""
    return 921 + (x - 440) * 5 / 200


def harbor() -> None:
    day = np.asarray(Image.open(OUT / "harbor.webp").convert("RGBA")).astype(float)
    nite = np.asarray(Image.open(OUT / "harbor-night.webp").convert("RGBA")).astype(float)
    h, w = day.shape[:2]
    assert (w, h) == (900, 1163), (w, h)
    yy, xx = np.mgrid[0:h, 0:w]
    plank = (xx >= 440) & (xx < 641) & (yy >= deck_top(xx)) & (yy < 959)
    beam = (xx < 625) & (yy >= 959) & (yy < 990)
    legs = (xx < 613) & (yy >= 990)
    pier = plank | beam | legs | (xx < 440)
    boat = (~pier) & (day[..., 3] > 0)
    flag = (xx >= 120) & (xx <= 345) & (yy >= 214) & (yy <= 352)

    for src, suffix in ((day, ""), (nite, "-night")):
        b = src.copy()
        b[..., 3] = np.where(boat, src[..., 3], 0)
        # laiturin peittämä kaistale täytetään: kannen yläreunan alle 12 riviä ylemmän rivin väreillä,
        # kannen ja palkin oikean pään taakse 12 saraketta oikeanpuoleisen sarakkeen väreillä
        for x in range(440, 641):
            top = int(np.ceil(deck_top(np.array(x))))
            row = b[top - 1, x]
            if row[3] > 0:
                b[top : top + 12, x] = row
        for y in range(926, 990):
            edge = 641 if y < 959 else 625
            col = b[y, edge + 1]
            if col[3] > 0:
                b[y, edge - 12 : edge + 1] = col
        p = src.copy()
        p[..., 3] = np.where(boat | flag, 0, src[..., 3])
        ga.save(b, OUT / f"harbor-boat{suffix}.webp", (900, 1163))
        ga.save(p, OUT / f"harbor-pier{suffix}.webp", (900, 1163))


if __name__ == "__main__":
    props()
    harbor()
