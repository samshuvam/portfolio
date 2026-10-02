import L, { useCopy } from '../../i18n/Text';
import { useEffect, useRef, useState } from 'react';
import { findEgg } from '../../lib/eggs';
import { sound } from '../../lib/sound';

// Fly an eVTOL through a city at rooftop height. Hold to climb, let go to
// sink. Fly through the vertiport rings for safe arrivals.

const read = (k) => {
  try {
    return Number(localStorage.getItem(k) || 0);
  } catch {
    return 0;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, String(v));
  } catch {
    /* ignore */
  }
};

export default function FlyLab() {
  const c=useCopy();
  const canvasRef = useRef(null);
  const [ui, setUi] = useState({ state: 'ready', score: 0, best: read('ss-fly-best') });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const g = { state: 'ready', y: 0.5, vy: 0, thrust: false, down: false, t: 0, speed: 0.28, obstacles: [], rings: [], score: 0, spawn: 0, skyline: [] };
    let colors = {};
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = {
        bg: cs.getPropertyValue('--bg-2').trim(),
        ink: cs.getPropertyValue('--ink').trim(),
        ink3: cs.getPropertyValue('--ink-3').trim(),
        line: cs.getPropertyValue('--line-strong').trim(),
        surface: cs.getPropertyValue('--surface-2').trim(),
        accent: cs.getPropertyValue('--accent').trim(),
        accentFg: cs.getPropertyValue('--accent-fg').trim(),
      };
    };
    readColors();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.skyline = Array.from({ length: 30 }, (_, i) => ({ x: i / 22, h: 0.15 + Math.random() * 0.28, w: 0.03 + Math.random() * 0.03 }));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const reset = () => {
      Object.assign(g, { state: 'flying', y: 0.45, vy: 0, t: 0, speed: 0.28, obstacles: [], rings: [], score: 0, spawn: 0.4 });
      setUi((u) => ({ ...u, state: 'flying', score: 0 }));
    };

    const crash = () => {
      g.state = 'crashed';
      sound.whoosh(0.6);
      const best = Math.max(read('ss-fly-best'), g.score);
      write('ss-fly-best', best);
      setUi({ state: 'crashed', score: g.score, best });
    };

    const spawn = () => {
      const gapY = 0.25 + Math.random() * 0.45;
      const gap = 0.36 - Math.min(0.12, g.t * 0.002);
      g.obstacles.push({ x: 1.05, w: 0.07, top: 0, bottom: gapY - gap / 2, kind: 'cloud' });
      g.obstacles.push({ x: 1.05, w: 0.08, top: gapY + gap / 2, bottom: 1, kind: 'tower' });
      g.rings.push({ x: 1.09, y: gapY, hit: false });
    };

    const step = (dt) => {
      if (g.state !== 'flying') return;
      g.t += dt;
      g.speed = 0.28 + Math.min(0.22, g.t * 0.004);
      const acc = g.thrust ? -2.4 : g.down ? 2.6 : 1.15;
      g.vy = Math.max(-0.9, Math.min(0.9, g.vy + acc * dt));
      g.y += g.vy * dt;
      if (g.y < 0.04 || g.y > 0.96) return crash();
      g.spawn -= dt;
      if (g.spawn <= 0) {
        spawn();
        g.spawn = 1.7 - Math.min(0.6, g.t * 0.01);
      }
      const px = 0.18;
      const pr = 0.03;
      g.obstacles.forEach((o) => {
        o.x -= g.speed * dt;
        const inX = px + pr > o.x && px - pr < o.x + o.w;
        const inY = g.y + pr * (W / H) * 0.5 > o.top && g.y - pr * (W / H) * 0.5 < o.bottom;
        if (inX && inY) crash();
      });
      g.rings.forEach((r) => {
        r.x -= g.speed * dt;
        if (!r.hit && r.x < px) {
          r.hit = true;
          g.score += 1;
          sound.click();
          setUi((u) => ({ ...u, score: g.score }));
          if (g.score === 10) findEgg('ace');
        }
      });
      g.obstacles = g.obstacles.filter((o) => o.x + o.w > -0.05);
      g.rings = g.rings.filter((r) => r.x > -0.05);
    };

    const drawCraft = (x, y, tilt) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.fillStyle = colors.accent;
      ctx.strokeStyle = colors.accentFg;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = colors.ink;
      ctx.beginPath();
      ctx.ellipse(7, -2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      const spin = performance.now() / 40;
      [-16, 16].forEach((ax) => {
        ctx.strokeStyle = colors.ink3;
        ctx.beginPath();
        ctx.moveTo(ax * 0.5, -6);
        ctx.lineTo(ax, -12);
        ctx.stroke();
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const len = 11 * Math.abs(Math.cos(spin + ax));
        ctx.moveTo(ax - len, -13);
        ctx.lineTo(ax + len, -13);
        ctx.stroke();
        ctx.lineWidth = 1.5;
      });
      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);
      // Far skyline, parallax.
      ctx.fillStyle = colors.line;
      g.skyline.forEach((b) => {
        const x = (((b.x - g.t * 0.03) % 1.36) + 1.36) % 1.36 - 0.1;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(x * W, H - b.h * H, b.w * W, b.h * H);
      });
      ctx.globalAlpha = 1;
      // Obstacles.
      g.obstacles.forEach((o) => {
        const x = o.x * W;
        const w = o.w * W;
        if (o.kind === 'tower') {
          ctx.fillStyle = colors.surface;
          ctx.strokeStyle = colors.ink3;
          ctx.lineWidth = 1.5;
          ctx.fillRect(x, o.top * H, w, (o.bottom - o.top) * H);
          ctx.strokeRect(x, o.top * H, w, (o.bottom - o.top) * H);
          ctx.fillStyle = colors.line;
          for (let wy = o.top * H + 10; wy < H - 8; wy += 14) {
            ctx.fillRect(x + 6, wy, w - 12, 5);
          }
        } else {
          ctx.fillStyle = colors.line;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.roundRect(x - 8, 0, w + 16, o.bottom * H, [0, 0, 24, 24]);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });
      // Vertiport rings.
      g.rings.forEach((r) => {
        ctx.strokeStyle = r.hit ? colors.ink3 : colors.accentFg;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(r.x * W, r.y * H, 7, 24, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      drawCraft(0.18 * W, g.y * H, g.vy * 0.5);
    };

    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.04, (t - last) / 1000);
      last = t;
      if (!visible) return;
      step(dt);
      draw();
    };
    raf = requestAnimationFrame(loop);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);

    const press = (on) => {
      if (on && g.state !== 'flying') {
        reset();
        return;
      }
      g.thrust = on;
    };
    const keyDown = (e) => {
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        press(true);
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        g.down = true;
      }
    };
    const keyUp = (e) => {
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) g.thrust = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) g.down = false;
    };
    const pDown = (e) => {
      e.preventDefault();
      canvas.focus({ preventScroll: true });
      press(true);
    };
    const pUp = () => {
      g.thrust = false;
    };
    canvas.addEventListener('keydown', keyDown);
    canvas.addEventListener('keyup', keyUp);
    canvas.addEventListener('pointerdown', pDown);
    window.addEventListener('pointerup', pUp);
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-season'] });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      canvas.removeEventListener('keydown', keyDown);
      canvas.removeEventListener('keyup', keyUp);
      canvas.removeEventListener('pointerdown', pDown);
      window.removeEventListener('pointerup', pUp);
    };
  }, []);

  return (
    <div className="lab-demo">
      <div className="lab-controls">
        <p className="lab-stats t-mono">
          Safe arrivals {ui.score}
          <span className="text-ink-3"> · best {ui.best}</span>
        </p>
        <p className="t-small text-ink-3"> <L text={"Click the city, then hold Space, Up or your finger to climb. Fly through the rings."} /> </p>
      </div>
      <div className="fly-wrap">
        <canvas ref={canvasRef} className="lab-canvas fly-canvas" tabIndex={0} aria-label="eVTOL mini game. Focus and hold Space or Up to climb." data-lenis-prevent />
        {ui.state !== 'flying' && (
          <div className="fly-overlay" aria-live="polite">
            <p className="fly-title">{ui.state === 'crashed' ? 'Conflict resolution failed.' : 'Cleared for takeoff.'}</p>
            <p className="t-small">{ui.state === 'crashed' ? `${ui.score} safe arrivals. Click to fly again.` : 'Click to start. Ten safe arrivals earns a passport stamp.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
