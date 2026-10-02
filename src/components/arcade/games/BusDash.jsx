import { useEffect, useRef, useState } from 'react';
import { MegaphoneIcon, MinusIcon, PauseIcon, PlusIcon, SteeringWheelIcon, UserIcon } from '@phosphor-icons/react';
import dict from '../../../i18n/ui/arcade-b';
import { localDigits, useLang, useT } from '../../../i18n';
import { sound } from '../../../lib/sound';
import { useWeather } from '../../../lib/weather';
import { alpha, claim, clamp, font, isButtonKey, mixColor, pick, pickJoke, rand, rr, useBest, useGameLoop, usePalette, useReduced, useStage } from './b-kit';
import { Hud, Pad, Panel, Pips } from './b-ui';

// Bus Dash: you are the conductor of a Lalitpur to Kathmandu micro-bus.
// Passengers wait at each stop with a destination and a little patience.
// Seat the ones going your way, set the fare (a nod to the dynamic pricing
// in Shuvam's Smart Bus project), shout "Khali chha!" for more riders and
// never leave overloaded when the traffic police are waiting ahead.

export const meta = {
  title: 'Bus Dash',
  blurb: 'Conduct a Kathmandu micro-bus: seat riders, set the fare, shout Khali chha!',
  controls: 'Tap riders or press 1 to 9, K to shout, Enter to depart.',
};

const ROUTE = ['lagankhel', 'jawalakhel', 'pulchowk', 'kupondole', 'thapathali', 'maitighar', 'ratnapark'];
const OFF = ['kalanki', 'chabahil', 'gongabu', 'bhaktapur', 'koteshwor', 'balaju', 'pokhara'];
const SEATS = 14;
const MAX = 18;
const RATING = 5;
const FARE_MIN = 15;
const FARE_MAX = 60;
const DRIVE = 2.6;
const FACES = ['#c8372d', '#2f6fb5', '#3d8b4f', '#e2b52b', '#1f8a8a', '#d0587e', '#8a6a45'];
const QUOTES = {
  board: ['qBoard1', 'qBoard2', 'qBoard3', 'qBoard4'],
  refuse: ['qRefuse1', 'qRefuse2', 'qRefuse3'],
  wrong: ['qWrong1', 'qWrong2'],
  angry: ['qAngry1', 'qAngry2', 'qAngry3'],
  khali: ['qKhali1', 'qKhali2', 'qKhali3'],
};
const SLOT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const round5 = (n) => Math.round(n / 5) * 5;

function newSim() {
  return {
    t: 0,
    stop: 0,
    dir: 1,
    mode: 'stop',
    dwell: 12,
    dwellMax: 12,
    driveT: 0,
    fare: 25,
    seated: [],
    waiting: [],
    earnings: 0,
    complaints: 0,
    served: 0,
    stopsDone: 0,
    shoutCd: 0,
    shoutT: 0,
    police: false,
    fined: false,
    nextId: 1,
    scroll: 0,
    over: false,
    trickle: 3,
  };
}

const level = (s) => 1 + Math.floor(s.stopsDone / 5);
const ahead = (s) => {
  const out = [];
  for (let i = s.stop + s.dir; i >= 0 && i < ROUTE.length; i += s.dir) out.push(ROUTE[i]);
  return out;
};

export default function BusDash({ active = true, onScore }) {
  const t = useT(dict);
  const lang = useLang();
  const pal = usePalette();
  const reduce = useReduced();
  const weather = useWeather();
  const { wrapRef, canvasRef, sizeRef, ctxRef } = useStage((w) => (w < 560 ? clamp(w * 0.52, 170, 240) : clamp(w * 0.3, 200, 280)));
  const rootRef = useRef(null);
  const sim = useRef(newSim());
  const [phase, setPhase] = useState('start');
  const [, setTick] = useState(0);
  const [quote, setQuote] = useState(null);
  const [result, setResult] = useState(null);
  const [best, submitBest] = useBest('bus-dash');
  const tickT = useRef(0);
  const quoteTimer = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;
  const rainy = weather && ['rain', 'storm', 'drizzle'].includes(weather.kind);
  const rainRef = useRef(rainy);
  rainRef.current = rainy;

  useEffect(() => {
    if (!active && phase === 'play') setPhase('paused');
  }, [active, phase]);
  useEffect(() => () => clearTimeout(quoteTimer.current), []);

  const say = (text, tone = 'ink', who = null) => {
    clearTimeout(quoteTimer.current);
    setQuote({ text, tone, who, key: Math.random() });
    quoteTimer.current = setTimeout(() => setQuote(null), 3200);
  };
  const sayKey = (cat, vars, tone, who) => say(tRef.current(pick(QUOTES[cat]), vars), tone, who);
  const stopName = (id) => tRef.current(`st_${id}`);
  // Buttons that vanish or disable after use hand keyboard focus back to the game.
  const keepFocus = () => {
    const root = rootRef.current;
    if (root && root.contains(document.activeElement) && document.activeElement !== root) root.focus({ preventScroll: true });
  };

  // The "smart fare": what the demand model suggests right now.
  const smartFare = (s) => {
    const demand = s.waiting.length;
    const rush = s.stopsDone % 4 === 3 ? 5 : 0;
    const rain = rainRef.current ? 5 : 0;
    return clamp(round5(20 + demand * 2.5 + rush + rain + level(s) * 1.5), FARE_MIN, FARE_MAX);
  };

  const newPassenger = (s) => {
    const lv = level(s);
    const front = ahead(s);
    const wrongP = Math.min(0.36, 0.12 + lv * 0.03);
    const wrong = !front.length || Math.random() < wrongP;
    const behind = ROUTE.filter((r) => !front.includes(r) && r !== ROUTE[s.stop]);
    const dest = wrong ? pick(Math.random() < 0.6 || !behind.length ? OFF : behind) : pick(front);
    const patience = Math.max(4.5, rand(8, 12) - lv * 0.45);
    return {
      id: s.nextId++,
      dest,
      ok: !wrong,
      will: round5(smartFare(s) * rand(0.85, 1.35)),
      patience,
      max: patience,
      face: pick(FACES),
    };
  };

  const arrive = (s) => {
    s.mode = 'stop';
    s.stopsDone += 1;
    const here = ROUTE[s.stop];
    // Riders for this stop pay and get off; riders on the wrong bus complain.
    let paid = 0;
    let n = 0;
    const wrongOnes = s.seated.filter((p) => !p.ok);
    s.seated = s.seated.filter((p) => {
      if (p.ok && p.dest === here) {
        paid += p.fare;
        n += 1;
        return false;
      }
      return p.ok;
    });
    s.earnings += paid;
    s.served += n;
    if (paid) sound.success();
    if (wrongOnes.length) {
      s.complaints += 1;
      sound.stamp();
      sayKey('wrong', { dest: stopName(wrongOnes[0].dest) }, 'warn', wrongOnes[0]);
    } else if (paid) say(tRef.current('bdPaid', { n: localDigits(n, lang), rs: localDigits(paid, lang) }), 'accent');
    // Reverse at the ends of the route.
    if (s.stop + s.dir < 0 || s.stop + s.dir >= ROUTE.length) s.dir *= -1;
    const lv = level(s);
    s.waiting = [];
    const count = Math.min(8, Math.floor(rand(2, 4.99)) + Math.floor(lv / 2));
    for (let i = 0; i < count; i++) s.waiting.push(newPassenger(s));
    s.dwellMax = Math.max(7, 13 - lv * 0.6);
    s.dwell = s.dwellMax;
    s.trickle = rand(2.5, 4.5);
    s.police = s.stopsDone > 2 && Math.random() < Math.min(0.5, 0.2 + lv * 0.04);
    if (s.complaints >= RATING) end(s);
  };

  const depart = () => {
    const s = sim.current;
    if (phase !== 'play' || s.mode !== 'stop') return;
    // Leaving good riders behind with free seats earns a complaint.
    const left = s.waiting.filter((p) => p.ok);
    if (left.length && s.seated.length < SEATS) {
      s.complaints += 1;
      sound.stamp();
      sayKey('angry', null, 'warn', left[0]);
    } else sound.whoosh(0.6);
    s.earnings += Math.max(0, Math.round(s.dwell)) * 2; // quick-turnaround bonus
    keepFocus();
    s.waiting = [];
    s.mode = 'drive';
    s.driveT = 0;
    s.fined = false;
    s.stop += s.dir;
    if (s.complaints >= RATING) end(s);
    setTick((n) => n + 1);
  };

  const board = (id) => {
    const s = sim.current;
    if (phase !== 'play' || s.mode !== 'stop') return;
    const p = s.waiting.find((x) => x.id === id);
    if (!p) return;
    keepFocus();
    if (s.seated.length >= MAX) {
      sound.click();
      say(tRef.current('bdFull'), 'warn');
      return;
    }
    s.waiting = s.waiting.filter((x) => x.id !== id);
    if (s.fare > p.will) {
      sound.click();
      sayKey('refuse', { n: localDigits(s.fare, lang) }, 'warn', p);
    } else {
      s.seated.push({ ...p, fare: s.fare });
      sound.flap();
      if (Math.random() < 0.45) sayKey('board', null, 'ink', p);
      if (s.seated.length === SEATS + 1) say(tRef.current('bdOverload'), 'warn');
    }
    setTick((n) => n + 1);
  };

  const shout = () => {
    const s = sim.current;
    if (phase !== 'play' || s.mode !== 'stop' || s.shoutCd > 0) return;
    s.shoutCd = 4;
    s.shoutT = 1.4;
    keepFocus();
    const add = Math.random() < 0.35 ? 2 : 1;
    for (let i = 0; i < add && s.waiting.length < 9; i++) s.waiting.push(newPassenger(s));
    sound.bowl(1.3);
    sayKey('khali', null, 'accent');
    setTick((n) => n + 1);
  };

  const setFare = (d) => {
    const s = sim.current;
    if (phase !== 'play') return;
    s.fare = clamp(s.fare + d, FARE_MIN, FARE_MAX);
    sound.click();
    setTick((n) => n + 1);
  };

  const start = () => {
    const s = newSim();
    sim.current = s;
    s.stopsDone = -1;
    s.dir = 1;
    s.stop = 0;
    arrive(s);
    s.earnings = 0;
    setResult(null);
    setQuote(null);
    setPhase('play');
    sound.click();
    rootRef.current?.focus({ preventScroll: true });
  };

  const end = (s) => {
    if (s.over) return;
    s.over = true;
    const final = s.earnings;
    const isNew = submitBest(final);
    onScore?.(final);
    sound.bowl(0.8);
    setResult({ score: final, served: s.served, stops: Math.max(0, s.stopsDone), isNew, joke: pickJoke(['nepal'], lang) });
    setPhase('over');
  };

  // ------------------------------------------------------------ update
  const update = (dt) => {
    const s = sim.current;
    if (s.over) return;
    s.t += dt;
    s.shoutCd = Math.max(0, s.shoutCd - dt);
    s.shoutT = Math.max(0, s.shoutT - dt);
    if (s.mode === 'stop') {
      s.dwell -= dt;
      for (const p of s.waiting) p.patience -= dt;
      const gone = s.waiting.filter((p) => p.patience <= 0);
      if (gone.length) {
        s.waiting = s.waiting.filter((p) => p.patience > 0);
        const goodGone = gone.filter((p) => p.ok);
        if (goodGone.length && s.seated.length < SEATS) {
          s.complaints += 1;
          sound.stamp();
          sayKey('angry', null, 'warn', goodGone[0]);
        }
      }
      s.trickle -= dt;
      if (s.trickle <= 0 && s.waiting.length < 7 && s.dwell > 3) {
        s.waiting.push(newPassenger(s));
        s.trickle = rand(2.5, 5);
      }
      if (s.complaints >= RATING) return end(s);
      if (s.dwell <= 0) depart();
    } else {
      s.driveT += dt;
      s.scroll += dt * 90;
      if (s.police && !s.fined && s.driveT > DRIVE * 0.5) {
        s.fined = true;
        if (s.seated.length > SEATS) {
          const fine = 100 + (s.seated.length - SEATS) * 50;
          s.earnings = Math.max(0, s.earnings - fine);
          s.complaints += 1;
          sound.stamp();
          say(tRef.current('bdFined', { n: localDigits(fine, lang) }), 'warn');
          if (s.complaints >= RATING) return end(s);
        } else say(tRef.current('bdPoliceOk'), 'accent');
      }
      if (s.driveT >= DRIVE) arrive(s);
    }
    tickT.current -= dt;
    if (tickT.current <= 0) {
      tickT.current = 0.1;
      setTick((n) => n + 1);
    }
  };

  // ------------------------------------------------------------ draw
  const draw = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const s = sim.current;
    const P = pal.current;
    const { w, h } = sizeRef.current;
    const U = h / 100;
    const vw = w / U;
    const night = P.night;
    const sc = reduce ? 0 : s.scroll;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.scale(U, U);

    const sky = ctx.createLinearGradient(0, 0, 0, 100);
    sky.addColorStop(0, night ? mixColor(P.bg, '#000000', 0.2) : mixColor(P.bg, '#a9c7da', 0.4));
    sky.addColorStop(1, night ? P.bg2 : mixColor(P.bg, P.accent, 0.12));
    ctx.fillStyle = sky;
    ctx.fillRect(-5, -5, vw + 10, 110);

    // Buildings, scrolling while the bus drives.
    const bw = 26;
    const off = (sc * 0.5) % bw;
    for (let i = -1; i < vw / bw + 2; i++) {
      const idx = i + Math.floor((sc * 0.5) / bw);
      const hh = 26 + ((idx * 37) % 23);
      const x = i * bw - off;
      ctx.fillStyle = night ? mixColor(P.bg2, '#2a2f4a', 0.3 + ((idx * 13) % 5) / 10) : mixColor('#c9b59a', '#e2d6c2', ((idx * 7) % 5) / 5);
      ctx.fillRect(x, 66 - hh, bw - 1.5, hh);
      ctx.fillStyle = night ? alpha('#f5c66b', 0.6) : alpha('#3b3540', 0.3);
      for (let wy = 66 - hh + 4; wy < 62; wy += 7) for (let wx = x + 3; wx < x + bw - 5; wx += 6) if ((idx + wy + wx) % 4) ctx.fillRect(wx, wy, 2.5, 3);
    }
    // Road.
    ctx.fillStyle = night ? '#1d2136' : '#55555c';
    ctx.fillRect(-5, 66, vw + 10, 40);
    ctx.fillStyle = night ? alpha('#ece7dc', 0.12) : alpha('#ffffff', 0.25);
    ctx.fillRect(-5, 66, vw + 10, 1.5);
    ctx.fillStyle = alpha('#f4efe2', 0.5);
    const dash = (sc * 1.4) % 20;
    for (let x = -dash; x < vw + 20; x += 20) ctx.fillRect(x, 90, 10, 1.4);
    if (rainRef.current && !reduce) {
      ctx.strokeStyle = alpha(night ? '#9fb0d9' : '#5b7590', 0.35);
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      for (let i = 0; i < 60; i++) {
        const rx = (i * 37.7 + s.t * 40) % (vw + 10);
        const ry = (i * 19.3 + s.t * 160) % 100;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 1.5, ry + 5);
      }
      ctx.stroke();
    }

    const busX = vw * 0.18;
    // Stop sign and waiting riders.
    if (s.mode === 'stop' || phase !== 'play') {
      const sx = busX + 84;
      ctx.strokeStyle = P.ink2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, 78);
      ctx.lineTo(sx, 48);
      ctx.stroke();
      const name = stopName(ROUTE[s.stop] || ROUTE[0]);
      ctx.font = font(6, 650, 'sans');
      const tw = ctx.measureText(name).width;
      ctx.fillStyle = P.accent;
      rr(ctx, sx - 2, 40, tw + 8, 10, 3);
      ctx.fill();
      ctx.fillStyle = P.accentInk;
      ctx.textAlign = 'left';
      ctx.fillText(name, sx + 2, 47.2);
      s.waiting.forEach((p, i) => {
        const px = sx + 10 + (i % 5) * 8;
        const py = 80 + Math.floor(i / 5) * 6;
        if (px > vw - 4) return;
        const jig = reduce ? 0 : Math.sin(s.t * 6 + p.id) * (p.patience < 3 ? 0.8 : 0.2);
        ctx.fillStyle = p.face;
        ctx.beginPath();
        ctx.arc(px + jig, py - 12, 2.6, 0, Math.PI * 2);
        ctx.fill();
        rr(ctx, px - 2.6 + jig, py - 9, 5.2, 9, 2);
        ctx.fill();
      });
    }

    // Police ahead.
    if (s.mode === 'drive' && s.police) {
      const k = s.driveT / DRIVE;
      const px = vw + 20 - k * (vw * 0.9);
      ctx.fillStyle = night ? '#d9d4c7' : '#f4f0e6';
      ctx.beginPath();
      ctx.arc(px, 66, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2f4f86';
      rr(ctx, px - 3, 68.5, 6, 10, 2);
      ctx.fill();
      ctx.strokeStyle = '#c8372d';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(px + 3, 70);
      ctx.lineTo(px + 8, 64);
      ctx.stroke();
    }

    // The micro-bus. It leans when overloaded.
    const load = s.seated.length;
    const over = load > SEATS;
    const bob = s.mode === 'drive' && !reduce ? Math.sin(s.t * 18) * 0.6 : 0;
    ctx.save();
    ctx.translate(busX, 80 + bob);
    if (over) ctx.rotate(-0.03 - (reduce ? 0 : 0.01 * Math.sin(s.t * 9)));
    rr(ctx, 0, -32, 76, 26, 6);
    ctx.fillStyle = night ? '#dad6cc' : '#fbfaf6';
    ctx.fill();
    ctx.fillStyle = P.accent;
    ctx.fillRect(0, -14, 76, 4);
    ctx.fillStyle = night ? '#2a3150' : '#2f6fb5';
    ctx.fillRect(0, -10, 76, 1.5);
    // Windows with riders' heads.
    for (let i = 0; i < 5; i++) {
      const wx = 6 + i * 12;
      ctx.fillStyle = night ? '#3a4466' : '#9ab7c9';
      rr(ctx, wx, -29, 10, 10, 2);
      ctx.fill();
      for (let j = 0; j < 3; j++) {
        const n = i * 3 + j;
        if (n >= Math.min(load, 15)) continue;
        ctx.fillStyle = FACES[n % FACES.length];
        ctx.beginPath();
        ctx.arc(wx + 2.5 + j * 2.6, -22, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Windshield and the route board.
    ctx.fillStyle = night ? '#3a4466' : '#9ab7c9';
    rr(ctx, 66, -29, 8, 12, 2);
    ctx.fill();
    ctx.fillStyle = '#16181f';
    rr(ctx, 6, -37, 48, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#f5c66b';
    ctx.font = font(4.2, 650, 'sans');
    ctx.textAlign = 'center';
    ctx.fillText(stopName(s.dir > 0 ? ROUTE[ROUTE.length - 1] : ROUTE[0]), 30, -32.8);
    // Overflowing riders at the door.
    if (over) {
      for (let i = 0; i < load - SEATS; i++) {
        ctx.fillStyle = FACES[(i + 3) % FACES.length];
        ctx.beginPath();
        ctx.arc(78 + i * 2.5, -22 + i * 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Wheels.
    ctx.fillStyle = '#16181f';
    [16, 60].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, -6, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8b8d96';
      ctx.beginPath();
      ctx.arc(x, -6, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16181f';
    });
    if (night) {
      ctx.fillStyle = 'rgba(255,236,180,0.25)';
      ctx.beginPath();
      ctx.moveTo(76, -12);
      ctx.lineTo(120, -18);
      ctx.lineTo(120, 0);
      ctx.closePath();
      ctx.fill();
    }
    // The conductor's shout.
    if (s.shoutT > 0) {
      const text = tRef.current('bdShoutBubble');
      ctx.font = font(7, 800, 'display');
      const tw = ctx.measureText(text).width;
      const bx = 72;
      const by = -52;
      ctx.fillStyle = P.surface;
      rr(ctx, bx, by, tw + 10, 12, 6);
      ctx.fill();
      ctx.strokeStyle = P.accentFg;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = P.accentFg;
      ctx.textAlign = 'left';
      ctx.fillText(text, bx + 5, by + 8.6);
    }
    ctx.restore();

    // Dwell timer.
    if (phase === 'play' && s.mode === 'stop') {
      const k = clamp(s.dwell / s.dwellMax, 0, 1);
      ctx.fillStyle = alpha(P.ink, 0.12);
      rr(ctx, 6, 6, vw - 12, 3, 1.5);
      ctx.fill();
      ctx.fillStyle = k < 0.25 ? (night ? '#fb923c' : '#c2410c') : P.accent;
      rr(ctx, 6, 6, (vw - 12) * k + 0.01, 3, 1.5);
      ctx.fill();
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

  // ------------------------------------------------------------ input
  const onKeyDown = (e) => {
    if (isButtonKey(e)) return;
    const k = e.key;
    if (phase === 'play') {
      const slot = SLOT_KEYS.indexOf(k);
      if (slot >= 0) {
        claim(e);
        const p = sim.current.waiting[slot];
        if (p) board(p.id);
      } else if (k === 'k' || k === 'K' || k === ' ') {
        claim(e);
        if (!e.repeat) shout();
      } else if (k === 'Enter' || k === 'g' || k === 'G') {
        claim(e);
        depart();
      } else if (k === '-' || k === '_' || k === '[' || k === 'ArrowDown' || k === 'ArrowLeft') {
        claim(e);
        setFare(-5);
      } else if (k === '+' || k === '=' || k === ']' || k === 'ArrowUp' || k === 'ArrowRight') {
        claim(e);
        setFare(5);
      } else if (k === 'p' || k === 'P' || k === 'Escape') {
        claim(e);
        setPhase('paused');
      }
    } else if (k === ' ' || k === 'Enter') {
      claim(e);
      if (phase === 'paused') setPhase('play');
      else start();
    }
  };

  const s = sim.current;
  const front = ahead(s);
  const playing = phase === 'play';
  const atStop = playing && s.mode === 'stop';
  const load = s.seated.length;
  const rs = (n) => t('rs', { n: localDigits(n, lang) });

  return (
    <div ref={rootRef} className="bx-root" tabIndex={0} onKeyDown={onKeyDown} aria-roledescription={t('game')} aria-label={t('bdTitle')}>
      <Hud
        items={[
          { id: 'e', label: t('bdEarned'), value: rs(s.earnings), tone: 'accent' },
          { id: 'l', label: t('bdLoad'), value: `${localDigits(load, lang)} / ${localDigits(SEATS, lang)}`, tone: load > SEATS ? 'warn' : undefined },
          { id: 'r', label: t('bdRating'), value: <Pips total={RATING} left={RATING - s.complaints} label={t('bdRating')} /> },
          { id: 'v', label: t('level'), value: level(s) },
        ]}
      />
      <ol className="bd-route" aria-label={t('bdRoute')}>
        {ROUTE.map((id, i) => {
          const state = i === s.stop ? (s.mode === 'drive' ? 'ahead' : 'now') : front.includes(id) ? 'ahead' : 'past';
          const police = playing && s.mode === 'stop' && s.police && front[0] === id;
          return (
            <li key={id} className="bd-stop" data-state={state} data-police={police || undefined}>
              {stopName(id)}
              {police && ` · ${t('bdPoliceTag')}`}
            </li>
          );
        })}
      </ol>
      <div ref={wrapRef} className="bx-stage">
        <canvas ref={canvasRef} role="img" aria-label={t('bdCanvas')} />
        {phase === 'start' && (
          <Panel kicker={t('bdKicker')} title={t('bdTitle')} primary={{ label: t('start'), onClick: start }}>
            <p>{t('bdIntro')}</p>
          </Panel>
        )}
        {phase === 'paused' && (
          <Panel kicker={t('bdTitle')} title={t('paused')} primary={{ label: t('resume'), onClick: () => setPhase('play') }} secondary={{ label: t('restart'), onClick: start }}>
            <p>{t('pausedBody')}</p>
          </Panel>
        )}
        {phase === 'over' && result && (
          <Panel kicker={result.isNew ? t('newBest') : t('gameOver')} title={t('bdOverTitle')} primary={{ label: t('again'), onClick: start }}>
            <p className="bx-big">{rs(result.score)}</p>
            <p>{t('bdOverBody', { n: localDigits(result.served, lang), s: localDigits(result.stops, lang) })}</p>
            <p>{t('bestLine', { n: rs(Math.max(best, result.score)) })}</p>
            {result.joke && <p className="bx-joke">{result.joke}</p>}
          </Panel>
        )}
      </div>

      <p className="bx-hint" aria-live="polite" style={{ minHeight: '2.6em' }}>
        {quote ? (
          <span style={{ color: quote.tone === 'warn' ? 'var(--ink)' : quote.tone === 'accent' ? 'var(--accent-fg)' : 'var(--ink-2)', fontWeight: 600 }}>
            {quote.who ? `${t('bdRider', { dest: stopName(quote.who.dest) })}: ` : ''}
            {quote.text}
          </span>
        ) : playing ? (
          s.mode === 'drive' ? t('bdDriving', { stop: stopName(ROUTE[s.stop]) }) : t('bdAtStop', { stop: stopName(ROUTE[s.stop]), n: localDigits(Math.max(0, Math.ceil(s.dwell)), lang) })
        ) : (
          t('bdHint')
        )}
      </p>

      <div className="bd-board" role="list" aria-label={t('bdWaiting')}>
        {!atStop || s.waiting.length === 0 ? (
          <div className="bd-empty" role="listitem">
            {!playing ? t('bdKeysLine') : s.mode === 'drive' ? t('bdOnTheWay') : t('bdNobody')}
          </div>
        ) : (
          s.waiting.map((p, i) => {
            const angry = p.patience < 3;
            return (
              <div key={p.id} role="listitem" style={{ display: 'contents' }}>
                <button
                  type="button"
                  className="bd-pax"
                  data-mood={angry ? 'angry' : undefined}
                  onClick={() => board(p.id)}
                  aria-label={t('bdBoardAria', { dest: stopName(p.dest), n: localDigits(i + 1, lang) })}
                >
                  <span className="bd-face" style={{ background: p.face }} aria-hidden="true">
                    <UserIcon size={16} weight="fill" color="#fff" />
                  </span>
                  <span className="bd-dest">{stopName(p.dest)}</span>
                  <span className="bd-meta">{angry ? t('bdImpatient') : t('bdWaitingFor')}</span>
                  {i < 9 && (
                    <span className="bd-key" aria-hidden="true">
                      {localDigits(i + 1, lang)}
                    </span>
                  )}
                  <span className="bd-patience" style={{ width: '100%', transform: `scaleX(${clamp(p.patience / p.max, 0, 1)})` }} aria-hidden="true" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="bx-controls">
        <div className="bx-pads">
          <div className="bd-fare" role="group" aria-label={t('bdFare')}>
            <Pad label={t('bdFareDown')} onDown={() => setFare(-5)} disabled={!playing || s.fare <= FARE_MIN}>
              <MinusIcon size={16} weight="bold" aria-hidden="true" />
            </Pad>
            <span className="bd-fare-value" aria-live="polite">
              {rs(s.fare)}
            </span>
            <Pad label={t('bdFareUp')} onDown={() => setFare(5)} disabled={!playing || s.fare >= FARE_MAX}>
              <PlusIcon size={16} weight="bold" aria-hidden="true" />
            </Pad>
          </div>
          <Pad label={t('bdShout')} onDown={shout} disabled={!atStop || s.shoutCd > 0}>
            <MegaphoneIcon size={18} weight="bold" aria-hidden="true" />
            <span>{t('bdShout')}</span>
          </Pad>
          <Pad className="bx-pad-accent" label={t('bdDepart')} onDown={depart} disabled={!atStop}>
            <SteeringWheelIcon size={18} weight="bold" aria-hidden="true" />
            <span>{t('bdDepart')}</span>
          </Pad>
          <Pad label={t('pause')} onDown={() => setPhase('paused')} disabled={!playing}>
            <PauseIcon size={18} weight="bold" aria-hidden="true" />
          </Pad>
        </div>
        <p className="bd-smart">
          {t('bdSmart')} <b>{rs(smartFare(s))}</b>
          {rainy ? ` · ${t('bdRainSurge')}` : ''}
        </p>
      </div>
    </div>
  );
}
