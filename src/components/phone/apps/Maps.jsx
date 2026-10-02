import { useEffect, useRef, useState } from 'react';
import { AirplaneTiltIcon, MapPinIcon, MountainsIcon, GraduationCapIcon, HouseLineIcon, BabyIcon } from '@phosphor-icons/react';
import { NEPAL } from '../../../data/nepal-map';
import { haversineKm, LALITPUR, JANAKPUR } from '../../../lib/astro';
import { reducedMotion } from '../../../lib/motion';
import { useT, useLang, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone } from '../os';
import { AppShell } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

// Same Mercator as the NEPAL outline (calibrated on Lalitpur and Janakpur),
// so places outside Nepal land where they should.
const [lx, ly] = NEPAL.pts.lalitpur;
const [jx] = NEPAL.pts.janakpur;
const K = (jx - lx) / (JANAKPUR.lon - LALITPUR.lon);
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const project = (lat, lon) => [lx + (lon - LALITPUR.lon) * K, ly - ((merc(lat) - merc(LALITPUR.lat)) * K * 180) / Math.PI];

const SRM = { lat: 16.4632, lon: 80.5064 };
const EVEREST = { lat: 27.9881, lon: 86.925 };
const srmTrue = project(SRM.lat, SRM.lon);
// SRM University sits far below the frame: the map breaks the scale after Nepal.
const BREAK_Y = 318;
const SRM_PT = [srmTrue[0], 392];

const PLACES = [
  { id: 'janakpur', pt: NEPAL.pts.janakpur, icon: BabyIcon, geo: JANAKPUR },
  { id: 'lalitpur', pt: NEPAL.pts.lalitpur, icon: HouseLineIcon, geo: LALITPUR },
  { id: 'everest', pt: NEPAL.pts.everest, icon: MountainsIcon, geo: EVEREST },
  { id: 'srm', pt: SRM_PT, icon: GraduationCapIcon, geo: SRM },
];

const [jkx, jky] = NEPAL.pts.janakpur;
const FLIGHT = `M${jkx} ${jky} Q ${(jkx + lx) / 2 + 40} ${(jky + ly) / 2 + 10} ${lx} ${ly}`;
const STUDY = `M${jkx} ${jky} C ${jkx - 60} ${jky + 60} ${SRM_PT[0] + 140} ${BREAK_Y - 30} ${SRM_PT[0] + 40} ${BREAK_Y} L ${SRM_PT[0]} ${SRM_PT[1]}`;

export default function Maps() {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  const [sel, setSel] = useState('janakpur');
  const path = useRef(null);
  const plane = useRef(null);

  // The plane flies JKR to Lalitpur on a loop while the phone is on screen.
  useEffect(() => {
    const p = path.current;
    const pl = plane.current;
    if (!p || !pl) return undefined;
    const len = p.getTotalLength();
    const place = (f) => {
      const a = p.getPointAtLength(f * len);
      const b = p.getPointAtLength(Math.min(len, f * len + 1));
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      pl.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${ang})`);
    };
    if (reducedMotion() || !ctx.visible) {
      place(0.55);
      return undefined;
    }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now) => {
      const f = (((now - t0) / 7000) % 1 + 1) % 1;
      place(f);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ctx.visible]);

  const cur = PLACES.find((p) => p.id === sel);
  const km = (a, b) => localDigits(Math.round(haversineKm(a, b)).toLocaleString('en'), lang);

  return (
    <AppShell title={t('app.maps')} sub={t('map.sub')} className="sos-maps" flush>
      <div className="sos-map">
        <svg viewBox="70 0 500 420" role="img" aria-label={t('map.alt')}>
          <defs>
            <pattern id="sos-map-dots" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="0.9" className="sos-map-dot" />
            </pattern>
          </defs>
          <rect x="70" y="0" width="500" height="420" fill="url(#sos-map-dots)" />
          <path d={NEPAL.d} className="sos-map-land" />
          <path d={NEPAL.d} className="sos-map-edge" />
          <path d={STUDY} className="sos-map-study" />
          <path d={FLIGHT} ref={path} className="sos-map-flight" />
          <g className="sos-map-break" aria-hidden="true">
            <path d={`M70 ${BREAK_Y + 8} q 20 -10 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0`} />
            <text x="320" y={BREAK_Y + 30}>
              {t('map.break', { km: km(JANAKPUR, SRM) })}
            </text>
          </g>
          <g ref={plane} className="sos-map-plane">
            <path d="M-1 -8 L1 -8 L1.6 -1 L8 2 L8 3.6 L1.4 2 L1 6 L3 7.6 L3 8.6 L0 8 L-3 8.6 L-3 7.6 L-1 6 L-1.4 2 L-8 3.6 L-8 2 L-1.6 -1 Z" transform="rotate(90) scale(1.3)" />
          </g>
          {PLACES.map((p) => (
            <g key={p.id} className={`sos-map-pin ${sel === p.id ? 'is-on' : ''}`} transform={`translate(${p.pt[0]} ${p.pt[1]})`}>
              {p.id === 'everest' ? <path d="M0 -9 L8 5 L-8 5 Z" /> : <circle r={sel === p.id ? 7 : 5} />}
              <text y={p.id === 'srm' ? -12 : p.id === 'everest' ? -13 : 20} textAnchor="middle">
                {t(`map.${p.id}`)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="sos-map-panel">
        <ul className="sos-map-chips" aria-label={t('map.places')}>
          {PLACES.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`sos-pill is-sm ${sel === p.id ? '' : 'is-soft'}`}
                aria-pressed={sel === p.id}
                onClick={() => {
                  setSel(p.id);
                  sfx.tap();
                }}
              >
                <p.icon size={14} weight="fill" />
                {t(`map.${p.id}`)}
              </button>
            </li>
          ))}
        </ul>
        <div className="sos-map-card" aria-live="polite">
          <h3>
            <MapPinIcon size={16} weight="fill" aria-hidden="true" /> {t(`map.${cur.id}`)}
          </h3>
          <p>{t(`map.${cur.id}.d`)}</p>
          {cur.id !== 'lalitpur' && <p className="sos-note">{t('map.from', { km: km(LALITPUR, cur.geo) })}</p>}
        </div>
        <div className="sos-map-card is-flight">
          <AirplaneTiltIcon size={18} weight="fill" aria-hidden="true" />
          <p>{t('map.flight')}</p>
        </div>
        <button type="button" className="sos-pill is-ghost sos-map-dir" onClick={() => ctx.open('messages')}>
          {t('map.directions')}
        </button>
      </div>
    </AppShell>
  );
}
