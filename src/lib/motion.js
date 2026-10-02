import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, Draggable, InertiaPlugin, ScrambleTextPlugin, ScrollToPlugin);
gsap.defaults({ ease: 'power3.out', duration: 0.8 });

export { gsap, ScrollTrigger, SplitText, Draggable };

const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
export const reducedMotion = () => !!mq?.matches;

let lenis = null;
export const getLenis = () => lenis;

// Scroll velocity in px/s, shared with the plane and the turbulence egg.
export const scrollState = { velocity: 0, progress: 0, direction: 1 };

export function startSmoothScroll() {
  if (lenis) return lenis;
  if (reducedMotion()) return null;
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
  if (document.documentElement.classList.contains('scroll-locked')) lenis.stop();
  lenis.on('scroll', (e) => {
    scrollState.velocity = e.velocity * 60;
    scrollState.progress = e.progress;
    scrollState.direction = e.direction || scrollState.direction;
    ScrollTrigger.update();
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) window.__lenis = lenis;
  return lenis;
}

export function scrollToTarget(target, opts = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  const offset = opts.offset ?? -80;
  if (lenis) lenis.scrollTo(el, { offset, immediate: opts.duration === 0, duration: opts.duration ?? 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({top:Math.max(0,window.scrollY+el.getBoundingClientRect().top+offset),behavior:reducedMotion()?'auto':'smooth'});
}

const scrollLocks = new Set();
export function lockScroll(locked, owner = 'default') {
  if (locked) scrollLocks.add(owner);
  else scrollLocks.delete(owner);
  const isLocked = scrollLocks.size > 0;
  if (lenis) isLocked ? lenis.stop() : lenis.start();
  document.documentElement.classList.toggle('scroll-locked', isLocked);
}
