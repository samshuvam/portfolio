import { useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, SpeakerSlashIcon, WaveformIcon } from '@phosphor-icons/react';
import { useStore, setState } from '../../../lib/store';
import { reducedMotion } from '../../../lib/motion';
import { useT, useLang, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone, fmtDuration } from '../os';
import { AppShell } from '../parts';
import { phoneAudio, phoneOut } from '../audio';
import { TRACKS, createEngine } from './music-engine';
import '../apps.css';

// Album art, drawn in code: each track gets a small Mithila-flavoured motif.
function Art({ id, hue, spin }) {
  return (
    <svg viewBox="0 0 200 200" className={`sos-art ${spin ? 'is-spin' : ''}`} aria-hidden="true">
      <rect width="200" height="200" rx="26" fill={hue} />
      <rect x="10" y="10" width="180" height="180" rx="18" fill="none" stroke="#f3e3c3" strokeWidth="2" />
      <rect x="17" y="17" width="166" height="166" rx="13" fill="none" stroke="#f3e3c3" strokeWidth="1" strokeDasharray="3 4" />
      {id === 'dusk' && (
        <g>
          <circle cx="100" cy="112" r="40" fill="#eaa42a" stroke="#f3e3c3" strokeWidth="3" />
          <path d="M30 130 H170 V170 H30 Z" fill="#1e2453" />
          <path d="M70 130 V96 L100 70 L130 96 V130 Z" fill="#f3e3c3" stroke="#1e2453" strokeWidth="2" />
          <path d="M92 130 v-16 a8 8 0 0 1 16 0 v16" fill="#1e2453" />
          <path d="M100 70 V56" stroke="#f3e3c3" strokeWidth="2" />
          {[40, 60, 140, 160].map((x) => (
            <path key={x} d={`M${x} 150 q6 -8 12 0`} stroke="#f3e3c3" strokeWidth="1.5" fill="none" />
          ))}
        </g>
      )}
      {id === 'kites' && (
        <g stroke="#1e2453" strokeWidth="2.5">
          <path d="M70 40 L100 70 L70 100 L40 70 Z" fill="#d6452b" />
          <path d="M140 70 L160 90 L140 110 L120 90 Z" fill="#3e8a4a" />
          <path d="M70 100 C80 140 120 130 110 170" fill="none" strokeWidth="1.5" />
          <path d="M140 110 C150 140 130 150 140 175" fill="none" strokeWidth="1.5" />
          <path d="M40 70 L100 70 M70 40 L70 100" strokeWidth="1.2" />
        </g>
      )}
      {id === 'monsoon' && (
        <g>
          <path d="M40 120 L100 80 L160 120 Z" fill="#9aa3ad" stroke="#f3e3c3" strokeWidth="2.5" />
          {[52, 70, 88, 106, 124, 142].map((x) => (
            <path key={x} d={`M${x} ${120 - Math.abs(100 - x) * 0.66 + 12} v-6`} stroke="#1e2453" strokeWidth="1.5" />
          ))}
          <rect x="55" y="120" width="90" height="45" fill="#f3e3c3" />
          <rect x="88" y="135" width="24" height="30" fill="#1e2453" />
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M${20 + i * 13} ${30 + (i % 3) * 14} l-6 16`} stroke="#f3e3c3" strokeWidth="2" strokeLinecap="round" />
          ))}
        </g>
      )}
      {id === 'chhath' && (
        <g>
          <path d="M20 120 H180" stroke="#f3e3c3" strokeWidth="2" />
          <circle cx="100" cy="120" r="38" fill="#d6452b" stroke="#f3e3c3" strokeWidth="3" />
          <rect x="20" y="120" width="160" height="60" fill="#1e2453" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${60 + i * 8} ${138 + i * 12} H${140 - i * 8}`} stroke="#eaa42a" strokeWidth="3" strokeLinecap="round" />
          ))}
          <path d="M84 80 q16 -18 32 0 q-16 10 -32 0 Z" fill="#eaa42a" stroke="#f3e3c3" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

export default function Music() {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  const soundOn = useStore((s) => s.sound);
  const engine = useRef(null);
  const canvas = useRef(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const track = TRACKS[idx];

  const ensure = () => {
    if (engine.current) return engine.current;
    const ac = phoneAudio();
    if (!ac) return null;
    engine.current = createEngine(ac, phoneOut());
    return engine.current;
  };

  const play = (i = idx, from = 0) => {
    const e = ensure();
    if (!e) return;
    e.play(TRACKS[i].id, from);
    setIdx(i);
    setPlaying(true);
  };
  const pause = () => {
    engine.current?.pause();
    setPlaying(false);
  };
  const toggle = () => (playing ? pause() : play(idx, engine.current?.track === track.id ? engine.current.position() : 0));
  const skip = (d) => {
    const i = (idx + d + TRACKS.length) % TRACKS.length;
    setPos(0);
    if (playing) play(i, 0);
    else {
      setIdx(i);
      if (engine.current) engine.current.pause(true);
    }
  };

  // Stop when the phone scrolls away, the tab hides or sound is switched off.
  useEffect(() => {
    if ((!ctx.visible || !soundOn) && playing) pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.visible, soundOn]);

  // ...and when the app closes.
  useEffect(
    () => () => {
      engine.current?.dispose();
      engine.current = null;
      ctx.setLive('music', false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    ctx.setLive('music', playing);
  }, [playing, ctx]);

  // Progress, and the next track when this one ends.
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      const e = engine.current;
      if (!e) return;
      const p = e.position();
      if (p >= track.length) {
        play((idx + 1) % TRACKS.length, 0);
        setPos(0);
      } else setPos(p);
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, idx]);

  // Visualiser: the analyser drawn as a ring of petals (a lotus that sings).
  useEffect(() => {
    const cv = canvas.current;
    if (!cv || !playing || !ctx.visible) return undefined;
    const e = engine.current;
    if (!e) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext('2d');
    const data = new Uint8Array(e.analyser.frequencyBinCount);
    const color = getComputedStyle(cv).color;
    let raf = 0;
    const still = reducedMotion();
    const draw = () => {
      e.analyser.getByteFrequencyData(data);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = color;
      const n = 32;
      const bw = W / n;
      for (let i = 0; i < n; i++) {
        const v = data[Math.floor((i / n) * data.length * 0.7)] / 255;
        const h = Math.max(2, v * H * 0.95);
        g.globalAlpha = 0.35 + v * 0.65;
        const x = i * bw + bw * 0.2;
        const w = bw * 0.6;
        const r = Math.min(w / 2, 4);
        g.beginPath();
        g.roundRect(x, (H - h) / 2, w, h, r);
        g.fill();
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    draw();
    const slow = still ? setInterval(draw, 500) : 0;
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(slow);
    };
  }, [playing, ctx.visible, idx]);

  const fmt = (s) => localDigits(fmtDuration(s * 1000), lang);

  return (
    <AppShell title={t('app.music')} sub={t('mus.sub')} className="sos-music" dark>
      <div className="sos-mus-now">
        <Art id={track.id} hue={track.hue} spin={playing} />
        <div className="sos-mus-meta">
          <h3>{t(`mus.${track.id}`)}</h3>
          <p>{t(`mus.${track.id}.d`)}</p>
        </div>
        <canvas ref={canvas} className="sos-mus-viz" aria-hidden="true" />
        <div className="sos-mus-bar">
          <div
            className="sos-mus-track"
            role="progressbar"
            aria-label={t('mus.progress')}
            aria-valuemin={0}
            aria-valuemax={track.length}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={`${fmt(pos)} / ${fmt(track.length)}`}
          >
            <span style={{ width: `${(pos / track.length) * 100}%` }} />
          </div>
          <div className="sos-mus-times">
            <span>{fmt(pos)}</span>
            <span>-{fmt(Math.max(0, track.length - pos))}</span>
          </div>
        </div>
        {soundOn ? (
          <div className="sos-mus-ctrl">
            <button type="button" className="sos-mus-btn" aria-label={t('mus.prev')} onClick={() => skip(-1)}>
              <SkipBackIcon size={26} weight="fill" />
            </button>
            <button type="button" className="sos-mus-btn is-main" aria-label={playing ? t('mus.pause') : t('mus.play')} onClick={toggle}>
              {playing ? <PauseIcon size={30} weight="fill" /> : <PlayIcon size={30} weight="fill" />}
            </button>
            <button type="button" className="sos-mus-btn" aria-label={t('mus.next')} onClick={() => skip(1)}>
              <SkipForwardIcon size={26} weight="fill" />
            </button>
          </div>
        ) : (
          <div className="sos-mus-off">
            <SpeakerSlashIcon size={20} weight="fill" aria-hidden="true" />
            <span>{t('mus.soundOff')}</span>
            <button type="button" className="sos-pill is-sm" onClick={() => setState({ sound: true })}>
              {t('mus.turnOn')}
            </button>
          </div>
        )}
      </div>
      <ol className="sos-mus-list" aria-label={t('mus.queue')}>
        {TRACKS.map((tr, i) => (
          <li key={tr.id}>
            <button
              type="button"
              className={`sos-mus-item ${i === idx ? 'is-on' : ''}`}
              aria-current={i === idx ? 'true' : undefined}
              onClick={() => {
                setPos(0);
                if (soundOn) play(i, 0);
                else setIdx(i);
              }}
            >
              <span className="sos-mus-dot" style={{ background: tr.hue }}>
                {i === idx && playing ? <WaveformIcon size={14} weight="bold" /> : localDigits(i + 1, lang)}
              </span>
              <span className="sos-mus-item-text">
                <b>{t(`mus.${tr.id}`)}</b>
                <small>{t(`mus.${tr.id}.m`)}</small>
              </span>
              <span className="sos-mus-len">{fmt(tr.length)}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="sos-note sos-mus-note">{t('mus.note')}</p>
    </AppShell>
  );
}
