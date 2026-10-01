import { useEffect, useMemo, useRef, useState } from 'react';
import { Term } from '../ui/Term';
import Yap from '../ui/Yap';
import { traits, virgoLines, virgoNamed, virgoField } from '../../data/kanya';
import { gsap, reducedMotion } from '../../lib/motion';
import { setGrid } from '../../lib/grid';
import './kanya.css';

// Sky chart projection: RA increases to the left, as when facing south.
const RA_MAX = 232;
const DEC_MAX = 18;
const K = 10;
const px = (ra) => (RA_MAX - ra) * K;
const py = (dec) => (DEC_MAX - dec) * K;

function Constellation() {
  const lines = virgoLines.map((seg) => seg.map(([ra, dec], i) => `${i ? 'L' : 'M'}${px(ra).toFixed(1)} ${py(dec).toFixed(1)}`).join(''));
  return (
    <svg viewBox="0 0 640 420" className="virgo" role="img" aria-label="The constellation Virgo, with Spica, known in jyotish as Chitra, as its brightest star">
      {virgoField.map(([ra, dec, mag], i) => (
        <circle key={i} cx={px(ra)} cy={py(dec)} r={Math.max(0.6, 3.6 - mag * 0.62)} className="virgo-star" style={{ animationDelay: `${(i * 0.37) % 4}s` }} />
      ))}
      {lines.map((d, i) => (
        <path key={i} d={d} className="virgo-line" />
      ))}
      {virgoNamed.map((s) => (
        <g key={s.name}>
          <circle cx={px(s.ra)} cy={py(s.dec)} r={Math.max(2.4, 6 - s.mag * 1.1)} className={`virgo-named ${s.alt ? 'is-spica' : ''}`} />
          <text x={px(s.ra) + 12} y={py(s.dec) + 4} className="virgo-label">
            {s.name}
            {s.alt ? `, ${s.alt}` : ''}
          </text>
        </g>
      ))}
    </svg>
  );
}

function TraitCard({ t, i }) {
  const [flip, setFlip] = useState(false);
  return (
    <li className="trait">
      <button type="button" className={`trait-inner ${flip ? 'is-flipped' : ''}`} onClick={() => setFlip(!flip)} aria-pressed={flip} aria-label={`${t.trait}. ${flip ? t.evidence : 'Show the evidence'}`}>
        <span className="trait-face trait-front">
          <span className="trait-n font-deva" aria-hidden="true">
            {'१२३४५६७८'[i]}
          </span>
          <span className="trait-name">{t.trait}</span>
          <span className="trait-cta">See the evidence</span>
        </span>
        <span className="trait-face trait-back">
          <span className="trait-ev-label">Evidence</span>
          <span className="trait-ev">{t.evidence}</span>
        </span>
      </button>
    </li>
  );
}

export default function Kanya() {
  const root = useRef(null);
  const [checked, setChecked] = useState(false);
  const reduce = useMemo(() => reducedMotion(), []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reduce) return;
      gsap.from('.virgo-line', { drawSVG: '0%', duration: 2.4, stagger: 0.3, ease: 'power2.inOut', scrollTrigger: { trigger: '.virgo', start: 'top 70%' } });
      gsap.from('.virgo-named, .virgo-label', { autoAlpha: 0, duration: 0.8, stagger: 0.08, delay: 0.6, scrollTrigger: { trigger: '.virgo', start: 'top 70%' } });
      gsap.from('.kanya-np', { y: 60, autoAlpha: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.kanya-head', start: 'top 80%' } });
      gsap.from('.trait', { y: 40, autoAlpha: 0, rotateX: -30, stagger: 0.07, duration: 0.8, scrollTrigger: { trigger: '.traits', start: 'top 85%' } });
    }, root);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section id="kanya" ref={root} className="kanya" aria-labelledby="kanya-title">
      <div className="kanya-sky" aria-hidden="true" />
      <div className="kanya-content wrap">
        <div className="kanya-layout">
          <header className="kanya-head">
            <p className="kanya-np font-deva" aria-hidden="true">
              कन्या राशि
            </p>
            <h2 id="kanya-title" className="t-display">
              Kanya. <span className="light">Virgo, the maiden.</span>
            </h2>
            <p className="kanya-lede">
              In Hindu jyotish your rashi isn’t simply your birthday’s sun sign; it comes from the kundali. Mine is <Term id="kanya">Kanya</Term>, ruled by <Term id="budh">Budh</Term>: intellect, analysis, speech. Kanya means
              maiden, and I was born in the city of the most famous one.
            </p>
            <Yap>Every Kanya trait below comes with evidence. Kanya people do not accept claims without evidence. That is, itself, the first piece of evidence.</Yap>
          </header>
          <figure className="virgo-wrap">
            <Constellation />
            <figcaption>
              Virgo from real star positions. Its brightest star, Spica, is <Term id="chitra">Chitra</Term> in jyotish.
            </figcaption>
          </figure>
        </div>

        <h3 className="traits-title">A textbook Kanya, with evidence.</h3>
        <ul className="traits">
          {traits.map((t, i) => (
            <TraitCard key={t.id} t={t} i={i} />
          ))}
        </ul>

        <div className="kanya-check">
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => {
              const on = !checked;
              setChecked(on);
              setGrid(on);
            }}
            aria-pressed={checked}
          >
            {checked ? 'Turn the grid off' : 'Run a Kanya alignment check'}
          </button>
          <p aria-live="polite">{checked ? 'Twelve columns, an 8 px baseline. Everything aligns. Obviously.' : 'Or press G anywhere on the page.'}</p>
        </div>
      </div>
    </section>
  );
}
