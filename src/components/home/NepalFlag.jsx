import { useEffect, useRef } from 'react';
import { findEgg } from '../../lib/eggs';
import { sound } from '../../lib/sound';
import { reducedMotion } from '../../lib/motion';

// The flag of Nepal: two stacked pennants, crimson with a blue border, a
// moon in the upper and a sun in the lower. Drawn once, then waved by
// slicing it into strips that ride a travelling sine wave.

const CRIMSON = '#DC143C';
const BLUE = '#003893';

function drawFlag(ctx, s) {
  // Geometry from the constitutional construction, simplified: units on an
  // 80-tall flag with a 60-wide hoist-to-tip run.
  ctx.save();
  ctx.scale(s, s);
  ctx.translate(4, 4);
  const shape = new Path2D('M0 37.574H60L0 0V80H60L0 20Z');
  ctx.lineJoin = 'miter';
  ctx.lineWidth = 5.2;
  ctx.strokeStyle = BLUE;
  ctx.fillStyle = CRIMSON;
  ctx.stroke(shape);
  ctx.fill(shape);
  ctx.fillStyle = '#ffffff';
  // Moon: a crescent with rays rising from it.
  ctx.save();
  ctx.translate(14.6, 24.5);
  ctx.beginPath();
  ctx.arc(0, 0, 9.3, 0, Math.PI);
  ctx.arc(0, -1.6, 7.2, Math.PI, 0, true);
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI + (i + 0.5) * (Math.PI / 8);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - 0.12) * 3.4, Math.sin(a - 0.12) * 3.4 - 1.6);
    ctx.lineTo(Math.cos(a) * 6.6, Math.sin(a) * 6.6 - 1.6);
    ctx.lineTo(Math.cos(a + 0.12) * 3.4, Math.sin(a + 0.12) * 3.4 - 1.6);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, -1.6, 3, Math.PI, 0);
  ctx.fill();
  ctx.restore();
  // Sun: a disc with twelve rays.
  ctx.save();
  ctx.translate(14.6, 59);
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const r = i % 2 === 0 ? 10.8 : 6.6;
    const a = (i / 24) * Math.PI * 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

export default function NepalFlag() {
  const ref = useRef(null);
  const boost = useRef(0);
  const clicks = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduce = reducedMotion();
    const src = document.createElement('canvas');
    let W = 0;
    let H = 0;
    let raf = 0;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const build = () => {
      const r = canvas.getBoundingClientRect();
      if (W === r.width && H === r.height) return;
      W = r.width;
      H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      const s = (H * dpr * 0.82) / 88;
      src.width = Math.ceil(70 * s);
      src.height = Math.ceil(88 * s);
      const g = src.getContext('2d');
      g.clearRect(0, 0, src.width, src.height);
      drawFlag(g, s);
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);

    const draw = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ox = canvas.width * 0.5 - src.width * 0.42;
      const oy = (canvas.height - src.height) / 2;
      // Pole.
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink-3');
      ctx.fillRect(ox - 6 * dpr, oy - 10 * dpr, 4 * dpr, src.height + 60 * dpr);
      const strips = 48;
      const sw = src.width / strips;
      const amp = (5 + boost.current * 14) * dpr;
      for (let i = 0; i < strips; i++) {
        const k = i / strips;
        const wave = Math.sin(t * (2.2 + boost.current * 2) - k * 6) * amp * k;
        const shade = 1 - (Math.cos(t * (2.2 + boost.current * 2) - k * 6) * 0.12 * k);
        ctx.globalAlpha = 1;
        ctx.drawImage(src, i * sw, 0, sw + 0.6, src.height, ox + i * sw, oy + wave, sw + 0.6, src.height);
        if (shade < 1) {
          ctx.globalAlpha = (1 - shade) * 1.4;
          ctx.fillStyle = '#000';
          ctx.globalCompositeOperation = 'source-atop';
          ctx.fillRect(ox + i * sw, oy + wave, sw + 0.6, src.height);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      ctx.globalAlpha = 1;
      boost.current = Math.max(0, boost.current - 0.006);
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (visible) draw(now / 1000);
    };
    if (reduce) draw(0);
    else raf = requestAnimationFrame(loop);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <button
      type="button"
      className="flag-btn"
      aria-label="The flag of Nepal. Click to wave it."
      onClick={() => {
        boost.current = 1;
        clicks.current += 1;
        sound.whoosh(0.5);
        if (clicks.current >= 3) findEgg('flag');
      }}
    >
      <canvas ref={ref} className="flag-canvas" />
    </button>
  );
}
