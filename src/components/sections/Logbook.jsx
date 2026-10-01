import { useEffect, useRef } from 'react';
import { Term } from '../ui/Term';
import Yap from '../ui/Yap';
import { logbook, leadership, typeRatings, researchDomains } from '../../data/logbook';
import { gsap, reducedMotion } from '../../lib/motion';
import './logbook.css';

const LEVELS = {
  Captain: 'Flies it daily, can teach it',
  'First officer': 'Solid, used in real projects',
  'Type rated': 'Qualified and current',
};

export default function Logbook() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      gsap.from('.log-row', { y: 30, autoAlpha: 0, stagger: 0.12, duration: 0.9, scrollTrigger: { trigger: '.log-table', start: 'top 80%' } });
      gsap.from('.rating-group', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.ratings', start: 'top 82%' } });
      gsap.from('.endorse', { scale: 0.85, autoAlpha: 0, stagger: 0.07, duration: 0.6, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.endorsements', start: 'top 85%' } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="logbook" ref={root} className="section logbook" aria-labelledby="logbook-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="logbook-title" className="t-display">
            The logbook.
          </h2>
          <p className="t-lede">Work and study, logged the way a pilot logs flights. Skills are type ratings, because percentages next to “Python” never meant anything anyway.</p>
        </header>

        <div className="log-table" role="table" aria-label="Experience and education">
          <div className="log-row log-headrow" role="row">
            <span role="columnheader">Date</span>
            <span role="columnheader">Aircraft</span>
            <span role="columnheader">Route</span>
            <span role="columnheader">Hours</span>
            <span role="columnheader">Remarks</span>
          </div>
          {logbook.map((e) => (
            <div key={e.id} className={`log-row log-${e.kind}`} role="row">
              <span role="cell" className="log-date">
                {e.date}
              </span>
              <span role="cell" className="log-aircraft">
                {e.aircraft}
              </span>
              <span role="cell" className="log-route">
                {e.route}
                <small>{e.place}</small>
              </span>
              <span role="cell" className="log-hours">
                {e.hours}
              </span>
              <span role="cell" className="log-remarks">
                <ul>
                  {e.remarks.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <span className="log-skills">
                  {e.skills.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </span>
              </span>
            </div>
          ))}
        </div>

        <Yap>
          The hard part is usually the handoff between systems, not the software itself. In an ERP migration, that handoff is the moment a factory floor and an accounts desk have to agree on what a “stock movement” actually is.
        </Yap>

        <div className="ratings">
          <h3 className="ratings-title">Type ratings</h3>
          <div className="ratings-legend">
            {Object.entries(LEVELS).map(([k, v]) => (
              <span key={k}>
                <b className={`rank rank-${k.split(' ')[0].toLowerCase()}`}>{k}</b> {v}
              </span>
            ))}
          </div>
          <div className="ratings-grid">
            {typeRatings.map((g) => (
              <div key={g.group} className="rating-group">
                <p className="rating-group-name">{g.group}</p>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.name}>
                      <span>{it.term ? <Term id={it.term}>{it.name}</Term> : it.name}</span>
                      <b className={`rank rank-${it.level.split(' ')[0].toLowerCase()}`}>{it.level}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="endorsements">
          <h3 className="ratings-title">Endorsements</h3>
          <ul>
            {leadership.map((l) => (
              <li key={l.title} className="endorse">
                <p className="endorse-title">{l.title}</p>
                <p className="endorse-text">{l.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="domains" aria-label="Research interests">
        <div className="domains-track">
          {[0, 1].map((k) => (
            <div key={k} className="domains-set" aria-hidden={k === 1 ? 'true' : undefined}>
              {researchDomains.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
