import { useEffect, useRef } from 'react';
import { localDigits, useLang } from '../../../i18n';
import './b-games.css';

// Shared UI for the "b" games: the HUD row, the start / pause / game-over
// panel that sits over the canvas, and touch pads that support holding.

export function Hud({ items }) {
  const lang = useLang();
  return (
    <div className="bx-hud">
      {items.map((it) => (
        <div key={it.id} className="bx-stat" data-tone={it.tone || undefined}>
          <span className="bx-stat-label">{it.label}</span>
          <span className="bx-stat-value">{typeof it.value === 'number' ? localDigits(Math.round(it.value).toLocaleString('en-US'), lang) : it.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Pips({ total, left, label }) {
  const lang = useLang();
  return (
    <span className="bx-pips" role="img" aria-label={`${label}: ${localDigits(left, lang)} / ${localDigits(total, lang)}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="bx-pip" data-on={i < left || undefined} />
      ))}
    </span>
  );
}

// The overlay card. Focus moves to the primary button only when focus is
// already inside this game, so it never yanks the page.
export function Panel({ kicker, title, children, primary, secondary, tone }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = el.closest('.bx-root');
    const btn = el.querySelector('[data-primary]');
    if (root && btn && root.contains(document.activeElement)) btn.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} className="bx-overlay" data-tone={tone || undefined}>
      <div className="bx-card" role="group" aria-label={typeof title === 'string' ? title : undefined}>
        {kicker && <p className="bx-kicker">{kicker}</p>}
        <h3 className="bx-title">{title}</h3>
        {children}
        <div className="bx-actions">
          {primary && (
            <button type="button" className="btn btn-accent btn-sm" data-primary onClick={primary.onClick}>
              {primary.label}
            </button>
          )}
          {secondary && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={secondary.onClick}>
              {secondary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// A touch-friendly control. Pointer presses act on press (onDown) and can be
// held (onUp on release); keyboard activation calls onDown then onUp.
// Mouse presses do not steal focus, so the game keeps its keyboard focus.
export function Pad({ onDown, onUp, label, children, className = '', disabled = false, pressed, wide = false }) {
  const held = useRef(false);
  const release = () => {
    if (!held.current) return;
    held.current = false;
    onUp?.();
  };
  useEffect(
    () => () => {
      if (held.current) onUp?.();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <button
      type="button"
      className={`bx-pad ${className}`}
      data-wide={wide || undefined}
      aria-label={typeof children === 'string' ? undefined : label}
      aria-pressed={pressed}
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
        held.current = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        onDown?.();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onMouseDown={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.detail === 0 && !disabled) {
          onDown?.();
          onUp?.();
        }
      }}
    >
      {children}
    </button>
  );
}
