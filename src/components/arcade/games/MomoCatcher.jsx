import { useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, PauseIcon } from '@phosphor-icons/react';
import dict from '../../../i18n/ui/arcade-b';
import { localDigits, useLang, useT } from '../../../i18n';
import { sound } from '../../../lib/sound';
import { alpha, claim, clamp, font, isButtonKey, mixColor, pickJoke, rand, rr, useBest, useGameLoop, usePalette, useReduced, useStage } from './b-kit';
import { Hud, Pad, Panel, Pips } from './b-ui';

// Momo Catcher: catch steamed, fried and jhol momos on your plate, dodge the
// chillies, grab the achar bowl for double points. Every ten momos the
// plate is served. It speeds up as you go.

export const meta = {
  title: 'Momo Catcher',
  blurb: 'Catch the momos, dodge the chillies.',
  controls: 'Move with the mouse, a finger or the arrow keys.',
};

const LIVES = 5;
const PLATE_Y = 262;
const PLATE_W = 66;
const ACHAR_TIME = 6;
const TYPES = {
  steamed: { pts: 10, speed: 1, r: 12, w: 46 },
  fried: { pts: 15, speed: 1.3, r: 12, w: 22 },
  jhol: { pts: 25, speed: 0.85, r: 14, w: 14 },
  chilli: { pts: 0, speed: 1.15, r: 11, w: 0 },
  achar: { pts: 50, speed: 1.1, r: 13, w: 0 },
};

function newSim() {
  return { t: 0, x: 0, vx: 0, items: [], parts: [], pops: [], lives: LIVES, score: 0, caught: 0, combo: 0, pile: 0, achar: 0, spawnT: 0.6, chilliStreak: 0, over: false, steam: [] };
}

const level = (s) => 1 + Math.floor(s.caught / 12);
const mult = (s) => (1 + Math.min(3, Math.floor(s.combo / 8))) * (s.achar > 0 ? 2 : 1);

function pickType(s) {
  const lv = level(s);
  const r = Math.random();
  const chilli = Math.min(0.3, 0.1 + lv * 0.025);
  if (r < chilli) return 'chilli';
  if (r < chilli + 0.04 && s.achar <= 0) return 'achar';
  const m = Math.random();
  if (m < 0.55) return 'steamed';
  if (m < 0.82) return 'fried';
  return 'jhol';
}

export default function MomoCatcher({ active = true, onScore }) {
  const t = useT(dict);
  const lang = useLang();
  const pal = usePalette();
  const reduce = useReduced();
  const { wrapRef, canvasRef, sizeRef, ctxRef } = useStage((w) => (w < 560 ? clamp(w * 1.2, 340, 480) : clamp(w * 0.55, 340, 460)));
  const rootRef = useRef(null);
  const sim = useRef(newSim());
  const [phase, setPhase] = useState('start');
  const [hud, setHud] = useState({ score: 0, caught: 0, lives: LIVES, level: 1, mult: 1 });
  const [result, setResult] = useState(null);
  const [live, setLive] = useState('');
  const [best, submitBest] = useBest('momo-catcher');
  const keys = useRef(new Set());
  const target = useRef(null);
  const hudT = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!active && phase === 'play') setPhase('paused');
  }, [active, phase]);

  const vwOf = () => {
    const { w, h } = sizeRef.current;
    return w / (h / 300);
  };

  const start = () => {
    const s = newSim();
    s.x = vwOf() / 2;
    sim.current = s;
    keys.current.clear();
    target.current = null;
    setResult(null);
    setHud({ score: 0, caught: 0, lives: LIVES, level: 1, mult: 1 });
    setPhase('play');
    sound.click();
    rootRef.current?.focus({ preventScroll: true });
  };

  const end = (s) => {
    s.over = true;
    const isNew = submitBest(s.score);
    onScore?.(s.score);
    sound.bowl(0.9);
    setResult({ score: s.score, caught: s.caught, isNew, joke: pickJoke(['food'], lang) });
    setHud((hh) => ({ ...hh, score: s.score, lives: 0 }));
    setPhase('over');
  };

  const pop = (s, x, y, text, tone) => s.pops.push({ x, y, text, tone, t: 0 });

  // ------------------------------------------------------------ update
  const update = (dt) => {
    const s = sim.current;
    if (s.over) return;
    const vw = vwOf();
    s.t += dt;
    s.achar = Math.max(0, s.achar - dt);
    const lv = level(s);

    // Plate.
    const half = PLATE_W / 2;
    if (target.current != null) {
      const nx = s.x + (target.current - s.x) * Math.min(1, dt * 18);
      s.vx = (nx - s.x) / Math.max(dt, 0.001);
      s.x = nx;
    } else {
      const dir = (keys.current.has('right') ? 1 : 0) - (keys.current.has('left') ? 1 : 0);
      s.vx += (dir * 460 - s.vx) * Math.min(1, dt * 10);
      s.x += s.vx * dt;
    }
    s.x = clamp(s.x, half + 4, vw - half - 4);

    // Spawn.
    s.spawnT -= dt;
    if (s.spawnT <= 0) {
      const type = pickType(s);
      if (type === 'chilli') s.chilliStreak += 1;
      const finalType = type === 'chilli' && s.chilliStreak > 2 ? 'steamed' : type;
      if (finalType !== 'chilli') s.chilliStreak = 0;
      const T = TYPES[finalType];
      s.items.push({ type: finalType, x: rand(20, vw - 20), y: -20, vy: (78 + lv * 13) * T.speed * rand(0.9, 1.1), sway: rand(0, 6), rot: rand(-0.3, 0.3), vr: rand(-2, 2) });
      s.spawnT = Math.max(0.3, 1.05 - lv * 0.07) * rand(0.75, 1.2);
    }

    // Fall and catch.
    for (const it of s.items) {
      const T = TYPES[it.type];
      const prevY = it.y;
      it.y += it.vy * dt;
      if (it.type === 'jhol') it.x += Math.sin(s.t * 2.2 + it.sway) * 26 * dt;
      it.x = clamp(it.x, 12, vw - 12);
      if (it.type === 'chilli') it.rot += it.vr * dt;
      const top = PLATE_Y - 10 - Math.min(s.pile, 9) * 2.2;
      if (!it.done && prevY + T.r <= top + 8 && it.y + T.r >= top && Math.abs(it.x - s.x) < half + T.r * 0.5) {
        it.done = true;
        catchItem(s, it, lv);
      } else if (!it.done && it.y > 320) {
        it.done = true;
        if (it.type !== 'chilli' && it.type !== 'achar') {
          s.combo = 0;
          s.lives -= 1;
          sound.flap();
          pop(s, it.x, 284, tRef.current('mcDropped'), 'warn');
          setLive(tRef.current('mcDropped'));
          if (!reduce) for (let i = 0; i < 6; i++) s.parts.push({ x: it.x, y: 296, vx: rand(-60, 60), vy: rand(-90, -30), life: 0.5, c: '#e9dcc4' });
        }
      }
    }
    s.items = s.items.filter((it) => !it.done);
    if (s.lives <= 0) {
      end(s);
      return;
    }

    for (const p of s.parts) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
    }
    s.parts = s.parts.filter((p) => p.life > 0);
    for (const p of s.pops) p.t += dt;
    s.pops = s.pops.filter((p) => p.t < 1.1);
    if (!reduce && Math.random() < dt * 6) s.steam.push({ x: rand(vw * 0.42, vw * 0.58), y: 46, life: 1.6, r: rand(4, 8) });
    for (const st of s.steam) {
      st.life -= dt;
      st.y -= 16 * dt;
      st.r += 6 * dt;
    }
    s.steam = s.steam.filter((st) => st.life > 0);

    hudT.current -= dt;
    if (hudT.current <= 0) {
      hudT.current = 0.15;
      setHud({ score: s.score, caught: s.caught, lives: s.lives, level: lv, mult: mult(s) });
    }
  };

  function catchItem(s, it, lv) {
    const T = TYPES[it.type];
    if (it.type === 'chilli') {
      s.lives -= 1;
      s.combo = 0;
      sound.stamp();
      const text = tRef.current('mcSpicy');
      pop(s, it.x, PLATE_Y - 30, text, 'warn');
      setLive(text);
      if (!reduce) for (let i = 0; i < 10; i++) s.parts.push({ x: it.x, y: PLATE_Y - 10, vx: rand(-90, 90), vy: rand(-160, -40), life: 0.6, c: '#d6362b' });
      return;
    }
    if (it.type === 'achar') {
      s.achar = ACHAR_TIME;
      s.score += T.pts;
      sound.success();
      const text = tRef.current('mcAchar');
      pop(s, it.x, PLATE_Y - 34, text, 'accent');
      setLive(text);
      return;
    }
    s.combo += 1;
    s.caught += 1;
    s.pile += 1;
    const pts = T.pts * mult(s);
    s.score += pts;
    sound.click();
    pop(s, it.x, PLATE_Y - 30, `+${localDigits(pts, lang)}`, 'accent');
    if (s.pile >= 10) {
      s.pile = 0;
      const bonus = 30 + lv * 5;
      s.score += bonus;
      sound.success();
      const text = tRef.current('mcServed', { n: localDigits(bonus, lang) });
      pop(s, s.x, PLATE_Y - 56, text, 'accent');
      setLive(text);
    }
  }

  // ------------------------------------------------------------ draw
  const draw = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const s = sim.current;
    const P = pal.current;
    const { w, h } = sizeRef.current;
    const U = h / 300;
    const vw = w / U;
    const night = P.night;
    if (!s.x) s.x = vw / 2;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.scale(U, U);

    // The stall wall.
    const wall = ctx.createLinearGradient(0, 0, 0, 300);
    wall.addColorStop(0, night ? mixColor(P.bg, '#000000', 0.2) : mixColor(P.bg, '#e9d9bd', 0.5));
    wall.addColorStop(1, night ? P.bg2 : mixColor(P.bg, '#d9c19a', 0.45));
    ctx.fillStyle = wall;
    ctx.fillRect(-10, -10, vw + 20, 320);
    ctx.strokeStyle = alpha(P.ink, 0.05);
    ctx.lineWidth = 1;
    for (let y = 30; y < 280; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(vw, y);
      ctx.stroke();
      for (let x = ((y / 22) % 2) * 22; x < vw; x += 44) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 22);
        ctx.stroke();
      }
    }
    if (s.achar > 0) {
      ctx.fillStyle = alpha(P.accent, 0.08 + (reduce ? 0 : 0.04 * Math.sin(s.t * 6)));
      ctx.fillRect(0, 0, vw, 300);
    }

    // String lights.
    ctx.strokeStyle = alpha(P.ink, 0.3);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let x = 0; x <= vw; x += 8) {
      const y = 10 + 6 * Math.sin((x / vw) * Math.PI * 3) ** 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let x = 14, i = 0; x < vw; x += 26, i++) {
      const y = 12 + 6 * Math.sin((x / vw) * Math.PI * 3) ** 2;
      const on = reduce || night || (i + Math.floor(s.t * 2)) % 3 !== 0;
      ctx.fillStyle = on ? (night ? '#f5c66b' : alpha('#e0a83a', 0.9)) : alpha('#e0a83a', 0.35);
      ctx.beginPath();
      ctx.arc(x, y + 3, 2.4, 0, Math.PI * 2);
      ctx.fill();
      if (night && on) {
        ctx.fillStyle = 'rgba(245,198,107,0.12)';
        ctx.beginPath();
        ctx.arc(x, y + 3, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Steamer stack (the momo ko dabba) with the stall sign.
    const cx = vw / 2;
    ctx.fillStyle = night ? '#6b7183' : '#b9bec7';
    for (let i = 0; i < 3; i++) {
      rr(ctx, cx - 26, 50 + i * 10, 52, 9, 3);
      ctx.fill();
    }
    ctx.fillStyle = night ? '#8a90a3' : '#d3d7de';
    rr(ctx, cx - 22, 44, 44, 7, 3.5);
    ctx.fill();
    for (const st of s.steam) {
      ctx.fillStyle = alpha(night ? P.ink : '#ffffff', clamp(st.life * 0.25, 0, 0.35));
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = font(14, 400, 'sans');
    ctx.textAlign = 'center';
    ctx.fillStyle = alpha(P.accentFg, 0.9);
    rr(ctx, cx - 60, 86, 120, 22, 11);
    ctx.fillStyle = alpha(P.surface, 0.8);
    ctx.fill();
    ctx.fillStyle = P.accentFg;
    ctx.font = font(11, 700, 'display');
    ctx.fillText(tRef.current('mcSign'), cx, 101);

    // Counter.
    ctx.fillStyle = night ? '#2a2233' : '#8a5a36';
    ctx.fillRect(-10, 284, vw + 20, 30);
    ctx.fillStyle = night ? '#3a3046' : '#a06c43';
    ctx.fillRect(-10, 280, vw + 20, 6);

    // Falling food.
    for (const it of s.items) drawItem(ctx, it, P, night, tRef.current);

    // Plate with the pile.
    const px = s.x;
    ctx.fillStyle = alpha('#000000', 0.15);
    ctx.beginPath();
    ctx.ellipse(px, PLATE_Y + 9, PLATE_W / 2 + 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = night ? '#d8d4ca' : '#fbfaf6';
    ctx.beginPath();
    ctx.ellipse(px, PLATE_Y, PLATE_W / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(px, PLATE_Y, PLATE_W / 2 - 4, 5.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    const pile = Math.min(s.pile, 9);
    for (let i = 0; i < pile; i++) {
      const row = i < 4 ? 0 : i < 7 ? 1 : 2;
      const inRow = row === 0 ? i : row === 1 ? i - 4 : i - 7;
      const n = row === 0 ? 4 : row === 1 ? 3 : 2;
      const mx = px + (inRow - (n - 1) / 2) * 13;
      const my = PLATE_Y - 5 - row * 8;
      drawMomo(ctx, mx, my, 0.55, night ? '#e6dccb' : '#f6efe0', night ? '#a99c86' : '#c9b99c');
    }

    for (const p of s.parts) {
      ctx.fillStyle = alpha(p.c, clamp(p.life * 2, 0, 1));
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.textAlign = 'center';
    for (const p of s.pops) {
      const a = clamp(1.1 - p.t, 0, 1);
      ctx.font = font(12, 750, 'display');
      const tw = ctx.measureText(p.text).width;
      const x = clamp(p.x, tw / 2 + 6, vw - tw / 2 - 6);
      const y = p.y - p.t * (reduce ? 0 : 30);
      ctx.fillStyle = alpha(P.surface, 0.85 * a);
      rr(ctx, x - tw / 2 - 6, y - 12, tw + 12, 17, 8.5);
      ctx.fill();
      ctx.fillStyle = alpha(p.tone === 'warn' ? (night ? '#fb923c' : '#c2410c') : P.accentFg, a);
      ctx.fillText(p.text, x, y + 1);
    }
    if (s.achar > 0) {
      const text = `${tRef.current('mcAcharMode')} ${localDigits(Math.ceil(s.achar), lang)}`;
      ctx.font = font(11, 700, 'sans');
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = P.accent;
      rr(ctx, vw / 2 - tw / 2 - 10, 118, tw + 20, 20, 10);
      ctx.fill();
      ctx.fillStyle = P.accentInk;
      ctx.fillText(text, vw / 2, 132);
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
    if (phase !== 'play') draw();
  });
  useEffect(() => {
    if (phase !== 'play') {
      keys.current.clear();
      target.current = null;
    }
  }, [phase]);

  // ------------------------------------------------------------ input
  const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  const onKeyDown = (e) => {
    if (isButtonKey(e)) return;
    if (phase === 'play') {
      const dir = KEYMAP[e.key];
      if (dir) {
        claim(e);
        keys.current.add(dir);
        target.current = null;
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
  const pointerX = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { h } = sizeRef.current;
    return (e.clientX - rect.left) / (h / 300);
  };
  const onPointerDown = (e) => {
    if (phase !== 'play') return;
    rootRef.current?.focus({ preventScroll: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    target.current = pointerX(e);
  };
  const onPointerMove = (e) => {
    if (phase !== 'play') return;
    // Mouse follows on hover; touch and pen follow while pressed.
    if (e.pointerType === 'mouse' || e.buttons) target.current = pointerX(e);
  };
  const onPointerUp = (e) => {
    if (e.pointerType !== 'mouse') target.current = null;
  };
  const padMove = (dir, on) => {
    if (on) {
      keys.current.add(dir);
      target.current = null;
    } else keys.current.delete(dir);
  };

  return (
    <div ref={rootRef} className="bx-root" tabIndex={0} onKeyDown={onKeyDown} onKeyUp={onKeyUp} aria-roledescription={t('game')} aria-label={t('mcTitle')}>
      <Hud
        items={[
          { id: 's', label: t('score'), value: hud.score, tone: 'accent' },
          { id: 'c', label: t('mcCaught'), value: hud.caught },
          { id: 'l', label: t('mcPlates'), value: <Pips total={LIVES} left={hud.lives} label={t('mcPlates')} /> },
          { id: 'v', label: t('level'), value: hud.level },
          { id: 'm', label: t('mcMult'), value: `×${localDigits(hud.mult, lang)}`, tone: hud.mult > 1 ? 'accent' : undefined },
        ]}
      />
      <div ref={wrapRef} className="bx-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={onPointerUp}>
        <canvas ref={canvasRef} role="img" aria-label={t('mcCanvas')} />
        {phase === 'start' && (
          <Panel kicker={t('mcKicker')} title={t('mcTitle')} primary={{ label: t('start'), onClick: start }}>
            <p>{t('mcIntro')}</p>
            <ul className="bx-keys">
              <li>
                <b>{t('mcKeyMove')}</b>
                <span>{t('mcMoveHow')}</span>
              </li>
              <li>
                <b>{t('mcKeyMomo')}</b>
                <span>{t('mcMomoHow')}</span>
              </li>
              <li>
                <b>{t('mcKeyAvoid')}</b>
                <span>{t('mcAvoidHow')}</span>
              </li>
            </ul>
          </Panel>
        )}
        {phase === 'paused' && (
          <Panel kicker={t('mcTitle')} title={t('paused')} primary={{ label: t('resume'), onClick: () => setPhase('play') }} secondary={{ label: t('restart'), onClick: start }}>
            <p>{t('pausedBody')}</p>
          </Panel>
        )}
        {phase === 'over' && result && (
          <Panel kicker={result.isNew ? t('newBest') : t('gameOver')} title={t('mcOverTitle')} primary={{ label: t('again'), onClick: start }}>
            <p className="bx-big">{localDigits(result.score.toLocaleString('en-US'), lang)}</p>
            <p>{t('mcOverBody', { n: localDigits(result.caught, lang) })}</p>
            <p>{t('bestLine', { n: localDigits(Math.max(best, result.score).toLocaleString('en-US'), lang) })}</p>
            {result.joke && <p className="bx-joke">{result.joke}</p>}
          </Panel>
        )}
      </div>
      <div className="bx-controls">
        <div className="bx-pads">
          <Pad label={t('left')} onDown={() => padMove('left', true)} onUp={() => padMove('left', false)} disabled={phase !== 'play'}>
            <ArrowLeftIcon size={20} weight="bold" aria-hidden="true" />
          </Pad>
          <Pad label={t('right')} onDown={() => padMove('right', true)} onUp={() => padMove('right', false)} disabled={phase !== 'play'}>
            <ArrowRightIcon size={20} weight="bold" aria-hidden="true" />
          </Pad>
          <Pad label={t('pause')} onDown={() => setPhase('paused')} disabled={phase !== 'play'}>
            <PauseIcon size={18} weight="bold" aria-hidden="true" />
          </Pad>
        </div>
        <p className="bx-hint">{t('mcHint')}</p>
      </div>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  );
}

// ------------------------------------------------------------ art

function drawMomo(ctx, x, y, k, body, pleat) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-12, 6);
  ctx.quadraticCurveTo(-14, -4, -4, -9);
  ctx.quadraticCurveTo(0, -13, 4, -9);
  ctx.quadraticCurveTo(14, -4, 12, 6);
  ctx.quadraticCurveTo(0, 10, -12, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = pleat;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 4.2, 4);
    ctx.quadraticCurveTo(i * 2.2, -3, 0, -10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawItem(ctx, it, P, night, t) {
  const { x, y, type } = it;
  if (type === 'steamed') drawMomo(ctx, x, y, 1, night ? '#e6dccb' : '#f8f2e4', night ? '#a99c86' : '#c9b99c');
  else if (type === 'fried') drawMomo(ctx, x, y, 1, '#d99a45', '#a8661f');
  else if (type === 'jhol') {
    ctx.fillStyle = night ? '#c9c3b6' : '#f3efe6';
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 3);
    ctx.quadraticCurveTo(x, y + 18, x + 15, y - 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9772b';
    ctx.beginPath();
    ctx.ellipse(x, y - 3, 14, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    drawMomo(ctx, x - 4, y - 6, 0.55, '#f8f2e4', '#c9b99c');
    drawMomo(ctx, x + 5, y - 5, 0.5, '#f8f2e4', '#c9b99c');
  } else if (type === 'chilli') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(it.rot);
    ctx.fillStyle = '#d6362b';
    ctx.beginPath();
    ctx.moveTo(-3, -11);
    ctx.quadraticCurveTo(7, -4, 4, 6);
    ctx.quadraticCurveTo(1, 12, -4, 13);
    ctx.quadraticCurveTo(0, 5, -5, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-1.5, -6, 1.4, 7);
    ctx.strokeStyle = '#3d8b4f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.quadraticCurveTo(-5, -14, -1, -16);
    ctx.stroke();
    ctx.restore();
  } else if (type === 'achar') {
    ctx.fillStyle = night ? '#9c5a3a' : '#b5653f';
    ctx.beginPath();
    ctx.moveTo(x - 13, y - 4);
    ctx.quadraticCurveTo(x, y + 16, x + 13, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8862a';
    ctx.beginPath();
    ctx.ellipse(x, y - 4, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c0321f';
    for (let i = -2; i <= 2; i++) ctx.fillRect(x + i * 4, y - 5.5, 1.6, 1.6);
    ctx.font = font(7, 700, 'sans');
    ctx.textAlign = 'center';
    ctx.fillStyle = P.accentInk;
    const label = t('mcAcharTag');
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = P.accent;
    rr(ctx, x - tw / 2 - 4, y + 9, tw + 8, 10, 5);
    ctx.fill();
    ctx.fillStyle = P.accentInk;
    ctx.fillText(label, x, y + 16.5);
  }
}
