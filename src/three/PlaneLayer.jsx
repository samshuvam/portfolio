import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAirliner } from './airliner';
import { planeBus } from './planeBus';
import { gsap, reducedMotion, scrollState } from '../lib/motion';
import { getWorld } from '../lib/world';
import { getState } from '../lib/store';
import { findEgg, toast } from '../lib/eggs';
import { sound } from '../lib/sound';
import { cruiseTraffic } from './trafficSchedule';
import { getLang, translate } from '../i18n';


// The global plane: a fixed full-screen WebGL canvas behind page content
// (z 5). It follows a closed route in real depth and briefly approaches the
// foreground on timed passes, sweeps across fog when a FogReveal asks it to
// (planeBus.sweep, raised above content), fades out whenever a scene borrows
// it (planeBus.hidden) and publishes where it is on screen (planeBus.screen).

// Poses: x, y in normalised screen space (-1..1, y up); s = plane length as a
// share of the viewport width; yaw = heading in degrees (0 flies right, 180
// flies left; a little past 0 or 180 turns the nose towards the viewer);
// gear 0..1; pitch = extra nose-up in radians; glide = the leg INTO this pose
// is a calm straight line instead of a swoop.
const POSES = {
  top: { x: 0.2, y: -0.04, s: 0.5, yaw: -24 },
  about: { x: -.68, y: -.48, s: .16, yaw: 195 },
  work: { x: .68, y: .35, s: .2, yaw: -18 },
  lab: { x: -.64, y: -.4, s: .18, yaw: 195 },
  arcade: { x: .68, y: .4, s: .17, yaw: -22 },
  papers: { x: 0.76, y: 0.64, s: 0.14, yaw: -22 },
  logbook: { x: -.68, y: -.2, s: .22, yaw: 195 },
  journey: { x: 0.76, y: 0.64, s: 0.14, yaw: -22 },
  home: { x: -.66, y: -.45, s: .18, yaw: 195 },
  kanya: { x: 0.76, y: 0.64, s: 0.14, yaw: -22 },
  life: { x: -.65, y: .32, s: .18, yaw: 195 },
  frames: { x: .64, y: -.45, s: .17, yaw: -22 },
  wow: { x: -.62, y: .44, s: .2, yaw: 195 },
  now: { x: .66, y: -.4, s: .18, yaw: -22 },
  // Final approach: gear down, descending towards the last runway.
  contact: { x: -0.62, y: 0.42, s: 0.22, yaw: -16, gear: 1, pitch: 0.04 },
  landing: { x: 0.42, y: -0.62, s: 0.3, yaw: -10, gear: 1, pitch: 0.1, glide: true },
};
// Phones (portrait): small, in the top or bottom margin, never off screen.
const MOBILE = {
  top: { x: 0.08, y: 0.06, s: 0.86, yaw: -24 },
  journey: { x: 0.42, y: 0.72, s: 0.3 },
  kanya: { x: 0.42, y: 0.72, s: 0.3 },
  contact: { x: -0.3, y: 0.72, s: 0.38 },
  landing: { x: 0.18, y: -0.66, s: 0.5 },
};

// The turbulence toast (English, Nepali, Maithili).
const TOAST = {
  en: { title: 'Fasten your seatbelt', body: 'We are passing through some turbulence. Scrolling that fast will do it.' },
  ne: { title: 'सिटबेल्ट बाँध्नुहोस्', body: 'हामी अलिकति टर्बुलेन्समा छौं। यति छिटो स्क्रोल गरेपछि यस्तै हुन्छ।' },
  mai: { title: 'सीटबेल्ट बान्हि लिअ', body: 'हमसभ कनेक टर्बुलेन्स मे छी। एतेक तेजी सँ स्क्रोल करबै त एहिना होइत अछि।' },
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const wrapAngle = (a) => ((((a + 180) % 360) + 360) % 360) - 180;

// Clicks on these never reach the plane.
const INTERACTIVE = 'a,button,input,textarea,select,label,summary,option,[role="button"],[role="link"],[role="tab"],[role="slider"],[role="switch"],[role="checkbox"],[role="menuitem"],[role="dialog"],dialog,[contenteditable=""],[contenteditable="true"],[data-no-plane]';
const PLANE_Z = 5;
const ABOVE_Z = 35;

// Root-level paint order of an element: the z-index of its outermost
// ancestor that forms a stacking context (0 when none does).
function rootZ(el) {
  let z = 0;
  for (let n = el; n && n !== document.documentElement && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    const positioned = cs.position !== 'static';
    const zi = cs.zIndex;
    const parentDisplay = n.parentElement ? getComputedStyle(n.parentElement).display : '';
    const flexChild = /flex|grid/.test(parentDisplay);
    const ctx =
      ((positioned || flexChild) && zi !== 'auto') ||
      cs.position === 'fixed' ||
      cs.position === 'sticky' ||
      cs.opacity !== '1' ||
      cs.transform !== 'none' ||
      cs.filter !== 'none' ||
      cs.isolation === 'isolate' ||
      cs.mixBlendMode !== 'normal';
    if (ctx) z = zi === 'auto' ? 0 : parseInt(zi, 10) || 0;
  }
  return z;
}
const alphaOf = (color) => {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return color === 'transparent' ? 0 : 1;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length > 3 ? parseFloat(parts[3]) : 1;
};
// Is something opaque painted in front of the plane at this point?
function occluded(x, y, planeZ) {
  const stack = document.elementsFromPoint?.(x, y) || [];
  for (const el of stack) {
    if (el === document.documentElement || el === document.body || el.classList.contains('plane-layer')) continue;
    if (rootZ(el) < planeZ) return false; // everything from here down is behind the plane
    if (/^(IMG|VIDEO|IFRAME|CANVAS|PICTURE)$/.test(el.tagName)) return true;
    const cs = getComputedStyle(el);
    if (alphaOf(cs.backgroundColor) > 0.55 || cs.backgroundImage !== 'none') return true;
  }
  return false;
}

export default function PlaneLayer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const reduce = reducedMotion();
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      canvas.style.display = 'none';
      planeBus.screen.visible = false;
      return undefined;
    }
    planeBus.ready = true;
    const isMobile = () => window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    // Opacity is driven per frame; a CSS transition would only add lag.
    if (!reduce) canvas.style.transition = 'none';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 14);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const hemi = new THREE.HemisphereLight(0xdbe8ff, 0x879487, 0.8);
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(-4, 6, 8);
    scene.add(hemi, sun);

    const accentNow = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f08a24';
    const plane = createAirliner({ accent: accentNow(), variant: 'shuvam' });

    // Local bounding box of the aircraft, for hit-testing and planeBus.screen.
    const box = new THREE.Box3();
    plane.group.updateMatrixWorld(true);
    box.setFromObject(plane.group);
    if (box.isEmpty()) box.set(new THREE.Vector3(-2, -0.5, -1.9), new THREE.Vector3(2, 0.75, 1.9));
    else box.applyMatrix4(plane.group.matrixWorld.clone().invert());
    const boxCenter = box.getCenter(new THREE.Vector3());
    const corners = [];
    for (let k = 0; k < 8; k++) corners.push(new THREE.Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z));
    const nosePt = new THREE.Vector3(box.max.x, boxCenter.y, boxCenter.z);
    const tailPt = new THREE.Vector3(box.min.x, boxCenter.y, boxCenter.z);

    // View the aircraft from slightly above so the wings read clearly.
    const pivot = new THREE.Group();
    pivot.rotation.x = 0.3;
    pivot.add(plane.group);
    scene.add(pivot);
    const passing=createAirliner({variant:'kalyani'});scene.add(passing.group);
    const trafficLabel=document.createElement('div');trafficLabel.className='sky-traffic-label';trafficLabel.setAttribute('aria-hidden','true');document.body.appendChild(trafficLabel);
    document.fonts?.load('400 96px "Noto Sans Tirhuta"', '\u{114AC}\u{114B3}').then(() => plane.setAccent(accentNow())).catch(() => {});

    // ---- contrails: two fading ribbons -------------------------------------
    const TRAIL = 46;
    const trails = plane.exhausts.map(() => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(TRAIL * 2 * 3);
      const alphas = new Float32Array(TRAIL * 2);
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
      const index = [];
      for (let i = 0; i < TRAIL - 1; i++) {
        const a = i * 2;
        index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      geo.setIndex(index);
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color(0xffffff) }, uStrength: { value: 0 } },
        vertexShader: 'attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 uColor; uniform float uStrength; varying float vA; void main(){ gl_FragColor = vec4(uColor, vA * uStrength); }',
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      return { geo, mat, points: [], positions, alphas };
    });
    const resetTrails = () =>
      trails.forEach((t) => {
        t.points.length = 0;
        t.mat.uniforms.uStrength.value = 0;
      });

    const view = { w: 1, h: 1 };
    const resize = () => {
      view.w = window.innerWidth;
      view.h = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 1.75));
      renderer.setSize(view.w, view.h, false);
      camera.aspect = view.w / view.h;
      camera.updateProjectionMatrix();

    };
    resize();
    window.addEventListener('resize', resize);


    const halfH = () => camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfW = () => halfH() * camera.aspect;

    const poseFor = (id) => {
      const base = POSES[id] || POSES.top;
      if (!isMobile()) return base;
      const m = MOBILE[id];
      if (m) return { ...base, ...m };
      return {
        ...base,
        x: Math.abs(base.x) < 0.2 ? base.x * 0.5 : Math.sign(base.x) * 0.42,
        y: Math.sign(base.y || 1) * 0.72,
        s: clamp(base.s * 2.1, 0.3, 0.42),
      };
    };

    // ---- state -----------------------------------------------------------------
    const st = {
      x: -1.6,
      y: 0.35,
      s: 0.3,
      depth:0,
      yaw: -24,
      pitch: 0,
      roll: 0,
      gear: 0,
      vx: 0,
      vy: 0,
      vs: 0,
      headRight: true,
      intro: reduce ? 1 : 0,
      spin: 0,
      clicks: 0,
      pointerX: 0,
      pointerY: 0,
      shake: 0,
      fastFor: 0,
      lastTime: performance.now() / 1000,
      visible: document.visibilityState !== 'hidden',
      fade: planeBus.hidden.size ? 0 : 1,
      dip: 0,
      dipping: false,
      above: false,
      layerWait: 0,
      opacity: -1,
      sweeping: false,
    };

    // Intro: arrive from the right, banking into the hero, once the page is
    // revealed (store.loaded).
    let introTween = null;
    let introWait = null;
    if (!reduce) {
      const startIntro = () => {
        introTween = gsap.to(st, { intro: 1, duration: 2.8, delay:.35, ease: 'power3.out' });
        if (!planeBus.hidden.size) sound.whoosh(0.8);
      };
      if (getState().loaded&&planeBus.introDone) startIntro();
      else {
        introWait = setInterval(() => {
          if (getState().loaded&&planeBus.introDone) {
            clearInterval(introWait);
            introWait = null;
            startIntro();
          }
        }, 120);
      }
    }

    // ---- where the plane is on screen ---------------------------------------
    const S = planeBus.screen;
    S.rect = S.rect || { left: -9999, top: -9999, right: -9999, bottom: -9999 };
    const tmpV = new THREE.Vector3();
    const proj = { x: 0, y: 0 };
    const toScreen = (v) => {
      tmpV.copy(v).applyMatrix4(plane.group.matrixWorld).project(camera);
      proj.x = (tmpV.x * 0.5 + 0.5) * view.w;
      proj.y = (-tmpV.y * 0.5 + 0.5) * view.h;
      return proj;
    };
    let lastSX = null;
    let lastSY = null;
    const publish = (dt) => {
      let l = Infinity;
      let t = Infinity;
      let r = -Infinity;
      let b = -Infinity;
      for (const c of corners) {
        const p = toScreen(c);
        l = Math.min(l, p.x);
        r = Math.max(r, p.x);
        t = Math.min(t, p.y);
        b = Math.max(b, p.y);
      }
      S.rect.left = l;
      S.rect.top = t;
      S.rect.right = r;
      S.rect.bottom = b;
      const c = toScreen(boxCenter);
      const cx = c.x;
      const cy = c.y;
      const n = toScreen(nosePt);
      const nx = n.x;
      const ny = n.y;
      const tl = toScreen(tailPt);
      S.heading = (Math.atan2(ny - tl.y, nx - tl.x) * 180) / Math.PI;
      // A jump (between sweep passes, after a resize) is not a velocity.
      const jumped = lastSX !== null && Math.hypot(cx - lastSX, cy - lastSY) > Math.max(view.w, view.h) * 0.35;
      if (jumped || dt <= 0.001) {
        S.vx = S.vx || 0;
        S.vy = S.vy || 0;
      } else if (lastSX !== null) {
        S.vx = lerp(S.vx || 0, (cx - lastSX) / dt, 0.25);
        S.vy = lerp(S.vy || 0, (cy - lastSY) / dt, 0.25);
      }
      lastSX = cx;
      lastSY = cy;
      S.x = cx;
      S.y = cy;
      S.size = Math.max(r - l, b - t);
      const onScreen = r > 0 && l < view.w && b > 0 && t < view.h;
      S.opacity = Math.max(0, st.opacity);
      S.visible = onScreen && S.opacity > 0.05 && document.visibilityState !== 'hidden';
      S.above = st.above;
      return onScreen;
    };

    // ---- interaction -----------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.01;
    raycaster.params.Line.threshold = 0.01;
    const ndc = new THREE.Vector2();
    const OFFSETS = [
      [0, 0],
      [9, 0],
      [-9, 0],
      [0, 9],
      [0, -9],
    ];
    // Exact test against the visible aircraft: projected box first, then
    // rays through the pointer (with a little slack for thin wings).
    const overPlane = (x, y) => {
      if (!S.visible || S.opacity < 0.5) return false;
      const pad = 12;
      if (x < S.rect.left - pad || x > S.rect.right + pad || y < S.rect.top - pad || y > S.rect.bottom + pad) return false;
      for (const [ox, oy] of OFFSETS) {
        ndc.set(((x + ox) / view.w) * 2 - 1, -((y + oy) / view.h) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObject(plane.group, true);
        if (hits.some((h) => h.object.isMesh && h.object.visible)) return true;
      }
      return false;
    };
    const dialogOpen = () => {
      const s = getState();
      return s.palette || s.passport || s.menu || s.project != null || s.lightbox != null;
    };
    const canGrab = (target, x, y) => {
      if (target?.closest?.(INTERACTIVE) || dialogOpen()) return false;
      if (!overPlane(x, y)) return false;
      return !occluded(x, y, st.above ? ABOVE_Z : PLANE_Z);
    };

    const pointer = { x: -1, y: -1, target: null, dirty: false, lastCheck: 0 };
    let hovering = false;
    const setHover = (h) => {
      if (h === hovering) return;
      hovering = h;
      document.documentElement.style.cursor = h ? 'pointer' : '';
    };
    const onMove = (e) => {
      st.pointerX = (e.clientX / view.w) * 2 - 1;
      st.pointerY = -((e.clientY / view.h) * 2 - 1);
      if (e.pointerType === 'touch') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.target = e.target;
      pointer.dirty = true;
    };
    // Hover is resolved at most ~12 times a second, inside the frame loop.
    const updateHover = (now) => {
      if (!pointer.dirty || now - pointer.lastCheck < 0.08) return;
      pointer.dirty = false;
      pointer.lastCheck = now;
      setHover(canGrab(pointer.target, pointer.x, pointer.y));
    };
    const onLeave = () => {
      pointer.dirty = false;
      setHover(false);
    };
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      const sel = window.getSelection?.();
      if (sel && !sel.isCollapsed && String(sel).trim()) return;
      if (!canGrab(e.target, e.clientX, e.clientY)) return;
      st.clicks += 1;
      if (!reduce) {
        gsap.to(st, { spin: st.spin + Math.PI * 2, duration: 1.15, ease: 'power2.inOut', overwrite: 'auto' });
        sound.whoosh(1);
      } else sound.click();
      if (st.clicks === 3) findEgg('roll');
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('click', onClick);

    // ---- targets ---------------------------------------------------------------
    const target = { x: 0, y: 0, s: 0.3, yaw: -24, gear: 0, pitch: 0, parked: 1, inHero: false };
    const springTo = (key, goal, k, dt) => {
      st[key] += (goal - st[key]) * (1 - Math.exp(-k * dt));
    };

    // A closed, spatial cruise route. Scroll moves us along it; time keeps
    // the aircraft flying when the reader pauses. Depth changes are real Z.
    const cruise=new THREE.CatmullRomCurve3([
      new THREE.Vector3(-.76,.36,-7),new THREE.Vector3(-.22,.66,-15),
      new THREE.Vector3(.76,.35,-10),new THREE.Vector3(.61,-.5,-6),
      new THREE.Vector3(-.18,-.59,-14),new THREE.Vector3(-.77,-.25,-9)
    ],true,'catmullrom',.45);
    const cruisePoint=new THREE.Vector3();
    const flightLineGeo=new THREE.BufferGeometry(),flightLineMat=new THREE.LineBasicMaterial({color:'#4e8871',transparent:true,opacity:.12,depthWrite:false});
    const flightLine=new THREE.Line(flightLineGeo,flightLineMat);flightLine.visible=!reduce;scene.add(flightLine);
    const measureFlightLine=()=>{
      flightLineGeo.setFromPoints(cruise.getPoints(180).map(p=>{
        const h=(camera.position.z-p.z)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
        return new THREE.Vector3(p.x*h*camera.aspect,p.y*h,p.z);
      }));
    };measureFlightLine();window.addEventListener('resize',measureFlightLine);
    let flightSeconds=0,heroSeconds=0;
    const routeTarget = () => {
      const phase=(flightSeconds*.009+.06)%1;
      cruise.getPointAt(phase,cruisePoint);
      const heroBlend=smooth(clamp(Math.max(window.scrollY/(view.h*.75),(heroSeconds-7)/9),0,1));
      const hero=poseFor('top'),z=cruisePoint.z*heroBlend;
      Object.assign(target,{
        x:lerp(hero.x,cruisePoint.x,heroBlend),y:lerp(hero.y,cruisePoint.y,heroBlend),
        depth:z,s:lerp(hero.s,(isMobile()?.47:.23)*14/(14-z),heroBlend),
        yaw:-24,gear:0,pitch:0,parked:0,inHero:heroBlend<.2
      });
      flightLine.visible=heroBlend>.4&&!planeBus.landingPose&&!planeBus.sweep;
      flightLineMat.color.set(getState().themePref==='night'?'#8bbaa1':'#4e8871');
    };

    const sweepTarget = (sw) => {
      const mobile = isMobile();
      const s = Math.min(mobile ? 0.42 : 0.19, (0.45 * view.h) / view.w);
      const margin = Math.max(.3,1-s*.95);
      const dir = sw.dir < 0 ? -1 : 1;
      target.x = dir * lerp(-margin, margin, clamp(sw.progress || 0, 0, 1));
      target.y = 1 - 2 * clamp(sw.y ?? 0.5, 0.05, 0.95);
      target.s = s;
      target.gear = 0;
      target.pitch = 0;
      target.yaw = dir > 0 ? -12 : 192;
      target.parked = 0;
      target.inHero = false;
      target.depth=0;
      return dir;
    };

    // ---- the loop --------------------------------------------------------------
    const setLayer = (above) => {
      st.above = above;
      canvas.style.zIndex = planeBus.introSweep ? '105' : above ? String(ABOVE_Z) : '';
      S.above = above;
    };
    let onScreen = true;

    const tick = () => {
      if (!st.visible) return;
      const now = performance.now() / 1000;
      const dt = clamp(now - st.lastTime, 0.0001, 0.05);
      st.lastTime = now;
      const aspect = view.w / view.h;

      // Where should we be?
      if(st.intro>=1){flightSeconds+=dt;heroSeconds+=dt;}
      const introPass=planeBus.introSweep;
      const sw = planeBus.sweep;
      const sweeping = !!sw && st.intro >= 1;
      let dir = 1;
      if (sweeping) dir = sweepTarget(sw);
      else routeTarget();
      const landing=planeBus.landingPose;
      if(landing){const blend=landing.blend??1;Object.assign(target,{x:lerp(target.x,landing.x,blend),y:lerp(target.y,landing.y,blend),s:lerp(target.s,landing.s,blend),depth:lerp(target.depth||0,0,blend),gear:landing.gear,parked:0,inHero:false});}
      const archive=document.querySelector('.archive');
      if(!landing&&!sweeping&&archive){const r=archive.getBoundingClientRect();if(r.top<view.h*.7&&r.bottom>view.h*.2){const p=(flightSeconds%28)/28;if(p<.65)Object.assign(target,{x:lerp(-1.25,1.25,p/.65),y:.26+Math.sin(p/.65*Math.PI*2)*.28,s:Math.min(.24,.48/aspect),depth:0,parked:0,inHero:false});}}
      if (sweeping !== st.sweeping) {
        st.sweeping = sweeping;
        if (!sweeping) st.headRight = st.vx >= 0;
      }

      // Calm idle drift when parked; follow the pointer a little in the hero.
      const heroIdle = target.inHero ? 1 : 0;
      target.x += st.pointerX * 0.012 * heroIdle;
      target.y += st.pointerY * 0.01 * heroIdle;
      if (sweeping) target.y += Math.sin(now * 1.7) * 0.012;
      else if(!landing&&st.intro>=1&&!target.inHero){target.x+=Math.sin(now*.34)*.07;target.y+=Math.cos(now*.48)*.045;}

      // Intro fly-in from off-screen right.
      if(introPass)Object.assign(target,{x:-1.35+2.7*introPass.progress,y:1-2*introPass.y,s:isMobile()?.58:.34,depth:0,yaw:-12,gear:0,pitch:0,parked:0,inHero:false});
      const intro = introPass?1:st.intro;
      const goalX = lerp(-1.7, target.x, intro);
      const goalY = lerp(0.42, target.y, intro);

      let prevX = st.x;
      let prevY = st.y;
      let prevS = st.s;
      // Between sweep passes the plane is off screen: jump straight to the
      // next pass instead of flying a visible diagonal back.
      const targetOff = Math.abs(goalX) > 1 + target.s * 0.9;
      if (sweeping && !onScreen && targetOff) {
        st.x = goalX;
        st.y = goalY;
        st.s = target.s;
        st.yaw = target.yaw;
        prevX = st.x;
        prevY = st.y;
        prevS = st.s;
        resetTrails();
      } else if (sweeping) {
        springTo('x', goalX, 7, dt);
        springTo('y', goalY, 5, dt);
        springTo('s', target.s, 4, dt);
      } else {
        springTo('x', goalX, intro < 1 ? 60 : landing ? 18 : 3.2, dt);
        springTo('y', goalY, intro < 1 ? 60 : landing ? 18 : 3.2, dt);
        springTo('s', lerp(0.22, target.s, intro), landing ? 18 : 3, dt);
      }
      if(introPass){st.x=goalX;st.y=goalY;st.s=target.s;st.depth=0;}
      springTo('depth',target.depth||0,landing?12:2.5,dt);
      springTo('gear', target.gear, 2.5, dt);
      st.vx = lerp(st.vx, (st.x - prevX) / dt, 0.12);
      st.vy = lerp(st.vy, (st.y - prevY) / dt, 0.12);
      st.vs = lerp(st.vs, (st.s - prevS) / dt, 0.1);

      // Heading follows the motion when moving, otherwise the pose; growing
      // (coming closer) turns the nose towards the viewer.
      const speed = Math.hypot(st.vx * aspect, st.vy);
      let goalYaw = target.yaw;
      if (intro < 1) goalYaw = -24 - Math.sin(intro*Math.PI)*12;
      else if (sweeping) {
        const right = Math.abs(st.vx) > 0.25 ? st.vx > 0 : dir > 0;
        goalYaw = right ? -12 : 192;
      } else if (speed > 0.12) {
        if (st.vx > 0.06) st.headRight = true;
        else if (st.vx < -0.06) st.headRight = false;
        const toward = clamp(14 + st.vs * 260, 2, 60);
        goalYaw = st.headRight ? -toward : 180 + toward;
      } else goalYaw += Math.sin(now * 0.3) * 3 * target.parked;
      const dyaw = wrapAngle(goalYaw - st.yaw);
      st.yaw += dyaw * (1 - Math.exp(-(sweeping ? 4.5 : 2.6) * dt));

      // Body-frame pitch: positive is nose-up whichever way we face.
      const goalPitch = clamp(st.vy * 0.55, -0.45, 0.45) + target.pitch + st.pointerY * 0.06 * heroIdle;
      const scrollBank = clamp((scrollState.velocity || 0) / 6000, -0.35, 0.35);
      const rock = Math.sin(now * 0.9) * 0.05 * target.parked + (sweeping ? 0.1 + Math.sin(now * 1.1) * 0.05 : 0);
      const goalRoll = clamp(-dyaw * 0.012 - st.vy * 0.15 + scrollBank, -0.9, 0.9) + st.pointerX * -0.08 * heroIdle + rock;
      springTo('pitch', goalPitch, 3, dt);
      springTo('roll', goalRoll, 3, dt);

      // Turbulence egg: sustained, very fast scrolling.
      const v = Math.abs(scrollState.velocity || 0);
      st.fastFor = v > 7000 ? st.fastFor + dt : Math.max(0, st.fastFor - dt * 2);
      if (st.fastFor > 0.35) {
        st.shake = 1;
        if (findEgg('turbulence')) {
          const lang = getLang();
          toast(translate(TOAST, lang, 'title'), translate(TOAST, lang, 'body'), 'egg');
        }
      }
      st.shake = Math.max(0, st.shake - dt * 0.8);

      // Apply to the model.
      const hh=(camera.position.z-st.depth)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      const hw=hh*camera.aspect;
      const shakeX = st.shake ? (Math.random() - 0.5) * 0.06 * st.shake : 0;
      const shakeY = st.shake ? (Math.random() - 0.5) * 0.06 * st.shake : 0;
      pivot.position.set(st.x * hw + shakeX, st.y * hh + shakeY, st.depth);
      const scale = (st.s * hw * 2) / 4;
      pivot.scale.setScalar(scale);
      plane.group.rotation.order = 'YZX';
      plane.group.rotation.set(st.roll + st.spin, THREE.MathUtils.degToRad(st.yaw), st.pitch);
      if(landing)plane.group.quaternion.slerp(new THREE.Quaternion().fromArray(landing.quaternion),landing.blend??1);
      plane.setGear(st.gear);
      pivot.updateMatrixWorld(true);

      // Visibility: fade out while any scene borrows the plane, and dip
      // briefly if the layer has to change while the plane is in view.
      st.fade += ((planeBus.hidden.size ? 0 : 1) - st.fade) * (1 - Math.exp(-6 * dt));
      if (st.fade < 0.002) st.fade = 0;
      const archivePass=!landing&&!sweeping&&archive&&archive.getBoundingClientRect().top<view.h*.7&&archive.getBoundingClientRect().bottom>view.h*.2&&(flightSeconds%28)/28<.65;
      const wantAbove=!!introPass||!!planeBus.aboveContent||archivePass||!!(landing?.touchdown);
      if (wantAbove === st.above) {
        st.layerWait = 0;
        st.dipping = false;
      } else {
        setLayer(wantAbove);
        st.dipping = false;
      }
      st.dip = 0;
      const opacity = Math.round(st.fade * (1 - st.dip) * 1000) / 1000;
      if (opacity !== st.opacity) {
        st.opacity = opacity;
        canvas.style.opacity = String(opacity);
      }
      onScreen = publish(dt);
      updateHover(now);
      if (opacity <= 0) {
        trafficLabel.hidden=true;
        resetTrails();
        if (hovering) setHover(false);
        return;
      }

      // Light it for the real time of day in Lalitpur.
      const world = getWorld();
      const pref = getState().themePref;
      const elev = world.sun.elevation;
      let night = clamp((2 - elev) / 10, 0, 1);
      if (pref === 'night') night = Math.max(night, 0.85);
      if (pref === 'day') night = Math.min(night, 0.1);
      const golden = clamp(1 - Math.abs(elev - 2) / 10, 0, 1) * (1 - night);
      hemi.intensity = lerp(1.35, 0.35, night);
      hemi.color.setRGB(lerp(0.86, 0.42, night), lerp(0.91, 0.48, night), lerp(1.0, 0.75, night));
      sun.intensity = lerp(2.3, 0.55, night);
      sun.color.setRGB(1, lerp(0.97, 0.78, golden) * lerp(1, 0.85, night), lerp(0.93, 0.6, golden) * lerp(1, 1.1, night));
      scene.environmentIntensity = lerp(0.9, 0.25, night);
      plane.update(now, { night, landing: st.gear });

      // Contrails while cruising fast.
      const strength = clamp((speed - 0.25) * 0.8, 0, sweeping ? 0.4 : 0.55) * (1 - st.gear) * (target.inHero ? 0 : 1);
      trails.forEach((trail, k) => {
        const pt = plane.exhausts[k].clone().applyMatrix4(plane.group.matrixWorld);
        trail.points.unshift({ p: pt });
        if (trail.points.length > TRAIL) trail.points.pop();
        const width = 0.05 * scale;
        for (let j = 0; j < TRAIL; j++) {
          const cur = trail.points[Math.min(j, trail.points.length - 1)];
          const next = trail.points[Math.min(j + 1, trail.points.length - 1)];
          const dx = cur.p.x - next.p.x;
          const dy = cur.p.y - next.p.y;
          const len = Math.hypot(dx, dy) || 1;
          const w = width * (1 + j * 0.06);
          const nx = (-dy / len) * w;
          const ny = (dx / len) * w;
          const o = j * 6;
          trail.positions[o] = cur.p.x + nx;
          trail.positions[o + 1] = cur.p.y + ny;
          trail.positions[o + 2] = cur.p.z;
          trail.positions[o + 3] = cur.p.x - nx;
          trail.positions[o + 4] = cur.p.y - ny;
          trail.positions[o + 5] = cur.p.z;
          const fade = (1 - j / TRAIL) ** 1.6;
          trail.alphas[j * 2] = fade;
          trail.alphas[j * 2 + 1] = fade;
        }
        trail.geo.attributes.position.needsUpdate = true;
        trail.geo.attributes.alpha.needsUpdate = true;
        trail.mat.uniforms.uStrength.value += (strength - trail.mat.uniforms.uStrength.value) * 0.1;
        trail.mat.uniforms.uColor.value.setRGB(lerp(1, 0.75, night), lerp(1, 0.8, night), lerp(1, 0.95, night));
      });

      const traffic=cruiseTraffic(flightSeconds);
      passing.group.visible=!reduce&&traffic.visible&&!planeBus.hidden.size&&!landing&&!introPass&&!sweeping&&heroSeconds>16;
      if(passing.group.visible){const z=-14,h=(14-z)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));const x=traffic.direction*(-1.22+2.44*traffic.progress),y=.55-Math.sin(traffic.progress*Math.PI)*.24;passing.group.position.set(x*h*aspect,y*h,z);passing.group.scale.setScalar((isMobile()?.22:.1)*h*aspect*2/4);passing.group.rotation.set(.18,traffic.direction>0?-.3:Math.PI+.3,-traffic.direction*.05);passing.update(now,{night:night,landing:0});trafficLabel.textContent=traffic.flight.call+' · '+traffic.flight.from+' → '+traffic.flight.to;trafficLabel.style.left=((x*.5+.5)*view.w)+'px';trafficLabel.style.top=((-y*.5+.5)*view.h+18)+'px';}
      trafficLabel.hidden=!passing.group.visible;
      renderer.render(scene, camera);
    };

    let reducedTimer = null;
    let heroIO = null;
    let still = null;
    if (reduce) {
      // Still, but present: parked in the hero, hidden once the hero has
      // scrolled away (or while a scene borrows the plane).
      let heroVisible = true;
      const applyOpacity = () => {
        const o = heroVisible && !planeBus.hidden.size ? 1 : 0;
        if (o !== st.opacity) {
          st.opacity = o;
          canvas.style.opacity = String(o);
          S.opacity = o;
          S.visible = o > 0;
        }
      };
      still = () => {
        const p = poseFor('top');
        const sMax = (1.2 * view.h) / view.w;
        st.x = p.x;
        st.y = p.y;
        st.s = Math.min(p.s, sMax);
        st.yaw = p.yaw;
        const hw = halfW();
        const hh = halfH();
        pivot.position.set(st.x * hw, st.y * hh, 0);
        pivot.scale.setScalar((st.s * hw * 2) / 4);
        plane.group.rotation.order = 'YZX';
        plane.group.rotation.set(0, THREE.MathUtils.degToRad(st.yaw), 0);
        plane.setGear(0);
        pivot.updateMatrixWorld(true);
        const world = getWorld();
        const night = clamp((2 - world.sun.elevation) / 10, 0, 1);
        hemi.intensity = lerp(1.35, 0.35, night);
        sun.intensity = lerp(2.3, 0.55, night);
        scene.environmentIntensity = lerp(0.9, 0.25, night);
        plane.update(0, { night, landing: 0 });
        passing.group.visible=false;trafficLabel.hidden=true;
      renderer.render(scene, camera);
        st.opacity = -1;
        applyOpacity();
        publish(0);
      };
      still();
      window.addEventListener('resize', still);
      const hero = document.getElementById('top');
      if (hero) {
        heroIO = new IntersectionObserver(([entry]) => {
          heroVisible = entry.isIntersecting;
          applyOpacity();
          publish(0);
        });
        heroIO.observe(hero);
      }
      reducedTimer = setInterval(applyOpacity, 300);
    } else {
      gsap.ticker.add(tick);
    }

    const onVis = () => {
      st.visible = document.visibilityState === 'visible';
      st.lastTime = performance.now() / 1000;
      if (!st.visible) S.visible = false;
    };
    document.addEventListener('visibilitychange', onVis);

    // Keep the livery in the season's colour.
    const mo = new MutationObserver(() => {
      plane.setAccent(accentNow());
      if (still) still();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-season', 'data-theme'] });


    return () => {
      gsap.ticker.remove(tick);
      introTween?.kill();
      gsap.killTweensOf(st);
      clearInterval(introWait);

      clearInterval(reducedTimer);
      window.removeEventListener('resize', resize);
      if (still) window.removeEventListener('resize', still);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVis);
      if (hovering) document.documentElement.style.cursor = '';

      mo.disconnect();
      heroIO?.disconnect();
      window.removeEventListener('resize',measureFlightLine);flightLineGeo.dispose();flightLineMat.dispose();
      trails.forEach((t) => {
        t.geo.dispose();
        t.mat.dispose();
      });
      passing.dispose();trafficLabel.remove();
      plane.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      planeBus.ready = false;
      S.visible = false;
      S.above = false;
    };
  }, []);

  return <canvas ref={canvasRef} className="plane-layer" aria-hidden="true" />;
}
