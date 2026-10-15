"""Loftin työjono Unrealiin (vain tämän editori-istunnon ajan).
Aja kerran Output Logissa:  py "H:/Havaida/Laikku.com/assets-src/ue/export_lightmaps.py"
Editori suorittaa sen jälkeen kansioon assets-src/ue/cmd ilmestyvät .py-työt ja kirjoittaa
tuloksen samannimiseen .out-tiedostoon. Jono poistuu, kun editori suljetaan.
"""
import builtins
import contextlib
import io
import json
import os
import time
import traceback

import unreal

ROOT = "H:/Havaida/Laikku.com/assets-src/ue"
CMD = f"{ROOT}/cmd"
os.makedirs(CMD, exist_ok=True)


def _log(msg):
    with open(f"{CMD}/bridge.log", "a", encoding="utf-8") as f:
        f.write(time.strftime("%H:%M:%S ") + msg + "\n")
    unreal.log("[loft-bridge] " + msg)


def _run(path):
    name = os.path.basename(path)
    running = path + ".run"
    os.replace(path, running)
    buf = io.StringIO()
    out = {"job": name, "started": time.strftime("%H:%M:%S")}
    try:
        with open(running, encoding="utf-8") as f:
            code = f.read()
        scope = {"__name__": "__loft_job__", "ROOT": ROOT}
        with contextlib.redirect_stdout(buf):
            exec(compile(code, name, "exec"), scope)
        out["result"] = scope.get("result")
        out["ok"] = True
    except Exception:  # noqa: BLE001
        out["ok"] = False
        out["error"] = traceback.format_exc()
    out["stdout"] = buf.getvalue()[-20000:]
    out["finished"] = time.strftime("%H:%M:%S")
    with open(path[:-3] + ".out", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1, default=str)
    _log(f"{name}: {'ok' if out['ok'] else 'VIRHE'}")


_state = {"last": 0.0}


def _tick(_dt):
    now = time.time()
    if now - _state["last"] < 2.0:
        return
    _state["last"] = now
    try:
        jobs = sorted(f for f in os.listdir(CMD) if f.endswith(".py"))
    except OSError:
        return
    for job in jobs:
        _run(os.path.join(CMD, job))


old = getattr(builtins, "_loft_bridge_handle", None)
if old is not None:
    unreal.unregister_slate_post_tick_callback(old)
builtins._loft_bridge_handle = unreal.register_slate_post_tick_callback(_tick)
_log("työjono käynnissä")
