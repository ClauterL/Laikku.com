"""Kerros 5: törmäykset todellisesta geometriasta (ei solmujen AABB:stä, jotka tukkivat oviaukot ja L-muotoiset ikkunat).
Kolmiot leikataan hahmon korkeusvyöhykkeelle, näytteistetään 5 cm ruudukkoon ja yhdistetään ahneesti suorakulmioiksi.
python -c "import sys; sys.argv=['x','blend=s2_baked.blend','out=colliders.json']; exec(open('s4_colliders.py').read())" """
import bpy, sys, re, json, math
import numpy as np
ARGS = dict(a.split('=', 1) for a in sys.argv if '=' in a)
BL = '/home/claude/work/p5/bl'
bpy.ops.wm.open_mainfile(filepath=f"{BL}/{ARGS.get('blend', 's2_baked.blend')}")
OUT = ARGS.get('out', '/home/claude/work/p5/out/colliders.json')

C = 0.05
X0, X1, Z0, Z1 = -4.6, 4.6, -5.45, 18.0
NX, NZ = int(round((X1 - X0) / C)), int(round((Z1 - Z0) / C))
Y_LO, Y_HI = 0.22, 1.75          # hahmon kapseli ~0.25 ... 1.67 m
CAM_H = 1.9                       # kameran esteiksi vain korkeat seinämäiset kappaleet
SKIP = re.compile(r'^(SM_Floor|P5_Floor|SM_Ceiling|P5_Ceil|P5_Beam|SM_Carpet|SM_.*Rug|SM_Light_?Switch|SM_LightSwitch|SM_Socket|SM_Ray_|SM_Environment)')
WALLISH = re.compile(r'^(SM_Wall|P5_Wall|P5_Tiles|P5_Panel|SM_Glass_windows|SM_Backdrop|SM_Metal_frame_glass|SM_Balcony|SM_Kitchen_laminate|SM_Closet_metal|SM_Slidingdoor)')

solid = np.zeros((NX, NZ), np.uint8)
camg = np.zeros((NX, NZ), np.uint8)


def mark(grid, P):
    """P: (n,3) maailmapisteet glTF-koordinaateissa"""
    i = np.floor((P[:, 0] - X0) / C).astype(int); j = np.floor((P[:, 2] - Z0) / C).astype(int)
    ok = (i >= 0) & (i < NX) & (j >= 0) & (j < NZ)
    grid[i[ok], j[ok]] = 1


used = 0
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    base = o.name.split('__')[0].split('.')[0]
    if SKIP.match(base):
        continue
    me = o.data
    me.calc_loop_triangles()
    n = len(me.loop_triangles)
    if not n:
        continue
    V = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', V); V = V.reshape(-1, 3)
    M = np.array(o.matrix_world)
    W = V @ M[:3, :3].T + M[:3, 3]
    G = np.stack([W[:, 0], W[:, 2], -W[:, 1]], 1)  # Blender -> glTF
    T = np.empty(n * 3, np.int32); me.loop_triangles.foreach_get('vertices', T); T = T.reshape(-1, 3)
    A, B, Cc = G[T[:, 0]], G[T[:, 1]], G[T[:, 2]]
    # vain kolmiot, jotka osuvat korkeusvyöhykkeelle
    ymin = np.minimum(np.minimum(A[:, 1], B[:, 1]), Cc[:, 1]); ymax = np.maximum(np.maximum(A[:, 1], B[:, 1]), Cc[:, 1])
    keep = (ymax >= Y_LO) & (ymin <= Y_HI)
    if not keep.any():
        continue
    A, B, Cc = A[keep], B[keep], Cc[keep]
    wall = bool(WALLISH.match(base))
    tall = (G[:, 1].max() - G[:, 1].min()) > CAM_H
    # tiheä näytteistys: askel ~3 cm reunan pituuden mukaan
    L = np.maximum(np.linalg.norm(B - A, axis=1), np.linalg.norm(Cc - A, axis=1))
    for k in np.unique(np.clip(np.ceil(L / 0.03).astype(int), 1, 200)):
        sel = np.clip(np.ceil(L / 0.03).astype(int), 1, 200) == k
        a, b, c = A[sel], B[sel], Cc[sel]
        us, vs = np.meshgrid(np.linspace(0, 1, k + 1), np.linspace(0, 1, k + 1))
        m = (us + vs) <= 1.0
        us, vs = us[m], vs[m]
        P = a[:, None, :] + (b - a)[:, None, :] * us[None, :, None] + (c - a)[:, None, :] * vs[None, :, None]
        P = P.reshape(-1, 3)
        P = P[(P[:, 1] >= Y_LO) & (P[:, 1] <= Y_HI)]
        if len(P):
            mark(solid, P)
            if wall and tall:
                mark(camg, P)
    used += 1


def rects(grid):
    g = grid.copy(); out = []
    for i in range(NX):
        j = 0
        while j < NZ:
            if not g[i, j]:
                j += 1; continue
            j1 = j
            while j1 + 1 < NZ and g[i, j1 + 1]:
                j1 += 1
            i1 = i
            while i1 + 1 < NX and g[i1 + 1, j:j1 + 1].all():
                i1 += 1
            g[i:i1 + 1, j:j1 + 1] = 0
            out.append((X0 + i * C, X0 + (i1 + 1) * C, Z0 + j * C, Z0 + (j1 + 1) * C))
            j = j1 + 1
    return out


S = rects(solid); K = rects(camg)
box = lambda r, y0, y1: [round((r[0] + r[1]) / 2, 3), round((y0 + y1) / 2, 3), round((r[2] + r[3]) / 2, 3), round((r[1] - r[0]) / 2, 3), round((y1 - y0) / 2, 3), round((r[3] - r[2]) / 2, 3)]
json.dump({'solid': [box(r, 0.0, 2.0) for r in S], 'camera': [box(r, 0.0, 2.8) for r in K]}, open(OUT, 'w'), separators=(',', ':'))
np.save(OUT.replace('.json', '_grid.npy'), solid)
print('objects', used, 'solid boxes', len(S), 'camera boxes', len(K), 'cells', int(solid.sum()))
