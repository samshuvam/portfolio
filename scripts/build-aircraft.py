"""Paint an A350 UV atlas, preserving the source model's geometry and cockpit.

Source: amvlab/aircraft-models, A350_nologo.glb, CC BY 4.0.
The UV paint follows the user's Suvmith Air forest/lime reference livery.
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
# Pearl white fuselage, aluminium wings, forest green fin and engine shells.
blue = (pixels[:,:,2] > pixels[:,:,0] * 1.12) & (pixels[:,:,0] < 110)
yy, xx = np.indices((size, size))
wing = blue & (yy > 1100)
pixels[wing] = [183, 190, 187]
pixels[blue & ~wing & (yy > 800)] = [31, 73, 56]
pixels[blue & (xx > 1450) & (yy < 650)] = [42, 74, 64]
white = np.min(pixels, axis=2) > 230
pixels[white] = [244, 246, 239]
for x0,y0,x1,y1 in [(220,85,715,109),(220,273,715,299),(17,702,440,722),(17,889,425,913)]:
    pixels[y0*2:y1*2,x0*2:x1*2] = [244,246,239]

def accessor(index, dtype, width):
    a = gltf['accessors'][index]
    v = gltf['bufferViews'][a['bufferView']]
    return np.frombuffer(binary, dtype=dtype, count=a['count'] * width,
        offset=v.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, width)

position = accessor(0, '<f4', 3)
uv = accessor(2, '<f4', 2) * size
indices = accessor(3, '<u2', 1).reshape(-1, 3)
fin_mask = np.zeros((size,size),dtype=bool)
# Wrap flowing green/lime ribbons around the actual fuselage. The source A350
# is Y-longitudinal and negative Z points towards the top of the fuselage.
for triangle in indices:
    points = position[triangle]
    centre = points.mean(axis=0)
    is_fin = abs(centre[0]) < .8 and centre[1] < -35 and centre[2] < -2.8
    if not is_fin and not (abs(centre[0]) < 3.05 and -46 < centre[1] < 14 and -3.15 < centre[2] < 3):
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
    if is_fin:
        patch=pixels[lo[1]:hi[1]+1,lo[0]:hi[0]+1]
        patch[inside]=[30,77,56]
        fin_mask[lo[1]:hi[1]+1,lo[0]:hi[0]+1] |= inside
        continue
    # Cockpit glass and its characteristic A350 mask are retained.
    inside &= ~((x < 240) & (y > 245) & (y < 805))
    inside &= ((x < 1450) & (y < 820)) | ((x < 880) & (y > 1300))
    coords = w0[...,None]*points[0]+w1[...,None]*points[1]+w2[...,None]*points[2]
    paint = np.zeros((*x.shape,3), dtype=np.uint8)
    paint[:] = [244,246,239]
    boundary = .8 + .5*np.sin((coords[:,:,1]+12)/13)
    green = coords[:,:,2] > boundary
    paint[green] = [30,77,56]
    lime = (coords[:,:,2] > boundary-.23) & (coords[:,:,2] <= boundary)
    paint[lime] = [161,187,77]
    aft = (coords[:,:,1] < -40) & (coords[:,:,2] > -.9)
    paint[aft] = [30,77,56]
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
    if y < 190 or 650 < y < 820: layer = ImageOps.flip(ImageOps.mirror(layer))
    if rotation: layer=layer.rotate(rotation,expand=True)
    image.paste(layer,(int(x*2),int(y*2)),layer)

# A transparent Nepal engraving, not a photograph of an aircraft. Crop its
# transparent margin before applying it to both UV islands.
mural = Image.open(root/'public/models/nepal-mural.png').convert('RGBA')
mural = mural.crop(mural.getbbox())
for x,y,w,h in [(200,118,495,44),(200,228,495,44),(30,724,380,42),(30,846,380,42)]:
    decal = ImageOps.contain(mural,(w*2,h*2),Image.Resampling.LANCZOS)
    if y < 190 or 650 < y < 820: decal=ImageOps.flip(ImageOps.mirror(decal))
    image.paste(decal,(x*2,y*2),decal)
for y in [87,267]:
    label(285,y,'Suvmith Air',29)
for y in [697,890]:
    label(48,y,'INTELLIGENCE INSIDE',15)
for y in [779,960]:
    label(75,y,'FLIES BEYOND YOUR REACH',7)
    label(296,y,'NO ETA.',8)
for y in [112,292]:label(620,y,'9N-SS',8)
# Fin: Himalayan ridge silhouettes on the two atlas islands.
fin_layer=Image.new('RGBA',(size,size))
draw=ImageDraw.Draw(fin_layer)
for x,y,w,h in [(766,452,100,62),(884,460,116,59)]:
    ridge=[(x,y+h),(x+w*.1,y+h*.55),(x+w*.22,y+h*.69),(x+w*.36,y+h*.18),(x+w*.46,y+h*.5),(x+w*.59,y),(x+w*.74,y+h*.62),(x+w*.89,y+h*.24),(x+w,y+h)]
    draw.polygon([(int(a*2),int(b*2)) for a,b in ridge],fill='#f0f2e5')
    draw.line([(int(a*2),int((b+5)*2)) for a,b in ridge[1:-1]],fill='#a1bb4d',width=5)
alpha=np.array(fin_layer.getchannel('A'));alpha[~fin_mask]=0
fin_layer.putalpha(Image.fromarray(alpha))
image.paste(fin_layer,(0,0),fin_layer)

out = io.BytesIO(); image.save(out,format='PNG',optimize=True)
png = out.getvalue()
image.save(root / 'qa/a350-custom-texture.png')
new_binary = binary[:view['byteOffset']] + png
view['byteLength'] = len(png)
gltf['buffers'][0]['byteLength'] = len(new_binary)
gltf['materials'][0]['pbrMetallicRoughness']['roughnessFactor'] = .34
gltf['asset']['extras'] = {'credit':'A350 by amvlab, CC BY 4.0', 'modifications':'Suvmith Air forest/lime Nepal livery following the user reference images; generated Nepal mural, native UV lettering and ribbons'}
encoded = json.dumps(gltf,separators=(',',':')).encode()
encoded += b' ' * (-len(encoded)%4)
new_binary += b'\0' * (-len(new_binary)%4)
total = 12+8+len(encoded)+8+len(new_binary)
glb = struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(new_binary),0x004e4942)+new_binary
(root/'public/models/a350.glb').write_bytes(glb)
print(f'Painted A350: {len(glb):,} bytes, {len(indices):,} triangles')
