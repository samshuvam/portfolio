import L, { useCopy } from '../../i18n/Text';
import { useLocalize, localDigits } from '../../i18n';
import overlay from '../../i18n/content/home';
import { useEffect, useRef, useState } from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { contextImage } from '../../lib/imagery';
import { toNepaliDigits } from '../../lib/world';
import { findEgg } from '../../lib/eggs';
import { gsap, reducedMotion } from '../../lib/motion';
import { sound } from '../../lib/sound';
import { Lotus } from './MithilaMotifs';

const ZOOM = 1.7;
const LENS = 150;

// A sketchbook of home. Each plate is a pen-and-wash drawing generated from
// one of my photos; the brass lens shows the photograph underneath.
export default function Sketchbook() {
  const c=useCopy();
  const loc=useLocalize(overlay);
  const items = [{id:'janaki',title:c('Janaki Mandir'),note:c('A palace of arches and domes, at the heart of Janakpur.')},{id:'panchthar',title:c('Panchthar'),note:c('Green hills, childhood paths, and a quieter kind of home.')},{id:'lumbini',title:c('Lumbini'),note:c('A sacred garden, a birthplace, and a little stillness.')},{id:'vivah',title:c('Vivah Panchami'),note:c('Sita and Rama’s wedding, in the language of Mithila painting.')}].map(p=>({...p,photo:contextImage(p.id)}));
  const [page, setPage] = useState(0);
  const [lens, setLens] = useState({ x: 0.5, y: 0.45 });
  const seen = useRef(new Set());
  const leftRef = useRef(null);
  const bookRef = useRef(null);
  const drag = useRef(null);

  const plate = items[page];
  useEffect(() => {
    // A plate counts as inspected once the lens has actually moved on it.
    if (seen.current.size === items.length) findEgg('lens');
  }, [items.length, page]);

  if (!plate) return null;
  const sk = {src:plate.photo.src,photo:plate.photo.src};

  const turn = (dir, target) => {
    const next = target ?? (page + dir + items.length) % items.length;
    sound.flap();
    if (reducedMotion() || !bookRef.current) {
      setPage(next);
      return;
    }
    gsap
      .timeline()
      .to(bookRef.current, { rotateY: dir * -9, rotateX: 4, duration: 0.25, ease: 'power2.in' })
      .to(bookRef.current.querySelectorAll('.sb-page'), { autoAlpha: 0, duration: 0.15 }, '<0.1')
      .add(() => setPage(next))
      .to(bookRef.current, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'back.out(1.4)' })
      .to(bookRef.current.querySelectorAll('.sb-page'), { autoAlpha: 1, duration: 0.35 }, '<');
  };

  const moveTo = (clientX, clientY) => {
    const r = leftRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    setLens({ x, y });
    seen.current.add(page);
    if (seen.current.size === items.length) findEgg('lens');
  };

  const onDown = (e) => {
    e.preventDefault();
    drag.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    moveTo(e.clientX, e.clientY);
  };
  const onMove = (e) => {
    if (drag.current) moveTo(e.clientX, e.clientY);
  };
  const onUp = () => {
    drag.current = false;
  };
  const onKey = (e) => {
    const step = 0.04;
    const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    setLens((l) => ({ x: Math.min(1, Math.max(0, l.x + d[0])), y: Math.min(1, Math.max(0, l.y + d[1])) }));
    seen.current.add(page);
    if (seen.current.size === items.length) findEgg('lens');
  };

  const w = leftRef.current?.offsetWidth || 400;
  const h = leftRef.current?.offsetHeight || 400;

  return (
    <div className="sketchbook">
      <div className="sb-book" ref={bookRef}>
        <div className="sb-page sb-left" ref={leftRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <img src={sk.src} alt={`Illustrated view of ${plate.title}`} className="sb-sketch" draggable="false" />
          <div
            className="sb-lens"
            role="slider"
            tabIndex={0}
            aria-label={c("Magnifying lens. Use arrow keys to move it and explore the illustration.")}
            aria-valuetext={`${Math.round(lens.x * 100)}% across, ${Math.round(lens.y * 100)}% down`}
            onKeyDown={onKey}
            style={{
              left: `${lens.x * 100}%`,
              top: `${lens.y * 100}%`,
              backgroundImage: `url(${sk.photo})`,
              backgroundSize: `${w * ZOOM}px ${h * ZOOM}px`,
              backgroundPosition: `${-(lens.x * w * ZOOM - LENS / 2)}px ${-(lens.y * h * ZOOM - LENS / 2)}px`,
            }}
          >
            <span className="sb-lens-handle" aria-hidden="true" />
          </div>
        </div>
        <div className="sb-page sb-right">
          <p className="sb-no font-deva">{toNepaliDigits(page + 1)}</p>
          <h4 className="sb-title">{plate.title}</h4>
          <p className="sb-note">{plate.note}</p>
          <p className="sb-hint">{c('Drag the lens to explore the details. These are contextual AI illustrations.')}</p>
          <div className="sb-motif" aria-hidden="true">
            <Lotus />
          </div>
          <p className="sb-count t-mono">
            {c('Plate {n} of {total}',{n:localDigits(page+1),total:localDigits(items.length)})}
          </p>
        </div>
      </div>
      <div className="sb-controls">
        <button type="button" className="icon-btn" onClick={() => turn(-1)} aria-label={c("Previous plate")}>
          <CaretLeftIcon size={18} weight="bold" />
        </button>
        <div className="sb-dots" role="tablist" aria-label="Plates">
          {items.map((it, i) => (
            <button key={it.id} type="button" role="tab" aria-selected={i === page} aria-label={it.title} onClick={() => i !== page && turn(i > page ? 1 : -1, i)} />
          ))}
        </div>
        <button type="button" className="icon-btn" onClick={() => turn(1)} aria-label={c("Next plate")}>
          <CaretRightIcon size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}
