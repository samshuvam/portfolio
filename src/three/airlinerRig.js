import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// Only the animated gear and flight lights. All aircraft surfaces come from
// the licensed A350 GLB in airliner.js. Six-wheel main bogies suit the A350F.
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const GROUND=-.44;
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const LIGHT_VERT = `
attribute vec2 aCorner; attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
varying vec2 vC; varying vec3 vColor; varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float s = length(modelViewMatrix[0].xyz);
  mv.xy += aCorner * aSize * s;
  mv.z += aSize * s * 0.35;
  vC = aCorner * 2.0; vColor = aColor; vAlpha = aAlpha;
  gl_Position = projectionMatrix * mv;
}`;
const LIGHT_FRAG = `
varying vec2 vC; varying vec3 vColor; varying float vAlpha;
void main() {
  float d = length(vC);
  if (d > 1.0) discard;
  float halo = pow(1.0 - d, 2.2) * 0.75;
  float core = exp(-d * d * 60.0);
  float a = (halo + core) * vAlpha;
  gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.7) * a, a);
}`;

function lightGlows(defs) {
  const n = defs.length;
  const pos = new Float32Array(n * 12);
  const corner = new Float32Array(n * 8);
  const color = new Float32Array(n * 12);
  const size = new Float32Array(n * 4);
  const alpha = new Float32Array(n * 4);
  const index = [];
  const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  defs.forEach((d, k) => {
    const c = new THREE.Color(d.color);
    for (let v = 0; v < 4; v++) {
      const o = k * 4 + v;
      pos.set([d.pos.x, d.pos.y, d.pos.z], o * 3);
      corner.set(corners[v], o * 2);
      color.set([c.r, c.g, c.b], o * 3);
      size[o] = d.size;
    }
    const b = k * 4;
    index.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
  geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geo.setIndex(index);
  const mat = new THREE.ShaderMaterial({
    vertexShader: LIGHT_VERT,
    fragmentShader: LIGHT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  const ids = Object.fromEntries(defs.map((d, k) => [d.id, k]));
  return {
    mesh,
    set(id, a, s) {
      const k = ids[id];
      for (let v = 0; v < 4; v++) {
        alpha[k * 4 + v] = a;
        if (s !== undefined) size[k * 4 + v] = s;
      }
    },
    flush() {
      geo.attributes.aAlpha.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------------------

function plain(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
}
function coloured(geo, css) {
  const g = plain(geo);
  const c = new THREE.Color(css);
  const arr = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < arr.length; i += 3) arr.set([c.r, c.g, c.b], i);
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

export function createAirliner(options={}) {
 const variant=options.variant==='kalyani'?'kalyani':'shuvam';
 const group=new THREE.Group();
 const mats={gear:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.55}),wing:new THREE.MeshStandardMaterial({color:'#bcc4bf',roughness:.4,metalness:.3}),accent:new THREE.MeshStandardMaterial({color:'#214b39',roughness:.45})};
  const METAL = '#b9bec6';
  const CHROME = '#e4e7ec';
  const TYRE = '#16181d';
  const HUB = '#8d939c';
  const gear = new THREE.Group();
  gear.name = 'gear';
  group.add(gear);

  const cyl = (r, h, seg = 10) => new THREE.CylinderGeometry(r, r, h, seg);
  const wheel = (r, w) => {
    const tyre = new THREE.TorusGeometry(r - w * 0.42, w * 0.5, 8, 22);
    tyre.scale(1, 1, 1);
    const hub = new THREE.CylinderGeometry(r * 0.58, r * 0.58, w * 0.9, 16);
    hub.rotateX(Math.PI / 2);
    return [coloured(tyre, TYRE), coloured(hub, HUB)];
  };

  // Nose gear: hinge inside the nose, retracts forward.
  const NOSE_X = 1.4;
  const noseHingeY = -0.165;
  const noseLeg = new THREE.Group();
  noseLeg.position.set(NOSE_X, noseHingeY, 0);
  {
    const len = GROUND + 0.042 - noseHingeY;
    const L = Math.abs(len);
    const list = [];
    const upper = cyl(0.011, L * 0.7);
    upper.translate(0, -L * 0.35, 0);
    list.push(coloured(upper, METAL));
    const lower = cyl(0.0075, L * 0.38);
    lower.translate(0, -L * 0.8, 0);
    list.push(coloured(lower, CHROME));
    const axle = cyl(0.006, 0.07, 6);
    axle.rotateX(Math.PI / 2);
    axle.translate(0, -L, 0);
    list.push(coloured(axle, METAL));
    const link = new THREE.BoxGeometry(0.03, 0.006, 0.01);
    link.translate(0.012, -L * 0.62, 0);
    list.push(coloured(link, METAL));
    for (const dz of [-0.026, 0.026]) {
      wheel(0.042, 0.022).forEach((g) => {
        g.translate(0, -L, dz);
        list.push(g);
      });
    }
    // taxi light housing
    const lamp = new THREE.BoxGeometry(0.012, 0.012, 0.02);
    lamp.translate(0.012, -L * 0.52, 0);
    list.push(coloured(lamp, CHROME));
    noseLeg.add(new THREE.Mesh(mergeGeometries(list), mats.gear));
    list.forEach((g) => g.dispose());
    noseLeg.userData.len = L;
  }
  gear.add(noseLeg);

  // Nose gear doors: two long panels hinged along the keel edges.
  const noseDoors = [1, -1].map((side) => {
    const pivot = new THREE.Group();
    const bottomY = -0.17;
    pivot.position.set(NOSE_X + 0.07, bottomY + 0.004, side * 0.046);
    const plate = new THREE.BoxGeometry(0.26, 0.005, 0.046);
    plate.translate(0, 0, -side * 0.023);
    pivot.add(new THREE.Mesh(plate, mats.accent));
    gear.add(pivot);
    return { pivot, side };
  });

  // Main gear: hinged in the wing root, retracts inward into the belly.
  const MAIN_X = 0.02;
  const MAIN_Z = 0.38;
  const mainHingeY = -0.035;
  const mains = [1, -1].map((side) => {
    const leg = new THREE.Group();
    leg.position.set(MAIN_X, mainHingeY, side * MAIN_Z);
    const L = mainHingeY - (GROUND + 0.062);
    const list = [];
    const upper = cyl(0.016, L * 0.72);
    upper.translate(0, -L * 0.36, 0);
    list.push(coloured(upper, METAL));
    const lower = cyl(0.0115, L * 0.36);
    lower.translate(0, -L * 0.82, 0);
    list.push(coloured(lower, CHROME));
    const axle = cyl(0.008, 0.11, 8);
    axle.rotateX(Math.PI / 2);
    axle.translate(0, -L, 0);
    list.push(coloured(axle, METAL));
    // side brace up toward the fuselage
    const brace = cyl(0.006, 0.17, 6);
    brace.rotateX(side * 0.95);
    brace.translate(0, -0.07, -side * 0.065);
    list.push(coloured(brace, METAL));
    for (const dx of [-0.07, 0, 0.07]) for (const dz of [-0.042, 0.042]) {
      wheel(0.062, 0.036).forEach((g) => {
        g.translate(dx, -L, dz);
        list.push(g);
      });
    }
    leg.add(new THREE.Mesh(mergeGeometries(list), mats.gear));
    list.forEach((g) => g.dispose());
    // leg door, on the outboard side of the strut
    const door = new THREE.BoxGeometry(0.1, L * 0.62, 0.005);
    door.translate(0.0, -L * 0.36, side * 0.024);
    leg.add(new THREE.Mesh(door, mats.wing));
    gear.add(leg);
    return { leg, side };
  });


 const lights=lightGlows([
 {id:'port',color:0xff3b3b,size:.13,pos:V(-1.25,.08,-2)},
 {id:'starboard',color:0x3bff7a,size:.13,pos:V(-1.25,.08,2)},
 {id:'strobeL',color:0xffffff,size:.3,pos:V(-1.27,.08,-2)},
 {id:'strobeR',color:0xffffff,size:.3,pos:V(-1.27,.08,2)},
 {id:'tail',color:0xffffff,size:.1,pos:V(-1.88,.06,0)},
 {id:'beaconTop',color:0xff2a2a,size:.2,pos:V(.1,.17,0)},
 {id:'beaconBottom',color:0xff2a2a,size:.2,pos:V(-.25,-.18,0)},
 {id:'landingL',color:0xfff3d6,size:.3,pos:V(.35,-.12,-.3)},
 {id:'landingR',color:0xfff3d6,size:.3,pos:V(.35,-.12,.3)},
 {id:'taxi',color:0xfff3d6,size:.2,pos:V(NOSE_X+.02,-.3,0)}]);
 lights.mesh.name='flight-lights';group.add(lights.mesh);
 let gearAmount=-1;
 const api={group,mats,variant,setAccent(){},
    setGear(amount) {
      const g = THREE.MathUtils.clamp(amount || 0, 0, 1);
      if (g === gearAmount) return;
      gearAmount = g;
      gear.visible = g > 0.002;
      if (!gear.visible) return;
      const doors = smooth(0, 0.3, g);
      const legs = smooth(0.12, 1, g);
      noseDoors.forEach(({ pivot, side }) => {
        pivot.rotation.x = side * -1.45 * doors;
      });
      noseLeg.rotation.z = (1 - legs) * (Math.PI / 2) * 0.98;
      mains.forEach(({ leg, side }) => {
        leg.rotation.x = side * (1 - legs) * (Math.PI / 2) * 0.97;
      });
    },

    update(time, { night = 0, landing = 0 } = {}) {
      const lightGain = 0.35 + 0.65 * night;
      lights.set('port', lightGain);
      lights.set('starboard', lightGain);
      lights.set('tail', lightGain * 0.8);
      const strobePhase = time % 1.4;
      const strobe = strobePhase < 0.05 || (strobePhase > 0.16 && strobePhase < 0.21) ? 1 : 0;
      lights.set('strobeL', strobe * (0.5 + 0.5 * night));
      lights.set('strobeR', strobe * (0.5 + 0.5 * night));
      const beacon = Math.max(0, Math.sin(time * Math.PI * 2 * 0.9)) ** 6;
      lights.set('beaconTop', beacon * lightGain);
      lights.set('beaconBottom', beacon * lightGain);
      const land = landing * (0.4 + 0.6 * night);
      const landSize = 0.25 + 0.4 * landing;
      lights.set('landingL', land, landSize);
      lights.set('landingR', land, landSize);
      lights.set('taxi', gear.visible ? land * 0.8 : 0, 0.15 + 0.2 * landing);
      lights.flush();
    },

 exhausts:[V(-.2,-.2,-.85),V(-.2,-.2,.85)],
 dispose(){group.traverse(o=>o.geometry?.dispose());Object.values(mats).forEach(m=>m.dispose());lights.mesh.material.dispose();}
 };
 api.setGear(0);api.update(0,{});return api;
}
