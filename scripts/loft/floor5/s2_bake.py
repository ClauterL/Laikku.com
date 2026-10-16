"""Kerros 5: valokartta-UV:t, Cycles-paisto, kohinanpoisto ja glTF-vienti.
python -c "import sys; sys.argv=['x','res=2048','spp=64']; exec(open('s2_bake.py').read())" """
import os
WORK = os.environ.get('P5_WORK', os.path.abspath('work5'))  # työkansio: apt-named.glb, bl/*.blend, out/
HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
import bpy, bmesh, sys, math, json, time
import numpy as np
sys.path.insert(0, HERE)
import importlib, p5lib
importlib.reload(p5lib)
from p5lib import *

ARGS = dict(a.split('=', 1) for a in sys.argv if '=' in a)
RES = int(ARGS.get('res', 2048))
SPP = int(ARGS.get('spp', 64))
DRY = ARGS.get('dry') == '1'
OUT = WORK + '/out'
import os
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=WORK + '/bl/s1.blend')
sc = bpy.context.scene
O = bpy.data.objects
MS = [o for o in O if o.type == 'MESH']
t0 = time.time()

# 0) oma mesh-data ja mittakaava meshiin
for o in MS:
    if o.data.users > 1:
        o.data = o.data.copy()
bpy.ops.object.select_all(action='DESELECT')
for o in MS:
    o.select_set(True)
bpy.context.view_layer.objects.active = MS[0]
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# 1) uusien laatikoiden piilopinnat pois (lattian alapinta, seinien ylä- ja alapinnat)
for o in MS:
    if not o.name.startswith('P5_'):
        continue
    bm = bmesh.new(); bm.from_mesh(o.data)
    mw = o.matrix_world
    kill = []
    for f in bm.faces:
        n = (mw.to_3x3() @ f.normal).normalized(); c = mw @ f.calc_center_median()
        if n.z > 0.9 and c.z > WALL_TOP - 0.005:
            kill.append(f)
        elif n.z < -0.9 and c.z < 0.002:
            kill.append(f)
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    bm.to_mesh(o.data); bm.free()


def is_glass(m):
    return m is not None and 'Glass' in m.name and 'Black' not in m.name and 'Darkness' not in m.name


# 2) valokarttaan tulevat objektit: kaikki paitsi pelkkää lasia olevat
LM = [o for o in MS if not all(is_glass(m) for m in o.data.materials) and len(o.data.polygons) > 0]
print('lightmapped', len(LM), 'of', len(MS))
for o in LM:
    me = o.data
    while len(me.uv_layers) > 1:
        me.uv_layers.remove(me.uv_layers[1])
    lm = me.uv_layers.new(name='lm')
    me.uv_layers.active = lm
    me.uv_layers[0].active_render = True

area = 0.0
for o in LM:
    mw = o.matrix_world
    for p in o.data.polygons:
        area += p.area  # mittakaava on jo meshissä
print('surface m2', round(area, 1))

# objektikohtainen smart UV project -> laatta, laatat hyllypakataan atlaksiin (tekselitiheys DENS px/m)
DENS = float(ARGS.get('dens', 26))
PAD = 2
tiles = []
t = time.time()
for o in LM:
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.reveal(); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(70), island_margin=0.01, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    me = o.data
    a3 = sum(p.area for p in me.polygons)
    # toinen kierros: saarten marginaali ~2.5 px arvioidussa laattakoossa
    bpy.ops.object.mode_set(mode='OBJECT')
    uv = me.uv_layers['lm'].data
    ua0 = 0.0
    for p in me.polygons:
        us = [uv[li].uv for li in p.loop_indices]
        for k in range(1, len(us) - 1):
            ua0 += abs((us[k] - us[0]).cross(us[k + 1] - us[0])) / 2
    T_est = max(4.0, math.sqrt(a3 / max(ua0, 1e-6)) * DENS)
    m2 = min(0.06, max(0.002, 2.5 / T_est))
    if abs(m2 - 0.01) > 0.003:
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(70), island_margin=m2, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
        bpy.ops.object.mode_set(mode='OBJECT')
    uv = me.uv_layers['lm'].data
    ua = 0.0
    umin = [1e9, 1e9]; umax = [-1e9, -1e9]
    for p in me.polygons:
        us = [uv[li].uv for li in p.loop_indices]
        for k in range(1, len(us) - 1):
            ua += abs((us[k] - us[0]).cross(us[k + 1] - us[0])) / 2
        for u in us:
            umin[0] = min(umin[0], u.x); umin[1] = min(umin[1], u.y); umax[0] = max(umax[0], u.x); umax[1] = max(umax[1], u.y)
    span = max(umax[0] - umin[0], umax[1] - umin[1], 1e-6)
    # laatan koko: 3D-ala / UV-peitto -> pikseleitä
    T = math.sqrt(a3 / max(ua, 1e-6)) * DENS * span
    T = int(max(4, min(RES // 2, round(T))))
    tiles.append([o, T, umin, span])
print('smart_project per object', round(time.time() - t, 1), 's')
for o, T, *_ in sorted(tiles, key=lambda x: -x[1])[:12]: print('  tile', T, o.name)
# hyllypakkaus
tiles.sort(key=lambda x: -x[1])
atlases = [[]]  # laatat atlaksittain: (o, T, x, y)
x = y = shelf = 0
for o, T, umin, span in tiles:
    if x + T + PAD > RES:
        x = 0; y += shelf + PAD; shelf = 0
    if y + T + PAD > RES:
        atlases.append([]); x = y = shelf = 0
    atlases[-1].append((o, T, x, y, umin, span))
    x += T + PAD; shelf = max(shelf, T)
ATLAS_OF = {}
for k, al in enumerate(atlases):
    for o, T, x0, y0, umin, span in al:
        uv = o.data.uv_layers['lm'].data
        for d in uv:
            u = (d.uv.x - umin[0]) / span; v = (d.uv.y - umin[1]) / span
            d.uv = ((x0 + 0.5 + u * (T - 1)) / RES, (y0 + 0.5 + v * (T - 1)) / RES)
        ATLAS_OF[o.name] = k
used = [sum(T * T for _, T, *_ in al) / (RES * RES) for al in atlases]
print('atlases', len(atlases), 'fill', [round(u, 2) for u in used], 'density px/m', DENS)

# 3) materiaalit: valokartalliset kopiot nimellä __lm0 (web: atlas 0) + paistokuva aktiiviseksi
IMGS = [bpy.data.images.new(f'LM{k}', RES, RES, float_buffer=True, alpha=False) for k in range(len(atlases))]
cache = {}
for o in LM:
    k = ATLAS_OF[o.name]
    for i, m in enumerate(o.data.materials):
        if m is None:
            continue
        key = (m.name, k)
        if key not in cache:
            c = m.copy(); c.name = f'{m.name}__lm{k}'
            nd = c.node_tree.nodes.new('ShaderNodeTexImage'); nd.image = IMGS[k]; nd.name = 'LMBAKE'
            c.node_tree.nodes.active = nd
            cache[key] = c
        o.data.materials[i] = cache[key]
print('lm materials', len(cache))

# lasi läpinäkyväksi paiston ajaksi (myös läpinäkyvään materiaaliin paistokuva, ettei paisto valita)
glass_transparent(True)
tm = bpy.data.materials['P5_BakeTransparent']
nd = tm.node_tree.nodes.new('ShaderNodeTexImage'); nd.image = IMGS[0]; tm.node_tree.nodes.active = nd
bpy.ops.wm.save_as_mainfile(filepath=WORK + '/bl/s2_prebake.blend')
if DRY:
    print('dry run done', round(time.time() - t0), 's')
    raise SystemExit

# 4) paisto
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = SPP
sc.cycles.max_bounces = 6
sc.cycles.diffuse_bounces = 4
sc.cycles.glossy_bounces = 2
sc.cycles.transparent_max_bounces = 8
sc.render.bake.use_pass_direct = True
sc.render.bake.use_pass_indirect = True
sc.render.bake.use_pass_color = False
sc.render.bake.margin = 3
sc.render.bake.margin_type = 'EXTEND'
bpy.ops.object.select_all(action='DESELECT')
for o in LM:
    o.select_set(True)
bpy.context.view_layer.objects.active = LM[0]
t = time.time()
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=3, use_clear=True)
print('bake', round(time.time() - t), 's')
for k, img in enumerate(IMGS):
    img.filepath_raw = f'{OUT}/lm{k}_raw.exr'; img.file_format = 'OPEN_EXR'; img.save()

# 5) kohinanpoisto kompositorilla (OIDN), atlas kerrallaan
dn_scene = bpy.data.scenes.new('DN')
ng = bpy.data.node_groups.new('DNtree', 'CompositorNodeTree')
im = ng.nodes.new('CompositorNodeImage')
dn = ng.nodes.new('CompositorNodeDenoise')
outn = ng.nodes.new('NodeGroupOutput')
ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
ng.links.new(im.outputs['Image'], dn.inputs['Image']); ng.links.new(dn.outputs['Image'], outn.inputs[0])
dn_scene.compositing_node_group = ng
dn_scene.render.resolution_x = dn_scene.render.resolution_y = RES; dn_scene.render.resolution_percentage = 100
cam = bpy.data.objects.new('dncam', bpy.data.cameras.new('dncam')); dn_scene.collection.objects.link(cam); dn_scene.camera = cam
dn_scene.render.engine = 'CYCLES'; dn_scene.cycles.samples = 1
dn_scene.render.image_settings.file_format = 'OPEN_EXR'
for k, img in enumerate(IMGS):
    im.image = img
    dn_scene.render.filepath = f'{OUT}/lm{k}_dn.exr'
    bpy.ops.render.render(write_still=True, scene='DN')
print('denoised')
json.dump({'atlases': len(IMGS), 'res': RES, 'spp': SPP, 'dens': DENS}, open(f'{OUT}/bake.json', 'w'))

# 6) vienti: lasi takaisin, paistosolmut pois
glass_transparent(False)
for m in cache.values():
    n = m.node_tree.nodes.get('LMBAKE')
    if n:
        m.node_tree.nodes.remove(n)
bpy.data.scenes.remove(dn_scene)
for o in O:
    if o.type == 'LIGHT':
        o.hide_set(False)
bpy.ops.wm.save_as_mainfile(filepath=WORK + '/bl/s2_baked.blend')
meta = []
for o in MS:
    a, b = world_bbox(o)
    meta.append({'name': o.name, 'min': [round(v, 3) for v in a], 'max': [round(v, 3) for v in b], 'lm': o in LM})
json.dump(meta, open(f'{OUT}/p5-nodes.json', 'w'))
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.export_scene.gltf(filepath=f'{OUT}/floor5.glb', export_format='GLB', use_selection=False, export_texcoords=True, export_normals=True,
                          export_materials='EXPORT', export_lights=False, export_cameras=False, export_yup=True, export_apply=True)
print('exported', round(time.time() - t0), 's total')
