import os
WORK = os.environ.get('P5_WORK', os.path.abspath('work5'))  # työkansio: apt-named.glb, bl/*.blend, out/
HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
import bpy, sys, math
sys.path.insert(0, HERE)
from p5lib import *
bpy.ops.wm.open_mainfile(filepath=sys.argv[-1] if sys.argv[-1].endswith('.blend') else WORK + '/bl/s1.blend')
sc = bpy.context.scene
for o in bpy.data.objects:
    if o.type == 'MESH':
        a, b = world_bbox(o)
        if a[1] > 2.0 or 'Ceil' in o.name or o.name.startswith(('SM_Ceiling', 'SM_Wall_018', 'SM_Wall_019', 'SM_Wall_020', 'SM_Wall_021', 'SM_Wall_022', 'SM_Wall_023', 'P5_Beam')) or '_l' in o.name.split('__')[0][-3:]:
            o.hide_render = True
cam = bpy.data.cameras.new('top'); cam.type = 'ORTHO'; cam.ortho_scale = 24.5
co = bpy.data.objects.new('top', cam); sc.collection.objects.link(co); sc.camera = co
co.location = G(0, 12, 6.3); co.rotation_euler = (0, 0, -math.pi / 2)
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'FLAT'; sc.display.shading.color_type = 'TEXTURE'
sc.display.shading.show_cavity = True
sc.render.resolution_x = 2000; sc.render.resolution_y = 860; sc.render.resolution_percentage = 100
sc.render.filepath = WORK + '/top.png'
bpy.ops.render.render(write_still=True)
