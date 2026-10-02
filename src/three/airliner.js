import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createAirliner as createRig } from './airlinerRig';

// The same licensed A350 geometry is used by the intro, page aircraft, hangar
// and landing. Its native transform is baked into the geometry once so that
// the flight scenes keep their shared +X nose / +Y up convention.
let templatePromise;
export function preloadAirliner() {
  if (!templatePromise) {
    templatePromise = new GLTFLoader().loadAsync('/models/a350.glb').then(({ scene }) => {
      scene.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(scene);
      const centre = bounds.getCenter(new THREE.Vector3());
      // Centre on the fuselage, not halfway between the fin and nacelles.
      // The source's zero Z plane is the fuselage centreline.
      const sourceNode = scene.children[0];
      centre.y = sourceNode.position.y;
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 4 / size.x;
      const normalise = new THREE.Matrix4().makeScale(scale, scale, scale)
        .multiply(new THREE.Matrix4().makeTranslation(-centre.x, -centre.y, -centre.z));
      const template = new THREE.Group();
      scene.traverse(object => {
        if (!object.isMesh) return;
        const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld).applyMatrix4(normalise);
        const material = object.material;
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.anisotropy = 8;
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = mesh.receiveShadow = true;
        template.add(mesh);
      });
      template.name = 'A350 / SS2504 / Ideas inside';
      return template;
    }).catch(error => { templatePromise = undefined; throw error; });
  }
  return templatePromise;
}

export function createAirliner(options = {}) {
  const rig = createRig(options);
  // Keep only the working landing gear and animated lights from the flight rig.
  // The previous procedural aircraft is never displayed.
  for (const child of [...rig.group.children]) {
    if (child.name === 'gear' || child.name === 'flight-lights') continue;
    child.traverse(object => object.geometry?.dispose());
    rig.group.remove(child);
  }
  let disposed = false;
  let aircraft;
  const disposeRig = rig.dispose;
  const ready = preloadAirliner().then(template => {
    if (disposed) return;
    aircraft = template.clone();
    aircraft.traverse(object => {
      if (!object.isMesh) return;
      object.material = object.material.clone();
      if (options.variant === 'kalyani') object.material.color.set('#e2dbea');
    });
    rig.group.add(aircraft);
  });
  // Scenes can await ready; rendering is still safe while the small GLB loads.
  ready.catch(error => console.error('A350 model could not load', error));
  return {
    ...rig,
    ready,
    setAccent() {},
    dispose() {
      disposed = true;
      if (aircraft) {
        rig.group.remove(aircraft);
        aircraft.traverse(object => object.material?.dispose());
      }
      disposeRig();
    },
  };
}

export default createAirliner;
