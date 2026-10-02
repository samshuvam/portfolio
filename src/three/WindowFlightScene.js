import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createAirliner } from './airliner';
import { WINDOW_VIEWS } from '../data/windowViews';
export function createWindowFlightScene(canvas,{onViewChange}={}){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(44,1,.015,250),plane=createAirliner();plane.group.scale.setScalar(18);scene.add(plane.group);
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(),.025).texture;scene.environment=environment;scene.environmentIntensity=.65;
  scene.add(new THREE.HemisphereLight('#eff5fa','#49483e',1.8));const sun=new THREE.DirectionalLight('#fff1da',2.2);sun.position.set(-3,12,8);scene.add(sun);
  const cabin=new THREE.Group();scene.add(cabin);const resources=new Set(),materials=new Set(),textures=new Set();
  function textile(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#aaa';g.fillRect(0,0,256,256);for(let y=0;y<256;y+=2)for(let x=0;x<256;x+=2){const v=115+((x*17+y*31)%53);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x,y,1,2);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,6);textures.add(t);return t;}
  const weave=textile();
  const mat=(color,roughness=.65,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.add(m);return m;};
  const pearl=mat('#dad9d2',.48),fabric=mat('#324e4b',.9),soft=mat('#617b71',.85),shell=mat('#caccc7',.42),metal=mat('#929991',.3,.75),floor=mat('#313a3b',.98),dark=mat('#1a2225',.6),cover=mat('#eee9dc',.95);
  fabric.map=soft.map=weave;fabric.bumpMap=soft.bumpMap=weave;fabric.bumpScale=soft.bumpScale=.018;floor.bumpMap=weave;floor.bumpScale=.012;
  const add=(geo,material,x,y,z,parent=cabin)=>{resources.add(geo);const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
  const boxCache=new Map();const box=(w,h,d,m,x,y,z,r=.04,parent=cabin)=>{const key=[w,h,d,r].join('|');let geo=boxCache.get(key);if(!geo){geo=new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3));boxCache.set(key,geo);}return add(geo,m,x,y,z,parent);};
  const stitch=(x,y,z,w)=>{box(.009,.009,w,cover,x,y,z,.003);};
  box(20,.06,5.7,floor,0,-.05,0);box(20,.035,1.15,dark,0,-.009,0);
  // Metric seats: sculpted cushions, lumbar panel, adjustable headrest,
  // seat-back screens, folded trays, fabric pockets, rails and restrained trim.
  const seatBack=new RoundedBoxGeometry(.17,1.05,.47,5,.07),cushion=new RoundedBoxGeometry(.48,.14,.47,5,.065),head=new RoundedBoxGeometry(.16,.24,.45,5,.065);
  [seatBack,cushion,head].forEach(g=>resources.add(g));
  const screenCanvas=document.createElement('canvas');screenCanvas.width=256;screenCanvas.height=160;const sg=screenCanvas.getContext('2d');const grad=sg.createLinearGradient(0,0,256,160);grad.addColorStop(0,'#143d47');grad.addColorStop(1,'#06141d');sg.fillStyle=grad;sg.fillRect(0,0,256,160);sg.fillStyle='#d8e8dc';sg.font='18px sans-serif';sg.fillText('NEPAL / WINDOW SEAT',18,33);sg.font='12px sans-serif';sg.fillText('SUV-1478    JKR → OPEN',18,59);sg.strokeStyle='#7cba9b';sg.beginPath();sg.moveTo(20,118);sg.bezierCurveTo(70,64,170,138,237,77);sg.stroke();
  const screenTex=new THREE.CanvasTexture(screenCanvas);screenTex.colorSpace=THREE.SRGBColorSpace;textures.add(screenTex);const displayMat=new THREE.MeshStandardMaterial({map:screenTex,emissive:'#fff',emissiveMap:screenTex,emissiveIntensity:.35,roughness:.22});materials.add(displayMat);
  for(let row=0;row<20;row++)for(const z of [-2.21,-1.7,-1.19,-.51,0,.51,1.19,1.7,2.21]){
    const x=-8+row*.83;add(cushion,fabric,x,.53,z);const back=add(seatBack,fabric,x-.21,.99,z);back.rotation.z=-.095;
    add(head,soft,x-.20,1.50,z);box(.04,.19,.34,cover,x-.095,1.45,z,.025);
    box(.035,.63,.43,shell,x-.31,1.0,z,.03);box(.036,.25,.35,dark,x-.338,1.23,z,.02);
    const monitor=add(new THREE.PlaneGeometry(.30,.19),displayMat,x-.36,1.23,z);monitor.rotation.y=-Math.PI/2;
    box(.045,.24,.38,shell,x-.348,.88,z,.025);box(.05,.16,.36,soft,x-.38,.64,z,.03);
    for(const dz of [-.265,.265]){box(.42,.045,.045,shell,x,.77,z+dz,.02);box(.37,.055,.055,dark,x+.015,.80,z+dz,.018);box(.07,.35,.035,metal,x-.12,.57,z+dz,.012);}
    box(.19,.39,.14,metal,x-.09,.24,z,.012);box(.58,.025,.038,metal,x,.07,z,.009);stitch(x+.08,.607,z,.37);
    box(.028,.035,.075,metal,x+.22,.60,z+.08,.006);
  }
  function hole(cx,cy,rx,ry){const p=new THREE.Path();p.absellipse(cx,cy,rx,ry,0,Math.PI*2,true);return p;}
  const windowXs=Array.from({length:20},(_,i)=>-7.72+i*.83),targetXs=[windowXs[4],windowXs[5],windowXs[6]];
  for(const side of [-1,1]){
    const wallShape=new THREE.Shape();wallShape.moveTo(-9,0);wallShape.lineTo(10,0);wallShape.lineTo(10,2.25);wallShape.lineTo(-9,2.25);wallShape.closePath();
    for(const x of windowXs){wallShape.holes.push(hole(x,1.35,.185,.29));const ring=new THREE.Shape();ring.absellipse(0,0,.245,.355,0,Math.PI*2,false);ring.holes.push(hole(0,0,.185,.29));const surround=add(new THREE.ExtrudeGeometry(ring,{depth:.065,bevelEnabled:true,bevelSegments:4,bevelSize:.027,bevelThickness:.025,curveSegments:40}),pearl,x,1.35,side*2.70);if(side<0)surround.rotation.y=Math.PI;box(.4,.025,.13,shell,x,.965,side*2.63,.012);box(.14,.028,.016,dark,x,1.665,side*2.69,.008);}
    const wall=add(new THREE.ShapeGeometry(wallShape,40),pearl,0,0,side*2.77);wall.material.side=THREE.DoubleSide;
    box(20,.18,.53,pearl,0,2.20,side*2.15,.085);box(20,.045,.13,shell,0,2.12,side*1.88,.02);
    for(let row=0;row<20;row++){const x=-8+row*.83;const bin=box(.81,.42,.76,shell,x,2.37,side*1.92,.12);bin.rotation.x=-side*.21;box(.22,.025,.045,metal,x,2.17,side*1.64,.01);}
  }
  box(20,.06,3.8,pearl,0,2.67,0,.025);for(const side of [-1,1])for(let i=0;i<8;i++){const t=i/7,z=side*(1.8+t*.92),y=2.67-.5*t*t;const strip=box(20,.06,.15,pearl,0,y,z,.015);strip.rotation.x=side*t*.7;}pearl.side=THREE.DoubleSide;
  const light=mat('#f6efdc',.4);light.emissive.set('#fff0ce');light.emissiveIntensity=1.2;for(const z of [-1.55,1.55])box(20,.035,.035,light,0,2.23,z,.014);
  // Static cabin detail shares a handful of draws instead of thousands of
  // individual seat parts. Windows and their views remain separate.
  cabin.updateMatrixWorld(true);const batches=new Map();
  cabin.traverse(o=>{if(!o.isMesh)return;let batch=batches.get(o.material);if(!batch){batch=[];batches.set(o.material,batch);}batch.push((o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld));});
  cabin.clear();for(const [material,geometries] of batches){const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());resources.add(merged);cabin.add(new THREE.Mesh(merged,material));}
  const loader=new THREE.TextureLoader(),viewTextures=[];
  const ready=Promise.all([plane.ready,...WINDOW_VIEWS.map(async(view,i)=>{const texture=await loader.loadAsync(view.src);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;viewTextures[i]=texture;if(disposed){texture.dispose();return texture;}textures.add(texture);return texture;})]);
  ready.then(()=>{if(disposed)return;for(const side of [-1,1])windowXs.forEach((x,i)=>{const j=((i-4)%3+3)%3,material=new THREE.MeshBasicMaterial({map:viewTextures[j],side:THREE.DoubleSide});materials.add(material);const panel=add(new THREE.PlaneGeometry(.81,1.20),material,x,1.35,side*2.87);if(side<0)panel.rotation.y=Math.PI;});render();}).catch(()=>{});
  const smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*smooth(t)),clamp=THREE.MathUtils.clamp;
  let progress=0,selected=0,travel=null,time=0,last=0,raf=0,disposed=false,active=false;
  function interiorPose(q,x){const stages=[{at:.36,p:[x+.5,1.48,.10],look:[x-4,1.1,0]},{at:.57,p:[x+.35,1.42,.65],look:[x,1.35,2.87]},{at:.81,p:[x,1.35,2.08],look:[x,1.35,3]},{at:1,p:[x,1.35,2.48],look:[x,1.35,3]}];let i=0;while(i<stages.length-2&&q>stages[i+1].at)i++;const a=stages[i],b=stages[i+1],t=clamp((q-a.at)/(b.at-a.at),0,1);return {p:mix(a.p,b.p,t),look:mix(a.look,b.look,t)};}
  function render(){if(disposed)return;plane.group.visible=progress<.36;cabin.visible=progress>=.36;let pos,look;
    if(progress<.36){const t=clamp(progress/.36,0,1);pos=mix([33,10,27],[targetXs[0],1.35,3.18],t);look=mix([0,0,0],[targetXs[0],1.35,2.7],t);}
    else {const pose=interiorPose(progress,targetXs[selected]);pos=pose.p;look=pose.look;}
    if(travel&&progress>.78){const t=clamp((time-travel.start)/4.8,0,1),s=smooth(t),x=travel.from+(travel.to-travel.from)*s,withdraw=Math.sin(Math.PI*t);pos=[x+.13*withdraw,1.35+.14*withdraw,2.48-2.12*withdraw];look=[x-1.2*withdraw,1.35,2.87-.55*withdraw];if(t>=1){selected=travel.index;travel=null;onViewChange?.(selected,false);}}
    camera.position.set(...pos);camera.lookAt(...look);camera.fov=progress<.36?44:48;camera.updateProjectionMatrix();plane.update(time,{night:0});
    viewTextures.forEach((texture,i)=>{texture.repeat.set(.45,.94);texture.offset.set(.275+Math.sin(time*.014+i)*.035,.025+Math.sin(time*.01)*.008);});renderer.render(scene,camera);
  }
  function frame(now){raf=requestAnimationFrame(frame);const dt=last?Math.min(.05,(now-last)/1000):.016;last=now;time+=dt;render();}
  return {ready,setProgress(p){progress=clamp(p,0,1);if(progress<.78&&travel){selected=travel.index;travel=null;onViewChange?.(selected,false);}render();},setView(index){if(index===selected||travel||index<0||index>=WINDOW_VIEWS.length)return;travel={from:targetXs[selected],to:targetXs[index],start:time,index};onViewChange?.(index,true);if(!active){selected=index;travel=null;render();onViewChange?.(index,false);}},setActive(value){active=value;if(value&&!raf){last=0;raf=requestAnimationFrame(frame);}else if(!value){cancelAnimationFrame(raf);raf=0;}},resize(w,h){camera.aspect=w/h;renderer.setSize(w,h,false);render();},dispose(){disposed=true;cancelAnimationFrame(raf);resources.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());plane.dispose();environment.dispose();pmrem.dispose();renderer.dispose();}};
}
