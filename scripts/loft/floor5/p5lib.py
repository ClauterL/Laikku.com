"""Kerros 5: apufunktiot (glTF-koordinaatit: x itä, y ylös, z etelä->pohjoinen; Blender = (x, -z, y))."""
import bpy, bmesh, math
from mathutils import Vector, Matrix

CEIL = 2.71      # uusien tilojen katon alapinta
WALL_TOP = 2.8   # seinät ulottuvat katon yläpintaan
DOOR_H = 2.3     # uusien oviaukkojen korkeus


def G(x, y, z):
    return Vector((x, -z, y))


def world_bbox(o):
    """objektin maailmabbox glTF-koordinaateissa (min, max)"""
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    gx = [p.x for p in pts]; gy = [p.z for p in pts]; gz = [-p.y for p in pts]
    return (min(gx), min(gy), min(gz)), (max(gx), max(gy), max(gz))


def center(o):
    a, b = world_bbox(o)
    return tuple((a[i] + b[i]) / 2 for i in range(3))


def meshes():
    return [o for o in bpy.data.objects if o.type == 'MESH']


def region(x0, x1, z0, z1, y0=-1.0, y1=4.0, exclude=None):
    out = []
    for o in meshes():
        if exclude and exclude(o.name):
            continue
        c = center(o)
        if x0 <= c[0] <= x1 and z0 <= c[2] <= z1 and y0 <= c[1] <= y1:
            out.append(o)
    return out


def delete(objs):
    for o in list(objs):
        bpy.data.objects.remove(o, do_unlink=True)


def gmatrix(pivot, theta, target, dy=0.0):
    """glTF-avaruuden muunnos: pivot (x,z) -> kierto y-akselin ympäri theta -> target (x,z)"""
    p = G(pivot[0], 0, pivot[1]); t = G(target[0], dy, target[1])
    return Matrix.Translation(t) @ Matrix.Rotation(theta, 4, 'Z') @ Matrix.Translation(-p)


_copy_n = [0]


def dup(objs, M, tag='p5', scale=None):
    """kopioi objektit (oma mesh-data jokaiselle valokartta-UV:ta varten) ja muunna maailmamatriisilla M"""
    out = []
    coll = bpy.context.scene.collection
    for o in objs:
        _copy_n[0] += 1
        c = o.copy()
        c.data = o.data.copy()
        base = o.name.split('.')[0]
        c.name = f'{base}__{tag}{_copy_n[0]}'
        c.parent = None
        mw = o.matrix_world.copy()
        if scale is not None:
            mw = mw @ Matrix.Diagonal((*scale, 1.0))
        c.matrix_world = M @ mw
        coll.objects.link(c)
        out.append(c)
    return out


def move(objs, M):
    for o in objs:
        o.matrix_world = M @ o.matrix_world


def mat(name):
    m = bpy.data.materials.get(name)
    if m is None:
        raise KeyError(name)
    return m


_uvs = {}


def uv_per_m(matname):
    return _uvs.get(matname, 1.0)


def measure_uv(objname, matname):
    """UV-yksikköä per metri materiaalille olemassa olevasta meshistä"""
    o = bpy.data.objects[objname]
    me = o.data
    idx = [i for i, m in enumerate(me.materials) if m and m.name == matname]
    if not idx:
        return None
    uv = me.uv_layers[0].data
    wa = ua = 0.0
    mw = o.matrix_world
    for p in me.polygons:
        if p.material_index not in idx:
            continue
        vs = [mw @ me.vertices[v].co for v in p.vertices]
        us = [uv[li].uv for li in p.loop_indices]
        for k in range(1, len(vs) - 1):
            wa += ((vs[k] - vs[0]).cross(vs[k + 1] - vs[0])).length / 2
            ua += abs((us[k] - us[0]).cross(us[k + 1] - us[0])) / 2
    if wa <= 0:
        return None
    s = math.sqrt(ua / wa)
    _uvs[matname] = s
    return s


def box(name, x0, x1, y0, y1, z0, z1, mats, faces=None):
    """akselinsuuntainen laatikko glTF-koordinaateissa. mats: oletusmateriaali tai dict suunnasta
    ('+x','-x','+y','-y','+z','-z') materiaaliin. faces: luotavat sivut (oletus kaikki)."""
    if isinstance(mats, str):
        mats = {d: mats for d in ('+x', '-x', '+y', '-y', '+z', '-z')}
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    order = []
    for d, m in mats.items():
        if m not in order:
            order.append(m)
    for m in order:
        me.materials.append(mat(m))

    def quad(pts, d, uvf):
        if faces and d not in faces:
            return
        vs = [bm.verts.new(G(*p)) for p in pts]
        f = bm.faces.new(vs)
        f.material_index = order.index(mats[d])
        s = uv_per_m(mats[d])
        for l, p in zip(f.loops, pts):
            u, v = uvf(p)
            l[uvl].uv = (u * s, v * s)

    X0, X1, Y0, Y1, Z0, Z1 = x0, x1, y0, y1, z0, z1
    # vastapäivään ulospäin katsottuna (Blenderin koordinaateissa normaali ulos)
    quad([(X1, Y0, Z0), (X1, Y1, Z0), (X1, Y1, Z1), (X1, Y0, Z1)], '+x', lambda p: (-p[2], p[1]))
    quad([(X0, Y0, Z1), (X0, Y1, Z1), (X0, Y1, Z0), (X0, Y0, Z0)], '-x', lambda p: (p[2], p[1]))
    quad([(X0, Y1, Z0), (X0, Y1, Z1), (X1, Y1, Z1), (X1, Y1, Z0)], '+y', lambda p: (p[0], p[2]))
    quad([(X0, Y0, Z1), (X0, Y0, Z0), (X1, Y0, Z0), (X1, Y0, Z1)], '-y', lambda p: (p[0], -p[2]))
    quad([(X0, Y0, Z1), (X1, Y0, Z1), (X1, Y1, Z1), (X0, Y1, Z1)], '+z', lambda p: (p[0], p[1]))
    quad([(X1, Y0, Z0), (X0, Y0, Z0), (X0, Y1, Z0), (X1, Y1, Z0)], '-z', lambda p: (-p[0], p[1]))
    bm.normal_update()
    # varmistetaan ulospäin osoittavat normaalit
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


WALLS = []  # (x0,x1,z0,z1) törmäyksiä ja kulkutarkistusta varten


def _segments(a0, a1, doors):
    segs = []
    cur = a0
    for (d0, d1) in sorted(doors):
        if d0 > cur:
            segs.append((cur, d0))
        cur = max(cur, d1)
    if cur < a1:
        segs.append((cur, a1))
    return segs


def wall_x(name, zc, x0, x1, t, mats, doors=(), top=WALL_TOP, door_h=DOOR_H):
    """seinä x-suunnassa z=zc kohdalla, paksuus t; doors = [(x0,x1), ...]"""
    z0, z1 = zc - t / 2, zc + t / 2
    objs = []
    for i, (a, b) in enumerate(_segments(x0, x1, doors)):
        objs.append(box(f'{name}_{i}', a, b, 0, top, z0, z1, mats))
        WALLS.append((a, b, z0, z1))
    for j, (a, b) in enumerate(doors):
        objs.append(box(f'{name}_l{j}', a, b, door_h, top, z0, z1, mats))
    return objs


def wall_z(name, xc, z0, z1, t, mats, doors=(), top=WALL_TOP, door_h=DOOR_H):
    x0, x1 = xc - t / 2, xc + t / 2
    objs = []
    for i, (a, b) in enumerate(_segments(z0, z1, doors)):
        objs.append(box(f'{name}_{i}', x0, x1, 0, top, a, b, mats))
        WALLS.append((x0, x1, a, b))
    for j, (a, b) in enumerate(doors):
        objs.append(box(f'{name}_l{j}', x0, x1, door_h, top, a, b, mats))
    return objs


LIGHTS = []


def kelvin(k):
    # karkea värilämpötila -> RGB
    t = k / 100.0
    r = 1.0 if t <= 66 else min(1, 1.292936 * ((t - 60) ** -0.1332047592))
    g = (0.3900815787 * math.log(t) - 0.6318414437) if t <= 66 else 1.129890861 * ((t - 60) ** -0.0755148492)
    b = 1.0 if t >= 66 else (0 if t <= 19 else 0.5432067891 * math.log(t - 10) - 1.1962540891)
    return (max(0, min(1, r)), max(0, min(1, g)), max(0, min(1, b)))


def light(kind, name, x, y, z, power, color=3000, size=0.05, spot=math.radians(110), blend=0.6, aim=None, area=(0.5, 0.5)):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = power * (3.0 if kind == 'SPOT' else 2.0 if kind == 'POINT' else 1.5)
    ld.color = kelvin(color) if isinstance(color, (int, float)) else color
    if kind == 'SPOT':
        ld.spot_size = spot
        ld.spot_blend = blend
        ld.shadow_soft_size = size
    elif kind == 'POINT':
        ld.shadow_soft_size = size
    elif kind == 'AREA':
        ld.shape = 'RECTANGLE'
        ld.size, ld.size_y = area
    o = bpy.data.objects.new(name, ld)
    o.location = G(x, y, z)
    # oletus: osoittaa alas (Blenderin valot osoittavat -Z)
    if aim is not None:
        d = (G(*aim) - o.location).normalized()
        o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.collection.objects.link(o)
    LIGHTS.append(o)
    return o


_glass_swap = []


def glass_transparent(on=True):
    """paistoa/renderöintiä varten: lasimateriaalit läpinäkyviksi (valo kulkee suoraan läpi)"""
    if on:
        tm = bpy.data.materials.get('P5_BakeTransparent')
        if tm is None:
            tm = bpy.data.materials.new('P5_BakeTransparent'); tm.use_nodes = True
            nt = tm.node_tree; nt.nodes.clear()
            out = nt.nodes.new('ShaderNodeOutputMaterial'); tr = nt.nodes.new('ShaderNodeBsdfTransparent')
            nt.links.new(tr.outputs[0], out.inputs[0])
        for o in meshes():
            for i, m in enumerate(o.data.materials):
                if m and ('Glass' in m.name and 'Black' not in m.name and 'Darkness' not in m.name):
                    _glass_swap.append((o.data, i, m)); o.data.materials[i] = tm
    else:
        for me, i, m in _glass_swap:
            me.materials[i] = m
        _glass_swap.clear()
