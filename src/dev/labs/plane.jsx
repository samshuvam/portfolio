import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAirliner } from '../../three/airliner';

// Dev preview (http://localhost:3000/?lab=plane): the procedural airliner,
// lit the way PlaneLayer lights it, with orbit controls, day/night, gear and
// accent controls, and an inset view of the parked "Kalyani" variant.

const ACCENTS = ['#d42c43', '#f2a31b', '#1f7a45', '#f08a24', '#d9a520', '#3557c4', '#ff6b80', '#8aa4ff'];
const VIEWS = {
  front: [5.2, 1.6, 4.2],
  side: [0, 0.2, 7.5],
  top: [0.01, 8, 0.01],
  below: [2.5, -5, 3.5],
  rear: [-5.5, 1.4, -3.5],
  nose: [2.9, 0.35, 1.1],
  cockpit: [2.45, 0.3, 0.75, 1.75, 0.08, 0],
  engine: [1.6, -0.25, 1.6, 0.4, -0.25, 0.6],
};

function light(scene, night) {
  const lerp = (a, b, t) => a + (b - a) * t;
  const hemi = new THREE.HemisphereLight(0xdbe8ff, 0xb9a98c, 1.4);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-4, 6, 8);
  scene.add(hemi, sun);
  return (n) => {
    hemi.intensity = lerp(1.35, 0.35, n);
    hemi.color.setRGB(lerp(0.86, 0.42, n), lerp(0.91, 0.48, n), lerp(1.0, 0.75, n));
    sun.intensity = lerp(2.3, 0.55, n);
    sun.color.setRGB(1, lerp(0.97, 0.85, n), lerp(0.93, 1, n));
    scene.environmentIntensity = lerp(0.9, 0.25, n);
  };
}

export default function PlaneLab() {
  const canvasRef = useRef(null);
  const ctl = useRef({ night: 0, gear: 1, accent: ACCENTS[3], view: null, spin: false });
  const [night, setNight] = useState(false);
  const [gear, setGear] = useState(1);
  const [accent, setAccent] = useState(ACCENTS[3]);
  const [spin, setSpin] = useState(false);
  const [stats, setStats] = useState('');
  const [toolsOpen, setToolsOpen] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.autoClear = false;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const scene = new THREE.Scene();
    scene.environment = env;
    const setLight = light(scene);
    const plane = createAirliner({ accent: ctl.current.accent });
    scene.add(plane.group);

    const scene2 = new THREE.Scene();
    scene2.environment = env;
    const setLight2 = light(scene2);
    const kalyani = createAirliner({ variant: 'kalyani' });
    kalyani.setGear(1);
    scene2.add(kalyani.group);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
    camera.position.set(...VIEWS.front);
    const camera2 = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.minDistance = 1;
    controls.maxDistance = 20;
    if (import.meta.env.DEV) window.__planeLab = { camera, controls, plane, kalyani, ctl: ctl.current };

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let frame = 0;
    const t0 = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const c = ctl.current;
      if (c.view) {
        const v = VIEWS[c.view];
        camera.position.set(v[0], v[1], v[2]);
        controls.target.set(v[3] || 0, v[4] || 0, v[5] || 0);
        c.view = null;
      }
      if (c.accentDirty) {
        plane.setAccent(c.accent);
        c.accentDirty = false;
      }
      const t = (performance.now() - t0) / 1000;
      if (c.spin) plane.group.rotation.y = t * 0.3;
      controls.update();
      plane.setGear(c.gear);
      plane.update(t, { night: c.night, landing: c.gear });
      kalyani.update(t + 0.4, { night: c.night, landing: 0 });
      setLight(c.night);
      setLight2(c.night);

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const bg = new THREE.Color(c.night ? 0x161a33 : 0xe9e4d8);
      renderer.setScissorTest(false);
      renderer.setClearColor(bg, 1);
      renderer.clear();
      renderer.info.reset();
      renderer.info.autoReset = false;
      renderer.render(scene, camera);
      const calls = renderer.info.render.calls;
      const tris = renderer.info.render.triangles;

      // Inset: Kalyani parked, seen from the same direction.
      const iw = Math.round(Math.min(w * 0.42, 420));
      const ih = Math.round(iw * 0.62);
      const x = w - iw - 12;
      const y = 12;
      camera2.aspect = iw / ih;
      camera2.updateProjectionMatrix();
      const dir = camera.position.clone().sub(controls.target).normalize();
      camera2.position.copy(dir.multiplyScalar(7.2));
      camera2.lookAt(0, 0, 0);
      renderer.setViewport(x, y, iw, ih);
      renderer.setScissor(x, y, iw, ih);
      renderer.setScissorTest(true);
      renderer.setClearColor(bg.clone().offsetHSL(0, 0, c.night ? 0.05 : -0.05), 1);
      renderer.clear();
      renderer.render(scene2, camera2);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, w, h);
      if (frame++ % 30 === 0) setStats(`${calls} draw calls, ${tris.toLocaleString()} triangles (main view)`);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      delete window.__planeLab;
      window.removeEventListener('resize', resize);
      controls.dispose();
      plane.dispose();
      kalyani.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  const pick = (a) => {
    setAccent(a);
    ctl.current.accent = a;
    ctl.current.accentDirty = true;
  };

  const panel = {
    position: 'fixed',
    left: 12,
    bottom: 12,
    right: 12,
    maxWidth: 560,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: 22,
    background: night ? 'rgba(20,24,48,0.85)' : 'rgba(255,255,255,0.85)',
    color: night ? '#e8e9f2' : '#1b1e26',
    font: '500 13px system-ui, sans-serif',
    backdropFilter: 'blur(8px)',
  };
  const btn = { minHeight: 40, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(128,128,128,0.4)', background: 'transparent', color: 'inherit', cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: night ? '#161a33' : '#e9e4d8' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      <button type="button" style={{...btn,position:'fixed',top:8,left:8,zIndex:10,background:'#ffffffdd'}} onClick={()=>setToolsOpen(!toolsOpen)}>{toolsOpen?'Hide controls':'Show controls'}</button>
      {toolsOpen&&<div style={panel}>
        <button
          type="button"
          style={btn}
          onClick={() => {
            setNight((v) => !v);
            ctl.current.night = night ? 0 : 1;
          }}
        >
          {night ? 'Night' : 'Day'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Gear
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={gear}
            onChange={(e) => {
              const v = Number(e.target.value);
              setGear(v);
              ctl.current.gear = v;
            }}
          />
        </label>
        <button
          type="button"
          style={btn}
          onClick={() => {
            setSpin((v) => !v);
            ctl.current.spin = !spin;
          }}
        >
          {spin ? 'Stop' : 'Spin'}
        </button>
        <div style={{ display: 'flex', gap: 6 }} role="group" aria-label="Accent">
          {ACCENTS.map((a) => (
            <button
              key={a}
              type="button"
              aria-label={`Accent ${a}`}
              aria-pressed={a === accent}
              onClick={() => pick(a)}
              style={{ width: 28, height: 28, borderRadius: 999, background: a, border: a === accent ? '3px solid currentColor' : '1px solid rgba(0,0,0,0.2)', cursor: 'pointer' }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.keys(VIEWS).map((v) => (
            <button key={v} type="button" style={{ ...btn, minHeight: 32 }} onClick={() => (ctl.current.view = v)}>
              {v}
            </button>
          ))}
        </div>
        <div style={{ width: '100%', opacity: 0.7 }}>{stats}</div>
      </div>}
    </div>
  );
}

