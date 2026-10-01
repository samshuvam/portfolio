import { useEffect, useRef, useState } from 'react';
import { PlayIcon, YoutubeLogoIcon } from '@phosphor-icons/react';
import { Term } from '../ui/Term';
import { nowLog, nowUpdated, videos, youtubeId } from '../../data/misc';
import { useWorld, useNow, formatNptClock, visitorRelative } from '../../lib/world';
import { gsap, reducedMotion } from '../../lib/motion';
import { sound } from '../../lib/sound';
import './now.css';

const FEST_TERMS = { dashain: 'dashain', tihar: 'tihar', chhath: 'chhath', 'vivah-panchami': 'vivah-panchami' };

function Countdown({ f }) {
  const date = new Date(`${f.peak}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <li className={`fest ${f.days === 0 ? 'is-today' : ''}`}>
      <p className="fest-days">
        {f.days === 0 ? 'Today' : f.days}
        {f.days > 0 && <span>{f.days === 1 ? 'day' : 'days'}</span>}
      </p>
      <p className="fest-name">
        <span className="font-deva">{f.np}</span> {FEST_TERMS[f.id] ? <Term id={FEST_TERMS[f.id]}>{f.name}</Term> : f.name}
      </p>
      <p className="fest-meta t-mono">
        {f.peakLabel}, {date}
      </p>
      <p className="fest-blurb">{f.blurb}</p>
    </li>
  );
}

function Theatre() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const v = videos[active];
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
            <span className="ife-now t-mono">Now showing on SS2504</span>
          </button>
        )}
      </div>
      <ul className="ife-list" aria-label="Playlist">
        {videos.map((x, i) => (
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
  const root = useRef(null);
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
          <h2 id="now-title" className="t-display">
            Right <span className="light">now.</span>
          </h2>
        </header>

        <div className="now-grid">
          <div className="now-card now-live">
            <p className="now-label">In Lalitpur it is</p>
            <p className="now-clock">{formatNptClock(now)}</p>
            <p className="now-doing">
              <span className="now-guess">Best guess</span> {world.doing}.
            </p>
            <p className="now-rel">{rel.text}</p>
          </div>
          {nowLog.map((n) => (
            <div key={n.label} className="now-card">
              <p className="now-label">{n.label}</p>
              <p className="now-text">{n.text}</p>
            </div>
          ))}
        </div>
        <p className="now-updated t-mono">Notes last updated {nowUpdated}.</p>

        <h3 className="now-sub">Counting down, the Nepali way.</h3>
        <ul className="fests">
          {upcoming.map((f) => (
            <Countdown key={f.id} f={f} />
          ))}
        </ul>

        <h3 className="now-sub">Now showing.</h3>
        <Theatre />
      </div>
    </section>
  );
}
