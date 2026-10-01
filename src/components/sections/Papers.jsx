import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon, ArrowUpRightIcon } from '@phosphor-icons/react';
import { papers, bibtex } from '../../data/papers';
import { setState } from '../../lib/store';
import { gsap, reducedMotion } from '../../lib/motion';
import { sound } from '../../lib/sound';
import './papers.css';

function Paper({ p, i }) {
  const [copied, setCopied] = useState(false);
  const [plain, setPlain] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bibtex(p));
      setCopied(true);
      sound.success();
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };
  return (
    <article className="paper" style={{ '--tilt': i % 2 ? '1.6deg' : '-2deg' }} aria-labelledby={`paper-${p.id}`}>
      <div className="paper-sheet">
        <p className="paper-venue">
          {p.venue} ({p.venueShort})
        </p>
        <h3 id={`paper-${p.id}`} className="paper-title">
          {p.title}
        </h3>
        <p className="paper-authors">{p.authors}</p>
        <p className="paper-aff">{p.affiliation}</p>
        <div className="paper-cols">
          <div>
            <p className="paper-abs">
              <b>Abstract.</b> {p.abstract}
            </p>
            <p className="paper-kw">
              <b>Index terms:</b> {p.keywords.join(', ')}.
            </p>
          </div>
          <div className={`paper-plain ${plain ? 'is-on' : ''}`}>
            <p className="paper-plain-h">In plain words</p>
            <p>{p.plain}</p>
          </div>
        </div>
        <div className="paper-stamp" aria-label={`${p.status}, ${p.venueShort}`}>
          <span>Accepted</span>
          <span>{p.venueShort}</span>
        </div>
      </div>
      <div className="paper-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPlain(!plain)} aria-pressed={plain}>
          {plain ? 'Back to the abstract' : 'Explain it like I’m 12'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>
          {copied ? <CheckIcon size={15} weight="bold" /> : <CopyIcon size={15} />} {copied ? 'BibTeX copied' : 'Copy BibTeX'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setState({ project: p.projectId })}>
          The project <ArrowUpRightIcon size={15} weight="bold" />
        </button>
      </div>
    </article>
  );
}

export default function Papers() {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      gsap.from('.paper', { y: 120, rotate: (i) => (i % 2 ? 8 : -8), autoAlpha: 0, stagger: 0.15, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.papers-desk', start: 'top 80%' } });
      gsap.from('.paper-stamp', { scale: 2.4, autoAlpha: 0, rotate: -30, stagger: 0.2, duration: 0.5, ease: 'back.out(1.8)', delay: 0.5, scrollTrigger: { trigger: '.papers-desk', start: 'top 60%', onEnter: () => sound.stamp() } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="papers" ref={root} className="section papers" aria-labelledby="papers-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="papers-title" className="t-display">
            Two papers, <span className="light">peer reviewed.</span>
          </h2>
          <p className="t-lede">One teaches AI to remember the way people do. The other keeps aircraft from claiming the same piece of sky at the same moment. Both accepted for presentation at international conferences.</p>
        </header>
        <div className="papers-desk">
          {papers.map((p, i) => (
            <Paper key={p.id} p={p} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
