"""Kerros 5 Blenderissä: koti-siiven muutokset, aula ja työ-siipi. Ajo: python -c "exec(open('s1_build.py').read())" """
import os
WORK = os.environ.get('P5_WORK', os.path.abspath('work5'))  # työkansio: apt-named.glb, bl/*.blend, out/
HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
import bpy, sys, math, json
sys.path.insert(0, HERE)
import importlib, p5lib
importlib.reload(p5lib)
from p5lib import *

bpy.ops.wm.open_mainfile(filepath=WORK + '/bl/s0.blend')
O = bpy.data.objects
H = math.pi / 2

# kamerat ja apukohteet pois
delete([o for o in O if o.type in ('CAMERA', 'LIGHT')])
for o in [o for o in O if o.type == 'EMPTY']:
    for c in o.children:
        mw = c.matrix_world.copy(); c.parent = None; c.matrix_world = mw
delete([o for o in O if o.type == 'EMPTY'])

# ---------- UV-tiheydet olemassa olevista pinnoista ----------
for on, mn in [('SM_Floor_main', 'MI_OakAnthracite'), ('SM_Floor_main', 'MI_MarbleGrayB'), ('SM_Wall_003', 'MI_WallPaintWhiteMatte'),
               ('SM_Wall_005', 'MI_WallPaintGrayMatte'), ('SM_Floor_bathroom', 'MI_BasaltGridTiles'), ('SM_Wall_hung', 'MI_BasaltGridTiles_4'),
               ('SM_Wall_011', 'MI_WoodWalnutB_1'), ('SM_Wall_001', 'MI_MDFBlack')]:
    print('uv/m', mn, measure_uv(on, mn))

# ---------- KOTI: makuuhuoneesta työhuone ----------
bed = ['SM_Clay_On_Bed', 'SM_Mattress_flat_sheet', 'SM_Coverlet', 'SM_Bed_pillows', 'SM_Bed_neckroll_pillows', 'SM_Bed_fabric_element',
       'SM_Benches_1', 'SM_Tab_bed_a', 'SM_Decor_vase_bed', 'SM_Pillow_type_d', 'SM_Pillow_type_f', 'SM_Pillow_type_f2', 'SM_Pillow_type_d3',
       'SM_Bag_sport']
delete([O[n] for n in bed if n in O])
# lukunurkka sängyn paikalle: nojatuoli, sohvapöytä ja lattiavalaisin maton päälle
dup([O['SM_Rec_Chair']], gmatrix((-3.22, 0.09), -H, (3.25, -2.25)), 'study')
dup([O['SM_H_Coffee_Table']], gmatrix((-3.06, -1.40), 0, (2.25, -2.15)), 'study')
dup([O['SM_Floor_Lamp']], gmatrix((0.34, -4.88), 0, (3.85, -3.35)), 'study')

# ---------- AULA z 5.16 ... 7.5 ----------
OAK, WHITE, GRAY, MDF, WAL = 'MI_OakAnthracite', 'MI_WallPaintWhiteMatte', 'MI_WallPaintGrayMatte', 'MI_MDFBlack', 'MI_WoodWalnutB_1'
TILE_F, TILE_W, MARBLE = 'MI_BasaltGridTiles', 'MI_BasaltGridTiles_4', 'MI_MarbleGrayB'
box('P5_Floor_lobby', -4.39, 4.39, -0.04, 0.0, 5.10, 7.44, OAK)
box('P5_Ceil_lobby', -4.39, 4.39, CEIL, WALL_TOP, 5.10, 7.44, WHITE)
box('P5_Wall_lobbyW', -4.39, -4.15, 0, WALL_TOP, 5.16, 7.44, GRAY); WALLS.append((-4.39, -4.15, 5.16, 7.44))
box('P5_Wall_lobbyE', 4.15, 4.39, 0, WALL_TOP, 5.16, 7.44, GRAY); WALLS.append((4.15, 4.39, 5.16, 7.44))

# ---------- TYÖ-SIIPI z 7.5 ... 17.8 ----------
ZN = 17.80  # pohjoisjulkisivun ulkopinta (eteläjulkisivun peilikuva 12.66 - z)
box('P5_Floor_work', -4.39, 4.39, -0.04, 0.0, 7.44, ZN, OAK)
box('P5_Floor_kahvio', 0.6, 4.15, 0.0, 0.004, 7.5, 9.4, MARBLE)
box('P5_Floor_wc', 0.6, 4.15, 0.0, 0.004, 9.4, 11.3, TILE_F)
box('P5_Ceil_work', -4.39, 4.39, CEIL, WALL_TOP, 7.44, ZN, WHITE)
# ulkoseinät: itä päättyy ikkunasyvennyksen nurkkaseinään (peilattu Wall_017), länsi ulottuu julkisivuun asti
box('P5_Wall_outW', -4.39, -4.15, 0, WALL_TOP, 7.44, ZN - 0.05, WHITE); WALLS.append((-4.39, -4.15, 7.44, ZN - 0.05))
box('P5_Wall_outE', 4.15, 4.39, 0, WALL_TOP, 7.44, 16.06, WHITE); WALLS.append((4.15, 4.39, 7.44, 16.06))
T = 0.12
# aulan ja työ-siiven välinen seinä: ovet arcade-galleriaan ja kahvioon
wall_x('P5_Wall_s', 7.5, -4.15, 4.15, T, {'-z': GRAY, '+z': WHITE, '+x': WHITE, '-x': WHITE, '+y': WHITE, '-y': WHITE}, doors=[(-2.7, -1.3), (2.75, 3.65)])
# arcade | kahvio + WC
wall_z('P5_Wall_mid', 0.6, 7.56, 11.24, T, WHITE)
# kahvio | WC (ovi)
wall_x('P5_Wall_kwc', 9.4, 0.66, 4.15, T, {'-z': WHITE, '+z': TILE_W, '+x': WHITE, '-x': WHITE, '+y': WHITE, '-y': WHITE}, doors=[(1.95, 2.85)])
# WC:n seinät laatoitettu sisäpuolelta
box('P5_Tiles_wcE', 4.13, 4.15, 0.004, 2.4, 9.46, 11.24, TILE_W)
box('P5_Tiles_wcN', 0.66, 4.15, 0.004, 2.4, 11.22, 11.24, TILE_W)
box('P5_Tiles_wcW', 0.66, 0.68, 0.004, 2.4, 9.46, 11.24, TILE_W)
# arcade + WC | war room (ovi arcadesta)
wall_x('P5_Wall_war', 11.3, -4.15, 4.15, T, {'-z': WHITE, '+z': WHITE, '+x': WHITE, '-x': WHITE, '+y': WHITE, '-y': WHITE}, doors=[(-3.1, -1.7)])
# war roomin länsiseinä pähkinäpaneelia (maailmankartta)
box('P5_Panel_warW', -4.15, -4.12, 0.0, CEIL, 11.36, 14.54, WAL)

# war room | paja: lasiseinä (asunnon metallikehyksiset lasipaneelit) ja ovi x -3.9 ... -2.9
glass_src = O['SM_Metal_frame_glass_c']
# kirkkaampi lasi uuteen väliseinään (asunnon lasi on lähes läpinäkymätöntä tummaa peiliä)
P5GLASS = bpy.data.materials['MI_GlassCleanMaster_B_SM_Metal_frame_glass_c'].copy(); P5GLASS.name = 'P5_GlassClear'
_b = P5GLASS.node_tree.nodes['Principled BSDF']
_b.inputs['Base Color'].default_value = (0.05, 0.06, 0.06, 1); _b.inputs['Alpha'].default_value = 0.22
_b.inputs['Metallic'].default_value = 0.2; _b.inputs['Roughness'].default_value = 0.04  # x -0.46..-0.42, z -1.17..-0.19 (0.98 m), korkeus 2.8
gz = 14.6
xs = -2.9
k = 0
while xs + 0.98 <= 4.15 + 1e-6:
    # paneelin keskikohta (x -0.44, z -0.68) -> (xs+0.49, gz), kierto 90° (pituussuunta z -> x)
    gp = dup([glass_src], gmatrix((-0.44, -0.68), H, (xs + 0.49, gz)), 'glass')[0]
    for i, m in enumerate(gp.data.materials):
        if m and 'Glass' in m.name:
            gp.data.materials[i] = P5GLASS
    xs += 0.98; k += 1
WALLS.append((-2.9, xs, gz - 0.03, gz + 0.03))
if xs < 4.15:
    box('P5_Wall_glassE', xs, 4.15, 0, WALL_TOP, gz - 0.06, gz + 0.06, MDF); WALLS.append((xs, 4.15, gz - 0.06, gz + 0.06))
box('P5_Wall_glassW', -4.15, -3.9, 0, WALL_TOP, gz - 0.06, gz + 0.06, MDF); WALLS.append((-4.15, -3.9, gz - 0.06, gz + 0.06))
box('P5_Wall_glassL', -3.9, -2.9, DOOR_H, WALL_TOP, gz - 0.06, gz + 0.06, MDF)
print('glass panels', k)

# pohjoisjulkisivu = eteläjulkisivun peilikuva (ikkunat, pilarit, palkit, verhot); parvekkeen kohdalle lasi
FACADE = ['SM_Wall_001', 'SM_Wall_002', 'SM_Wall_017', 'SM_Wall_018', 'SM_Wall_019', 'SM_Wall_020', 'SM_Glass_windows_a', 'SM_Glass_windows_b',
          'SM_Glass_windows_c', 'SM_Curtain2', 'SM_Curtain3', 'SM_Drap_Curtain2', 'SM_Drap_Curtain3', 'SM_Drap_Curtain4', 'SM_Drap_Curtain5', 'SM_Curtain']
fac = [O[n] for n in FACADE if n in O]
MIRROR = gmatrix((0, 6.33), math.pi, (0, 6.33))
dup(fac, MIRROR, 'n')
# parvekkeen kohta (peilattuna x -4.39 ... -2.78): lasi-ikkuna a skaalattuna + palkki
ga = O['SM_Glass_windows_a']  # x 0.18..2.21
w = 4.39 - 2.78
s = w / (2.21 - 0.18)
g = dup([ga], MIRROR, 'n')[0]
# skaalaus x-suunnassa paikallisesti: siirretään ja skaalataan maailmassa
from mathutils import Matrix
cx_old = -(0.18 + 2.21) / 2  # peilattu keskikohta
cx_new = -(2.78 + 4.39) / 2
Sx = Matrix.Translation(G(cx_new, 0, 0)) @ Matrix.Diagonal((s, 1, 1, 1)) @ Matrix.Translation(G(-cx_old, 0, 0))
g.matrix_world = Sx @ g.matrix_world
box('P5_Beam_balc', -4.39, -2.78, 2.7, 3.0, ZN - 0.25, ZN, MDF)
WALLS.append((-4.39, -2.78, ZN - 0.08, ZN))

# ---------- KALUSTEET ----------
# Arcade-galleria (x -4.15..0.54, z 7.56..11.24): sohva + selkänoja, matto, taulut (arcade-kaapit ovat web-esineitä)
dup([O['SM_SF_a_high'], O['SM_SF_module_a_high']], gmatrix((-1.88, -3.11), H, (-3.35, 9.35)), 'arc')
dup([O['SM_Luster_Wash_Rug_sofa']], gmatrix((-2.47, -1.90), H, (-2.05, 9.4)), 'arc')
dup([O['SM_Art_picture']], gmatrix((1.435, 0.84), math.pi, (-4.08, 8.3)), 'arc')
dup([O['SM_3D_Artwork']], gmatrix((-0.695, -2.66), math.pi, (-4.12, 10.45)), 'arc')

# Kahvio (x 0.66..4.15, z 7.56..9.34): keittiökaappi + kahvikone itäseinällä, penkki ja pöytä
kit = [O[n] for n in ['SM_Cabinet_kichen_a', 'SM_Drawer', 'SM_Drawer2', 'SM_Coffee_Machine', 'SM_Wine_Cooler']]
# kaapin takapinta z 4.91 -> itäseinä x 4.15; kaapin keskikohta x -2.345
dup(kit, gmatrix((-2.345, 4.91), H, (4.15, 8.45)), 'kahvio')
dup([O['SM_Japan_Bench']], gmatrix((1.36, 4.06), math.pi, (0.82, 8.45)), 'kahvio')
dup([O['SM_H_Coffee_Table']], gmatrix((-3.06, -1.40), 0, (1.55, 8.45)), 'kahvio')

# WC ja tekniikka (x 0.66..4.15, z 9.46..11.24)
wc = region(3.3, 4.16, 1.45, 2.32, 0.0, 2.9, exclude=lambda n: n.startswith(('SM_Wall_bathroom', 'SM_Floor', 'SM_Ceiling', 'SM_Corner', 'SM_Shower', 'Door', 'SM_Wall_0')))
print('wc', [o.name for o in wc])
dup(wc, gmatrix((0, 0), 0, (0, 8.97)), 'wc')
basin = region(3.55, 4.16, 2.75, 3.72, 0.0, 2.6, exclude=lambda n: n.startswith(('SM_Wall_bathroom', 'SM_Floor', 'SM_Ceiling', 'SM_Wall_0', 'SM_Pendant')))
print('basin', [o.name for o in basin])
dup(basin, gmatrix((0, 0), 0, (0, 6.70)), 'wc')
dup([O['SM_Wardrobe_metal']], gmatrix((-4.14, 0.41), 0, (0.68, 11.22)), 'tek')

# War room (x -4.15..4.15, z 11.36..14.54): kaksi ruokapöytää päätyyn, 6 tuolia, 2 riippuvalaisinta, sivupöytä kartan alla
T1 = (-3.08, 2.20)
dup([O['SM_DiningRec_Table']], gmatrix(T1, 0, (-0.7, 12.95)), 'war')
dup([O['SM_DiningRec_Table']], gmatrix(T1, 0, (0.7, 12.95)), 'war')
for xx in (-0.95, 0.0, 0.95):
    dup([O['SM_P_Chair']], gmatrix((-3.32, 1.77), 0, (xx, 12.52)), 'war')
    dup([O['SM_P_Chair3']], gmatrix((-2.75, 2.60), 0, (xx, 13.38)), 'war')
for xx in (-0.7, 0.7):
    dup([O['SM_Ceiling_lamp']], gmatrix((-3.12, 2.06), 0, (xx, 12.95)), 'war')
dup([O['SM_HD_Drinks_Cabinet']], gmatrix((-0.68, -4.40), math.pi, (-3.94, 12.95)), 'war')

# Paja (x -4.15..4.15, z 14.66..17.5): metallikaapit länsiseinälle, työasema ja hyllyt
for zz in (15.05, 15.65):
    dup([O['SM_Wardrobe_metal']], gmatrix((-4.14, 0.12), 0, (-4.15, zz)), 'paja')
dup([O['SM_Workstation']], gmatrix((-0.09, -4.77), math.pi, (0.75, 17.32)), 'paja')
for i, yy in enumerate((1.35, 1.75)):
    dup([O['SM_Shelf_single']], gmatrix((-0.34, -3.96), 0, (-4.07, 16.6)), 'paja')[0].location.z += (yy - 1.365)

# Olohuone: sohvapöytä ja rahi pois sohvan ja TV-seinän väliltä (kulkuväylä harrastusnurkkaan; kopiot jäivät
# työhuoneeseen ja kahvioon). Pöydän päällä olleet esineet pois, etteivät ne leiju.
for src, (x0, x1, z0, z1, y0) in {'SM_H_Coffee_Table': (-3.39, -2.73, -1.91, -0.89, 0.2), 'SM_Rec_Chair': (-3.71, -2.73, -0.38, 0.56, 0.3)}.items():
    on = [o for o in region(x0, x1, z0, z1, y0, 1.2) if '__' not in o.name and not o.name.startswith(('SM_Wall', 'SM_Ceiling', 'SM_Floor', 'SM_Recessed', 'SM_Spotlight'))]
    print('remove', src, [o.name for o in on])
    delete(on + [O[src]])

# Aula: penkki etelään (kodin seinää vasten), taideteos työ-siiven seinälle
dup([O['SM_Japan_Bench']], gmatrix((1.5, 4.06), H, (2.55, 5.16)), 'lobby')
dup([O['SM_3D_Artwork']], gmatrix((-0.67, -2.66), -H, (0.5, 7.44)), 'lobby')

# ---------- KATTOVALAISIMET (kopiot) + valot ----------
dl = O['SM_Downlight_metal']  # x 0.51, z 4.26, y 2.7
DL = []
def downlight(x, z, power=14, k=3000, name='dl'):
    c = dup([dl], gmatrix((0.51, 4.26), 0, (x, z), dy=CEIL - 2.7 - 0.001), name)[0]
    DL.append(c)
    light('SPOT', f'L_{name}', x, CEIL - 0.03, z, power, k, size=0.04)
for x in (-3.0, -1.2, 0.6, 2.4, 3.7):
    downlight(x, 6.33, 30, name='lobby')
for x, z in [(-3.3, 8.3), (-3.3, 10.4), (-1.3, 8.3), (-1.3, 10.4)]:
    downlight(x, z, 26, name='arc')
for x, z in [(1.5, 8.45), (2.7, 8.45), (3.7, 8.45)]:
    downlight(x, z, 24, name='kahvio')
for x, z in [(2.4, 10.35)]:
    downlight(x, z, 20, name='wc')
for x, z in [(-3.2, 12.0), (-3.2, 13.9), (2.6, 12.0), (2.6, 13.9)]:
    downlight(x, z, 22, name='war')
for x, z in [(-2.6, 15.4), (0.2, 15.4), (2.8, 15.4), (-2.6, 16.8), (0.2, 16.8)]:
    downlight(x, z, 24, name='paja')
# koti: työhuoneen uudet kattovalot sängyn paikalle
for x, z in [(2.8, -1.4), (2.8, -3.1)]:
    downlight(x, z, 22, name='study')
# war roomin riippuvalaisimet ja pajan työvalo (web-valaisimen kohdalla)
for xx in (-0.7, 0.7):
    light('POINT', 'L_pend_war', xx, 1.75, 12.95, 22, 2900, size=0.15)
light('AREA', 'L_paja_task', -1.2, 2.45, 17.0, 45, 4200, area=(1.3, 0.25))

# koti: olemassa olevat valaisimet -> valot
for o in [o for o in O if o.type == 'MESH' and o.name.split('.')[0].startswith(('SM_Recessed_Downlight',)) and '__' not in o.name]:
    c = center(o); light('SPOT', 'L_rec', c[0], c[1] - 0.04, c[2], 22, 3000, size=0.04)
seen = []
for o in [o for o in O if o.type == 'MESH' and o.name.startswith('SM_Downlight_metal') and '__' not in o.name]:
    c = center(o)
    if any(abs(c[0] - s[0]) < 0.3 and abs(c[2] - s[2]) < 0.3 for s in seen):
        continue  # parit samaan valoon
    seen.append(c)
    light('SPOT', 'L_dlm', c[0], c[1] - 0.04, c[2], 20, 3000, size=0.04)
for o in [o for o in O if o.type == 'MESH' and o.name.startswith('SM_Spotlight_Track_rotated') and '__' not in o.name]:
    c = center(o); light('SPOT', 'L_track', c[0], c[1] - 0.08, c[2], 12, 3100, size=0.03, spot=math.radians(60))
c = center(O['SM_Ceiling_lamp']); light('POINT', 'L_dining', c[0], 1.75, c[2], 22, 2900, size=0.15)
for n in ('SM_Pendant_Lamp', 'SM_Pendant_Lamp2'):
    c = center(O[n]); light('POINT', 'L_bathpend', c[0], 1.7, c[2], 6, 2900, size=0.05)
for o in [o for o in O if o.name.startswith('SM_Wall_Light_Ext')]:
    c = center(o); light('POINT', 'L_walllight', c[0] - 0.12, c[1], c[2], 5, 2800, size=0.06)
for o in [o for o in O if o.name.startswith('SM_Floor_Lamp')]:
    a, b = world_bbox(o); light('POINT', 'L_floorlamp', (a[0] + b[0]) / 2, b[1] - 0.1, (a[2] + b[2]) / 2, 6, 2900, size=0.06)

# aurinko (UE:n DirectionalLight: pitch -23°, yaw 33°) + taivas
sun = bpy.data.lights.new('Sun', 'SUN'); sun.energy = 2.5; sun.angle = math.radians(1.5); sun.color = kelvin(5200)
so = bpy.data.objects.new('Sun', sun)
d = G(0.772, -0.391, 0.501).normalized()
so.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.collection.objects.link(so)
world = bpy.data.worlds.new('Sky'); bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.42, 0.52, 0.72, 1); bg.inputs[1].default_value = 1.2

json.dump({'walls': WALLS}, open(WORK + '/walls5.json', 'w'))
bpy.ops.wm.save_as_mainfile(filepath=WORK + '/bl/s1.blend')
print('saved s1', len([o for o in O if o.type == 'MESH']), 'meshes', len(LIGHTS), 'lights')
