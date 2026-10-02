import { DropIcon, CloudIcon, SunHorizonIcon, WindIcon, MoonStarsIcon } from '@phosphor-icons/react';
import { useWorld, formatNptClock } from '../../../lib/world';
import { useWeather } from '../../../lib/weather';
import { useT, useLang, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { AppShell } from '../parts';
import { weatherIcon } from '../Home';
import '../apps.css';

const moonKey = (name) => `moon.${name.toLowerCase().replace(/\s+/g, '-')}`;

// The moon drawn from its real phase: a lit disc with a terminator ellipse.
function Moon({ phase, size = 84 }) {
  const r = 40;
  const k = Math.cos(2 * Math.PI * phase); // 1 new, -1 full
  const waxing = phase < 0.5;
  const rx = Math.abs(k) * r;
  // Lit half: right side when waxing (northern hemisphere view).
  const half = waxing ? `M50 10 A${r} ${r} 0 0 1 50 90` : `M50 10 A${r} ${r} 0 0 0 50 90`;
  const sweep = (waxing ? k > 0 : k < 0) ? 0 : 1;
  const lit = `${half} A${rx} ${r} 0 0 ${sweep} 50 10 Z`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="sos-moon">
      <circle cx="50" cy="50" r={r} fill="#2a2d3d" />
      <path d={lit} fill="#f1ead8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / 0.25)" />
    </svg>
  );
}

export default function Weather() {
  const t = useT(dict);
  const lang = useLang();
  const world = useWorld();
  const w = useWeather();
  const Icon = weatherIcon(w?.kind, world.isDaylight);
  const s = world.season;
  const night = !world.isDaylight;
  const d = (n) => localDigits(n, lang);
  const sunrise = world.times?.sunrise ? formatNptClock(world.times.sunrise) : null;
  const sunset = world.times?.sunset ? formatNptClock(world.times.sunset) : null;
  return (
    <AppShell title={t('wx.place')} sub={t('wx.sub')} className={`sos-weather ${night ? 'is-night' : 'is-day'} wx-${w?.kind || 'none'}`} dark>
      <div className="sos-wx-hero" aria-live="polite">
        <Icon size={64} weight="fill" aria-hidden="true" />
        {w ? (
          <>
            <p className="sos-wx-temp">{d(w.temp)}°</p>
            <p className="sos-wx-label">{t(`wx.${w.kind}`)}</p>
          </>
        ) : (
          <p className="sos-wx-label">{t('wx.loading')}</p>
        )}
      </div>
      {w && (
        <div className="sos-wx-grid">
          <div className="sos-wx-tile">
            <WindIcon size={18} weight="bold" aria-hidden="true" />
            <small>{t('wx.wind')}</small>
            <b>{t('wx.kmh', { n: d(Math.round(w.wind)) })}</b>
          </div>
          <div className="sos-wx-tile">
            <CloudIcon size={18} weight="bold" aria-hidden="true" />
            <small>{t('wx.cloud')}</small>
            <b>{d(Math.round(w.cloud * 100))}%</b>
          </div>
          {typeof w.humidity === 'number' && (
            <div className="sos-wx-tile">
              <DropIcon size={18} weight="bold" aria-hidden="true" />
              <small>{t('wx.humidity')}</small>
              <b>{d(Math.round(w.humidity))}%</b>
            </div>
          )}
          {sunrise && (
            <div className="sos-wx-tile">
              <SunHorizonIcon size={18} weight="bold" aria-hidden="true" />
              <small>{t('wx.sun')}</small>
              <b>
                {d(sunrise.replace(/\s?[AP]M/i, ''))} / {d(sunset.replace(/\s?[AP]M/i, ''))}
              </b>
            </div>
          )}
        </div>
      )}
      <div className="sos-wx-card sos-wx-season" style={{ '--sea': s.accent.night.fill }}>
        <p className="sos-wx-k">{t('wx.season')}</p>
        <h3>
          {t(`season.${s.id}`)} <span lang="ne">{s.np}</span>
        </h3>
        <p>{t(`season.${s.id}.line`)}</p>
      </div>
      <div className="sos-wx-card sos-wx-moonrow">
        <Moon phase={world.moon.phase} />
        <div>
          <p className="sos-wx-k">
            <MoonStarsIcon size={14} weight="bold" aria-hidden="true" /> {t('wx.moon')}
          </p>
          <h3>{t(moonKey(world.moon.name))}</h3>
          <p>{t('wx.lit', { n: d(Math.round(world.moon.illumination * 100)) })}</p>
          <p className="sos-note">{world.moon.elevation > 0 ? t('wx.moonUp') : t('wx.moonDown')}</p>
        </div>
      </div>
      <p className="sos-note sos-wx-foot">{t('wx.foot')}</p>
    </AppShell>
  );
}
