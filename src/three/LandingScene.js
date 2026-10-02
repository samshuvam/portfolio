import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAirliner } from './airliner';
import { getWorld } from '../lib/world';
import { getWeather } from '../lib/weather';
import { getState } from '../lib/store';
import { skyColors } from '../components/hero/sky';
import { P } from '../components/finale/timeline';

// The last scene of the site: flight SS2504 lands on an unknown runway and
// taxis to a stand next to a parked aircraft named Kalyani. Everything is a
// pure function of the scroll progress p (0..1), so scrubbing backwards and
// forwards always shows the same frame. Sky and light follow the real sun
// over Lalitpur.
//
// World layout (1 unit is roughly 10 m, distances are compressed):
//   runway along +X from the threshold at x = 0 to x = 100, centred on z = 0,
//   approach from -X, taxiway and apron on the +Z side, terminal behind it.
//   North is -Z and east is +X, for the sun direction.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const GROUND_Y = 0.485; // aircraft origin height with the gear on the ground
const RWY_LEN = 100;
const RWY_W = 5;
const START_X = -80;
const TD_X = 12; // touchdown point
const AIM_X = 14;
const ROLL_END_X = 52;
const GLIDE = Math.tan((3.5 * Math.PI) / 180);
const FLARE_X = -6;
const PARK_YAW = Math.PI / 4; // nose towards +X -Z, facing the runway
const KALYANI_AT = new THREE.Vector3(79.6, GROUND_Y, 13.2);
const FINAL_TARGET = new THREE.Vector3(75.4, 1.6, 14.2);
const FINAL_DIR = new THREE.Vector3(0.1, 0.24, -1).normalize();

const TAXI = new THREE.CatmullRomCurve3(
  [
    [52, 0, 0],
    [56.5, 0, 0.6],
    [59.6, 0, 4.2],
    [60.8, 0, 9],
    [63.4, 0, 13.6],
    [67.6, 0, 15.6],
    [70.2, 0, 14.6],
    [71.4, 0, 13.2],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  'centripetal',
);

// ---- textures -------------------------------------------------------------

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const radial = (stops) =>
  canvasTex(64, 64, (g) => {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    stops.forEach(([o, c]) => grad.addColorStop(o, c));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  });

function rand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Terai fields: a patchwork of greens and ochres seen from the approach.
function fieldsTexture() {
  const r = rand(2504);
  const tex = canvasTex(256, 256, (g, w, h) => {
    const cols = ['#7d8f55', '#6f8450', '#8a9a5c', '#9a9a62', '#76884f', '#a49a63', '#68794a'];
    g.fillStyle = '#7a8b53';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; ) {
      const rh = 18 + r() * 40;
      for (let x = 0; x < w; ) {
        const rw = 20 + r() * 60;
        g.fillStyle = cols[Math.floor(r() * cols.length)];
        g.fillRect(x, y, rw - 1.5, rh - 1.5);
        x += rw;
      }
      y += rh;
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(36, 36);
  tex.anisotropy = 4;
  return tex;
}

function textTexture(w, h, draw) {
  const tex = canvasTex(w, h, draw);
  tex.anisotropy = 4;
  return tex;
}

const MONO = '"Geist Mono Variable", "Noto Sans Devanagari Variable", ui-monospace, monospace';

function drawSign(g, w, h, line2) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#10131d';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,207,107,0.35)';
  g.lineWidth = 4;
  g.strokeRect(8, 8, w - 16, h - 16);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffcf6b';
  g.font = `600 ${Math.round(h * 0.3)}px ${MONO}`;
  g.fillText('DESTINATION    TBF', w / 2, h * 0.36);
  g.fillStyle = '#f2efe8';
  let size = Math.round(h * 0.2);
  g.font = `500 ${size}px ${MONO}`;
  while (g.measureText(line2).width > w * 0.9 && size > 12) {
    size -= 2;
    g.font = `500 ${size}px ${MONO}`;
  }
  g.fillText(line2, w / 2, h * 0.72);
}

// ---- geometry helpers -----------------------------------------------------

function ribbon(curve, width, y, segs = 96) {
  const pos = [];
  const idx = [];
  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    curve.getPointAt(u, p);
    curve.getTangentAt(u, t);
    const nx = -t.z;
    const nz = t.x;
    pos.push(p.x + (nx * width) / 2, y, p.z + (nz * width) / 2, p.x - (nx * width) / 2, y, p.z - (nz * width) / 2);
    if (i < segs) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  // Winding can come out facing down; force normals up.
  const n = geo.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return geo;
}

function flat(w, d) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  return g;
}

// ---- aircraft pose along the timeline ------------------------------------

const _pt = new THREE.Vector3();
const _tan = new THREE.Vector3();

function pose(p, out) {
  out.roll = 0;
  if (p < P.touchdown) {
    const s = p / P.touchdown;
    const x = lerp(START_X, TD_X, s);
    let h;
    if (x < FLARE_X) h = (AIM_X - x) * GLIDE;
    else {
      // Hermite flare: leaves the glide slope smoothly, touches down softly.
      const u = (x - FLARE_X) / (TD_X - FLARE_X);
      const h0 = (AIM_X - FLARE_X) * GLIDE;
      const m0 = -GLIDE * (TD_X - FLARE_X);
      const m1 = -0.06;
      const u2 = u * u;
      const u3 = u2 * u;
      h = (2 * u3 - 3 * u2 + 1) * h0 + (u3 - 2 * u2 + u) * m0 + (u3 - u2) * m1;
    }
    out.pos.set(x, GROUND_Y + Math.max(0, h), 0);
    out.pitch = 0.045 + 0.05 * smooth(FLARE_X, TD_X, x);
    out.roll = 0.03 * Math.sin(s * 9) * (1 - s) ** 2;
    // A little crab into the crosswind, taken out just before touchdown.
    out.yaw = -0.05 * (1 - smooth(0.62, 0.95, s));
    out.onGround = false;
  } else if (p < P.rollEnd) {
    const s = (p - P.touchdown) / (P.rollEnd - P.touchdown);
    const k = 0.85 * (1 - (1 - s) ** 2) + 0.15 * s;
    out.pos.set(TD_X + (ROLL_END_X - TD_X) * k, GROUND_Y, 0);
    out.pitch = 0.095 * (1 - smooth(0, 0.2, s));
    out.yaw = 0;
    out.onGround = true;
  } else {
    const s = clamp((p - P.rollEnd) / (P.parked - P.rollEnd), 0, 1);
    const u = 0.5 - 0.5 * Math.cos(Math.PI * s);
    TAXI.getPointAt(u, _pt);
    TAXI.getTangentAt(u, _tan);
    out.pos.set(_pt.x, GROUND_Y, _pt.z);
    out.pitch = 0;
    out.yaw = lerp(Math.atan2(-_tan.z, _tan.x), PARK_YAW, smooth(0.86, 1, s));
    out.onGround = true;
  }
  return out;
}

// ---- the scene --------------------------------------------------------------

export function createLandingScene(canvas, { accent = '#214b39', sign = 'Destination: not announced yet', plain = false, onFrame, onTouchdown } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 900);
  const textures = [];
  const own = (t) => {
    textures.push(t);
    return t;
  };

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  scene.fog = new THREE.Fog(0xaabbcc, 90, 430);

  // Sky dome: the same colours as the hero sky, written straight to sRGB.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    uniforms: { uTop: { value: new THREE.Vector3() }, uMid: { value: new THREE.Vector3() }, uHor: { value: new THREE.Vector3() } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
    fragmentShader:
      'uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; varying vec3 vDir; void main(){ float y = vDir.y; vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.16, y)); c = mix(c, uTop, smoothstep(0.16, 0.7, y)); gl_FragColor = vec4(c, 1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  // Stars (night only).
  const starGeo = new THREE.BufferGeometry();
  {
    const r = rand(77);
    const pts = [];
    for (let i = 0; i < 420; i++) {
      const az = r() * Math.PI * 2;
      const el = Math.asin(0.08 + r() * 0.92);
      pts.push(Math.cos(el) * Math.cos(az) * 520, Math.sin(el) * 520, Math.cos(el) * Math.sin(az) * 520);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  }
  const starMat = new THREE.PointsMaterial({ color: 0xfff6e8, size: 1.6, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false, opacity: 0 });
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  scene.add(stars);

  const hemi = new THREE.HemisphereLight(0xdbe8ff, 0x8a8a6a, 1.2);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  scene.add(hemi, sun, sun.target);

  // ---- ground --------------------------------------------------------------
  const fieldTex = own(fieldsTexture());
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: fieldTex, roughness: 1 });
  const ground = new THREE.Mesh(flat(1600, 1600), groundMat);
  ground.position.set(40, 0, 0);
  scene.add(ground);

  const grassMat = new THREE.MeshStandardMaterial({ color: 0x627a48, roughness: 1 });
  const grass = new THREE.Mesh(flat(220, 70), grassMat);
  grass.position.set(40, 0.004, 8);
  scene.add(grass);

  const asphalt = new THREE.MeshStandardMaterial({ color: 0x3b3d42, roughness: 0.92 });
  const runway = new THREE.Mesh(flat(RWY_LEN + 2, RWY_W), asphalt);
  runway.position.set(RWY_LEN / 2, 0.01, 0);
  scene.add(runway);

  // Markings: one instanced mesh for every white stripe.
  const marks = [];
  for (let x = 16; x < RWY_LEN - 10; x += 4) marks.push([x, 0, 2, 0.12]); // centreline
  for (let i = 0; i < 8; i++) {
    const z = -2.0 + (i < 4 ? i : i + 1) * 0.45; // piano keys, gap in the middle
    marks.push([2.5, z, 3, 0.24]);
    marks.push([RWY_LEN - 2.5, z, 3, 0.24]);
  }
  [-1.15, 1.15].forEach((z) => {
    marks.push([AIM_X + 2, z, 4, 0.5]); // aiming point
    marks.push([RWY_LEN - AIM_X - 2, z, 4, 0.5]);
    marks.push([RWY_LEN / 2, z * 2.05, RWY_LEN, 0.1]); // edge lines
  });
  const markMat = new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.8 });
  const markMesh = new THREE.InstancedMesh(flat(1, 1), markMat, marks.length);
  {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    marks.forEach(([x, z, len, w], i) => {
      m.compose(new THREE.Vector3(x, 0.02, z), q, new THREE.Vector3(len, 1, w));
      markMesh.setMatrixAt(i, m);
    });
  }
  scene.add(markMesh);

  // Runway designators: "??" at both ends. The number is not announced yet.
  const desTex = own(
    textTexture(256, 256, (g, w, h) => {
      g.fillStyle = '#ece9e1';
      g.font = `700 200px ${MONO}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('??', w / 2, h / 2 + 8);
    }),
  );
  const desMat = new THREE.MeshStandardMaterial({ map: desTex, transparent: true, roughness: 0.8, depthWrite: false });
  [
    [7.2, -Math.PI / 2],
    [RWY_LEN - 7.2, Math.PI / 2],
  ].forEach(([x, rot]) => {
    const g = new THREE.PlaneGeometry(3.4, 3.4);
    g.rotateX(-Math.PI / 2);
    g.rotateY(rot);
    const mesh = new THREE.Mesh(g, desMat);
    mesh.position.set(x, 0.022, 0);
    scene.add(mesh);
  });

  // Taxiway, apron and stand lines.
  const taxiMat = new THREE.MeshStandardMaterial({ color: 0x46484c, roughness: 0.9 });
  const taxi = new THREE.Mesh(ribbon(TAXI, 3, 0.013), taxiMat);
  scene.add(taxi);
  const apronMat = new THREE.MeshStandardMaterial({ color: 0x6f6e6a, roughness: 0.88 });
  const apron = new THREE.Mesh(flat(40, 15), apronMat);
  apron.position.set(77, 0.011, 15.6);
  scene.add(apron);
  const yellow = new THREE.MeshStandardMaterial({ color: 0xe8b928, roughness: 0.7 });
  scene.add(new THREE.Mesh(ribbon(TAXI, 0.14, 0.03), yellow));
  const kLead = new THREE.LineCurve3(new THREE.Vector3(KALYANI_AT.x - 5, 0, KALYANI_AT.z + 5), new THREE.Vector3(KALYANI_AT.x + 2, 0, KALYANI_AT.z - 2));
  scene.add(new THREE.Mesh(ribbon(kLead, 0.14, 0.03, 4), yellow));

  // Terminal, its unknown name on the roof, the tower and apron floodlights.
  const concrete = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.8 });
  const terminal = new THREE.Mesh(new THREE.BoxGeometry(26, 2.6, 6), concrete);
  terminal.position.set(79, 1.3, 30);
  const roofEdge = new THREE.Mesh(new THREE.BoxGeometry(26.6, 0.35, 6.6), new THREE.MeshStandardMaterial({ color: 0x5b5f68, roughness: 0.7 }));
  roofEdge.position.set(79, 2.75, 30);
  scene.add(roofEdge);
  scene.add(terminal);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1c2533, roughness: 0.18, metalness: 0.4, emissive: new THREE.Color(0xffd29a), emissiveIntensity: 0 });
  const glassGeo = new THREE.PlaneGeometry(23, 1.2);
  glassGeo.rotateY(Math.PI);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(79, 1.35, 26.97);
  scene.add(glass);

  let signLine = sign;
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 220;
  drawSign(signCanvas.getContext('2d'), 1024, 220, signLine);
  const signTex = own(new THREE.CanvasTexture(signCanvas));
  signTex.colorSpace = THREE.SRGBColorSpace;
  signTex.anisotropy = 4;
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false });
  const signGeo = new THREE.PlaneGeometry(10, 2.15);
  signGeo.rotateY(Math.PI);
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(79, 4.2, 27.6);
  scene.add(signMesh);
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x2a2d35, roughness: 0.6, metalness: 0.4 });
  const signBack = new THREE.Mesh(new THREE.BoxGeometry(10.4, 2.45, 0.18), darkMetal);
  signBack.position.set(79, 4.2, 27.72);
  scene.add(signBack);
  const redraw = () => {
    drawSign(signCanvas.getContext('2d'), 1024, 220, signLine);
    signTex.needsUpdate = true;
  };
  document.fonts?.ready.then(() => !disposed && redraw()).catch(() => {});

  const tower = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 8, 16), concrete);
  shaft.position.y = 4;
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.2, 1.4, 8), glassMat);
  cab.position.y = 8.7;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.22, 8), darkMetal);
  roof.position.y = 9.5;
  tower.add(shaft, cab, roof);
  tower.position.set(94, 0, 20.5);
  scene.add(tower);

  const masts = [
    [62, 21],
    [95.5, 15],
  ];
  const mastGeo = new THREE.CylinderGeometry(0.1, 0.14, 9, 8);
  const floods = masts.map(([x, z]) => {
    const pole = new THREE.Mesh(mastGeo, darkMetal);
    pole.position.set(x, 4.5, z);
    scene.add(pole);
    const light = new THREE.PointLight(0xffe2b8, 0, 34, 1.1);
    light.position.set(x, 9, z - 0.6);
    scene.add(light);
    return light;
  });

  // Distant hills ringing the valley, and trees.
  {
    const r = rand(9);
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x5d6e6a, roughness: 1 });
    const hills = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 10), hillMat, 22);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + r() * 0.25;
      const d = 280 + r() * 80;
      const rad = 70 + r() * 60;
      m.compose(new THREE.Vector3(40 + Math.cos(a) * d, -2, Math.sin(a) * d), q, new THREE.Vector3(rad, 12 + r() * 20, rad));
      hills.setMatrixAt(i, m);
    }
    scene.add(hills);

    const treeMat = new THREE.MeshStandardMaterial({ color: 0x2f4a33, roughness: 1, flatShading: true });
    const trees = new THREE.InstancedMesh(new THREE.ConeGeometry(0.9, 2.8, 6), treeMat, 90);
    let n = 0;
    let guard = 0;
    while (n < 90 && guard++ < 2000) {
      const x = -70 + r() * 190;
      const z = (r() < 0.5 ? -1 : 1) * (14 + r() * 40);
      if (x > 50 && x < 104 && z > 4 && z < 38) continue; // apron, terminal, tower
      const s = 0.7 + r() * 0.8;
      m.compose(new THREE.Vector3(x, 1.4 * s, z), q, new THREE.Vector3(s, s, s));
      trees.setMatrixAt(n++, m);
    }
    trees.count = n;
    scene.add(trees);
  }

  // Windsock near the threshold.
  const sockPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.4, 6), darkMetal);
  sockPole.position.set(4, 1.2, 9);
  scene.add(sockPole);
  const sockGeo = new THREE.ConeGeometry(0.2, 1.3, 12, 1, true);
  sockGeo.rotateZ(Math.PI / 2); // tip along -X
  sockGeo.translate(-0.65, 0, 0);
  const sock = new THREE.Mesh(sockGeo, new THREE.MeshStandardMaterial({ color: 0xff6a1a, roughness: 0.7, side: THREE.DoubleSide }));
  sock.position.set(4, 2.3, 9);
  scene.add(sock);

  // ---- lights (one draw call for the static ones) --------------------------
  const glowTex = own(radial([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.7)'], [1, 'rgba(255,255,255,0)']]));
  const lightPts = [];
  const lightCol = [];
  const addLight = (x, y, z, hex) => {
    const c = new THREE.Color(hex);
    lightPts.push(x, y, z);
    lightCol.push(c.r, c.g, c.b);
  };
  for (let x = 0; x <= RWY_LEN; x += 5) {
    addLight(x, 0.18, -2.8, 0xfff0cf);
    addLight(x, 0.18, 2.8, 0xfff0cf);
  }
  for (let z = -2.6; z <= 2.61; z += 0.65) {
    addLight(-0.4, 0.18, z, 0x47ff7e); // threshold, green
    addLight(RWY_LEN + 0.4, 0.18, z, 0xff3b3b); // runway end, red
  }
  for (let x = -3; x >= -36; x -= 3) for (let z = -0.6; z <= 0.61; z += 0.3) addLight(x, 0.35, z, 0xfff6e2);
  for (let z = -4; z <= 4.01; z += 0.5) if (Math.abs(z) > 0.8) addLight(-18, 0.35, z, 0xfff6e2);
  for (let i = 0; i <= 18; i++) {
    const u = i / 18;
    TAXI.getPointAt(u, _pt);
    TAXI.getTangentAt(u, _tan);
    if (_pt.x < 55) continue;
    addLight(_pt.x - _tan.z * 1.7, 0.15, _pt.z + _tan.x * 1.7, 0x4b7bff);
    addLight(_pt.x + _tan.z * 1.7, 0.15, _pt.z - _tan.x * 1.7, 0x4b7bff);
  }
  masts.forEach(([x, z]) => addLight(x, 9, z - 0.3, 0xffe8c4));
  const lightGeo = new THREE.BufferGeometry();
  lightGeo.setAttribute('position', new THREE.Float32BufferAttribute(lightPts, 3));
  lightGeo.setAttribute('color', new THREE.Float32BufferAttribute(lightCol, 3));
  const lightMat = new THREE.PointsMaterial({ size: 0.9, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
  scene.add(new THREE.Points(lightGeo, lightMat));

  // PAPI: four lights left of the aiming point. White over red means on the
  // glide slope; all red means too low, all white too high. Computed live.
  const PAPI_ANG = [4.0, 3.67, 3.33, 3.0]; // inner to outer, degrees
  const papiGeo = new THREE.BufferGeometry();
  papiGeo.setAttribute('position', new THREE.Float32BufferAttribute([AIM_X, 0.2, -4.2, AIM_X, 0.2, -4.9, AIM_X, 0.2, -5.6, AIM_X, 0.2, -6.3], 3));
  papiGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Array(12).fill(1), 3));
  const papiMat = new THREE.PointsMaterial({ size: 1.0, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const papi = new THREE.Points(papiGeo, papiMat);
  scene.add(papi);
  const papiBox = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.18, 0.3), darkMetal, 4);
  {
    const m = new THREE.Matrix4();
    for (let i = 0; i < 4; i++) {
      m.makeTranslation(AIM_X - 0.2, 0.09, -4.2 - i * 0.7);
      papiBox.setMatrixAt(i, m);
    }
  }
  scene.add(papiBox);

  const spriteOf = (hex, size, tex = glowTex, additive = true) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: hex, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
    s.scale.setScalar(size);
    scene.add(s);
    return s;
  };
  const rabbit = spriteOf(0xffffff, 1.6); // sequenced flasher running to the threshold
  const towerBeacon = spriteOf(0x7dffa0, 1.4);
  towerBeacon.position.set(94, 10, 20.5);

  // Tyre smoke: puffs that stay where the wheels touched.
  const smokeTex = own(radial([[0, 'rgba(255,255,255,0.95)'], [0.45, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]));
  const puffs = Array.from({ length: 10 }, (_, i) => {
    const r = rand(31 + i * 7);
    const s = spriteOf(0xe6e3dc, 1, smokeTex, false);
    s.material.opacity = 0;
    s.visible = false;
    return { s, side: i % 2 ? 0.26 : -0.26, dx: r() * 1.4, dz: (r() - 0.5) * 0.6, rise: 0.25 + r() * 0.5, grow: 0.8 + r() * 1.2, delay: r() * 0.25 };
  });

  // Soft contact shadows under both aircraft.
  const shadowTex = own(radial([[0, 'rgba(0,0,0,0.55)'], [0.6, 'rgba(0,0,0,0.25)'], [1, 'rgba(0,0,0,0)']]));
  const shadowMat = () => new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false });
  const shadowGeo = flat(5.2, 4.4);
  const myShadow = new THREE.Mesh(shadowGeo, shadowMat());
  const kShadow = new THREE.Mesh(shadowGeo, shadowMat());
  myShadow.position.y = kShadow.position.y = 0.035;
  kShadow.position.set(KALYANI_AT.x, 0.035, KALYANI_AT.z);
  kShadow.rotation.y = PARK_YAW;
  scene.add(myShadow, kShadow);

  // ---- aircraft --------------------------------------------------------------
  const plane = createAirliner({ accent, variant: 'shuvam' });
  plane.group.rotation.order = 'YZX';
  scene.add(plane.group);
  const landingSpot = new THREE.SpotLight(0xfff1da, 0, 46, 0.42, 0.55, 1.3);
  landingSpot.position.set(1.1, -0.25, 0);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(16, -3.2, 0);
  plane.group.add(landingSpot, spotTarget);
  landingSpot.target = spotTarget;

  const kalyani = createAirliner({ variant: 'kalyani', title: 'KALYANI', registration: '9N-KLY' });
  kalyani.group.position.copy(KALYANI_AT);
  kalyani.group.rotation.y = PARK_YAW;
  kalyani.setGear(1);
  scene.add(kalyani.group);

  document.fonts?.load('400 96px "Noto Sans Tirhuta"', '\u{114AC}\u{114B3}').then(() => !disposed && plane.setAccent(currentAccent)).catch(() => {});
  let currentAccent = accent;

  // ---- environment (sun, sky, theme) -----------------------------------------
  let night = 0;
  const skyVec = (rgb, v) => v.set(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
  function applyEnvironment() {
    const world = getWorld();
    const weather = getWeather();
    const pref = getState().themePref;
    let elev = world.sun.elevation;
    if (pref === 'night' && elev > -8) elev = -14;
    if (pref === 'day' && elev < 8) elev = 22;
    elev = elev ?? 20;
    night = clamp((2 - elev) / 10, 0, 1);
    const golden = clamp(1 - Math.abs(elev - 3) / 10, 0, 1) * (1 - night);
    const c = skyColors(elev, { season: world.season, weather });
    skyVec(c.top, skyMat.uniforms.uTop.value);
    skyVec(c.mid, skyMat.uniforms.uMid.value);
    skyVec(c.horizon, skyMat.uniforms.uHor.value);
    scene.fog.color.setRGB(c.horizon[0] / 255, c.horizon[1] / 255, c.horizon[2] / 255, THREE.SRGBColorSpace);
    const murky = weather && (weather.kind === 'fog' || weather.kind === 'rain' || weather.kind === 'storm');
    scene.fog.near = murky ? 40 : 90;
    scene.fog.far = murky ? 220 : 430;

    // Sun (or moon) direction: azimuth from north, clockwise; north is -Z.
    const az = (((pref === 'auto' ? world.sun.azimuth : 200) ?? 180) * Math.PI) / 180;
    const e = (Math.max(night > 0.5 ? 35 : 6, Math.min(70, elev)) * Math.PI) / 180;
    sun.target.position.set(70, 0, 10);
    sun.position.set(70 + Math.sin(az) * Math.cos(e) * 80, Math.sin(e) * 80, 10 - Math.cos(az) * Math.cos(e) * 80);
    sun.intensity = lerp(2.4, 0.4, night);
    sun.color.setRGB(lerp(1, 0.7, night), lerp(0.97, 0.78, night) * lerp(1, 0.86, golden), lerp(0.93, 1, night) * lerp(1, 0.68, golden));
    hemi.intensity = lerp(1.25, 0.32, night);
    hemi.color.setRGB(lerp(0.86, 0.36, night), lerp(0.91, 0.44, night), lerp(1, 0.72, night));
    hemi.groundColor.setRGB(lerp(0.55, 0.12, night), lerp(0.52, 0.12, night), lerp(0.4, 0.16, night));
    scene.environmentIntensity = lerp(0.85, 0.22, night);
    groundMat.color.setScalar(lerp(1, 0.55, night));
    starMat.opacity = night * night * (weather && weather.cloud > 0.7 ? 0.25 : 1);
    glassMat.emissiveIntensity = night * 1.1;
    floods.forEach((f) => {
      f.intensity = night * 70;
    });
    lightMat.opacity = lerp(0.45, 1, night);
    lightMat.size = lerp(0.5, 1.05, night);
  }
  applyEnvironment();

  // ---- layout and framing ------------------------------------------------------
  const view = { w: 1, h: 1, portrait: false, sx: 0, sy: 0, k: 1, dFinal: 18 };
  function setSize(w, h) {
    view.w = Math.max(1, w);
    view.h = Math.max(1, h);
    const aspect = view.w / view.h;
    view.portrait = aspect < 0.9;
    // Shift the picture away from the copy: right of the text on wide
    // screens, below it on tall ones.
    // A plain frame (reduced motion) has no copy on top of it.
    // On wide screens the picture also rides up, above the summary card.
    view.sx = plain || view.portrait ? 0 : view.w >= 900 ? 0.15 : 0.07;
    view.sy = plain ? 0 : view.portrait ? 0.28 : -0.1;
    view.k = view.portrait ? 1.55 : 1;
    camera.fov = view.portrait ? 50 : 38;
    camera.aspect = aspect;
    const tanV = Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const halfW = 7.8;
    const halfH = 3.2;
    view.dFinal = Math.max(11, halfW / (tanV * aspect * (1 - 2 * view.sx)), halfH / (tanV * (1 - 2 * Math.abs(view.sy))));
    camera.setViewOffset(view.w, view.h, -view.sx * view.w, -view.sy * view.h, view.w, view.h);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, view.w < 768 ? 1.5 : 2));
    renderer.setSize(view.w, view.h, false);
  }

  // ---- per-frame -----------------------------------------------------------------
  const st = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, roll: 0, onGround: false };
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const papiColors = papiGeo.attributes.color;

  function layout(p, t) {
    pose(p, st);
    const g = plane.group;
    g.position.copy(st.pos);
    g.rotation.set(st.roll, st.yaw, st.pitch);
    plane.setGear(smooth(P.gearDown[0], P.gearDown[1], p));
    const lights = p < P.rollEnd ? 1 : lerp(1, 0.25, smooth(P.rollEnd, P.parked, p));
    plane.update(t, { night, landing: lights });
    kalyani.update(t + 0.5, { night: night * 0.8, landing: 0 });
    landingSpot.intensity = lights * night * 90;

    const alt = st.pos.y - GROUND_Y;
    myShadow.position.x = st.pos.x;
    myShadow.position.z = st.pos.z;
    myShadow.rotation.y = st.yaw;
    myShadow.material.opacity = clamp(1 - alt / 3, 0, 1);
    myShadow.scale.setScalar(1 + alt * 0.15);

    // PAPI reading from the aircraft's height over the aiming point.
    if (st.pos.x < AIM_X - 1) {
      const ang = (Math.atan2(alt + 0.15, AIM_X - st.pos.x) * 180) / Math.PI;
      for (let i = 0; i < 4; i++) {
        const white = ang > PAPI_ANG[i];
        papiColors.setXYZ(i, 1, white ? 1 : 0.16, white ? 1 : 0.14);
      }
      papiColors.needsUpdate = true;
    }

    // Rabbit: a strobe racing along the approach lights, twice a second.
    const rp = (t * 2) % 1;
    rabbit.position.set(lerp(-36, -3, rp), 0.45, 0);
    rabbit.material.opacity = (p < P.touchdown ? 1 : 0) * lerp(0.35, 1, night) * (rp < 0.94 ? 1 : 0);
    towerBeacon.material.color.setHex(Math.floor(t * 1.2) % 2 ? 0xffffff : 0x58ff8a);
    towerBeacon.material.opacity = lerp(0.3, 1, night);

    // Tyre smoke after touchdown.
    const sm = (p - P.touchdown) / 0.11;
    puffs.forEach((f) => {
      const k = clamp((sm - f.delay) / (1 - f.delay), 0, 1);
      const on = sm > f.delay && k < 1;
      f.s.visible = on;
      if (!on) return;
      f.s.position.set(TD_X + 0.05 - f.dx * k * 3 - k * 0.6, 0.12 + f.rise * k, f.side + f.dz * k + Math.sign(f.side) * k * 0.4);
      f.s.scale.setScalar(0.35 + f.grow * k);
      f.s.material.opacity = (1 - k) * 0.75 * (1 - k * 0.3);
    });

    // Windsock: points downwind, sways with the live wind.
    const wind = getWeather()?.wind ?? 8;
    sock.rotation.y = 0.5 + Math.sin(t * 0.7) * 0.15;
    sock.rotation.z = clamp(0.9 - wind / 30, 0.05, 0.9) + Math.sin(t * 2.3) * 0.04;

    // Camera: chase during the approach, then settle on the stand.
    const k = view.k;
    tmpA.set(st.pos.x - 10 * k, st.pos.y + 2.4 * k + 0.4, st.pos.z - 6.5 * k);
    // Look ahead of the aircraft (less on tall screens, so it stays framed).
    const ahead = view.portrait ? 2.2 : 7;
    tmpB.set(st.pos.x + ahead, st.pos.y - 0.8 + (view.portrait ? 0.5 : 0), st.pos.z + (view.portrait ? 0.4 : 1.2));
    const b = smooth(0.42, 0.8, p);
    camPos.copy(FINAL_TARGET).addScaledVector(FINAL_DIR, view.dFinal);
    camPos.lerpVectors(tmpA, camPos, b);
    camLook.lerpVectors(tmpB, FINAL_TARGET, b);
    // A breath of handheld drift so the parked frame is not dead still.
    camPos.y += Math.sin(t * 0.4) * 0.06 * b;
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  }

  const kLabel = new THREE.Vector3();
  const pLabel = new THREE.Vector3();
  const labels = { kalyani: { x: 0, y: 0, on: false }, plane: { x: 0, y: 0, on: false } };
  function project() {
    kLabel.set(KALYANI_AT.x, GROUND_Y + 1.25, KALYANI_AT.z).project(camera);
    pLabel.set(st.pos.x, st.pos.y + 1.25, st.pos.z).project(camera);
    labels.kalyani.x = (kLabel.x * 0.5 + 0.5) * view.w;
    labels.kalyani.y = (-kLabel.y * 0.5 + 0.5) * view.h;
    labels.kalyani.on = kLabel.z < 1;
    labels.plane.x = (pLabel.x * 0.5 + 0.5) * view.w;
    labels.plane.y = (-pLabel.y * 0.5 + 0.5) * view.h;
    labels.plane.on = pLabel.z < 1;
    return labels;
  }

  // ---- loop ---------------------------------------------------------------------
  let disposed = false;
  let raf = 0;
  let last = 0;
  let time = 0;
  let envClock = 0;
  let target = 0;
  let cur = 0;

  function draw() {
    layout(cur, time);
    renderer.render(scene, camera);
    onFrame?.(cur, project());
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    time += dt;
    envClock -= dt;
    if (envClock <= 0) {
      applyEnvironment();
      envClock = 20;
    }
    const prev = cur;
    cur += (target - cur) * (1 - Math.exp(-dt * 8));
    if (Math.abs(target - cur) < 1e-4) cur = target;
    if (prev < P.touchdown && cur >= P.touchdown) onTouchdown?.();
    draw();
  }

  return {
    setSize(w, h) {
      setSize(w, h);
      if (!raf) draw();
    },
    setProgress(p, instant = false) {
      target = clamp(p, 0, 1);
      if (instant) cur = target;
    },
    get progress() {
      return cur;
    },
    start() {
      if (raf || disposed) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
    // Re-read sun, theme and season accent; redraw if paused.
    refresh(nextAccent) {
      if (nextAccent && nextAccent !== currentAccent) {
        currentAccent = nextAccent;
        plane.setAccent(nextAccent);
      }
      applyEnvironment();
      if (!raf) draw();
    },
    setSign(text) {
      if (!text || text === signLine) return;
      signLine = text;
      redraw();
      if (!raf) draw();
    },
    renderOnce() {
      draw();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      plane.dispose();
      kalyani.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => m.dispose());
      });
      textures.forEach((t) => t.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
