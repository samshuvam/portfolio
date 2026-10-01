import { useRef, useState } from 'react';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { dishes } from '../../data/life';
import { gsap, reducedMotion } from '../../lib/motion';
import { sound } from '../../lib/sound';

// A steel thali with twelve katori. Spin it; whatever stops under the
// pointer is dinner.
const COLORS = ['#efe6d4', '#e9b437', '#a8642b', '#f3ead8', '#f6efd9', '#d0582a', '#8a5a2e', '#d89a35', '#f1ece0', '#e6cf9c', '#8c2f24', '#c58b4e'];

export default function Thali() {
  const plate = useRef(null);
  const angle = useRef(0);
  const [pick, setPick] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const n = dishes.length;
  const step = 360 / n;

  const spin = () => {
    if (spinning) return;
    const target = Math.floor(Math.random() * n);
    // Bowl i sits at angle i*step; bring it to the top (pointer at 0deg).
    const current = ((angle.current % 360) + 360) % 360;
    const want = (360 - target * step) % 360;
    let delta = want - current;
    if (delta < 0) delta += 360;
    const total = angle.current + delta + 360 * 3;
    setSpinning(true);
    sound.whoosh(0.5);
    const done = () => {
      angle.current = total;
      setPick(target);
      setSpinning(false);
      sound.success();
    };
    if (reducedMotion()) {
      gsap.set(plate.current, { rotation: total, svgOrigin: '150 150' });
      done();
      return;
    }
    gsap.to(plate.current, { rotation: total, svgOrigin: '150 150', duration: 2.4, ease: 'power3.out', onComplete: done });
  };

  const dish = pick !== null ? dishes[pick] : null;

  return (
    <div className="thali">
      <button type="button" className="thali-btn" onClick={spin} aria-label="Spin the thali to pick a dish" disabled={spinning}>
        <svg viewBox="0 0 300 300" className="thali-svg" aria-hidden="true">
          <defs>
            <radialGradient id="steel" cx="40%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#f4f5f7" />
              <stop offset="55%" stopColor="#bfc4cc" />
              <stop offset="100%" stopColor="#8b919b" />
            </radialGradient>
            <radialGradient id="katori" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#a6acb5" />
            </radialGradient>
          </defs>
          <g ref={plate}>
            <circle cx="150" cy="150" r="142" fill="url(#steel)" />
            <circle cx="150" cy="150" r="128" fill="none" stroke="#9aa0a8" strokeWidth="1.5" />
            <path d="M118 142c8-20 56-20 64 0 6 18-10 30-32 30s-38-12-32-30z" fill="#f7f4ec" stroke="#d9d3c4" />
            {Array.from({ length: 14 }, (_, i) => (
              <circle key={i} cx={128 + (i % 7) * 7} cy={146 + Math.floor(i / 7) * 8} r="1.6" fill="#e7e0cf" />
            ))}
            {dishes.map((d, i) => {
              const a = ((i * step - 90) * Math.PI) / 180;
              const x = 150 + Math.cos(a) * 96;
              const y = 150 + Math.sin(a) * 96;
              return (
                <g key={d.name}>
                  <circle cx={x} cy={y} r="22" fill="url(#katori)" stroke="#8b919b" />
                  <circle cx={x} cy={y} r="16" fill={COLORS[i % COLORS.length]} />
                  <circle cx={x - 5} cy={y - 5} r="4" fill="#fff" opacity="0.35" />
                </g>
              );
            })}
          </g>
          <path d="M150 4l-10 16h20z" className="thali-pointer" />
        </svg>
      </button>
      <div className="thali-out" aria-live="polite">
        {dish ? (
          <>
            <p className="thali-dish">{dish.name}</p>
            <p className="thali-from">{dish.from}</p>
            <p className="thali-note">{dish.note}</p>
          </>
        ) : (
          <p className="thali-note">Twelve dishes I would happily argue about for an hour. Spin to pick tonight’s.</p>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={spin} disabled={spinning}>
          <ArrowsClockwiseIcon size={15} weight="bold" /> {dish ? 'Spin again' : 'Spin the thali'}
        </button>
      </div>
    </div>
  );
}
