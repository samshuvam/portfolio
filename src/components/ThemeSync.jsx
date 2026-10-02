import { useLayoutEffect } from 'react';
import { useWorld } from '../lib/world';
import { useStore } from '../lib/store';
import { seasonById } from '../data/seasons';

// Resolves light/dark from the real sun over Lalitpur (unless the visitor
// picked one), and paints the page in the current Nepali season's pigment.
export function useResolvedTheme() {
  const world = useWorld();
  const pref = useStore((s) => s.themePref);
  return pref === 'auto' ? (world.isDaylight ? 'day' : 'night') : pref;
}

export function useSeason() {
  const world = useWorld();
  let override = null;
  try {
    override = new URLSearchParams(window.location.search).get('season');
  } catch {
    /* ignore */
  }
  return override ? seasonById(override) : world.season;
}

export default function ThemeSync() {
  const world = useWorld();
  const theme = useResolvedTheme();
  const season = useSeason();
  const yap = useStore((s) => s.yap);
  const retro = useStore((s) => s.retro);
  const lang = useStore((s) => s.lang);
  const festival = world.festivals.isBirthday ? 'birthday' : world.festivals.active?.mode || '';

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    const a = theme === 'day' ? {fill:'#256449',ink:'#ffffff',fg:'#205d43'} : {fill:'#8fc9a5',ink:'#10241b',fg:'#a3d9b7'};
    root.style.setProperty('--accent', a.fill);
    root.style.setProperty('--accent-ink', a.ink);
    root.style.setProperty('--accent-fg', a.fg);
    root.dataset.season = season.id;
    root.dataset.festival = festival;
    root.dataset.phase = world.phase;
    root.dataset.yap = String(yap);
    root.classList.toggle('retro', retro);
    root.lang = lang;
    root.dataset.lang = lang;
    const meta = document.querySelectorAll('meta[name="theme-color"]');
    meta.forEach((m) => m.setAttribute('content', theme === 'day' ? '#f2eee6' : '#0b0e19'));
  }, [theme, season, festival, yap, retro, world.phase, lang]);

  return null;
}
