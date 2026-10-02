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
engine_mask=blue & (xx>1450) & (yy>285) & (yy<640)
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
side_art = np.array(Image.open(root/'public/models/suvmith-side-paint.png').convert('RGB'))
art_h,art_w = side_art.shape[:2]
brand = Image.new('RGB',(1000,250),'#f5f7f1')
brand_draw = ImageDraw.Draw(brand)
brand_font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',116)
brand_draw.text((28,52),'Suvmith',font=brand_font,fill='#073f32')
brand_draw.text((515,52),'Air',font=brand_font,fill='#70b92c')
brand_draw.text((40,190),'I N T E L L I G E N C E   I N S I D E',font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',27),fill='#153e31')
brand_draw.line([(48,46),(114,10),(166,44),(190,22),(222,45)],fill='#16573e',width=8)
brand_art=np.array(brand)
# Wrap flowing green/lime ribbons around the actual fuselage. The source A350
# is Y-longitudinal and negative Z points towards the top of the fuselage.
for triangle in indices:
    points = position[triangle]
    centre = points.mean(axis=0)
    is_fin = abs(centre[0]) < .8 and centre[1] < -35 and centre[2] < -2.8
    if not is_fin and not (abs(centre[0]) < 3.35 and -52.5 < centre[1] < 14 and -3.3 < centre[2] < 3.3):
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
        coords = w0[...,None]*points[0]+w1[...,None]*points[1]+w2[...,None]*points[2]
        tx=np.clip((coords[:,:,1]+52)/18,0,1)
        ty=np.clip((-coords[:,:,2]-3)/8.2,0,1)
        ridge=np.maximum(.18+.32*np.maximum(0,1-np.abs(tx-.53)/.18),.18+.21*np.maximum(0,1-np.abs(tx-.78)/.13))
        fin_paint=np.zeros((*x.shape,3),dtype=np.uint8);fin_paint[:]=[6,62,49]
        fin_paint[(ty>.12)&(ty<ridge)]=[245,248,236]
        fin_paint[(ty>ridge)&(ty<ridge+.025)]=[126,183,40]
        fin_paint[(ty>.62-tx*.22)&(ty<.70-tx*.22)]=[126,183,40]
        patch[inside]=fin_paint[inside]
        fin_mask[lo[1]:hi[1]+1,lo[0]:hi[0]+1] |= inside
        continue
    # Cockpit glass and its characteristic A350 mask are retained.
    coords = w0[...,None]*points[0]+w1[...,None]*points[1]+w2[...,None]*points[2]
    source_patch = pixels[lo[1]:hi[1]+1,lo[0]:hi[0]+1]
    inside &= ~((coords[:,:,1]>8) & (np.max(source_patch,axis=2)<110))
    paint = np.zeros((*x.shape,3), dtype=np.uint8)
    paint[:] = [244,246,239]
    # Sample the user's reconstructed flat paint panel in aircraft space.
    # Longitudinal +Y is the nose, negative Z is the crown. Both sides use
    # the same readable nose-to-tail artwork, regardless of UV island flips.
    long=np.clip((12.5-coords[:,:,1])/64.6,0,1)
    sx = np.clip((long*(art_w-1)).astype(int),0,art_w-1)
    sy = np.clip(((.327 + (coords[:,:,2]+3)/6*.331)*(art_h-1)).astype(int),0,art_h-1)
    paint = side_art[sy,sx]
    # Deepen the fine engraving so it survives the small aircraft's mipmaps.
    line=(np.max(paint,axis=2)-np.min(paint,axis=2)<25)&(np.max(paint,axis=2)<225)
    paint[line]=(paint[line]*.73).astype(np.uint8)
    boundary=1.55-3.7*long**2.1
    forest=coords[:,:,2]>boundary
    paint[forest]=[6,62,49]
    ribbon=(coords[:,:,2]>boundary)&(coords[:,:,2]<boundary+.28+.2*np.sin(long*16)**2)
    paint[ribbon]=[118,180,25]
    lower=(coords[:,:,2]>boundary+.7)&(coords[:,:,2]<boundary+.84)&(long>.24)
    paint[lower]=[62,121,36]
    # Typography must read correctly on both sides. A world-space image
    # reverses lettering on one flank; native lettering uses side-aware U.
    logo_area=(coords[:,:,1]>-4)&(coords[:,:,1]<9.5)&(coords[:,:,2]>-2.25)&(coords[:,:,2]<1.0)
    u=np.clip((coords[:,:,1]+4)/13.5,0,1)
    u=np.where(coords[:,:,0]<0,u,1-u)
    v=np.clip((coords[:,:,2]+2.25)/3.25,0,1)
    logo=brand_art[(v*249).astype(int),(u*999).astype(int)]
    paint[logo_area]=logo[logo_area]
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
for y in [123,310]: label(620,y,'SUV-1478',7)
for y in [786,966]: label(250,y,'NO ETA.',7,color='#f4f7eb')
engine_layer=Image.new('RGBA',(size,size));eng=ImageDraw.Draw(engine_layer)
eng.polygon([(1488,310),(1507,306),(1568,626),(1545,633)],fill='#78b521')
eng.polygon([(1495,493),(1535,451),(1553,478),(1580,429),(1631,493),(1605,479),(1581,454),(1571,476),(1552,491),(1536,477)],fill='#f2f6ea')
engine_alpha=np.array(engine_layer.getchannel('A'));engine_alpha[~engine_mask]=0;engine_layer.putalpha(Image.fromarray(engine_alpha));image.paste(engine_layer,(0,0),engine_layer)

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
