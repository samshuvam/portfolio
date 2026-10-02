import L, { useCopy } from '../../i18n/Text';
import { useLocalize, localDigits } from '../../i18n';
import overlay from '../../i18n/content/life';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownRightIcon, CameraIcon, PersonSimpleRunIcon } from '@phosphor-icons/react';
import Thali from './Thali';
import DepartureBoard from './DepartureBoard';
import ExplodedPhone from './ExplodedPhone';
import { Term } from '../ui/Term';
import { gadgets } from '../../data/life';
import { photos } from '../../lib/photos';
import { contextImage } from '../../lib/imagery';
import { setState, useStore } from '../../lib/store';
import { findEgg } from '../../lib/eggs';
import { gsap, reducedMotion, scrollToTarget } from '../../lib/motion';
import './life.css';

function YapMeter() {
  const c=useCopy();
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
      <p className="life-kicker"> <L text={"Professional yapper"} /> </p>
      <p className="life-big">{yap ? c("Yap mode is on.") : c("Give me any topic and twenty minutes.")}</p>
      <p className="life-text"> <L text={"Kanya is ruled by"} /> <Term id="budh"> <L text={"Budh"} /> </Term>{c(', the planet of speech. Explains a lot. Yap mode adds {words} words of commentary to this page, {percent}% more Shuvam.', {words: localDigits(counts.extra.toLocaleString()), percent: localDigits(pct)})}
      </p>
      <button
        type="button"
        className={`btn btn-sm ${yap ? 'btn-ghost' : 'btn-accent'}`}
        onClick={() => {
          setState({ yap: !yap });
          if (!yap) findEgg('yap');
        }}
      >
        {yap ? c("Back to TL;DR") : c("Let me yap")}
      </button>
    </div>
  );
}

export default function Life() {
  const c=useCopy();
  const root = useRef(null);
  const loc=useLocalize(overlay);
  const spotted = contextImage('window');
  const stack = ['janaki','panchthar','lumbini'].map(contextImage);

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
          <h2 id="life-title" className="t-display"> <L text={"Off"} /> <span className="light"> <L text={"the clock."} /> </span>
          </h2>
          <p className="t-lede"> <L text={"Food, gadgets, aircraft, and talking about all three. Always moving, rarely quiet."} /> </p>
        </header>

        <div className="life-bento">
          <div className="life-cell life-food">
            <p className="life-kicker"> <L text={"Big-time foodie, happy cook"} /> </p>
            <Thali />
          </div>

          <div className="life-cell life-air">
            <div className="life-air-top">
              <div>
                <p className="life-kicker"> <L text={"Aviation, always"} /> </p>
                <p className="life-big"> <L text={"Plane spotter. Will look up mid-sentence."} /> </p>
              </div>
              {spotted && (
                <figure className="life-spotted">
                  <img src={spotted.src} alt="An illustrated window-seat view over the Himalaya" loading="lazy" />
                  <figcaption>{c('Always the window seat.')}</figcaption>
                </figure>
              )}
            </div>
            <DepartureBoard />
          </div>

          <div className="life-cell life-gadgets">
            <ExplodedPhone />
            <div>
              <p className="life-kicker"> <L text={"Hardware, IoT, smartphones"} /> </p>
              <p className="life-big"> <L text={"Anything with a circuit board."} /> </p>
              <ul className="life-list">
                {loc(gadgets,'gadgets').map((g) => (
                  <li key={g.name}>
                    <b>{g.name}.</b> {g.text}
                  </li>
                ))}
              </ul>
              <p className="life-text">{c('Favourite colour: green. Even my side quests eventually find their way back to it.')}</p>
            </div>
          </div>

          <YapMeter />

          <div className="life-cell life-photo">
            <div className="life-stack" aria-hidden="true">
              {stack.map((p, i) => (
                <img key={p.id} src={p.src} alt="" loading="lazy" style={{ '--r': `${(i - 1) * 7}deg` }} />
              ))}
            </div>
            <div>
              <p className="life-kicker">
                <CameraIcon size={14} weight="bold" /> <L text={"Photography club, SRM"} /> </p>
              <p className="life-big">{c('{count} frames, one prayer wheel.', {count: localDigits(photos.length)})}</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => scrollToTarget('#frames')}> <L text={"Spin the frames"} /> <ArrowDownRightIcon size={15} weight="bold" />
              </button>
            </div>
          </div>

          <div className="life-cell life-sport">
            <PersonSimpleRunIcon size={34} weight="duotone" />
            <p className="life-kicker"> <L text={"Always active"} /> </p>
            <p className="life-big"> <L text={"Sports, and anything that isn’t sitting still."} /> </p>
          </div>
        </div>
      </div>
    </section>
  );
}
