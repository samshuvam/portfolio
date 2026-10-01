import { useEffect, useRef, useState } from 'react';
import { CloudLightningIcon, PlusIcon } from '@phosphor-icons/react';
import { Term } from '../ui/Term';
import { sound } from '../../lib/sound';

// A small illustration of 4D deconfliction: every aircraft projects where it
// will be over the next few seconds. If two projections meet at the same time
// and level, one of them changes level or holds. Click to drop a storm cell.

const PORTS = [
  { name: 'Thamel', x: 0.36, y: 0.32 },
  { name: 'Patan', x: 0.42, y: 0.72 },
  { name: 'Bouddha', x: 0.74, y: 0.36 },
  { name: 'Kirtipur', x: 0.12, y: 0.68 },
  { name: 'TIA', x: 0.86, y: 0.62 },
];
const SPEED = 0.055; // map units per second
const SEP = 0.065;
const LOOKAHEAD = 10;

let idSeq = 1;
const rand = (a, b) => a + Math.random() * (b - a);

function makeFlight(storms) {
  const a = Math.floor(Math.random() * PORTS.length);
  let b = Math.floor(Math.random() * PORTS.length);
  if (b === a) b = (a + 1) % PORTS.length;
  const f = { id: `UAM${String(idSeq++).padStart(2, '0')}`, from: PORTS[a], to: PORTS[b], x: PORTS[a].x, y: PORTS[a].y, level: 1 + Math.floor(Math.random() * 3), hold: 0, flash: 0, wp: null };
  route(f, storms);
  return f;
}

// Detour around any storm that sits on the straight line.
function route(f, storms) {
  f.wp = null;
  for (const s of storms) {
    const dx = f.to.x - f.x;
    const dy = f.to.y - f.y;
    const len = Math.hypot(dx, dy) || 1;
    const t = Math.max(0, Math.min(1, ((s.x - f.x) * dx + (s.y - f.y) * dy) / (len * len)));
    const px = f.x + dx * t;
    const py = f.y + dy * t;
    if (Math.hypot(px - s.x, py - s.y) < s.r + 0.03 && t > 0.02 && t < 0.98) {
      const nx = -dy / len;
      const ny = dx / len;
      const side = (px - s.x) * nx + (py - s.y) * ny >= 0 ? 1 : -1;
      f.wp = { x: s.x + nx * side * (s.r + 0.07), y: s.y + ny * side * (s.r + 0.07) };
      return;
    }
  }
}

function target(f) {
  return f.wp || f.to;
}

function project(f, seconds) {
  // Straight-line projection toward the current target, then on to the destination.
  let x = f.x;
  let y = f.y;
  let tgt = target(f);
  let wpUsed = !f.wp;
  let rem = Math.max(0, seconds - f.hold) * SPEED;
  while (rem > 0) {
    const d = Math.hypot(tgt.x - x, tgt.y - y);
    if (d <= rem) {
      x = tgt.x;
      y = tgt.y;
      rem -= d;
      if (!wpUsed) {
        wpUsed = true;
        tgt = f.to;
      } else break;
    } else {
      x += ((tgt.x - x) / d) * rem;
      y += ((tgt.y - y) / d) * rem;
      rem = 0;
    }
  }
  return { x, y };
}

export default function AirspaceLab() {
  const canvasRef = useRef(null);
  const sim = useRef({ flights: [], storms: [], conflicts: [], resolved: 0, seen: new Map() });
  const [stats, setStats] = useState({ flying: 0, resolved: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = sim.current;
    state.flights = Array.from({ length: 6 }, () => makeFlight(state.storms));
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let colors = {};

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = {
        ink: cs.getPropertyValue('--ink').trim(),
        ink2: cs.getPropertyValue('--ink-2').trim(),
        ink3: cs.getPropertyValue('--ink-3').trim(),
        line: cs.getPropertyValue('--line').trim(),
        accent: cs.getPropertyValue('--accent').trim(),
        accentFg: cs.getPropertyValue('--accent-fg').trim(),
        surface: cs.getPropertyValue('--surface-2').trim(),
      };
    };
    readColors();
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-season'] });

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const levelColor = (l) => [colors.ink3, colors.ink2, colors.ink][l - 1] || colors.ink2;

    const step = (dt) => {
      const now = performance.now() / 1000;
      state.storms = state.storms.filter((s) => s.until > now);
      // Move.
      state.flights.forEach((f) => {
        f.flash = Math.max(0, f.flash - dt);
        if (f.hold > 0) {
          f.hold = Math.max(0, f.hold - dt);
          return;
        }
        const tgt = target(f);
        const d = Math.hypot(tgt.x - f.x, tgt.y - f.y);
        const move = SPEED * dt;
        if (d <= move) {
          f.x = tgt.x;
          f.y = tgt.y;
          if (f.wp) f.wp = null;
          else f.arrived = true;
        } else {
          f.x += ((tgt.x - f.x) / d) * move;
          f.y += ((tgt.y - f.y) / d) * move;
        }
      });
      state.flights = state.flights.filter((f) => !f.arrived);
      while (state.flights.length < 5) state.flights.push(makeFlight(state.storms));

      // Predict and resolve conflicts in space and time.
      state.conflicts = [];
      const fl = state.flights;
      for (let i = 0; i < fl.length; i++) {
        for (let j = i + 1; j < fl.length; j++) {
          const a = fl[i];
          const b = fl[j];
          if (a.level !== b.level) continue;
          for (let t = 0.5; t <= LOOKAHEAD; t += 0.5) {
            const pa = project(a, t);
            const pb = project(b, t);
            if (Math.hypot(pa.x - pb.x, pa.y - pb.y) < SEP) {
              state.conflicts.push({ x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2, t });
              const used = new Set(fl.filter((o) => o !== b && Math.hypot(o.x - b.x, o.y - b.y) < 0.2).map((o) => o.level));
              const free = [1, 2, 3].find((l) => !used.has(l));
              if (free && free !== b.level) b.level = free;
              else b.hold = Math.max(b.hold, 1.5);
              b.flash = 1.6;
              // Count each pair once, not once per frame.
              const key = `${a.id}-${b.id}`;
              const nowS = performance.now() / 1000;
              if (!state.seen.has(key) || nowS - state.seen.get(key) > 4) state.resolved += 1;
              state.seen.set(key, nowS);
              break;
            }
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // Street grid.
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 0; gx < W; gx += 34) {
        ctx.moveTo(gx + 0.5, 0);
        ctx.lineTo(gx + 0.5, H);
      }
      for (let gy = 0; gy < H; gy += 34) {
        ctx.moveTo(0, gy + 0.5);
        ctx.lineTo(W, gy + 0.5);
      }
      ctx.stroke();

      // Storm cells.
      const now = performance.now() / 1000;
      state.storms.forEach((s) => {
        const life = Math.min(1, (s.until - now) / 2);
        const g = ctx.createRadialGradient(s.x * W, s.y * H, 0, s.x * W, s.y * H, s.r * W);
        g.addColorStop(0, `rgba(120,130,170,${0.45 * life})`);
        g.addColorStop(1, 'rgba(120,130,170,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r * W, 0, Math.PI * 2);
        ctx.fill();
      });

      // Vertiports.
      PORTS.forEach((p) => {
        ctx.fillStyle = colors.surface;
        ctx.strokeStyle = colors.ink3;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(p.x * W - 9, p.y * H - 9, 18, 18, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = colors.ink2;
        ctx.font = '600 11px "Geist Variable", sans-serif';
        ctx.fillText(p.name, p.x * W + 13, p.y * H + 4);
      });

      // Predicted paths with time ticks, then aircraft.
      state.flights.forEach((f) => {
        ctx.strokeStyle = levelColor(f.level);
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(f.x * W, f.y * H);
        for (let t = 1; t <= LOOKAHEAD; t++) {
          const p = project(f, t);
          ctx.lineTo(p.x * W, p.y * H);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        for (let t = 2; t <= LOOKAHEAD; t += 2) {
          const p = project(f, t);
          ctx.fillStyle = levelColor(f.level);
          ctx.beginPath();
          ctx.arc(p.x * W, p.y * H, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        const tgt = target(f);
        const ang = Math.atan2((tgt.y - f.y) * H, (tgt.x - f.x) * W);
        ctx.save();
        ctx.translate(f.x * W, f.y * H);
        ctx.rotate(ang);
        ctx.fillStyle = f.flash > 0 ? colors.accent : levelColor(f.level);
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = f.flash > 0 ? colors.accentFg : colors.ink3;
        ctx.font = '500 10px "Geist Mono Variable", monospace';
        const label = f.hold > 0 ? `${f.id} HOLD` : f.flash > 0 ? `${f.id} FL${f.level}` : `${f.id} FL${f.level}`;
        ctx.fillText(label, f.x * W + 10, f.y * H - 8);
      });

      // Conflict markers.
      state.conflicts.forEach((c) => {
        ctx.strokeStyle = colors.accentFg;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x * W, c.y * H, 14 + 6 * Math.sin(now * 8), 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    let statTimer = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!visible) return;
      step(dt);
      draw();
      statTimer += dt;
      if (statTimer > 0.4) {
        statTimer = 0;
        setStats({ flying: state.flights.length, resolved: state.resolved });
      }
    };
    raf = requestAnimationFrame(loop);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);

    const onClick = (e) => {
      const r = canvas.getBoundingClientRect();
      const s = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, r: 0.09, until: performance.now() / 1000 + 14 };
      state.storms.push(s);
      state.flights.forEach((f) => route(f, state.storms));
      sound.whoosh(0.4);
    };
    canvas.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div className="lab-demo">
      <div className="lab-controls">
        <div className="lab-buttons">
          <button
            type="button"
            className="chip lab-toggle"
            onClick={() => {
              sim.current.flights.push(makeFlight(sim.current.storms));
              sound.click();
            }}
          >
            <PlusIcon size={13} weight="bold" /> Add an aircraft
          </button>
          <span className="chip">
            <CloudLightningIcon size={14} /> Click the map to drop a storm cell
          </span>
        </div>
        <p className="lab-stats t-mono">
          {stats.flying} in the air, {stats.resolved} {stats.resolved === 1 ? 'conflict' : 'conflicts'} avoided
        </p>
      </div>
      <canvas ref={canvasRef} className="lab-canvas" aria-label="Simulated eVTOL traffic over the Kathmandu valley. Click to add a storm cell." />
      <p className="lab-note">
        Each aircraft projects its <Term id="4d-trajectory">4D path</Term> ten seconds ahead (dots every two seconds). When two projections meet at the same level and time, one climbs or holds. Storm cells force a detour. A sketch of the idea behind the{' '}
        <Term id="uam">UAM</Term> air traffic research, over places I know.
      </p>
    </div>
  );
}
