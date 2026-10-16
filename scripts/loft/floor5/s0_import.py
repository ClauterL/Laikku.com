import os
WORK = os.environ.get('P5_WORK', os.path.abspath('work5'))
import bpy, time, sys, collections
t=time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=WORK + '/apt-named.glb', merge_vertices=False, import_shading='NORMALS')
print('import', round(time.time()-t,1),'s')
objs=bpy.data.objects
print('objects', len(objs), collections.Counter(o.type for o in objs))
print('meshes', len(bpy.data.meshes), 'materials', len(bpy.data.materials), 'images', len(bpy.data.images))
users=collections.Counter(o.data.name for o in objs if o.type=='MESH')
print('shared meshes', sum(1 for k,v in users.items() if v>1))
parents=collections.Counter((o.parent.type if o.parent else None) for o in objs)
print('parents', parents)
for o in list(objs)[:8]: print(o.name, o.type, tuple(round(v,2) for v in o.location), o.data.name if o.data else None, [m.name for m in o.data.materials] if o.type=='MESH' else '')
uvs=collections.Counter(len(o.data.uv_layers) for o in objs if o.type=='MESH'); print('uv layers', uvs)
bpy.ops.wm.save_as_mainfile(filepath=WORK + '/bl/s0.blend')
