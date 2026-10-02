import { lazy, Suspense, useEffect, useState } from 'react';
import ThemeSync from '../../components/ThemeSync';
import Intro from '../../components/intro/Intro';
import { useStore } from '../../lib/store';
import { planeBus } from '../../three/planeBus';
import '../../styles/layout.css';

// Dev preview: http://localhost:3000/?lab=intro
//   &intro=cinema|calm|fallback  force a mode (ignores the session flag)
//   &freeze=5.6                  hold the cinematic on one moment
//   &at=2026-11-08T19:30 &weather=rain &season=shishir  time travel
// The HUD shows store state and the scene's draw calls.

const PlaneLayer = lazy(() => import('../../three/PlaneLayer'));

const go = (params) => {
  const u = new URL(window.location.href);
  ['intro', 'freeze'].forEach((k) => u.searchParams.delete(k));
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  window.location.href = u.toString();
};

function Hud() {
  const intro = useStore((s) => s.intro);
  const loaded = useStore((s) => s.loaded);
  const [info, setInfo] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      const s = window.__ssTakeoff;
      const i = s?.info?.();
      setInfo(i ? `calls ${i.calls}, tris ${i.triangles}` : 'scene off');
    }, 250);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ position: 'fixed', left: 8, bottom: 8, zIndex: 200, font: '12px/1.4 monospace', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 8px', borderRadius: 8, display: 'grid', gap: 4 }}>
      <span>
        intro {intro}, loaded {String(loaded)}, introDone {String(planeBus.introDone)}, {info}
      </span>
      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => go({ intro: 'cinema' })}>cinema</button>
        <button type="button" onClick={() => go({ intro: 'calm' })}>calm</button>
        <button type="button" onClick={() => go({ intro: 'fallback' })}>fallback</button>
        {[1, 3.1, 4.6, 5.9, 6.6, 7.6].map((f) => (
          <button key={f} type="button" onClick={() => go({ intro: 'cinema', freeze: String(f) })}>
            t={f}
          </button>
        ))}
      </span>
    </div>
  );
}

export default function IntroLab() {
  return (
    <>
      <ThemeSync />
      <Intro />
      <Suspense fallback={null}>
        <PlaneLayer />
      </Suspense>
      <main>
        <section className="section" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <h1 className="t-display" style={{ textAlign: 'center' }}>
            Shuvam Singh
          </h1>
        </section>
      </main>
      <Hud />
    </>
  );
}
