"""Aloitusruudun videotausta: auringonlasku ↔ revontuliyö -siirtymä ja yön silmukka (Higgsfield-videoista).

Siirtymä on esirenderöity video, koska kahden kuvatasopinon ristihäivytys revontulten ja korttien alla ylitti
näytönohjaimen muistin (kortit katosivat, taivas leikkautui, kuva nyki). Video puretaan laitteistolla yhtenä tasona.

Lähteet (assets-src/start/, ei repossa):
  day.png, night.png  aloitusruudun kuvakaappaukset 1920×1080 @2x ilman käyttöliittymää ja eläviä yksityiskohtia
                      (drone, välke, savu, linnut, tulikärpäset, tähdenlento) – alku- ja loppuruutu Higgsfieldille
  dn.mp4              MiniMax H3 2K, alku = day.png, loppu = night.png: aurinko laskee, iltarusko, revontulet syttyvät
  loop.mp4            MiniMax H3 2K, alku = loppu = dn.mp4:n viimeinen ruutu: revontulet aaltoilevat
Ajo:   python scripts/start-video.py      (vaatii ffmpeg, numpy, opencv-python, Pillow)
Tulos:
  public/video/start-dn-{1280,1920}.{mp4,webm}  siirtymä (paikallaan olevat alku/loppu rajattu, sini-easing)
  public/video/start-nd-{1280,1920}.{mp4,webm}  sama ruutu ruudulta käänteisenä → suunnan voi vaihtaa kesken
  public/video/start-loop-{1280,1920}.{mp4,webm} yön silmukka (sauma ristihäivytetty)
  public/images/start-{day,night}-{1280,1920,2560}.webp   lepokuvat = siirtymän ensimmäinen / viimeinen ruutu
  src/data/start-sky.json   fps, ruutujen määrä ja taivaan yläreunan väri ruuduittain (korkean näkymän täyttö)
"""

import json
import shutil
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src" / "start"
VIDEO = ROOT / "public" / "video"
IMG = ROOT / "public" / "images"
DATA = ROOT / "src" / "data" / "start-sky.json"

#: videoiden leveydet (iso näyttö / puhelin) ja lepokuvien leveydet
WIDTHS = (1920, 1280)
STILL_WIDTHS = (2560, 1920, 1280)
FPS = 24
#: siirtymän luonnollinen kesto (s) – ensimmäinen hämärä soi tällä, myöhemmät nopeammin (playbackRate)
DURATION = 2.8
#: silmukan saumaan ristihäivytettävä pätkä (ruutuina lähteen nopeudella)
LOOP_XFADE = 14


def read_frames(path: Path) -> tuple[list[np.ndarray], float]:
    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    cap.release()
    if not frames:
        raise SystemExit(f"{path}: ei ruutuja")
    return frames, fps


def progress(frames: list[np.ndarray]) -> np.ndarray:
    """Kuinka pitkällä kukin ruutu on alusta loppuun (projektio pienennetyssä koossa)"""
    small = [cv2.resize(f, (320, 180), interpolation=cv2.INTER_AREA).astype(np.float32) for f in frames]
    a, b = small[0], small[-1]
    d = (b - a).ravel()
    return np.array([float((s - a).ravel() @ d / (d @ d)) for s in small])


def encode(seq: Path, out: Path, width: int, fps: float, gop: int, crf: int) -> None:
    """H.264 (.mp4, laitteistopurku kaikkialla) ja VP9 (.webm, selaimet ilman H.264:ää, esim. avoin Chromium)"""
    common = ["ffmpeg", "-v", "error", "-y", "-framerate", str(fps), "-i", str(seq / "%04d.png"), "-vf", f"scale={width}:-2:flags=lanczos"]
    # lyhyt avainruutuväli: suunnan vaihto kesken siirtymän hakee vastaavan ruudun nopeasti
    gop_args = ["-g", str(gop), "-keyint_min", str(gop)]
    subprocess.run(
        [
            *common,
            "-c:v", "libx264", "-preset", "veryslow", "-crf", str(crf),
            "-profile:v", "high", "-pix_fmt", "yuv420p", *gop_args, "-sc_threshold", "0",
            # tummien liukuvärien raidoitus pois
            "-x264-params", "aq-mode=3:aq-strength=1.1",
            "-movflags", "+faststart", "-an", str(out.with_suffix(".mp4")),
        ],
        check=True,
    )
    subprocess.run(
        [
            *common,
            "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", str(crf + 9), "-row-mt", "1",
            "-deadline", "good", "-cpu-used", "1", "-pix_fmt", "yuv420p", *gop_args, "-an", str(out.with_suffix(".webm")),
        ],
        check=True,
    )


def write_seq(frames: list[np.ndarray], folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for i, f in enumerate(frames):
        cv2.imwrite(str(folder / f"{i:04d}.png"), f, [cv2.IMWRITE_PNG_COMPRESSION, 1])


def still(frame: np.ndarray, name: str) -> None:
    im = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    for w in STILL_WIDTHS:
        h = round(w * im.height / im.width)
        im.resize((w, h), Image.LANCZOS).save(IMG / f"start-{name}-{w}.webp", quality=86, method=6)


def top_color(frame: np.ndarray) -> str:
    """Taivaan yläreunan keskiväri (ylin 2 %) – korkeassa näkymässä videon yläpuolinen täyttö"""
    rows = max(2, frame.shape[0] // 50)
    b, g, r = frame[:rows].reshape(-1, 3).mean(0)
    return f"#{int(round(r)):02x}{int(round(g)):02x}{int(round(b)):02x}"


def transition(tmp: Path) -> dict:
    frames, _ = read_frames(SRC / "dn.mp4")
    p = progress(frames)
    # paikallaan olevat alku ja loppu pois: liike alkaa, kun edistyminen ylittää 0,5 %, ja loppuu 99,5 %:ssa
    a = int(np.nonzero(p > 0.005)[0][0]) - 1
    b = int(np.nonzero(p > 0.995)[0][0]) + 1
    a, b = max(a, 0), min(b, len(frames) - 1)
    n = round(DURATION * FPS) + 1
    out = []
    for k in range(n):
        u = k / (n - 1)
        e = 0.5 - 0.5 * np.cos(np.pi * u)  # sini-easing: pehmeä lähtö ja pysähdys
        s = a + e * (b - a)
        i = int(np.floor(s))
        j = min(i + 1, b)
        w = s - i
        f = frames[i] if w < 1e-3 else cv2.addWeighted(frames[i], 1 - w, frames[j], w, 0)
        out.append(f)
    print(f"siirtymä: lähteen ruudut {a}–{b} / {len(frames)} → {n} ruutua @ {FPS} fps")
    write_seq(out, tmp / "dn")
    write_seq(out[::-1], tmp / "nd")
    for w in WIDTHS:
        encode(tmp / "dn", VIDEO / f"start-dn-{w}.mp4", w, FPS, 8, 25)
        encode(tmp / "nd", VIDEO / f"start-nd-{w}.mp4", w, FPS, 8, 25)
    still(out[0], "day")
    still(out[-1], "night")
    return {"fps": FPS, "frames": n, "top": [top_color(f) for f in out]}


def loop(tmp: Path) -> dict:
    frames, fps = read_frames(SRC / "loop.mp4")
    x = LOOP_XFADE
    n = len(frames)
    out = []
    # out[i] = frames[i + x]; viimeiset x ruutua ristihäivytetään alkuun → out[-1] → out[0] ilman saumaa
    for i in range(n - x):
        f = frames[i + x]
        if i >= n - 2 * x:
            j = i - (n - 2 * x)
            w = (j + 1) / (x + 1)
            f = cv2.addWeighted(f, 1 - w, frames[j], w, 0)
        out.append(f)
    print(f"silmukka: {n} → {len(out)} ruutua @ {fps:g} fps")
    write_seq(out, tmp / "loop")
    for w in WIDTHS:
        encode(tmp / "loop", VIDEO / f"start-loop-{w}.mp4", w, fps, round(fps * 2), 25)
    return {"loopFps": fps, "loopFrames": len(out)}


def main() -> None:
    VIDEO.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="start-video-"))
    try:
        meta = transition(tmp)
        meta |= loop(tmp)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    DATA.write_text(json.dumps(meta, separators=(",", ":")) + "\n", encoding="utf-8")
    for f in sorted(VIDEO.glob("start-*")) + sorted(IMG.glob("start-*.webp")):
        print(f"{f.relative_to(ROOT)}  {f.stat().st_size / 1024:.0f} kt")


if __name__ == "__main__":
    main()
