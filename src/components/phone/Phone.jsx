import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { DEVICE } from './os';

// ShuvamOS, the playable phone in the contact section. This shell is tiny:
// it reserves the space, works out the scale for the available width, and
// only loads the OS when the phone is about to scroll into view.
const ShuvamOS = lazy(() => import('./ShuvamOS.jsx'));

const UNDER = 58; // the "Full screen" row under the device

function Ghost({ scale }) {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div
        aria-hidden="true"
        style={{
          width: DEVICE.w * scale,
          height: DEVICE.h * scale + UNDER,
          borderRadius: 62 * scale,
          background: 'linear-gradient(135deg, #b9b4ab, #6d6a66 50%, #b9b4ab)',
          clipPath: `inset(0 0 ${UNDER}px 0 round ${62 * scale}px)`,
          opacity: 0.35,
        }}
      />
    </div>
  );
}

export default function Phone() {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = (w) => setScale(Math.max(0.6, Math.min(1, Math.floor((w / DEVICE.w) * 1000) / 1000)));
    measure(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => measure(entry.contentRect.width));
    ro.observe(el);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '900px 0px' },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="sos-shell" style={{ width: '100%', minWidth: 0 }}>
      {near ? (
        <Suspense fallback={<Ghost scale={scale} />}>
          <ShuvamOS scale={scale} />
        </Suspense>
      ) : (
        <Ghost scale={scale} />
      )}
    </div>
  );
}
