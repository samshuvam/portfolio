"""Paint an A350 UV atlas, preserving the source model's geometry and cockpit.

Source: amvlab/aircraft-models, A350_nologo.glb, CC BY 4.0.
The drawing is code-native UV artwork, inspired by the A350F packaging livery.
"""
import io, json, struct
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

root = Path(__file__).resolve().parents[1]
(root / 'qa').mkdir(exist_ok=True)
data = (root / 'public/models/a350-original.glb').read_bytes()
length = struct.unpack_from('<I', data, 12)[0]
gltf = json.loads(data[20:20 + length])
binary = data[28 + length:]
view = gltf['bufferViews'][gltf['images'][0]['bufferView']]
original = Image.open(io.BytesIO(binary[view['byteOffset']:view['byteOffset'] + view['byteLength']])).convert('RGB')
size = 2048
image = original.resize((size, size), Image.Resampling.LANCZOS)
pixels = np.array(image)
# Aircraft surfaces are painted cream/aluminium; the fin keeps its green paint.
blue = (pixels[:,:,2] > pixels[:,:,0] * 1.12) & (pixels[:,:,0] < 110)
yy, xx = np.indices((size, size))
wing = blue & (yy > 1100)
pixels[wing] = [183, 190, 187]
pixels[blue & ~wing & (yy > 800)] = [31, 73, 56]
pixels[blue & (xx > 1450) & (yy < 650)] = [42, 74, 64]
white = np.min(pixels, axis=2) > 230
pixels[white] = [231, 225, 210]
for x0,y0,x1,y1 in [(220,85,715,109),(220,273,715,299),(17,702,440,722),(17,889,425,913)]:
    pixels[y0*2:y1*2,x0*2:x1*2] = [231,225,210]

def accessor(index, dtype, width):
    a = gltf['accessors'][index]
    v = gltf['bufferViews'][a['bufferView']]
    return np.frombuffer(binary, dtype=dtype, count=a['count'] * width,
        offset=v.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, width)

position = accessor(0, '<f4', 3)
uv = accessor(2, '<f4', 2) * size
indices = accessor(3, '<u2', 1).reshape(-1, 3)
# Use the aircraft coordinates to wrap packing tape around the actual fuselage,
# rather than relying on disconnected atlas islands. The A350 is Y-longitudinal.
for triangle in indices:
    points = position[triangle]
    centre = points.mean(axis=0)
    if not (abs(centre[0]) < 3.05 and -46 < centre[1] < 14 and -3.15 < centre[2] < 3):
        continue
    tex = uv[triangle]
    lo = np.maximum(np.floor(tex.min(axis=0)).astype(int), 0)
    hi = np.minimum(np.ceil(tex.max(axis=0)).astype(int), size - 1)
    if np.any(hi < lo): continue
    x, y = np.meshgrid(np.arange(lo[0],hi[0]+1)+.5, np.arange(lo[1],hi[1]+1)+.5)
    a, b, c = tex
    den = (b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
    if abs(den) < .01: continue
    w0 = ((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den
    w1 = ((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den
    w2 = 1-w0-w1
    inside = (w0 >= -.002) & (w1 >= -.002) & (w2 >= -.002)
    # Cockpit glass and its characteristic A350 mask are retained.
    inside &= ~((x < 240) & (y > 245) & (y < 805))
    inside &= ((x < 1450) & (y < 820)) | ((x < 880) & (y > 1300))
    coords = w0[...,None]*points[0]+w1[...,None]*points[1]+w2[...,None]*points[2]
    paint = np.zeros((*x.shape,3), dtype=np.uint8)
    paint[:] = [231,225,210]
    tape = np.abs(coords[:,:,1] + 16 + coords[:,:,2]*1.1) < 1.75
    paint[tape] = [31,73,56]
    fine = np.abs(coords[:,:,1] + 16 + coords[:,:,2]*1.1) < .12
    paint[fine] = [154,176,150]
    aft = coords[:,:,1] < -40
    paint[aft] = [31,73,56]
    patch = pixels[lo[1]:hi[1]+1,lo[0]:hi[0]+1]
    patch[inside] = paint[inside]

image = Image.fromarray(pixels)
draw = ImageDraw.Draw(image)
font_path = Path('C:/Windows/Fonts/arialbd.ttf')
regular = Path('C:/Windows/Fonts/arial.ttf')
def label(x,y,text,points=26,color='#214b39',rotation=0):
    font = ImageFont.truetype(str(font_path), points*2)
    box = font.getbbox(text)
    layer = Image.new('RGBA',(box[2]+8,box[3]-box[1]+12))
    ImageDraw.Draw(layer).text((4,4-box[1]),text,font=font,fill=color)
    # The port-side UV islands run from nose to tail in reverse screen order.
    if y < 190 or 650 < y < 820: layer = ImageOps.mirror(layer)
    if rotation: layer=layer.rotate(rotation,expand=True)
    image.paste(layer,(int(x*2),int(y*2)),layer)

# Both sides of the forward fuselage; small jokes live on the aft package labels.
label(250,118,'SHUVAM',34)
label(250,325,'SHUVAM',34)
label(610,137,'9N-SS',11)
label(610,344,'9N-SS',11)
label(28,746,'IDEAS INSIDE',23)
label(28,953,'IDEAS INSIDE',23)
label(30,780,'HANDLE WITH CURIOSITY',9)
label(30,987,'HANDLE WITH CURIOSITY',9)
label(300,752,'FRAGILE',12)
label(300,959,'FRAGILE',12)
label(310,779,'NO ETA.',9)
label(310,986,'STILL FLYING.',9)
label(817,493,'SS',38,color='#f0e9d7')
label(914,497,'SS',26,color='#f0e9d7',rotation=17)
# A quiet shipping stamp, including the national flower rather than a loud logo.
for cx,cy in [(590,141),(590,348)]:
    for dx,dy in [(0,-5),(5,0),(3,5),(-3,5),(-5,0)]:
        draw.ellipse(((cx+dx-3)*2,(cy+dy-3)*2,(cx+dx+3)*2,(cy+dy+3)*2),fill='#9f5148')
    draw.ellipse((cx*2-3,cy*2-3,cx*2+3,cy*2+3),fill='#ead4a5')

out = io.BytesIO(); image.save(out,format='PNG',optimize=True)
png = out.getvalue()
image.save(root / 'qa/a350-custom-texture.png')
new_binary = binary[:view['byteOffset']] + png
view['byteLength'] = len(png)
gltf['buffers'][0]['byteLength'] = len(new_binary)
gltf['materials'][0]['pbrMetallicRoughness']['roughnessFactor'] = .42
gltf['asset']['extras'] = {'credit':'A350 by amvlab, CC BY 4.0', 'modifications':'Custom SS2504 packaging-inspired livery by Shuvam portfolio'}
encoded = json.dumps(gltf,separators=(',',':')).encode()
encoded += b' ' * (-len(encoded)%4)
new_binary += b'\0' * (-len(new_binary)%4)
total = 12+8+len(encoded)+8+len(new_binary)
glb = struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(new_binary),0x004e4942)+new_binary
(root/'public/models/a350.glb').write_bytes(glb)
print(f'Painted A350: {len(glb):,} bytes, {len(indices):,} triangles')
