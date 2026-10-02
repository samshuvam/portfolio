import { useEffect, useRef } from 'react';
import { localDigits, useLang } from '../../../i18n';

// Shared pieces of game UI: the start / game-over panel, HUD stats, life
// pips and touch pad buttons (with hold-to-repeat).

export function Overlay({ kicker, title, children, actions, tone = 'default' }) {
  const ref = useRef(null);
  useEffect(() => {
    // Move focus to the main action, but only if the visitor is already
    // inside this game (never pull focus or scroll from elsewhere).
    const el = ref.current;
    if (!el) return;
    const scope = el.closest('.arcade-screen') || el.closest('.ag-root');
    const btn = el.querySelector('[data-primary]');
    if (scope && btn && scope.contains(document.activeElement)) btn.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} className="ag-overlay" data-tone={tone} role="group" aria-label={typeof title === 'string' ? title : undefined}>
      <div className="ag-overlay-card">
        {kicker && <p className="ag-kicker">{kicker}</p>}
        <h3 className="ag-title">{title}</h3>
        {children}
        {actions && <div className="ag-actions">{actions}</div>}
      </div>
    </div>
  );
}

export function Stat({ label, value, wide = false }) {
  const lang = useLang();
  return (
    <div className="ag-stat" data-wide={wide || undefined}>
      <span className="ag-stat-label">{label}</span>
      <span className="ag-stat-value">{typeof value === 'number' ? localDigits(value.toLocaleString('en-US'), lang) : value}</span>
    </div>
  );
}

export function Pips({ label, total, left }) {
  const lang = useLang();
  return (
    <div className="ag-stat">
      <span className="ag-stat-label">{label}</span>
      <span className="ag-pips" role="img" aria-label={`${localDigits(left, lang)} / ${localDigits(total, lang)}`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="ag-pip" data-on={i < left || undefined} />
        ))}
      </span>
    </div>
  );
}

// A touch-friendly button. Pointer presses act immediately (and repeat while
// held when `repeat` is set); keyboard activation goes through onClick.
// Mouse presses do not steal focus from the game, so keys keep working.
export function PadButton({ onPress, repeat = false, label, children, className = '', disabled = false, pressed }) {
  const timer = useRef(0);
  const stop = () => {
    clearTimeout(timer.current);
    clearInterval(timer.current);
    timer.current = 0;
  };
  useEffect(() => stop, []);
  const down = (e) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    onPress();
    if (repeat) {
      stop();
      timer.current = setTimeout(() => {
        timer.current = setInterval(onPress, 70);
      }, 220);
    }
  };
  return (
    <button
      type="button"
      className={`ag-pad ${className}`}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onPointerDown={down}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onMouseDown={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        // detail 0 means keyboard (Enter or Space); pointers were handled on press.
        if (e.detail === 0 && !disabled) onPress();
      }}
    >
      {children}
    </button>
  );
}
