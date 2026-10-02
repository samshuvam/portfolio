import { useLayoutEffect, useRef, useState } from 'react';
import { FlagIcon, PauseIcon, PlayIcon, ArrowCounterClockwiseIcon, XIcon } from '@phosphor-icons/react';
import { useNow, useWorld, formatNptClock, visitorRelative } from '../../../lib/world';
import { useT, useLang, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone, useClock, clockActions, swElapsed, timerLeft, fmtDuration, useTicker } from '../os';
import { AppShell, Seg } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

// An analogue face with Mithila numerals replaced by dots and a sun at noon.
function Face({ h, m, s }) {
  const hand = (deg, len, w, cls) => <line className={cls} x1="50" y1="50" x2="50" y2={50 - len} strokeWidth={w} strokeLinecap="round" transform={`rotate(${deg} 50 50)`} />;
  return (
    <svg viewBox="0 0 100 100" className="sos-face" aria-hidden="true">
      <circle cx="50" cy="50" r="47" className="sos-face-bg" />
      {Array.from({ length: 60 }, (_, i) => (
        <line key={i} x1="50" y1="6" x2="50" y2={i % 5 ? 8 : 11} className={i % 5 ? 'sos-face-min' : 'sos-face-hr'} transform={`rotate(${i * 6} 50 50)`} />
      ))}
      <circle cx="50" cy="17" r="2.6" className="sos-face-sun" />
      {hand((h % 12) * 30 + m * 0.5, 24, 3.2, 'sos-face-h')}
      {hand(m * 6 + s * 0.1, 34, 2.2, 'sos-face-m')}
      {hand(s * 6, 38, 1, 'sos-face-s')}
      <circle cx="50" cy="50" r="2.4" className="sos-face-pin" />
    </svg>
  );
}

function World() {
  const t = useT(dict);
  const lang = useLang();
  const now = useNow();
  const world = useWorld();
  const rel = visitorRelative(now);
  const local = now.toLocaleTimeString(lang === 'en' ? undefined : 'ne-NP', { hour: 'numeric', minute: '2-digit' });
  const abs = Math.abs(rel.diff);
  const span = t('clock.span', { h: localDigits(Math.floor(abs / 60), lang), m: localDigits(abs % 60, lang) });
  const npt = world.npt;
  return (
    <div className="sos-clock-world">
      <Face h={npt.hour} m={npt.minute} s={now.getSeconds()} />
      <div className="sos-clock-zones">
        <div className="sos-zone">
          <small>{t('clock.nepal')}</small>
          <b>{localDigits(formatNptClock(now), lang)}</b>
          <span>UTC+5:45</span>
        </div>
        <div className="sos-zone">
          <small>{t('clock.you', { city: rel.city })}</small>
          <b>{lang === 'en' ? local : localDigits(local, lang)}</b>
          <span>{rel.diff === 0 ? t('clock.same') : rel.diff > 0 ? t('clock.ahead', { span }) : t('clock.behind', { span })}</span>
        </div>
      </div>
      <div className="sos-clock-joke">
        <p className="sos-wx-k">{t('clock.why')}</p>
        <p>{t('clock.joke')}</p>
      </div>
    </div>
  );
}

function Stopwatch({ visible }) {
  const t = useT(dict);
  const lang = useLang();
  const { sw } = useClock();
  const out = useRef(null);
  const paint = () => {
    if (out.current) out.current.textContent = localDigits(fmtDuration(swElapsed(sw), true), lang);
  };
  useTicker(sw.running && visible, paint);
  useLayoutEffect(paint);
  return (
    <div className="sos-sw">
      <p className="sos-sw-num" ref={out} role="timer" aria-live="off" />
      <div className="sos-sw-btns">
        <button
          type="button"
          className="sos-round is-ghost"
          onClick={() => (sw.running ? clockActions.swLap() : clockActions.swReset())}
          disabled={!sw.running && !sw.acc}
        >
          {sw.running ? <FlagIcon size={18} weight="bold" /> : <ArrowCounterClockwiseIcon size={18} weight="bold" />}
          {sw.running ? t('clock.lap') : t('clock.reset')}
        </button>
        <button
          type="button"
          className={`sos-round ${sw.running ? 'is-stop' : 'is-go'}`}
          onClick={() => {
            sfx.tap();
            clockActions.swToggle();
          }}
        >
          {sw.running ? <PauseIcon size={18} weight="fill" /> : <PlayIcon size={18} weight="fill" />}
          {sw.running ? t('clock.stop') : t('clock.start')}
        </button>
      </div>
      {sw.laps.length > 0 && (
        <ol className="sos-laps">
          {sw.laps.map((ms, i) => (
            <li key={sw.laps.length - i}>
              <span>{t('clock.lapN', { n: localDigits(sw.laps.length - i, lang) })}</span>
              <b>{localDigits(fmtDuration(ms - (sw.laps[i + 1] || 0), true), lang)}</b>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const PRESETS = [
  { id: 'chiya', ms: 4 * 60000 },
  { id: 'momo', ms: 12 * 60000 },
  { id: 'nap', ms: 20 * 60000 },
  { id: 'test', ms: 10000 },
];

function Timer({ visible }) {
  const t = useT(dict);
  const lang = useLang();
  const { timer } = useClock();
  const out = useRef(null);
  const ring = useRef(null);
  const paint = () => {
    if (!timer.total) return;
    const left = timerLeft(timer);
    if (out.current) out.current.textContent = localDigits(fmtDuration(left + 999), lang);
    if (ring.current) ring.current.style.strokeDashoffset = String(289 * (1 - left / timer.total));
  };
  useTicker(timer.running && visible, paint);
  useLayoutEffect(paint);
  if (!timer.total)
    return (
      <div className="sos-timer">
        <p className="sos-note">{t('clock.pick')}</p>
        <div className="sos-presets">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="sos-preset" onClick={() => clockActions.timerStart(p.ms, p.id)}>
              <b>{t(`clock.p.${p.id}`)}</b>
              <small>{localDigits(fmtDuration(p.ms), lang)}</small>
            </button>
          ))}
        </div>
        <p className="sos-note">{t('clock.whistle')}</p>
      </div>
    );
  return (
    <div className="sos-timer">
      <div className="sos-timer-ring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" className="sos-timer-track" />
          <circle ref={ring} cx="50" cy="50" r="46" className="sos-timer-arc" strokeDasharray="289" />
        </svg>
        <div>
          <small>{t(`clock.p.${timer.label}`)}</small>
          <p ref={out} role="timer" />
        </div>
      </div>
      <div className="sos-sw-btns">
        <button type="button" className="sos-round is-ghost" onClick={clockActions.timerCancel}>
          <XIcon size={18} weight="bold" />
          {t('clock.cancel')}
        </button>
        <button type="button" className={`sos-round ${timer.running ? 'is-stop' : 'is-go'}`} onClick={clockActions.timerToggle}>
          {timer.running ? <PauseIcon size={18} weight="fill" /> : <PlayIcon size={18} weight="fill" />}
          {timer.running ? t('clock.pause') : t('clock.resume')}
        </button>
      </div>
    </div>
  );
}

export default function Clock() {
  const t = useT(dict);
  const ctx = usePhone();
  const [tab, setTab] = useState('world');
  return (
    <AppShell title={t('app.clock')} className="sos-clock">
      <Seg
        value={tab}
        onChange={setTab}
        label={t('app.clock')}
        options={[
          { id: 'world', label: t('clock.world') },
          { id: 'sw', label: t('clock.stopwatch') },
          { id: 'timer', label: t('clock.timer') },
        ]}
      />
      {tab === 'world' && <World />}
      {tab === 'sw' && <Stopwatch visible={ctx.visible} />}
      {tab === 'timer' && <Timer visible={ctx.visible} />}
    </AppShell>
  );
}
