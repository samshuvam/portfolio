import L, { useCopy } from '../../i18n/Text';
import { useLocalize, localDigits } from '../../i18n';
import overlay from '../../i18n/content/logbook';
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
  const c=useCopy();
  const root = useRef(null);
  const loc=useLocalize(overlay);
  const ranks=loc(Object.fromEntries(Object.entries(LEVELS).map(([label,text])=>[label,{label,text}])), 'levels');

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
          <h2 id="logbook-title" className="t-display"> <L text={"The logbook."} /> </h2>
          <p className="t-lede"> <L text={"Work and study, logged the way a pilot logs flights. Skills are type ratings, because percentages next to “Python” never meant anything anyway."} /> </p>
        </header>

        <div className="log-table" role="table" aria-label="Experience and education">
          <div className="log-row log-headrow" role="row">
            <span role="columnheader"> <L text={"Date"} /> </span>
            <span role="columnheader"> <L text={"Aircraft"} /> </span>
            <span role="columnheader"> <L text={"Route"} /> </span>
            <span role="columnheader"> <L text={"Hours"} /> </span>
            <span role="columnheader"> <L text={"Remarks"} /> </span>
          </div>
          {logbook.map(e=>loc(e)).map((e) => (
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

        <Yap> <L text={"The hard part is usually the handoff between systems, not the software itself. In an ERP migration, that handoff is the moment a factory floor and an accounts desk have to agree on what a “stock movement” actually is."} /> </Yap>

        <div className="ratings">
          <h3 className="ratings-title"> <L text={"Type ratings"} /> </h3>
          <div className="ratings-legend">
            {Object.entries(LEVELS).map(([k, v]) => (
              <span key={k}>
                <b className={`rank rank-${k.split(' ')[0].toLowerCase()}`}>{ranks[k].label}</b> {ranks[k].text}
              </span>
            ))}
          </div>
          <div className="ratings-grid">
            {loc(typeRatings,'typeRatings').map((g) => (
              <div key={g.group} className="rating-group">
                <p className="rating-group-name">{g.group}</p>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.name}>
                      <span>{it.term ? <Term id={it.term}>{it.name}</Term> : it.name}</span>
                      <b className={`rank rank-${it.level.split(' ')[0].toLowerCase()}`}>{ranks[it.level]?.label || it.level}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="endorsements">
          <h3 className="ratings-title"> <L text={"Endorsements"} /> </h3>
          <ul>
            {loc(leadership,'leadership').map((l) => (
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
              {loc(researchDomains,'researchDomains').map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
