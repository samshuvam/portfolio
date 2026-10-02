import { useEffect, useRef, useState } from 'react';
import { BellSimpleIcon, BellSimpleSlashIcon, CheckIcon, LightningIcon, MusicNotesIcon, PhoneCallIcon, ScanSmileyIcon, TimerIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { useNow, useWorld } from '../../lib/world';
import { useT, useLang, localDigits } from '../../i18n';
import dict from '../../i18n/ui/phone';
import { shortClock } from './dates';
import { useClock, swElapsed, timerLeft, fmtDuration } from './os';
import { onVolume, getVolume } from './audio';

// ---- battery: mirrors the visitor's real battery when the browser shares
// it, otherwise drains with the Nepal clock (like a real day out).
export function useBattery() {
  const world = useWorld();
  const [real, setReal] = useState(null);
  useEffect(() => {
    let bat = null;
    let alive = true;
    const upd = () => alive && bat && setReal({ level: bat.level, charging: bat.charging });
    if (navigator.getBattery) {
      navigator
        .getBattery()
        .then((b) => {
          bat = b;
          upd();
          b.addEventListener('levelchange', upd);
          b.addEventListener('chargingchange', upd);
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
      if (bat) {
        bat.removeEventListener('levelchange', upd);
        bat.removeEventListener('chargingchange', upd);
      }
    };
  }, []);
  if (real) return { ...real, real: true };
  const h = world.npt.hour + world.npt.minute / 60;
  const awake = (h - 7 + 24) % 24;
  return { level: Math.max(0.18, 1 - awake * 0.045), charging: h >= 1 && h < 7, real: false };
}

export function Battery({ level, charging }) {
  const pct = Math.round(level * 100);
  return (
    <span className={`sos-bat ${pct <= 20 ? 'is-low' : ''} ${charging ? 'is-charging' : ''}`} aria-hidden="true">
      <span className="sos-bat-body">
        <span className="sos-bat-fill" style={{ width: `${pct}%` }} />
        <span className="sos-bat-num">{pct}</span>
      </span>
      <span className="sos-bat-cap" />
    </span>
  );
}

function Signal() {
  return (
    <span className="sos-signal" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <i key={i} style={{ height: `${4 + i * 2.4}px` }} />
      ))}
    </span>
  );
}

export function StatusBar({ onControl, locked }) {
  const now = useNow();
  const lang = useLang();
  const t = useT(dict);
  const bat = useBattery();
  const pct = Math.round(bat.level * 100);
  return (
    <div className="sos-status">
      <span className="sos-status-left">{locked ? <span className="sos-carrier">SUV-1478</span> : <span className="sos-time">{shortClock(now, lang)}</span>}</span>
      <button
        type="button"
        className="sos-status-right"
        aria-label={`${t('os.control')}. ${t('os.battery', { n: localDigits(pct, lang) })}${bat.charging ? `, ${t('os.charging')}` : ''}`}
        onClick={onControl}
      >
        <Signal />
        <span className="sos-net">5G</span>
        <Battery level={bat.level} charging={bat.charging} />
      </button>
    </div>
  );
}

// ---- dynamic island -------------------------------------------------------
function IslandTicker({ kind }) {
  const clock = useClock();
  const lang = useLang();
  const [, force] = useState(0);
  const running = kind === 'stopwatch' ? clock.sw.running : clock.timer.running;
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => force((n) => n + 1), kind === 'stopwatch' ? 100 : 500);
    return () => clearInterval(id);
  }, [running, kind]);
  const ms = kind === 'stopwatch' ? swElapsed(clock.sw) : timerLeft(clock.timer);
  return <span className="sos-isl-num">{localDigits(fmtDuration(kind === 'timer' ? ms + 999 : ms), lang)}</span>;
}

export function Island({ activity, onOpen }) {
  const t = useT(dict);
  const kind = activity?.kind || null;
  let left = null;
  let right = null;
  let size = kind ? 'wide' : '';
  let say = '';
  if (kind === 'faceid') {
    size = 'square';
    left = (
      <span className={`sos-isl-face ${activity.done ? 'is-done' : ''}`}>
        {activity.done ? <CheckIcon size={30} weight="bold" /> : <ScanSmileyIcon size={34} weight="light" />}
      </span>
    );
  } else if (kind === 'silent') {
    left = activity.on ? <BellSimpleSlashIcon size={16} weight="fill" className="is-red" /> : <BellSimpleIcon size={16} weight="fill" />;
    say = activity.on ? t('isl.silentOn') : t('isl.silentOff');
    right = <span>{say}</span>;
  } else if (kind === 'sending') {
    left = <span className="sos-isl-spin" />;
    say = t('isl.sending');
    right = <span>{say}</span>;
  } else if (kind === 'sent') {
    left = <CheckIcon size={16} weight="bold" className="is-green" />;
    say = t('isl.sent');
    right = <span>{say}</span>;
  } else if (kind === 'failed') {
    left = <WarningIcon size={16} weight="fill" className="is-red" />;
    say = t('isl.failed');
    right = <span>{say}</span>;
  } else if (kind === 'stopwatch' || kind === 'timer') {
    left = <TimerIcon size={16} weight="bold" className="is-accent" />;
    right = <IslandTicker kind={kind} />;
  } else if (kind === 'music') {
    left = <MusicNotesIcon size={16} weight="fill" className="is-accent" />;
    right = (
      <span className="sos-isl-eq" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  } else if (kind === 'call') {
    left = <PhoneCallIcon size={16} weight="fill" className="is-green" />;
    say = activity.label || t('isl.call');
    right = <span>{say}</span>;
  } else if (kind === 'charging') {
    left = <LightningIcon size={16} weight="fill" className="is-green" />;
    right = <span>{t('os.charging')}</span>;
  } else if (kind === 'notice') {
    left = activity.icon || null;
    say = activity.text;
    right = <span>{say}</span>;
  }
  const label = kind === 'faceid' ? t('os.faceid') : say;
  const actionable = !!(activity?.app && onOpen);
  const Tag = actionable ? 'button' : 'div';
  return (
    <>
      <Tag
        type={actionable ? 'button' : undefined}
        className={`sos-island ${size ? `is-${size}` : ''}`}
        onClick={actionable ? () => onOpen(activity.app) : undefined}
        aria-label={actionable ? t('os.openApp', { app: t(`app.${activity.app}`) }) : undefined}
        aria-hidden={actionable ? undefined : 'true'}
      >
        <span className="sos-isl-cam" />
        {kind && (
          <span className="sos-isl-in" key={kind}>
            <span className="sos-isl-l">{left}</span>
            {right && <span className="sos-isl-r">{right}</span>}
          </span>
        )}
      </Tag>
      <span className="sr-only" role="status" aria-live="polite">
        {label}
      </span>
    </>
  );
}

// ---- volume HUD -------------------------------------------------------------
export function VolumeHud() {
  const [v, setV] = useState(getVolume());
  const [show, setShow] = useState(false);
  useEffect(() => {
    let tm = 0;
    const off = onVolume((nv) => {
      setV(nv);
      setShow(true);
      clearTimeout(tm);
      tm = setTimeout(() => setShow(false), 1300);
    });
    return () => {
      off();
      clearTimeout(tm);
    };
  }, []);
  return (
    <div className={`sos-vol ${show ? 'is-on' : ''}`} aria-hidden="true">
      <span style={{ height: `${v * 100}%` }} />
    </div>
  );
}

// ---- banner notification ----------------------------------------------------
export function Banner({ banner, onOpen, onClose, appIcon }) {
  const t = useT(dict);
  if (!banner) return null;
  const Icon = appIcon?.icon;
  return (
    <div className="sos-banner" key={banner.key} role="status">
      <button type="button" className="sos-banner-main" onClick={() => onOpen(banner.app)}>
        {Icon && (
          <span className="sos-banner-icon" style={{ background: appIcon.tint, color: appIcon.ink || '#fff' }}>
            <Icon size={18} weight="fill" />
          </span>
        )}
        <span className="sos-banner-text">
          <b>{banner.title}</b>
          <span>{banner.body}</span>
        </span>
        <span className="sos-banner-time">{t('os.now')}</span>
      </button>
      <button type="button" className="sos-banner-x" aria-label={t('os.dismiss')} onClick={onClose}>
        <XIcon size={12} weight="bold" />
      </button>
    </div>
  );
}

// ---- home indicator: click or swipe up to go home ----------------------------
export function HomeIndicator({ onHome, onDrag, label, tone }) {
  const start = useRef(null);
  const moved = useRef(false);
  return (
    <button
      type="button"
      className={`sos-homebar ${tone === 'light' ? 'is-dark' : ''}`}
      aria-label={label}
      onPointerDown={(e) => {
        start.current = e.clientY;
        moved.current = false;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current === null) return;
        const dy = e.clientY - start.current;
        if (Math.abs(dy) > 6) moved.current = true;
        onDrag?.(Math.min(0, dy));
      }}
      onPointerUp={(e) => {
        if (start.current === null) return;
        const dy = e.clientY - start.current;
        start.current = null;
        onDrag?.(0, true);
        if (dy < -40) onHome();
      }}
      onPointerCancel={() => {
        start.current = null;
        onDrag?.(0, true);
      }}
      onClick={() => {
        if (!moved.current) onHome();
        moved.current = false;
      }}
    >
      <span />
    </button>
  );
}
