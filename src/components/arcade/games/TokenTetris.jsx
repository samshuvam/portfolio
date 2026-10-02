import { useEffect, useRef, useState } from 'react';
import { ArrowClockwiseIcon, ArrowLineDownIcon, CaretDownIcon, CaretLeftIcon, CaretRightIcon, CheckIcon, SquaresFourIcon, TrashIcon, XIcon } from '@phosphor-icons/react';
import dict from '../../../i18n/ui/arcade';
import { localDigits, useLang, useT } from '../../../i18n';
import { sound } from '../../../lib/sound';
import { reducedMotion } from '../../../lib/motion';
import { claimKey, gameOverJoke, isButtonActivation, isCoarse, pick, shuffle, sizeCanvas, useLatest, useLoop, usePalette } from './a-kit';
import { Overlay, PadButton, Pips, Stat } from './a-ui';
import './a-games.css';

// Token Tetris: evidence chunks of different token sizes fall into a tiny
// context window (8 x 15 squares, 64 tokens each). A full row becomes a
// generated section of the document. Hallucinated junk inside a full row
// makes a hallucinated section; three and the paper is retracted. Junk can
// be rejected before it lands (the evidence-validation step).

const COLS = 8;
const ROWS = 15;
const TOK = 64;
const TRUST = 3;
const SIDE_MIN = 104;

const SHAPES = {
  abstract: { n: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  table: { n: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  figure: { n: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  quote: { n: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  citation: { n: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  paragraph: { n: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
  transcript: { n: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  snippet: { n: 3, cells: [[0, 1], [1, 1], [2, 1]] },
  note: { n: 2, cells: [[0, 0], [1, 0]] },
  fact: { n: 1, cells: [[0, 0]] },
};
const BIG = ['abstract', 'table', 'figure', 'quote', 'citation', 'paragraph', 'transcript'];
const SMALL = ['snippet', 'note', 'fact'];
const SECTIONS = 12;

const rotate = (cells, n, dir = 1) => cells.map(([x, y]) => (dir > 0 ? [n - 1 - y, x] : [y, n - 1 - x]));
const emptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

function newSim() {
  return { grid: emptyGrid(), bag: [], cur: null, next: null, acc: 0, lockT: 0, resets: 0, soft: false, score: 0, lines: 0, grounded: 0, halluc: 0, level: 1, flashes: [], sections: [], over: false };
}

function makePiece(s) {
  if (!s.bag.length) s.bag = shuffle([...BIG, pick(SMALL)]);
  const type = s.bag.pop();
  const junk = Math.random() < Math.min(0.28, 0.08 + (s.level - 1) * 0.035);
  const sh = SHAPES[type];
  return { type, n: sh.n, cells: sh.cells.map((c) => [...c]), x: Math.floor((COLS - sh.n) / 2), y: 0, junk, jl: 1 + Math.floor(Math.random() * 4) };
}

function collides(s, p, dx = 0, dy = 0, cells = p.cells) {
  for (const [cx, cy] of cells) {
    const x = p.x + cx + dx;
    const y = p.y + cy + dy;
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    if (y >= 0 && s.grid[y][x]) return true;
  }
  return false;
}

export default function TokenTetris({ active = true, onScore }) {
  const t = useT(dict);
  const lang = useLang();
  const [phase, setPhase] = useState('start');
  const [hud, setHud] = useState({ score: 0, level: 1, lines: 0, halluc: 0, used: 0 });
  const [pieces, setPieces] = useState({ cur: null, next: null });
  const [sections, setSections] = useState([]);
  const [msg, setMsg] = useState(null);
  const [over, setOver] = useState(null);
  const [cell, setCell] = useState(24);
  const [coarse] = useState(isCoarse);
  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const canvasRef = useRef(null);
  const nextRef = useRef(null);
  const sim = useRef(newSim());
  const msgTimer = useRef(0);
  const gesture = useRef(null);
  const reduce = useRef(reducedMotion());
  const pal = usePalette();
  const tRef = useLatest(t);
  const langRef = useLatest(lang);
  const scoreRef = useLatest(onScore);
  const canPlay = useLatest(active && phase === 'play');

  const flash = (text, tone = 'default') => {
    clearTimeout(msgTimer.current);
    setMsg({ text, tone, key: Date.now() });
    msgTimer.current = setTimeout(() => setMsg(null), 2200);
  };
  useEffect(() => () => clearTimeout(msgTimer.current), []);

  // Fit the board into the space next to the side panel.
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const c = Math.floor(Math.min((width - SIDE_MIN - 12) / COLS, height / ROWS));
      setCell(Math.max(14, Math.min(34, c)));
    });
    ro.observe(main);
    return () => ro.disconnect();
  }, []);

  const pushHud = () => {
    const s = sim.current;
    const used = s.grid.reduce((a, row) => a + row.filter(Boolean).length, 0) * TOK;
    setHud({ score: s.score, level: s.level, lines: s.lines, halluc: s.halluc, used });
    scoreRef.current?.(s.score);
  };

  const syncPieces = () => {
    const s = sim.current;
    setPieces({ cur: s.cur ? { type: s.cur.type, junk: s.cur.junk, jl: s.cur.jl, size: s.cur.cells.length } : null, next: s.next ? { type: s.next.type, junk: s.next.junk } : null });
  };

  const endGame = (s, reason) => {
    s.over = true;
    setOver({ reason, score: s.score, lines: s.lines, grounded: s.grounded, joke: gameOverJoke(['ai', 'food'], langRef.current) });
    setPhase('over');
    sound.stamp();
    scoreRef.current?.(s.score);
  };

  const spawn = (s) => {
    s.cur = s.next || makePiece(s);
    s.next = makePiece(s);
    s.cur.x = Math.floor((COLS - s.cur.n) / 2);
    s.cur.y = -Math.min(...s.cur.cells.map((c) => c[1]));
    s.acc = 0;
    s.lockT = 0;
    s.resets = 0;
    syncPieces();
    if (collides(s, s.cur)) endGame(s, 'overflow');
  };

  const start = () => {
    const s = newSim();
    sim.current = s;
    spawn(s);
    setSections([]);
    setOver(null);
    setPhase('play');
    pushHud();
    scoreRef.current?.(0);
    sound.click();
    rootRef.current?.focus({ preventScroll: true });
  };

  const lock = (s) => {
    const p = s.cur;
    let above = false;
    p.cells.forEach(([cx, cy]) => {
      const x = p.x + cx;
      const y = p.y + cy;
      if (y < 0) above = true;
      else s.grid[y][x] = { type: p.type, junk: p.junk };
    });
    if (above) {
      endGame(s, 'overflow');
      pushHud();
      return;
    }
    sound.flap();
    const full = [];
    for (let y = 0; y < ROWS; y++) if (s.grid[y].every(Boolean)) full.push(y);
    if (full.length) {
      let good = 0;
      let bad = 0;
      const made = [];
      full.forEach((y) => {
        const junk = s.grid[y].some((c) => c.junk);
        s.lines += 1;
        if (junk) {
          bad += 1;
          s.halluc += 1;
        } else {
          good += 1;
          s.grounded += 1;
        }
        made.push({ n: s.lines, name: (s.lines - 1) % SECTIONS, ok: !junk });
        s.flashes.push({ y, t: 0, ok: !junk });
      });
      s.grid = s.grid.filter((_, y) => !full.includes(y));
      while (s.grid.length < ROWS) s.grid.unshift(Array(COLS).fill(null));
      const table = [0, 100, 300, 500, 800];
      s.score = Math.max(0, s.score + table[good] * s.level - bad * 150);
      s.sections = [...made.reverse(), ...s.sections].slice(0, 8);
      setSections(s.sections);
      const lvl = 1 + Math.floor(s.lines / 6);
      if (bad) {
        sound.stamp();
        flash(tRef.current('tt.badSection', { n: localDigits(bad, langRef.current) }), 'bad');
      } else {
        sound.success();
        flash(tRef.current(full.length > 1 ? 'tt.combo' : 'tt.goodSection', { n: localDigits(full.length, langRef.current) }), 'good');
      }
      if (lvl !== s.level) s.level = lvl;
      if (s.halluc >= TRUST) {
        endGame(s, 'retracted');
        pushHud();
        return;
      }
    }
    spawn(s);
    pushHud();
  };

  const touchLock = (s) => {
    if (collides(s, s.cur, 0, 1) && s.resets < 12) {
      s.lockT = 0;
      s.resets += 1;
    }
  };

  const move = (dx) => {
    const s = sim.current;
    if (!canPlay.current || !s.cur || s.over) return;
    if (!collides(s, s.cur, dx, 0)) {
      s.cur.x += dx;
      touchLock(s);
      draw();
    }
  };
  const turn = (dir = 1) => {
    const s = sim.current;
    if (!canPlay.current || !s.cur || s.over) return;
    const p = s.cur;
    const cells = rotate(p.cells, p.n, dir);
    for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]]) {
      if (!collides(s, p, kx, ky, cells)) {
        p.cells = cells;
        p.x += kx;
        p.y += ky;
        touchLock(s);
        sound.click();
        draw();
        return;
      }
    }
  };
  const softDrop = () => {
    const s = sim.current;
    if (!canPlay.current || !s.cur || s.over) return;
    if (!collides(s, s.cur, 0, 1)) {
      s.cur.y += 1;
      s.score += 1;
      s.acc = 0;
      pushHud();
      draw();
    } else lock(s);
  };
  const hardDrop = () => {
    const s = sim.current;
    if (!canPlay.current || !s.cur || s.over) return;
    let n = 0;
    while (!collides(s, s.cur, 0, 1)) {
      s.cur.y += 1;
      n += 1;
    }
    s.score += n * 2;
    lock(s);
    draw();
  };
  const reject = () => {
    const s = sim.current;
    if (!canPlay.current || !s.cur || s.over) return;
    if (s.cur.junk) {
      s.score += 50;
      sound.success();
      flash(tRef.current('tt.rejectedJunk', { n: localDigits(50, langRef.current) }), 'good');
    } else {
      s.score = Math.max(0, s.score - 30);
      sound.stamp();
      flash(tRef.current('tt.rejectedReal', { n: localDigits(30, langRef.current) }), 'bad');
    }
    spawn(s);
    pushHud();
    draw();
  };

  const step = (dt) => {
    const s = sim.current;
    if (s.over || !s.cur) return;
    const interval = Math.max(0.09, 0.72 - (s.level - 1) * 0.065);
    s.acc += dt;
    if (collides(s, s.cur, 0, 1)) {
      s.lockT += dt;
      if (s.lockT >= 0.45) lock(s);
    } else if (s.acc >= interval) {
      s.acc = 0;
      s.cur.y += 1;
      s.lockT = 0;
    }
    s.flashes.forEach((f) => {
      f.t += dt;
    });
    s.flashes = s.flashes.filter((f) => f.t < 0.4);
  };

  // ---------------------------------------------------------------- drawing
  const drawCell = (ctx, p, x, y, size, kind, type) => {
    const pad = Math.max(1, size * 0.06);
    const r = Math.max(2, size * 0.18);
    const px = x * size + pad;
    const py = y * size + pad;
    const w = size - pad * 2;
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(px, py, w, w, r);
    else ctx.rect(px, py, w, w);
    if (kind === 'ghost') {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = p.accentFg;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (kind === 'junk' || kind === 'junkLive') {
      ctx.fillStyle = p.bg3;
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = p.ink3;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = -w; k < w * 2; k += 5) {
        ctx.moveTo(px + k, py);
        ctx.lineTo(px + k - w, py + w);
      }
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([3, 2]);
      ctx.strokeStyle = kind === 'junkLive' ? p.accentFg : p.ink2;
      ctx.lineWidth = kind === 'junkLive' ? 1.8 : 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = kind === 'junkLive' ? p.accentFg : p.ink2;
      ctx.font = `700 ${Math.round(size * 0.5)}px 'Geist Mono Variable', ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', px + w / 2, py + w / 2 + 1);
      ctx.restore();
      return;
    }
    const live = kind === 'live';
    ctx.fillStyle = live ? p.accent : p.ink2;
    ctx.globalAlpha = live ? 1 : 0.88;
    ctx.fill();
    // Lines of "text" inside each chunk.
    ctx.globalAlpha = live ? 0.45 : 0.4;
    ctx.fillStyle = live ? p.accentInk : p.bg;
    const lh = Math.max(1.5, size * 0.08);
    const seed = (type?.length || 3) + x * 3 + y * 7;
    for (let i = 0; i < 3; i++) {
      const lw = w * (0.45 + (((seed + i * 5) % 7) / 7) * 0.4);
      ctx.fillRect(px + w * 0.16, py + w * (0.26 + i * 0.22), lw * 0.75, lh);
    }
    ctx.restore();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const p = pal.current;
    const s = sim.current;
    const W = COLS * cell;
    const H = ROWS * cell;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = p.bg2;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(x * cell + 0.5, 0);
      ctx.lineTo(x * cell + 0.5, H);
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.moveTo(0, y * cell + 0.5);
      ctx.lineTo(W, y * cell + 0.5);
    }
    ctx.stroke();
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = s.grid[y][x];
        if (c) drawCell(ctx, p, x, y, cell, c.junk ? 'junk' : 'lock', c.type);
      }
    }
    if (s.cur && !s.over) {
      let gy = 0;
      while (!collides(s, s.cur, 0, gy + 1)) gy += 1;
      if (gy > 0) s.cur.cells.forEach(([cx, cy]) => cy + s.cur.y + gy >= 0 && drawCell(ctx, p, s.cur.x + cx, s.cur.y + cy + gy, cell, 'ghost'));
      s.cur.cells.forEach(([cx, cy]) => cy + s.cur.y >= 0 && drawCell(ctx, p, s.cur.x + cx, s.cur.y + cy, cell, s.cur.junk ? 'junkLive' : 'live', s.cur.type));
    }
    if (!reduce.current) {
      s.flashes.forEach((f) => {
        ctx.save();
        ctx.globalAlpha = 0.6 * (1 - f.t / 0.4);
        ctx.fillStyle = f.ok ? p.accent : p.ink;
        ctx.fillRect(0, f.y * cell, W, cell);
        ctx.restore();
      });
    }
  };

  const drawNext = () => {
    const c = nextRef.current;
    const s = sim.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const size = 14;
    sizeCanvas(c, ctx, size * 4, size * 3);
    ctx.clearRect(0, 0, size * 4, size * 3);
    const nx = s.next;
    if (!nx) return;
    const xs = nx.cells.map((q) => q[0]);
    const ys = nx.cells.map((q) => q[1]);
    const ox = (4 - (Math.max(...xs) - Math.min(...xs) + 1)) / 2 - Math.min(...xs);
    const oy = (3 - (Math.max(...ys) - Math.min(...ys) + 1)) / 2 - Math.min(...ys);
    ctx.save();
    ctx.translate(ox * size, oy * size);
    nx.cells.forEach(([x, y]) => drawCell(ctx, pal.current, x, y, size, nx.junk ? 'junk' : 'lock', nx.type));
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sizeCanvas(canvas, canvas.getContext('2d'), COLS * cell, ROWS * cell);
    draw();
  }, [cell]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    drawNext();
    draw();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  useLoop(active && phase === 'play', (dt) => {
    step(dt);
    draw();
  });

  // ---------------------------------------------------------------- input
  const onKey = (e) => {
    if (phase !== 'play' || isButtonActivation(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const map = {
      ArrowLeft: () => move(-1),
      a: () => move(-1),
      ArrowRight: () => move(1),
      d: () => move(1),
      ArrowUp: () => turn(1),
      w: () => turn(1),
      x: () => turn(1),
      z: () => turn(-1),
      ArrowDown: softDrop,
      s: softDrop,
      ' ': hardDrop,
      r: reject,
    };
    if (!map[k]) return;
    claimKey(e);
    map[k]();
  };

  const onPointerDown = (e) => {
    if (!canPlay.current) return;
    gesture.current = { x: e.clientX, y: e.clientY, t: performance.now(), mx: 0, my: 0, moved: false };
    canvasRef.current.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) g.moved = true;
    const cx = Math.trunc(dx / cell);
    while (g.mx < cx) {
      move(1);
      g.mx += 1;
    }
    while (g.mx > cx) {
      move(-1);
      g.mx -= 1;
    }
    const cy = Math.max(0, Math.trunc(dy / (cell * 1.3)));
    while (g.my < cy && Math.abs(dy) > Math.abs(dx)) {
      softDrop();
      g.my += 1;
    }
  };
  const onPointerUp = (e) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    const dt = performance.now() - g.t;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.moved && dt < 300) turn(1);
    else if (dy > 60 && dt < 260 && dy > Math.abs(dx) * 1.5) hardDrop();
  };

  const total = COLS * ROWS * TOK;
  const fmt = (n) => localDigits(n.toLocaleString('en-US'), lang);
  const cur = pieces.cur;

  return (
    <div ref={rootRef} className="ag-root tt" tabIndex={-1} onKeyDown={onKey}>
      <div className="ag-hud">
        <Stat label={t('ag.score')} value={hud.score} />
        <Stat label={t('ag.level')} value={hud.level} />
        <Stat label={t('tt.lines')} value={hud.lines} />
        <Pips label={t('tt.trust')} total={TRUST} left={Math.max(0, TRUST - hud.halluc)} />
      </div>

      <div ref={mainRef} className="tt-main">
        <div className="tt-board" style={{ width: COLS * cell, height: ROWS * cell }}>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t('tt.boardLabel', { used: fmt(hud.used), total: fmt(total) })}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              gesture.current = null;
            }}
          />
        </div>
        <aside className="tt-side">
          <div className="tt-box">
            <span className="ag-stat-label">{t('tt.next')}</span>
            <canvas ref={nextRef} className="tt-next" aria-hidden="true" />
            {pieces.next && <span className="tt-piece">{pieces.next.junk ? t('tt.junk') : t(`tt.k.${pieces.next.type}`)}</span>}
          </div>
          <div className="tt-box">
            <span className="ag-stat-label">{t('tt.falling')}</span>
            {cur && (
              <span className="tt-piece" data-junk={cur.junk || undefined}>
                {cur.junk ? t(`tt.j.${cur.jl}`) : t(`tt.k.${cur.type}`)}
                <small>{t('tt.tok', { n: fmt(cur.size * TOK) })}</small>
              </span>
            )}
          </div>
          <div className="tt-box">
            <span className="ag-stat-label">{t('tt.window')}</span>
            <span className="tt-meter" aria-hidden="true">
              <i style={{ transform: `scaleX(${hud.used / total})` }} />
            </span>
            <small className="tt-tokens">{t('tt.tokens', { used: fmt(hud.used), total: fmt(total) })}</small>
          </div>
          <div className="tt-box tt-doc">
            <span className="ag-stat-label">{t('tt.doc')}</span>
            {sections.length ? (
              <ol>
                {sections.map((sec) => (
                  <li key={sec.n} data-ok={sec.ok || undefined}>
                    {sec.ok ? <CheckIcon size={12} weight="bold" aria-hidden="true" /> : <XIcon size={12} weight="bold" aria-hidden="true" />}
                    <span>
                      §{localDigits(sec.n, lang)} {t(`tt.s.${sec.name}`)}
                      <span className="sr-only">, {sec.ok ? t('tt.grounded') : t('tt.hallucinated')}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <small>{t('tt.docEmpty')}</small>
            )}
          </div>
        </aside>
      </div>

      <p className="ag-live" data-tone={msg?.tone} aria-live="polite" key={msg?.key}>
        {msg?.text || ' '}
      </p>

      <div className="ag-pads tt-pads" role="group" aria-label={t('ag.controls')}>
        <PadButton label={t('tt.left')} onPress={() => move(-1)} repeat>
          <CaretLeftIcon size={20} weight="bold" aria-hidden="true" />
        </PadButton>
        <PadButton label={t('tt.right')} onPress={() => move(1)} repeat>
          <CaretRightIcon size={20} weight="bold" aria-hidden="true" />
        </PadButton>
        <PadButton label={t('tt.rotate')} onPress={() => turn(1)}>
          <ArrowClockwiseIcon size={20} weight="bold" aria-hidden="true" />
        </PadButton>
        <PadButton label={t('tt.soft')} onPress={softDrop} repeat>
          <CaretDownIcon size={20} weight="bold" aria-hidden="true" />
        </PadButton>
        <PadButton label={t('tt.hard')} onPress={hardDrop}>
          <ArrowLineDownIcon size={20} weight="bold" aria-hidden="true" />
        </PadButton>
        <PadButton label={t('tt.reject')} onPress={reject} className="ag-pad-warn">
          <TrashIcon size={18} weight="bold" aria-hidden="true" />
          <span>{t('tt.reject')}</span>
        </PadButton>
      </div>
      {!coarse && <p className="ag-hint">{t('tt.keys')}</p>}

      {phase === 'start' && (
        <Overlay
          kicker={t('ag.basedOnProject')}
          title={t('g.token-tetris.title')}
          actions={
            <button type="button" className="btn btn-accent btn-sm" data-primary onClick={start}>
              <SquaresFourIcon size={18} weight="bold" aria-hidden="true" />
              {t('ag.start')}
            </button>
          }
        >
          <ul className="ag-how">
            <li>{t('tt.how1')}</li>
            <li>{t('tt.how2')}</li>
            <li>{t('tt.how3')}</li>
          </ul>
          <p className="ag-sub">{coarse ? t('tt.touch') : t('tt.keysShort')}</p>
        </Overlay>
      )}
      {phase === 'over' && over && (
        <Overlay
          kicker={t('ag.gameOver')}
          title={over.reason === 'retracted' ? t('tt.retracted') : t('tt.overflow')}
          tone="over"
          actions={
            <button type="button" className="btn btn-accent btn-sm" data-primary onClick={start}>
              {t('ag.again')}
            </button>
          }
        >
          <p className="ag-big">{fmt(over.score)}</p>
          <p className="ag-sub">{t('tt.overBody', { lines: localDigits(over.lines, lang), grounded: localDigits(over.grounded, lang) })}</p>
          <p className="ag-joke">
            <span>{t('ag.jokeBreak')}</span> {over.joke}
          </p>
        </Overlay>
      )}
    </div>
  );
}
