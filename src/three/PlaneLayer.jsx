import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAirliner } from './airliner';
import { gsap, reducedMotion, scrollState } from '../lib/motion';
import { getWorld } from '../lib/world';
import { getState } from '../lib/store';
import { findEgg, toast } from '../lib/eggs';
import { sound } from '../lib/sound';
import { waypoints } from '../data/waypoints';

// Where the plane wants to be while each section sits in the middle of the
// screen: x/y in normalised screen space, s = plane length as a share of the
// viewport width, yaw = heading in degrees (0 flies right, 180 flies left).
const POSES = {
  top: { x: 0.2, y: -0.04, s: 0.5, yaw: -24, gear: 0 },
  about: { x: 0.74, y: 0.62, s: 0.19, yaw: 200, gear: 0 },
  work: { x: -0.8, y: 0.66, s: 0.17, yaw: -20, gear: 0 },
  lab: { x: 0.8, y: 0.64, s: 0.16, yaw: 205, gear: 0 },
  papers: { x: -0.8, y: -0.62, s: 0.17, yaw: -15, gear: 0 },
  logbook: { x: 0.8, y: -0.62, s: 0.16, yaw: 200, gear: 0 },
  journey: { x: 0.05, y: 0.8, s: 0.12, yaw: -10, gear: 0 },
  home: { x: -0.82, y: 0.6, s: 0.17, yaw: -22, gear: 0 },
  kanya: { x: 0.0, y: 0.5, s: 0.26, yaw: 190, gear: 0 },
  life: { x: 0.82, y: 0.62, s: 0.15, yaw: 200, gear: 0 },
  frames: { x: -0.82, y: -0.66, s: 0.15, yaw: -20, gear: 0 },
  now: { x: 0.8, y: 0.62, s: 0.15, yaw: 205, gear: 0 },
  contact: { x: -0.5, y: 0.18, s: 0.3, yaw: -18, gear: 1 },
};
const MOBILE = {
  top: { x: 0.1, y: 0.06, s: 0.95, yaw: -24 },
};

const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const quad = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
const wrapAngle = (a) => ((((a + 180) % 360) + 360) % 360) - 180;

export default function PlaneLayer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      canvas.style.display = 'none';
      return undefined;
    }
    const reduce = reducedMotion();
    const isMobile = () => window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 14);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const hemi = new THREE.HemisphereLight(0xdbe8ff, 0xb9a98c, 1.4);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-4, 6, 8);
    scene.add(hemi, sun);

    const accentNow = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f08a24';
    const plane = createAirliner({ accent: accentNow() });
    // View the aircraft from slightly above so the wings read clearly.
    const pivot = new THREE.Group();
    pivot.rotation.x = 0.3;
    pivot.add(plane.group);
    scene.add(pivot);
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

    // ---- section geometry ----------------------------------------------------
    let centers = [];
    const measure = () => {
      const y = window.scrollY;
      centers = waypoints
        .map((w) => {
          const el = document.getElementById(w.id);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { id: w.id, center: r.top + y + Math.min(r.height, window.innerHeight * 1.6) / 2 };
        })
        .filter(Boolean);
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      measure();
    };
    resize();
    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);

    const halfH = () => camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfW = () => halfH() * camera.aspect;

    const poseFor = (id) => {
      const base = POSES[id] || POSES.top;
      if (isMobile()) {
        const m = MOBILE[id];
        if (m) return { ...base, ...m };
        // Keep it small and in the margins on phones.
        return { ...base, x: Math.sign(base.x || 1) * 0.62, y: Math.sign(base.y || 1) * 0.78, s: base.s * 1.9 };
      }
      return base;
    };

    // ---- state -----------------------------------------------------------------
    const st = {
      x: 1.6,
      y: 0.35,
      s: 0.3,
      yaw: -24,
      pitch: 0,
      roll: 0,
      gear: 0,
      vx: 0,
      vy: 0,
      intro: reduce ? 1 : 0,
      spin: 0,
      clicks: 0,
      pointerX: 0,
      pointerY: 0,
      shake: 0,
      fastFor: 0,
      lastTime: performance.now() / 1000,
      visible: true,
    };

    // Intro: arrive from the right, banking into the hero.
    let introTween = null;
    if (!reduce) {
      const startIntro = () => {
        introTween = gsap.to(st, { intro: 1, duration: 2.6, ease: 'power3.out' });
        sound.whoosh(0.8);
      };
      if (getState().loaded) startIntro();
      else {
        const unsub = setInterval(() => {
          if (getState().loaded) {
            clearInterval(unsub);
            startIntro();
          }
        }, 120);
        st._introWait = unsub;
      }
    }

    // ---- interaction -----------------------------------------------------------
    const projected = new THREE.Vector3();
    const planeScreen = () => {
      projected.copy(pivot.position).project(camera);
      return {
        x: (projected.x * 0.5 + 0.5) * window.innerWidth,
        y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
        r: (st.s * window.innerWidth) / 2.2,
      };
    };
    const overPlane = (e) => {
      const p = planeScreen();
      const dx = e.clientX - p.x;
      const dy = (e.clientY - p.y) * 2.2;
      return Math.hypot(dx, dy) < p.r;
    };
    const interactive = (t) => t?.closest?.('a,button,input,textarea,select,label,[role="button"],[data-no-plane]');
    let hovering = false;
    const onMove = (e) => {
      st.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      st.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
      const h = !interactive(e.target) && overPlane(e);
      if (h !== hovering) {
        hovering = h;
        document.documentElement.style.cursor = h ? 'pointer' : '';
      }
    };
    const onClick = (e) => {
      if (interactive(e.target) || !overPlane(e)) return;
      st.clicks += 1;
      gsap.to(st, { spin: st.spin + Math.PI * 2, duration: 1.15, ease: 'power2.inOut' });
      sound.whoosh(1);
      if (st.clicks === 3) findEgg('roll');
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('click', onClick);

    // ---- the loop --------------------------------------------------------------
    const target = { x: 0, y: 0, s: 0.3, yaw: -24, gear: 0 };
    const springTo = (key, goal, k, dt) => {
      st[key] += (goal - st[key]) * (1 - Math.exp(-k * dt));
    };

    const tick = () => {
      if (!st.visible) return;
      const now = performance.now() / 1000;
      const dt = Math.min(0.05, now - st.lastTime);
      st.lastTime = now;

      // Where along the route are we?
      const probe = window.scrollY + window.innerHeight / 2;
      let i = 0;
      while (i < centers.length - 1 && centers[i + 1].center <= probe) i++;
      const a = centers[i];
      const b = centers[Math.min(i + 1, centers.length - 1)];
      let p = 0;
      if (a && b && b.center > a.center) p = THREE.MathUtils.clamp((probe - a.center) / (b.center - a.center), 0, 1);
      if (a && probe < a.center) p = 0;
      const t = smooth(THREE.MathUtils.clamp((p - 0.2) / 0.6, 0, 1));
      const A = poseFor(a?.id || 'top');
      const B = poseFor(b?.id || 'top');
      const side = i % 2 === 0 ? 1 : -1;
      const cx = (A.x + B.x) / 2 + side * 0.35;
      const cy = (A.y + B.y) / 2 + side * 0.25;
      target.x = quad(A.x, cx, B.x, t);
      target.y = quad(A.y, cy, B.y, t);
      target.s = quad(A.s, Math.max(A.s, B.s) * 1.35, B.s, t);
      target.gear = lerp(A.gear || 0, B.gear || 0, t);
      target.yaw = t < 0.5 ? A.yaw : B.yaw;

      // Hero idle: a gentle drift, plus following the pointer a little.
      const inHero = a?.id === 'top' && p < 0.2;
      const idle = inHero ? 1 : 0.35;
      target.x += Math.sin(now * 0.45) * 0.015 * idle + st.pointerX * 0.03 * idle;
      target.y += Math.sin(now * 0.8) * 0.02 * idle + st.pointerY * 0.025 * idle;

      // Intro fly-in from off-screen right.
      const intro = st.intro;
      const introX = lerp(1.7, target.x, intro);
      const introY = lerp(0.42, target.y, intro);

      const prevX = st.x;
      const prevY = st.y;
      springTo('x', introX, intro < 1 ? 60 : 3.2, dt);
      springTo('y', introY, intro < 1 ? 60 : 3.2, dt);
      springTo('s', lerp(0.22, target.s, intro), 3, dt);
      springTo('gear', target.gear, 2.5, dt);
      st.vx = lerp(st.vx, (st.x - prevX) / Math.max(dt, 1e-3), 0.12);
      st.vy = lerp(st.vy, (st.y - prevY) / Math.max(dt, 1e-3), 0.12);

      // Heading follows motion when moving, otherwise the pose.
      const speed = Math.hypot(st.vx, st.vy);
      let goalYaw = target.yaw;
      if (speed > 0.12) goalYaw = st.vx >= 0 ? -24 : 204;
      if (intro < 1) goalYaw = 204 - (204 + 24) * smooth(Math.min(1, intro * 1.3));
      const dyaw = wrapAngle(goalYaw - st.yaw);
      st.yaw += dyaw * (1 - Math.exp(-2.6 * dt));
      // Body-frame pitch: positive is nose-up whichever way we face.
      const goalPitch = THREE.MathUtils.clamp(st.vy * 0.55, -0.45, 0.45) + st.pointerY * 0.06 * idle;
      const scrollBank = THREE.MathUtils.clamp((scrollState.velocity || 0) / 6000, -0.35, 0.35);
      const goalRoll = THREE.MathUtils.clamp(-dyaw * 0.012 - st.vy * 0.15 + scrollBank, -0.9, 0.9) + st.pointerX * -0.08 * idle;
      springTo('pitch', goalPitch, 3, dt);
      springTo('roll', goalRoll, 3, dt);

      // Turbulence egg: sustained, very fast scrolling.
      const v = Math.abs(scrollState.velocity || 0);
      st.fastFor = v > 7000 ? st.fastFor + dt : Math.max(0, st.fastFor - dt * 2);
      if (st.fastFor > 0.35) {
        st.shake = 1;
        if (findEgg('turbulence')) toast('Fasten your seatbelt', 'We are passing through some turbulence. Scrolling that fast will do it.', 'egg');
      }
      st.shake = Math.max(0, st.shake - dt * 0.8);

      // Apply to the model.
      const hw = halfW();
      const hh = halfH();
      const shakeX = st.shake ? (Math.random() - 0.5) * 0.06 * st.shake : 0;
      const shakeY = st.shake ? (Math.random() - 0.5) * 0.06 * st.shake : 0;
      pivot.position.set(st.x * hw + shakeX, st.y * hh + shakeY, 0);
      const scale = (st.s * hw * 2) / 4;
      pivot.scale.setScalar(scale);
      plane.group.rotation.order = 'YZX';
      plane.group.rotation.set(st.roll + st.spin, THREE.MathUtils.degToRad(st.yaw), st.pitch);
      plane.setGear(st.gear);

      // Light it for the real time of day in Lalitpur.
      const world = getWorld();
      const pref = getState().themePref;
      const elev = world.sun.elevation;
      let night = THREE.MathUtils.clamp((2 - elev) / 10, 0, 1);
      if (pref === 'night') night = Math.max(night, 0.85);
      if (pref === 'day') night = Math.min(night, 0.1);
      const golden = THREE.MathUtils.clamp(1 - Math.abs(elev - 2) / 10, 0, 1) * (1 - night);
      hemi.intensity = lerp(1.35, 0.35, night);
      hemi.color.setRGB(lerp(0.86, 0.42, night), lerp(0.91, 0.48, night), lerp(1.0, 0.75, night));
      sun.intensity = lerp(2.3, 0.55, night);
      sun.color.setRGB(1, lerp(0.97, 0.78, golden) * lerp(1, 0.85, night), lerp(0.93, 0.6, golden) * lerp(1, 1.1, night));
      scene.environmentIntensity = lerp(0.9, 0.25, night);
      plane.update(now, { night, landing: st.gear });

      // Contrails while cruising fast.
      const strength = THREE.MathUtils.clamp((speed - 0.25) * 0.8, 0, 0.55) * (1 - st.gear) * (inHero ? 0 : 1);
      pivot.updateMatrixWorld(true);
      trails.forEach((trail, k) => {
        const pt = plane.exhausts[k].clone().applyMatrix4(plane.group.matrixWorld);
        trail.points.unshift({ p: pt, age: 0 });
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

      renderer.render(scene, camera);
    };

    if (reduce) {
      // Still, but present: render the hero pose and re-render on resize.
      const still = () => {
        const p = poseFor('top');
        st.x = p.x;
        st.y = p.y;
        st.s = p.s;
        st.yaw = p.yaw;
        tick();
      };
      st.lastTime = performance.now() / 1000;
      still();
      window.addEventListener('resize', still);
      st._still = still;
      // Without motion the plane stays parked in the hero, so hide it once
      // the hero has scrolled away instead of leaving it over the content.
      const hero = document.getElementById('top');
      if (hero) {
        const io = new IntersectionObserver(([entry]) => {
          canvas.style.opacity = entry.isIntersecting ? '1' : '0';
        });
        io.observe(hero);
        st._io = io;
      }
    } else {
      gsap.ticker.add(tick);
    }

    const onVis = () => {
      st.visible = document.visibilityState === 'visible';
      st.lastTime = performance.now() / 1000;
    };
    document.addEventListener('visibilitychange', onVis);

    // Keep the livery in the season's colour.
    const mo = new MutationObserver(() => plane.setAccent(accentNow()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-season', 'data-theme'] });

    const measureTimer = setInterval(measure, 2500);

    return () => {
      gsap.ticker.remove(tick);
      introTween?.kill();
      clearInterval(st._introWait);
      clearInterval(measureTimer);
      window.removeEventListener('resize', resize);
      if (st._still) window.removeEventListener('resize', st._still);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVis);
      document.documentElement.style.cursor = '';
      ro.disconnect();
      mo.disconnect();
      st._io?.disconnect();
      trails.forEach((t) => {
        t.geo.dispose();
        t.mat.dispose();
      });
      plane.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="plane-layer" aria-hidden="true" />;
}

