"""Kerros 5: näyttöjen pinnat irti omaksi kevyeksi GLB:ksi (selain piirtää niihin canvas-tekstuurin).
Työhuoneen TV-seinä (2 × Smart TV:n lasipinta) ja työkoneen näytöt (34" kaareva + pystynäyttö).
Pinnat kopioidaan alkuperäisistä kolmioista (kaarevuus säilyy), siirretään 3 mm katsojaa kohti ja
saavat uudet UV:t 0…1 näytön leveydeltä/korkeudelta.
python -c "exec(open('s5_screens.py').read())"  ->  out/screens.glb"""
import bpy, bmesh, mathutils, math
bpy.ops.wm.open_mainfile(filepath='/home/claude/work/p5/bl/s1.blend')
OUT = '/home/claude/work/p5/out/screens.glb'
UP = mathutils.Vector((0, 0, 1))

# (nimi glTF:ssä, lähdeobjekti, etusuunta Blenderissä, materiaali tai None, min z)
SPEC = [
    ('scr_ops', 'SM_Smart_TV__tv71', (-1, 0, 0), 'M_LacPolishedBlack', None),
    ('scr_git', 'SM_Smart_TV__tv72', (-1, 0, 0), 'M_LacPolishedBlack', None),
    ('scr_dev', 'SM_Curved_34_Monitor', (1, 0, 0), None, 0.99),
    ('scr_code', 'SM_Curved_Monitor', (math.cos(math.radians(20)), math.sin(math.radians(20)), 0), None, None),
]


def extract(name, src, front, matname, zmin):
    o = bpy.data.objects[src]
    me = o.data
    M = o.matrix_world
    N = M.to_3x3().inverted().transposed()
    f = mathutils.Vector(front).normalized()
    r = UP.cross(f).normalized()          # vaakasuunta näytön tasossa
    mi = None
    if matname:
        mi = [m.name for m in me.materials].index(matname)
    cand = []
    for p in me.polygons:
        if mi is not None and p.material_index != mi:
            continue
        n = (N @ p.normal).normalized()
        if n.dot(f) < 0.6:
            continue
        vs = [M @ me.vertices[v].co for v in p.vertices]
        c = sum(vs, mathutils.Vector()) / len(vs)
        if zmin is not None and c.z < zmin:
            continue
        cand.append((p, vs, c.dot(f)))
    if mi is None:
        # vain etummainen kerros (paneeli), ei jalkaa tai takakuorta
        dmax = max(d for _, _, d in cand)
        cand = [x for x in cand if x[2] >= dmax - 0.08]
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    allv = [v for _, vs, _ in cand for v in vs]
    s0, s1 = min(v.dot(r) for v in allv), max(v.dot(r) for v in allv)
    t0, t1 = min(v.z for v in allv), max(v.z for v in allv)
    for p, vs, _ in cand:
        bv = [bm.verts.new(v + f * 0.003) for v in vs]
        face = bm.faces.new(bv)
        for loop, v in zip(face.loops, vs):
            # u kasvaa katsojan vasemmalta oikealle: katsoja katsoo suuntaan -f, hänen oikea kätensä on r = UP × f
            loop[uvl].uv = ((v.dot(r) - s0) / (s1 - s0), (v.z - t0) / (t1 - t0))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    m2 = bpy.data.meshes.new(name)
    bm.to_mesh(m2)
    bm.free()
    mat = bpy.data.materials.new(name)
    m2.materials.append(mat)
    ob = bpy.data.objects.new(name, m2)
    bpy.context.scene.collection.objects.link(ob)
    w = s1 - s0
    print(name, 'faces', len(cand), 'size %.3f x %.3f' % (w, t1 - t0))
    return ob


made = [extract(*s) for s in SPEC]
bpy.ops.object.select_all(action='DESELECT')
for ob in made:
    ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True,
                          export_materials='PLACEHOLDER', export_normals=True, export_texcoords=True, export_yup=True)
print('saved', OUT)
