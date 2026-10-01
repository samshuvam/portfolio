import { AirplaneTakeoffIcon, StampIcon } from '@phosphor-icons/react';
import { profile } from '../../data/profile';
import { waypoints } from '../../data/waypoints';
import { EGGS } from '../../lib/eggs';
import { setState, useStore } from '../../lib/store';
import { useNow, useWorld, formatNptClock24 } from '../../lib/world';
import { scrollToTarget } from '../../lib/motion';
import './footer.css';

export default function Footer() {
  const now = useNow();
  const world = useWorld();
  const eggs = useStore((s) => s.eggs);

  return (
    <footer className="footer" aria-label="Footer">
      <div className="wrap">
        <p className="footer-big">
          Thanks for flying <span className="light">with Shuvam.</span>
        </p>
        <div className="footer-grid">
          <div>
            <p className="footer-k">Local time at arrival</p>
            <p className="footer-clock">{formatNptClock24(now)}</p>
            <p className="footer-sub">
              Lalitpur, Nepal. <span className="font-deva">{world.bs.np}</span>
            </p>
          </div>
          <nav aria-label="Footer">
            <p className="footer-k">Waypoints</p>
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
                    {w.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="footer-k">Elsewhere</p>
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
                  Download CV
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setState({ passport: true })}>
              <StampIcon size={18} weight="duotone" /> Passport, {eggs.length} of {EGGS.length}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => scrollToTarget('#top', { duration: 2.2 })}>
              <AirplaneTakeoffIcon size={18} weight="bold" /> Take off again
            </button>
          </div>
        </div>
        <div className="footer-base">
          <p>
            © {now.getFullYear()} {profile.name}. Designed and built from scratch in Lalitpur.
          </p>
          <p>Theme, sky and season follow the real sun and calendar in Nepal.</p>
        </div>
      </div>
    </footer>
  );
}
