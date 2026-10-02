import * as THREE from 'three';
import { createAirliner } from './airliner';

export function createWindowFlightScene(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.01,100),plane=createAirliner();scene.add(plane.group);
  scene.add(new THREE.HemisphereLight('#edf3ee','#315445',2));const sun=new THREE.DirectionalLight('#fff2df',2.5);sun.position.set(3,5,4);scene.add(sun);
  const windowShape=new THREE.Shape();windowShape.moveTo(-.045,-.04);windowShape.quadraticCurveTo(-.045,-.065,0,-.065);windowShape.quadraticCurveTo(.045,-.065,.045,-.04);windowShape.lineTo(.045,.04);windowShape.quadraticCurveTo(.045,.065,0,.065);windowShape.quadraticCurveTo(-.045,.065,-.045,.04);windowShape.closePath();
  const glass=new THREE.Mesh(new THREE.ShapeGeometry(windowShape),new THREE.MeshStandardMaterial({color:'#132b38',roughness:.12,metalness:.35,side:THREE.DoubleSide}));glass.position.set(.72,.01,.18);plane.group.add(glass);
  let progress=0,disposed=false;
  const render=()=>{if(disposed)return;const p=THREE.MathUtils.smoothstep(progress,0,.85);plane.group.position.set(-2.8*(1-p),.35*(1-p),0);plane.group.rotation.set(0,0,.04*(1-p));camera.position.set(7+( .72-7)*p,2+( .01-2)*p,7+( .215-7)*p);camera.lookAt(.72*p,.01*p,.18*p);camera.fov=36+20*p;camera.updateProjectionMatrix();plane.update(0,{night:0});renderer.render(scene,camera);};
  plane.ready.then(render).catch(()=>{});
  return {ready:plane.ready,setProgress(p){progress=p;render();},resize(w,h){camera.aspect=w/h;renderer.setSize(w,h,false);render();},dispose(){disposed=true;plane.group.remove(glass);glass.geometry.dispose();glass.material.dispose();plane.dispose();renderer.dispose();}};
}
