import ThemeSync from '../../components/ThemeSync';
import Toasts from '../../components/layout/Toasts';
import Arcade from '../../components/arcade/Arcade';
import { useStore, setState } from '../../lib/store';
import { setLang, LANGS } from '../../i18n';
import '../../styles/layout.css';

// Dev preview: http://localhost:3000/?lab=arcade
// Language, theme and sound switches, plus a reset for best scores and the
// games-played list. Scroll the console off screen to check the pause.
export default function ArcadeLab() {
  const lang = useStore((s) => s.lang);
  const theme = useStore((s) => s.themePref);
  const sound = useStore((s) => s.sound);
  const project = useStore((s) => s.project);
  const reset = () => {
    try {
      localStorage.removeItem('ss-arcade-best');
      localStorage.removeItem('ss-arcade-played');
    } catch {
      /* ignore */
    }
    window.location.reload();
  };
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <ThemeSync />
      <Toasts />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', padding: '16px' }}>
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
        <button type="button" className="chip" onClick={reset}>
          reset scores
        </button>
        {project && (
          <button type="button" className="chip" onClick={() => setState({ project: null })}>
            close project ({project})
          </button>
        )}
      </div>
      <Arcade />
      <div style={{ height: '120vh', display: 'grid', placeItems: 'center' }} className="t-label">
        Scrolled away: the game should be paused
      </div>
    </div>
  );
}
