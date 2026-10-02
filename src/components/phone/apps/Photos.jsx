import { useEffect, useRef, useState } from 'react';
import { CaretLeftIcon, CaretRightIcon, ImageSquareIcon, XIcon } from '@phosphor-icons/react';
import { imagery } from '../../../lib/imagery';
const photos=Object.values(imagery).map(p=>({...p,caption:p.id==='vivah'?'Mithila / Vivah':p.id==='research'?'An engineering desk':p.id==='window'?'The window seat':p.id[0].toUpperCase()+p.id.slice(1)}));
import { useT, useLang, localDigits } from '../../../i18n';
import miscOverlay from '../../../i18n/content/misc';
import dict from '../../../i18n/ui/phone';
import { usePhone, useBack } from '../os';
import { AppShell } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

const thumb = (p) => p.srcset?.[0]?.src || p.tex || p.src;

function Viewer({ index, onIndex, onClose }) {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  const captions = (lang !== 'en' && miscOverlay?.[lang]?.photoCaptions) || {};
  const p = photos[index];
  const strip = useRef(null);
  const drag = useRef(null);
  const close = useRef(null);
  const [set, setSet] = useState(false);
  useBack(() => {
    onClose();
    return true;
  });
  useEffect(() => {
    close.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => setSet(false), [index]);

  const go = (d) => {
    const n = index + d;
    if (n < 0 || n >= photos.length) return;
    sfx.tap();
    onIndex(n);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else return;
    e.preventDefault();
  };
  // Swipe sideways to move, down to close.
  const down = (e) => {
    drag.current = { x: e.clientX, y: e.clientY, k: e.currentTarget.getBoundingClientRect().width / e.currentTarget.offsetWidth || 1 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.stopPropagation();
  };
  const move = (e) => {
    if (!drag.current || !strip.current) return;
    const dx = (e.clientX - drag.current.x) / drag.current.k;
    const dy = (e.clientY - drag.current.y) / drag.current.k;
    strip.current.style.transform = Math.abs(dy) > Math.abs(dx) && dy > 0 ? `translateY(${dy}px) scale(${1 - dy / 1200})` : `translateX(${dx}px)`;
  };
  const up = (e) => {
    if (!drag.current) return;
    const dx = (e.clientX - drag.current.x) / drag.current.k;
    const dy = (e.clientY - drag.current.y) / drag.current.k;
    drag.current = null;
    if (strip.current) strip.current.style.transform = '';
    if (dy > 110 && Math.abs(dy) > Math.abs(dx)) onClose();
    else if (dx < -60) go(1);
    else if (dx > 60) go(-1);
  };
  if (!p) return null;
  const caption = captions[p.id] || p.caption;
  return (
    <div className="sos-viewer" role="dialog" aria-label={t('ph.viewer')} onKeyDown={onKey}>
      <div className="sos-viewer-top">
        <button type="button" ref={close} className="sos-viewer-btn" aria-label={t('ph.close')} onClick={onClose}>
          <XIcon size={18} weight="bold" />
        </button>
        <span>
          {localDigits(index + 1, lang)} / {localDigits(photos.length, lang)}
        </span>
        <button
          type="button"
          className="sos-viewer-btn is-wide"
          onClick={() => {
            ctx.setWall(`art:${p.id}`);
            setSet(true);
            sfx.chime();
          }}
        >
          <ImageSquareIcon size={16} weight="bold" />
          {set ? t('ph.wallSet') : t('ph.wall')}
        </button>
      </div>
      <div className="sos-viewer-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="sos-viewer-img" ref={strip}>
          <img key={p.id} src={p.src} srcSet={p.srcsetAttr} sizes="400px" alt={caption || t('ph.alt')} style={{ background: p.color }} draggable="false" />
        </div>
      </div>
      <div className="sos-viewer-foot">
        <button type="button" className="sos-viewer-btn" aria-label={t('ph.prev')} onClick={() => go(-1)} disabled={index === 0}>
          <CaretLeftIcon size={18} weight="bold" />
        </button>
        <p aria-live="polite">
          {caption && <b>{caption}</b>}
          
        </p>
        <button type="button" className="sos-viewer-btn" aria-label={t('ph.next')} onClick={() => go(1)} disabled={index === photos.length - 1}>
          <CaretRightIcon size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}

export default function Photos() {
  const t = useT(dict);
  const lang = useLang();
  const [open, setOpen] = useState(null);
  const cells = useRef([]);
  const last = useRef(null);
  const close = () => {
    const i = last.current;
    setOpen(null);
    requestAnimationFrame(() => cells.current[i]?.focus({ preventScroll: true }));
  };
  return (
    <AppShell title={t('app.photos')} sub={t('ph.sub', { n: localDigits(photos.length, lang) })} className="sos-photos" flush>
      {photos.length ? (
        <ul className="sos-ph-grid">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                ref={(el) => {
                  cells.current[i] = el;
                }}
                className="sos-ph-cell"
                style={{ background: p.color }}
                aria-label={p.caption || t('ph.photoN', { n: localDigits(i + 1, lang) })}
                onClick={() => {
                  last.current = i;
                  setOpen(i);
                }}
              >
                <img src={thumb(p)} alt="" loading="lazy" decoding="async" draggable="false" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sos-empty">{t('ph.empty')}</p>
      )}
      {open !== null && (
        <Viewer
          index={open}
          onIndex={(i) => {
            last.current = i;
            setOpen(i);
          }}
          onClose={close}
        />
      )}
    </AppShell>
  );
}
