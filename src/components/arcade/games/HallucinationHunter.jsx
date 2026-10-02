import { useEffect, useRef, useState } from 'react';
import { ArrowRightIcon, MagnifyingGlassIcon, SealCheckIcon, SealWarningIcon, FireIcon } from '@phosphor-icons/react';
import dict from '../../../i18n/ui/arcade';
import { localDigits, useLang, useT } from '../../../i18n';
import { sound } from '../../../lib/sound';
import { reducedMotion } from '../../../lib/motion';
import { claimKey, gameOverJoke, isButtonActivation, isCoarse, shuffle, useLatest, useLoop } from './a-kit';
import { Overlay, PadButton, Pips, Stat } from './a-ui';
import { FACTS, factText } from './a-facts';
import './a-games.css';

// Hallucination Hunter: an overconfident AI fires claims. Swipe right (or
// press Right) for True, left (or Left) for Hallucinated, before the clock
// runs out. Every answer shows a one-line explanation. Streaks multiply the
// score, the clock shrinks, three mistakes and the game is over.

const LIVES = 3;
const SWIPE = 90;

const family = (id) => id.split('-')[0];

// Easy claims first, then medium, then hard; shuffled inside each tier, and
// never a claim right after its own true or false twin.
function buildDeck() {
  const deck = [];
  [1, 2, 3].forEach((lvl) => deck.push(...shuffle(FACTS.filter((f) => f.level === lvl))));
  for (let i = 1; i < deck.length; i++) {
    if (family(deck[i].id) !== family(deck[i - 1].id)) continue;
    const j = deck.findIndex((f, k) => k > i + 1 && family(f.id) !== family(deck[i - 1].id) && f.level === deck[i].level);
    if (j > 0) [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const newSim = () => ({ deck: buildDeck(), idx: 0, score: 0, lives: LIVES, streak: 0, best: 0, answered: 0, left: 0, max: 1, revealT: 0, revealing: false, over: false });

export default function HallucinationHunter({ active = true, onScore }) {
  const t = useT(dict);
  const lang = useLang();
  const [phase, setPhase] = useState('start');
  const [card, setCard] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [hud, setHud] = useState({ score: 0, lives: LIVES, streak: 0 });
  const [over, setOver] = useState(null);
  const [coarse] = useState(isCoarse);
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const barRef = useRef(null);
  const nextBarRef = useRef(null);
  const sim = useRef(newSim());
  const drag = useRef(null);
  const reduce = useRef(reducedMotion());
  const langRef = useLatest(lang);
  const scoreRef = useLatest(onScore);

  const pushHud = () => {
    const s = sim.current;
    setHud({ score: s.score, lives: s.lives, streak: s.streak });
    scoreRef.current?.(s.score);
  };

  const timeFor = (fact, answered) => {
    const len = factText(fact, langRef.current).s.length;
    return Math.max(3.5 + len * 0.03, 7 + len * 0.05 - answered * 0.2);
  };

  const deal = (s) => {
    const fact = s.deck[s.idx];
    s.max = timeFor(fact, s.answered);
    s.left = s.max;
    s.revealing = false;
    s.revealT = 0;
    setReveal(null);
    setCard({ fact, n: s.idx + 1, conf: 94 + Math.floor(Math.random() * 7) });
    if (barRef.current) barRef.current.style.transform = 'scaleX(1)';
  };

  const finish = (s, won) => {
    s.over = true;
    setOver({ won, score: s.score, answered: s.answered, best: s.best, joke: gameOverJoke(['ai', 'nepal'], langRef.current) });
    setPhase('over');
    if (won) sound.success();
    else sound.stamp();
    scoreRef.current?.(s.score);
  };

  const start = () => {
    const s = newSim();
    sim.current = s;
    setOver(null);
    setPhase('play');
    deal(s);
    pushHud();
    sound.click();
    rootRef.current?.focus({ preventScroll: true });
  };

  const next = () => {
    const s = sim.current;
    if (s.over || !s.revealing) return;
    if (s.lives <= 0) return finish(s, false);
    s.idx += 1;
    if (s.idx >= s.deck.length) return finish(s, true);
    sound.click();
    deal(s);
  };

  // kind: 'true' | 'false' | 'timeout'
  const answer = (kind) => {
    const s = sim.current;
    if (s.over || s.revealing || phase !== 'play' || !active) return;
    const fact = s.deck[s.idx];
    const ok = kind !== 'timeout' && (kind === 'true') === fact.truth;
    s.answered += 1;
    let pts = 0;
    if (ok) {
      s.streak += 1;
      s.best = Math.max(s.best, s.streak);
      const mult = Math.min(5, 1 + Math.floor((s.streak - 1) / 3));
      pts = Math.round((100 + (s.left / s.max) * 100) * mult);
      s.score += pts;
      if (s.streak % 5 === 0) sound.success();
      else sound.click();
    } else {
      s.streak = 0;
      s.lives -= 1;
      if (kind === 'timeout') sound.flap();
      else sound.stamp();
    }
    s.revealing = true;
    s.revealT = 2.4 + factText(fact, langRef.current).why.length * 0.035;
    s.revealMax = s.revealT;
    setReveal({ ok, kind, truth: fact.truth, pts, streak: s.streak, mult: Math.min(5, 1 + Math.floor((s.streak - 1) / 3)) });
    pushHud();
  };

  useLoop(active && phase === 'play', (dt) => {
    const s = sim.current;
    if (s.over) return;
    if (s.revealing) {
      s.revealT -= dt;
      if (nextBarRef.current) nextBarRef.current.style.transform = `scaleX(${Math.max(0, s.revealT / (s.revealMax || 1)).toFixed(3)})`;
      if (s.revealT <= 0) next();
      return;
    }
    s.left -= dt;
    if (barRef.current) {
      barRef.current.style.transform = `scaleX(${Math.max(0, s.left / s.max).toFixed(3)})`;
      barRef.current.dataset.low = s.left < 2.5 ? 'true' : 'false';
    }
    if (s.left <= 0) answer('timeout');
  });

  // The Next and answer buttons swap places; if the focused one vanished,
  // keep keyboard focus inside the game (never pull it from elsewhere).
  useEffect(() => {
    const ae = document.activeElement;
    if (phase === 'play' && (!ae || ae === document.body)) rootRef.current?.focus({ preventScroll: true });
  }, [reveal, phase]);

  // A new language mid-claim: give the reader the time the new text needs.
  useEffect(() => {
    const s = sim.current;
    if (phase !== 'play' || s.revealing || !card) return;
    const m = timeFor(card.fact, s.answered);
    s.left = Math.min(m, s.left + Math.max(0, m - s.max));
    s.max = m;
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------- swipe
  const setCardX = (dx, animate = false) => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    el.style.transform = dx ? `translateX(${dx}px) rotate(${reduce.current ? 0 : dx * 0.035}deg)` : '';
    el.dataset.lean = dx > 30 ? 'true' : dx < -30 ? 'false' : '';
  };

  const onPointerDown = (e) => {
    if (phase !== 'play' || !active) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || sim.current.revealing) return;
    d.dx = e.clientX - d.x;
    if (!d.moved && Math.abs(d.dx) > 8 && Math.abs(d.dx) > Math.abs(e.clientY - d.y)) {
      d.moved = true;
      cardRef.current?.setPointerCapture?.(e.pointerId);
    }
    if (d.moved) setCardX(d.dx);
  };
  const onPointerEnd = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    if (sim.current.revealing) {
      // A tap on the revealed card moves on.
      if (!d.moved && e.type === 'pointerup') next();
      return;
    }
    if (d.moved && Math.abs(d.dx) >= SWIPE) {
      sound.whoosh(0.35);
      answer(d.dx > 0 ? 'true' : 'false');
    }
    setCardX(0, true);
  };

  const onKey = (e) => {
    if (phase !== 'play' || isButtonActivation(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const s = sim.current;
    let act = null;
    if (k === 'ArrowRight' || k === 'd' || k === 't') act = () => (s.revealing ? next() : answer('true'));
    else if (k === 'ArrowLeft' || k === 'a' || k === 'f') act = () => (s.revealing ? next() : answer('false'));
    else if ((k === 'Enter' || k === ' ') && s.revealing) act = next;
    if (!act) return;
    claimKey(e);
    act();
  };

  const text = card ? factText(card.fact, lang) : null;
  const mult = Math.min(5, 1 + Math.floor(Math.max(0, hud.streak - 1) / 3));

  return (
    <div ref={rootRef} className="ag-root hh" tabIndex={-1} onKeyDown={onKey}>
      <div className="ag-hud">
        <Stat label={t('ag.score')} value={hud.score} />
        <div className="ag-stat">
          <span className="ag-stat-label">{t('hh.streak')}</span>
          <span className="ag-stat-value">
            {hud.streak >= 3 && <FireIcon size={15} weight="fill" aria-hidden="true" className="hh-fire" />}
            {localDigits(hud.streak, lang)}
            {mult > 1 && <small className="hh-mult">×{localDigits(mult, lang)}</small>}
          </span>
        </div>
        <Pips label={t('ag.lives')} total={LIVES} left={hud.lives} />
      </div>

      <div className="hh-timer" role="img" aria-label={t('hh.time')}>
        <i ref={barRef} />
      </div>

      <div className="hh-stage">
        {card && text && (
          <article
            key={card.n}
            ref={cardRef}
            className="hh-card"
            data-verdict={reveal ? (reveal.ok ? 'ok' : 'bad') : undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            <header className="hh-card-head">
              <span className="chip">{t(`hh.topic.${card.fact.topic}`)}</span>
              <span className="t-mono hh-n">{t('hh.claim', { n: localDigits(card.n, lang) })}</span>
            </header>
            <p className="hh-claim" aria-live="polite" aria-atomic="true">
              {text.s}
            </p>
            <p className="hh-conf t-mono" aria-hidden="true">
              {t('hh.confidence', { n: localDigits(card.conf, lang) })}
            </p>
            {reveal && (
              <span className="hh-stamp" data-truth={reveal.truth || undefined} aria-hidden="true">
                {reveal.truth ? t('hh.true') : t('hh.false')}
              </span>
            )}
            <span className="hh-lean hh-lean-false" aria-hidden="true">
              {t('hh.false')}
            </span>
            <span className="hh-lean hh-lean-true" aria-hidden="true">
              {t('hh.true')}
            </span>
          </article>
        )}
      </div>

      <div className="hh-why" aria-live="polite">
        {reveal && text && (
          <>
            <p className="hh-verdict" data-ok={reveal.ok || undefined}>
              {reveal.ok ? <SealCheckIcon size={18} weight="fill" aria-hidden="true" /> : <SealWarningIcon size={18} weight="fill" aria-hidden="true" />}
              <b>{reveal.ok ? t('hh.correct', { n: localDigits(reveal.pts, lang) }) : reveal.kind === 'timeout' ? t('hh.timeout') : t('hh.wrong')}</b>
              <span>{reveal.truth ? t('hh.wasTrue') : t('hh.wasFalse')}</span>
              {reveal.ok && reveal.streak >= 5 && reveal.streak % 5 === 0 && <span className="hh-streak-msg">{t('hh.streakMsg', { n: localDigits(reveal.streak, lang) })}</span>}
            </p>
            <p className="hh-expl">{text.why}</p>
          </>
        )}
      </div>

      <div className="ag-pads hh-pads" role="group" aria-label={t('ag.controls')}>
        {reveal ? (
          <PadButton key="next" label={t('hh.next')} onPress={next} className="hh-next">
            <span>{t('hh.next')}</span>
            <ArrowRightIcon size={18} weight="bold" aria-hidden="true" />
            <i ref={nextBarRef} className="hh-next-bar" aria-hidden="true" />
          </PadButton>
        ) : (
          <>
            <PadButton key="false" label={t('hh.answerFalse')} onPress={() => answer('false')} className="hh-btn-false" disabled={phase !== 'play'}>
              <SealWarningIcon size={18} weight="bold" aria-hidden="true" />
              <span>{t('hh.false')}</span>
            </PadButton>
            <PadButton key="true" label={t('hh.answerTrue')} onPress={() => answer('true')} className="hh-btn-true" disabled={phase !== 'play'}>
              <SealCheckIcon size={18} weight="bold" aria-hidden="true" />
              <span>{t('hh.true')}</span>
            </PadButton>
          </>
        )}
      </div>
      <p className="ag-hint">{coarse ? t('hh.swipeHint') : t('hh.keys')}</p>

      {phase === 'start' && (
        <Overlay
          kicker={t('hh.kicker')}
          title={t('g.hallucination-hunter.title')}
          actions={
            <button type="button" className="btn btn-accent btn-sm" data-primary onClick={start}>
              <MagnifyingGlassIcon size={18} weight="bold" aria-hidden="true" />
              {t('ag.start')}
            </button>
          }
        >
          <ul className="ag-how">
            <li>{t('hh.how1')}</li>
            <li>{t('hh.how2')}</li>
            <li>{t('hh.how3')}</li>
          </ul>
          <p className="ag-sub">{coarse ? t('hh.touch') : t('hh.keys')}</p>
        </Overlay>
      )}
      {phase === 'over' && over && (
        <Overlay
          kicker={over.won ? t('hh.kicker') : t('ag.gameOver')}
          title={over.won ? t('hh.winTitle') : t('hh.overTitle')}
          tone={over.won ? 'default' : 'over'}
          actions={
            <button type="button" className="btn btn-accent btn-sm" data-primary onClick={start}>
              {t('ag.again')}
            </button>
          }
        >
          <p className="ag-big">{localDigits(over.score.toLocaleString('en-US'), lang)}</p>
          <p className="ag-sub">{t('hh.overBody', { n: localDigits(over.answered, lang), s: localDigits(over.best, lang) })}</p>
          <p className="ag-joke">
            <span>{t('ag.jokeBreak')}</span> {over.joke}
          </p>
        </Overlay>
      )}
    </div>
  );
}
