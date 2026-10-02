import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { useT, useLang, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone, store } from '../os';
import { AppShell } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

// Momo Snake: a yak-wool snake on a Himalayan grid, eating momos and
// avoiding the peaks. Swipe, arrow keys, WASD or the pad.
const N = 15;
const PEAKS = [
  [3, 3],
  [4, 3],
  [11, 4],
  [10, 4],
  [3, 11],
  [11, 11],
  [11, 10],
  [7, 7],
];
const isPeak = (x, y) => PEAKS.some(([px, py]) => px === x && py === y);
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };

function freeCell(snake) {
  for (let i = 0; i < 200; i++) {
    const x = Math.floor(Math.random() * N);
    const y = Math.floor(Math.random() * N);
    if (!isPeak(x, y) && !snake.some(([sx, sy]) => sx === x && sy === y)) return [x, y];
  }
  return [0, 0];
}

const fresh = () => {
  const snake = [
    [5, 8],
    [4, 8],
    [3, 8],
  ];
  return { snake, dir: 'right', queue: [], food: freeCell(snake), score: 0, over: false };
};

export default function Games() {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  const canvas = useRef(null);
  const game = useRef(fresh());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => store.read('ss-phone-snake', 0));
  const [status, setStatus] = useState('ready'); // ready | playing | paused | over
  const swipe = useRef(null);
  const wrap = useRef(null);

  const draw = useCallback(() => {
    const cv = canvas.current;
    if (!cv) return;
    const size = cv.clientWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(size * dpr)) {
      cv.width = Math.round(size * dpr);
      cv.height = Math.round(size * dpr);
    }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = size / N;
    const st = game.current;
    // snowfield with a faint grid
    g.fillStyle = '#eef1f5';
    g.fillRect(0, 0, size, size);
    g.fillStyle = '#e1e6ee';
    for (let y = 0; y < N; y++) for (let x = (y % 2); x < N; x += 2) g.fillRect(x * c, y * c, c, c);
    // peaks
    PEAKS.forEach(([x, y]) => {
      g.fillStyle = '#5b6b86';
      g.beginPath();
      g.moveTo(x * c + c * 0.08, y * c + c * 0.92);
      g.lineTo(x * c + c * 0.5, y * c + c * 0.1);
      g.lineTo(x * c + c * 0.92, y * c + c * 0.92);
      g.fill();
      g.fillStyle = '#fff';
      g.beginPath();
      g.moveTo(x * c + c * 0.36, y * c + c * 0.36);
      g.lineTo(x * c + c * 0.5, y * c + c * 0.1);
      g.lineTo(x * c + c * 0.64, y * c + c * 0.36);
      g.fill();
    });
    // the momo: a pleated dumpling
    const [fx, fy] = st.food;
    const mx = fx * c + c / 2;
    const my = fy * c + c * 0.58;
    g.fillStyle = '#f6ead2';
    g.strokeStyle = '#b8945a';
    g.lineWidth = 1.2;
    g.beginPath();
    g.ellipse(mx, my, c * 0.4, c * 0.3, 0, Math.PI, 0);
    g.lineTo(mx + c * 0.4, my + c * 0.08);
    g.quadraticCurveTo(mx, my + c * 0.22, mx - c * 0.4, my + c * 0.08);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    for (let i = -2; i <= 2; i++) {
      g.moveTo(mx + i * c * 0.08, my - c * 0.26);
      g.lineTo(mx + i * c * 0.12, my - c * 0.05);
    }
    g.stroke();
    // the snake, in Mithila vermilion with cream bands
    st.snake.forEach(([x, y], i) => {
      g.fillStyle = i === 0 ? '#a8261a' : i % 2 ? '#d6452b' : '#e2604a';
      const pad = i === 0 ? 0.06 : 0.12;
      g.beginPath();
      g.roundRect(x * c + c * pad, y * c + c * pad, c * (1 - pad * 2), c * (1 - pad * 2), c * 0.28);
      g.fill();
    });
    const [hx, hy] = st.snake[0];
    const [dx, dy] = DIRS[st.dir];
    g.fillStyle = '#fff';
    [-1, 1].forEach((side) => {
      const ex = hx * c + c / 2 + dx * c * 0.18 + dy * side * c * 0.18;
      const ey = hy * c + c / 2 + dy * c * 0.18 + dx * side * c * 0.18;
      g.beginPath();
      g.arc(ex, ey, c * 0.1, 0, Math.PI * 2);
      g.fill();
    });
  }, []);

  const turn = useCallback((d) => {
    const st = game.current;
    const last = st.queue[st.queue.length - 1] || st.dir;
    const [ax, ay] = DIRS[last];
    const [bx, by] = DIRS[d];
    if (ax + bx === 0 && ay + by === 0) return;
    if (st.queue.length < 3) st.queue.push(d);
  }, []);

  const step = useCallback(() => {
    const st = game.current;
    if (st.queue.length) st.dir = st.queue.shift();
    const [dx, dy] = DIRS[st.dir];
    const [hx, hy] = st.snake[0];
    const nx = (hx + dx + N) % N;
    const ny = (hy + dy + N) % N;
    const eat = nx === st.food[0] && ny === st.food[1];
    const body = eat ? st.snake : st.snake.slice(0, -1);
    if (isPeak(nx, ny) || body.some(([x, y]) => x === nx && y === ny)) {
      st.over = true;
      sfx.thud();
      setStatus('over');
      setBest((b) => {
        if (st.score > b) {
          store.write('ss-phone-snake', st.score);
          return st.score;
        }
        return b;
      });
      return;
    }
    st.snake = [[nx, ny], ...body];
    if (eat) {
      st.score += 1;
      st.food = freeCell(st.snake);
      setScore(st.score);
      sfx.blip(520 + Math.min(st.score, 20) * 30);
      if (navigator.vibrate) navigator.vibrate(12);
    }
    draw();
  }, [draw]);

  // Game loop: speeds up as the snake grows; stops offscreen.
  useEffect(() => {
    if (status !== 'playing' || !ctx.visible) return undefined;
    const id = setInterval(step, Math.max(85, 165 - score * 4));
    return () => clearInterval(id);
  }, [status, ctx.visible, score, step]);

  useEffect(() => {
    if (!ctx.visible && status === 'playing') setStatus('paused');
  }, [ctx.visible, status]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(draw);
    if (canvas.current) ro.observe(canvas.current);
    return () => ro.disconnect();
  }, [draw]);

  const start = () => {
    if (status === 'over' || status === 'ready') {
      game.current = fresh();
      setScore(0);
    }
    setStatus('playing');
    draw();
    wrap.current?.focus({ preventScroll: true });
  };

  const onKey = (e) => {
    const d = KEYMAP[e.key] || KEYMAP[e.key?.toLowerCase?.()];
    if (d) {
      e.preventDefault();
      if (status !== 'playing') start();
      turn(d);
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (e.target !== wrap.current) return;
      e.preventDefault();
      setStatus((s) => (s === 'playing' ? 'paused' : s));
      if (status !== 'playing') start();
    }
  };

  const onDown = (e) => {
    swipe.current = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
  };
  const onUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {
      if (status !== 'playing') start();
      return;
    }
    if (status !== 'playing') start();
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  };

  const pad = (d, Icon) => (
    <button
      type="button"
      className={`sos-pad-btn is-${d}`}
      aria-label={t(`game.${d}`)}
      onClick={() => {
        if (status !== 'playing') start();
        turn(d);
      }}
    >
      <Icon size={20} weight="bold" />
    </button>
  );

  return (
    <AppShell title={t('game.title')} sub={t('game.sub')} className="sos-games">
      <div className="sos-game-hud">
        <span>
          {t('game.score')} <b>{localDigits(score, lang)}</b>
        </span>
        <span>
          {t('game.best')} <b>{localDigits(best, lang)}</b>
        </span>
        <button
          type="button"
          className="sos-iconbtn"
          aria-label={status === 'playing' ? t('game.pause') : t('game.play')}
          onClick={() => (status === 'playing' ? setStatus('paused') : start())}
        >
          {status === 'playing' ? <PauseIcon size={18} weight="fill" /> : <PlayIcon size={18} weight="fill" />}
        </button>
      </div>
      <div
        className="sos-game-board"
        ref={wrap}
        tabIndex={0}
        role="application"
        aria-label={t('game.board')}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        <canvas ref={canvas} aria-hidden="true" />
        {status !== 'playing' && (
          <div className="sos-game-over" aria-live="polite">
            <b>{status === 'over' ? t('game.over', { n: localDigits(score, lang) }) : status === 'paused' ? t('game.paused') : t('game.ready')}</b>
            <span>{status === 'over' ? t(score >= 10 ? 'game.great' : 'game.again') : t('game.how')}</span>
          </div>
        )}
      </div>
      <div className="sos-pad" aria-label={t('game.controls')} role="group">
        {pad('up', ArrowUpIcon)}
        {pad('left', ArrowLeftIcon)}
        {pad('right', ArrowRightIcon)}
        {pad('down', ArrowDownIcon)}
      </div>
    </AppShell>
  );
}
