import { useEffect, useRef } from 'react';
import { jokes } from '../../../data/jokes';
import jokesOverlay from '../../../i18n/content/jokes';
import { localize } from '../../../i18n';
import { noteJoke } from '../../../lib/eggs';

// Small shared helpers for the arcade games (canvas sizing, the theme
// palette, a pausable animation loop, and seeded randomness).

const mq = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches;
export const isCoarse = () => mq('(pointer: coarse)');
export const isPhone = () => mq('(max-width: 767px)') || isCoarse();

// Device pixel ratio, capped: 1.5 on phones, 2 on desktop.
export const dprCap = () => Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, isPhone() ? 1.5 : 2);

// Sets a canvas backing store for a CSS size and returns the scale used.
export function sizeCanvas(canvas, ctx, w, h) {
  const dpr = dprCap();
  const bw = Math.max(1, Math.round(w * dpr));
  const bh = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== bw) canvas.width = bw;
  if (canvas.height !== bh) canvas.height = bh;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return dpr;
}

const VARS = {
  bg: '--bg',
  bg2: '--bg-2',
  bg3: '--bg-3',
  surface: '--surface',
  surface2: '--surface-2',
  ink: '--ink',
  ink2: '--ink-2',
  ink3: '--ink-3',
  line: '--line',
  lineStrong: '--line-strong',
  accent: '--accent',
  accentInk: '--accent-ink',
  accentFg: '--accent-fg',
};
const FALLBACK = {
  bg: '#f2eee6',
  bg2: '#ebe5d8',
  bg3: '#dfd7c6',
  surface: '#f8f5ef',
  surface2: '#fffdf8',
  ink: '#16181f',
  ink2: '#4a4d57',
  ink3: '#74767e',
  line: 'rgba(22,24,31,0.12)',
  lineStrong: 'rgba(22,24,31,0.24)',
  accent: '#f08a24',
  accentInk: '#16181f',
  accentFg: '#a34a00',
};

export function readPalette() {
  if (typeof document === 'undefined') return { ...FALLBACK, night: false };
  const cs = getComputedStyle(document.documentElement);
  const out = {};
  Object.entries(VARS).forEach(([k, v]) => {
    out[k] = cs.getPropertyValue(v).trim() || FALLBACK[k];
  });
  out.night = document.documentElement.dataset.theme === 'night';
  return out;
}

// The theme palette for canvas drawing, kept fresh when the theme or the
// season (accent) changes. Returns a ref so draw loops always read the latest.
export function usePalette() {
  const ref = useRef(null);
  if (ref.current === null) ref.current = readPalette();
  useEffect(() => {
    const mo = new MutationObserver(() => {
      ref.current = readPalette();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-season'] });
    ref.current = readPalette();
    return () => mo.disconnect();
  }, []);
  return ref;
}

// Calls fn(dt, timeSeconds) every frame while `running` is true and the tab
// is visible. dt is capped so a long pause never makes the game jump.
export function useLoop(running, fn) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    if (!running) return undefined;
    let raf = 0;
    let last = 0;
    let alive = true;
    const tick = (now) => {
      if (!alive) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      fnRef.current(dt, now / 1000);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    start();
    return () => {
      alive = false;
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [running]);
}

// Keeps the latest value in a ref, for loops and listeners set up once.
export function useLatest(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

// Tiny deterministic random generator (mulberry32) for stable map art.
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// A random joke for game-over screens, translated, and counted toward the
// "joker" passport stamp.
export function gameOverJoke(tags, lang) {
  const pool = jokes.filter((j) => tags.some((tag) => j.tags.includes(tag)));
  const joke = pick(pool.length ? pool : jokes);
  noteJoke(joke.id);
  return localize(joke, jokesOverlay, lang, joke.id)?.text || joke.text;
}

// Keys a game handles itself: stop them from scrolling the page or reaching
// site-wide shortcuts. Ignores Enter and Space on a focused button (the
// button handles those).
export function claimKey(e) {
  e.preventDefault();
  e.stopPropagation();
}
export function isButtonActivation(e) {
  const tag = e.target?.tagName;
  return (e.key === 'Enter' || e.key === ' ') && (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT');
}
