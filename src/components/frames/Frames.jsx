import L, { useCopy } from '../../i18n/Text';
import { useLocalize, localDigits } from '../../i18n';
import overlay from '../../i18n/content/misc';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CaretLeftIcon, CaretRightIcon, GridFourIcon, CircleNotchIcon } from '@phosphor-icons/react';
import Dialog from '../ui/Dialog';
import { Term } from '../ui/Term';
import { photos } from '../../lib/photos';
import { setState, useStore } from '../../lib/store';
import { findEgg, toast } from '../../lib/eggs';
import { sound } from '../../lib/sound';
import { ScrollTrigger, reducedMotion } from '../../lib/motion';
import '@fontsource/noto-serif-tibetan/400.css';
import './frames.css';

function Lightbox() {
  const c=useCopy();
  const index = useStore((s) => s.lightbox);
  const loc=useLocalize(overlay);
  const captions=loc({},'photoCaptions');
  const close = useCallback(() => setState({ lightbox: null }), []);
  const original = index !== null ? photos[index] : null;
  const p = original ? {...original,caption:captions[original.id] || original.caption} : null;
  const go = (d) => setState({ lightbox: (index + d + photos.length) % photos.length });

  useEffect(() => {
    if (index === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <Dialog open={!!p} onClose={close} label={p?.caption || 'Photograph'} className="lightbox" variant="center">
      {p && (
        <figure className="lb-figure">
          <img src={p.srcset[p.srcset.length - 1].src} srcSet={p.srcsetAttr} sizes="(min-width: 1024px) 70vw, 100vw" alt={p.caption || 'A photograph by Shuvam Singh'} style={{ background: p.color, aspectRatio: p.ratio }} />
          <figcaption>
            <span className="lb-cap">{p.caption || 'Untitled frame'}</span>
            <span className="lb-nav">
              <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label={c("Previous photo")}>
                <CaretLeftIcon size={18} weight="bold" />
              </button>
              <span className="t-mono">
                {index + 1} / {photos.length}
              </span>
              <button type="button" className="icon-btn" onClick={() => go(1)} aria-label={c("Next photo")}>
                <CaretRightIcon size={18} weight="bold" />
              </button>
            </span>
          </figcaption>
        </figure>
      )}
    </Dialog>
  );
}

export default function Frames() {
  const c=useCopy();
  const canvas = useRef(null);
  const loc=useLocalize(overlay);
  const captions=loc({},'photoCaptions');
  const stage = useRef(null);
  const wheelRef = useRef(null);
  const [grid, setGrid] = useState(() => reducedMotion());
  const [turns, setTurns] = useState(0);
  const [failed, setFailed] = useState(false);
  const warned = useRef(false);

  useEffect(() => {
    if (grid) return undefined;
    let wheel = null;
    let disposed = false;
    let raf = 0;
    let visible = false;
    let st = null;

    const boot = async () => {
      try {
        await document.fonts.load('400 150px "Noto Serif Tibetan"', 'ༀམ');
      } catch {
        /* the drum still works without the mantra font */
      }
      const { PrayerWheel } = await import('../../three/PrayerWheel');
      if (disposed) return;
      try {
        wheel = new PrayerWheel(canvas.current, photos, { mobile: window.innerWidth < 768 });
      } catch {
        setFailed(true);
        setGrid(true);
        return;
      }
      wheelRef.current = wheel;
      wheel.onTurn = (n) => {
        setTurns(n);
        sound.bowl(1);
        if (n === 108) findEgg('spins');
      };
      const size = () => {
        const r = stage.current.getBoundingClientRect();
        wheel.resize(r.width, r.height);
      };
      size();
      const ro = new ResizeObserver(size);
      ro.observe(stage.current);
      wheel._ro = ro;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (visible) wheel.render();
      };
      raf = requestAnimationFrame(loop);
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
      });
      io.observe(stage.current);
      wheel._io = io;
      // Scrolling past the wheel nudges it, so the page and the wheel feel connected.
      st = ScrollTrigger.create({
        trigger: stage.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => wheel.spin(Math.max(-0.4, Math.min(0.4, self.getVelocity() * 0.00012))),
      });
    };
    boot();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      st?.kill();
      if (wheel) {
        wheel._ro?.disconnect();
        wheel._io?.disconnect();
        wheel.dispose();
      }
      wheelRef.current = null;
    };
  }, [grid]);

  // Drag to spin, click to open.
  const drag = useRef(null);
  const onDown = (e) => {
    if (e.target.closest('button,a,input,select,textarea')) return;
    const w = wheelRef.current;
    if (!w) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, last: e.clientX, t: performance.now(), moved: 0 };
    w.dragging = true;
  };
  const onMove = (e) => {
    const w = wheelRef.current;
    if (!w) return;
    const r = stage.current.getBoundingClientRect();
    w.setPointer(e.clientX - r.left, e.clientY - r.top);
    stage.current.style.cursor = drag.current ? 'grabbing' : w.hover >= 0 ? 'pointer' : 'grab';
    if (!drag.current) return;
    const dx = e.clientX - drag.current.last;
    const now = performance.now();
    const dt = Math.max(1, now - drag.current.t) / 1000;
    drag.current.last = e.clientX;
    drag.current.t = now;
    drag.current.moved += Math.abs(dx);
    // Dragging left turns it clockwise (seen from above): positive angle.
    w.velocity = (-dx / dt) * 0.0042;
    if (w.velocity < -1.6 && !warned.current) {
      warned.current = true;
      findEgg('clockwise');
      toast('Prayer wheels turn clockwise', 'At Boudhanath you walk and spin them clockwise. Om mani padme hum.', 'egg');
    }
  };
  const onUp = (e) => {
    const w = wheelRef.current;
    if (!w || !drag.current) return;
    const { moved } = drag.current;
    drag.current = null;
    w.dragging = false;
    if (e.type !== 'pointercancel' && moved < 6 && w.hover >= 0) {
      sound.click();
      setState({ lightbox: w.hover });
    }
  };

  return (
    <section id="frames" className="section frames" aria-labelledby="frames-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="frames-title" className="t-display"> <L text={"Frames,"} /> <span className="light"> <L text={"on a prayer wheel."} /> </span>
          </h2>
          <p className="t-lede">
            {c('{n} photographs from Janakpur, Kathmandu, campus and the sky, wrapped around a',{n:localDigits(photos.length)})} <Term id="prayer-wheel"> <L text={"prayer wheel"} /> </Term> <L text={"carrying"} /> <span className="font-tibetan">ༀ་མ་ཎི་པདྨེ་ཧཱུྃ</span> <L text={". Drag to spin it, clockwise like at Boudhanath. Click a frame to open it."} /> </p>
        </header>
      </div>

      {!grid ? (
        <div ref={stage} className="frames-stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={() => wheelRef.current?.setPointer(-9999, -9999)}>
          <canvas ref={canvas} className="frames-canvas" aria-hidden="true" />
          <div className="frames-hud">
            <span className="t-mono">
              <CircleNotchIcon size={14} weight="bold" /> {c('{n} of 108 turns',{n:localDigits(turns)})}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setGrid(true)}>
              <GridFourIcon size={15} weight="bold" /> <L text={"Show as a grid"} /> </button>
          </div>
        </div>
      ) : (
        <div className="wrap">
          {!failed && !reducedMotion() && (
            <button type="button" className="btn btn-ghost btn-sm frames-back" onClick={() => setGrid(false)}>
              <CircleNotchIcon size={15} weight="bold" /> <L text={"Back to the wheel"} /> </button>
          )}
          <ul className="frames-grid">
            {photos.map(p=>({...p,caption:captions[p.id] || p.caption})).map((p, i) => (
              <li key={p.id}>
                <button type="button" onClick={() => setState({ lightbox: i })} aria-label={p.caption || `Photo ${i + 1}`}>
                  <img src={p.src} srcSet={p.srcsetAttr} sizes="(min-width:1024px) 28vw, (min-width:600px) 45vw, 90vw" alt={p.caption || ''} loading="lazy" style={{ aspectRatio: p.ratio, background: p.color }} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Lightbox />
    </section>
  );
}
