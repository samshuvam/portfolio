import L, { useCopy } from '../../i18n/Text';
import { useLocalize, localDigits } from '../../i18n';
import overlay from '../../i18n/content/misc';
import festivalOverlay from '../../i18n/content/festivals';
import { useEffect, useRef, useState } from 'react';
import { PlayIcon, YoutubeLogoIcon } from '@phosphor-icons/react';
import { Term } from '../ui/Term';
import { nowLog, nowUpdated, videos, youtubeId } from '../../data/misc';
import { useWorld, useNow, formatNptClock, visitorRelative } from '../../lib/world';
import { gsap, reducedMotion } from '../../lib/motion';
import { sound } from '../../lib/sound';
import './now.css';

const FEST_TERMS = { dashain: 'dashain', tihar: 'tihar', chhath: 'chhath', 'vivah-panchami': 'vivah-panchami' };

function Countdown({ f: original }) {
  const c=useCopy();
  const loc=useLocalize(festivalOverlay);
  const f={...loc(original)};
  if(f.id==='birthday') f.peakLabel=f.peakLabel.replace('{n}',localDigits(Number(f.peak.slice(0,4))-2003));
  const date = new Date(`${f.peak}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <li className={`fest ${f.days === 0 ? 'is-today' : ''}`}>
      <p className="fest-days">
        {f.days === 0 ? c('Today') : localDigits(f.days)}
        {f.days > 0 && <span>{c(f.days === 1 ? 'day' : 'days')}</span>}
      </p>
      <p className="fest-name">
        <span className="font-deva">{f.np}</span> {FEST_TERMS[f.id] ? <Term id={FEST_TERMS[f.id]}>{f.name}</Term> : f.name}
      </p>
      <p className="fest-meta t-mono">
        {f.peakLabel}, {localDigits(date)}
      </p>
      <p className="fest-blurb">{f.blurb}</p>
    </li>
  );
}

function Theatre() {
  const c=useCopy();
  const loc=useLocalize(overlay);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const v = loc(videos[active]);
  const id = youtubeId(v.url);
  return (
    <div id="watch" className="ife">
      <div className="ife-screen">
        {playing && id ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <button
            type="button"
            className="ife-poster"
            onClick={() => {
              sound.click();
              setPlaying(true);
            }}
            aria-label={`Play ${v.title}`}
          >
            {id && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />}
            <span className="ife-play">
              <PlayIcon size={28} weight="fill" />
            </span>
            <span className="ife-now t-mono"> <L text={"Now showing on SUV-1478"} /> </span>
          </button>
        )}
      </div>
      <ul className="ife-list" aria-label="Playlist">
        {videos.map(x=>loc(x)).map((x, i) => (
          <li key={x.id}>
            <button
              type="button"
              aria-current={i === active ? 'true' : undefined}
              onClick={() => {
                setActive(i);
                setPlaying(false);
              }}
            >
              <span className="ife-title">{x.title}</span>
              <span className="ife-desc">{x.description}</span>
              <span className="ife-tag t-mono">
                <YoutubeLogoIcon size={13} weight="fill" /> {x.length}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Now() {
  const c=useCopy();
  const root = useRef(null);
  const loc=useLocalize(overlay);
  const world = useWorld();
  const now = useNow();
  const rel = visitorRelative(now);
  const upcoming = world.festivals.upcoming.slice(0, 4);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      gsap.from('.fest', { y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.8, scrollTrigger: { trigger: '.fests', start: 'top 85%' } });
      gsap.from('.now-card', { y: 40, autoAlpha: 0, stagger: 0.1, duration: 0.8, scrollTrigger: { trigger: '.now-grid', start: 'top 85%' } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="now" ref={root} className="section now" aria-labelledby="now-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="now-title" className="t-display"> <L text={"Right"} /> <span className="light"> <L text={"now."} /> </span>
          </h2>
        </header>

        <div className="now-grid">
          <div className="now-card now-live">
            <p className="now-label"> <L text={"In Lalitpur it is"} /> </p>
            <p className="now-clock">{localDigits(formatNptClock(now))}</p>
            <p className="now-doing">
              <span className="now-guess"> <L text={"Best guess"} /> </span> {loc(world.doing,'doing.'+world.doingId)}.
            </p>
            <p className="now-rel">{rel.text}</p>
          </div>
          {loc(nowLog,'nowLog').map((n) => (
            <div key={n.label} className="now-card">
              <p className="now-label">{n.label}</p>
              <p className="now-text">{n.text}</p>
            </div>
          ))}
        </div>
        <p className="now-updated t-mono">{c('Notes last updated {date}.',{date:loc(nowUpdated,'nowUpdated')})}</p>

        <h3 className="now-sub"> <L text={"Counting down, the Nepali way."} /> </h3>
        <ul className="fests">
          {upcoming.map((f) => (
            <Countdown key={f.id} f={f} />
          ))}
        </ul>

        <h3 className="now-sub"> <L text={"Now showing."} /> </h3>
        <Theatre />
      </div>
    </section>
  );
}
