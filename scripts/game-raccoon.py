"""Dronelennon pesukarhun eleet Higgsfield-videoista → public/images/game/raccoon.webp + src/data/game-raccoon.json.

Lähteet (Kling 3.0 pro, 5 s, 24 fps, mustasta siluetista aloitus- ja lopetusruuduksi, paikallaan pysyvä kamera):
  assets-src/game/video/{wave,point,cheer,look}.mp4  – vilkutus, osoitus, tuuletushyppy, katse taivaalle
Ruudut kynnystetään siluetiksi (valkoinen + alfa, näytetään CSS-maskina currentColor-värillä kuten Critters.tsx),
alun ja lopun lepoasento sekä peräkkäiset lähes samat ruudut yhdistetään (ms = ruudun kesto).
Kaikki klipit skaalataan samaan mittakaavaan ja ankkuroidaan lepoasennon tassuihin, joten klipistä toiseen ei hypi.

Ajo:  python scripts/game-raccoon.py assets-src/game/video   (vaatii ffmpeg, Pillow, numpy)
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CLIPS = ["wave", "point", "cheer", "look"]
FPS = 24
REST_H = 84  # lepoasennon korkeus soluissa (px; näytöllä ~45–60 px, riittää 2x-näytölle)
SAME = 0.0012  # osuus pikseleistä, jonka alle ruudut katsotaan samoiksi (pienempi = sulavampi)
COLS = 20


def frames(video: Path) -> list[np.ndarray]:
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), f"{d}/%04d.png"], check=True)
        out = []
        for p in sorted(Path(d).glob("*.png")):
            im = Image.open(p).convert("L")
            im = im.resize((im.width // 3, im.height // 3), Image.LANCZOS)  # 1440 → 480, riittää ~112 px soluun
            g = np.asarray(im).astype(np.float32)
            out.append(np.clip((200 - g) / 140, 0, 1))  # tumma = karhu
        return out


def bbox(a: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(a > 0.5)
    return xs.min(), ys.min(), xs.max(), ys.max()


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "assets-src" / "game" / "video")
    data = {c: frames(src / f"{c}.mp4") for c in CLIPS}

    # mittakaava ja ankkuri wave-klipin ensimmäisestä ruudusta (lepoasento)
    rest = data["wave"][0]
    x0, y0, x1, y1 = bbox(rest)
    scale = REST_H / (y1 - y0 + 1)
    foot_x = (x0 + x1) / 2  # lepoasennon keskikohta
    foot_y = y1

    clips_out: dict[str, list[np.ndarray]] = {}
    ms_out: dict[str, list[int]] = {}
    union = [np.inf, np.inf, -np.inf, -np.inf]
    for c in CLIPS:
        fr = data[c]
        r0 = fr[0]
        # lepoasennossa olevat ruudut alusta ja lopusta pois (yksi lepoasento jää alkuun)
        diff0 = [np.mean(np.abs(f - r0) > 0.5) for f in fr]
        moving = [i for i, d in enumerate(diff0) if d > SAME]
        a, b = (moving[0] - 1, moving[-1] + 1) if moving else (0, 0)
        a, b = max(0, a), min(len(fr) - 1, b)
        keep, ms = [], []
        for i in range(a, b + 1):
            f = fr[i]
            if keep and np.mean(np.abs(f - keep[-1]) > 0.5) < SAME:
                ms[-1] += 1000 / FPS
                continue
            keep.append(f)
            ms.append(1000 / FPS)
        clips_out[c] = keep
        ms_out[c] = [round(m) for m in ms]
        for f in keep:
            bx0, by0, bx1, by1 = bbox(f)
            union = [min(union[0], bx0), min(union[1], by0), max(union[2], bx1), max(union[3], by1)]
        print(f"{c}: {len(fr)} → {len(keep)} ruutua, {sum(ms) / 1000:.2f} s")

    # solu: kaikkien ruutujen yhteinen rajaus + 4 px reunaa, skaalattuna
    ux0, uy0, ux1, uy1 = union
    pad = 4 / scale
    ux0, uy0, ux1, uy1 = ux0 - pad, uy0 - pad, ux1 + pad, foot_y + 1
    cw = int(np.ceil((ux1 - ux0) * scale))
    ch = int(np.ceil((uy1 - uy0) * scale))
    total = sum(len(v) for v in clips_out.values())
    rows = int(np.ceil(total / COLS))
    sheet = np.zeros((rows * ch, COLS * cw), dtype=np.uint8)
    meta_clips = {}
    k = 0
    for c in CLIPS:
        start = k
        for f in clips_out[c]:
            P = 64  # reunus, ettei rajaus mene kuvan ulkopuolelle (hyppy käy lähellä yläreunaa)
            fp = np.pad(f, P)
            crop = fp[int(round(uy0)) + P : int(round(uy1)) + P, int(round(ux0)) + P : int(round(ux1)) + P]
            img = Image.fromarray((crop * 255).astype(np.uint8)).resize((cw, ch), Image.LANCZOS)
            r, q = divmod(k, COLS)
            sheet[r * ch : (r + 1) * ch, q * cw : (q + 1) * cw] = np.asarray(img)
            k += 1
        meta_clips[c] = {"start": start, "count": k - start, "ms": ms_out[c]}

    alpha = Image.fromarray(sheet)
    white = Image.new("L", alpha.size, 255)
    out = Image.merge("RGBA", (white, white, white, alpha))
    dst = ROOT / "public" / "images" / "game" / "raccoon.webp"
    out.save(dst, "WEBP", lossless=True, method=6)
    meta = {
        "w": cw,
        "h": ch,
        "cols": COLS,
        "rows": rows,
        "frames": total,
        # lepoasennon tassujen keskikohta solun leveydestä ja lepoasennon korkeus solun korkeudesta
        "footX": round((foot_x - ux0) / (ux1 - ux0), 4),
        "restH": round(REST_H / ch, 4),
        "clips": meta_clips,
    }
    (ROOT / "src" / "data" / "game-raccoon.json").write_text(json.dumps(meta, separators=(",", ":")) + "\n")
    print(f"{dst.relative_to(ROOT)}  {out.width}×{out.height}  {dst.stat().st_size // 1024} kt, solu {cw}×{ch}, {total} ruutua")


if __name__ == "__main__":
    main()
