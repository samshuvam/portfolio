import { useEffect, useRef, useState } from 'react';
import { gsap, reducedMotion } from '../../lib/motion';
import { setState } from '../../lib/store';
import './loader.css';

// Janaki Mandir in single-line Mithila style: domes, chhatris, the gate.
const dome = (x, base, w, h) =>
  `M${x - w / 2} ${base}C${x - w / 2} ${base - h * 0.62} ${x - w * 0.18} ${base - h * 0.72} ${x} ${base - h}C${x + w * 0.18} ${base - h * 0.72} ${x + w / 2} ${base - h * 0.62} ${x + w / 2} ${base}`;
const finial = (x, top) => `M${x} ${top}v-10M${x - 3} ${top - 6}h6`;
const arch = (x, base, w, h) => `M${x - w / 2} ${base}V${base - h + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w / 2} ${base - h + w / 2}V${base}`;

const TEMPLE = [
  'M20 192H380',
  'M60 192V96H96V192M304 192V96H340V192',
  dome(78, 96, 40, 42) + finial(78, 54),
  dome(322, 96, 40, 42) + finial(322, 54),
  'M96 192V118H304V192',
  'M150 118V84H250V118',
  dome(200, 84, 62, 52) + finial(200, 32),
  dome(132, 118, 22, 20),
  dome(268, 118, 22, 20),
  arch(200, 192, 40, 58),
  arch(128, 192, 18, 30) + arch(272, 192, 18, 30),
  arch(166, 160, 12, 22) + arch(234, 160, 12, 22),
  'M104 132H296M104 140H296',
  'M64 120H92M64 128H92M308 120H336M308 128H336',
];

export default function Loader() {
  const [done, setDone] = useState(false);
  const root = useRef(null);
  const barRef = useRef(null);
  const pctRef = useRef(null);

  useEffect(() => {
    const reduce = reducedMotion();
    let seen = false;
    try {
      seen = sessionStorage.getItem('ss-boarded') === '1';
      sessionStorage.setItem('ss-boarded', '1');
    } catch {
      /* ignore */
    }
    const quick = seen || reduce;
    const progress = { v: 0 };
    const ctx = gsap.context(() => {
      const paths = root.current.querySelectorAll('.loader-temple path');
      if (!quick) {
        gsap.set(paths, { drawSVG: '0%' });
        gsap.to(paths, { drawSVG: '100%', duration: 1.2, stagger: 0.07, ease: 'power2.inOut' });
        gsap.from('.loader-word', { autoAlpha: 0, y: 12, duration: 0.8, delay: 0.3, stagger: 0.12 });
      }
    }, root);

    const update = () => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress.v / 100})`;
      if (pctRef.current) pctRef.current.textContent = `${Math.round(progress.v)}%`;
    };

    // Real readiness: fonts, plus a minimum so the drawing can finish.
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const minTime = new Promise((r) => setTimeout(r, quick ? 150 : 1900));
    const maxTime = new Promise((r) => setTimeout(r, 4500));
    gsap.to(progress, { v: 82, duration: quick ? 0.15 : 1.6, ease: 'power2.out', onUpdate: update });

    let cancelled = false;
    Promise.race([Promise.all([fonts, minTime]), maxTime]).then(() => {
      if (cancelled) return;
      gsap.to(progress, {
        v: 100,
        duration: quick ? 0.1 : 0.35,
        onUpdate: update,
        onComplete: () => {
          setState({ loaded: true });
          if (quick) {
            gsap.to(root.current, { autoAlpha: 0, duration: 0.35, onComplete: () => setDone(true) });
          } else {
            gsap
              .timeline({ onComplete: () => setDone(true) })
              .to('.loader-inner', { y: -30, autoAlpha: 0, duration: 0.5, ease: 'power2.in' })
              .to(root.current, { clipPath: 'ellipse(140% 0% at 50% 0%)', duration: 1.05, ease: 'power4.inOut' }, '-=0.15');
          }
        },
      });
    });

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  if (done) return null;
  return (
    <div ref={root} className="loader" role="status" aria-live="polite" aria-label="Loading">
      <div className="loader-inner">
        <svg className="loader-temple" viewBox="0 0 400 200" aria-hidden="true">
          {TEMPLE.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
        <p className="loader-word font-tirhuta" aria-hidden="true">
          {'\u{11496}\u{114A2}\u{1148F}\u{114A3}\u{114B3}\u{114A9}'}
        </p>
        <p className="loader-word loader-line">Boarding SS2504, Janakpur to everywhere</p>
        <div className="loader-bar" aria-hidden="true">
          <span ref={barRef} />
        </div>
        <p className="loader-pct t-mono">
          <span>Boarding</span>
          <span ref={pctRef}>0%</span>
        </p>
      </div>
    </div>
  );
}
