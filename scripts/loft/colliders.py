"""apt-nodes.json (solmujen AABB:t) -> loftin törmäyslaatikot"""
import json, re, sys
nodes = json.load(open(sys.argv[1]))
solid, cam, names = [], [], []
SKIP = r'SM_Environment|SM_Floor|SM_Carpet|SM_.*Rug|Door$|SM_Light_?Switch|SM_LightSwitch|SM_Socket|SM_Ray_sliding'
WALL = r'SM_Wall_|SM_Glass_windows|SM_Backdrop|SM_Fabric_Wall|SM_Wall_hung|SM_Metal_frame_glass|SM_Wardrobe|SM_Mixer_kichen|SM_Balcony|SM_Frame_door|SM_Slidingdoor|SM_Metal_holder|SM_Cabinet_|SM_Kitchen_laminate|SM_Closet_metal'
for n in nodes:
    name, mn, mx = n['name'], n['min'], n['max']
    s = [mx[i] - mn[i] for i in range(3)]
    if re.match(SKIP, name) or s[1] < 0.02:
        continue
    wall = re.match(WALL, name)
    if not wall:
        if mn[1] >= 0.25 or s[1] < 0.2 or s[0] * s[2] < 0.015 or max(s[0], s[2]) < 0.12:
            continue
    c = [(mn[i] + mx[i]) / 2 for i in range(3)]
    h = [max(s[i] / 2, 0.02) for i in range(3)]
    solid.append([round(v, 3) for v in c + h]); names.append(name)
    if wall and s[1] > 1.9 and not re.match(r'SM_Glass_windows_c|SM_Wardrobe|SM_Cabinet_|SM_Mixer', name):
        cam.append([round(v, 3) for v in c + h])
json.dump({'solid': solid, 'camera': cam}, open(sys.argv[2], 'w'), separators=(',', ':'))
print(len(solid), 'solid,', len(cam), 'camera')
