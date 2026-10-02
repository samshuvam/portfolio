import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import ThemeSync from '../../components/ThemeSync';
import FogReveal from '../../components/fx/FogReveal';
import Papers from '../../components/sections/Papers';
import Kanya from '../../components/sections/Kanya';
import { TermCardHost } from '../../components/ui/Term';
import { setState } from '../../lib/store';
import { startSmoothScroll } from '../../lib/motion';
import { planeBus, hidePlane, showPlane } from '../../three/planeBus';
import '../../styles/layout.css';
import '../../styles/term-art.css';

// Dev preview (http://localhost:3000/?lab=fog): the global plane with its
// section poses, the two fog sections it tears open, and a HUD showing
// planeBus. The dashed box is the plane's projected hit box.

const PlaneLayer = lazy(() => import('../../three/PlaneLayer'));

function Filler({ id, title, tall }) {
  return (
    <section id={id} className="section" style={{ minHeight: tall ? '150vh' : '80vh' }}>
      <div className="wrap">
        <p className="t-label">#{id}</p>
        <h2 className="t-display">{title}</h2>
        <p className="t-lede" style={{ maxWidth: '42ch', marginTop: '1rem' }}>
          Filler copy so the plane has something to fly behind. Scroll slowly through the fog sections and watch the plane tear it open.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <a href="#top">A link the plane must never steal</a> and <button type="button">a button</button>.
        </p>
      </div>
    </section>
  );
}

function Hud() {
  const text = useRef(null);
  const box = useRef(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const s = planeBus.screen;
      const sw = planeBus.sweep;
      if (text.current) {
        text.current.textContent =
          `plane x ${Math.round(s.x)} y ${Math.round(s.y)} size ${Math.round(s.size)} visible ${s.visible} above ${!!s.above} heading ${Math.round(s.heading || 0)} vx ${Math.round(s.vx || 0)}\n` +
          `sweep ${sw ? `pass ${sw.pass} dir ${sw.dir} y ${sw.y.toFixed(2)} q ${sw.progress.toFixed(2)}` : 'none'} aboveContent ${planeBus.aboveContent} hidden [${[...planeBus.hidden].join(',')}]`;
      }
      if (box.current && s.rect) {
        const r = s.rect;
        box.current.style.transform = `translate(${r.left}px, ${r.top}px)`;
        box.current.style.width = `${Math.max(0, r.right - r.left)}px`;
        box.current.style.height = `${Math.max(0, r.bottom - r.top)}px`;
        box.current.style.display = s.visible ? 'block' : 'none';
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <>
      <div ref={box} aria-hidden="true" style={{ position: 'fixed', left: 0, top: 0, border: '1px dashed var(--accent-fg)', zIndex: 94, pointerEvents: 'none' }} />
      <pre ref={text} style={{ position: 'fixed', left: 8, bottom: 8, right: 8, zIndex: 95, margin: 0, padding: '6px 10px', font: '11px/1.4 var(--font-mono)', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 10, whiteSpace: 'pre-wrap', pointerEvents: 'none' }} />
    </>
  );
}

export default function FogLab() {
  const [round, setRound] = useState(0);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    startSmoothScroll();
    const t = setTimeout(() => setState({ loaded: true }), 300);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (hidden) hidePlane('lab');
    else showPlane('lab');
  }, [hidden]);

  return (
    <>
      <ThemeSync />
      <Suspense fallback={null}>
        <PlaneLayer />
      </Suspense>
      <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 96, display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRound((r) => r + 1)}>
          Reset fog
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHidden((h) => !h)} aria-pressed={hidden}>
          {hidden ? 'Show plane' : 'Hide plane'}
        </button>
      </div>
      <main id="main">
        <section id="top" className="section" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <h1 className="t-hero">Fog lab.</h1>
        </section>
        <Filler id="about" title="About" />
        <Filler id="arcade" title="Arcade" />
        <FogReveal key={`smog-${round}`} variant="smog">
          <Papers />
        </FogReveal>
        <Filler id="logbook" title="Logbook" tall />
        <Filler id="home" title="Janakpur" />
        <FogReveal key={`cloud-${round}`} variant="cloud">
          <Kanya />
        </FogReveal>
        <Filler id="life" title="Life" />
        <Filler id="contact" title="Contact" />
        <Filler id="landing" title="Landing" />
      </main>
      <Hud />
      <TermCardHost />
    </>
  );
}
