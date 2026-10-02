import { memo } from 'react';
import { CloudIcon, CloudFogIcon, CloudLightningIcon, CloudRainIcon, CloudSnowIcon, CloudSunIcon, MagnifyingGlassIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useNow, useWorld } from '../../lib/world';
import { useWeather } from '../../lib/weather';
import { useT, useLang, localDigits } from '../../i18n';
import miscOverlay from '../../i18n/content/misc';
import dict from '../../i18n/ui/phone';
import { APPS, DOCK, GRID, appById } from './registry';
import { shortClock, ampm, bsLine } from './dates';

// "Probably doing" text, translated when the misc overlay has it.
export function doingLabel(world, lang) {
  if (lang === 'en') return world.doing;
  const o = miscOverlay?.[lang];
  const v = o?.[`doing.${world.doingId}`] ?? o?.doing?.[world.doingId];
  return typeof v === 'string' ? v : world.doing;
}

export function weatherIcon(kind, isDay = true) {
  if (kind === 'rain' || kind === 'drizzle') return CloudRainIcon;
  if (kind === 'storm') return CloudLightningIcon;
  if (kind === 'snow') return CloudSnowIcon;
  if (kind === 'fog') return CloudFogIcon;
  if (kind === 'cloudy') return CloudIcon;
  if (kind === 'partly') return CloudSunIcon;
  return isDay ? SunIcon : MoonIcon;
}

function Widget({ onOpen, iconRef }) {
  const now = useNow();
  const world = useWorld();
  const weather = useWeather();
  const lang = useLang();
  const t = useT(dict);
  const Wx = weatherIcon(weather?.kind, world.isDaylight);
  const doingText = doingLabel(world, lang);
  return (
    <button type="button" className="sos-widget" ref={iconRef} onClick={(e) => onOpen('weather', e.currentTarget)} onPointerEnter={() => appById('weather').preload()}>
      <span className="sos-widget-top">
        <span className="sos-widget-k">{t('w.title')}</span>
        <span className="sos-widget-wx">
          <Wx size={18} weight="fill" />
          {weather ? `${localDigits(weather.temp, lang)}°` : '--'}
        </span>
      </span>
      <span className="sos-widget-time">
        {shortClock(now, lang)}
        <small>{lang === 'en' ? ampm(now) : ''}</small>
      </span>
      <span className="sos-widget-date">{bsLine(world.bs, lang, t)}</span>
      <span className="sos-widget-doing">
        <em>{t('w.guess')}</em> {doingText}
      </span>
    </button>
  );
}

function Icon({ app, onOpen, iconRefs, badge, t }) {
  const A = app.icon;
  return (
    <li>
      <button
        type="button"
        className="sos-icon"
        ref={(el) => {
          iconRefs.current[app.id] = el;
        }}
        onClick={(e) => onOpen(app.id, e.currentTarget)}
        onPointerEnter={app.preload}
        onFocus={app.preload}
        aria-label={badge ? t('os.appBadge', { app: t(`app.${app.id}`), n: badge }) : t(`app.${app.id}`)}
      >
        <span className="sos-icon-tile" style={{ '--tint': app.tint, color: app.ink || '#fff' }}>
          <A size={30} weight="fill" />
          {badge ? <span className="sos-badge">{badge}</span> : null}
        </span>
        <span className="sos-icon-label">{t(`app.${app.id}`)}</span>
      </button>
    </li>
  );
}

function HomeInner({ onOpen, iconRefs, badges }) {
  const t = useT(dict);
  const byId = (id) => APPS.find((a) => a.id === id);
  return (
    <div className="sos-home">
      <Widget onOpen={onOpen} iconRef={(el) => (iconRefs.current.weatherWidget = el)} />
      <ul className="sos-grid" aria-label={t('os.apps')}>
        {GRID.map((id) => (
          <Icon key={id} app={byId(id)} onOpen={onOpen} iconRefs={iconRefs} badge={badges[id]} t={t} />
        ))}
      </ul>
      <button type="button" className="sos-search" onClick={(e) => onOpen('yapper', e.currentTarget)} onPointerEnter={() => appById('yapper').preload()}>
        <MagnifyingGlassIcon size={14} weight="bold" />
        {t('os.search')}
      </button>
      <ul className="sos-dock" aria-label={t('os.dock')}>
        {DOCK.map((id) => (
          <Icon key={id} app={byId(id)} onOpen={onOpen} iconRefs={iconRefs} badge={badges[id]} t={t} />
        ))}
      </ul>
    </div>
  );
}

export default memo(HomeInner);
