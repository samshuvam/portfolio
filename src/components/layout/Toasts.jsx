import {useCopy} from '../../i18n/Text';
import { useEffect, useRef } from 'react';
import { StampIcon } from '@phosphor-icons/react';
import { useStore, setState } from '../../lib/store';
import { gsap } from '../../lib/motion';

export default function Toasts() {
  const c=useCopy();
  const toast = useStore((s) => s.toast);
  const ref = useRef(null);

  useEffect(() => {
    if (!toast || !ref.current) return;
    gsap.fromTo(ref.current, { y: 24, autoAlpha: 0, scale: 0.96 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' });
  }, [toast]);

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      {toast && (
        <div ref={ref} key={toast.key} className={`toast ${toast.tone === 'egg' ? 'toast-egg' : ''}`} role="status">
          {toast.tone === 'egg' && <StampIcon size={22} weight="duotone" />}
          <div>
            <p className="toast-title">{toast.title}</p>
            {toast.body && <p className="toast-body">{toast.body}</p>}
          </div>
          {toast.tone === 'egg' && (
            <button type="button" className="toast-link" onClick={() => setState({ passport: true, toast: null })}>
              {c("Passport")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
