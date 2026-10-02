"""Convert the GPL FlightGear first-class seating AC3D mesh to embedded glTF.
Original source + textures + GPL are distributed alongside this derived file.
"""
import json,struct,re,io
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1];source=root/'public/models/cabin-source'
text=(source/'seating.ac').read_text();g={'asset':{'version':'2.0','generator':'FlightGear AC3D conversion','extras':{'source':'franck-vmd/Boeing-777-Flightgear','license':'GPL-2.0','changes':'coordinate centering, triangulation and glTF material conversion'}},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':[],'textures':[],'images':[],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}],'buffers':[{'byteLength':0}],'bufferViews':[],'accessors':[]}
binary=bytearray()
def view(data,target=None):
 binary.extend(b'\0'*(-len(binary)%4));v={'buffer':0,'byteOffset':len(binary),'byteLength':len(data)}
 if target:v['target']=target
 i=len(g['bufferViews']);g['bufferViews'].append(v);binary.extend(data);return i
def acc(array,kind):
 a=np.asarray(array,dtype='<f4');v=view(a.tobytes(),34962);r={'bufferView':v,'componentType':5126,'count':len(a),'type':kind}
 if kind=='VEC3':r.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
 i=len(g['accessors']);g['accessors'].append(r);return i
for filename in ['chambreensemble.png','vitres.png']:
 im=Image.open(source/filename).convert('RGB');out=io.BytesIO();im.save(out,'JPEG',quality=93);i=len(g['images']);g['images'].append({'bufferView':view(out.getvalue()),'mimeType':'image/jpeg'});g['textures'].append({'source':i,'sampler':0});g['materials'].append({'name':filename,'doubleSided':True,'pbrMetallicRoughness':{'baseColorTexture':{'index':i},'roughnessFactor':.62,'metallicFactor':.04}})
for block in text.split('OBJECT poly')[1:]:
 name=re.search('name "(.*?)"',block).group(1);v=re.search(r'numvert (\d+)\n(.*?)numsurf',block,re.S);vertices=np.array([list(map(float,l.split())) for l in v.group(2).strip().splitlines()]);vertices+=np.array([12.65,.5,0]);tex=1 if '"vitres.png"' in block else 0
 positions=[];uvs=[];normals=[]
 for surf in block.split('SURF ')[1:]:
  r=re.search(r'refs (\d+)\n(.*?)(?=SURF|kids|$)',surf,re.S)
  if not r:continue
  refs=[list(map(float,l.split())) for l in r.group(2).strip().splitlines()[:int(r.group(1))]]
  for j in range(1,len(refs)-1):
   tri=[refs[0],refs[j],refs[j+1]];p=np.array([vertices[int(a[0])] for a in tri]);n=np.cross(p[1]-p[0],p[2]-p[0]);n/=max(np.linalg.norm(n),1e-12)
   positions.extend(p);normals.extend([n]*3);uvs.extend([[a[1],1-a[2]] for a in tri])
 if not positions:continue
 primitive={'attributes':{'POSITION':acc(positions,'VEC3'),'NORMAL':acc(normals,'VEC3'),'TEXCOORD_0':acc(uvs,'VEC2')},'material':tex}
 i=len(g['meshes']);g['meshes'].append({'name':name,'primitives':[primitive]});g['scenes'][0]['nodes'].append(len(g['nodes']));g['nodes'].append({'name':name,'mesh':i})
g['buffers'][0]['byteLength']=len(binary);js=json.dumps(g,separators=(',',':')).encode();js+=b' '*(-len(js)%4);binary.extend(b'\0'*(-len(binary)%4));total=28+len(js)+len(binary);out=struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary;(root/'public/models/cabin-first-class.glb').write_bytes(out);print('Cabin GLB',len(out),'bytes',len(g['meshes']),'meshes')
