import { useEffect, useRef } from 'react';
import { CaretLeftIcon } from '@phosphor-icons/react';
import { useT } from '../../i18n';
import dict from '../../i18n/ui/phone';
import { usePhone } from './os';

// The frame every app sits in: room for the status bar, a back control,
// a large title, a scrolling body and room for the home indicator.
export function AppShell({ title, sub, children, actions, className = '', backLabel, onBack, dark = false, scroll = true, flush = false }) {
  const t = useT(dict);
  const ctx = usePhone();
  const head = useRef(null);
  useEffect(() => {
    const el = head.current;
    if (!el) return;
    const dev = el.closest('.sos-device');
    const ae = document.activeElement;
    if (ae === document.body || dev?.contains(ae)) el.focus({ preventScroll: true });
  }, []);
  return (
    <section className={`sos-appshell ${dark ? 'is-dark' : ''} ${className}`} aria-label={title}>
      <div className="sos-appbar">
        <button type="button" className="sos-back" onClick={onBack || ctx.back}>
          <CaretLeftIcon size={18} weight="bold" />
          <span>{backLabel || t('os.homeShort')}</span>
        </button>
        <div className="sos-appbar-actions">{actions}</div>
      </div>
      <h2 className="sos-apptitle" ref={head} tabIndex={-1}>
        {title}
        {sub && <small>{sub}</small>}
      </h2>
      {scroll ? (
        <div className={`sos-appbody ${flush ? 'is-flush' : ''}`} data-lenis-prevent>
          {children}
        </div>
      ) : (
        <div className={`sos-appbody is-fixed ${flush ? 'is-flush' : ''}`}>{children}</div>
      )}
    </section>
  );
}

export function Seg({ value, onChange, options, label }) {
  return (
    <div className="sos-seg" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="tab" aria-selected={value === o.id} className={value === o.id ? 'is-on' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label, sub, icon }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="sos-row sos-row-switch" onClick={() => onChange(!checked)}>
      {icon && <span className="sos-row-icon">{icon}</span>}
      <span className="sos-row-text">
        <b>{label}</b>
        {sub && <small>{sub}</small>}
      </span>
      <span className={`sos-switch ${checked ? 'is-on' : ''}`} aria-hidden="true">
        <i />
      </span>
    </button>
  );
}

export function Row({ icon, label, sub, end, onClick, href, tint }) {
  const inner = (
    <>
      {icon && (
        <span className="sos-row-icon" style={tint ? { background: tint, color: '#fff' } : undefined}>
          {icon}
        </span>
      )}
      <span className="sos-row-text">
        <b>{label}</b>
        {sub && <small>{sub}</small>}
      </span>
      {end && <span className="sos-row-end">{end}</span>}
    </>
  );
  if (href)
    return (
      <a className="sos-row" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
        {inner}
      </a>
    );
  if (onClick)
    return (
      <button type="button" className="sos-row" onClick={onClick}>
        {inner}
      </button>
    );
  return <div className="sos-row">{inner}</div>;
}

export const Group = ({ title, children }) => (
  <div className="sos-group">
    {title && <p className="sos-group-title">{title}</p>}
    <div className="sos-group-body">{children}</div>
  </div>
);
