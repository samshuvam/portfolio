import L, { useCopy } from '../../i18n/Text';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Yap from '../ui/Yap';
import { gsap, reducedMotion } from '../../lib/motion';
import { sound } from '../../lib/sound';
import './lab.css';

const MemoryLab = lazy(() => import('./MemoryLab'));
const AirspaceLab = lazy(() => import('./AirspaceLab'));
const TokenLab = lazy(() => import('./TokenLab'));
const FlyLab = lazy(() => import('./FlyLab'));

const TABS = [
  { id: 'memory', n: '§1', title: 'Memory that forgets on purpose', text: 'Scrub through a week. Watch recall and sleep turn a fading memory into a lasting one.', C: MemoryLab },
  { id: 'airspace', n: '§2', title: 'Airspace in four dimensions', text: 'eVTOLs over the Kathmandu valley, each predicting its own path. Drop a storm and watch them reroute.', C: AirspaceLab },
  { id: 'tokens', n: '§3', title: 'Truth on a token budget', text: 'Shrink the context window and see which pipeline still uses its evidence.', C: TokenLab },
  { id: 'fly', n: '§4', title: 'Fly the eVTOL', text: 'A city at rooftop height and a craft that wants to sink. Ten safe arrivals for a stamp.', C: FlyLab },
];

export default function Lab() {
  const c=useCopy();
  const [tab, setTab] = useState('memory');
  const root = useRef(null);
  const panel = useRef(null);
  const active = TABS.find((t) => t.id === tab);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      gsap.from('.lab-tab', { x: -30, autoAlpha: 0, stagger: 0.08, duration: 0.8, scrollTrigger: { trigger: root.current, start: 'top 70%' } });
      gsap.from('.lab-panel', { y: 40, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: root.current, start: 'top 70%' } });
    }, root);
    return () => ctx.revert();
  }, []);

  const choose = (id) => {
    if (id === tab) return;
    sound.click();
    if (!reducedMotion() && panel.current) {
      gsap.fromTo(panel.current, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    }
    setTab(id);
  };

  const onKey = (e) => {
    const i = TABS.findIndex((t) => t.id === tab);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = TABS[(i + 1) % TABS.length];
      choose(next.id);
      document.getElementById(`lab-tab-${next.id}`)?.focus();
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = TABS[(i - 1 + TABS.length) % TABS.length];
      choose(prev.id);
      document.getElementById(`lab-tab-${prev.id}`)?.focus();
    }
  };

  return (
    <section id="lab" ref={root} className="section lab" aria-labelledby="lab-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="lab-title" className="t-display"> <L text={"Play with"} /> <span className="light"> <L text={"the research."} /> </span>
          </h2>
          <p className="t-lede"> <L text={"Four small simulations of the ideas behind the papers and projects. Honest illustrations, not the production code, but the mechanics are real."} /> </p>
          <Yap> <L text={"The airspace sim is set over the Kathmandu valley on purpose: a dense bowl ringed by hills, with roads already at capacity, is exactly the kind of place urban air mobility research is for."} /> </Yap>
        </header>

        <div className="lab-grid">
          <div className="lab-tabs" role="tablist" aria-label="Simulations" aria-orientation="vertical" onKeyDown={onKey}>
            {TABS.map((t) => (
              <button
                key={t.id}
                id={`lab-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls="lab-panel"
                tabIndex={tab === t.id ? 0 : -1}
                className="lab-tab"
                onClick={() => choose(t.id)}
              >
                <span className="lab-tab-n">{t.n}</span>
                <span className="lab-tab-title"><L text={t.title}/></span>
                <span className="lab-tab-text"><L text={t.text}/></span>
              </button>
            ))}
          </div>
          <div ref={panel} id="lab-panel" className="lab-panel" role="tabpanel" aria-labelledby={`lab-tab-${tab}`}>
            <Suspense fallback={<div className="lab-skeleton" aria-hidden="true" />}>
              <active.C />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
