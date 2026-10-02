import { Component, Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowClockwiseIcon,
  ArrowUpRightIcon,
  BowlFoodIcon,
  BrainIcon,
  BusIcon,
  CheckIcon,
  DroneIcon,
  EjectIcon,
  GameControllerIcon,
  MagnifyingGlassIcon,
  ShuffleIcon,
  SquaresFourIcon,
  TrophyIcon,
  TruckIcon,
  WindIcon,
} from '@phosphor-icons/react';
import { GAMES } from './registry';
import dict from '../../i18n/ui/arcade';
import projectsOverlay from '../../i18n/content/projects';
import { localDigits, useLang, useLocalize, useT } from '../../i18n';
import { projects } from '../../data/projects';
import { setState, useStore } from '../../lib/store';
import { findEgg } from '../../lib/eggs';
import { sound } from '../../lib/sound';
import { gsap, reducedMotion, scrollToTarget } from '../../lib/motion';
import Yap from '../ui/Yap';
import './arcade.css';

// The arcade: a shelf of eight cartridges and one console. Choosing a
// cartridge lazy-loads that game into the console; only one runs at a time
// and it pauses whenever the console is off screen or a dialog covers it.
// Best scores and the games played are remembered in localStorage; playing
// all eight stamps the passport ('arcade').

const ICONS = {
  'memory-keeper': BrainIcon,
  'atc-tower': DroneIcon,
  'token-tetris': SquaresFourIcon,
  'hallucination-hunter': MagnifyingGlassIcon,
  'rover-run': TruckIcon,
  'kite-fight': WindIcon,
  'momo-catcher': BowlFoodIcon,
  'bus-dash': BusIcon,
};

const BEST_KEY = 'ss-arcade-best';
const PLAYED_KEY = 'ss-arcade-played';
const PLAYED_AFTER = 8000; // ms of active play that counts as "played"

function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be blocked; the arcade still works */
  }
}
const readBest = () => {
  const v = readJSON(BEST_KEY, {});
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
};
const readPlayed = () => {
  const v = readJSON(PLAYED_KEY, []);
  return Array.isArray(v) ? v.filter((id) => GAMES.some((g) => g.id === id)) : [];
};

// One React.lazy per game, created on first use. A failed load is dropped
// so "Try again" fetches it afresh.
const lazyCache = new Map();
function getLazy(id) {
  if (!lazyCache.has(id)) {
    const game = GAMES.find((g) => g.id === id);
    lazyCache.set(
      id,
      lazy(() =>
        game.load().catch((err) => {
          lazyCache.delete(id);
          throw err;
        }),
      ),
    );
  }
  return lazyCache.get(id);
}
const preload = (id) => {
  GAMES.find((g) => g.id === id)
    ?.load()
    .catch(() => {});
};

const GameSlot = memo(function GameSlot({ id, active, onScore, onEgg }) {
  const Game = getLazy(id);
  return <Game active={active} onScore={onScore} onEgg={onEgg} />;
});

class LoadBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    if (import.meta.env.DEV) console.warn('[arcade] cartridge failed', err);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="arcade-msg" role="alert">
        <p>{this.props.failText}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={this.props.onRetry}>
          <ArrowClockwiseIcon size={16} weight="bold" aria-hidden="true" />
          {this.props.retryText}
        </button>
      </div>
    );
  }
}

export default function Arcade() {
  const t = useT(dict);
  const lang = useLang();
  const loc = useLocalize(projectsOverlay);
  const [current, setCurrent] = useState(null);
  const [retry, setRetry] = useState(0);
  const [best, setBest] = useState(readBest);
  const [played, setPlayed] = useState(readPlayed);
  const [inView, setInView] = useState(false);
  const startBest = useRef(null);
  if (startBest.current === null) startBest.current = { ...best };
  const bestRef = useRef(best);
  const playedRef = useRef(played);
  const rootRef = useRef(null);
  const consoleRef = useRef(null);
  const screenRef = useRef(null);
  const cartBtns = useRef(new Map());

  const dialogOpen = useStore((s) => !!s.project || s.palette || s.passport || s.lightbox !== null);
  const active = !!current && inView && !dialogOpen;

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), []);

  // Pause the game when the console leaves the viewport.
  useEffect(() => {
    const el = consoleRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Cartridges slide onto the shelf the first time it scrolls into view.
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.cart', {
        y: 24,
        opacity: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.arcade-shelf', start: 'top 85%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Persist best scores, batched.
  useEffect(() => {
    const id = setTimeout(() => writeJSON(BEST_KEY, best), 400);
    return () => clearTimeout(id);
  }, [best]);

  const markPlayed = useCallback((id) => {
    if (playedRef.current.includes(id)) return;
    const next = [...playedRef.current, id];
    playedRef.current = next;
    setPlayed(next);
    writeJSON(PLAYED_KEY, next);
    if (GAMES.every((g) => next.includes(g.id))) findEgg('arcade');
  }, []);

  // A game counts as played after a few seconds of active play, even if it
  // never reports a score.
  useEffect(() => {
    if (!current || !active) return undefined;
    const id = setTimeout(() => markPlayed(current), PLAYED_AFTER);
    return () => clearTimeout(id);
  }, [current, active, markPlayed]);

  // Stable callbacks per game, so the memoised game never re-renders when a
  // score update re-renders the shelf.
  const onScore = useMemo(() => {
    if (!current) return undefined;
    const id = current;
    return (n) => {
      const v = Math.floor(Number(n));
      if (!Number.isFinite(v)) return;
      if (v > 0) markPlayed(id);
      if (v > (bestRef.current[id] || 0)) {
        bestRef.current = { ...bestRef.current, [id]: v };
        setBest(bestRef.current);
      }
    };
  }, [current, markPlayed]);
  const onEgg = useCallback((id) => findEgg(id), []);

  const choose = (id) => {
    sound.click();
    // Focus the screen first: the game's start panel then takes focus when
    // it mounts (it only does so when focus is already inside the console).
    screenRef.current?.focus({ preventScroll: true });
    if (id !== current) {
      setRetry(0);
      setCurrent(id);
    }
    requestAnimationFrame(() => {
      const r = consoleRef.current?.getBoundingClientRect();
      if (r && (r.top < 0 || r.top > window.innerHeight * 0.35)) scrollToTarget(consoleRef.current, { offset: -76, duration: 1 });
    });
  };

  const eject = () => {
    const id = current;
    sound.whoosh(0.3);
    setCurrent(null);
    requestAnimationFrame(() => cartBtns.current.get(id)?.focus({ preventScroll: true }));
  };

  const randomGame = () => {
    const fresh = GAMES.filter((g) => !played.includes(g.id) && g.id !== current);
    const pool = fresh.length ? fresh : GAMES.filter((g) => g.id !== current);
    choose(pool[Math.floor(Math.random() * pool.length)].id);
  };

  const fmt = (n) => localDigits(Number(n).toLocaleString('en-US'), lang);
  const title = (id) => t(`g.${id}.title`);
  const allPlayed = played.length >= GAMES.length;
  const curBest = current ? best[current] || 0 : 0;
  const newBest = current && (startBest.current[current] || 0) > 0 && curBest > (startBest.current[current] || 0);
  const Icon = current ? ICONS[current] || GameControllerIcon : GameControllerIcon;

  return (
    <section id="arcade" ref={rootRef} className="section arcade" aria-labelledby="arcade-title">
      <div className="wrap">
        <header className="sec-head">
          <p className="sec-kicker">
            <b>{t('sec.kicker')}</b>
            <span>{allPlayed ? t('sec.allPlayed') : t('sec.played', { n: localDigits(played.length, lang), m: localDigits(GAMES.length, lang) })}</span>
          </p>
          <h2 id="arcade-title" className="t-display">
            {t('sec.title')} <span className="light">{t('sec.titleLight')}</span>
          </h2>
          <p className="t-lede">{t('sec.lede')}</p>
          <Yap>{t('sec.yap')}</Yap>
        </header>

        <div className="arcade-grid">
          <div ref={consoleRef} className="arcade-console" role="region" aria-label={t('sec.stage')}>
            <div className="console-top">
              <span className="console-led" data-on={active || undefined} aria-hidden="true" />
              <span className="console-brand t-mono" aria-hidden="true">
                SUV-1478
              </span>
              <span className="console-now">
                <Icon size={18} weight="duotone" aria-hidden="true" />
                <span className="console-title">{current ? title(current) : t('sec.insert')}</span>
                {current && <span className="sr-only">, {active ? t('sec.on') : t('sec.paused')}</span>}
              </span>
              {current && (
                <span className="console-best t-mono" aria-live="polite">
                  {newBest ? (
                    <b>{t('sec.newBest')}</b>
                  ) : (
                    <>
                      <TrophyIcon size={14} weight="bold" aria-hidden="true" />
                      <span>
                        {t('sec.best')} {curBest ? fmt(curBest) : '0'}
                      </span>
                    </>
                  )}
                </span>
              )}
              {current && (
                <button type="button" className="btn btn-ghost btn-sm console-eject" onClick={eject}>
                  <EjectIcon size={16} weight="bold" aria-hidden="true" />
                  <span>{t('sec.eject')}</span>
                </button>
              )}
            </div>

            <div ref={screenRef} className="arcade-screen" tabIndex={-1} data-empty={!current || undefined}>
              {current ? (
                <LoadBoundary key={`${current}:${retry}`} failText={t('sec.loadFail')} retryText={t('sec.retry')} onRetry={() => setRetry((r) => r + 1)}>
                  <Suspense
                    fallback={
                      <div className="arcade-msg" role="status">
                        <span className="arcade-spinner" aria-hidden="true" />
                        <p>{t('sec.loading')}</p>
                      </div>
                    }
                  >
                    <GameSlot id={current} active={active} onScore={onScore} onEgg={onEgg} />
                  </Suspense>
                </LoadBoundary>
              ) : (
                <div className="arcade-empty">
                  <div className="arcade-slot-art" aria-hidden="true">
                    <span />
                  </div>
                  <p className="arcade-empty-title">{t('sec.insert')}</p>
                  <p className="arcade-empty-hint">{t('sec.insertHint')}</p>
                  <button type="button" className="btn btn-accent btn-sm" onClick={randomGame}>
                    <ShuffleIcon size={16} weight="bold" aria-hidden="true" />
                    {t('sec.random')}
                  </button>
                </div>
              )}
            </div>

            <div className="console-foot" aria-hidden="true">
              <span className="console-dpad" />
              <span className="console-grille" />
              <span className="console-ab">
                <i />
                <i />
              </span>
            </div>
          </div>

          <div className="arcade-shelf-wrap">
            <div className="arcade-progress">
              <span className="t-label">{t('sec.shelf')}</span>
              <span className="arcade-dots" role="img" aria-label={t('sec.played', { n: localDigits(played.length, lang), m: localDigits(GAMES.length, lang) })}>
                {GAMES.map((g) => (
                  <i key={g.id} data-on={played.includes(g.id) || undefined} />
                ))}
              </span>
            </div>
            <ul className="arcade-shelf">
              {GAMES.map((g, i) => {
                const CartIcon = ICONS[g.id] || GameControllerIcon;
                const project = g.project ? projectById.get(g.project) : null;
                const short = project ? loc(project)?.short || project.short : null;
                const isCur = current === g.id;
                const score = best[g.id] || 0;
                const isPlayed = played.includes(g.id);
                return (
                  <li key={g.id} className="cart" data-active={isCur || undefined}>
                    <div className="cart-label" aria-hidden="true">
                      <span className="cart-no">{localDigits(String(i + 1).padStart(2, '0'), lang)}</span>
                      <CartIcon size={22} weight="duotone" />
                      {isPlayed && (
                        <span className="cart-played">
                          <CheckIcon size={12} weight="bold" />
                        </span>
                      )}
                    </div>
                    <h3 className="cart-title">
                      <button
                        type="button"
                        className="cart-play"
                        ref={(el) => {
                          if (el) cartBtns.current.set(g.id, el);
                          else cartBtns.current.delete(g.id);
                        }}
                        aria-pressed={isCur}
                        aria-describedby={`cart-blurb-${g.id}`}
                        onClick={() => choose(g.id)}
                        onPointerEnter={() => preload(g.id)}
                        onFocus={() => preload(g.id)}
                      >
                        {title(g.id)}
                      </button>
                    </h3>
                    {isCur && <span className="cart-now">{t('sec.playing')}</span>}
                    <p id={`cart-blurb-${g.id}`} className="cart-blurb">
                      {t(`g.${g.id}.blurb`)}
                    </p>
                    <div className="cart-foot">
                      <span className="cart-best">
                        <TrophyIcon size={14} weight="bold" aria-hidden="true" />
                        {score ? (
                          <span>
                            <span className="sr-only">{t('sec.best')}: </span>
                            {fmt(score)}
                          </span>
                        ) : (
                          <span className="cart-muted">{t('sec.noBest')}</span>
                        )}
                      </span>
                      {project ? (
                        <button type="button" className="cart-proj" onClick={() => setState({ project: project.id })} aria-label={t('sec.caseStudy', { title: short })}>
                          <span className="cart-proj-k">{t('sec.basedOn')}</span>
                          <span className="cart-proj-v">{short}</span>
                          <ArrowUpRightIcon size={13} weight="bold" aria-hidden="true" />
                        </button>
                      ) : (
                        <span className="cart-fun">{t('sec.justForFun')}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
