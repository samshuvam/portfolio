import { useCallback, useEffect, useRef, useState } from 'react';
import { jokes } from '../../../data/jokes';
import jokesOverlay from '../../../i18n/content/jokes';
import { localize } from '../../../i18n';
import { noteJoke } from '../../../lib/eggs';
import { reducedMotion } from '../../../lib/motion';

// Shared plumbing for the "b" arcade games (RoverRun, KiteFight, MomoCatcher,
// BusDash): a responsive canvas, the live theme palette, a loop that pauses
// offscreen and in background tabs, colour helpers and best scores.

export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

const mq = (q) => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches;
export const isCoarse = () => mq('(pointer: coarse)');
const dprCap = () => Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, mq('(max-width: 767px)') || isCoarse() ? 1.5 : 2);

// ---------------------------------------------------------------- colours

let probe = null;
const cache = new Map();
// Any CSS colour -> [r, g, b, a]. Uses the canvas parser, so hex, rgb() with
// slash alpha and named colours all work.
export function parseColor(css) {
  if (cache.has(css)) return cache.get(css);
  let out = [128, 128, 128, 1];
  try {
    if (!probe) probe = document.createElement('canvas').getContext('2d');
    probe.fillStyle = '#808080';
    probe.fillStyle = css;
    const v = probe.fillStyle;
    if (v.startsWith('#')) {
      out = [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), 1];
    } else {
      const m = v.match(/[\d.]+/g);
      if (m) out = [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]];
    }
  } catch {
    /* keep grey */
  }
  cache.set(css, out);
  return out;
}

// rgba() string for a colour at a given opacity.
export function alpha(css, a) {
  const [r, g, b] = parseColor(css);
  return `rgba(${r},${g},${b},${a})`;
}

// Mix two colours (t = 0 gives a, 1 gives b).
export function mixColor(a, b, t) {
  const ca = parseColor(a);
  const cb = parseColor(b);
  const m = (i) => Math.round(ca[i] + (cb[i] - ca[i]) * t);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
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

function readPalette() {
  if (typeof document === 'undefined') return { ...FALLBACK, night: false };
  const cs = getComputedStyle(document.documentElement);
  const out = {};
  Object.entries(VARS).forEach(([k, v]) => {
    out[k] = cs.getPropertyValue(v).trim() || FALLBACK[k];
  });
  out.night = document.documentElement.dataset.theme === 'night';
  return out;
}

// The theme palette as a ref, refreshed when the theme or season changes.
export function usePalette() {
  const ref = useRef(null);
  if (ref.current === null) ref.current = readPalette();
  useEffect(() => {
    const refresh = () => {
      ref.current = readPalette();
    };
    const mo = new MutationObserver(refresh);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-season', 'style', 'class'] });
    refresh();
    return () => mo.disconnect();
  }, []);
  return ref;
}

// ---------------------------------------------------------------- canvas

// A canvas that fills its wrapper's width. `heightFor(width)` picks the
// height, so phones get a taller stage than desktops. sizeRef holds
// { w, h } in CSS pixels; the context is pre-scaled for the device ratio.
export function useStage(heightFor) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 320, h: 240 });
  const ctxRef = useRef(null);
  const heightRef = useRef(heightFor);
  heightRef.current = heightFor;
  const [, setTick] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    const apply = () => {
      const w = Math.max(240, Math.floor(wrap.clientWidth));
      const h = Math.round(heightRef.current(w));
      const dpr = dprCap();
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const changed = sizeRef.current.w !== w || sizeRef.current.h !== h;
      sizeRef.current = { w, h };
      if (changed) setTick((n) => n + 1);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return { wrapRef, canvasRef, sizeRef, ctxRef };
}

// ---------------------------------------------------------------- loop

// Calls fn(dt, now) every frame while `running`, the tab is visible and the
// element is on screen. dt is in seconds and capped so pauses never jump.
export function useGameLoop(running, fn, elRef) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (!running) return undefined;
    let raf = 0;
    let last = 0;
    let onScreen = true;
    const tick = (now) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      fnRef.current(dt, now / 1000);
      start();
    };
    function start() {
      if (raf || document.hidden || !onScreen) return;
      raf = requestAnimationFrame(tick);
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    let io = null;
    if (elRef?.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      });
      io.observe(elRef.current);
    }
    start();
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
      io?.disconnect();
    };
  }, [running, elRef]);
}

// ---------------------------------------------------------------- misc

export const useReduced = () => {
  const [r, setR] = useState(reducedMotion);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!m) return undefined;
    const on = () => setR(m.matches);
    m.addEventListener?.('change', on);
    return () => m.removeEventListener?.('change', on);
  }, []);
  return r;
};

// Best score for a game, kept on this device.
export function useBest(id) {
  const key = `ss-arcade-best-${id}`;
  const [best, setBest] = useState(() => {
    try {
      return Number(localStorage.getItem(key)) || 0;
    } catch {
      return 0;
    }
  });
  const bestRef = useRef(best);
  const submit = useCallback(
    (score) => {
      if (score <= bestRef.current) return false;
      bestRef.current = score;
      setBest(score);
      try {
        localStorage.setItem(key, String(score));
      } catch {
        /* storage blocked */
      }
      return true;
    },
    [key],
  );
  return [best, submit];
}

// A translated joke for the game-over card (counts toward the joker stamp).
export function pickJoke(tags, lang) {
  const pool = jokes.filter((j) => tags.some((tag) => j.tags.includes(tag)));
  const joke = pick(pool.length ? pool : jokes);
  if (!joke) return '';
  noteJoke(joke.id);
  return localize(joke, jokesOverlay, lang, joke.id)?.text || joke.text;
}

// Keys a game owns while it has focus: keep them from scrolling the page or
// reaching site-wide shortcuts. Enter and Space on a focused button are left
// to the button.
export function isButtonKey(e) {
  const tag = e.target?.tagName;
  return (e.key === 'Enter' || e.key === ' ') && (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT');
}
export function claim(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Rounded rectangle path (works where ctx.roundRect is missing).
export function rr(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

// Canvas font strings that follow the site fonts.
export const font = (px, weight = 600, fam = 'display') =>
  `${weight} ${Math.round(px)}px ${fam === 'mono' ? "'Geist Mono Variable', ui-monospace, monospace" : fam === 'sans' ? "'Geist Variable', 'Noto Sans Devanagari Variable', system-ui, sans-serif" : "'Bricolage Grotesque Variable', 'Noto Sans Devanagari Variable', system-ui, sans-serif"}`;

// Tiny deterministic random generator (mulberry32) for stable scenery.
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
