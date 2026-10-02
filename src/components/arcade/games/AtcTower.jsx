import { useEffect, useRef, useState } from 'react';
import { ArrowBendUpLeftIcon, ArrowBendUpRightIcon, ArrowFatDownIcon, ArrowFatUpIcon, CaretLeftIcon, CaretRightIcon, DroneIcon, HandPalmIcon, NavigationArrowIcon } from '@phosphor-icons/react';
import dict from '../../../i18n/ui/arcade';
import { localDigits, useLang, useT } from '../../../i18n';
import { sound } from '../../../lib/sound';
import { reducedMotion } from '../../../lib/motion';
import { claimKey, clamp, gameOverJoke, isButtonActivation, isCoarse, pick, rand, seeded, sizeCanvas, useLatest, useLoop, usePalette } from './a-kit';
import { Overlay, PadButton, Pips, Stat } from './a-ui';
import './a-games.css';

// UAM Tower: a top-down Kathmandu valley with five vertiports. eVTOLs fly
// to their destinations; two on the same layer must never lose separation.
// Every aircraft projects its own 4D path (where and when), and predicted
// conflicts are marked before they happen. All distances are in kilometres
// (the map is to scale); the clock runs fast, as games do.

const LON0 = 85.32;
const LAT0 = 27.695;
const geo = (lon, lat) => ({ x: (lon - LON0) * 98.6, y: (LAT0 - lat) * 110.9 });

const PORT_DEFS = [
  { id: 'thamel', code: 'TML', ...geo(85.3123, 27.7154) },
  { id: 'bouddha', code: 'BDH', ...geo(85.362, 27.7215) },
  { id: 'tia', code: 'TIA', ...geo(85.3591, 27.6966) },
  { id: 'patan', code: 'PTN', ...geo(85.3253, 27.6727) },
  { id: 'kirtipur', code: 'KRT', ...geo(85.2775, 27.6787) },
];
const GATE_DEFS = [
  { id: 'pokhara', code: 'PKR', dir: { x: -1, y: -0.12 } },
  { id: 'janakpur', code: 'JKR', dir: { x: 1, y: 0.8 } },
  { id: 'nagarkot', code: 'NGK', dir: { x: 1, y: -0.35 } },
];
const HILLS = [
  { id: 'shivapuri', dir: { x: 0.05, y: -1 } },
  { id: 'nagarjun', dir: { x: -0.9, y: -0.75 } },
  { id: 'chandragiri', dir: { x: -1, y: 0.55 } },
  { id: 'phulchoki', dir: { x: 0.3, y: 1 } },
];
// Bagmati, roughly: from Sundarijal past Pashupati, between Kathmandu and
// Patan, out through the Chobhar gorge.
const RIVER = [
  [4.8, -7], [3.6, -3.6], [2.8, -1.7], [2.0, -0.5], [0.9, 0.6], [-0.9, 0.45], [-2.1, 1.6], [-3.0, 3.3], [-3.3, 7],
];
const VIEW = { minX: -6.8, maxX: 6.75, minY: -5.2, maxY: 4.75 };

const SEP_WARN = 0.95; // km: predicted conflict
const SEP_HIT = 0.6; // km: loss of separation
const ALT_SEP = 0.55; // layers
const LOOK = 8; // seconds of 4D prediction
const DT_P = 0.25;
const LIVES = 3;
const MAX_HOLD = 4;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function makeView(W, H) {
  const scale = Math.min(W / (VIEW.maxX - VIEW.minX), H / (VIEW.maxY - VIEW.minY));
  const cx = (VIEW.minX + VIEW.maxX) / 2;
  const cy = (VIEW.minY + VIEW.maxY) / 2;
  const halfW = W / scale / 2;
  const halfH = H / scale / 2;
  const b = { minX: cx - halfW, maxX: cx + halfW, minY: cy - halfH, maxY: cy + halfH };
  return {
    W,
    H,
    scale,
    b,
    cx,
    cy,
    toPx: (p) => ({ x: (p.x - b.minX) * scale, y: (p.y - b.minY) * scale }),
    toKm: (x, y) => ({ x: b.minX + x / scale, y: b.minY + y / scale }),
  };
}

// Where a ray from the view centre leaves the visible map (inset a little).
function edgePoint(view, dir, inset = 0.45) {
  const { b, cx, cy } = view;
  const len = Math.hypot(dir.x, dir.y) || 1;
  const dx = dir.x / len;
  const dy = dir.y / len;
  const tx = dx > 0 ? (b.maxX - inset - cx) / dx : dx < 0 ? (b.minX + inset - cx) / dx : Infinity;
  const ty = dy > 0 ? (b.maxY - inset - cy) / dy : dy < 0 ? (b.minY + inset - cy) / dy : Infinity;
  const tt = Math.min(tx, ty);
  return { x: cx + dx * tt, y: cy + dy * tt };
}

function newSim() {
  return {
    gt: 0,
    flights: [],
    storms: [],
    birds: [],
    fx: [],
    warnings: [],
    ports: PORT_DEFS.map((p) => ({ ...p, kind: 'port', closedUntil: 0 })),
    gates: GATE_DEFS.map((g) => ({ ...g, kind: 'gate', x: 0, y: 0 })),
    spawnT: 0.8,
    stormT: 12,
    birdT: 9,
    cowT: 16,
    score: 0,
    landed: 0,
    lives: LIVES,
    level: 1,
    sel: null,
    seq: 1,
    homeDone: false,
    over: false,
  };
}

function target(f) {
  return f.wp || f.to;
}

function isClosed(s, place) {
  return place.kind === 'port' && place.closedUntil > s.gt;
}

// Simulates one flight forward without hazards: its predicted 4D path.
function predict(s, f) {
  const out = [];
  let x = f.x;
  let y = f.y;
  let alt = f.alt;
  let wp = f.wp;
  let hold = f.hold;
  const closedAt = f.to.kind === 'port' ? f.to.closedUntil : 0;
  for (let t = DT_P; t <= LOOK + 1e-6; t += DT_P) {
    const d = Math.sign(f.layer - alt) * Math.min(Math.abs(f.layer - alt), 0.8 * DT_P);
    alt += d;
    const tgt = wp || f.to;
    const dd = Math.hypot(tgt.x - x, tgt.y - y);
    const waiting = !wp && closedAt > s.gt + t && dd < 1.3;
    if (hold > 0) hold -= DT_P;
    else if (!waiting && dd > 1e-6) {
      const mv = f.speed * DT_P;
      if (dd <= mv) {
        x = tgt.x;
        y = tgt.y;
        if (wp) wp = null;
        else {
          out.push({ x, y, alt, t, end: true });
          break;
        }
      } else {
        x += ((tgt.x - x) / dd) * mv;
        y += ((tgt.y - y) / dd) * mv;
      }
    }
    out.push({ x, y, alt, t });
  }
  return out;
}

export default function AtcTower({ active = true, onScore }) {
  const t = useT(dict);
  const lang = useLang();
  const [phase, setPhase] = useState('start');
  const [hud, setHud] = useState({ score: 0, level: 1, landed: 0, lives: LIVES });
  const [info, setInfo] = useState(null);
  const [msg, setMsg] = useState(null);
  const [over, setOver] = useState(null);
  const [coarse] = useState(isCoarse);
  const rootRef = useRef(null);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sim = useRef(newSim());
  const view = useRef(null);
  const mapCache = useRef({ key: '', canvas: null });
  const drag = useRef(null);
  const msgTimer = useRef(0);
  const infoKey = useRef('');
  const reduce = useRef(reducedMotion());
  const pal = usePalette();
  const tRef = useLatest(t);
  const langRef = useLatest(lang);
  const scoreRef = useLatest(onScore);
  const phaseRef = useLatest(phase);
  const activeRef = useLatest(active);

  const flash = (text, tone = 'default') => {
    clearTimeout(msgTimer.current);
    setMsg({ text, tone, key: Date.now() });
    msgTimer.current = setTimeout(() => setMsg(null), 2600);
  };
  useEffect(() => () => clearTimeout(msgTimer.current), []);

  const placeName = (p) => tRef.current(p.kind === 'gate' ? `atc.g.${p.id}` : `atc.p.${p.id}`);

  const pushHud = () => {
    const s = sim.current;
    setHud({ score: s.score, level: s.level, landed: s.landed, lives: s.lives });
    scoreRef.current?.(s.score);
  };

  const syncInfo = () => {
    const s = sim.current;
    const f = s.flights.find((x) => x.id === s.sel);
    const next = f ? { cs: f.cs, layer: f.layer, dest: placeName(f.to), battery: Math.max(0, Math.round((f.battery / f.cap) * 100)), hold: f.hold > 0, wp: !!f.wp } : null;
    const key = JSON.stringify(next);
    if (key !== infoKey.current) {
      infoKey.current = key;
      setInfo(next);
    }
  };

  // ---------------------------------------------------------------- sizing
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const W = Math.max(200, Math.floor(r.width));
      const H = Math.max(180, Math.floor(r.height));
      sizeCanvas(canvas, ctx, W, H);
      view.current = makeView(W, H);
      sim.current.gates.forEach((g) => Object.assign(g, edgePoint(view.current, g.dir)));
      mapCache.current.key = '';
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    return () => ro.disconnect();
    // draw reads refs only
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- game
  const start = () => {
    const s = newSim();
    if (view.current) s.gates.forEach((g) => Object.assign(g, edgePoint(view.current, g.dir)));
    sim.current = s;
    setHud({ score: 0, level: 1, landed: 0, lives: LIVES });
    setOver(null);
    setInfo(null);
    infoKey.current = '';
    setPhase('play');
    scoreRef.current?.(0);
    sound.click();
    rootRef.current?.focus({ preventScroll: true });
  };

  const loseLife = (s, text, at) => {
    s.lives -= 1;
    s.fx.push({ kind: 'burst', x: at.x, y: at.y, t: 0 });
    sound.stamp();
    flash(text, 'bad');
    if (s.lives <= 0 && !s.over) {
      s.over = true;
      setOver({ score: s.score, landed: s.landed, level: s.level, joke: gameOverJoke(['aviation', 'nepal'], langRef.current) });
      setPhase('over');
      scoreRef.current?.(s.score);
    }
    pushHud();
  };

  const spawnFlight = (s, special = false) => {
    const v = view.current;
    if (!v) return false;
    const openPorts = s.ports.filter((p) => !isClosed(s, p));
    let from;
    let to;
    let kind;
    const r = Math.random();
    if (special) {
      kind = 'in';
      from = s.gates.find((g) => g.id === 'janakpur');
      to = s.ports.find((p) => p.id === 'tia');
    } else if (r < 0.6 && openPorts.length > 1) {
      kind = 'p2p';
      from = pick(openPorts);
      to = pick(s.ports.filter((p) => p !== from));
    } else if (r < 0.85) {
      kind = 'in';
      from = pick(s.gates);
      to = pick(s.ports);
    } else {
      kind = 'out';
      from = pick(openPorts.length ? openPorts : s.ports);
      to = pick(s.gates);
    }
    if (!from || !to) return false;
    // Never spawn on top of someone.
    if (s.flights.some((f) => dist(f, from) < 1.5)) return false;
    // Pick the quietest layer nearby.
    const counts = [0, 0, 0];
    s.flights.forEach((f) => {
      if (dist(f, from) < 3.5) counts[f.layer - 1] += 1;
    });
    const min = Math.min(...counts);
    const layer = pick([1, 2, 3].filter((l) => counts[l - 1] === min));
    const speed = Math.min(0.66, 0.42 + (s.level - 1) * 0.035) * rand(0.92, 1.08);
    const d = dist(from, to);
    const cap = (d / speed) * 2.1 + 9;
    const prefix = kind === 'in' ? pick(['PKR', 'JKR', 'NGK']) : pick(['KTM', 'LTP', 'UAM']);
    const cs = special ? 'SUV-1478' : `${prefix}${String(s.seq++ % 100).padStart(2, '0')}`;
    s.flights.push({
      id: `${cs}-${s.gt.toFixed(2)}`,
      cs,
      x: from.x,
      y: from.y,
      alt: layer,
      layer,
      from,
      to,
      kind,
      wp: null,
      hold: 0,
      battery: cap,
      cap,
      speed,
      heading: Math.atan2(to.y - from.y, to.x - from.x),
      rot: Math.random() * 6,
      special,
      warn: 0,
    });
    if (special) flash(tRef.current('atc.homeInbound'), 'good');
    return true;
  };

  const step = (dt) => {
    const s = sim.current;
    const v = view.current;
    if (!v || s.over) return;
    s.gt += dt;
    let hudDirty = false;

    // Spawning, scaled with level.
    s.spawnT -= dt;
    const maxFlights = Math.min(9, 2 + s.level);
    if (s.spawnT <= 0) {
      if (s.flights.length < maxFlights) {
        const special = !s.homeDone && s.level >= 2 && Math.random() < 0.35;
        if (spawnFlight(s, special) && special) s.homeDone = true;
      }
      s.spawnT = s.flights.length < 2 ? 1.2 : Math.max(2.2, 6.5 - s.level * 0.6) * rand(0.8, 1.2);
    }

    // Hazards.
    if (s.level >= 2) {
      s.birdT -= dt;
      if (s.birdT <= 0 && !s.birds.length) {
        const fromLeft = Math.random() < 0.5;
        const y = rand(v.b.minY + 1, v.b.maxY - 1);
        s.birds.push({ x: fromLeft ? v.b.minX : v.b.maxX, y, vx: (fromLeft ? 1 : -1) * 0.32, vy: rand(-0.08, 0.08), layer: pick([1, 2]), r: 0.5 });
        s.birdT = rand(12, 18);
      }
      s.cowT -= dt;
      if (s.cowT <= 0) {
        const p = pick(s.ports.filter((x) => !isClosed(s, x)));
        if (p) {
          p.closedUntil = s.gt + 9;
          flash(tRef.current('atc.cowMsg', { port: placeName(p) }));
          sound.flap();
        }
        s.cowT = rand(20, 30);
      }
    }
    if (s.level >= 3) {
      s.stormT -= dt;
      if (s.stormT <= 0 && s.storms.length < 2) {
        for (let tries = 0; tries < 8; tries++) {
          const c = { x: rand(v.b.minX + 1.5, v.b.maxX - 1.5), y: rand(v.b.minY + 1.2, v.b.maxY - 1.2) };
          const R = rand(0.9, 1.4);
          const clear = s.flights.every((f) => dist(f, c) > R + 1.4) && s.ports.every((p) => dist(p, c) > R + 0.5);
          if (clear) {
            const a = Math.random() * Math.PI * 2;
            s.storms.push({ ...c, R, r: 0, life: 22, vx: Math.cos(a) * 0.05, vy: Math.sin(a) * 0.05 });
            flash(tRef.current('atc.stormWarn'));
            break;
          }
        }
        s.stormT = rand(14, 20);
      }
    }
    s.storms.forEach((st) => {
      st.life -= dt;
      st.r = st.life < 3 ? st.R * Math.max(0, st.life / 3) : Math.min(st.R, st.r + (st.R / 3) * dt);
      st.x += st.vx * dt;
      st.y += st.vy * dt;
    });
    s.storms = s.storms.filter((st) => st.life > 0);
    s.birds.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    });
    s.birds = s.birds.filter((b) => b.x > v.b.minX - 1 && b.x < v.b.maxX + 1);

    // Flights.
    const gone = new Set();
    for (const f of s.flights) {
      f.rot += dt * 28;
      f.warn = Math.max(0, f.warn - dt);
      const da = f.layer - f.alt;
      f.alt += Math.sign(da) * Math.min(Math.abs(da), 0.8 * dt);
      f.battery -= dt;
      if (f.battery <= 0) {
        gone.add(f);
        loseLife(s, tRef.current('atc.battery', { cs: f.cs }), f);
        continue;
      }
      const tgt = target(f);
      const d = dist(f, tgt);
      const waiting = !f.wp && isClosed(s, f.to) && d < 1.3;
      if (f.hold > 0) f.hold = Math.max(0, f.hold - dt);
      else if (!waiting) {
        const mv = f.speed * dt;
        const want = Math.atan2(tgt.y - f.y, tgt.x - f.x);
        let diff = want - f.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        f.heading += diff * Math.min(1, dt * 8);
        if (d <= mv) {
          f.x = tgt.x;
          f.y = tgt.y;
          if (f.wp) f.wp = null;
        } else {
          f.x += ((tgt.x - f.x) / d) * mv;
          f.y += ((tgt.y - f.y) / d) * mv;
        }
      }
      // Arrival.
      if (!f.wp && dist(f, f.to) < (f.to.kind === 'gate' ? 0.35 : 0.2)) {
        gone.add(f);
        const pts = 100 + 25 * (s.level - 1) + Math.round((f.battery / f.cap) * 50) + (f.special ? 250 : 0);
        s.score += pts;
        s.landed += 1;
        s.fx.push({ kind: 'ring', x: f.x, y: f.y, t: 0 });
        if (f.special) {
          sound.success();
          flash(tRef.current('atc.home', { n: localDigits(pts, langRef.current) }), 'good');
        } else {
          sound.click();
          flash(tRef.current(f.to.kind === 'gate' ? 'atc.exited' : 'atc.arrived', { cs: f.cs, dest: placeName(f.to), n: localDigits(pts, langRef.current) }), 'good');
        }
        const lvl = 1 + Math.floor(s.landed / 5);
        if (lvl !== s.level) {
          s.level = lvl;
          sound.success();
          flash(tRef.current(lvl === 2 ? 'atc.level2' : lvl === 3 ? 'atc.level3' : 'atc.levelUp', { n: localDigits(lvl, langRef.current) }), 'good');
        }
        hudDirty = true;
        continue;
      }
      // Storms and birds.
      const storm = s.storms.find((st) => st.r > 0.2 && dist(f, st) < st.r);
      if (storm) {
        gone.add(f);
        loseLife(s, tRef.current('atc.storm', { cs: f.cs }), f);
        continue;
      }
      const flock = s.birds.find((b) => Math.abs(f.alt - b.layer) < ALT_SEP && dist(f, b) < b.r);
      if (flock) {
        gone.add(f);
        s.birds = s.birds.filter((b) => b !== flock);
        loseLife(s, tRef.current('atc.bird', { cs: f.cs }), f);
      }
    }
    // Loss of separation.
    const fl = s.flights.filter((f) => !gone.has(f));
    for (let i = 0; i < fl.length; i++) {
      for (let j = i + 1; j < fl.length; j++) {
        const a = fl[i];
        const b = fl[j];
        if (gone.has(a) || gone.has(b)) continue;
        if (Math.abs(a.alt - b.alt) < ALT_SEP && dist(a, b) < SEP_HIT) {
          gone.add(a);
          gone.add(b);
          loseLife(s, tRef.current('atc.conflict', { a: a.cs, b: b.cs }), { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        }
      }
    }
    if (gone.size) {
      s.flights = s.flights.filter((f) => !gone.has(f));
      if (s.sel && !s.flights.some((f) => f.id === s.sel)) s.sel = null;
    }

    // 4D prediction: first predicted conflict per pair, and storm entries.
    s.paths = new Map(s.flights.map((f) => [f.id, predict(s, f)]));
    s.warnings = [];
    const list = s.flights;
    for (let i = 0; i < list.length; i++) {
      const pa = s.paths.get(list[i].id);
      for (let j = i + 1; j < list.length; j++) {
        const pb = s.paths.get(list[j].id);
        const n = Math.min(pa.length, pb.length);
        for (let k = 0; k < n; k++) {
          if (Math.abs(pa[k].alt - pb[k].alt) < ALT_SEP && dist(pa[k], pb[k]) < SEP_WARN) {
            s.warnings.push({ x: (pa[k].x + pb[k].x) / 2, y: (pa[k].y + pb[k].y) / 2, t: pa[k].t });
            list[i].warn = 0.3;
            list[j].warn = 0.3;
            break;
          }
        }
      }
      for (const st of s.storms) {
        const hit = pa.find((p) => dist(p, st) < st.R + 0.1);
        if (hit) {
          s.warnings.push({ x: hit.x, y: hit.y, t: hit.t });
          list[i].warn = 0.3;
        }
      }
    }
    s.fx.forEach((e) => {
      e.t += dt;
    });
    s.fx = s.fx.filter((e) => e.t < 1.2);
    if (hudDirty) pushHud();
    syncInfo();
  };

  // ---------------------------------------------------------------- drawing
  const buildMap = (v, p) => {
    const key = `${v.W}x${v.H}:${p.bg2}:${p.ink}:${p.accent}:${langRef.current}`;
    if (mapCache.current.key === key && mapCache.current.canvas) return mapCache.current.canvas;
    const dpr = canvasRef.current.width / v.W;
    const c = mapCache.current.canvas || document.createElement('canvas');
    c.width = Math.round(v.W * dpr);
    c.height = Math.round(v.H * dpr);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = p.bg2;
    g.fillRect(0, 0, v.W, v.H);
    // Hills: noisy rings closing in on the valley floor.
    const rnd = seeded(2504);
    const phases = Array.from({ length: 4 }, () => [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28]);
    const ring = (k) => {
      const rx = (v.b.maxX - v.b.minX) / 2 + 0.6 - k * 0.75;
      const ry = (v.b.maxY - v.b.minY) / 2 + 0.6 - k * 0.7;
      const [p1, p2, p3] = phases[k];
      g.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const wob = 0.42 * Math.sin(a * 3 + p1) + 0.28 * Math.sin(a * 7 + p2) + 0.16 * Math.sin(a * 13 + p3);
        const pt = v.toPx({ x: v.cx + Math.cos(a) * (rx + wob), y: v.cy + Math.sin(a) * (ry + wob) });
        if (i) g.lineTo(pt.x, pt.y);
        else g.moveTo(pt.x, pt.y);
      }
      g.closePath();
    };
    g.save();
    g.globalAlpha = p.night ? 0.5 : 0.65;
    g.fillStyle = p.bg3;
    g.beginPath();
    g.rect(0, 0, v.W, v.H);
    ring(1);
    g.fill('evenodd');
    g.restore();
    g.strokeStyle = p.ink3;
    g.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      g.globalAlpha = 0.12 + k * 0.05;
      ring(k);
      g.stroke();
    }
    g.globalAlpha = 1;
    // Kilometre grid.
    g.strokeStyle = p.line;
    g.beginPath();
    for (let x = Math.ceil(v.b.minX); x <= v.b.maxX; x++) {
      const px = Math.round(v.toPx({ x, y: 0 }).x) + 0.5;
      g.moveTo(px, 0);
      g.lineTo(px, v.H);
    }
    for (let y = Math.ceil(v.b.minY); y <= v.b.maxY; y++) {
      const py = Math.round(v.toPx({ x: 0, y }).y) + 0.5;
      g.moveTo(0, py);
      g.lineTo(v.W, py);
    }
    g.stroke();
    // Ring Road.
    g.save();
    g.strokeStyle = p.ink3;
    g.globalAlpha = 0.45;
    g.setLineDash([6, 5]);
    g.lineWidth = 1.5;
    const rc = v.toPx({ x: -0.2, y: -0.3 });
    g.beginPath();
    g.ellipse(rc.x, rc.y, 3.8 * v.scale, 3.3 * v.scale, -0.08, 0, Math.PI * 2);
    g.stroke();
    g.restore();
    // Bagmati.
    g.save();
    g.strokeStyle = p.ink3;
    g.globalAlpha = 0.5;
    g.lineWidth = Math.max(2, v.scale * 0.12);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    RIVER.forEach(([x, y], i) => {
      const pt = v.toPx({ x, y });
      if (i) g.lineTo(pt.x, pt.y);
      else g.moveTo(pt.x, pt.y);
    });
    g.stroke();
    g.restore();
    const font = (size, weight = 500) => `${weight} ${size}px 'Geist Mono Variable', ui-monospace, 'Noto Sans Devanagari Variable', monospace`;
    g.fillStyle = p.ink3;
    g.font = font(10);
    g.textAlign = 'center';
    const rl = v.toPx({ x: -1.4, y: 0.95 });
    g.fillText(tRef.current('atc.river'), rl.x, rl.y);
    const rr = v.toPx({ x: -0.2, y: -3.85 });
    g.fillText(tRef.current('atc.ring'), rr.x, rr.y);
    // Hills ringing the valley.
    g.font = font(10, 600);
    HILLS.forEach((h) => {
      const pt = v.toPx(edgePoint(v, h.dir, 0.55));
      g.globalAlpha = 0.75;
      g.fillText(`▲ ${tRef.current(`atc.h.${h.id}`)}`, clamp(pt.x, 50, v.W - 50), clamp(pt.y, 14, v.H - 8));
    });
    g.globalAlpha = 1;
    mapCache.current = { key, canvas: c };
    return c;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const v = view.current;
    if (!canvas || !v) return;
    const ctx = canvas.getContext('2d');
    const p = pal.current;
    const s = sim.current;
    const now = performance.now() / 1000;
    const blink = reduce.current ? 1 : 0.55 + 0.45 * Math.sin(now * 8);
    const font = (size, weight = 600) => `${weight} ${size}px 'Geist Mono Variable', ui-monospace, 'Noto Sans Devanagari Variable', monospace`;
    ctx.clearRect(0, 0, v.W, v.H);
    ctx.drawImage(buildMap(v, p), 0, 0, v.W, v.H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Gates.
    s.gates.forEach((gt) => {
      const pt = v.toPx(gt);
      const a = Math.atan2(gt.dir.y, gt.dir.x);
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(a);
      ctx.strokeStyle = p.ink2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(2, 0);
      ctx.lineTo(-6, 6);
      ctx.moveTo(-1, -6);
      ctx.lineTo(7, 0);
      ctx.lineTo(-1, 6);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = p.ink2;
      ctx.font = font(10);
      const lx = clamp(pt.x - Math.cos(a) * 26, 40, v.W - 40);
      const ly = clamp(pt.y - Math.sin(a) * 18 + 4, 12, v.H - 6);
      ctx.fillText(tRef.current(`atc.g.${gt.id}`), lx, ly);
    });

    // Vertiports.
    s.ports.forEach((pt0) => {
      const pt = v.toPx(pt0);
      const closed = isClosed(s, pt0);
      ctx.fillStyle = p.surface2;
      ctx.strokeStyle = closed ? p.accentFg : p.ink2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = closed ? p.accentFg : p.ink;
      ctx.font = font(11, 700);
      ctx.textBaseline = 'middle';
      ctx.fillText('H', pt.x, pt.y + 0.5);
      ctx.textBaseline = 'alphabetic';
      if (closed) {
        ctx.strokeStyle = p.accentFg;
        ctx.beginPath();
        ctx.moveTo(pt.x - 9, pt.y - 9);
        ctx.lineTo(pt.x + 9, pt.y + 9);
        ctx.stroke();
      }
      ctx.font = font(10);
      ctx.fillStyle = closed ? p.accentFg : p.ink2;
      ctx.fillText(closed ? tRef.current('atc.cow') : tRef.current(`atc.p.${pt0.id}`), pt.x, pt.y + 25);
    });

    // Storm cells.
    s.storms.forEach((st) => {
      const c = v.toPx(st);
      const r = st.r * v.scale;
      if (r < 1) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = p.ink;
      ctx.fill();
      ctx.clip();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = p.ink2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = -r * 2; k < r * 2; k += 7) {
        ctx.moveTo(c.x + k - r, c.y - r);
        ctx.lineTo(c.x + k + r, c.y + r);
      }
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = p.ink2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = p.ink;
      ctx.font = font(10, 700);
      ctx.fillText(tRef.current('atc.stormLabel'), c.x, c.y + 4);
    });

    // Birds.
    s.birds.forEach((b) => {
      const c = v.toPx(b);
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = 1.4;
      const flap = reduce.current ? 0 : Math.sin(now * 10) * 1.5;
      [[0, 0], [-8, 5], [7, 6], [-3, -7], [9, -4]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(c.x + dx - 4, c.y + dy - 2 - flap);
        ctx.lineTo(c.x + dx, c.y + dy);
        ctx.lineTo(c.x + dx + 4, c.y + dy - 2 - flap);
        ctx.stroke();
      });
      ctx.fillStyle = p.ink2;
      ctx.font = font(9);
      ctx.fillText(`${tRef.current('atc.birds')} L${b.layer}`, c.x, c.y + 20);
    });

    // Predicted 4D paths.
    const sel = s.sel;
    s.flights.forEach((f) => {
      const path = s.paths?.get(f.id);
      if (!path || !path.length) return;
      const isSel = f.id === sel;
      const a = v.toPx(f);
      ctx.save();
      ctx.strokeStyle = isSel ? p.accentFg : p.ink3;
      ctx.globalAlpha = isSel ? 0.95 : 0.55;
      ctx.lineWidth = isSel ? 1.6 : 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      path.forEach((q) => {
        const pt = v.toPx(q);
        ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ctx.strokeStyle;
      path.forEach((q, k) => {
        if ((k + 1) % 4) return;
        const pt = v.toPx(q);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isSel ? 2.2 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      if (f.wp) {
        const w = v.toPx(f.wp);
        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = isSel ? p.accentFg : p.ink3;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-4, -4, 8, 8);
        ctx.restore();
      }
    });

    // Drag line while setting a waypoint.
    const dg = drag.current;
    if (dg?.moved && dg.p) {
      const f = s.flights.find((x) => x.id === dg.id);
      if (f) {
        const a = v.toPx(f);
        const b = v.toPx(dg.p);
        ctx.save();
        ctx.strokeStyle = p.accentFg;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-6, -6, 12, 12);
        ctx.restore();
      }
    }

    // Predicted conflicts.
    s.warnings.forEach((w) => {
      const c = v.toPx(w);
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.strokeStyle = p.accentFg;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(10, (SEP_WARN / 2) * v.scale), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = p.accentFg;
      ctx.font = font(10, 700);
      ctx.fillText(tRef.current('atc.inSec', { n: localDigits(Math.max(1, Math.round(w.t)), langRef.current) }), c.x, c.y - Math.max(13, (SEP_WARN / 2) * v.scale) - 4);
      ctx.restore();
    });

    // Aircraft.
    s.flights.forEach((f) => {
      const c = v.toPx(f);
      const isSel = f.id === sel;
      const k = 1 + (f.alt - 1) * 0.14;
      // Shadow: farther away the higher it flies.
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = p.ink;
      ctx.beginPath();
      ctx.ellipse(c.x + f.alt * 3, c.y + f.alt * 4, 9 * k, 7 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (isSel) {
        ctx.save();
        ctx.strokeStyle = p.accentFg;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(16, SEP_HIT * v.scale), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (f.warn > 0) {
        ctx.save();
        ctx.globalAlpha = blink;
        ctx.strokeStyle = p.accentFg;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 14 * k, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(f.heading);
      ctx.scale(k, k);
      const body = isSel ? p.accent : p.ink;
      ctx.strokeStyle = isSel ? p.accentFg : p.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(6, 6);
      ctx.moveTo(-6, 6);
      ctx.lineTo(6, -6);
      ctx.stroke();
      [[-6, -6], [6, 6], [-6, 6], [6, -6]].forEach(([rx, ry], i) => {
        ctx.fillStyle = p.surface2;
        ctx.beginPath();
        ctx.arc(rx, ry, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const a = f.rot * (i % 2 ? 1 : -1);
        ctx.beginPath();
        ctx.moveTo(rx + Math.cos(a) * 3.4, ry + Math.sin(a) * 3.4);
        ctx.lineTo(rx - Math.cos(a) * 3.4, ry - Math.sin(a) * 3.4);
        ctx.stroke();
      });
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-5, -3.2, 11, 6.4, 3) : ctx.rect(-5, -3.2, 11, 6.4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // Data tag.
      const tx = c.x + 13;
      const ty = c.y - 13;
      const lowBatt = f.battery / f.cap < 0.25;
      ctx.textAlign = 'left';
      ctx.font = font(10, 700);
      ctx.fillStyle = isSel ? p.accentFg : f.special ? p.accentFg : p.ink;
      const climb = f.layer > f.alt + 0.05 ? '↑' : f.layer < f.alt - 0.05 ? '↓' : '';
      ctx.fillText(`${f.cs}`, tx, ty);
      ctx.font = font(9, 500);
      ctx.fillStyle = p.ink2;
      const hold = f.hold > 0 ? ' H' : '';
      ctx.fillText(`L${f.layer}${climb} ${f.to.code}${hold}`, tx, ty + 11);
      ctx.fillStyle = p.line;
      ctx.fillRect(tx, ty + 15, 22, 3);
      ctx.globalAlpha = lowBatt ? blink : 1;
      ctx.fillStyle = lowBatt ? p.accentFg : p.ink3;
      ctx.fillRect(tx, ty + 15, 22 * clamp(f.battery / f.cap, 0, 1), 3);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
    });

    // Effects.
    s.fx.forEach((e) => {
      const c = v.toPx(e);
      const k = e.t / 1.2;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = e.kind === 'ring' ? p.ink2 : p.accentFg;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, (reduce.current ? 14 : 8 + k * 26) * (e.kind === 'burst' ? 1.3 : 1), 0, Math.PI * 2);
      ctx.stroke();
      if (e.kind === 'burst') {
        ctx.beginPath();
        ctx.moveTo(c.x - 8, c.y - 8);
        ctx.lineTo(c.x + 8, c.y + 8);
        ctx.moveTo(c.x + 8, c.y - 8);
        ctx.lineTo(c.x - 8, c.y + 8);
        ctx.stroke();
      }
      ctx.restore();
    });
  };

  useLoop(active && phase === 'play', (dt) => {
    step(dt);
    draw();
  });

  // Redraw once when paused or between games (theme or language changes).
  useEffect(() => {
    if (!(active && phase === 'play')) draw();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- input
  const selected = () => sim.current.flights.find((f) => f.id === sim.current.sel);
  const canAct = () => phaseRef.current === 'play' && activeRef.current;

  const setWaypoint = (f, km) => {
    const v = view.current;
    f.wp = { x: clamp(km.x, v.b.minX + 0.3, v.b.maxX - 0.3), y: clamp(km.y, v.b.minY + 0.3, v.b.maxY - 0.3) };
    f.hold = 0;
    sound.flap();
    syncInfo();
  };

  const cycle = (dir) => {
    if (!canAct()) return;
    const s = sim.current;
    if (!s.flights.length) return;
    const sorted = [...s.flights].sort((a, b) => a.x - b.x);
    const i = sorted.findIndex((f) => f.id === s.sel);
    const next = sorted[(i + dir + sorted.length) % sorted.length] || sorted[0];
    s.sel = next.id;
    sound.click();
    syncInfo();
  };
  const setLayer = (fn) => {
    if (!canAct()) return;
    const f = selected();
    if (!f) return cycle(1);
    const l = clamp(fn(f.layer), 1, 3);
    if (l !== f.layer) {
      f.layer = l;
      sound.click();
      syncInfo();
    }
  };
  const vector = (side) => {
    if (!canAct()) return;
    const f = selected();
    if (!f) return cycle(1);
    const d = dist(f, f.to) || 1;
    const ux = (f.to.x - f.x) / d;
    const uy = (f.to.y - f.y) / d;
    const ahead = Math.min(2, d / 2);
    // Left of track (screen y points down): (uy, -ux).
    const nx = side < 0 ? uy : -uy;
    const ny = side < 0 ? -ux : ux;
    setWaypoint(f, { x: f.x + ux * ahead + nx * 1.6, y: f.y + uy * ahead + ny * 1.6 });
  };
  const toggleHold = () => {
    if (!canAct()) return;
    const f = selected();
    if (!f) return cycle(1);
    f.hold = f.hold > 0 ? 0 : MAX_HOLD;
    sound.click();
    syncInfo();
  };
  const direct = () => {
    if (!canAct()) return;
    const f = selected();
    if (!f) return;
    f.wp = null;
    f.hold = 0;
    sound.click();
    syncInfo();
  };

  const pointerKm = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { px: e.clientX - r.left, py: e.clientY - r.top, km: view.current.toKm(e.clientX - r.left, e.clientY - r.top) };
  };

  const onPointerDown = (e) => {
    if (!canAct() || !view.current) return;
    const { px, py, km } = pointerKm(e);
    const s = sim.current;
    const v = view.current;
    let best = null;
    let bestD = Math.max(26, coarse ? 32 : 24);
    s.flights.forEach((f) => {
      const c = v.toPx(f);
      const d = Math.hypot(c.x - px, c.y - py);
      if (d < bestD) {
        best = f;
        bestD = d;
      }
    });
    if (best) {
      s.sel = best.id;
      drag.current = { id: best.id, sx: px, sy: py, moved: false, p: null };
      canvasRef.current.setPointerCapture?.(e.pointerId);
      sound.click();
      syncInfo();
    } else if (s.sel) {
      const f = selected();
      if (f) setWaypoint(f, km);
    }
  };
  const onPointerMove = (e) => {
    const dg = drag.current;
    if (!dg || !view.current) return;
    const { px, py, km } = pointerKm(e);
    if (!dg.moved && Math.hypot(px - dg.sx, py - dg.sy) > 10) dg.moved = true;
    if (dg.moved) dg.p = km;
  };
  const onPointerUp = () => {
    const dg = drag.current;
    drag.current = null;
    if (!dg?.moved || !dg.p) return;
    const f = sim.current.flights.find((x) => x.id === dg.id);
    if (f && canAct()) setWaypoint(f, dg.p);
  };

  const onKey = (e) => {
    if (phase !== 'play' || isButtonActivation(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const map = {
      ArrowRight: () => cycle(1),
      n: () => cycle(1),
      ArrowLeft: () => cycle(-1),
      b: () => cycle(-1),
      ArrowUp: () => setLayer((l) => l + 1),
      w: () => setLayer((l) => l + 1),
      ArrowDown: () => setLayer((l) => l - 1),
      s: () => setLayer((l) => l - 1),
      1: () => setLayer(() => 1),
      2: () => setLayer(() => 2),
      3: () => setLayer(() => 3),
      q: () => vector(-1),
      e: () => vector(1),
      h: toggleHold,
      d: direct,
      Escape: () => {
        sim.current.sel = null;
        syncInfo();
      },
    };
    if (!map[k]) return;
    claimKey(e);
    map[k]();
  };

  return (
    <div ref={rootRef} className="ag-root atc" tabIndex={-1} onKeyDown={onKey}>
      <div className="ag-hud">
        <Stat label={t('ag.score')} value={hud.score} />
        <Stat label={t('ag.level')} value={hud.level} />
        <Stat label={t('atc.landed')} value={hud.landed} />
        <Pips label={t('ag.lives')} total={LIVES} left={hud.lives} />
      </div>

      <div ref={wrapRef} className="atc-map">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={t('atc.mapLabel')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null;
          }}
        />
      </div>

      <p className="ag-live" data-tone={msg?.tone} aria-live="polite" key={msg?.key}>
        {msg?.text || ' '}
      </p>

      <div className="atc-info" aria-live="off">
        {info ? (
          <span>
            <b>{info.cs}</b> {t('atc.info', { l: localDigits(info.layer, lang), dest: info.dest, b: localDigits(info.battery, lang) })}
          </span>
        ) : (
          <span className="atc-info-empty">{t('atc.select')}</span>
        )}
      </div>

      <div className="ag-pads atc-pads" role="group" aria-label={t('ag.controls')}>
        <PadButton label={t('atc.prev')} onPress={() => cycle(-1)}>
          <CaretLeftIcon size={18} weight="bold" aria-hidden="true" />
          <span>{t('atc.prev')}</span>
        </PadButton>
        <PadButton label={t('atc.next')} onPress={() => cycle(1)}>
          <CaretRightIcon size={18} weight="bold" aria-hidden="true" />
          <span>{t('atc.next')}</span>
        </PadButton>
        <PadButton label={t('atc.climb')} onPress={() => setLayer((l) => l + 1)} disabled={!info || info.layer >= 3}>
          <ArrowFatUpIcon size={18} weight="bold" aria-hidden="true" />
          <span>{t('atc.climb')}</span>
        </PadButton>
        <PadButton label={t('atc.descend')} onPress={() => setLayer((l) => l - 1)} disabled={!info || info.layer <= 1}>
          <ArrowFatDownIcon size={18} weight="bold" aria-hidden="true" />
          <span>{t('atc.descend')}</span>
        </PadButton>
        <PadButton label={t('atc.left')} onPress={() => vector(-1)} disabled={!info}>
          <ArrowBendUpLeftIcon size={18} weight="bold" aria-hidden="true" />
          <span>{t('atc.leftShort')}</span>
        </PadButton>
        <PadButton label={t('atc.right')} onPress={() => vector(1)} disabled={!info}>
          <ArrowBendUpRightIcon size={18} weight="bold" aria-hidden="true" />
          <span>{t('atc.rightShort')}</span>
        </PadButton>
        <PadButton label={t('atc.hold')} onPress={toggleHold} disabled={!info} pressed={!!info?.hold}>
          <HandPalmIcon size={18} weight="bold" aria-hidden="true" />
          <span>{t('atc.hold')}</span>
        </PadButton>
        <PadButton label={t('atc.direct')} onPress={direct} disabled={!info || (!info.wp && !info.hold)}>
          <NavigationArrowIcon size={18} weight="bold" aria-hidden="true" />
          <span>{t('atc.direct')}</span>
        </PadButton>
      </div>
      {!coarse && <p className="ag-hint">{t('atc.keys')}</p>}

      {phase === 'start' && (
        <Overlay
          kicker={t('ag.basedOnResearch')}
          title={t('g.atc-tower.title')}
          actions={
            <button type="button" className="btn btn-accent btn-sm" data-primary onClick={start}>
              <DroneIcon size={18} weight="bold" aria-hidden="true" />
              {t('ag.start')}
            </button>
          }
        >
          <ul className="ag-how">
            <li>{t('atc.how1')}</li>
            <li>{t('atc.how2')}</li>
            <li>{t('atc.how3')}</li>
          </ul>
          <p className="ag-sub">{coarse ? t('atc.touch') : t('atc.keysShort')}</p>
        </Overlay>
      )}
      {phase === 'over' && over && (
        <Overlay
          kicker={t('ag.gameOver')}
          title={t('atc.overTitle')}
          tone="over"
          actions={
            <button type="button" className="btn btn-accent btn-sm" data-primary onClick={start}>
              {t('ag.again')}
            </button>
          }
        >
          <p className="ag-big">{localDigits(over.score.toLocaleString('en-US'), lang)}</p>
          <p className="ag-sub">{t('atc.overBody', { landed: localDigits(over.landed, lang), level: localDigits(over.level, lang) })}</p>
          <p className="ag-joke">
            <span>{t('ag.jokeBreak')}</span> {over.joke}
          </p>
        </Overlay>
      )}
    </div>
  );
}
