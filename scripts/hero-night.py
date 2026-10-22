"""Hero-maiseman yöversio aloitusruudulle (Pelillistetty-valinta = revontuliyö).

Jokainen Higgsfield-taso (public/images/hero-{far,lake,mid,near,front}-3840.webp) väritetään
luminanssin mukaan omalla liukuväripaletillaan (gradient map): mitä lähempänä katsojaa, sitä
tummempi siluetti; järven aurinkojuova muuttuu revontulten turkoosiksi heijastukseksi.
Alfa säilyy, joten yötasot osuvat pikselilleen päivätasojen päälle ja parallaksi toimii samoin.
Saunan ovi maalataan lämpimäksi (valo sisällä) – hehku ja välke tulevat koodista (Landscape.tsx).

Ajo:  python scripts/hero-night.py   (vaatii Pillow + numpy)
Tulos: public/images/hero-{taso}-night-{1280,2048,3840}.webp
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "public" / "images"
SIZES = (3840, 2048, 1280)

# Luminanssi (0–255) → väri. Arvot mitattu tasojen histogrammeista (scripts-ajon tuloste ei tarvita).
MAPS: dict[str, list[tuple[float, str]]] = {
    # kaukaiset vaarat: takimmainen harjanne vaalein (ilmaperspektiivi), silti taivaanrantaa tummempi
    "far": [(0, "#050919"), (95, "#0b1331"), (100, "#0d1636"), (115, "#111c40"), (140, "#15214a"), (165, "#1b2a55"), (255, "#24365f")],
    # järvi heijastaa yötaivasta; aurinkojuova → revontulten turkoosi
    "lake": [
        (0, "#050816"),
        (130, "#0a1430"),
        (150, "#0f1d3e"),
        (165, "#142648"),
        (176, "#1a2f54"),
        (186, "#223b62"),
        (194, "#2f5a76"),
        (202, "#4f9497"),
        (210, "#93dcc8"),
        (220, "#d8fff0"),
        (255, "#f0fff8"),
    ],
    # niemi, sauna, saari ja niiden heijastukset; katto saa kuunvaloa
    "mid": [(0, "#03060f"), (60, "#070d22"), (100, "#0b1530"), (130, "#0f1d3d"), (160, "#172a4e"), (175, "#1d3358"), (192, "#2f5a76"), (212, "#6fb7ad"), (255, "#cfeee6")],
    # lähimetsä: kuuset lähes mustia, koivut erottuvat kylmänsinisinä
    "near": [(0, "#02040b"), (50, "#050917"), (60, "#070c1d"), (90, "#0b1328"), (120, "#131d36"), (160, "#1f2b47"), (255, "#2f3d5c")],
    # etualan kuuset ja kalliot
    "front": [(0, "#010206"), (25, "#03050d"), (45, "#060a17"), (255, "#121a2e")],
}

# Saunan ovi 3840 × 1118 -kuvassa (px): valaistaan sisältä
DOOR = (884, 445, 906, 502)
DOOR_LIGHT = np.array([255, 196, 110], dtype=float)


def hex_rgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=float)


def gradient_map(rgba: np.ndarray, stops: list[tuple[float, str]]) -> np.ndarray:
    lum = 0.299 * rgba[..., 0] + 0.587 * rgba[..., 1] + 0.114 * rgba[..., 2]
    xs = np.array([s[0] for s in stops])
    cols = np.stack([hex_rgb(s[1]) for s in stops])
    out = rgba.copy()
    for c in range(3):
        out[..., c] = np.interp(lum, xs, cols[:, c])
    return out


def main() -> None:
    for name, stops in MAPS.items():
        src = Image.open(IMG / f"hero-{name}-3840.webp").convert("RGBA")
        a = np.asarray(src).astype(float)
        night = gradient_map(a, stops)
        if name == "mid":
            x0, y0, x1, y1 = DOOR
            region = a[y0:y1, x0:x1]
            lum = 0.299 * region[..., 0] + 0.587 * region[..., 1] + 0.114 * region[..., 2]
            k = np.clip((lum - 150) / 50, 0, 1)[..., None]
            night[y0:y1, x0:x1, :3] = night[y0:y1, x0:x1, :3] * (1 - k) + DOOR_LIGHT * k
        img = Image.fromarray(np.clip(night, 0, 255).astype(np.uint8), "RGBA")
        for w in SIZES:
            h = round(img.height * w / img.width)
            out = img if w == img.width else img.resize((w, h), Image.LANCZOS)
            path = IMG / f"hero-{name}-night-{w}.webp"
            out.save(path, "WEBP", quality=80, method=6, alpha_quality=90)
            print(f"{path.relative_to(ROOT)}  {out.width}×{out.height}  {path.stat().st_size // 1024} kt")


if __name__ == "__main__":
    main()
