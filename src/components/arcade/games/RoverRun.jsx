import { useEffect, useRef, useState } from 'react';
import { ArrowFatUpIcon, HandPalmIcon, PauseIcon } from '@phosphor-icons/react';
import dict from '../../../i18n/ui/arcade-b';
import { localDigits, useLang, useT } from '../../../i18n';
import { sound } from '../../../lib/sound';
import { alpha, claim, clamp, font, isButtonKey, mixColor, pickJoke, rand, rr, useBest, useGameLoop, usePalette, useReduced, useStage } from './b-kit';
import { Hud, Pad, Panel, Pips } from './b-ui';

// Rover Run: Phase I of the autonomous delivery rover, on procedurally
// generated hill roads. Jump potholes, brake for cows that wander onto the
// road (never jump a cow), stop at village drop points to deliver, and grab
// the world-model chip to see the predicted path ahead for a few seconds.

export const meta = {
  title: 'Rover Run',
  blurb: 'Deliver parcels on Nepali hill roads with the Phase I rover.',
  controls: 'Space or Up to jump, hold Down or Left to brake.',
};

const LIVES = 3;
const G = 1000; // gravity, units per second squared
const JUMP_V = 310;
const AIR_T = (2 * JUMP_V) / G;
const WM_TIME = 7;
const HILL_DAY = '#8b9a6b';
const HILL_NIGHT = '#2c3a3c';

function makeRoad() {
  const p = [rand(0, 6), rand(0, 6), rand(0, 6), rand(0, 6)];
  const f = rand(0.85, 1.15);
  return (x) => 196 + 24 * Math.sin(x * 0.0042 * f + p[0]) + 11 * Math.sin(x * 0.0105 + p[1]) + 4 * Math.sin(x * 0.027 + p[2]) + 9 * Math.sin(x * 0.0013 + p[3]);
}

function newSim() {
  const road = makeRoad();
  return {
    road,
    x: 0,
    y: road(0),
    vy: 0,
    grounded: true,
    speed: 0,
    braking: false,
    jumpBuf: 0,
    lives: LIVES,
    inv: 0,
    dist: 0,
    bonus: 0,
    delivered: 0,
    streak: 0,
    wm: 0,
    t: 0,
    angle: 0,
    potholes: [],
    cows: [],
    drops: [],
    chips: [],
    decor: [],
    parts: [],
    msgs: [],
    next: 520,
    nextDrop: 900,
    nextChip: 1500,
    nextDecor: -200,
    shake: 0,
    over: false,
  };
}

const level = (s) => 1 + Math.floor(s.dist / 1600);
const cruise = (s) => Math.min(280, 135 + s.dist * 0.011);
const score = (s) => Math.floor(s.dist / 10) + s.bonus;

export default function RoverRun({ active = true, onScore }) {
  const t = useT(dict);
  const lang = useLang();
  const pal = usePalette();
  const reduce = useReduced();
  const { wrapRef, canvasRef, sizeRef, ctxRef } = useStage((w) => (w < 560 ? clamp(w * 0.9, 250, 380) : clamp(w * 0.5, 300, 440)));
  const rootRef = useRef(null);
  const sim = useRef(newSim());
  const [phase, setPhase] = useState('start');
  const [hud, setHud] = useState({ score: 0, dist: 0, delivered: 0, lives: LIVES, level: 1, wm: 0 });
  const [result, setResult] = useState(null);
  const [live, setLive] = useState('');
  const [braking, setBraking] = useState(false);
  const [best, submitBest] = useBest('rover-run');
  const hudT = useRef(0);
  const brakeSrc = useRef(new Set());
  const tRef = useRef(t);
  tRef.current = t;

  // Pause when the arcade hides this game.
  useEffect(() => {
    if (!active && phase === 'play') setPhase('paused');
  }, [active, phase]);

  const setBrake = (src, on) => {
    const set = brakeSrc.current;
    if (on) set.add(src);
    else set.delete(src);
    sim.current.braking = set.size > 0;
    setBraking(set.size > 0);
  };

  const jump = () => {
    const s = sim.current;
    if (phase !== 'play') return;
    if (s.grounded) doJump(s);
    else s.jumpBuf = 0.14;
  };
  function doJump(s) {
    s.vy = -JUMP_V;
    s.grounded = false;
    s.jumpBuf = 0;
    sound.flap();
  }

  const start = () => {
    sim.current = newSim();
    brakeSrc.current.clear();
    setBraking(false);
    setResult(null);
    setHud({ score: 0, dist: 0, delivered: 0, lives: LIVES, level: 1, wm: 0 });
    setPhase('play');
    sound.click();
    rootRef.current?.focus({ preventScroll: true });
  };

  const msg = (s, text, tone = 'ink') => {
    s.msgs.push({ text, x: s.x + 10, y: s.y - 60, t: 0, tone });
  };

  const crash = (s, kind) => {
    if (s.inv > 0) return;
    s.lives -= 1;
    s.inv = 1.5;
    s.speed *= 0.3;
    s.streak = 0;
    s.shake = reduce ? 0 : 0.35;
    sound.stamp();
    const text = kind === 'cow' ? tRef.current('rrCow') : tRef.current('rrPothole');
    msg(s, text, 'warn');
    setLive(text);
    if (!reduce) for (let i = 0; i < 14; i++) s.parts.push({ x: s.x, y: s.y - 10, vx: rand(-120, 120), vy: rand(-220, -40), life: rand(0.4, 0.8), c: 'dust' });
    if (s.lives <= 0) end(s);
  };

  const end = (s) => {
    s.over = true;
    const final = score(s);
    const isNew = submitBest(final);
    onScore?.(final);
    sound.bowl(0.8);
    setResult({ score: final, dist: s.dist, delivered: s.delivered, isNew, joke: pickJoke(['ai', 'nepal'], lang) });
    setHud((h) => ({ ...h, score: final, lives: 0 }));
    setPhase('over');
  };

  // ------------------------------------------------------------ update
  const update = (dt) => {
    const s = sim.current;
    if (s.over) return;
    const { w, h } = sizeRef.current;
    const U = h / 300;
    const vw = w / U;
    s.t += dt;
    const lv = level(s);
    const cr = cruise(s);
    const target = s.braking ? cr * 0.3 : cr;
    s.speed += clamp(target - s.speed, -420 * dt, 230 * dt);
    const dx = s.speed * dt;
    s.x += dx;
    s.dist += dx;
    s.inv = Math.max(0, s.inv - dt);
    s.wm = Math.max(0, s.wm - dt);
    s.shake = Math.max(0, s.shake - dt);
    s.jumpBuf = Math.max(0, s.jumpBuf - dt);

    // Vertical motion.
    const ground = s.road(s.x);
    if (s.grounded) {
      s.y = ground;
      const slope = (s.road(s.x + 10) - s.road(s.x - 10)) / 20;
      s.angle = Math.atan(slope);
      if (s.jumpBuf > 0) doJump(s);
    } else {
      s.vy += G * dt;
      s.y += s.vy * dt;
      s.angle += (clamp(s.vy / 900, -0.35, 0.35) - s.angle) * Math.min(1, dt * 6);
      if (s.y >= ground) {
        s.y = ground;
        s.vy = 0;
        s.grounded = true;
        if (!reduce) for (let i = 0; i < 5; i++) s.parts.push({ x: s.x + rand(-14, 14), y: ground, vx: rand(-60, 60), vy: rand(-80, -20), life: 0.4, c: 'dust' });
      }
    }

    // Spawn the road ahead.
    const ahead = s.x + vw + 160;
    while (s.next < ahead) {
      const x = s.next;
      const gapScale = Math.max(0.55, 1 - (lv - 1) * 0.07);
      if (x >= s.nextDrop) {
        s.drops.push({ x, w: 120, done: false, missed: false });
        s.nextDrop = x + rand(1300, 1900);
        s.next = x + 120 + rand(260, 340);
        continue;
      }
      const cowChance = Math.min(0.34, 0.12 + lv * 0.035);
      if (lv > 1 || x > 1400 ? Math.random() < cowChance : false) {
        s.cows.push({ x: x + 30, state: 'graze', k: 0, dur: rand(1.5, 2.2), depth: 1, hit: false, walk: rand(0, 6), flip: Math.random() < 0.5 });
        s.next = x + 90 + rand(320, 480) * gapScale;
      } else {
        const pw = rand(26, 36 + Math.min(18, lv * 3));
        s.potholes.push({ x, w: pw, hit: false, cleared: false, seed: Math.random() });
        s.next = x + pw + rand(230, 430) * gapScale;
      }
      if (x > s.nextChip) {
        s.chips.push({ x: x - 110, got: false });
        s.nextChip = x + rand(2000, 2800);
      }
    }
    while (s.nextDecor < ahead) {
      s.decor.push({ x: s.nextDecor, kind: Math.random() < 0.55 ? 'pine' : Math.random() < 0.5 ? 'house' : 'flags', size: rand(0.8, 1.2), seed: Math.random() });
      s.nextDecor += rand(90, 220);
    }

    // Potholes.
    for (const p of s.potholes) {
      if (p.hit || p.cleared) continue;
      if (s.x > p.x + p.w) {
        p.cleared = true;
        s.bonus += 5;
        continue;
      }
      if (s.grounded && s.x > p.x + 5 && s.x < p.x + p.w - 5) {
        p.hit = true;
        crash(s, 'pothole');
        s.vy = -200;
        s.grounded = false;
      }
    }

    // Cows: graze on the hillside, wander in, stand on the road, walk off.
    const trigger = Math.max(260, cr * 2.05);
    for (const c of s.cows) {
      c.walk += dt * (c.state === 'in' || c.state === 'out' ? 7 : 1.2);
      if (c.state === 'graze' && c.x - s.x < trigger) {
        c.state = 'in';
        c.k = 0;
      } else if (c.state === 'in') {
        c.k += dt / 0.9;
        c.depth = 1 - Math.min(1, c.k);
        if (c.k >= 1) {
          c.state = 'on';
          c.k = 0;
        }
      } else if (c.state === 'on') {
        c.k += dt;
        c.depth = 0;
        if (c.k >= c.dur) {
          c.state = 'out';
          c.k = 0;
        }
      } else if (c.state === 'out') {
        c.k += dt / 0.9;
        c.depth = -Math.min(1, c.k);
        if (c.k >= 1) c.state = 'gone';
      }
      const blocking = Math.abs(c.depth) < 0.55;
      if (!c.hit && blocking && Math.abs(c.x - s.x) < 34) {
        c.hit = true;
        crash(s, 'cow');
      }
    }

    // Drop points.
    for (const d of s.drops) {
      if (d.done || d.missed) continue;
      if (s.x > d.x && s.x < d.x + d.w && s.grounded && s.speed < cr * 0.55) {
        d.done = true;
        s.delivered += 1;
        s.streak += 1;
        const pts = 100 + 25 * (s.streak - 1) + 10 * lv;
        s.bonus += pts;
        sound.success();
        const text = tRef.current('rrDelivered', { n: localDigits(pts, lang) });
        msg(s, text, 'accent');
        setLive(text);
        if (!reduce) for (let i = 0; i < 10; i++) s.parts.push({ x: s.x, y: s.y - 30, vx: rand(-80, 120), vy: rand(-200, -80), life: rand(0.5, 0.9), c: 'accent' });
      } else if (s.x > d.x + d.w) {
        d.missed = true;
        s.streak = 0;
        sound.click();
        msg(s, tRef.current('rrMissed'), 'warn');
      }
    }

    // World-model chips.
    for (const c of s.chips) {
      if (c.got) continue;
      const cy = s.road(c.x) - 62;
      if (Math.abs(c.x - s.x) < 24 && Math.abs(cy - (s.y - 18)) < 28) {
        c.got = true;
        s.wm = WM_TIME;
        s.bonus += 25;
        sound.bowl(1.6);
        const text = tRef.current('rrWmOn');
        msg(s, text, 'accent');
        setLive(text);
      }
    }

    // Dust from the wheels.
    if (!reduce && s.grounded && s.speed > 60 && Math.random() < dt * 18) {
      s.parts.push({ x: s.x - 22, y: s.y - 2, vx: -rand(20, 60), vy: -rand(10, 40), life: 0.5, c: 'dust' });
    }
    for (const p of s.parts) {
      p.life -= dt;
      p.vy += 500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (const m of s.msgs) m.t += dt;

    // Forget what is behind us.
    const behind = s.x - 400;
    s.potholes = s.potholes.filter((p) => p.x + p.w > behind);
    s.cows = s.cows.filter((c) => c.x > behind);
    s.drops = s.drops.filter((d) => d.x + d.w > behind);
    s.chips = s.chips.filter((c) => c.x > behind && !c.got);
    s.decor = s.decor.filter((d) => d.x > behind - 200);
    s.parts = s.parts.filter((p) => p.life > 0);
    s.msgs = s.msgs.filter((m) => m.t < 1.4);

    hudT.current -= dt;
    if (hudT.current <= 0) {
      hudT.current = 0.15;
      setHud({ score: score(s), dist: s.dist, delivered: s.delivered, lives: s.lives, level: lv, wm: Math.ceil(s.wm) });
    }
  };

  // ------------------------------------------------------------ draw
  const draw = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const s = sim.current;
    const P = pal.current;
    const { w, h } = sizeRef.current;
    const U = h / 300;
    const vw = w / U;
    const roverSX = vw * 0.26;
    const cam = s.x - roverSX;
    const night = P.night;
    const tt = s.t;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.scale(U, U);
    if (s.shake > 0) ctx.translate(rand(-3, 3) * s.shake * 3, rand(-3, 3) * s.shake * 3);

    // Sky.
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, night ? mixColor(P.bg, '#000000', 0.25) : mixColor(P.bg, '#9cc3d9', 0.35));
    sky.addColorStop(0.7, night ? P.bg2 : mixColor(P.bg, P.accent, 0.12));
    sky.addColorStop(1, P.bg);
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, vw + 40, 340);
    if (night) {
      ctx.fillStyle = alpha(P.ink, 0.7);
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 97.3 - cam * 0.02) % (vw + 20) + vw + 20) % (vw + 20);
        const sy = (i * 53.7) % 120;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }
      ctx.fillStyle = alpha(P.ink, 0.85);
      ctx.beginPath();
      ctx.arc(vw * 0.8, 46, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mixColor(P.bg, '#000000', 0.2);
      ctx.beginPath();
      ctx.arc(vw * 0.8 + 6, 42, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = alpha(P.accent, 0.55);
      ctx.beginPath();
      ctx.arc(vw * 0.78, 52, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Far Himalaya with snow.
    const farX = (sx) => (sx + cam * 0.08) * 0.02;
    const farY = (sx) => {
      const x = farX(sx);
      return 128 - 34 * Math.abs(Math.sin(x)) - 18 * Math.abs(Math.sin(x * 2.3 + 1)) - 6 * Math.sin(x * 7.1);
    };
    ctx.beginPath();
    ctx.moveTo(-10, 300);
    for (let sx = -10; sx <= vw + 10; sx += 6) ctx.lineTo(sx, farY(sx));
    ctx.lineTo(vw + 10, 300);
    ctx.closePath();
    ctx.fillStyle = night ? mixColor(P.bg2, P.ink, 0.1) : mixColor(P.bg, '#7d8ca3', 0.4);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = night ? alpha(P.ink, 0.28) : alpha('#ffffff', 0.75);
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    for (let sx = -10; sx <= vw + 10; sx += 6) ctx.lineTo(sx, Math.max(farY(sx), 100 + 4 * Math.sin(sx * 0.2)));
    ctx.lineTo(vw + 10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Mid hills with terraces.
    const hill = night ? mixColor(P.bg, HILL_NIGHT, 0.7) : mixColor(P.bg, HILL_DAY, 0.55);
    const midY = (sx) => {
      const x = (sx + cam * 0.32) * 0.011;
      return 168 - 22 * Math.sin(x) - 10 * Math.sin(x * 2.7 + 2);
    };
    ctx.beginPath();
    ctx.moveTo(-10, 300);
    for (let sx = -10; sx <= vw + 10; sx += 5) ctx.lineTo(sx, midY(sx));
    ctx.lineTo(vw + 10, 300);
    ctx.closePath();
    ctx.fillStyle = hill;
    ctx.fill();
    ctx.strokeStyle = alpha(night ? P.ink : '#3f4a2c', 0.1);
    ctx.lineWidth = 1;
    for (let k = 1; k < 6; k++) {
      ctx.beginPath();
      for (let sx = -10; sx <= vw + 10; sx += 8) {
        const y = midY(sx) + k * 9 + 2 * Math.sin(sx * 0.05 + k);
        if (sx === -10) ctx.moveTo(sx, y);
        else ctx.lineTo(sx, y);
      }
      ctx.stroke();
    }

    const sxOf = (wx) => wx - cam;
    const road = s.road;

    // Decor behind the road.
    for (const d of s.decor) {
      const sx = sxOf(d.x);
      if (sx < -40 || sx > vw + 40) continue;
      const gy = road(d.x) - 6;
      if (d.kind === 'pine') {
        const hh = 34 * d.size;
        ctx.fillStyle = night ? mixColor(P.bg, '#1d2b2a', 0.8) : mixColor(HILL_DAY, '#2f3d22', 0.55);
        ctx.beginPath();
        ctx.moveTo(sx, gy - hh);
        ctx.lineTo(sx + 9 * d.size, gy);
        ctx.lineTo(sx - 9 * d.size, gy);
        ctx.closePath();
        ctx.fill();
      } else if (d.kind === 'house') {
        drawHouse(ctx, sx, gy, 0.8 * d.size, P, night, false);
      } else {
        ctx.strokeStyle = alpha(P.ink, 0.25);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx, gy - 34);
        ctx.quadraticCurveTo(sx + 30, gy - 24, sx + 60, gy - 36);
        ctx.stroke();
        const cols = ['#2f6fb5', '#f2f2f2', '#c8372d', '#3d8b4f', '#e2b52b'];
        for (let i = 0; i < 8; i++) {
          const u = (i + 0.5) / 8;
          const fx = sx + 60 * u;
          const fy = gy + (1 - u) * (1 - u) * -34 + 2 * u * (1 - u) * -24 + u * u * -36;
          ctx.fillStyle = alpha(cols[i % 5], night ? 0.55 : 0.85);
          const wave = reduce ? 0 : Math.sin(tt * 4 + i) * 1.2;
          ctx.fillRect(fx - 2.5, fy, 5, 6 + wave);
        }
      }
    }

    // Drop-point houses and flags.
    for (const d of s.drops) {
      const sx = sxOf(d.x + d.w / 2);
      if (sx < -80 || sx > vw + 80) continue;
      drawHouse(ctx, sx + 24, road(d.x + d.w / 2 + 24) - 8, 1.15, P, night, true);
      const fx = sxOf(d.x + d.w);
      const fy = road(d.x + d.w);
      ctx.strokeStyle = P.ink2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy - 46);
      ctx.stroke();
      ctx.fillStyle = d.done ? P.ink3 : P.accent;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 46);
      ctx.lineTo(fx + 16, fy - 41);
      ctx.lineTo(fx, fy - 36);
      ctx.closePath();
      ctx.fill();
    }

    // Cows that are behind the road (grazing or walking in).
    for (const c of s.cows) if (c.depth > 0.01) drawCow(ctx, sxOf(c.x), road(c.x), c, P, night);

    // Ground and road.
    const asphalt = night ? '#252a40' : '#4a4a50';
    const earth = night ? mixColor(P.bg, '#3a3326', 0.6) : mixColor(P.bg, '#8a6a45', 0.55);
    ctx.beginPath();
    ctx.moveTo(-10, 310);
    for (let sx = -10; sx <= vw + 10; sx += 4) ctx.lineTo(sx, road(cam + sx) + 16);
    ctx.lineTo(vw + 10, 310);
    ctx.closePath();
    ctx.fillStyle = earth;
    ctx.fill();
    ctx.beginPath();
    for (let sx = -10; sx <= vw + 10; sx += 4) {
      const y = road(cam + sx);
      if (sx === -10) ctx.moveTo(sx, y);
      else ctx.lineTo(sx, y);
    }
    for (let sx = vw + 10; sx >= -10; sx -= 4) ctx.lineTo(sx, road(cam + sx) + 17);
    ctx.closePath();
    ctx.fillStyle = asphalt;
    ctx.fill();
    // Centre dashes.
    ctx.strokeStyle = alpha('#f4efe2', night ? 0.35 : 0.6);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([12, 14]);
    ctx.lineDashOffset = cam % 26;
    ctx.beginPath();
    for (let sx = -10; sx <= vw + 10; sx += 4) {
      const y = road(cam + sx) + 8;
      if (sx === -10) ctx.moveTo(sx, y);
      else ctx.lineTo(sx, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Drop zones on the road.
    for (const d of s.drops) {
      const a = sxOf(d.x);
      if (a > vw + 10 || a + d.w < -10) continue;
      ctx.fillStyle = alpha(d.done ? P.ink3 : P.accent, d.done ? 0.2 : 0.35);
      ctx.beginPath();
      for (let x = 0; x <= d.w; x += 6) ctx.lineTo(a + x, road(d.x + x) + 1);
      for (let x = d.w; x >= 0; x -= 6) ctx.lineTo(a + x, road(d.x + x) + 16);
      ctx.closePath();
      ctx.fill();
      if (!d.done) {
        ctx.fillStyle = P.night ? P.ink : '#ffffff';
        ctx.font = font(9, 650, 'sans');
        ctx.textAlign = 'center';
        ctx.fillText(tRef.current('rrDrop'), a + d.w / 2, road(d.x + d.w / 2) + 12);
      }
    }

    // Potholes.
    for (const p of s.potholes) {
      const a = sxOf(p.x);
      if (a > vw + 10 || a + p.w < -10) continue;
      ctx.beginPath();
      const n = 7;
      for (let i = 0; i <= n; i++) {
        const x = (i / n) * p.w;
        const jag = i === 0 || i === n ? 0 : Math.sin(i * 3.1 + p.seed * 9) * 1.5;
        ctx.lineTo(a + x, road(p.x + x) - 0.5 + jag);
      }
      for (let i = n; i >= 0; i--) {
        const x = (i / n) * p.w;
        const dep = Math.sin((i / n) * Math.PI) * 13 + 3;
        ctx.lineTo(a + x, road(p.x + x) + dep);
      }
      ctx.closePath();
      ctx.fillStyle = night ? '#0b0d16' : '#26231f';
      ctx.fill();
      // A puddle shine.
      ctx.fillStyle = alpha(night ? '#6c7bb0' : '#9cc3d9', 0.35);
      const mid = road(p.x + p.w / 2);
      ctx.fillRect(a + p.w * 0.3, mid + 9, p.w * 0.4, 1.6);
    }

    // World-model chips.
    for (const c of s.chips) {
      const sx = sxOf(c.x);
      if (sx < -20 || sx > vw + 20) continue;
      const bob = reduce ? 0 : Math.sin(tt * 3 + c.x) * 3;
      const cy = road(c.x) - 62 + bob;
      ctx.fillStyle = alpha(P.accent, 0.2);
      ctx.beginPath();
      ctx.arc(sx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      rr(ctx, sx - 9, cy - 9, 18, 18, 4);
      ctx.fillStyle = P.accent;
      ctx.fill();
      ctx.strokeStyle = P.accentInk;
      ctx.lineWidth = 1.2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + i * 4, cy - 13);
        ctx.lineTo(sx + i * 4, cy - 9);
        ctx.moveTo(sx + i * 4, cy + 9);
        ctx.lineTo(sx + i * 4, cy + 13);
        ctx.stroke();
      }
      ctx.fillStyle = P.accentInk;
      ctx.font = font(7, 700, 'mono');
      ctx.textAlign = 'center';
      ctx.fillText('WM', sx, cy + 2.5);
    }

    // The world model's prediction of the path ahead.
    if (s.wm > 0) drawPrediction(ctx, s, cam, vw, P, tRef.current, reduce);

    // Rover.
    const blink = s.inv > 0 && !reduce && Math.floor(tt * 12) % 2 === 0;
    if (!blink) drawRover(ctx, roverSX, s.y, s.angle, s.x, s, P, night, reduce);

    // Cows in front of the road (standing on it or walking off).
    for (const c of s.cows) if (c.depth <= 0.01) drawCow(ctx, sxOf(c.x), road(c.x), c, P, night);

    // Particles.
    for (const p of s.parts) {
      ctx.fillStyle = p.c === 'accent' ? alpha(P.accent, clamp(p.life * 2, 0, 1)) : alpha(night ? P.ink2 : '#8a6a45', clamp(p.life, 0, 0.6));
      ctx.fillRect(sxOf(p.x) - 1.5, p.y - 1.5, 3, 3);
    }

    // Floating messages.
    ctx.textAlign = 'center';
    for (const m of s.msgs) {
      const a = clamp(1.4 - m.t, 0, 1);
      const y = m.y - m.t * (reduce ? 0 : 26);
      ctx.font = font(12, 700, 'display');
      const tw = ctx.measureText(m.text).width;
      const x = clamp(sxOf(m.x), tw / 2 + 8, vw - tw / 2 - 8);
      ctx.fillStyle = alpha(P.surface, 0.85 * a);
      rr(ctx, x - tw / 2 - 7, y - 13, tw + 14, 19, 9.5);
      ctx.fill();
      ctx.fillStyle = alpha(m.tone === 'accent' ? P.accentFg : m.tone === 'warn' ? (night ? '#fb923c' : '#c2410c') : P.ink, a);
      ctx.fillText(m.text, x, y + 1);
    }

    ctx.restore();
  };

  useGameLoop(
    phase === 'play',
    (dt) => {
      update(dt);
      draw();
    },
    rootRef,
  );

  // Still frames for the start, pause and game-over screens.
  useEffect(() => {
    if (phase !== 'play') draw();
  });

  // ------------------------------------------------------------ input
  const onKeyDown = (e) => {
    if (isButtonKey(e)) return;
    const k = e.key;
    if (phase === 'play') {
      if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
        claim(e);
        if (!e.repeat) jump();
      } else if (k === 'ArrowDown' || k === 'ArrowLeft' || k === 's' || k === 'S' || k === 'a' || k === 'A' || k === 'Shift') {
        claim(e);
        setBrake('key', true);
      } else if (k === 'p' || k === 'P' || k === 'Escape') {
        claim(e);
        setPhase('paused');
      }
    } else if ((k === ' ' || k === 'Enter') && phase !== 'play') {
      claim(e);
      if (phase === 'paused') setPhase('play');
      else start();
    }
  };
  const onKeyUp = (e) => {
    const k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowLeft' || k === 's' || k === 'S' || k === 'a' || k === 'A' || k === 'Shift') setBrake('key', false);
  };

  const onPointerDown = (e) => {
    if (phase !== 'play') return;
    rootRef.current?.focus({ preventScroll: true });
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width * 0.45) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setBrake(`p${e.pointerId}`, true);
    } else jump();
  };
  const onPointerUp = (e) => setBrake(`p${e.pointerId}`, false);

  useEffect(() => {
    if (phase !== 'play') {
      brakeSrc.current.clear();
      sim.current.braking = false;
      setBraking(false);
    }
  }, [phase]);

  const km = (d) => `${localDigits((d / 1000).toFixed(2), lang)} ${t('km')}`;

  return (
    <div ref={rootRef} className="bx-root" tabIndex={0} onKeyDown={onKeyDown} onKeyUp={onKeyUp} aria-roledescription={t('game')} aria-label={t('rrTitle')}>
      <Hud
        items={[
          { id: 's', label: t('score'), value: hud.score, tone: 'accent' },
          { id: 'd', label: t('rrDist'), value: km(hud.dist) },
          { id: 'p', label: t('rrParcels'), value: hud.delivered },
          { id: 'l', label: t('lives'), value: <Pips total={LIVES} left={hud.lives} label={t('lives')} /> },
          { id: 'v', label: t('level'), value: hud.level },
          ...(hud.wm > 0 ? [{ id: 'w', label: t('rrWm'), value: `${localDigits(hud.wm, lang)} ${t('sec')}`, tone: 'accent' }] : []),
        ]}
      />
      <div ref={wrapRef} className="bx-stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp}>
        <canvas ref={canvasRef} role="img" aria-label={t('rrCanvas')} />
        {phase === 'start' && (
          <Panel kicker={t('rrKicker')} title={t('rrTitle')} primary={{ label: t('start'), onClick: start }}>
            <p>{t('rrIntro')}</p>
            <ul className="bx-keys">
              <li>
                <b>{t('rrKeyJump')}</b>
                <span>{t('rrJumpHow')}</span>
              </li>
              <li>
                <b>{t('rrKeyBrake')}</b>
                <span>{t('rrBrakeHow')}</span>
              </li>
              <li>
                <b>{t('rrKeyDrop')}</b>
                <span>{t('rrDropHow')}</span>
              </li>
              <li>
                <b>WM</b>
                <span>{t('rrWmHow')}</span>
              </li>
            </ul>
          </Panel>
        )}
        {phase === 'paused' && (
          <Panel kicker={t('rrTitle')} title={t('paused')} primary={{ label: t('resume'), onClick: () => setPhase('play') }} secondary={{ label: t('restart'), onClick: start }}>
            <p>{t('pausedBody')}</p>
          </Panel>
        )}
        {phase === 'over' && result && (
          <Panel kicker={result.isNew ? t('newBest') : t('gameOver')} title={t('rrOverTitle')} primary={{ label: t('again'), onClick: start }}>
            <p className="bx-big">{localDigits(result.score.toLocaleString('en-US'), lang)}</p>
            <p>{t('rrOverBody', { d: km(result.dist), n: localDigits(result.delivered, lang) })}</p>
            <p>{t('bestLine', { n: localDigits(Math.max(best, result.score).toLocaleString('en-US'), lang) })}</p>
            {result.joke && <p className="bx-joke">{result.joke}</p>}
          </Panel>
        )}
      </div>
      <div className="bx-controls">
        <div className="bx-pads">
          <Pad label={t('rrKeyBrake')} pressed={braking} onDown={() => setBrake('pad', true)} onUp={() => setBrake('pad', false)} disabled={phase !== 'play'}>
            <HandPalmIcon size={18} weight="bold" aria-hidden="true" />
            <span>{t('rrKeyBrake')}</span>
          </Pad>
          <Pad label={t('rrKeyJump')} className="bx-pad-accent" onDown={jump} disabled={phase !== 'play'}>
            <ArrowFatUpIcon size={18} weight="bold" aria-hidden="true" />
            <span>{t('rrKeyJump')}</span>
          </Pad>
          <Pad label={t('pause')} onDown={() => setPhase('paused')} disabled={phase !== 'play'}>
            <PauseIcon size={18} weight="bold" aria-hidden="true" />
          </Pad>
        </div>
        <p className="bx-hint">{t('rrHint')}</p>
      </div>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  );
}

// ------------------------------------------------------------ art

function drawHouse(ctx, x, gy, k, P, night, isDrop) {
  const w = 30 * k;
  const h = 20 * k;
  ctx.fillStyle = night ? '#4a2f2a' : '#a4583c';
  ctx.fillRect(x - w / 2, gy - h, w, h);
  // Upper floor, slightly smaller.
  ctx.fillStyle = night ? '#563630' : '#b4674a';
  ctx.fillRect(x - w / 2 + 2 * k, gy - h - 12 * k, w - 4 * k, 12 * k);
  // Tin roof.
  ctx.fillStyle = night ? '#5b6378' : '#8f98a6';
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 4 * k, gy - h - 12 * k);
  ctx.lineTo(x, gy - h - 22 * k);
  ctx.lineTo(x + w / 2 + 4 * k, gy - h - 12 * k);
  ctx.closePath();
  ctx.fill();
  // Windows (lit at night).
  ctx.fillStyle = night ? '#f5c66b' : '#3b2a22';
  ctx.fillRect(x - w / 2 + 6 * k, gy - h - 8 * k, 5 * k, 5 * k);
  ctx.fillRect(x + w / 2 - 11 * k, gy - h - 8 * k, 5 * k, 5 * k);
  ctx.fillStyle = night ? '#2a1a16' : '#5a3426';
  ctx.fillRect(x - 3.5 * k, gy - 11 * k, 7 * k, 11 * k);
  if (isDrop) {
    ctx.fillStyle = P.accent;
    ctx.fillRect(x - w / 2, gy - h - 1.5 * k, w, 2.5 * k);
  }
}

function drawCow(ctx, sx, roadY, c, P, night) {
  const d = c.depth;
  const k = 1 - Math.abs(d) * 0.22 + (d < 0 ? Math.abs(d) * 0.35 : 0);
  const y = roadY - 2 + (d > 0 ? -d * 30 : -d * 26);
  const a = d > 0.6 ? 0.8 : 1;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(sx, y);
  ctx.scale(c.flip ? -k : k, k);
  const body = night ? '#c9c2b4' : '#f1ebdf';
  const patch = night ? '#5a4a3f' : '#8b5a3c';
  const leg = Math.sin(c.walk) * 3;
  ctx.strokeStyle = night ? '#a39c8f' : '#6b5a4a';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  [-11, -6, 8, 13].forEach((lx, i) => {
    ctx.beginPath();
    ctx.moveTo(lx, -14);
    ctx.lineTo(lx + (i % 2 ? leg : -leg), 0);
    ctx.stroke();
  });
  ctx.fillStyle = body;
  rr(ctx, -17, -30, 34, 18, 8);
  ctx.fill();
  ctx.fillStyle = patch;
  ctx.beginPath();
  ctx.ellipse(-5, -24, 6, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Hump (zebu) and head.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(11, -30, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(21, -28, 6, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = night ? '#8f887c' : '#6b5a4a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(19, -32);
  ctx.quadraticCurveTo(17, -38, 20, -40);
  ctx.moveTo(23, -32);
  ctx.quadraticCurveTo(26, -37, 24, -40);
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(23, -29, 0.9, 0, Math.PI * 2);
  ctx.fill();
  // Tail.
  ctx.strokeStyle = night ? '#a39c8f' : '#6b5a4a';
  ctx.beginPath();
  ctx.moveTo(-17, -26);
  ctx.quadraticCurveTo(-23, -20 + Math.sin(c.walk * 0.7) * 2, -21, -12);
  ctx.stroke();
  // A tika and marigold garland: a well-loved cow.
  ctx.fillStyle = '#f0a020';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(14 + i * 1.6, -24 + i * 1.2, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#c8372d';
  ctx.beginPath();
  ctx.arc(24, -31, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawRover(ctx, sx, y, angle, x, s, P, night, reduce) {
  ctx.save();
  ctx.translate(sx, y);
  ctx.rotate(angle);
  // Wheels.
  const spin = x / 6;
  [-15, 0, 15].forEach((wx) => {
    ctx.fillStyle = night ? '#0d0f18' : '#1f2027';
    ctx.beginPath();
    ctx.arc(wx, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = night ? '#6d7186' : '#8b8d96';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(wx + Math.cos(spin) * 4, -6 + Math.sin(spin) * 4);
    ctx.lineTo(wx - Math.cos(spin) * 4, -6 - Math.sin(spin) * 4);
    ctx.stroke();
  });
  // Rocker arm.
  ctx.strokeStyle = night ? '#9aa0b8' : '#5d6170';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-15, -6);
  ctx.lineTo(-6, -13);
  ctx.lineTo(15, -6);
  ctx.stroke();
  // Body.
  rr(ctx, -22, -28, 44, 15, 4);
  ctx.fillStyle = night ? '#d9d4c7' : '#f4f0e6';
  ctx.fill();
  ctx.strokeStyle = night ? '#9aa0b8' : '#3b3d46';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = P.accent;
  ctx.fillRect(-22, -19, 44, 3);
  ctx.fillStyle = '#16181f';
  ctx.font = font(6, 700, 'mono');
  ctx.textAlign = 'left';
  ctx.fillText('SS-01', -19, -22);
  // Parcel on the deck.
  ctx.fillStyle = '#c99a5b';
  ctx.fillRect(-14, -37, 13, 9);
  ctx.strokeStyle = '#8a6430';
  ctx.beginPath();
  ctx.moveTo(-7.5, -37);
  ctx.lineTo(-7.5, -28);
  ctx.stroke();
  // Sensor mast with a spinning lidar.
  ctx.strokeStyle = night ? '#9aa0b8' : '#3b3d46';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(14, -28);
  ctx.lineTo(14, -40);
  ctx.stroke();
  ctx.fillStyle = night ? '#1f2336' : '#2b2d36';
  rr(ctx, 9, -45, 10, 6, 3);
  ctx.fill();
  const ph = reduce ? 0.5 : (s.t * 3) % 1;
  ctx.fillStyle = P.accent;
  ctx.fillRect(9 + ph * 8, -44, 2, 4);
  // Headlight beam at night.
  if (night) {
    const g = ctx.createLinearGradient(22, -20, 90, -10);
    g.addColorStop(0, 'rgba(255,236,180,0.35)');
    g.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(22, -22);
    ctx.lineTo(95, -34);
    ctx.lineTo(95, 2);
    ctx.lineTo(22, -16);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(20, -22, 2.5, 4);
  ctx.restore();
}

function drawPrediction(ctx, s, cam, vw, P, t, reduce) {
  const road = s.road;
  const a = clamp(s.wm, 0, 1);
  const col = P.accentFg;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = alpha(col, 0.9);
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 5]);
  ctx.lineDashOffset = reduce ? 0 : -s.t * 30;
  const v = Math.max(120, s.speed);
  const reach = s.x + Math.min(vw * 0.75, v * 3.2);
  // Path along the road, with jump arcs over potholes.
  ctx.beginPath();
  let x = s.x + 6;
  ctx.moveTo(x - cam, road(x) - 22);
  const holes = s.potholes.filter((p) => !p.hit && p.x + p.w > s.x && p.x < reach).sort((m, n) => m.x - n.x);
  for (const p of holes) {
    const span = v * AIR_T;
    const take = p.x + p.w / 2 - span / 2;
    if (take > x) {
      for (let q = x; q < take; q += 8) ctx.lineTo(q - cam, road(q) - 22);
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        const qx = take + span * u;
        const base = road(take) + (road(take + span) - road(take)) * u;
        ctx.lineTo(qx - cam, base - 22 - 4 * (JUMP_V * JUMP_V) / (2 * G) * u * (1 - u));
      }
      x = take + span;
    }
  }
  for (let q = x; q < reach; q += 8) ctx.lineTo(q - cam, road(q) - 22);
  ctx.stroke();
  ctx.setLineDash([]);
  // Labels.
  ctx.font = font(8, 650, 'sans');
  ctx.textAlign = 'center';
  const tag = (wx, y, text) => {
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = alpha(P.surface, 0.9);
    rr(ctx, wx - cam - tw / 2 - 5, y - 9, tw + 10, 13, 6.5);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.fillText(text, wx - cam, y + 0.5);
  };
  for (const p of holes) tag(p.x + p.w / 2, road(p.x) - 70, t('rrWmJump'));
  for (const c of s.cows) {
    if (c.hit || c.state === 'gone' || c.x < s.x || c.x > reach) continue;
    const bx = c.x - 70;
    ctx.fillStyle = alpha(col, 0.14);
    ctx.fillRect(bx - cam, road(bx) - 50, 70, 50);
    tag(c.x - 35, road(c.x) - 58, t('rrWmBrake'));
  }
  for (const d of s.drops) {
    if (d.done || d.x > reach || d.x + d.w < s.x) continue;
    tag(d.x + d.w / 2, road(d.x) - 64, t('rrWmStop'));
  }
  ctx.restore();
}
