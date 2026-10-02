import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAirliner } from './airliner';
import { observationTraffic } from './trafficSchedule';
import { getWorld } from '../lib/world';
import { getState } from '../lib/store';

// An observation deck, rather than an aircraft chase camera. The camera never
// follows a landing or zooms into a stand; traffic uses its own airport clock.
export function createAirportScene(canvas,{onTraffic}={}) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.1,1400);
  const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(new RoomEnvironment(),.025).texture;
  scene.environment=env;
  const hemi=new THREE.HemisphereLight('#d4e8ed','#424c3b',1.8);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff0d6',3);sun.position.set(-70,120,80);scene.add(sun);
  const mats=[],geos=new Set(),textures=[];
  const material=(color,roughness=.6,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});mats.push(m);return m;};
  const grass=material('#6b826a',.97),asphalt=material('#34434a',.95),apron=material('#9ca8a7',.88),pearl=material('#e1e5df',.4),copper=material('#d1d6c8',.25,.65),dark=material('#173f45',.28,.4),gold=material('#dabd77',.38,.6),yellow=material('#f1cf76'),white=material('#ecf0e8');
  const glass=material('#507f88',.13,.7);glass.emissive.set('#bdcfb8');glass.emissiveIntensity=.13;
  const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,16),coneGeo=new THREE.ConeGeometry(1,1,10);[boxGeo,cylGeo,coneGeo].forEach(g=>geos.add(g));
  function mesh(geo,m,x,y,z,sx,sy,sz,parent=scene){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
  const box=(m,x,y,z,w,h,d,parent)=>mesh(boxGeo,m,x,y,z,w,h,d,parent);
  const cylinder=(m,x,y,z,r,h,parent)=>mesh(cylGeo,m,x,y,z,r,h,r,parent);
  box(grass,30,-.35,0,600,.6,480);box(apron,51,.01,37,134,.08,64);
  // Two independent runways: nearby arrivals, remote occasional departures.
  const blueLamp=material('#b9d9ed'),greenLamp=material('#c8e5da');for(const m of [blueLamp,greenLamp]){m.emissive.copy(m.color);m.emissiveIntensity=1;}
  function runway(z,length,width){box(asphalt,30,.04,z,length,.08,width);for(let x=-length/2+30;x<length/2+30;x+=8)box(white,x,.10,z,3.8,.025,.18);for(const side of [-1,1]){box(white,30,.1,z+side*(width/2-.4),length,.025,.1);for(let x=-length/2+30;x<length/2+30;x+=7){const bulb=side<0?blueLamp:greenLamp;box(bulb,x,.14,z+side*(width/2+.3),.13,.1,.13);}}for(const x of [-49,109])for(let i=-3;i<=3;i++)box(white,x,.11,z+i*.55,4.2,.025,.24);}
  runway(-14,190,6);runway(135,172,5);
  box(asphalt,44,.08,5,158,.1,3);box(yellow,44,.145,5,156,.015,.1);
  for(const x of [0,36,78,109]){box(asphalt,x,.09,-4,3,.1,19);box(yellow,x,.15,-4,.1,.012,19);}
  // A grand glass concourse with two sweeping roof wings, rooftop gardens,
  // repetitive structural ribs and a separate arrival hall.
  box(dark,50,3.2,58,98,6.4,17);box(glass,50,3.5,49.42,96,5.8,.12);
  for(let x=3;x<=98;x+=3){box(pearl,x,3.3,49.25,.14,6.6,.25);box(pearl,x,3.3,66.5,.18,6.6,.25);}
  for(let x=0;x<=100;x+=2){const y=7.1+2.5*Math.sin(x/100*Math.PI);box(glass,x,6.9+(y-7)/2,49.42,1.94,Math.max(.1,y-6.8),.12);const roof=box(copper,x,y,58,2.16,.24,20);roof.rotation.z=Math.cos(x/100*Math.PI)*.085;}
  box(gold,50,7.65,48.5,100,.18,.24);box(glass,50,7.1,58,28,2.6,14);
  box(pearl,50,8.75,58,30,.22,15.5);box(grass,50,8.95,58,27,.12,13);
  for(let x=39;x<63;x+=4){cylinder(dark,x,9.1,59,.14,.65);mesh(coneGeo,grass,x,9.7,59,.8,1.2,.8);}
  // Jet bridges and passenger piers, each with a parked aircraft and stand.
  const parked=[];
  for(let i=0;i<5;i++){const x=9+i*21;box(glass,x,2.2,37,5,3,24);box(pearl,x,3.85,37,5.4,.24,24);for(let z=28;z<46;z+=3)box(pearl,x,2,z,.18,3.9,.18);
    const bridge=box(dark,x+2,1.5,23,8,1.1,1.3);bridge.rotation.y=.35;box(pearl,x+5.3,1.5,21.8,1.9,1.4,2);
    box(yellow,x+1,.17,16,.08,.015,9);box(yellow,x+1,.17,18,5,.015,.08);
    const plane=createAirliner({variant:i%2?'kalyani':undefined});plane.group.scale.setScalar(1.65);plane.group.position.set(x+1,.8,15);plane.group.rotation.y=-Math.PI/2;plane.setGear(1);scene.add(plane.group);parked.push(plane);
  }
  box(dark,-12,2.7,72,26,5.4,17);box(glass,-12,3,63.4,25,4.5,.1);box(pearl,-12,5.65,72,28,.3,20);
  // Sculpted control tower overlooking both runways.
  cylinder(pearl,115,8,54,2.0,16);cylinder(dark,115,16.5,54,5,3);cylinder(glass,115,17,54,5.2,2);cylinder(copper,115,18.7,54,5.8,.4);
  cylinder(pearl,115,20,54,.09,2.5);
  const beacon=material('#e7957d');beacon.emissive.set('#ff5932');beacon.emissiveIntensity=2;cylinder(beacon,115,21.35,54,.16,.2);
  // Ground transport has its own routes. Vehicles remain small at this scale.
  const vehicles=[];for(let i=0;i<9;i++){const g=new THREE.Group();box(i%3?pearl:yellow,0,.35,0,1.5,.55,.7,g);box(glass,-.2,.75,0,.8,.45,.66,g);for(const x of [-.48,.48])for(const z of [-.4,.4]){const wheel=cylinder(dark,x,.18,z,.18,.1,g);wheel.rotation.x=Math.PI/2;}scene.add(g);vehicles.push(g);}
  box(asphalt,50,.04,87,155,.07,9);box(white,50,.09,87,150,.015,.12);
  for(let i=0;i<30;i++){const x=-31+i*5;box(dark,x,.06,103,3,.09,20);box(white,x-1.4,.12,103,.07,.01,19);}
  for(let i=0;i<42;i++){const x=-44+i*4;const z=81+Math.sin(i*2.1)*3;cylinder(dark,x,.7,z,.12,1.4);mesh(coneGeo,grass,x,2,z,.65,2.1,.65);}
  // Signage is real geometry in the terminal, separate from the UI board.
  const signCanvas=document.createElement('canvas');signCanvas.width=1536;signCanvas.height=160;const sg=signCanvas.getContext('2d');sg.fillStyle='#14383b';sg.fillRect(0,0,1536,160);sg.fillStyle='#e9ecdb';sg.font='48px sans-serif';sg.textAlign='center';sg.fillText('SHUVAM INTERNATIONAL  /  OPEN DESTINATIONS',768,100);
  const signTex=new THREE.CanvasTexture(signCanvas);signTex.colorSpace=THREE.SRGBColorSpace;textures.push(signTex);const signMat=new THREE.MeshBasicMaterial({map:signTex});mats.push(signMat);const signGeo=new THREE.PlaneGeometry(42,4.38);geos.add(signGeo);const sign= new THREE.Mesh(signGeo,signMat);sign.position.set(50,5.2,49.1);sign.rotation.y=Math.PI;scene.add(sign);
  const moving=[createAirliner(),createAirliner({variant:'kalyani'})];moving.forEach(p=>{p.group.scale.setScalar(1.8);scene.add(p.group);});
  // Bake the architecture into material batches. Keep aircraft, vehicles and
  // beacon separate, so a large terminal costs only a few static draws.
  scene.updateMatrixWorld(true);const dynamic=new Set([...moving,...parked].map(p=>p.group).concat(vehicles));const batches=new Map(),remove=[];
  scene.traverse(o=>{if(!o.isMesh||o.material===beacon)return;let parent=o;while(parent){if(dynamic.has(parent))return;parent=parent.parent;}let batch=batches.get(o.material);if(!batch){batch=[];batches.set(o.material,batch);}const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);batch.push(g);remove.push(o);});
  remove.forEach(o=>o.removeFromParent());for(const [m,parts] of batches){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());geos.add(g);scene.add(new THREE.Mesh(g,m));}
  let disposed=false,raf=0,last=0,time=0,active=false,night=0,trafficKey='',pointer={x:0,y:0},size={w:1,h:1};
  function lighting(){const state=getState(),elev=state.themePref==='night'?-12:state.themePref==='day'?35:getWorld().sun.elevation;night=THREE.MathUtils.clamp((4-elev)/16,0,1);scene.background=new THREE.Color().lerpColors(new THREE.Color('#b5ced2'),new THREE.Color('#091826'),night);scene.fog=new THREE.Fog(scene.background,230,680);sun.intensity=3-2.5*night;hemi.intensity=1.8-1.1*night;scene.environmentIntensity=.8-.5*night;glass.emissiveIntensity=.12+.6*night;renderer.toneMappingExposure=1.05;}
  function render(){if(disposed)return;lighting();const rows=[];
    moving.forEach((plane,i)=>{const f=observationTraffic(time,i);rows.push({call:f.flight.call,status:f.status});plane.group.visible=f.visible;if(!f.visible)return;const p=f.p;
      if(f.depart){const x=-45+190*p;plane.group.position.set(x,.88+Math.max(0,p-.45)*34,135);plane.group.rotation.set(0,0,p>.45?.07:0);plane.setGear(p>.70?0:1);}
      else {const approach=Math.min(1,p/.58),x=-132+150*approach;let y=.88+Math.max(0,1-approach)*17,z=-14,yaw=0,pitch=.045;
        if(p>=.58&&p<.74){const t=(p-.58)/.16;plane.group.position.set(18+61*t,.88,-14);pitch=0;}
        else if(p>=.74){const t=(p-.74)/.26;plane.group.position.set(79+13*t,.88,-14+80*t);yaw=-Math.PI/2*Math.min(1,t*3);pitch=0;}
        else plane.group.position.set(x,y,z);plane.group.rotation.set(0,yaw,pitch);plane.setGear(1);}
      plane.update(time+i,{night,landing:1});
    });
    const key=rows.map(r=>r.call+r.status).join('|');if(key!==trafficKey){trafficKey=key;onTraffic?.(rows);}
    parked.forEach(p=>p.update(time,{night,landing:0}));vehicles.forEach((v,i)=>{const t=(time*(i<5?.005:.009)+i*.13)%1;v.position.set(-30+158*t,0,i<5?9:87);v.rotation.y=i<5?0:Math.PI;});
    beacon.emissiveIntensity=Math.sin(time*4)>0?2:.1;
    const aspect=size.w/size.h;camera.fov=aspect<.8?58:43;camera.aspect=aspect;camera.position.set(122+pointer.x*2,84+pointer.y*1.2,-156);camera.lookAt(34,0,26);camera.updateProjectionMatrix();renderer.render(scene,camera);
  }
  function frame(now){raf=requestAnimationFrame(frame);const dt=last?Math.min(.1,(now-last)/1000):0;last=now;time+=dt;render();}
  const ready=Promise.all([...moving,...parked].map(p=>p.ready));
  return {ready,resize(w,h){size={w,h};renderer.setSize(w,h,false);render();},setActive(value){active=value;cancelAnimationFrame(raf);raf=0;last=0;if(active)raf=requestAnimationFrame(frame);else render();},setPointer(x,y){pointer={x,y};},dispose(){disposed=true;cancelAnimationFrame(raf);[...moving,...parked].forEach(p=>p.dispose());geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());env.dispose();pmrem.dispose();renderer.dispose();}};
}
