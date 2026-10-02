import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '@phosphor-icons/react';
import { gsap, lockScroll, reducedMotion } from '../../lib/motion';
import './dialog.css';
import { useCopy } from '../../i18n/Text';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function Dialog({ open, onClose, label, children, className = '', variant = 'sheet' }) {
  const c = useCopy();
  const panel = useRef(null);
  const backdrop = useRef(null);
  const lastFocus = useRef(null);
  const lockOwner = useRef(Symbol('dialog'));
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    lockScroll(true, lockOwner.current);
    const reduce = reducedMotion();
    gsap.fromTo(backdrop.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduce ? 0 : 0.35 });
    gsap.fromTo(panel.current, { y: variant === 'sheet' ? 40 : 0, scale: 0.97, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: reduce ? 0 : 0.55, ease: 'power3.out' });
    const first = panel.current?.querySelector('[data-autofocus]') || panel.current?.querySelector(FOCUSABLE);
    const focusTimer = setTimeout(() => first?.focus({ preventScroll: true }), 30);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      clearTimeout(focusTimer);
      gsap.killTweensOf([panel.current, backdrop.current]);
      document.removeEventListener('keydown', onKey, true);
      lockScroll(false, lockOwner.current);
      lastFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, variant]);

  if (!open) return null;
  return createPortal(
    <div className={`dialog-root dialog-${variant}`}>
      <div ref={backdrop} className="dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={panel} className={`dialog-panel ${className}`} role="dialog" aria-modal="true" aria-label={label} data-lenis-prevent>
        <button type="button" className="dialog-close icon-btn" onClick={onClose} aria-label={c('Close')}>
          <XIcon size={18} weight="bold" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
