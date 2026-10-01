import { useSyncExternalStore } from 'react';

const read = (key, fallback = null) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage can be blocked; the site works without it */
  }
};

const parseEggs = () => {
  try {
    const list = JSON.parse(read('ss-eggs', '[]'));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const initialLang = (() => {
  const saved = read('ss-lang');
  if (saved === 'en' || saved === 'ne' || saved === 'mai') return saved;
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'en' || q === 'ne' || q === 'mai') return q;
  } catch {
    /* ignore */
  }
  return 'en';
})();

let state = {
  themePref: read('ss-theme', 'auto'), // 'auto' | 'day' | 'night'
  yap: read('ss-yap') === '1',
  // Master audio switch (ambient tone + effects). On by default; nothing
  // plays until the visitor's first click or key press.
  sound: read('ss-sound') !== '0',
  lang: initialLang, // 'en' | 'ne' | 'mai'
  intro: 'pending', // 'pending' | 'playing' | 'done'
  eggs: parseEggs(),
  palette: false, // command palette open
  passport: false, // passport dialog open
  project: null, // open project id
  lightbox: null, // open photo index
  menu: false, // mobile menu
  preview: null, // timeline preview { season, phase }
  loaded: false, // boarding finished
  retro: false, // konami
  toast: null,
};

const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export function setState(patch) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  if ('themePref' in next) write('ss-theme', next.themePref === 'auto' ? null : next.themePref);
  if ('yap' in next) write('ss-yap', next.yap ? '1' : null);
  if ('sound' in next) write('ss-sound', next.sound ? '1' : '0');
  if ('lang' in next) write('ss-lang', next.lang);
  if ('eggs' in next) write('ss-eggs', JSON.stringify(next.eggs));
  emit();
}

export const getState = () => state;
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// Selectors must return primitives or stored references (never fresh objects).
export function useStore(selector) {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}
