import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createAirliner } from './airliner.js';
import { skyColors, mix } from '../components/hero/sky.js';

// The opening scene: Flight SUV-1478 departing Janakpur Airport (JKR / VNJP),
// runway 27. Everything is built from code, in metres.
//
// World axes: +X east, -Z north, +Y up. Runway 09/27 runs along X, 1,300 m
// by 30 m, centred on the origin, true headings 090 and 270. The runway 27
// threshold is the east end (x = +650); the aircraft departs west (-X),
// toward Kathmandu, then starts a gentle right turn to the north.
//
// Markings follow ICAO Annex 14 for a 30 m wide runway: 8 threshold stripes
// starting 6 m in, 30 m long; 9 m designation numerals 12 m beyond them;
// aiming point markings 300 m in (runway length 1,200 to 2,400 m), dashed
// centreline 30 m stripes with 20 m gaps, 0.9 m edge lines.

export const TIMELINE = {
  atc: [0.4, 2.5, 4.3], // when each radio line starts typing
  cut: 3.0, // establishing shot -> spotter shot
  roll: 3.2,
  liftoff: 5.8,
  gearUp: [6.25, 7.0],
  tilt: 8.2,
  dissolve: 8.35,
  end: 10.3,
};

const HALF_LEN = 650;
const HALF_W = 15;
const Y = { grass: 0.02, paved: 0.08, rubber: 0.12, paint: 0.17, shadow: 0.22 };
const PLANE_SCALE = 7; // the airliner model is 4 units long -> 28 m, ATR-sized
const GEAR_H = 0.485 * PLANE_SCALE; // centre above ground with gear down

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const srgb = (rgb) => new THREE.Color().setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace);
const hexC = (hex) => new THREE.Color(hex);

// Give a geometry a flat vertex colour so many parts can share one draw call.
function tint(geo, color) {
  const c = new THREE.Color(color);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}
const flatRect = (cx, cz, sx, sz, y, color) => {
  const g = new THREE.PlaneGeometry(sx, sz);
  g.rotateX(-Math.PI / 2);
  g.translate(cx, y, cz);
  return tint(g, color);
};
const box = (cx, cy, cz, sx, sy, sz, color) => {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  g.translate(cx, cy, cz);
  return tint(g, color);
};
const cyl = (cx, cy, cz, r0, r1, h, seg, color) => {
  const g = new THREE.CylinderGeometry(r0, r1, h, seg);
  g.translate(cx, cy, cz);
  return tint(g, color);
};

// ---- canvas textures --------------------------------------------------------

function canvasTex(w, h, draw, { repeat = null, srgb: isColor = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.anisotropy = 4;
  return tex;
}

// Terai patchwork: paddy, mustard, wheat and fallow plots split by bunds.
const FIELD_TONES = {
  basanta: ['#7f9a3e', '#a39548', '#8a7a4a', '#6f8f3a', '#b49a58'],
  grishma: ['#a08a58', '#8f7c50', '#b29a62', '#7d8a44', '#9c8a5c'],
  barsha: ['#4f8a34', '#5e9a3a', '#3f7a2e', '#6aa043', '#558f37'],
  sharad: ['#6e9a3a', '#8ca443', '#b7a04a', '#5e8c34', '#a8a04c'],
  hemanta: ['#c4a24a', '#a88a3e', '#8f9a44', '#b89a52', '#d0b25a'],
  shishir: ['#c9b23a', '#d8c24a', '#7f8f4a', '#a39a5a', '#e0c94e'],
};

function fieldsTexture(season) {
  const tones = FIELD_TONES[season] || FIELD_TONES.sharad;
  const rand = rng(2504);
  return canvasTex(
    512,
    512,
    (g, w, h) => {
      g.fillStyle = tones[0];
      g.fillRect(0, 0, w, h);
      const cell = 32;
      for (let y = 0; y < h; y += cell) {
        let x = 0;
        while (x < w) {
          const pw = cell * (1 + Math.floor(rand() * 3));
          g.fillStyle = tones[Math.floor(rand() * tones.length)];
          g.fillRect(x, y, Math.min(pw, w - x), cell);
          // furrows
          g.fillStyle = 'rgba(0,0,0,0.05)';
          for (let k = 2; k < cell; k += 4) g.fillRect(x, y + k, Math.min(pw, w - x), 1);
          x += pw;
        }
      }
      // bunds between plots
      g.fillStyle = 'rgba(232,220,180,0.32)';
      for (let y = 0; y < h; y += cell) g.fillRect(0, y, w, 2);
      for (let i = 0; i < 70; i++) g.fillRect(Math.floor(rand() * 16) * 32, Math.floor(rand() * 16) * 32, 2, cell);
    },
    { repeat: [14, 14] },
  );
}

// Runway designators: "27" in the left half, "09" in the right half.
function numeralTexture() {
  return canvasTex(512, 192, (g) => {
    g.clearRect(0, 0, 512, 192);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    const draw = (txt, cx) => {
      g.save();
      g.translate(cx, 186);
      g.scale(1, 1.7); // Annex 14 numerals are tall and narrow (9 m by 3 m)
      g.font = '700 150px "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
      g.fillText(txt, 0, 0);
      g.restore();
    };
    draw('27', 128);
    draw('09', 384);
  });
}

function signTexture() {
  const draw = (g, w, h) => {
    g.fillStyle = '#f3ecdc';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#9b2f22';
    g.fillRect(0, 0, w, 14);
    g.fillRect(0, h - 14, w, 14);
    g.fillStyle = '#7a1f16';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '400 64px "Noto Sans Devanagari Variable", "Noto Sans Devanagari", sans-serif';
    g.fillText('जनकपुर विमानस्थल', w / 2, 70);
    g.fillStyle = '#1d2230';
    g.font = '700 78px "Geist Variable", "Helvetica Neue", Arial, sans-serif';
    g.fillText('JANAKPUR AIRPORT', w / 2, 150);
    g.font = '600 40px "Geist Mono Variable", ui-monospace, monospace';
    g.fillStyle = '#9b2f22';
    g.fillText('JKR  /  VNJP', w / 2, 214);
  };
  const tex = canvasTex(1024, 256, draw);
  // Redraw once the web fonts are in, so the sign uses them.
  document.fonts?.ready?.then(() => {
    const c = tex.image;
    if (!c || !c.getContext) return;
    draw(c.getContext('2d'), c.width, c.height);
    tex.needsUpdate = true;
  });
  return tex;
}

// Stripes for the windsock, orange and white per ICAO.
function sockTexture() {
  return canvasTex(64, 256, (g, w, h) => {
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i % 2 ? '#f4f1ea' : '#ec5b1c';
      g.fillRect(0, (i * h) / 5, w, h / 5 + 1);
    }
  });
}

// A distant ring of tree tops on the flat Terai horizon (alpha mask).
function treelineTexture() {
  const rand = rng(78);
  return canvasTex(
    1024,
    64,
    (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#ffffff';
      let x = 0;
      while (x < w) {
        const r = 3 + rand() * 9;
        const top = h - 8 - rand() * 26;
        g.beginPath();
        g.arc(x, top + r, r, 0, Math.PI * 2);
        g.fill();
        g.fillRect(x - r, top + r, r * 2, h);
        x += r * (0.9 + rand() * 1.3);
      }
      g.fillRect(0, h - 10, w, 10);
    },
    { repeat: [7, 1], srgb: false },
  );
}

// Janaki Mandir in silhouette: three domes, corner towers and chhatris.
function templeTexture() {
  return canvasTex(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    const base = 250;
    const dome = (x, b, dw, dh) => {
      g.beginPath();
      g.moveTo(x - dw / 2, b);
      g.bezierCurveTo(x - dw / 2, b - dh * 0.62, x - dw * 0.18, b - dh * 0.72, x, b - dh);
      g.bezierCurveTo(x + dw * 0.18, b - dh * 0.72, x + dw / 2, b - dh * 0.62, x + dw / 2, b);
      g.closePath();
      g.fill();
      g.fillRect(x - 1.5, b - dh - 14, 3, 14);
    };
    g.fillRect(40, 150, 432, base - 150); // main body
    g.fillRect(70, 110, 54, base - 110); // corner towers
    g.fillRect(388, 110, 54, base - 110);
    g.fillRect(186, 120, 140, 40);
    dome(97, 110, 56, 58);
    dome(415, 110, 56, 58);
    dome(256, 120, 92, 76);
    dome(160, 150, 30, 26);
    dome(352, 150, 30, 26);
    // gate arch cut out
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.moveTo(236, base);
    g.lineTo(236, 210);
    g.arc(256, 210, 20, Math.PI, 0);
    g.lineTo(276, base);
    g.fill();
    g.globalCompositeOperation = 'source-over';
  }, { srgb: false });
}

function blobTexture() {
  return canvasTex(64, 64, (g) => {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  });
}

// ---- the flight path, simulated once and sampled per frame ------------------

const TAXI = (() => {
  // From the apron down the connector at x = 575, a quarter turn onto the
  // centreline, then a few metres west.
  const legs = [20, (Math.PI / 2) * 25, 12];
  const total = legs[0] + legs[1] + legs[2];
  return (s) => {
    if (s <= legs[0]) return { x: 575, z: -45 + s, yaw: -Math.PI / 2 };
    if (s <= legs[0] + legs[1]) {
      const a = (s - legs[0]) / 25;
      return { x: 550 + 25 * Math.cos(a), z: -25 + 25 * Math.sin(a), yaw: -Math.PI / 2 - a };
    }
    return { x: 550 - (s - legs[0] - legs[1]), z: 0, yaw: Math.PI };
  };
})();
const TAXI_LEN = 20 + (Math.PI / 2) * 25 + 12;

function buildPath() {
  const T = TIMELINE;
  const step = 1 / 120;
  const frames = [];
  const st = { x: 538, z: 0, alt: 0, v: 0, yaw: Math.PI };
  const total = 16;
  for (let i = 0; i <= total / step; i++) {
    const t = i * step;
    let f;
    if (t < T.roll) {
      const u = t < 0.2 ? 0 : Math.min(1, (t - 0.2) / 2.4);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const p = TAXI(e * TAXI_LEN);
      f = { x: p.x, z: p.z, alt: 0, yaw: p.yaw, v: 0 };
    } else {
      const a = t < T.liftoff ? 54 : 10;
      st.v += a * step;
      if (t > 6.8) st.yaw -= 0.11 * smooth((t - 6.8) / 1.2) * step; // right turn toward the north
      st.x += Math.cos(st.yaw) * st.v * step;
      st.z += -Math.sin(st.yaw) * st.v * step;
      if (t > T.liftoff) st.alt += Math.min(30, 26 * (t - T.liftoff)) * step;
      f = { x: st.x, z: st.z, alt: st.alt, yaw: st.yaw, v: st.v };
    }
    // pitch: rotate from 0.4 s before lift-off, then settle in the climb
    const rot = smooth((t - (T.liftoff - 0.45)) / 0.5) * 0.16 + smooth((t - T.liftoff) / 0.9) * 0.05;
    f.pitch = rot;
    f.bank = 0.24 * smooth((t - 6.8) / 1.1);
    f.gear = 1 - smooth((t - T.gearUp[0]) / (T.gearUp[1] - T.gearUp[0]));
    frames.push(f);
  }
  return {
    step,
    sample(t) {
      const k = Math.min(frames.length - 1, Math.max(0, t / step));
      const i = Math.floor(k);
      const j = Math.min(frames.length - 1, i + 1);
      const fr = k - i;
      const a = frames[i];
      const b = frames[j];
      const out = {};
      for (const key in a) out[key] = a[key] + (b[key] - a[key]) * fr;
      // yaw wraps from -PI to PI at the end of the taxi: never interpolate across it
      if (Math.abs(b.yaw - a.yaw) > 1) out.yaw = a.yaw;
      return out;
    },
  };
}

// ---- scene ------------------------------------------------------------------

export function createTakeoffScene({ canvas, accent = '#f08a24', world, weather, mobile = false, onContextLost } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('No WebGL');
  const dprCap = mobile ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const lost = (e) => {
    e.preventDefault();
    onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', lost);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 1.5, 7000);
  const disposables = [];
  const keep = (x) => {
    disposables.push(x);
    return x;
  };

  // ---- light and air from the real sky over Nepal ----------------------------
  const sunEl = world?.sun?.elevation ?? 30;
  const sunAz = ((world?.sun?.azimuth ?? 180) * Math.PI) / 180;
  const season = world?.season;
  const seasonId = season?.id || 'sharad';
  const night = clamp01((2 - sunEl) / 10);
  const day = 1 - night;
  const sky = skyColors(sunEl, { season, weather });

  const sunDir = new THREE.Vector3(Math.sin(sunAz), Math.sin((Math.max(sunEl, -10) * Math.PI) / 180), -Math.cos(sunAz)).normalize();
  const kind = weather?.kind;
  const wet = kind === 'rain' || kind === 'drizzle' || kind === 'storm';
  const overcast = kind === 'cloudy' || wet ? Math.max(0.55, weather?.cloud ?? 0.6) : (weather?.cloud ?? 0.2) * 0.4;

  const horizonC = srgb(sky.horizon);
  scene.background = horizonC.clone();
  const fogFar = kind === 'fog' ? 900 : wet ? 2200 : 4600 - (season?.scene?.haze ?? 0.1) * 1400;
  scene.fog = new THREE.Fog(horizonC.clone(), kind === 'fog' ? 40 : 320, fogFar);

  const hemi = new THREE.HemisphereLight(srgb(mix(sky.mid, [255, 255, 255], 0.25)), srgb(mix([92, 84, 60], sky.horizon, 0.2)), lerp(0.55, 1.5, day));
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight(srgb(mix([255, 168, 98], [255, 246, 228], clamp01(sunEl / 25))), 0);
  sunLight.intensity = clamp01((sunEl + 2) / 6) * lerp(1.1, 2.8, clamp01(sunEl / 30)) * (1 - 0.65 * overcast);
  sunLight.position.set(sunDir.x, Math.max(0.08, sunDir.y), sunDir.z).multiplyScalar(100);
  scene.add(sunLight);
  // moonlight at night, soft and blue
  const moon = new THREE.DirectionalLight(hexC('#9fb4ff'), night * (0.25 + 0.55 * (world?.moon?.illumination ?? 0.5)));
  moon.position.set(-40, 80, 30);
  scene.add(moon);

  // Sky dome with sun glow and a few stars.
  const skyMat = keep(
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: srgb(sky.top) },
        uMid: { value: srgb(sky.mid) },
        uHorizon: { value: horizonC.clone() },
        uSunDir: { value: sunDir.clone() },
        uSunColor: { value: srgb(mix([255, 150, 80], [255, 240, 210], clamp01(sunEl / 20))) },
        uSunVis: { value: clamp01((sunEl + 3) / 6) * (1 - 0.8 * overcast) },
        uStars: { value: night * (1 - overcast) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop, uMid, uHorizon, uSunDir, uSunColor;
        uniform float uSunVis, uStars;
        varying vec3 vDir;
        float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
        void main() {
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h));
          col = mix(col, uTop, smoothstep(0.2, 0.85, h));
          float s = max(dot(d, uSunDir), 0.0);
          col += uSunColor * (pow(s, 900.0) * 4.0 + pow(s, 14.0) * 0.32 + pow(s, 3.0) * 0.06) * uSunVis;
          vec3 cell = floor(d * 420.0);
          float st = step(0.9982, hash(cell)) * smoothstep(0.05, 0.3, h) * uStars;
          col += vec3(st * (0.6 + 0.4 * hash(cell + 3.1)));
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  const skyMesh = new THREE.Mesh(keep(new THREE.SphereGeometry(5000, 32, 16)), skyMat);
  skyMesh.renderOrder = -10;
  skyMesh.frustumCulled = false;
  scene.add(skyMesh);

  // ---- ground: fields, the distant tree line and a hint of Janakpur ---------
  const fieldsTex = keep(fieldsTexture(seasonId));
  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(14000, 14000).rotateX(-Math.PI / 2)), keep(new THREE.MeshLambertMaterial({ map: fieldsTex })));
  scene.add(ground);

  const treeTex = keep(treelineTexture());
  const ringMat = keep(new THREE.MeshBasicMaterial({ color: srgb(mix([40, 62, 38], sky.horizon, 0.25 + night * 0.4)), alphaMap: treeTex, transparent: true, alphaTest: 0.4, side: THREE.BackSide, depthWrite: false }));
  const ring = new THREE.Mesh(keep(new THREE.CylinderGeometry(3300, 3300, 70, 48, 1, true)), ringMat);
  ring.position.y = 33;
  scene.add(ring);

  const templeTex = keep(templeTexture());
  const templeMat = keep(new THREE.MeshBasicMaterial({ color: srgb(mix([226, 222, 210], sky.horizon, 0.35 + night * 0.4)), alphaMap: templeTex, transparent: true, alphaTest: 0.35, depthWrite: false }));
  const temple = new THREE.Mesh(keep(new THREE.PlaneGeometry(190, 95)), templeMat);
  temple.position.set(1300, 46, -2700);
  temple.lookAt(300, 46, 0);
  scene.add(temple);

  // ---- paved surfaces (one draw call, vertex coloured) ----------------------
  const grassC = hexC(seasonId === 'shishir' || seasonId === 'grishma' ? '#8f9150' : '#6e9446');
  const asphalt = hexC('#3a3d42');
  const rubber = hexC('#2a2c30');
  const concrete = hexC('#a7a59e');
  const surfaces = [
    flatRect(0, -30, 1600, 260, Y.grass, grassC), // airport strip and infield
    flatRect(0, 0, HALF_LEN * 2, HALF_W * 2, Y.paved, asphalt),
    flatRect(575, -32.5, 15, 35, Y.paved, asphalt), // connector taxiway
    flatRect(585, -72, 120, 44, Y.paved, concrete), // apron
    flatRect(640 - 260, -6, 140, 18, Y.rubber, rubber), // rubber deposits (touchdown zone of 09 arrivals)
    flatRect(-640 + 260, 6, 140, 18, Y.rubber, rubber),
    flatRect(585, -150, 160, 22, Y.paved, hexC('#6b6a64')), // landside road
  ];
  const surfMat = keep(new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  const surfGeo = keep(mergeGeometries(surfaces));
  surfaces.forEach((g) => g.dispose());
  scene.add(new THREE.Mesh(surfGeo, surfMat));

  // ---- runway and taxiway paint (one instanced draw call) -------------------
  const marks = [];
  const white = hexC('#f2f1ec');
  const yellow = hexC('#f2c230');
  const rect = (cx, cz, sx, sz, c = white) => marks.push({ cx, cz, sx, sz, c });
  for (const s of [1, -1]) {
    const thr = s * HALF_LEN;
    // threshold: 8 stripes, 30 m long, 6 m in from the threshold
    [2.55, 5.75, 8.95, 12.15].forEach((zc) => {
      rect(thr - s * 21, zc, 30, 1.7);
      rect(thr - s * 21, -zc, 30, 1.7);
    });
    // aiming point markings: begin 300 m in, 45 m long
    rect(thr - s * (300 + 22.5), 8.5, 45, 5);
    rect(thr - s * (300 + 22.5), -8.5, 45, 5);
  }
  // centreline: 30 m stripes, 20 m gaps, between the two designators
  const clStart = HALF_LEN - 69;
  const clLen = clStart * 2;
  const nStripes = Math.floor((clLen + 20) / 50);
  const pitch = (clLen - 30) / (nStripes - 1);
  for (let i = 0; i < nStripes; i++) rect(clStart - 15 - i * pitch, 0, 30, 0.45);
  // edge lines, full length
  rect(0, HALF_W - 0.45, HALF_LEN * 2, 0.9);
  rect(0, -(HALF_W - 0.45), HALF_LEN * 2, 0.9);
  // taxiway: yellow centreline curving onto the runway centreline, holding position
  rect(575, -38, 0.3, 24, yellow);
  for (let i = 0; i < 10; i++) {
    const a0 = (i / 10) * (Math.PI / 2);
    const a1 = ((i + 1) / 10) * (Math.PI / 2);
    const am = (a0 + a1) / 2;
    marks.push({ cx: 550 + 25 * Math.cos(am), cz: -25 + 25 * Math.sin(am), sx: 0.3, sz: 25 * (a1 - a0) + 0.1, c: yellow, rot: -am });
  }
  [-43.6, -44.4].forEach((z) => rect(575, z, 15, 0.3, yellow));
  for (let i = 0; i < 5; i++) {
    [-45.6, -46.4].forEach((z) => rect(568.5 + i * 3, z, 1.5, 0.3, yellow));
  }
  const markGeo = keep(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  const markMat = keep(new THREE.MeshLambertMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  const markMesh = new THREE.InstancedMesh(markGeo, markMat, marks.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  marks.forEach((mk, i) => {
    q.setFromAxisAngle(up, mk.rot || 0);
    m4.compose(new THREE.Vector3(mk.cx, Y.paint, mk.cz), q, new THREE.Vector3(mk.sx, 1, mk.sz));
    markMesh.setMatrixAt(i, m4);
    markMesh.setColorAt(i, mk.c);
  });
  scene.add(markMesh);

  // Designators "27" (east end, read by a pilot heading 270) and "09".
  const numTex = keep(numeralTexture());
  const numPlate = (u0, rotY, x) => {
    const g = new THREE.PlaneGeometry(12, 9);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * 0.5);
    g.rotateX(-Math.PI / 2);
    g.rotateY(rotY);
    g.translate(x, Y.paint, 0);
    return g;
  };
  const numParts = [numPlate(0, Math.PI / 2, HALF_LEN - 52.5), numPlate(0.5, -Math.PI / 2, -(HALF_LEN - 52.5))];
  const numGeo = keep(mergeGeometries(numParts));
  numParts.forEach((g) => g.dispose());
  const numMat = keep(new THREE.MeshLambertMaterial({ map: numTex, transparent: true, alphaTest: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  scene.add(new THREE.Mesh(numGeo, numMat));

  // ---- buildings: terminal, control tower, windsock mast (one draw call) ----
  const cream = hexC('#efe6d2');
  const brick = hexC('#a5452f');
  const greyC = hexC('#8e8b84');
  const parts = [
    box(585, 4, -112, 80, 8, 18, cream),
    box(585, 8.5, -112, 84, 1, 21, brick), // roof band
    box(585, 3.6, -101.2, 34, 0.6, 4, greyC), // porch canopy
    box(560, 1.8, -101.6, 0.5, 3.6, 0.5, greyC),
    box(610, 1.8, -101.6, 0.5, 3.6, 0.5, greyC),
    box(585, 11, -112.5, 0.6, 4, 0.6, greyC), // sign posts
    cyl(505, 8, -104, 2.2, 2.6, 16, 10, cream), // tower shaft
    cyl(505, 16.4, -104, 4.4, 4.4, 0.8, 8, brick), // cab floor
    cyl(505, 20.2, -104, 4.8, 4.6, 0.6, 8, brick), // cab roof
    cyl(505, 22.4, -104, 0.08, 0.08, 4, 4, greyC), // antenna
    cyl(615, 3, 42, 0.1, 0.14, 6, 6, hexC('#d8d4cc')), // windsock mast
    cyl(470, 7, -82, 0.25, 0.3, 14, 6, greyC), // apron flood mast
    cyl(650, 7, -82, 0.25, 0.3, 14, 6, greyC),
    box(470, 14.3, -82, 2.4, 0.6, 0.6, greyC),
    box(650, 14.3, -82, 2.4, 0.6, 0.6, greyC),
    box(430, 3, -120, 26, 6, 20, hexC('#c9c3b4')), // hangar
  ];
  const bGeo = keep(mergeGeometries(parts));
  parts.forEach((g) => g.dispose());
  const bMat = keep(new THREE.MeshLambertMaterial({ vertexColors: true }));
  scene.add(new THREE.Mesh(bGeo, bMat));

  // glass: terminal window band and tower cab (glow warm at night)
  const glassParts = [];
  const band = new THREE.PlaneGeometry(72, 2.4);
  band.translate(585, 4.6, -102.95);
  glassParts.push(band);
  const lower = new THREE.PlaneGeometry(28, 2.6);
  lower.translate(585, 1.3, -102.95);
  glassParts.push(lower);
  const cab = new THREE.CylinderGeometry(4.6, 4.2, 3.4, 8, 1, true);
  cab.translate(505, 18.5, -104);
  glassParts.push(cab.toNonIndexed());
  cab.dispose();
  const glassGeo = keep(mergeGeometries(glassParts.map((g) => (g.index ? g.toNonIndexed() : g))));
  glassParts.forEach((g) => g.dispose());
  const glassMat = keep(new THREE.MeshLambertMaterial({ color: hexC('#27303c'), emissive: hexC('#ffcf8a'), emissiveIntensity: night * 0.85, side: THREE.DoubleSide }));
  scene.add(new THREE.Mesh(glassGeo, glassMat));

  // the sign on the terminal roof, facing the runway
  const signTex = keep(signTexture());
  const signMat = keep(new THREE.MeshLambertMaterial({ map: signTex, emissive: hexC('#ffffff'), emissiveMap: signTex, emissiveIntensity: night * 0.55 }));
  const sign = new THREE.Mesh(keep(new THREE.PlaneGeometry(34, 8.5)), signMat);
  sign.position.set(585, 13.2, -112.1);
  scene.add(sign);

  // windsock: a striped truncated cone that streams with the live wind
  const windKmh = weather?.wind ?? 6;
  const sockTex = keep(sockTexture());
  const sockGeo = keep(new THREE.CylinderGeometry(0.45, 0.22, 3.6, 12, 1, true));
  sockGeo.rotateZ(Math.PI / 2); // axis along X; wide mouth at -X
  sockGeo.translate(1.8, 0, 0);
  const sock = new THREE.Mesh(sockGeo, keep(new THREE.MeshLambertMaterial({ map: sockTex, side: THREE.DoubleSide })));
  sock.position.set(615, 5.8, 42);
  sock.rotation.y = -0.6; // streaming roughly east (illustrative: the feed has speed, not direction)
  const sockLift = clamp01(windKmh / 28);
  sock.rotation.z = lerp(-1.25, -0.08, sockLift);
  scene.add(sock);

  // ---- trees and mango groves (one instanced draw call) ---------------------
  const trunk = tint(new THREE.CylinderGeometry(0.3, 0.45, 3.2, 5).translate(0, 1.6, 0), hexC('#5a4a3a'));
  const crown = tint(new THREE.IcosahedronGeometry(1, 1).scale(3.6, 3, 3.6).translate(0, 5.4, 0), hexC('#ffffff'));
  const flat = (g) => (g.index ? g.toNonIndexed() : g);
  const treeGeo = keep(mergeGeometries([flat(trunk), flat(crown)]));
  trunk.dispose();
  crown.dispose();
  const treeMat = keep(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  const rand = rng(1910);
  const spots = [];
  const blocked = (x, z) => (Math.abs(x) < 820 && z > -190 && z < 95) || Math.hypot(x - 300, z - 52) < 40;
  const tryAdd = (x, z, s, mango) => {
    if (!blocked(x, z)) spots.push({ x, z, s, mango });
  };
  // mango groves: dense clumps of round dark crowns
  for (let gI = 0; gI < (mobile ? 18 : 26); gI++) {
    const ang = rand() * Math.PI * 2;
    const dist = 260 + rand() * 1700;
    const gx = Math.cos(ang) * dist;
    const gz = Math.sin(ang) * dist * 0.8;
    const n = 8 + Math.floor(rand() * (mobile ? 10 : 16));
    for (let i = 0; i < n; i++) tryAdd(gx + (rand() - 0.5) * 90, gz + (rand() - 0.5) * 70, 1 + rand() * 0.7, true);
  }
  // trees along the airport fence and the field bunds
  for (let i = 0; i < (mobile ? 70 : 120); i++) tryAdd(-900 + rand() * 1900, 110 + rand() * 40, 0.8 + rand() * 0.8, false);
  for (let i = 0; i < (mobile ? 50 : 90); i++) tryAdd(-900 + rand() * 1900, -210 - rand() * 60, 0.8 + rand() * 0.8, false);
  for (let i = 0; i < (mobile ? 40 : 80); i++) tryAdd((rand() - 0.5) * 3600, (rand() - 0.5) * 3000, 0.7 + rand() * 0.9, false);
  const foliage = (season?.scene?.foliage || ['#2f8a3e', '#4fae4a']).map(hexC);
  const mangoC = hexC('#2f5a2a');
  const nightDim = 1 - night * 0.2;
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, spots.length);
  const tColor = new THREE.Color();
  spots.forEach((sp, i) => {
    q.setFromAxisAngle(up, rand() * Math.PI);
    m4.compose(new THREE.Vector3(sp.x, 0, sp.z), q, new THREE.Vector3(sp.s, sp.s * (sp.mango ? 0.9 : 1.15), sp.s));
    trees.setMatrixAt(i, m4);
    tColor.copy(sp.mango ? mangoC : foliage[i % foliage.length]).lerp(mangoC, sp.mango ? 0.2 : 0.55).multiplyScalar(nightDim * (0.85 + rand() * 0.3));
    trees.setColorAt(i, tColor);
  });
  scene.add(trees);

  // ---- airfield lighting (one draw call of glow points) ----------------------
  const lp = [];
  const lc = [];
  const ls = [];
  const addLight = (x, y, z, hex, size) => {
    const c = hexC(hex);
    lp.push(x, y, z);
    lc.push(c.r, c.g, c.b);
    ls.push(size);
  };
  for (let x = -HALF_LEN; x <= HALF_LEN + 0.1; x += 60) {
    addLight(x, 0.6, HALF_W + 1.5, '#fff1c8', 3.2);
    addLight(x, 0.6, -HALF_W - 1.5, '#fff1c8', 3.2);
  }
  for (const s of [1, -1]) {
    for (let k = -6; k <= 6; k += 2) {
      addLight(s * (HALF_LEN + 1.2), 0.5, k * 1.9, '#4dff8a', 3.4); // threshold, green
      addLight(s * (HALF_LEN + 0.2), 0.5, k * 1.9 + 1, '#ff3b30', 3.0); // runway end, red
    }
  }
  for (let z = -18; z >= -50; z -= 8) {
    addLight(566.5, 0.5, z, '#4d7bff', 2.4); // taxiway edges, blue
    addLight(583.5, 0.5, z, '#4d7bff', 2.4);
  }
  addLight(470, 14, -81, '#ffd9a0', 9); // apron floods
  addLight(650, 14, -81, '#ffd9a0', 9);
  addLight(505, 23.5, -104, '#ff3b30', 3); // tower obstruction light
  const lightGeo = keep(new THREE.BufferGeometry());
  lightGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  lightGeo.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
  lightGeo.setAttribute('size', new THREE.Float32BufferAttribute(ls, 1));
  const lightMat = keep(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uScale: { value: 400 }, uGain: { value: 0.12 + 0.95 * night }, uFogFar: { value: fogFar } },
      vertexShader: /* glsl */ `
        attribute vec3 color;
        attribute float size;
        uniform float uScale, uFogFar;
        varying vec3 vColor;
        varying float vFade;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(size * uScale / -mv.z, 1.5, 64.0);
          vFade = 1.0 - 0.85 * smoothstep(uFogFar * 0.15, uFogFar * 0.6, -mv.z);
          vColor = color;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uGain;
        varying vec3 vColor;
        varying float vFade;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = pow(max(0.0, 1.0 - d), 2.2) + 0.6 * smoothstep(0.3, 0.0, d);
          gl_FragColor = vec4(vColor, a * uGain * vFade);
        }`,
    }),
  );
  const lightPoints = new THREE.Points(lightGeo, lightMat);
  lightPoints.frustumCulled = false;
  scene.add(lightPoints);

  // ---- rain (only when it is raining in Nepal right now) --------------------
  let rain = null;
  if (wet) {
    const count = mobile ? 700 : 1400;
    const pos = new Float32Array(count * 6);
    const seeds = new Float32Array(count * 3);
    const rr = rng(7);
    for (let i = 0; i < count; i++) {
      seeds[i * 3] = (rr() - 0.5) * 120;
      seeds[i * 3 + 1] = rr() * 60;
      seeds[i * 3 + 2] = (rr() - 0.5) * 120;
    }
    const rg = keep(new THREE.BufferGeometry());
    rg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const rm = keep(new THREE.LineBasicMaterial({ color: hexC('#c9d4e2'), transparent: true, opacity: kind === 'drizzle' ? 0.25 : 0.4, fog: false }));
    rain = { mesh: new THREE.LineSegments(rg, rm), pos, seeds, count };
    rain.mesh.frustumCulled = false;
    scene.add(rain.mesh);
  }

  // ---- the aircraft ----------------------------------------------------------
  const plane = createAirliner({ accent });
  plane.group.scale.setScalar(PLANE_SCALE);
  plane.group.rotation.order = 'YZX';
  plane.setGear(1);
  scene.add(plane.group);
  const sprites = [];
  plane.group.traverse((o) => {
    if (o.isSprite) sprites.push(o);
  });
  const shadowMat = keep(new THREE.MeshBasicMaterial({ map: keep(blobTexture()), transparent: true, depthWrite: false, opacity: 0.85 * (0.35 + 0.65 * day), polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  const shadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(34, 30).rotateX(-Math.PI / 2)), shadowMat);
  scene.add(shadow);

  const path = buildPath();

  // ---- camera ---------------------------------------------------------------
  let aspect = 1;
  let height = 800;
  const camPos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const target = new THREE.Vector3();
  const setFov = (hfov, cap = 82) => {
    const h = (hfov * Math.PI) / 180;
    let v = (2 * Math.atan(Math.tan(h / 2) / aspect) * 180) / Math.PI;
    v = Math.min(cap, Math.max(14, v));
    if (Math.abs(camera.fov - v) > 0.01) {
      camera.fov = v;
      camera.updateProjectionMatrix();
    }
  };

  const T = TIMELINE;
  let lightning = 0;
  const pr = rng(99);

  function frame(t, dt = 1 / 60) {
    const p = path.sample(t);
    const g = plane.group;
    g.position.set(p.x, GEAR_H + p.alt, p.z);
    g.rotation.set(p.bank, p.yaw, p.pitch);
    plane.setGear(p.gear);
    const landing = t > 2.4 ? clamp01((t - 2.4) * 2) * (1 - smooth((t - 9) / 2)) : 0;
    plane.update(t, { night, landing });
    // sprites at zero opacity still cost a draw call each; skip them
    for (const s of sprites) s.visible = s.material.opacity > 0.01;
    shadow.position.set(p.x + 0.6, Y.shadow, p.z);
    shadow.rotation.y = p.yaw;
    shadow.visible = p.alt < 60;
    shadowMat.opacity = 0.85 * (0.35 + 0.65 * day) * (1 - clamp01(p.alt / 60));
    shadow.scale.setScalar(1 + p.alt / 50);

    // windsock flutter
    sock.rotation.x = Math.sin(t * 7.3) * 0.05 * sockLift;

    if (t < T.cut) {
      // Establishing: a slow crane down from above the 27 threshold,
      // looking west along the runway while the aircraft lines up.
      const u = smooth(t / T.cut);
      camPos.set(lerp(800, 640, u), lerp(78, 15, u), lerp(70, 40, u));
      target.set(lerp(470, p.x - 30, u), lerp(0, GEAR_H, u), lerp(-20, p.z, u));
      look.copy(target);
      setFov(mobile && aspect < 1 ? 64 : 54);
    } else {
      // Spotter's view from beside the runway: the aircraft rolls toward us,
      // rotates, lifts off overhead-ish, tucks its gear and climbs away while
      // the camera tilts up into the sky.
      const roll = clamp01((t - T.roll) / 2.6);
      const shake = roll * (1 - clamp01((t - 6.5) / 1)) * 0.06;
      camPos.set(300 + Math.sin(t * 41) * shake, 1.8 + Math.sin(t * 37) * shake, 52);
      const dist = Math.hypot(p.x - camPos.x, p.z - camPos.z);
      // aim a little above the aircraft so the horizon sits low in frame
      target.set(p.x - 6, GEAR_H + p.alt + 1 + dist * 0.07, p.z);
      const tilt = smooth((t - T.tilt) / 1.3);
      look.copy(target).lerp(new THREE.Vector3(camPos.x - 140, 300, camPos.z - 260), tilt * 0.55);
      const zoom = smooth((t - 3.3) / 2.7);
      const portrait = aspect < 0.85;
      setFov(lerp(portrait ? 14 : 24, portrait ? 54 : 62, zoom), portrait ? 88 : 80);
    }
    if(t >= 5.65) {
      const cut = smooth((t-5.65)/0.65);
      camPos.lerp(new THREE.Vector3(180,2.4,4.5),cut);
      target.set(p.x,GEAR_H+p.alt+0.6,p.z);
      look.lerp(target,cut);
      // Stop tracking after the overhead pass: the aircraft leaves the frame
      // before the cleared sky dissolves into the hero's returning aircraft.
      look.lerp(new THREE.Vector3(130,250,-160),smooth((t-7.0)/1.25));
      setFov(lerp(42,67,smooth((t-7.2)/1.6)));
    }
    // Wake clears the haze as the aircraft passes overhead.
    scene.fog.near = lerp(kind === 'fog' ? 45 : 260,1200,smooth((t-6.9)/2.1));
    scene.fog.far = lerp(Math.max(1500,fogFar),6200,smooth((t-6.9)/2.1));
    camera.position.copy(camPos);
    camera.lookAt(look);

    if (rain) {
      const { pos, seeds, count } = rain;
      const fall = 26;
      for (let i = 0; i < count; i++) {
        const y = 60 - ((seeds[i * 3 + 1] + t * fall) % 60);
        const x = camPos.x + seeds[i * 3];
        const z = camPos.z + seeds[i * 3 + 2];
        const o = i * 6;
        pos[o] = x;
        pos[o + 1] = camPos.y - 10 + y;
        pos[o + 2] = z;
        pos[o + 3] = x + 0.15;
        pos[o + 4] = camPos.y - 10 + y - 1.2;
        pos[o + 5] = z;
      }
      rain.mesh.geometry.attributes.position.needsUpdate = true;
      if (kind === 'storm') {
        if (lightning <= 0 && pr() < dt * 0.25) lightning = 0.25;
        lightning = Math.max(0, lightning - dt);
        hemi.intensity = lerp(0.55, 1.5, day) + (lightning > 0 ? 3 * (lightning / 0.25) : 0);
      }
    }

    lightMat.uniforms.uScale.value = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
    renderer.render(scene, camera);
  }

  function resize(w, h) {
    aspect = w / Math.max(1, h);
    height = h * renderer.getPixelRatio();
    renderer.setSize(w, h, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }

  return {
    frame,
    resize,
    renderer,
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
    dispose() {
      canvas.removeEventListener('webglcontextlost', lost);
      plane.dispose();
      scene.traverse((o) => {
        if (o.isInstancedMesh) o.dispose();
      });
      disposables.forEach((d) => d.dispose?.());
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
  };
}
