import bpy, sys, math, time
sys.path.insert(0, '/home/claude/work/p5/bl')
from p5lib import *
blend = [a for a in sys.argv if a.endswith('.blend')][0]
bpy.ops.wm.open_mainfile(filepath=blend)
glass_transparent(True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = int([a for a in sys.argv if a.startswith('spp=')][0][4:]) if any(a.startswith('spp=') for a in sys.argv) else 24
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6
sc.render.resolution_x, sc.render.resolution_y = 720, 405
sc.view_settings.view_transform = 'AgX'
sc.view_settings.exposure = float([a for a in sys.argv if a.startswith('ev=')][0][3:]) if any(a.startswith('ev=') for a in sys.argv) else 0.0
CAMS = {
  'lobby': ((-3.4, 1.55, 6.33), (3.0, 1.2, 6.33)),
  'arcade': ((-2.0, 1.55, 6.6), (-1.6, 1.0, 10.8)),
  'kahvio': ((3.2, 1.55, 6.7), (1.6, 0.9, 9.6)),
  'war': ((-3.5, 1.55, 11.7), (2.5, 0.9, 14.0)),
  'paja': ((-3.4, 1.55, 14.2), (1.5, 1.0, 17.5)),
  'study': ((0.6, 1.55, -0.6), (3.6, 0.8, -3.0)),
  'living': ((0.3, 1.55, 0.8), (-3.0, 0.9, -4.0)),
  'study2': ((1.0, 1.6, -0.7), (3.9, 1.1, -2.6)),
  'study3': ((2.6, 1.6, -1.0), (-0.42, 1.2, -3.0)),
  'lobbyE': ((-1.5, 1.5, 6.33), (4.1, 1.5, 6.33)),
  'war2': ((2.0, 1.6, 13.8), (-3.9, 1.0, 12.4)),
  'war3': ((0.0, 1.6, 13.8), (1.2, 1.2, 11.3)),
  'desk': ((1.1, 1.35, -3.9), (-0.3, 1.1, -4.0)),
  'tvwall': ((1.2, 1.5, -1.6), (4.0, 1.6, -1.7)),
}
which = [a[4:] for a in sys.argv if a.startswith('cam=')]
which = which[0].split(',') if which else list(CAMS)
cam = bpy.data.cameras.new('c'); cam.lens = 18
co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
for k in which:
    eye, at = CAMS[k]
    co.location = G(*eye)
    d = (G(*at) - G(*eye)).normalized()
    co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = f'/home/claude/work/p5/r_{k}.png'
    t = time.time(); bpy.ops.render.render(write_still=True); print(k, round(time.time() - t), 's')
