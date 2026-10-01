import { useEffect, useRef, useState } from 'react';
import { ArrowDownRightIcon, CameraIcon, PersonSimpleRunIcon } from '@phosphor-icons/react';
import Thali from './Thali';
import DepartureBoard from './DepartureBoard';
import ExplodedPhone from './ExplodedPhone';
import { Term } from '../ui/Term';
import { gadgets } from '../../data/life';
import { photos, photoById, cameraCounts } from '../../lib/photos';
import { setState, useStore } from '../../lib/store';
import { findEgg } from '../../lib/eggs';
import { gsap, reducedMotion, scrollToTarget } from '../../lib/motion';
import './life.css';

function YapMeter() {
  const yap = useStore((s) => s.yap);
  const [counts, setCounts] = useState({ base: 0, extra: 0 });
  useEffect(() => {
    const count = (els) => [...els].reduce((n, el) => n + (el.textContent.trim().split(/\s+/).filter(Boolean).length || 0), 0);
    const main = document.getElementById('main');
    if (!main) return;
    const extra = count(main.querySelectorAll('.yap'));
    const all = count([main]);
    setCounts({ base: all - extra, extra });
  }, []);
  const pct = counts.base ? Math.round((counts.extra / counts.base) * 100) : 0;
  return (
    <div className="life-cell life-yap">
      <p className="life-kicker">Professional yapper</p>
      <p className="life-big">{yap ? 'Yap mode is on.' : 'Give me any topic and twenty minutes.'}</p>
      <p className="life-text">
        Kanya is ruled by <Term id="budh">Budh</Term>, the planet of speech. Explains a lot. Yap mode adds {counts.extra.toLocaleString()} words of commentary to this page, {pct}% more Shuvam.
      </p>
      <button
        type="button"
        className={`btn btn-sm ${yap ? 'btn-ghost' : 'btn-accent'}`}
        onClick={() => {
          setState({ yap: !yap });
          if (!yap) findEgg('yap');
        }}
      >
        {yap ? 'Back to TL;DR' : 'Let me yap'}
      </button>
    </div>
  );
}

export default function Life() {
  const root = useRef(null);
  const spotted = photoById('1000024316');
  const stack = ['1000000448', 'img-1766-1', '1000000706'].map(photoById).filter(Boolean);
  const cams = Object.entries(cameraCounts);
  const withoutExif = photos.length - cams.reduce((n, [, c]) => n + c, 0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      gsap.from('.life-cell', { y: 50, autoAlpha: 0, stagger: 0.08, duration: 0.9, scrollTrigger: { trigger: '.life-bento', start: 'top 80%' } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="life" ref={root} className="section life" aria-labelledby="life-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="life-title" className="t-display">
            Off <span className="light">the clock.</span>
          </h2>
          <p className="t-lede">Food, gadgets, aircraft, and talking about all three. Always moving, rarely quiet.</p>
        </header>

        <div className="life-bento">
          <div className="life-cell life-food">
            <p className="life-kicker">Big-time foodie, happy cook</p>
            <Thali />
          </div>

          <div className="life-cell life-air">
            <div className="life-air-top">
              <div>
                <p className="life-kicker">Aviation, always</p>
                <p className="life-big">Plane spotter. Will look up mid-sentence.</p>
              </div>
              {spotted && (
                <figure className="life-spotted">
                  <img src={spotted.srcset[0].src} alt="EHang EH216-S eVTOL on display" loading="lazy" />
                  <figcaption>Spotted: EHang EH216-S</figcaption>
                </figure>
              )}
            </div>
            <DepartureBoard />
          </div>

          <div className="life-cell life-gadgets">
            <ExplodedPhone />
            <div>
              <p className="life-kicker">Hardware, IoT, smartphones</p>
              <p className="life-big">Anything with a circuit board.</p>
              <ul className="life-list">
                {gadgets.map((g) => (
                  <li key={g.name}>
                    <b>{g.name}.</b> {g.text}
                  </li>
                ))}
              </ul>
              {cams.length > 0 && (
                <p className="life-text">
                  The photos on this site carry their own receipts:{' '}
                  {cams.map(([c, n], i) => (
                    <span key={c}>
                      {i > 0 && (i === cams.length - 1 ? ' and ' : ', ')}
                      {c} ({n})
                    </span>
                  ))}
                  , read straight from the EXIF. The other {withoutExif} were exported without it.
                </p>
              )}
            </div>
          </div>

          <YapMeter />

          <div className="life-cell life-photo">
            <div className="life-stack" aria-hidden="true">
              {stack.map((p, i) => (
                <img key={p.id} src={p.srcset[0].src} alt="" loading="lazy" style={{ '--r': `${(i - 1) * 7}deg`, background: p.color }} />
              ))}
            </div>
            <div>
              <p className="life-kicker">
                <CameraIcon size={14} weight="bold" /> Photography club, SRM
              </p>
              <p className="life-big">{photos.length} frames, one prayer wheel.</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => scrollToTarget('#frames')}>
                Spin the frames <ArrowDownRightIcon size={15} weight="bold" />
              </button>
            </div>
          </div>

          <div className="life-cell life-sport">
            <PersonSimpleRunIcon size={34} weight="duotone" />
            <p className="life-kicker">Always active</p>
            <p className="life-big">Sports, and anything that isn’t sitting still.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
