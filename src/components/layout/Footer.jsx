import { AirplaneTakeoffIcon, StampIcon } from '@phosphor-icons/react';
import { profile } from '../../data/profile';
import { waypoints } from '../../data/waypoints';
import { EGGS } from '../../lib/eggs';
import { setState, useStore } from '../../lib/store';
import { useNow, useWorld, formatNptClock24 } from '../../lib/world';
import { scrollToTarget } from '../../lib/motion';
import { useT, useLocalize, localDigits } from '../../i18n';
import dict from '../../i18n/ui/core';
import overlay from '../../i18n/content/waypoints';
import './footer.css';
import release from '../../data/release.generated.json';

export default function Footer() {
  const t = useT(dict), loc = useLocalize(overlay);
  const now = useNow();
  const world = useWorld();
  const eggs = useStore((s) => s.eggs);

  return (
    <footer className="footer" aria-label="Footer">
      <div className="wrap">
        <p className="footer-big">
          {t('footer.big')} <span className="light">{t('footer.bigLight')}</span>
        </p>
        <div className="footer-grid">
          <div>
            <p className="footer-k">{t('footer.arrival')}</p>
            <p className="footer-clock">{localDigits(formatNptClock24(now))}</p>
            <p className="footer-sub">
              {t('footer.place')} <span className="font-deva">{world.bs.np}</span>
            </p>
          </div>
          <nav aria-label="Footer">
            <p className="footer-k">{t('footer.waypoints')}</p>
            <ul className="footer-links">
              {waypoints.slice(1).map((w) => (
                <li key={w.id}>
                  <a
                    href={`#${w.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToTarget(`#${w.id}`);
                    }}
                  >
                    {loc(w).label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="footer-k">{t('footer.elsewhere')}</p>
            <ul className="footer-links">
              <li>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </li>
              {Object.values(profile.links).map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label} {l.handle}
                  </a>
                </li>
              ))}
              <li>
                <a href={profile.cv} target="_blank" rel="noopener noreferrer">
                  {t('footer.cv')}
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setState({ passport: true })}>
              <StampIcon size={18} weight="duotone" /> {t('footer.passport', { n: localDigits(eggs.length), total: localDigits(EGGS.length) })}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => scrollToTarget('#top', { duration: 2.2 })}>
              <AirplaneTakeoffIcon size={18} weight="bold" /> {t('footer.takeoff')}
            </button>
          </div>
        </div>
        <div className="footer-base">
          <p>
            {t('footer.copy', {year:localDigits(now.getFullYear())})}
          </p>
          <p>{t('footer.follows')}</p>
        </div>
        <div className="footer-release"><span>DEPLOYMENT / {release.code}</span><span>{release.npt} · {release.shortCommit}</span></div>
      </div>
    </footer>
  );
}
