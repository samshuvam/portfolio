import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createAirliner } from './airliner';

export function createWindowFlightScene(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.004,150),plane=createAirliner();plane.group.scale.setScalar(3);scene.add(plane.group);
  scene.add(new THREE.HemisphereLight('#f5f8ed','#315445',2.4));const sun=new THREE.DirectionalLight('#fff2df',3.2);sun.position.set(4,8,7);scene.add(sun);
  const cabin=new THREE.Group();scene.add(cabin);const resources=new Set(),materials=new Set();
  const mat=(color,roughness=.6,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.add(m);return m;};
  const pearl=mat('#eee8d9'),leather=mat('#235448',.38),trim=mat('#c8a66b',.35,.5),floor=mat('#24322f'),screen=mat('#152932',.2),headrest=mat('#e8e5d9');
  function add(geo,material,x,y,z,parent=cabin){resources.add(geo);const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;}
  const box=(w,h,d,material,x,y,z,parent)=>add(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.15),material,x,y,z,parent);
  box(7,.025,1.13,floor,-.2,-.41,0);
  // Nine abreast, two aisles, individual screens, trays and headrest covers.
  const seatBack=new RoundedBoxGeometry(.06,.3,.1,3,.015),seatBase=new RoundedBoxGeometry(.22,.055,.1,3,.012),rest=new RoundedBoxGeometry(.045,.072,.084,3,.01),display=new THREE.PlaneGeometry(.065,.075);
  [seatBack,seatBase,rest,display].forEach(g=>resources.add(g));
  for(let row=0;row<11;row++)for(const z of [-.5,-.39,-.28,-.105,.005,.115,.29,.4,.51]){
    const x=-2.65+row*.45;
    add(seatBase,leather,x,-.19,z);const back=add(seatBack,leather,x-.09,-.065,z);back.rotation.z=-.11;
    add(rest,headrest,x-.08,.05,z);for(const dz of [-.061,.061])box(.19,.018,.012,trim,x,-.08,z+dz);
    const s=add(display,screen,x-.128,-.02,z);s.rotation.y=-Math.PI/2;
    box(.018,.075,.087,pearl,x-.129,-.115,z);box(.05,.16,.055,trim,x,-.31,z);
  }
  // Openings are holes in cabin-wall geometry, with extruded oval surrounds.
  function oval(cx,cy,rx,ry){const p=new THREE.Path();p.absellipse(cx,cy,rx,ry,0,Math.PI*2,true);return p;}
  for(const side of [-1,1]){
    const shape=new THREE.Shape();shape.moveTo(-3.6,-.4);shape.lineTo(3.45,-.4);shape.lineTo(3.45,.38);shape.lineTo(-3.6,.38);shape.closePath();
    for(let i=0;i<13;i++){const x=-3.08+i*.51;shape.holes.push(oval(x,.095,.09,.125));
      const ring=new THREE.Shape();ring.absellipse(0,0,.12,.16,0,Math.PI*2,false);ring.holes.push(oval(0,0,.092,.126));
      add(new THREE.ExtrudeGeometry(ring,{depth:.035,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.007,bevelThickness:.008,curveSegments:24}),pearl,x,.095,side*.555);
      const sill=box(.21,.025,.055,trim,x,-.077,side*.54);sill.rotation.x=side*.14;
    }
    const wall=add(new THREE.ShapeGeometry(shape,24),pearl,0,0,side*.585);wall.material.side=THREE.DoubleSide;
    box(7,.055,.16,pearl,-.1,.33,side*.43);box(7,.014,.035,trim,-.1,.30,side*.34);
    const bin=box(7,.115,.23,pearl,-.1,.37,side*.4);bin.rotation.x=-side*.25;
    for(let i=0;i<13;i++)box(.008,.13,.21,trim,-3.3+i*.54,.385,side*.4);
  }
  box(7,.03,.58,pearl,-.1,.47,0);const light=mat('#fff9d6',.4);light.emissive.set('#fff0b5');light.emissiveIntensity=.6;for(const z of [-.23,.23])box(7,.012,.02,light,-.1,.425,z);
  const cabinLight=new THREE.PointLight('#fff0d0',.9,4);cabinLight.position.set(1,.25,0);scene.add(cabinLight);
  const texture=new THREE.TextureLoader().load('/imagery/window-v2.webp',()=>render());texture.colorSpace=THREE.SRGBColorSpace;
  const viewMat=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});materials.add(viewMat);
  const sky=add(new THREE.PlaneGeometry(10,7),viewMat,0,.15,3,scene);
  const smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*smooth(t));
  // Outside, cutaway, aisle, seat, window: all driven by reversible scrolling.
  const stations=[{at:0,p:[7,2.2,7],look:[0,0,0]},{at:.25,p:[3.6,.7,2.3],look:[1,.02,0]},{at:.47,p:[2.9,.16,.16],look:[.2,-.04,0]},{at:.67,p:[1.05,.14,.2],look:[.8,.1,.58]},{at:.9,p:[1.02,.11,.435],look:[1.02,.095,3]},{at:1,p:[1.02,.105,.495],look:[1.02,.095,3]}];
  let progress=0,disposed=false,shell=[];
  const render=()=>{if(disposed)return;let i=0;while(i<stations.length-2&&progress>stations[i+1].at)i++;const a=stations[i],b=stations[i+1],t=THREE.MathUtils.clamp((progress-a.at)/(b.at-a.at),0,1);camera.position.set(...mix(a.p,b.p,t));camera.lookAt(...mix(a.look,b.look,t));camera.fov=42+THREE.MathUtils.smoothstep(progress,.3,.6)*10;camera.updateProjectionMatrix();
    const reveal=THREE.MathUtils.smoothstep(progress,.24,.44);shell.forEach(material=>{material.opacity=1-reveal;});plane.group.visible=progress<.45;cabin.visible=progress>.22;sky.visible=progress>.22;plane.update(0,{night:0});renderer.render(scene,camera);
  };
  plane.ready.then(()=>{plane.group.traverse(o=>{if(o.isMesh&&o.material?.map){o.material.transparent=true;o.material.depthWrite=false;shell.push(o.material);}});render();}).catch(()=>{});
  return {ready:plane.ready,setProgress(p){progress=p;render();},resize(w,h){camera.aspect=w/h;renderer.setSize(w,h,false);render();},dispose(){disposed=true;resources.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose();plane.dispose();renderer.dispose();}};
}
