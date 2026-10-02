import { useEffect, useMemo, useRef, useState } from 'react';
import { HandGrabbingIcon, PauseIcon } from '@phosphor-icons/react';
import dict from '../../../i18n/ui/arcade-b';
import { localDigits, useLang, useT } from '../../../i18n';
import { sound } from '../../../lib/sound';
import { useWeather } from '../../../lib/weather';
import { alpha, claim, clamp, font, isButtonKey, mixColor, pickJoke, rand, rr, seeded, useBest, useGameLoop, usePalette, useReduced, useStage } from './b-kit';
import { Hud, Pad, Panel, Pips } from './b-ui';

// Kite Fight (Changa Chet): a Dashain kite fight over Kathmandu rooftops.
// Steer by dragging or with the arrow keys. When your string crosses a
// rival's, a tug of war starts: saw your string (move fast) and pull (Space,
// the Pull pad or a quick tap) to cut theirs before they cut yours. The
// real Lalitpur wind sets the breeze; gusts come with a warning.

export const meta = {
  title: 'Kite Fight',
  blurb: 'Changa chet! A Dashain kite fight over Kathmandu rooftops.',
  controls: 'Drag or arrow keys to steer, Space to pull.',
};

const LIVES = 3;
const RIVAL_COLS = ['#2f6fb5', '#c8372d', '#3d8b4f', '#e2b52b', '#1f8a8a', '#d0587e'];
const SEGS = 12;

function skyline(seed) {
  const r = seeded(seed);
  const out = [];
  let x = -20;
  while (x < 1600) {
    const w = 34 + r() * 46;
    const top = 222 + r() * 44;
    out.push({ x, w, top, tank: r() < 0.5, dish: r() < 0.25, rail: r() < 0.4, line: r() < 0.25, tone: r() });
    x += w + r() * 3;
  }
  return out;
}

const roofAt = (bs, x) => {
  for (const b of bs) if (x >= b.x && x <= b.x + b.w) return b.top - (b.tank && x > b.x + b.w * 0.6 && x < b.x + b.w * 0.6 + 14 ? 14 : 0);
  return 270;
};

// Quadratic string from the hand to the kite, sagging downwind.
function stringPts(ax, ay, kx, ky, sag) {
  const cx = (ax + kx) / 2 + sag * 0.3;
  const cy = (ay + ky) / 2 + sag;
  const pts = [];
  for (let i = 0; i <= SEGS; i++) {
    const u = i / SEGS;
    const a = (1 - u) * (1 - u);
    const b = 2 * u * (1 - u);
    const c = u * u;
    pts.push([a * ax + b * cx + c * kx, a * ay + b * cy + c * ky]);
  }
  return pts;
}

function segHit(p, q, r, s) {
  const d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]);
  if (Math.abs(d) < 1e-6) return null;
  const u = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d;
  const v = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d;
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  return [p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1])];
}

function crossing(a, b) {
  // Skip the hand ends, which sit far apart on different roofs anyway.
  for (let i = 1; i < a.length - 1; i++) for (let j = 1; j < b.length - 1; j++) {
    const hit = segHit(a[i], a[i + 1], b[j], b[j + 1]);
    if (hit) return hit;
  }
  return null;
}

function newSim(seed) {
  return {
    seed,
    bs: skyline(seed),
    t: 0,
    kite: { x: 0, y: 0, vx: 0, vy: 0, state: 'fly', k: 0, tail: [] },
    lives: LIVES,
    score: 0,
    cuts: 0,
    combo: 0,
    rivals: [],
    nextRival: 1.2,
    pullCd: 0,
    gust: { state: 'calm', k: rand(6, 10), dir: 1, force: 0 },
    shout: null,
    parts: [],
    over: false,
    airT: 0,
  };
}

const level = (s) => 1 + Math.floor(s.cuts / 3);

export default function KiteFight({ active = true, onScore }) {
  const t = useT(dict);
  const lang = useLang();
  const pal = usePalette();
  const reduce = useReduced();
  const weather = useWeather();
  const { wrapRef, canvasRef, sizeRef, ctxRef } = useStage((w) => (w < 560 ? clamp(w * 1.15, 320, 460) : clamp(w * 0.55, 340, 480)));
  const rootRef = useRef(null);
  const sim = useRef(newSim(7));
  const [phase, setPhase] = useState('start');
  const [hud, setHud] = useState({ score: 0, cuts: 0, lives: LIVES, level: 1 });
  const [result, setResult] = useState(null);
  const [live, setLive] = useState('');
  const [best, submitBest] = useBest('kite-fight');
  const keys = useRef(new Set());
  const drag = useRef(null);
  const hudT = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;

  // Live wind in Lalitpur (km/h) sets the base breeze.
  const windKmh = weather?.wind ?? null;
  const base = useMemo(() => (windKmh == null ? 0.6 : clamp(windKmh / 18, 0.3, 1.3)), [windKmh]);
  const baseRef = useRef(base);
  baseRef.current = base;

  useEffect(() => {
    if (!active && phase === 'play') setPhase('paused');
  }, [active, phase]);

  const layout = () => {
    const { w, h } = sizeRef.current;
    const U = h / 300;
    const vw = w / U;
    const s = sim.current;
    const ax = vw * 0.2;
    const ay = roofAt(s.bs, ax) - 16;
    return { U, vw, ax, ay };
  };

  const resetKite = (s) => {
    const { ax, ay } = layout();
    Object.assign(s.kite, { x: ax + 60, y: ay - 150, vx: 0, vy: 0, state: 'fly', k: 0, tail: [] });
  };

  const start = () => {
    const s = newSim(Math.floor(rand(1, 1e6)));
    sim.current = s;
    resetKite(s);
    keys.current.clear();
    drag.current = null;
    setResult(null);
    setHud({ score: 0, cuts: 0, lives: LIVES, level: 1 });
    setPhase('play');
    sound.click();
    rootRef.current?.focus({ preventScroll: true });
  };

  const pull = () => {
    const s = sim.current;
    if (phase !== 'play' || s.pullCd > 0 || s.kite.state !== 'fly') return;
    s.pullCd = 0.09;
    let any = false;
    for (const r of s.rivals) {
      if (r.cross) {
        r.mine += 8;
        any = true;
      }
    }
    if (any) sound.flap();
    else {
      // A pull with nothing crossed gives a little lift.
      s.kite.vy -= 40;
    }
  };

  const spawnRival = (s) => {
    const { vw } = layout();
    const used = s.rivals.map((r) => r.ax);
    let ax = rand(vw * 0.5, vw * 0.97);
    for (let tries = 0; tries < 6 && used.some((u) => Math.abs(u - ax) < 40); tries++) ax = rand(vw * 0.5, vw * 0.97);
    const ay = roofAt(s.bs, ax) - 16;
    const lv = level(s);
    s.rivals.push({
      id: Math.random(),
      ax,
      ay,
      x: ax - 20,
      y: ay - 40,
      vx: 0,
      vy: -60,
      col: RIVAL_COLS[Math.floor(rand(0, RIVAL_COLS.length))],
      state: 'fly',
      k: 0,
      mine: 0,
      theirs: 0,
      cross: null,
      power: 9 + lv * 3.2 + rand(-2, 2),
      speed: 70 + lv * 12,
      aggro: Math.min(0.85, 0.3 + lv * 0.1),
      wob: rand(0, 6),
      mode: 'wander',
      modeT: rand(1.5, 3),
      tail: [],
      spin: 0,
    });
  };

  const end = (s) => {
    s.over = true;
    const final = Math.round(s.score);
    const isNew = submitBest(final);
    onScore?.(final);
    sound.bowl(0.8);
    setResult({ score: final, cuts: s.cuts, isNew, joke: pickJoke(['nepal'], lang) });
    setHud((hh) => ({ ...hh, score: final, lives: 0 }));
    setPhase('over');
  };

  const loseKite = (s, why) => {
    if (s.kite.state !== 'fly') return;
    s.kite.state = 'falling';
    s.kite.k = 0;
    s.lives -= 1;
    s.combo = 0;
    for (const r of s.rivals) {
      r.mine = 0;
      r.theirs = 0;
      r.cross = null;
    }
    sound.stamp();
    const text = why === 'roof' ? tRef.current('kfSnag') : tRef.current('kfLost');
    s.shout = { text, t: 0, tone: 'warn' };
    setLive(text);
  };

  // ------------------------------------------------------------ update
  const update = (dt) => {
    const s = sim.current;
    if (s.over) return;
    const { vw, ax, ay } = layout();
    s.t += dt;
    s.pullCd = Math.max(0, s.pullCd - dt);
    const lv = level(s);
    const wind = baseRef.current;

    // Gusts: a warning, then a shove.
    const g = s.gust;
    g.k -= dt;
    if (g.state === 'calm' && g.k <= 0) {
      g.state = 'warn';
      g.k = 1.3;
      g.dir = Math.random() < 0.5 ? -1 : 1;
      setLive(tRef.current('kfGustWarn'));
    } else if (g.state === 'warn' && g.k <= 0) {
      g.state = 'gust';
      g.k = 2;
      g.force = (90 + lv * 12) * g.dir;
      sound.whoosh(1.2);
    } else if (g.state === 'gust' && g.k <= 0) {
      g.state = 'calm';
      g.force = 0;
      g.k = rand(7, 12) / Math.min(1.6, 0.9 + lv * 0.08);
    }
    const gx = g.state === 'gust' ? g.force * Math.sin((1 - g.k / 2) * Math.PI) : 0;

    // Player kite.
    const k = s.kite;
    if (k.state === 'fly') {
      s.airT += dt;
      s.score += dt * 2;
      let axc = wind * 34 + gx;
      let ayc = 26 * (1 - wind); // weak wind: the kite sinks
      if (drag.current) {
        axc += (drag.current.x - k.x) * 9 - k.vx * 3.2;
        ayc += (drag.current.y - k.y) * 9 - k.vy * 3.2;
      }
      const ks = keys.current;
      const thrust = 520;
      if (ks.has('left')) axc -= thrust;
      if (ks.has('right')) axc += thrust;
      if (ks.has('up')) ayc -= thrust;
      if (ks.has('down')) ayc += thrust;
      k.vx += axc * dt;
      k.vy += ayc * dt;
      const damp = Math.exp(-dt * 2.2);
      k.vx *= damp;
      k.vy *= damp;
      const sp = Math.hypot(k.vx, k.vy);
      if (sp > 330) {
        k.vx *= 330 / sp;
        k.vy *= 330 / sp;
      }
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      // String length and screen bounds.
      const maxLen = Math.max(220, vw * 0.85);
      const dx = k.x - ax;
      const dy = k.y - ay;
      const len = Math.hypot(dx, dy);
      if (len > maxLen) {
        k.x = ax + (dx / len) * maxLen;
        k.y = ay + (dy / len) * maxLen;
      }
      if (k.x < 12) (k.x = 12), (k.vx = Math.abs(k.vx) * 0.3);
      if (k.x > vw - 12) (k.x = vw - 12), (k.vx = -Math.abs(k.vx) * 0.3);
      if (k.y < 16) (k.y = 16), (k.vy = Math.abs(k.vy) * 0.3);
      if (k.y > roofAt(s.bs, k.x) - 10) loseKite(s, 'roof');
    } else {
      k.k += dt;
      k.vy = Math.min(90, k.vy + 120 * dt);
      k.vx += (wind * 30 + gx * 0.5 - k.vx) * dt;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      if (k.k > 1.6) {
        if (s.lives <= 0) {
          end(s);
          return;
        }
        resetKite(s);
        sound.click();
      }
    }
    k.tail.unshift([k.x, k.y]);
    if (k.tail.length > 9) k.tail.length = 9;

    const sag = 14 + 26 * (1 - wind);
    const mine = k.state === 'fly' ? stringPts(ax, ay, k.x, k.y + 9, sag) : null;

    // Rivals.
    const maxRivals = Math.min(4, 1 + Math.floor((lv + 1) / 2));
    const flying = s.rivals.filter((r) => r.state === 'fly').length;
    s.nextRival -= dt;
    if (flying < maxRivals && s.nextRival <= 0 && k.state === 'fly') {
      spawnRival(s);
      s.nextRival = rand(2, 4);
    }
    for (const r of s.rivals) {
      r.tail.unshift([r.x, r.y]);
      if (r.tail.length > 9) r.tail.length = 9;
      if (r.state !== 'fly') {
        r.k += dt;
        r.vy = Math.min(70, r.vy + 90 * dt);
        r.vx += (wind * 40 + gx * 0.6 - r.vx) * dt;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        r.spin += dt * (reduce ? 0 : 5);
        continue;
      }
      r.modeT -= dt;
      if (r.modeT <= 0) {
        r.mode = Math.random() < r.aggro && k.state === 'fly' ? 'hunt' : 'wander';
        r.modeT = rand(2, 4);
      }
      let tx;
      let ty;
      if (r.mode === 'hunt' && mine) {
        const p = mine[Math.floor(SEGS * 0.65)];
        tx = p[0] + Math.sin(s.t * 1.7 + r.wob) * 30;
        ty = p[1] - 30 + Math.cos(s.t * 1.3 + r.wob) * 20;
      } else {
        tx = clamp(r.ax - 90 + Math.sin(s.t * 0.6 + r.wob) * 80, vw * 0.3, vw - 20);
        ty = 70 + Math.sin(s.t * 0.8 + r.wob * 2) * 40;
      }
      r.vx += ((tx - r.x) * 3 - r.vx * 1.6 + gx * 0.6 + wind * 10) * dt;
      r.vy += ((ty - r.y) * 3 - r.vy * 1.6) * dt;
      const sp = Math.hypot(r.vx, r.vy);
      if (sp > r.speed) {
        r.vx *= r.speed / sp;
        r.vy *= r.speed / sp;
      }
      r.x = clamp(r.x + r.vx * dt, 12, vw - 12);
      r.y = clamp(r.y + r.vy * dt, 16, roofAt(s.bs, r.x) - 30);

      // Crossed strings: the tug of war.
      const theirs = stringPts(r.ax, r.ay, r.x, r.y + 9, sag);
      r.cross = mine ? crossing(mine, theirs) : null;
      if (r.cross) {
        const saw = Math.hypot(k.vx, k.vy);
        r.mine += saw * 0.075 * dt;
        r.theirs += r.power * dt;
        if (!reduce && Math.random() < dt * 20) s.parts.push({ x: r.cross[0], y: r.cross[1], vx: rand(-40, 40), vy: rand(-40, 10), life: 0.35, c: 'spark' });
      } else {
        r.mine = Math.max(0, r.mine - 14 * dt);
        r.theirs = Math.max(0, r.theirs - 14 * dt);
      }
      if (r.mine >= 100) {
        r.state = 'cut';
        r.k = 0;
        r.vx = wind * 40;
        r.vy = -20;
        s.cuts += 1;
        s.combo += 1;
        const pts = 100 * s.combo + 20 * lv;
        s.score += pts;
        sound.success();
        sound.whoosh(0.8);
        s.shout = { text: tRef.current('kfChet'), sub: `+${localDigits(pts, lang)}`, t: 0, tone: 'accent' };
        setLive(`${tRef.current('kfChet')} +${pts}`);
        if (!reduce) for (let i = 0; i < 16; i++) s.parts.push({ x: r.cross[0], y: r.cross[1], vx: rand(-120, 120), vy: rand(-140, 60), life: rand(0.4, 0.8), c: 'accent' });
        r.cross = null;
        s.nextRival = Math.max(s.nextRival, 1.2);
      } else if (r.theirs >= 100) {
        r.theirs = 0;
        r.mine = 0;
        loseKite(s, 'cut');
      }
    }
    s.rivals = s.rivals.filter((r) => r.state === 'fly' || (r.k < 4 && r.y < 340));

    for (const p of s.parts) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
    }
    s.parts = s.parts.filter((p) => p.life > 0);
    if (s.shout) {
      s.shout.t += dt;
      if (s.shout.t > 1.5) s.shout = null;
    }

    hudT.current -= dt;
    if (hudT.current <= 0) {
      hudT.current = 0.2;
      setHud({ score: Math.round(s.score), cuts: s.cuts, lives: s.lives, level: lv });
    }
  };

  // ------------------------------------------------------------ draw
  const draw = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const s = sim.current;
    const P = pal.current;
    const { w, h } = sizeRef.current;
    const { U, vw, ax, ay } = layout();
    const night = P.night;
    const wind = baseRef.current;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.scale(U, U);

    // Sky: Dashain falls in Sharad, clear and high.
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, night ? mixColor(P.bg, '#000000', 0.3) : mixColor(P.bg, '#7fb2d6', 0.5));
    sky.addColorStop(0.75, night ? P.bg2 : mixColor(P.bg, '#bcd6e6', 0.4));
    sky.addColorStop(1, night ? P.bg3 : mixColor(P.bg, P.accent, 0.15));
    ctx.fillStyle = sky;
    ctx.fillRect(-10, -10, vw + 20, 320);
    if (night) {
      ctx.fillStyle = alpha(P.ink, 0.6);
      for (let i = 0; i < 46; i++) ctx.fillRect((i * 71.3) % vw, (i * 37.1) % 170, 1.2, 1.2);
    }
    // Clouds drifting with the wind.
    ctx.fillStyle = alpha(night ? P.ink : '#ffffff', night ? 0.06 : 0.55);
    for (let i = 0; i < 4; i++) {
      const cx = (((i * 260 + s.t * (6 + wind * 10) * (reduce ? 0 : 1)) % (vw + 160)) + vw + 160) % (vw + 160) - 80;
      const cy = 40 + i * 28;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 44, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 22, cy - 6, 24, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Valley hills and Swayambhu on its hill.
    ctx.fillStyle = night ? mixColor(P.bg2, P.ink, 0.08) : mixColor(P.bg, '#6f8a74', 0.4);
    ctx.beginPath();
    ctx.moveTo(-10, 300);
    for (let x = -10; x <= vw + 10; x += 8) ctx.lineTo(x, 196 - 20 * Math.sin(x * 0.009 + 1) - 10 * Math.sin(x * 0.023));
    ctx.lineTo(vw + 10, 300);
    ctx.closePath();
    ctx.fill();
    const sx = vw * 0.72;
    const sy = 196 - 20 * Math.sin(sx * 0.009 + 1) - 10 * Math.sin(sx * 0.023) - 2;
    ctx.fillStyle = night ? mixColor(P.bg2, P.ink, 0.25) : '#f3efe6';
    ctx.beginPath();
    ctx.arc(sx, sy, 11, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = night ? mixColor(P.bg2, P.accent, 0.5) : '#d6a63a';
    ctx.fillRect(sx - 4, sy - 17, 8, 6);
    ctx.beginPath();
    ctx.moveTo(sx - 3.5, sy - 17);
    ctx.lineTo(sx, sy - 32);
    ctx.lineTo(sx + 3.5, sy - 17);
    ctx.closePath();
    ctx.fill();

    // Rooftops.
    for (const b of s.bs) {
      if (b.x > vw + 10 || b.x + b.w < -10) continue;
      const tone = night ? mixColor(P.bg2, '#2a2f4a', 0.4 + b.tone * 0.4) : mixColor('#b9a58c', '#d9cbb6', b.tone);
      ctx.fillStyle = tone;
      ctx.fillRect(b.x, b.top, b.w, 310 - b.top);
      ctx.fillStyle = night ? alpha('#f5c66b', 0.65) : alpha('#3b3540', 0.35);
      for (let wy = b.top + 10; wy < 300; wy += 16) for (let wx = b.x + 6; wx < b.x + b.w - 8; wx += 12) {
        if (((wx * 13 + wy * 7) | 0) % 5 === 0) continue;
        ctx.fillRect(wx, wy, 5, 7);
      }
      if (b.rail) {
        ctx.strokeStyle = alpha(P.ink, 0.35);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(b.x, b.top - 6);
        ctx.lineTo(b.x + b.w, b.top - 6);
        for (let rx = b.x; rx <= b.x + b.w; rx += 6) {
          ctx.moveTo(rx, b.top);
          ctx.lineTo(rx, b.top - 6);
        }
        ctx.stroke();
      }
      if (b.tank) {
        // The black water tank on every Kathmandu roof.
        ctx.fillStyle = night ? '#0c0e18' : '#25262c';
        rr(ctx, b.x + b.w * 0.6, b.top - 14, 12, 14, 3);
        ctx.fill();
      }
      if (b.dish) {
        ctx.strokeStyle = alpha(P.ink, 0.5);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x + 8, b.top - 6, 5, Math.PI * 0.8, Math.PI * 1.9);
        ctx.stroke();
      }
      if (b.line) {
        ctx.strokeStyle = alpha(P.ink, 0.3);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(b.x + 2, b.top - 12);
        ctx.quadraticCurveTo(b.x + b.w / 2, b.top - 6, b.x + b.w - 2, b.top - 12);
        ctx.stroke();
        ['#c8372d', '#2f6fb5', '#e2b52b'].forEach((c, i) => {
          ctx.fillStyle = alpha(c, 0.8);
          ctx.fillRect(b.x + b.w * (0.3 + i * 0.18), b.top - 10, 4, 6);
        });
      }
    }

    const sag = 14 + 26 * (1 - wind);
    // Rival strings, kites and flyers.
    for (const r of s.rivals) {
      drawFlyer(ctx, r.ax, r.ay, alpha(P.ink, 0.75));
      if (r.state === 'fly') drawString(ctx, stringPts(r.ax, r.ay, r.x, r.y + 9, sag), alpha(P.ink, night ? 0.55 : 0.45));
      else {
        // A cut string goes slack and floats down.
        ctx.strokeStyle = alpha(P.ink, clamp(0.4 - r.k * 0.1, 0, 0.4));
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + 9);
        ctx.quadraticCurveTo(r.x - 20, r.y + 50, r.x - 50 + Math.sin(r.k * 3) * 10, r.y + 90);
        ctx.stroke();
      }
      drawKite(ctx, r.x, r.y, r.vx, r.col, '#f6f1e6', r.tail, r.state === 'fly' ? 0 : r.spin, clamp(1.2 - r.k * 0.3, 0, 1));
    }

    // Player.
    const k = s.kite;
    drawFlyer(ctx, ax, ay, P.accentFg);
    if (k.state === 'fly') drawString(ctx, stringPts(ax, ay, k.x, k.y + 9, sag), night ? alpha(P.accent, 0.85) : alpha(P.accentFg, 0.85), 1.2);
    drawKite(ctx, k.x, k.y, k.vx, P.accent, night ? P.ink : '#16181f', k.tail, k.state === 'fly' ? 0 : k.k * (reduce ? 0 : 6), k.state === 'fly' ? 1 : clamp(1.6 - k.k, 0, 1), true);

    // Tug-of-war meters at each crossing.
    for (const r of s.rivals) {
      if (!r.cross) continue;
      const [cx, cy] = r.cross;
      ctx.fillStyle = alpha(P.accent, 0.3);
      ctx.beginPath();
      ctx.arc(cx, cy, 7 + (reduce ? 0 : Math.sin(s.t * 20) * 1.5), 0, Math.PI * 2);
      ctx.fill();
      const bw = 64;
      const bx = clamp(cx - bw / 2, 6, vw - bw - 6);
      const by = clamp(cy - 26, 8, 280);
      ctx.fillStyle = alpha(P.surface, 0.92);
      rr(ctx, bx - 4, by - 4, bw + 8, 16, 8);
      ctx.fill();
      ctx.fillStyle = alpha(P.ink, 0.12);
      rr(ctx, bx, by, bw, 8, 4);
      ctx.fill();
      // Yours grows from the left, theirs from the right.
      ctx.fillStyle = P.accent;
      rr(ctx, bx, by, (bw / 2) * clamp(r.mine / 100, 0, 1) + 0.01, 8, 4);
      ctx.fill();
      ctx.fillStyle = r.col;
      const tw = (bw / 2) * clamp(r.theirs / 100, 0, 1);
      rr(ctx, bx + bw - tw, by, tw + 0.01, 8, 4);
      ctx.fill();
      ctx.fillStyle = P.ink;
      ctx.fillRect(bx + bw / 2 - 0.5, by - 1, 1, 10);
    }

    // Sparks and confetti of kite paper.
    for (const p of s.parts) {
      ctx.fillStyle = p.c === 'accent' ? alpha(P.accent, clamp(p.life * 2, 0, 1)) : alpha(night ? '#ffe9a8' : '#ffffff', clamp(p.life * 3, 0, 1));
      ctx.fillRect(p.x - 1.2, p.y - 1.2, 2.4, 2.4);
    }

    // Gust warning and wind sock.
    const g = s.gust;
    ctx.font = font(10, 650, 'sans');
    ctx.textAlign = 'left';
    const windText = `${tRef.current('kfWind')} ${'›'.repeat(Math.max(1, Math.round(wind * 3)))}`;
    ctx.fillStyle = alpha(P.surface, 0.8);
    const ww = ctx.measureText(windText).width;
    rr(ctx, 8, 8, ww + 14, 18, 9);
    ctx.fill();
    ctx.fillStyle = P.ink2;
    ctx.fillText(windText, 15, 21);
    if (g.state !== 'calm') {
      const text = g.state === 'warn' ? tRef.current('kfGustWarn') : tRef.current('kfGust');
      ctx.font = font(12, 700, 'display');
      const tw = ctx.measureText(text).width;
      const gx = vw / 2;
      ctx.fillStyle = alpha(P.surface, 0.9);
      rr(ctx, gx - tw / 2 - 26, 8, tw + 52, 22, 11);
      ctx.fill();
      ctx.fillStyle = P.accentFg;
      ctx.textAlign = 'center';
      const arrow = g.dir > 0 ? '→' : '←';
      ctx.fillText(g.dir > 0 ? `${text}  ${arrow}` : `${arrow}  ${text}`, gx, 23.5);
    }

    // The cry.
    if (s.shout) {
      const a = clamp(1.5 - s.shout.t, 0, 1);
      const pop = reduce ? 1 : 1 + 0.25 * Math.max(0, 1 - s.shout.t * 5);
      ctx.save();
      ctx.translate(vw / 2, 92);
      ctx.scale(pop, pop);
      ctx.textAlign = 'center';
      ctx.font = font(26, 800, 'display');
      ctx.lineWidth = 5;
      ctx.strokeStyle = alpha(P.bg, 0.85 * a);
      ctx.strokeText(s.shout.text, 0, 0);
      ctx.fillStyle = alpha(s.shout.tone === 'warn' ? (night ? '#fb923c' : '#c2410c') : P.accentFg, a);
      ctx.fillText(s.shout.text, 0, 0);
      if (s.shout.sub) {
        ctx.font = font(14, 700, 'mono');
        ctx.fillText(s.shout.sub, 0, 20);
      }
      ctx.restore();
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

  useEffect(() => {
    if (phase !== 'play') {
      if (phase === 'start' && sim.current.kite.x === 0) resetKite(sim.current);
      draw();
    }
  });

  useEffect(() => {
    if (phase !== 'play') {
      keys.current.clear();
      drag.current = null;
    }
  }, [phase]);

  // ------------------------------------------------------------ input
  const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
  const onKeyDown = (e) => {
    if (isButtonKey(e)) return;
    if (phase === 'play') {
      const dir = KEYMAP[e.key];
      if (dir) {
        claim(e);
        keys.current.add(dir);
      } else if (e.key === ' ') {
        claim(e);
        if (!e.repeat) pull();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        claim(e);
        setPhase('paused');
      }
    } else if (e.key === ' ' || e.key === 'Enter') {
      claim(e);
      if (phase === 'paused') setPhase('play');
      else start();
    }
  };
  const onKeyUp = (e) => {
    const dir = KEYMAP[e.key];
    if (dir) keys.current.delete(dir);
  };

  const toWorld = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { U } = layout();
    return { x: (e.clientX - rect.left) / U, y: (e.clientY - rect.top) / U };
  };
  const onPointerDown = (e) => {
    if (phase !== 'play') return;
    rootRef.current?.focus({ preventScroll: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const p = toWorld(e);
    drag.current = { ...p, id: e.pointerId, at: performance.now(), sx: e.clientX, sy: e.clientY, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const p = toWorld(e);
    d.x = p.x;
    d.y = p.y;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 10) d.moved = true;
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    // A quick tap without moving is a pull.
    if (!d.moved && performance.now() - d.at < 220) pull();
    drag.current = null;
  };

  const windLabel = windKmh == null ? t('kfWindDefault') : t('kfWindLive', { n: localDigits(Math.round(windKmh), lang) });

  return (
    <div ref={rootRef} className="bx-root" tabIndex={0} onKeyDown={onKeyDown} onKeyUp={onKeyUp} aria-roledescription={t('game')} aria-label={t('kfTitle')}>
      <Hud
        items={[
          { id: 's', label: t('score'), value: hud.score, tone: 'accent' },
          { id: 'c', label: t('kfCuts'), value: hud.cuts },
          { id: 'l', label: t('kfKites'), value: <Pips total={LIVES} left={hud.lives} label={t('kfKites')} /> },
          { id: 'v', label: t('level'), value: hud.level },
          { id: 'w', label: t('kfWind'), value: windLabel },
        ]}
      />
      <div ref={wrapRef} className="bx-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <canvas ref={canvasRef} role="img" aria-label={t('kfCanvas')} />
        {phase === 'start' && (
          <Panel kicker={t('kfKicker')} title={t('kfTitle')} primary={{ label: t('start'), onClick: start }}>
            <p>{t('kfIntro')}</p>
            <ul className="bx-keys">
              <li>
                <b>{t('kfKeySteer')}</b>
                <span>{t('kfSteerHow')}</span>
              </li>
              <li>
                <b>{t('kfKeyPull')}</b>
                <span>{t('kfPullHow')}</span>
              </li>
              <li>
                <b>{t('kfKeyWind')}</b>
                <span>{t('kfWindHow')}</span>
              </li>
            </ul>
          </Panel>
        )}
        {phase === 'paused' && (
          <Panel kicker={t('kfTitle')} title={t('paused')} primary={{ label: t('resume'), onClick: () => setPhase('play') }} secondary={{ label: t('restart'), onClick: start }}>
            <p>{t('pausedBody')}</p>
          </Panel>
        )}
        {phase === 'over' && result && (
          <Panel kicker={result.isNew ? t('newBest') : t('gameOver')} title={t('kfOverTitle')} primary={{ label: t('again'), onClick: start }}>
            <p className="bx-big">{localDigits(result.score.toLocaleString('en-US'), lang)}</p>
            <p>{t('kfOverBody', { n: localDigits(result.cuts, lang) })}</p>
            <p>{t('bestLine', { n: localDigits(Math.max(best, result.score).toLocaleString('en-US'), lang) })}</p>
            {result.joke && <p className="bx-joke">{result.joke}</p>}
          </Panel>
        )}
      </div>
      <div className="bx-controls">
        <div className="bx-pads">
          <Pad className="bx-pad-accent" label={t('kfKeyPull')} onDown={pull} disabled={phase !== 'play'}>
            <HandGrabbingIcon size={18} weight="bold" aria-hidden="true" />
            <span>{t('kfKeyPull')}</span>
          </Pad>
          <Pad label={t('pause')} onDown={() => setPhase('paused')} disabled={phase !== 'play'}>
            <PauseIcon size={18} weight="bold" aria-hidden="true" />
          </Pad>
        </div>
        <p className="bx-hint">{t('kfHint')}</p>
      </div>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  );
}

// ------------------------------------------------------------ art

function drawString(ctx, pts, col, width = 0.9) {
  ctx.strokeStyle = col;
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

function drawFlyer(ctx, x, y, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y - 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 2.5, y - 3, 5, 12);
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 5, y - 3);
  ctx.stroke();
  // The lattai (spool) in the other hand.
  ctx.beginPath();
  ctx.arc(x - 5, y + 2, 2.5, 0, Math.PI * 2);
  ctx.stroke();
}

function drawKite(ctx, x, y, vx, col, cross, tail, spin, a, mine = false) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  // Tail ribbon.
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  tail.forEach(([tx, ty], i) => {
    const yy = ty + 12 + i * 2.2;
    if (i === 0) ctx.moveTo(tx, yy);
    else ctx.lineTo(tx - i * 0.6, yy);
  });
  ctx.stroke();
  ctx.translate(x, y);
  ctx.rotate(clamp(vx / 600, -0.4, 0.4) + spin);
  const s = mine ? 1.12 : 1;
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 12);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  // Two-tone panel, like the paper patches on a real changa.
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fill();
  ctx.strokeStyle = cross;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, 12);
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(0, -5, 10, 0);
  ctx.stroke();
  ctx.restore();
}
