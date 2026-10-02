import L, { useCopy } from '../../i18n/Text';
import { useLocalize, localDigits, useLang } from '../../i18n';
import overlay from '../../i18n/content/home';

import { useEffect, useRef, useState } from 'react';
import { Term } from '../ui/Term';
import Yap from '../ui/Yap';
import Sketchbook from './Sketchbook';
import NepalCabinet from './NepalCabinet';
import NepalFlag from './NepalFlag';
import { Band, MOTIFS } from './MithilaMotifs';
import { janakpurFacts, mithilaMotifs, places } from '../../data/home';
import { NEPAL } from '../../data/nepal-map';

import { useWorld, useNow, formatNptClock24, visitorRelative, toNepaliDigits, daysBetween } from '../../lib/world';
import { haversineKm } from '../../lib/astro';
import { gsap, reducedMotion } from '../../lib/motion';

import './home.css';

const GLYPHS = [
  { t: '\u{114AC}\u{114B3}', d: 'शु', s: 'shu' },
  { t: '\u{114A6}', d: 'भ', s: 'bha' },
  { t: '\u{114A7}\u{114C2}', d: 'म्', s: 'm' },
];

function NameInTirhuta() {
  const c=useCopy();
  const [hover, setHover] = useState(null);
  return (
    <div className="tirhuta-card">
      <p className="t-label"> <L text={"My name, in Tirhuta"} /> </p>
      <p className="tirhuta-name" aria-label="Shubham, written in Tirhuta script">
        {GLYPHS.map((g, i) => (
          <span key={g.s} className={hover === i ? 'is-on' : ''} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
            {g.t}
          </span>
        ))}
      </p>
      <p className="tirhuta-read" aria-live="polite">
        {hover === null ? (
          <> <L text={"Hover a letter."} /> <span className="font-deva">शुभम्</span> <L text={", Shubham, written in"} /> <Term id="tirhuta"> <L text={"Tirhuta"} /> </Term> <L text={", the script"} /> <Term id="maithili"> <L text={"Maithili"} /> </Term> <L text={"was written in for centuries."} /> </>
        ) : (
          <>
            <span className="tirhuta-big font-deva">{GLYPHS[hover].d}</span> <L text={"is read"} /> <b>{GLYPHS[hover].s}</b>
          </>
        )}
      </p>
      <p className="t-small name-companion"><Term id="kalyani">Kalyani</Term> · {c('One auspicious meaning. One very open passenger manifest.')}</p>
    </div>
  );
}

function NepalMap() {
  const c=useCopy();
  const km = Math.round(haversineKm(places.lalitpur, places.srm) / 10) * 10;
  const jkr = NEPAL.pts.janakpur;
  const ktm = NEPAL.pts.lalitpur;
  const evr = NEPAL.pts.everest;
  const arc = `M${jkr[0]} ${jkr[1]}Q${(jkr[0] + ktm[0]) / 2 + 40} ${(jkr[1] + ktm[1]) / 2 + 10} ${ktm[0]} ${ktm[1]}`;
  return (
    <figure className="nb-cell nb-map">
      <svg viewBox={`0 0 ${NEPAL.W} ${NEPAL.H + 40}`} role="img" aria-label="Map of Nepal with Janakpur, Lalitpur and Mount Everest marked">
        <path d={NEPAL.d} className="map-land" />
        <path d={arc} className="map-arc" id="jkr-ktm" />
        <path d={`M${evr[0]} ${evr[1] - 12}l8 14h-16z`} className="map-peak" />
        <text x={evr[0] + 12} y={evr[1] - 2} className="map-label"> <L text={"Sagarmatha"} /> </text>
        <circle cx={jkr[0]} cy={jkr[1]} r="7" className="map-dot accent-dot" />
        <text x={jkr[0] + 12} y={jkr[1] + 4} className="map-label strong"> <L text={"Janakpur, born here"} /> </text>
        <circle cx={ktm[0]} cy={ktm[1]} r="6" className="map-dot" />
        <text x={ktm[0] - 12} y={ktm[1] - 10} textAnchor="end" className="map-label strong"> <L text={"Lalitpur, home"} /> </text>
        <path d={`M${ktm[0]} ${NEPAL.H + 6}v26`} className="map-south" />
        <path d={`M${ktm[0] - 5} ${NEPAL.H + 26}l5 8 5-8`} className="map-south" />
        <text x={ktm[0] + 12} y={NEPAL.H + 30} className="map-label">
          SRM University, about {km.toLocaleString()} km south
        </text>
      </svg>

    </figure>
  );
}

export default function Home() {
  const c=useCopy();
  const lang=useLang();
  const root = useRef(null);
  const loc=useLocalize(overlay);
  const world = useWorld();
  const now = useNow();

  const rel = visitorRelative(now);
  const nextNY = world.festivals.upcoming.find((f) => f.id === 'new-year');
  const vivah = world.festivals.upcoming.find((f) => f.id === 'vivah-panchami');
  const vivahDate = vivah ? new Date(`${vivah.peak}T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'ne' ? 'ne-NP' : 'mai', {day:'numeric',month:'long',year:'numeric'}) : '';
  const relativeSpan = `${Math.floor(Math.abs(rel.diff)/60)}h ${Math.abs(rel.diff)%60}m`;
  const relativeText = rel.diff === 0 ? c('You are on Nepal time right now.') : c(rel.diff > 0 ? 'Nepal is {span} ahead of {city}.' : 'Nepal is {span} behind {city}.', {span: localDigits(relativeSpan),city:rel.city});

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      gsap.utils.toArray('.band').forEach((b) => {
        gsap.from(b.querySelectorAll('.m-line'), { drawSVG: '0%', duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: b, start: 'top 90%' } });
      });
      gsap.utils.toArray('.motif-card').forEach((card, i) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%' } });
        tl.from(card.querySelectorAll('.m-line'), { drawSVG: '0%', duration: 1.4, stagger: 0.06, ease: 'power1.inOut', delay: i * 0.12 });
        tl.from(card.querySelectorAll('.m-fill, .m-dot'), { autoAlpha: 0, duration: 0.6 }, '-=0.4');
      });
      gsap.from('.home-head > *', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.home-head', start: 'top 80%' } });
      gsap.from('.jfact', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.8, scrollTrigger: { trigger: '.jfacts', start: 'top 85%' } });
      gsap.from('.nb-cell', { y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.9, scrollTrigger: { trigger: '.nepal-bento', start: 'top 80%' } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="home" ref={root} className="section home" aria-labelledby="home-title">
      <Band />
      <div className="wrap">
        <header className="home-head sec-head">
          <p className="home-tirhuta font-tirhuta" aria-hidden="true">
            {'\u{11496}\u{114A2}\u{1148F}\u{114A3}\u{114B3}\u{114A9}'}
          </p>
          <h2 id="home-title" className="t-display"> <L text={"Janakpur,"} /> <span className="light"> <L text={"where Sita was born."} /> </span>
          </h2>
          <p className="t-lede"> <L text={"I was born in"} /> <Term id="janakpur"> <L text={"Janakpur Dham"} /> </Term> <L text={", down in the Terai, the old heart of"} /> <Term id="mithila"> <L text={"Mithila"} /> </Term> <L text={". The story every Janakpur kid knows: King Janak was ploughing a field when he found a baby girl in the furrow. He named her"} /> <Term id="sita"> <L text={"Sita"} /> </Term> <L text={", and the city has celebrated her ever since."} /> </p>
          <Yap> <L text={"Two things people never expect: Janakpur has Nepal’s one passenger railway, the line that runs south to Jaynagar in India, and over two hundred sacred ponds inside one city."} /> </Yap>
        </header>

        <div className="jfacts">
          {loc(janakpurFacts,'janakpurFacts').map((f) => (
            <div key={f.label} className="jfact">
              <p className="jfact-value">{f.value}</p>
              <p className="jfact-label">{f.label}</p>
              <p className="jfact-text">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="home-grid">
          <Sketchbook />
          <div className="home-side">
            <NameInTirhuta />
            <div className="vivah-card">
              <p className="t-label"> <L text={"Next in Janakpur"} /> </p>
              <p className="vivah-title">
                <Term id="vivah-panchami"> <L text={"Vivah Panchami"} /> </Term>
              </p>
              <p className="vivah-text">{vivah ? `${vivahDate}. ${vivah.days === 0 ? c('Today!') : c('In {days} days.',{days:localDigits(vivah.days)})}` : c('Every Mangsir.')} {c('Ram and Sita’s wedding, re-enacted by the whole city.')}</p>
            </div>
          </div>
        </div>

        <div className="motifs">
          <h3 className="motifs-title">
            <Term id="mithila-art"> <L text={"Mithila painting"} /> </Term> <L text={"is our visual language."} /> </h3>
          <div className="motif-grid">
            {mithilaMotifs.map(item=>loc(item)).map((m) => {
              const M = MOTIFS[m.id];
              return (
                <figure key={m.id} className="motif-card">
                  <M />
                  <figcaption>
                    <b>{m.name}</b>
                    {m.meaning}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>

        <h3 className="nepal-title"><L text="Nepal, beyond the postcard."/></h3>
        <div className="nepal-bento">
          <NepalMap />
          <div className="nb-cell nb-flag">
            <NepalFlag />
            <p>
              <b> <L text={"Not a rectangle."} /> </b> <L text={"The only national flag that isn’t. Wave it."} /> </p>
          </div>
          <div className="nb-cell nb-time">
            <p className="t-label">
              <Term id="npt"> <L text={"Nepal time"} /> </Term>
            </p>
            <p className="nb-clock">{localDigits(formatNptClock24(now))}</p>
            <p className="nb-text">{c('UTC+5:45. Yes, forty-five.')} {relativeText}</p>
          </div>
          <div className="nb-cell nb-cal">
            <p className="t-label">
              <Term id="bikram-sambat"> <L text={"Today, Bikram Sambat"} /> </Term>
            </p>
            <p className="nb-bs font-deva">{world.bs.np}</p>
            <p className="nb-text">
              {lang === 'en' ? world.bs.en : world.bs.np}. {c('Nepal is already in {year}.',{year:localDigits(world.bs.year)})} {nextNY ? c('New year {year} in {days} days.',{year:localDigits(world.bs.year+1),days:localDigits(daysBetween(world.npt.iso,nextNY.peak))}) : ''}
            </p>
          </div>
          <div className="nb-cell nb-everest">
            <p className="t-label">
              <Term id="everest"> <L text={"Sagarmatha"} /> </Term>
            </p>
            <p className="nb-height">
              8,848.86<span>m</span>
            </p>
            <p className="nb-text"> <L text={"Measured again in 2020, by Nepal and China together. The top of the world sits on Nepal’s northern border."} /> </p>
          </div>
        </div>
      </div>
      <div className="wrap"><NepalCabinet/></div>
      <Band className="band-bottom" />
    </section>
  );
}
