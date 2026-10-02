import { useEffect, useState } from 'react';
import { AirplaneLandingIcon, AirplaneTakeoffIcon, AirplaneTiltIcon } from '@phosphor-icons/react';
import { scrollState } from '../../../lib/motion';
import { useT, useLang, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone } from '../os';
import { AppShell, Group, Row } from '../parts';
import '../apps.css';

// Flight SS2504, the story of the site, as a live activity. Its progress is
// how far down the page the visitor has scrolled.
export default function Flight() {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  const [p, setP] = useState(() => scrollState.progress || 0);
  useEffect(() => {
    if (!ctx.visible) return undefined;
    const id = setInterval(() => setP(scrollState.progress || 0), 1000);
    return () => clearInterval(id);
  }, [ctx.visible]);
  const pct = Math.round(Math.min(1, Math.max(0, p)) * 100);
  const d = (n) => localDigits(n, lang);
  return (
    <AppShell title={t('fl.title')} sub={t('fl.sub')} className="sos-flight">
      <div className="sos-fl-card">
        <div className="sos-fl-route">
          <div>
            <b>JKR</b>
            <small>{t('place.janakpur')}</small>
          </div>
          <AirplaneTiltIcon size={22} weight="fill" aria-hidden="true" />
          <div className="is-right">
            <b>???</b>
            <small>{t('lock.unknown')}</small>
          </div>
        </div>
        <div className="sos-fl-bar" role="progressbar" aria-label={t('fl.progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span style={{ width: `${pct}%` }} />
          <i style={{ left: `${pct}%` }} aria-hidden="true">
            <AirplaneTiltIcon size={16} weight="fill" />
          </i>
        </div>
        <p className="sos-fl-status">{pct >= 96 ? t('fl.landing') : t('fl.cruise', { n: d(pct) })}</p>
      </div>
      <Group title={t('fl.dep')}>
        <Row icon={<AirplaneTakeoffIcon size={16} weight="fill" />} label={t('fl.jkr')} sub="IATA JKR · ICAO VNJP" />
        <Row label={t('fl.rwy')} end={`09/27, ${d('1,300')} × ${d(30)} m`} />
        <Row label={t('fl.elev')} end={`${d(78)} m / ${d(256)} ft`} />
      </Group>
      <Group title={t('fl.arr')}>
        <Row icon={<AirplaneLandingIcon size={16} weight="fill" />} label={t('fl.dest')} sub={t('fl.destSub')} />
        <Row label={t('fl.parked')} end="Kalyani" />
      </Group>
      <p className="sos-note">{t('fl.note')}</p>
    </AppShell>
  );
}
