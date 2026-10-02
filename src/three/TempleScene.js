import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// A playable architectural interpretation: actual volumes, arcades, domes,
// courtyard and separated floors, rather than a filter on the facade image.
export function createTempleScene(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(17,12,21);
  const controls=new OrbitControls(camera,canvas);controls.target.set(0,2,0);controls.enableDamping=true;controls.enablePan=false;controls.enableZoom=false;controls.minPolarAngle=.08;controls.maxPolarAngle=Math.PI*.49;controls.autoRotateSpeed=.6;
  scene.add(new THREE.HemisphereLight('#fff8e6','#64705b',2));const sun=new THREE.DirectionalLight('#fff4db',3);sun.position.set(4,10,8);scene.add(sun);
  const model=new THREE.Group();scene.add(model);const levels=[],roof=new THREE.Group();
  const stone=new THREE.MeshStandardMaterial({color:'#f6efe4',roughness:.65}),pink=new THREE.MeshStandardMaterial({color:'#c98099',roughness:.5}),teal=new THREE.MeshStandardMaterial({color:'#329385',roughness:.45}),gold=new THREE.MeshStandardMaterial({color:'#c59d51',metalness:.4,roughness:.4}),dark=new THREE.MeshStandardMaterial({color:'#294a48',roughness:.8});
  const geometries=new Set();
  function mesh(geo,mat,x,y,z,parent=model){geometries.add(geo);const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
  const box=(w,h,d,mat,x,y,z,parent)=>mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);
  const colGeo=new THREE.CylinderGeometry(.085,.11,1.15,10),capGeo=new THREE.BoxGeometry(.28,.1,.28);geometries.add(colGeo);geometries.add(capGeo);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.46,0,0),new THREE.Vector3(-.43,.33,0),new THREE.Vector3(-.28,.51,0),new THREE.Vector3(0,.62,0),new THREE.Vector3(.28,.51,0),new THREE.Vector3(.43,.33,0),new THREE.Vector3(.46,0,0)]);
  const archGeo=new THREE.TubeGeometry(curve,24,.048,6,false);geometries.add(archGeo);
  for(let level=0;level<3;level++){
    const group=new THREE.Group();group.position.y=level*1.6;levels.push(group);model.add(group);
    box(13.7,.15,7.4,stone,0,.03,0,group);box(13.1,1.32,5.65,stone,0,.76,-.65,group);
    for(let j=0;j<13;j++){const x=(j-6)*.98;
      box(.81,1.15,.035,dark,x,.76,2.185,group);
      for(const dx of [-.46,.46]){mesh(colGeo,stone,x+dx,.67,2.7,group);mesh(capGeo,pink,x+dx,1.21,2.7,group);}
      mesh(archGeo,level%2?teal:pink,x,1.15,2.7,group);
      box(.84,.12,.19,pink,x,.15,2.74,group);
      if(level>0)for(let b=0;b<5;b++)box(.035,.28,.07,stone,x-.32+b*.16,.32,3.21,group);
    }
    for(const side of [-1,1])for(let j=0;j<5;j++){
      const z=j*1.03-2.35;const arch=mesh(archGeo,teal,side*6.62,1.15,z,group);arch.rotation.y=Math.PI/2;
      for(const dz of [-.46,.46])mesh(colGeo,stone,side*6.62,.67,z+dz,group);
    }
    box(14,.16,7.65,pink,0,1.49,0,group);box(14.15,.12,7.8,stone,0,1.62,0,group);
  }
  model.add(roof);roof.position.y=4.86;
  const profile=[[0,0],[.76,0],[.91,.14],[.97,.4],[.78,.8],[.47,1.14],[.17,1.48],[.05,1.72],[0,1.78]].map(([x,y])=>new THREE.Vector2(x,y));const domeGeo=new THREE.LatheGeometry(profile,32);geometries.add(domeGeo);
  function dome(x,z,s){box(1.9*s,.65*s,1.9*s,stone,x,.28*s,z,roof);const d=mesh(domeGeo,stone,x,.6*s,z,roof);d.scale.setScalar(s);mesh(new THREE.CylinderGeometry(.018,.035,.48,8),gold,x,2.55*s,z,roof);for(const dx of [-.73,.73])box(.07,.45,.1,teal,x+dx*s,.3*s,z+1*s,roof);}
  dome(0,0,1.25);for(const x of [-5.5,5.5])for(const z of [-2.6,2.6])dome(x,z,.68);for(const x of [-2.6,2.6])dome(x,2.5,.55);
  box(3,4.3,.4,stone,0,2.05,3.23);box(1.45,2,.06,dark,0,1.03,3.46);const gate=mesh(archGeo,pink,0,1.96,3.5);gate.scale.set(1.5,1.3,1.5);
  box(22,.13,16,new THREE.MeshStandardMaterial({color:'#b6c8b4',roughness:.9}),0,-.36,1);
  for(let i=0;i<4;i++)box(7,.12,1.1,stone,0,-.28+i*.11,4.5-i*.26);
  let exploded=false,active=false,raf=0,last=0,disposed=false;
  const frame=time=>{if(disposed)return;raf=0;const dt=Math.min(.05,(time-last)/1000||.016);last=time;levels.forEach((g,i)=>g.position.y=THREE.MathUtils.damp(g.position.y,i*(exploded?2.7:1.6),5,dt));roof.position.y=THREE.MathUtils.damp(roof.position.y,exploded?8.15:4.86,5,dt);controls.update(dt);renderer.render(scene,camera);if(active)raf=requestAnimationFrame(frame);};
  return {resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);if(!active)frame(performance.now());},active(value){active=value;if(active&&!raf)raf=requestAnimationFrame(frame);if(!active){cancelAnimationFrame(raf);raf=0;}},explode(value){exploded=value;},rotate(value){controls.autoRotate=value;},view(plan){camera.position.set(...(plan?[.01,29,.01]:[17,12,21]));controls.target.set(0,2,0);controls.update();},zoom(delta){camera.position.sub(controls.target).multiplyScalar(delta).add(controls.target);controls.update();},select(index){pink.color.set(index===1?'#e5b858':'#c98099');stone.color.set(index===0?'#fff6df':'#f6efe4');},dispose(){disposed=true;cancelAnimationFrame(raf);controls.dispose();geometries.forEach(g=>g.dispose());scene.traverse(o=>{if(o.isMesh)o.material.dispose();});renderer.dispose();}};
}
