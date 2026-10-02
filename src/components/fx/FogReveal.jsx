import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, reducedMotion } from '../../lib/motion';
import { planeBus } from '../../three/planeBus';
import { findEgg } from '../../lib/eggs';
import './fog.css';

// A section hidden in drifting fog until the plane tears it open.
//
// The overlay canvas sits at z 32 in the root stacking context (the wrapper
// forms no stacking context of its own), above the section's content. While
// the section scrolls through, a scrubbed ScrollTrigger asks the global plane
// for three alternating horizontal passes (planeBus.sweep) and raises it above
// content (planeBus.aboveContent). Every frame the fog is erased along the
// plane's path with a soft brush, plus turbulent wake particles that keep
// eating into the edges and curls of displaced fog. When the passes are done
// the rest dissolves and the section stays clear.
//
// variant 'smog': warm grey Kathmandu-valley haze (follows the day or night
// theme). variant 'cloud': a moonlit cloud bank for the Kanya night sky.
// Reduced motion or no WebGL: no fog at all, children render as they are.

const sweeping = new Set(); // FogReveal instances currently borrowing the plane
let uid = 0;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

let webglSupport = null;
function hasWebGL() {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    webglSupport = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

// Fog colours: base wash, shadow and highlight of the noise, displaced wisps.
const PALETTES = {
  'smog-day': { base: [204, 196, 182], baseA: 0.6, low: [164, 154, 138], high: [234, 228, 216], wisp: [224, 217, 204] },
  'smog-night': { base: [56, 55, 64], baseA: 0.66, low: [28, 30, 40], high: [116, 104, 92], wisp: [96, 90, 88] },
  cloud: { base: [32, 39, 74], baseA: 0.6, low: [14, 18, 42], high: [196, 204, 230], wisp: [150, 160, 198] },
};

// Three alternating passes across the scroll progress: [from, to], direction
// (1 = left to right) and preferred height (viewport fraction).
const PASSES = [
  { a: 0.04, b: 0.32, dir: 1, y: 0.7 },
  { a: 0.36, b: 0.64, dir: -1, y: 0.4 },
  { a: 0.68, b: 0.94, dir: 1, y: 0.6 },
];
const DISSOLVE = 1.5; // seconds

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seamlessly tiling fractal value noise, normalised to 0..1.
function tileNoise(N, seed) {
  const out = new Float32Array(N * N);
  const rnd = mulberry32(seed);
  let amp = 1;
  for (let o = 0; o < 5; o++) {
    const P = 4 << o;
    const grid = new Float32Array(P * P);
    for (let k = 0; k < grid.length; k++) grid[k] = rnd();
    const cell = N / P;
    for (let y = 0; y < N; y++) {
      const gy = y / cell;
      const y0 = Math.floor(gy) % P;
      const y1 = (y0 + 1) % P;
      let fy = gy - Math.floor(gy);
      fy = fy * fy * (3 - 2 * fy);
      for (let x = 0; x < N; x++) {
        const gx = x / cell;
        const x0 = Math.floor(gx) % P;
        const x1 = (x0 + 1) % P;
        let fx = gx - Math.floor(gx);
        fx = fx * fx * (3 - 2 * fx);
        const a = grid[y0 * P + x0];
        const b = grid[y0 * P + x1];
        const c = grid[y1 * P + x0];
        const d = grid[y1 * P + x1];
        out[y * N + x] += amp * (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy);
      }
    }
    amp *= 0.5;
  }
  let min = Infinity;
  let max = -Infinity;
  for (let k = 0; k < out.length; k++) {
    if (out[k] < min) min = out[k];
    if (out[k] > max) max = out[k];
  }
  const span = max - min || 1;
  for (let k = 0; k < out.length; k++) out[k] = (out[k] - min) / span;
  return out;
}

const textures = new Map();
function fogTexture(key, variant, pal) {
  if (textures.has(key)) return textures.get(key);
  const N = 256;
  const D = tileNoise(N, variant === 'cloud' ? 7 : 3);
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  const px = img.data;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const d = D[i];
      let a;
      let t;
      if (variant === 'cloud') {
        // Lit from above by the moon: brighter where density rises downward.
        const up = D[((y - 5 + N) % N) * N + x];
        const lit = clamp(0.5 + (d - up) * 6, 0, 1);
        a = smoothstep(0.3, 0.72, d);
        t = clamp(lit * 0.7 + d * 0.4 - 0.1, 0, 1);
      } else {
        a = 0.25 + 0.75 * smoothstep(0.18, 0.85, d);
        t = clamp(d * 1.15 - 0.08, 0, 1);
      }
      const o = i * 4;
      px[o] = pal.low[0] + (pal.high[0] - pal.low[0]) * t;
      px[o + 1] = pal.low[1] + (pal.high[1] - pal.low[1]) * t;
      px[o + 2] = pal.low[2] + (pal.high[2] - pal.low[2]) * t;
      px[o + 3] = a * 255;
    }
  }
  g.putImageData(img, 0, 0);
  textures.set(key, c);
  return c;
}

let brushSprite = null;
function brush() {
  if (brushSprite) return brushSprite;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.42, 'rgba(0,0,0,0.92)');
  grad.addColorStop(0.72, 'rgba(0,0,0,0.42)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  brushSprite = c;
  return c;
}

function wispSprite(rgb) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  const col = rgb.join(',');
  grad.addColorStop(0, `rgba(${col},1)`);
  grad.addColorStop(0.45, `rgba(${col},0.55)`);
  grad.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export default function FogReveal({ variant = 'smog', children }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [enabled] = useState(() => typeof window !== 'undefined' && !reducedMotion() && hasWebGL());
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const mask = document.createElement('canvas');
    const mctx = mask.getContext('2d');
    if (!ctx || !mctx) return undefined;

    const id = `fog-${variant}-${++uid}`;
    const isMobile = () => window.innerWidth < 768;
    const BR = brush();
    const S = {
      W: 0,
      H: 0,
      res: 0.35,
      key: '',
      pal: PALETTES.cloud,
      pattern: null,
      wisp: null,
      glow: null,
      t0: performance.now() / 1000,
      last: 0,
      near: false,
      running: false,
      drawn: false,
      phase: 'fog', // 'fog' | 'dissolve' | 'done'
      engaged: false,
      progress: 0,
      lo: 1,
      hi: 0,
      strokes: 0,
      span: 1,
      dissolveStart: 0,
      prev: null,
      wake: [],
      curls: [],
    };
    const sweep = { y: 0.5, dir: 1, progress: 0, owner: id, pass: 0 };

    // ---- canvases ------------------------------------------------------------
    const feather = () => {
      const F = Math.min(S.H * 0.25, 150 * S.res);
      mctx.save();
      mctx.globalCompositeOperation = 'destination-out';
      let g = mctx.createLinearGradient(0, 0, 0, F);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g;
      mctx.fillRect(0, 0, S.W, F);
      g = mctx.createLinearGradient(0, S.H - F, 0, S.H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      mctx.fillStyle = g;
      mctx.fillRect(0, S.H - F, S.W, F);
      mctx.restore();
    };

    const sizeCanvas = () => {
      const cssW = Math.max(1, wrap.offsetWidth);
      const cssH = Math.max(1, wrap.offsetHeight);
      let res = isMobile() ? 0.25 : 0.35;
      const maxPx = isMobile() ? 240000 : 520000;
      if (cssW * cssH * res * res > maxPx) res = Math.sqrt(maxPx / (cssW * cssH));
      const W = Math.max(2, Math.round(cssW * res));
      const H = Math.max(2, Math.round(cssH * res));
      if (W === S.W && H === S.H) return;
      // Keep whatever the plane has already cleared.
      let old = null;
      if (S.W && S.H) {
        old = document.createElement('canvas');
        old.width = S.W;
        old.height = S.H;
        old.getContext('2d').drawImage(mask, 0, 0);
      }
      const sx = S.W ? W / S.W : 1;
      const sy = S.H ? H / S.H : 1;
      canvas.width = W;
      canvas.height = H;
      mask.width = W;
      mask.height = H;
      S.W = W;
      S.H = H;
      S.res = W / cssW;
      if (old) {
        mctx.drawImage(old, 0, 0, W, H);
        old.width = 0;
        old.height = 0;
        for (const p of S.wake.concat(S.curls)) {
          p.x *= sx;
          p.y *= sy;
        }
      } else {
        mctx.fillStyle = '#000';
        mctx.fillRect(0, 0, W, H);
        feather();
      }
      S.prev = null;
      S.glow = null;
      S.pattern = null;
      S.drawn = false;
    };

    const themeKey = () => {
      if (variant === 'cloud') return 'cloud';
      return document.documentElement.dataset.theme === 'night' ? 'smog-night' : 'smog-day';
    };
    const ensureTexture = () => {
      const key = themeKey();
      if (key === S.key && S.pattern) return;
      S.key = key;
      S.pal = PALETTES[key];
      S.pattern = ctx.createPattern(fogTexture(key, variant, S.pal), 'repeat');
      S.wisp = wispSprite(S.pal.wisp);
      S.drawn = false;
    };

    // ---- drawing -------------------------------------------------------------
    const layer = (k, ox, oy, alpha) => {
      const tile = 256 * k;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(ox % tile, oy % tile);
      ctx.scale(k, k);
      ctx.fillStyle = S.pattern;
      ctx.fillRect(-256, -256, S.W / k + 512, S.H / k + 512);
      ctx.restore();
    };

    const draw = (now, dt) => {
      const { W, H, res, pal } = S;
      const t = now - S.t0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = `rgba(${pal.base.join(',')},${pal.baseA})`;
      ctx.fillRect(0, 0, W, H);
      // Two noise layers drifting at different speeds: slow parallax haze.
      const k = ((isMobile() ? 380 : 580) * res) / 256;
      layer(k, t * 9 * res, t * 2.4 * res, 0.92);
      layer(k * 0.5, 77 - t * 15 * res, 31 - t * 3.2 * res, 0.55);
      if (variant === 'cloud') {
        // The moon lights the cloud bank from the top right.
        if (!S.glow) {
          const gx = W * 0.8;
          const gy = Math.min(H * 0.2, 280 * res);
          const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W * 0.5, 420 * res));
          g.addColorStop(0, 'rgba(220,228,250,0.34)');
          g.addColorStop(0.5, 'rgba(200,210,240,0.1)');
          g.addColorStop(1, 'rgba(200,210,240,0)');
          S.glow = g;
        }
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = S.glow;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      // Fog pushed aside by the plane, curling away and thinning out.
      for (let i = S.curls.length - 1; i >= 0; i--) {
        const p = S.curls[i];
        p.life += dt;
        if (p.life >= p.max) {
          S.curls.splice(i, 1);
          continue;
        }
        const c = Math.cos(p.spin * dt);
        const s = Math.sin(p.spin * dt);
        const vx = p.vx * c - p.vy * s;
        p.vy = (p.vx * s + p.vy * c) * Math.pow(0.35, dt);
        p.vx = vx * Math.pow(0.35, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const q = p.life / p.max;
        const r = p.r * (1 + q * 0.9);
        ctx.globalAlpha = p.a * Math.sin(Math.PI * q);
        ctx.drawImage(S.wisp, p.x - r, p.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      S.drawn = true;
    };

    // Turbulent wake: particles that drift outwards, swirl and keep eating
    // into the edges of the tear for a second after the plane has passed.
    const updateWake = (dt) => {
      if (!S.wake.length) return;
      mctx.globalCompositeOperation = 'destination-out';
      const damp = Math.pow(0.3, dt);
      for (let i = S.wake.length - 1; i >= 0; i--) {
        const p = S.wake[i];
        p.life += dt;
        if (p.life >= p.max) {
          S.wake.splice(i, 1);
          continue;
        }
        const c = Math.cos(p.spin * dt);
        const s = Math.sin(p.spin * dt);
        const vx = p.vx * c - p.vy * s;
        p.vy = (p.vx * s + p.vy * c) * damp;
        p.vx = vx * damp;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const q = p.life / p.max;
        const r = p.r + p.g * q;
        mctx.globalAlpha = p.a * (1 - q);
        mctx.drawImage(BR, p.x - r, p.y - r, r * 2, r * 2);
      }
      mctx.globalAlpha = 1;
      mctx.globalCompositeOperation = 'source-over';
    };

    const planePoint = () => {
      const sp = planeBus.screen;
      if (sp.visible && sp.size > 0) return { x: sp.x, y: sp.y, size: sp.size, real: true };
      // No visible plane (still loading, hidden by a scene): erase along the
      // path it would have flown so the fog still opens.
      const vw = window.innerWidth;
      const size = (isMobile() ? 0.42 : 0.19) * vw;
      const m = size * 0.7;
      const f = sweep.dir > 0 ? sweep.progress : 1 - sweep.progress;
      return { x: -m + (vw + 2 * m) * f, y: sweep.y * window.innerHeight, size, real: false };
    };

    const erase = (rect) => {
      const pt = planePoint();
      const res = S.res;
      const cx = (pt.x - rect.left) * res;
      const cy = (pt.y - rect.top) * res;
      const R = Math.max(14 * res, pt.size * (isMobile() ? 0.3 : 0.36) * res);
      const prev = S.prev;
      S.prev = { x: cx, y: cy };
      if (!prev) return;
      const dx = cx - prev.x;
      const dy = cy - prev.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.5 || dist > S.W * 0.6) return; // parked, or jumped between passes
      const pad = R * 2;
      if ((cx < -pad && prev.x < -pad) || (cx > S.W + pad && prev.x > S.W + pad) || (cy < -pad && prev.y < -pad) || (cy > S.H + pad && prev.y > S.H + pad)) return;
      const ux = dx / dist;
      const uy = dy / dist;
      const nx = -uy;
      const ny = ux;

      // The tear itself: soft stamps along the path, slightly ragged.
      mctx.globalCompositeOperation = 'destination-out';
      const steps = Math.max(1, Math.ceil(dist / (R * 0.22)));
      for (let s = 1; s <= steps; s++) {
        const f = s / steps;
        const j = (Math.random() - 0.5) * 0.26 * R;
        const r = R * (0.9 + Math.random() * 0.2);
        mctx.globalAlpha = 0.85;
        mctx.drawImage(BR, prev.x + dx * f + nx * j - r, prev.y + dy * f + ny * j - r, r * 2, r * 2);
      }
      mctx.globalAlpha = 1;
      mctx.globalCompositeOperation = 'source-over';
      if (pt.real) S.strokes += steps;

      // Wake particles and displaced curls along the edges.
      const n = Math.min(isMobile() ? 3 : 5, 1 + Math.floor(dist / (R * 0.4)));
      for (let k = 0; k < n; k++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const f = Math.random();
        const off = side * R * (0.45 + Math.random() * 0.55);
        const bx = prev.x + dx * f;
        const by = prev.y + dy * f;
        const out = (25 + Math.random() * 60) * res;
        S.wake.push({
          x: bx + nx * off,
          y: by + ny * off,
          vx: nx * side * out - ux * 12 * res,
          vy: ny * side * out - uy * 12 * res,
          r: R * (0.2 + Math.random() * 0.25),
          g: R * (0.45 + Math.random() * 0.6),
          life: 0,
          max: 0.7 + Math.random() * 0.8,
          a: 0.05 + Math.random() * 0.08,
          spin: side * (1.2 + Math.random() * 2.6),
        });
        if (Math.random() < 0.55) {
          const push = (40 + Math.random() * 80) * res;
          S.curls.push({
            x: bx + nx * side * R * (0.85 + Math.random() * 0.35),
            y: by + ny * side * R * (0.85 + Math.random() * 0.35),
            vx: nx * side * push + ux * 25 * res,
            vy: ny * side * push + uy * 25 * res,
            r: R * (0.3 + Math.random() * 0.35),
            life: 0,
            max: 0.9 + Math.random() * 0.9,
            a: 0.2 + Math.random() * 0.22,
            spin: side * (0.8 + Math.random() * 1.6),
          });
        }
      }
      const maxWake = isMobile() ? 110 : 220;
      const maxCurls = isMobile() ? 40 : 80;
      if (S.wake.length > maxWake) S.wake.splice(0, S.wake.length - maxWake);
      if (S.curls.length > maxCurls) S.curls.splice(0, S.curls.length - maxCurls);
    };

    // ---- the plane -------------------------------------------------------------
    const applySweep = () => {
      const p = S.progress;
      const k = p < 0.34 ? 0 : p < 0.66 ? 1 : 2;
      const pass = PASSES[k];
      const vh = window.innerHeight || 1;
      const span = S.span / vh;
      const mid = (pass.a + pass.b) / 2;
      // Keep each pass over the section: its top and bottom as viewport
      // fractions halfway through the pass (start is 'top 75%').
      const top = 0.75 - mid * span;
      const bottom = top + wrap.offsetHeight / vh;
      const y = clamp(Math.max(top + 0.12, Math.min(bottom - 0.12, pass.y)), 0.14, 0.86);
      if (k !== sweep.pass) S.prev = null;
      sweep.pass = k;
      sweep.dir = pass.dir;
      sweep.y = y;
      sweep.progress = clamp((p - pass.a) / (pass.b - pass.a), 0, 1);
      planeBus.sweep = sweep;
    };
    const engage = () => {
      if (S.phase !== 'fog') return;
      sweeping.add(id);
      planeBus.aboveContent = true;
      S.engaged = true;
      applySweep();
    };
    const release = () => {
      if (planeBus.sweep && planeBus.sweep.owner === id) planeBus.sweep = null;
      sweeping.delete(id);
      planeBus.aboveContent = sweeping.size > 0;
      S.engaged = false;
      S.prev = null;
    };

    // ---- lifecycle ---------------------------------------------------------------
    const frame = () => {
      const now = performance.now() / 1000;
      const dt = S.last ? clamp(now - S.last, 0, 0.05) : 0.016;
      S.last = now;
      if (!S.W) sizeCanvas();
      ensureTexture();
      const rect = wrap.getBoundingClientRect();
      if (S.phase === 'fog' && S.engaged && planeBus.sweep === sweep) erase(rect);
      else S.prev = null;

      if (S.phase === 'dissolve') {
        const d = (now - S.dissolveStart) / DISSOLVE;
        // Erode what is left in and around the viewport with growing holes.
        const res = S.res;
        const top = clamp(-rect.top * res, 0, S.H);
        const bottom = clamp((window.innerHeight - rect.top) * res, 0, S.H);
        const holes = isMobile() ? 3 : 6;
        if (bottom > top) {
          for (let k = 0; k < holes; k++) {
            S.wake.push({
              x: Math.random() * S.W,
              y: top + Math.random() * (bottom - top),
              vx: (Math.random() - 0.5) * 30 * res,
              vy: -20 * res,
              r: 30 * res,
              g: (90 + Math.random() * 120) * res,
              life: 0,
              max: 0.8 + Math.random() * 0.5,
              a: 0.14,
              spin: (Math.random() - 0.5) * 2,
            });
          }
        }
        canvas.style.opacity = String(1 - smoothstep(0.2, 1, d));
        if (d >= 1) {
          finish();
          return;
        }
      }
      updateWake(dt);
      const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
      if (onScreen || !S.drawn) draw(now, dt);
    };

    const start = () => {
      if (S.running || S.phase === 'done') return;
      S.running = true;
      S.last = 0;
      gsap.ticker.add(frame);
    };
    const stop = () => {
      if (!S.running) return;
      S.running = false;
      gsap.ticker.remove(frame);
    };

    let trig = null;
    const finish = () => {
      if (S.phase === 'done') return;
      const earned = S.strokes > 24;
      S.phase = 'done';
      release();
      stop();
      trig?.kill();
      trig = null;
      S.wake.length = 0;
      S.curls.length = 0;
      if (earned) findEgg('fog');
      setCleared(true);
    };
    const complete = () => {
      if (S.phase !== 'fog') return;
      S.phase = 'dissolve';
      S.dissolveStart = performance.now() / 1000;
      release();
      if (S.near) start();
      else finish();
    };

    trig = ScrollTrigger.create({
      trigger: wrap,
      start: 'top 75%',
      end: () => {
        const vh = window.innerHeight;
        return `+=${Math.round(clamp(vh * 0.75 + wrap.offsetHeight * 0.35, vh * 0.9, vh * 1.8))}`;
      },
      invalidateOnRefresh: true,
      onToggle: (self) => {
        if (S.phase !== 'fog') return;
        S.progress = self.progress;
        S.span = Math.max(1, self.end - self.start);
        if (self.isActive) {
          S.lo = self.progress;
          S.hi = self.progress;
          engage();
        } else release();
      },
      onUpdate: (self) => {
        if (S.phase !== 'fog') return;
        const p = self.progress;
        S.progress = p;
        S.span = Math.max(1, self.end - self.start);
        if (!self.isActive) return;
        S.lo = Math.min(S.lo, p);
        S.hi = Math.max(S.hi, p);
        // Done once the visitor has flown (nearly) the whole stretch.
        if (S.hi - S.lo > 0.9 && (p > 0.96 || p < 0.04)) {
          complete();
          return;
        }
        if (!S.engaged) engage();
        else applySweep();
      },
      onLeave: () => complete(),
      onLeaveBack: () => {
        if (S.hi - S.lo > 0.85) complete();
      },
    });

    // A callback may already have finished it during create().
    if (S.phase === 'done') {
      trig.kill();
      trig = null;
    }

    // Run only near the viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        S.near = entry.isIntersecting;
        if (S.near) start();
        else if (S.phase === 'dissolve') finish();
        else stop();
      },
      { rootMargin: '60% 0px 60% 0px' },
    );
    io.observe(wrap);

    let sizeRaf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(sizeRaf);
      sizeRaf = requestAnimationFrame(() => {
        if (S.phase !== 'done') sizeCanvas();
      });
    });
    ro.observe(wrap);
    // Content above can change height (images, late sections): keep the
    // trigger's start and end honest.
    let refreshTimer = 0;
    const bodyRO = new ResizeObserver(() => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => trig?.refresh(), 400);
    });
    bodyRO.observe(document.body);

    // The smog follows the day or night theme.
    const mo = new MutationObserver(() => {
      S.key = '';
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      bodyRO.disconnect();
      mo.disconnect();
      cancelAnimationFrame(sizeRaf);
      clearTimeout(refreshTimer);
      trig?.kill();
      trig = null;
      release();
      mask.width = 0;
      mask.height = 0;
    };
  }, [enabled, variant]);

  return (
    <div ref={wrapRef} className="fog-reveal" data-fog={variant}>
      {children}
      {enabled && !cleared && <canvas ref={canvasRef} className="fog-canvas" aria-hidden="true" />}
    </div>
  );
}
