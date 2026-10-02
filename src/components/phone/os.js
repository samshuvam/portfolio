import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react';

// ShuvamOS shared plumbing: the OS context, the back stack for apps, and a
// tiny store for the clock (stopwatch and timer keep running after the
// Clock app closes, and show up in the dynamic island).

export const DEVICE = { w: 380, h: 800 };

export const PhoneCtx = createContext(null);
export const usePhone = () => useContext(PhoneCtx);

// Apps can claim the back action (Escape, edge swipe, the back chevron):
// return true when the app handled it (for example closing a viewer).
export function useBack(handler) {
  const ctx = usePhone();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!ctx) return undefined;
    const fn = () => ref.current?.();
    ctx.backRef.current = fn;
    return () => {
      if (ctx.backRef.current === fn) ctx.backRef.current = null;
    };
  }, [ctx]);
}

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage may be blocked */
  }
};
export const store = { read, write };

// ---- clock store ----------------------------------------------------------
let clock = {
  sw: { running: false, startedAt: 0, acc: 0, laps: [] },
  timer: { running: false, endsAt: 0, left: 0, total: 0, label: '' },
};
const clockListeners = new Set();
const emitClock = () => clockListeners.forEach((l) => l());
const subClock = (l) => {
  clockListeners.add(l);
  return () => clockListeners.delete(l);
};
export const getClock = () => clock;
export const useClock = () => useSyncExternalStore(subClock, getClock, getClock);

export const swElapsed = (sw = clock.sw) => sw.acc + (sw.running ? performance.now() - sw.startedAt : 0);

export const clockActions = {
  swToggle() {
    const sw = clock.sw;
    clock = { ...clock, sw: sw.running ? { ...sw, running: false, acc: swElapsed(sw) } : { ...sw, running: true, startedAt: performance.now() } };
    emitClock();
  },
  swLap() {
    if (!clock.sw.running) return;
    clock = { ...clock, sw: { ...clock.sw, laps: [swElapsed(), ...clock.sw.laps].slice(0, 20) } };
    emitClock();
  },
  swReset() {
    clock = { ...clock, sw: { running: false, startedAt: 0, acc: 0, laps: [] } };
    emitClock();
  },
  timerStart(ms, label) {
    clock = { ...clock, timer: { running: true, endsAt: Date.now() + ms, left: ms, total: ms, label } };
    emitClock();
  },
  timerToggle() {
    const tm = clock.timer;
    if (!tm.total) return;
    clock = { ...clock, timer: tm.running ? { ...tm, running: false, left: Math.max(0, tm.endsAt - Date.now()) } : { ...tm, running: true, endsAt: Date.now() + tm.left } };
    emitClock();
  },
  timerCancel() {
    clock = { ...clock, timer: { running: false, endsAt: 0, left: 0, total: 0, label: '' } };
    emitClock();
  },
};
export const timerLeft = (tm = clock.timer) => (tm.running ? Math.max(0, tm.endsAt - Date.now()) : tm.left);

export const fmtDuration = (ms, withCs = false) => {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${withCs ? `.${String(cs).padStart(2, '0')}` : ''}`;
};

// A rAF ticker that only runs while `on` is true (used for live numbers).
export function useTicker(on, fn) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!on) return undefined;
    let raf = 0;
    const loop = () => {
      ref.current();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);
}
