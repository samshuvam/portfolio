import { useEffect } from 'react';
import ThemeSync from '../../components/ThemeSync';
import Toasts from '../../components/layout/Toasts';
import Finale from '../../components/finale/Finale';
import { useStore, setState } from '../../lib/store';
import { setLang, LANGS } from '../../i18n';
import { startSmoothScroll } from '../../lib/motion';

// Dev preview: http://localhost:3000/?lab=finale
// Time travel works too: ?lab=finale&at=2026-11-08T19:30 (a Nepal evening).
export default function FinaleLab() {
  const lang = useStore((s) => s.lang);
  const theme = useStore((s) => s.themePref);
  useEffect(() => {
    startSmoothScroll();
  }, []);
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <ThemeSync />
      <Toasts />
      <div style={{ position: 'fixed', top: 8, left: 8, right: 8, zIndex: 60, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {LANGS.map((l) => (
          <button key={l.id} type="button" className="chip" aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>
            {l.native}
          </button>
        ))}
        {['auto', 'day', 'night'].map((th) => (
          <button key={th} type="button" className="chip" aria-pressed={theme === th} onClick={() => setState({ themePref: th })}>
            {th}
          </button>
        ))}
      </div>
      <section id="contact" className="section">
        <div className="wrap" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
          <p className="t-label">Contact section stand-in. Scroll down to land.</p>
        </div>
      </section>
      <Finale />
      <div style={{ height: '40vh', display: 'grid', placeItems: 'center' }} className="t-label">
        Footer stand-in
      </div>
    </div>
  );
}
