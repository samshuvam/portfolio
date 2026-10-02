import { useRef } from 'react';
import { AirplaneTiltIcon, CameraIcon, CloudSunIcon, CalendarBlankIcon, ChatCircleTextIcon, FlashlightIcon, LockSimpleIcon } from '@phosphor-icons/react';
import { useNow, useWorld } from '../../lib/world';
import { useWeather } from '../../lib/weather';
import { useT, useLang, localDigits } from '../../i18n';
import dict from '../../i18n/ui/phone';
import { shortClock, adLine, bsLine } from './dates';

function Clock({ aod }) {
  const now = useNow();
  const world = useWorld();
  const lang = useLang();
  const t = useT(dict);
  return (
    <div className="sos-lock-clock">
      <p className="sos-lock-date">
        {adLine(world.npt, lang, t)}
        <span>{bsLine(world.bs, lang, t)}</span>
      </p>
      <p className="sos-lock-time" aria-label={t('os.timeIn', { time: shortClock(now, lang) })}>
        {shortClock(now, lang)}
      </p>
      {!aod && <p className="sos-lock-zone">{t('os.zone')}</p>}
    </div>
  );
}

export default function Lock({ aod, torch, onUnlock, onOpen, onTorch, onWake, unlocking }) {
  const t = useT(dict);
  const lang = useLang();
  const world = useWorld();
  const weather = useWeather();
  const drag = useRef(null);
  const sheet = useRef(null);

  const next = world.festivals.upcoming.find((f) => f.id !== 'birthday') || world.festivals.upcoming[0];
  const second = weather
    ? { app: 'weather', icon: CloudSunIcon, title: t('app.weather'), body: t('lock.wx', { temp: localDigits(weather.temp, lang), label: t(`wx.${weather.kind}`) }), time: t('os.ago', { n: localDigits(12, lang) }) }
    : next
      ? { app: 'calendar', icon: CalendarBlankIcon, title: t('app.calendar'), body: next.days === 0 ? t('lock.festToday', { name: t(`fest.${next.id}`) }) : t('lock.fest', { name: t(`fest.${next.id}`), n: localDigits(next.days, lang) }), time: t('os.ago', { n: localDigits(40, lang) }) }
      : null;

  // Mouse drag anywhere lifts the lock screen; touch uses the bottom strip
  // (so a finger can still scroll the page past the phone).
  const onDown = (e) => {
    if (aod || e.pointerType !== 'mouse' || e.target.closest('button')) return;
    drag.current = { y: e.clientY, moved: false };
  };
  const onMove = (e) => {
    if (!drag.current) return;
    const dy = Math.min(0, e.clientY - drag.current.y);
    if (dy < -4) drag.current.moved = true;
    if (sheet.current) sheet.current.style.transform = `translateY(${dy * 0.6}px)`;
  };
  const onUp = (e) => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.y;
    const moved = drag.current.moved;
    drag.current = null;
    if (sheet.current) sheet.current.style.transform = '';
    if (dy < -70) onUnlock();
    else if (!moved && !e.target.closest('button')) onUnlock();
  };

  if (aod) {
    return (
      <button type="button" className="sos-lock is-aod" onClick={onWake} aria-label={t('os.wake')}>
        <Clock aod />
      </button>
    );
  }

  return (
    <div
      className={`sos-lock ${unlocking ? 'is-unlocking' : ''}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onClick={(e) => {
        // touch and keyboard: a tap on empty space unlocks too
        if (e.nativeEvent.pointerType === 'mouse' || e.target.closest('button')) return;
        onUnlock();
      }}
    >
      <div className="sos-lock-sheet" ref={sheet}>
        <span className="sos-lock-padlock" aria-hidden="true">
          <LockSimpleIcon size={18} weight="fill" />
        </span>
        <Clock />
        <div className="sos-notifs">
          <button type="button" className="sos-live" onClick={() => onOpen('flight')}>
            <span className="sos-live-top">
              <AirplaneTiltIcon size={16} weight="fill" />
              <b>{t('lock.live')}</b>
              <span className="sos-live-eta">{t('lock.eta')}</span>
            </span>
            <span className="sos-live-route">
              <span>
                JKR
                <small>{t('place.janakpur')}</small>
              </span>
              <span className="sos-live-track" aria-hidden="true">
                <i />
                <AirplaneTiltIcon size={14} weight="fill" />
              </span>
              <span className="is-right">
                ???
                <small>{t('lock.unknown')}</small>
              </span>
            </span>
          </button>
          <button type="button" className="sos-notif" onClick={() => onOpen('messages')}>
            <span className="sos-notif-icon" style={{ background: '#3a9a5c' }}>
              <ChatCircleTextIcon size={17} weight="fill" />
            </span>
            <span className="sos-notif-text">
              <b>{t('lock.n1t')}</b>
              <span>{t('lock.n1')}</span>
            </span>
            <span className="sos-notif-time">{t('os.now')}</span>
          </button>
          {second && (
            <button type="button" className="sos-notif" onClick={() => onOpen(second.app)}>
              <span className="sos-notif-icon" style={{ background: second.app === 'weather' ? '#3f86c9' : '#c8311f' }}>
                <second.icon size={17} weight="fill" />
              </span>
              <span className="sos-notif-text">
                <b>{second.title}</b>
                <span>{second.body}</span>
              </span>
              <span className="sos-notif-time">{second.time}</span>
            </button>
          )}
        </div>
      </div>
      <div className="sos-lock-foot">
        <button type="button" className={`sos-lock-q ${torch ? 'is-on' : ''}`} aria-pressed={torch} aria-label={t('cc.torch')} onClick={onTorch}>
          <FlashlightIcon size={20} weight={torch ? 'fill' : 'regular'} />
        </button>
        <button type="button" className="sos-lock-open" onClick={onUnlock}>
          {t('os.unlock')}
        </button>
        <button type="button" className="sos-lock-q" aria-label={t('app.camera')} onClick={() => onOpen('camera')}>
          <CameraIcon size={20} />
        </button>
      </div>
    </div>
  );
}
