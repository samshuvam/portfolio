import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { glossary } from '../../data/glossary';
import { gsap, reducedMotion } from '../../lib/motion';
import TermArt from './TermArt';
import { useLocalize } from '../../i18n';
import overlay from '../../i18n/content/glossary';

// Hover (or focus, or tap) any underlined term to get a plain-English card.
// One card is shared by the whole page and follows the pointer.

let current = null; // { id, rect, x }
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const get = () => current;

let hideTimer = null;
function show(id, el, x) {
  clearTimeout(hideTimer);
  current = { id, el, x };
  emit();
}
function hide(delay = 90) {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    current = null;
    emit();
  }, delay);
}

export function Term({ id, children, className = '' }) {
  const ref = useRef(null);
  const loc = useLocalize(overlay);
  const data = loc(glossary[id], id);
  const active = useSyncExternalStore(subscribe, () => current?.id === id && current?.el === ref.current);
  if (!data) return children ?? null;
  const isTouch = () => window.matchMedia('(hover: none)').matches;
  return (
    <button
      ref={ref}
      type="button"
      className={`term ${className}`}
      data-open={active ? 'true' : 'false'}
      aria-describedby={active ? 'term-card' : undefined}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') show(id, ref.current, e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.pointerType === 'mouse' && current?.el === ref.current) {
          current = { ...current, x: e.clientX };
          emit();
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') hide();
      }}
      onFocus={() => {
        const r = ref.current.getBoundingClientRect();
        show(id, ref.current, r.left + r.width / 2);
      }}
      onBlur={() => hide(0)}
      onClick={(e) => {
        if (!isTouch()) return;
        e.preventDefault();
        if (active) hide(0);
        else {
          const r = ref.current.getBoundingClientRect();
          show(id, ref.current, r.left + r.width / 2);
        }
      }}
    >
      {children ?? data.term}
    </button>
  );
}

export function TermCardHost() {
  const loc = useLocalize(overlay);
  const state = useSyncExternalStore(subscribe, get, get);
  const cardRef = useRef(null);
  const [shown, setShown] = useState(null);
  const pos = useRef({ x: 0, y: 0, init: false });

  // Keep the last term rendered while the card animates out.
  useEffect(() => {
    if (state) setShown(state.id);
  }, [state]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    // Every change cancels whatever the card was doing, so a quick
    // in-and-out can never leave a fade-in running after the fade-out.
    gsap.killTweensOf(card);
    if (!state) {
      gsap.to(card, { autoAlpha: 0, y: '+=6', scale: 0.97, duration: reducedMotion() ? 0 : 0.16, ease: 'power2.in', overwrite: true });
      pos.current.init = false;
      return;
    }
    if (!state.el?.isConnected) {
      hide(0);
      return;
    }
    const r = state.el.getBoundingClientRect();
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const x = Math.max(12, Math.min(window.innerWidth - w - 12, state.x - w / 2));
    let y = r.top - h - 14;
    let origin = '50% 100%';
    if (y < 76) {
      y = r.bottom + 14;
      origin = '50% 0%';
    }
    card.style.transformOrigin = origin;
    if (!pos.current.init || reducedMotion()) {
      gsap.set(card, { x, y });
      gsap.fromTo(card, { autoAlpha: 0, scale: 0.94, filter: 'blur(6px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: reducedMotion() ? 0 : 0.28, ease: 'power3.out', overwrite: true });
      pos.current.init = true;
    } else {
      gsap.to(card, { x, y, autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out', overwrite: true });
    }
  }, [state]);

  // Safety nets: close when the pointer is no longer over the word (even if
  // the word moved under a still pointer), when the page scrolls, on Escape,
  // and on any tap outside a term.
  useEffect(() => {
    const onMove = (e) => {
      if (!current || e.pointerType !== 'mouse') return;
      const el = current.el;
      if (!el?.isConnected) return hide(0);
      if (el.contains(e.target)) return;
      const r = el.getBoundingClientRect();
      const inside = e.clientX >= r.left - 2 && e.clientX <= r.right + 2 && e.clientY >= r.top - 2 && e.clientY <= r.bottom + 2;
      if (!inside) hide(60);
    };
    const close = () => {
      if (current) hide(0);
    };
    const onKey = (e) => e.key === 'Escape' && hide(0);
    const onDown = (e) => {
      if (current && !e.target.closest?.('.term')) hide(0);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('wheel', close, { passive: true });
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('touchmove', close, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('wheel', close);
      window.removeEventListener('scroll', close);
      window.removeEventListener('touchmove', close);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', close);
    };
  }, []);

  const id = state?.id || shown;
  const data = id ? loc(glossary[id], id) : null;
  return createPortal(
    <div ref={cardRef} id="term-card" role="tooltip" className="term-card" style={{ left: 0, top: 0, visibility: 'hidden' }}>
      {data && (
        <>
          <div className="term-card-art">
            <TermArt art={data.art} image={data.image} />
          </div>
          <div className="px-4 pt-3 pb-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-[1.15rem] font-bold leading-tight tracking-tight text-ink">{data.term}</p>
              <span className="t-label shrink-0">{data.kind}</span>
            </div>
            {data.full && <p className="t-mono text-ink-3 mt-0.5">{data.full}</p>}
            <p className="mt-2 text-[0.9rem] leading-snug text-ink-2">{data.body}</p>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
