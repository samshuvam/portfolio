import { useState } from 'react';
import ThemeSync from '../../components/ThemeSync';
import Toasts from '../../components/layout/Toasts';
import Phone from '../../components/phone/Phone';
import { useStore, setState } from '../../lib/store';
import { setLang, LANGS } from '../../i18n';

// Dev preview: http://localhost:3000/?lab=phone
export default function PhoneLab() {
  const lang = useStore((s) => s.lang);
  const theme = useStore((s) => s.themePref);
  const sound = useStore((s) => s.sound);
  const [width, setWidth] = useState('auto');
  const widths = { auto: '100%', 300: '300px', 340: '340px', 390: '390px' };
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', padding: '24px 16px 120px' }}>
      <ThemeSync />
      <Toasts />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
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
        <button type="button" className="chip" onClick={() => setState({ sound: !sound })}>
          sound {sound ? 'on' : 'off'}
        </button>
        {Object.keys(widths).map((w) => (
          <button key={w} type="button" className="chip" aria-pressed={width === w} onClick={() => setWidth(w)}>
            w {w}
          </button>
        ))}
      </div>
      <div style={{ height: 300, display: 'grid', placeItems: 'center' }} className="t-label">
        Scroll down to the phone
      </div>
      <section className="section" style={{ paddingBlock: 40 }}>
        <div style={{ width: widths[width], maxWidth: 420, margin: '0 auto' }}>
          <Phone />
        </div>
      </section>
      <div style={{ height: 600 }} />
    </div>
  );
}
