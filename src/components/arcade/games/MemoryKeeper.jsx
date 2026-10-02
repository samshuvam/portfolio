import { useEffect, useMemo, useRef, useState } from 'react';
import { BrainIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import dict from '../../../i18n/ui/arcade';
import { localDigits, useLang, useT } from '../../../i18n';
import { sound } from '../../../lib/sound';
import { reducedMotion } from '../../../lib/motion';
import { claimKey, gameOverJoke, isCoarse, isButtonActivation, rand, useLatest, useLoop } from './a-kit';
import { Overlay, Pips, Stat } from './a-ui';
import './a-games.css';

// Memory Keeper: memories fade along an Ebbinghaus curve, R = e^(-t/S).
// Recalling one resets the clock and raises its stability S (more so when
// it was nearly gone). Every night, sleep consolidates strong memories and
// prunes noise and weak ones. Five forgotten memories and it is over.

const MEMS = 20;
const NOISE = 8;
const SLOTS = 12;
const KEYS = ['q', 'w', 'e', 'r', 'a', 's', 'd', 'f', 'z', 'x', 'c', 'v'];
const FORGET = 0.1;
const DAY_LEN = 22;
const NIGHT_LEN = 3.4;
const LIVES = 5;
const SPARK = 40;

const retention = (c, gt) => Math.exp(-(gt - c.last) / c.S);

const newSim = () => ({ gt: 0, dayT: 0, day: 1, night: 0, spawnT: 0.5, cards: [], score: 0, forgotten: 0, recalls: 0, nextId: 1, sampleT: 0, samples: [], over: false });

export default function MemoryKeeper({ active = true, onScore }) {
  const t = useT(dict);
  const lang = useLang();
  const [phase, setPhase] = useState('start');
  const [cards, setCards] = useState([]);
  const [hud, setHud] = useState({ score: 0, day: 1, night: false, forgotten: 0 });
  const [spark, setSpark] = useState([]);
  const [msg, setMsg] = useState(null);
  const [over, setOver] = useState(null);
  const [cols, setCols] = useState(4);
  const [coarse] = useState(isCoarse);
  const rootRef = useRef(null);
  const boardRef = useRef(null);
  const dayBarRef = useRef(null);
  const els = useRef(new Map());
  const sim = useRef(null);
  const msgTimer = useRef(0);
  const reduce = useRef(reducedMotion());
  const tRef = useLatest(t);
  const langRef = useLatest(lang);
  const scoreRef = useLatest(onScore);

  const rows = cols === 3 ? 4 : 3;

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;
    const ro = new ResizeObserver(([entry]) => setCols(entry.contentRect.width < 520 ? 3 : 4));
    ro.observe(board);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(msgTimer.current), []);

  const flash = (text, tone = 'default') => {
    clearTimeout(msgTimer.current);
    setMsg({ text, tone, key: Date.now() });
    msgTimer.current = setTimeout(() => setMsg(null), 2200);
  };

  const pushHud = (s, extra = {}) => {
    setHud({ score: s.score, day: s.day, night: s.night > 0, forgotten: s.forgotten, ...extra });
    scoreRef.current?.(s.score);
  };

  const start = () => {
    sim.current = newSim();
    els.current.clear();
    setCards([]);
    setSpark([]);
    setOver(null);
    setHud({ score: 0, day: 1, night: false, forgotten: 0 });
    setPhase('play');
    scoreRef.current?.(0);
    sound.click();
    rootRef.current?.focus({ preventScroll: true });
  };

  const gameOver = (s) => {
    s.over = true;
    setOver({ days: s.day, recalls: s.recalls, score: s.score, joke: gameOverJoke(['ai', 'kanya'], langRef.current) });
    setPhase('over');
    sound.stamp();
    scoreRef.current?.(s.score);
  };

  const spawn = (s) => {
    const used = new Set(s.cards.map((c) => c.slot));
    const free = [];
    for (let i = 0; i < SLOTS; i++) if (!used.has(i)) free.push(i);
    if (!free.length) return false;
    const slot = free[Math.floor(Math.random() * free.length)];
    const noise = Math.random() < Math.min(0.32, (s.day - 1) * 0.08);
    const prefix = noise ? 'n' : 'm';
    const pool = noise ? NOISE : MEMS;
    const taken = new Set(s.cards.map((c) => c.label));
    let label = `${prefix}${1 + Math.floor(Math.random() * pool)}`;
    for (let tries = 0; tries < 12 && taken.has(label); tries++) label = `${prefix}${1 + Math.floor(Math.random() * pool)}`;
    const base = noise ? 5.5 : Math.max(3.2, 8.6 - (s.day - 1) * 0.85);
    s.cards.push({ id: s.nextId++, slot, kind: noise ? 'noise' : 'mem', label, S: base * rand(0.85, 1.15), last: s.gt, recalls: 0, cons: 0 });
    return true;
  };

  const sleep = (s) => {
    s.night = NIGHT_LEN;
    s.dayT = 0;
    let pruned = 0;
    let weak = 0;
    let cons = 0;
    s.cards = s.cards.filter((c) => {
      if (c.kind === 'noise') {
        pruned += 1;
        return false;
      }
      const R = retention(c, s.gt);
      if (R < 0.3) {
        weak += 1;
        return false;
      }
      // Consolidation: more stable, and partly refreshed.
      c.S = Math.min(90, c.S * 1.7);
      c.last = s.gt + c.S * Math.log(Math.min(1, R + 0.25));
      c.cons += 1;
      cons += 1;
      return true;
    });
    s.score += cons * 5 + pruned * 5;
    s.forgotten += weak;
    sound.bowl(0.9);
    flash(tRef.current('mk.sleepReport', { c: localDigits(cons), p: localDigits(pruned), w: localDigits(weak) }), weak ? 'bad' : 'good');
    if (s.forgotten >= LIVES) gameOver(s);
  };

  const step = (dt) => {
    const s = sim.current;
    if (!s || s.over) return;
    let changed = false;
    const before = { score: s.score, forgotten: s.forgotten, night: s.night > 0, day: s.day };

    if (s.night > 0) {
      s.night -= dt;
      if (s.night <= 0) {
        s.night = 0;
        s.day += 1;
        s.dayT = 0;
        s.spawnT = 0.4;
        sound.click();
        flash(tRef.current(s.day === 7 ? 'mk.week' : 'mk.wake', { n: localDigits(s.day) }), s.day === 7 ? 'good' : 'default');
      }
    } else {
      s.gt += dt;
      s.dayT += dt;
      s.spawnT -= dt;
      if (s.spawnT <= 0) {
        if (spawn(s)) changed = true;
        s.spawnT = Math.max(0.9, 2.6 - (s.day - 1) * 0.28) * rand(0.8, 1.2);
      }
      for (const c of [...s.cards]) {
        if (retention(c, s.gt) >= FORGET) continue;
        const el = els.current.get(c.id);
        if (el && el.contains(document.activeElement)) rootRef.current?.focus({ preventScroll: true });
        s.cards = s.cards.filter((x) => x !== c);
        changed = true;
        if (c.kind === 'mem') {
          s.forgotten += 1;
          sound.stamp();
          flash(tRef.current('mk.lostOne', { label: tRef.current(`mk.${c.label}`) }), 'bad');
          if (s.forgotten >= LIVES) {
            gameOver(s);
            break;
          }
        } else {
          s.score += 2; // noise that fades on its own is a good thing
        }
      }
      if (!s.over && s.dayT >= DAY_LEN) {
        sleep(s);
        changed = true;
      }
    }

    // Per-frame visuals straight to the DOM (no React render per frame).
    for (const c of s.cards) {
      const el = els.current.get(c.id);
      if (!el) continue;
      const R = retention(c, s.gt);
      el.style.setProperty('--r', R.toFixed(3));
      el.style.opacity = (0.24 + 0.76 * R).toFixed(3);
      el.dataset.weak = R < 0.3 ? 'true' : 'false';
      const pct = el.querySelector('.mk-pct');
      if (pct) pct.textContent = `${localDigits(Math.round(R * 100), langRef.current)}%`;
    }
    if (dayBarRef.current) {
      const p = s.night > 0 ? 1 - s.night / NIGHT_LEN : s.dayT / DAY_LEN;
      dayBarRef.current.style.transform = `scaleX(${Math.min(1, p).toFixed(3)})`;
    }

    s.sampleT += dt;
    if (s.sampleT >= 0.5) {
      s.sampleT = 0;
      const mems = s.cards.filter((c) => c.kind === 'mem');
      const avg = mems.length ? mems.reduce((a, c) => a + retention(c, s.gt), 0) / mems.length : 1;
      s.samples = [...s.samples, avg].slice(-SPARK);
      setSpark(s.samples);
    }

    if (changed) setCards([...s.cards]);
    if (s.score !== before.score || s.forgotten !== before.forgotten || s.night > 0 !== before.night || s.day !== before.day) pushHud(s);
  };

  useLoop(active && phase === 'play', step);

  const recall = (id) => {
    const s = sim.current;
    if (!s || s.over || phase !== 'play' || !active) return;
    if (s.night > 0) {
      flash(t('mk.asleepTap'));
      return;
    }
    const c = s.cards.find((x) => x.id === id);
    if (!c) return;
    const el = els.current.get(id);
    const R = retention(c, s.gt);
    if (c.kind === 'noise') {
      s.score = Math.max(0, s.score - 20);
      c.S *= 1.6;
      c.last = s.gt;
      sound.flap();
      flash(t('mk.noiseTap'), 'bad');
      if (el && !reduce.current) el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 });
    } else {
      const pts = 10 + Math.round((1 - R) * 40);
      s.score += pts;
      c.S = Math.min(90, c.S * (1.35 + (1 - R) * 1.3));
      c.last = s.gt;
      c.recalls += 1;
      s.recalls += 1;
      sound.click();
      flash(t(R < 0.3 ? 'mk.close' : 'mk.recalled', { n: localDigits(pts) }), R < 0.3 ? 'good' : 'default');
      if (el && !reduce.current) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 240 });
    }
    pushHud(s);
  };

  const onKey = (e) => {
    if (phase !== 'play' || isButtonActivation(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const i = KEYS.indexOf(e.key.toLowerCase());
    if (i < 0) return;
    claimKey(e);
    const c = sim.current?.cards.find((x) => x.slot === i);
    if (c) recall(c.id);
  };

  const sparkPoints = useMemo(() => spark.map((v, i) => `${((i / (SPARK - 1)) * 96).toFixed(1)},${(26 - v * 22).toFixed(1)}`).join(' '), [spark]);
  const pos = (slot) => ({ gridColumn: (slot % cols) + 1, gridRow: Math.floor(slot / cols) + 1 });

  return (
    <div ref={rootRef} className="ag-root mk" tabIndex={-1} onKeyDown={onKey}>
      <div className="ag-hud">
        <Stat label={t('ag.score')} value={hud.score} />
        <div className="ag-stat mk-day">
          <span className="ag-stat-label">{hud.night ? t('mk.nightLabel') : t('mk.dayLabel')}</span>
          <span className="ag-stat-value">
            {hud.night ? <MoonIcon size={16} weight="fill" aria-hidden="true" /> : <SunIcon size={16} weight="fill" aria-hidden="true" />}
            {localDigits(hud.day, lang)}
          </span>
          <span className="mk-daybar" aria-hidden="true">
            <i ref={dayBarRef} />
          </span>
        </div>
        <Pips label={t('ag.lives')} total={LIVES} left={Math.max(0, LIVES - hud.forgotten)} />
        <div className="ag-stat mk-spark" aria-hidden="true">
          <span className="ag-stat-label">{t('mk.retention')}</span>
          <svg viewBox="0 0 96 28" width="96" height="28">
            <line x1="0" y1="26" x2="96" y2="26" />
            {spark.length > 1 && <polyline points={sparkPoints} />}
          </svg>
        </div>
        <span className="mk-formula t-mono" aria-hidden="true">
          R = e<sup>-t/S</sup>
        </span>
      </div>

      <div ref={boardRef} className="mk-board" data-night={hud.night || undefined} style={{ '--cols': cols, '--rows': rows }}>
        {KEYS.map((k, i) => (
          <div key={k} className="mk-slot" style={pos(i)} aria-hidden="true">
            {!coarse && <span>{k.toUpperCase()}</span>}
          </div>
        ))}
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            ref={(el) => {
              if (el) els.current.set(c.id, el);
              else els.current.delete(c.id);
            }}
            className="mk-card"
            data-kind={c.kind}
            data-cons={c.cons > 0 || undefined}
            style={pos(c.slot)}
            onClick={() => recall(c.id)}
            disabled={phase !== 'play'}
          >
            {c.kind === 'noise' ? <span className="mk-tag">{t('mk.noise')}</span> : c.cons > 0 ? <span className="mk-tag">{t('mk.consolidatedTag')}</span> : null}
            <span className="mk-label">{t(`mk.${c.label}`)}</span>
            <span className="mk-meter" aria-hidden="true">
              <i />
            </span>
            <span className="mk-pct t-mono">100%</span>
            {!coarse && (
              <kbd className="mk-key" aria-hidden="true">
                {KEYS[c.slot].toUpperCase()}
              </kbd>
            )}
          </button>
        ))}
        {hud.night && (
          <div className="mk-night" aria-hidden="true">
            <MoonIcon size={30} weight="duotone" />
            <p>{t('mk.sleeping')}</p>
          </div>
        )}
      </div>

      <p className="ag-live" data-tone={msg?.tone} aria-live="polite" key={msg?.key}>
        {msg?.text || ' '}
      </p>
      <p className="ag-hint">{coarse ? t('mk.touch') : t('mk.keys')}</p>

      {phase === 'start' && (
        <Overlay
          kicker={t('ag.basedOnPaper')}
          title={t('g.memory-keeper.title')}
          actions={
            <button type="button" className="btn btn-accent btn-sm" data-primary onClick={start}>
              <BrainIcon size={18} weight="bold" aria-hidden="true" />
              {t('ag.start')}
            </button>
          }
        >
          <ul className="ag-how">
            <li>{t('mk.how1')}</li>
            <li>{t('mk.how2')}</li>
            <li>{t('mk.how3')}</li>
          </ul>
        </Overlay>
      )}
      {phase === 'over' && over && (
        <Overlay
          kicker={t('ag.gameOver')}
          title={t('mk.overTitle')}
          tone="over"
          actions={
            <button type="button" className="btn btn-accent btn-sm" data-primary onClick={start}>
              {t('ag.again')}
            </button>
          }
        >
          <p className="ag-big">{localDigits(over.score.toLocaleString('en-US'), lang)}</p>
          <p className="ag-sub">{t('mk.overBody', { days: localDigits(over.days, lang), recalls: localDigits(over.recalls, lang) })}</p>
          <p className="ag-joke">
            <span>{t('ag.jokeBreak')}</span> {over.joke}
          </p>
        </Overlay>
      )}
    </div>
  );
}
