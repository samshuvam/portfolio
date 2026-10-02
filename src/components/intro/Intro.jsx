import { useEffect, useRef, useState } from 'react';
import { AirplaneTiltIcon } from '@phosphor-icons/react';
import Loader from '../layout/Loader';
import { gsap, reducedMotion, lockScroll } from '../../lib/motion';
import { getState, setState, useStore } from '../../lib/store';
import { findEgg } from '../../lib/eggs';
import { getWorld, formatNptClock24 } from '../../lib/world';
import { getWeather, useWeather } from '../../lib/weather';
import { skyColors, rgbToCss } from '../hero/sky';
import { planeBus, hidePlane, showPlane } from '../../three/planeBus';
import { useT, localDigits } from '../../i18n';
import dict from '../../i18n/ui/intro';
import './intro.css';

// The opening scene. First visit in a session: Flight SS2504 lines up on
// runway 27 at Janakpur and takes off (Three.js, src/three/TakeoffScene.js),
// then the overlay dissolves into the hero and the page's own plane flies in
// behind the name. Return visits and reduced motion: a calm one second
// "Boarding" fade. No WebGL: the classic boarding loader.

const SEEN_KEY = 'ss-takeoff';
// Must match TIMELINE in TakeoffScene.js (kept here so the overlay UI can
// render before the heavy module arrives).
const ATC_AT = [0.4, 2.5, 4.3];
const TYPE_CPS = 44;
const SCENE_WAIT_MS = 5000; // give up on the cinematic if Three.js is this slow
const HARD_CAP_MS = 15000; // the page always opens by then

const devParam = (name) => {
  if (!import.meta.env.DEV) return null;
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
};

function initialMode() {
  const forced = devParam('intro');
  if (forced === 'cinema' || forced === 'calm' || forced === 'fallback') return forced;
  if (reducedMotion()) return 'calm';
  try {
    if (sessionStorage.getItem(SEEN_KEY) === '1') return 'calm';
  } catch {
    /* storage blocked: play it */
  }
  return 'cinema';
}

function handoff() {
  setState({ loaded: true, intro: 'done' });
  planeBus.introDone = true;
  showPlane('intro');
  lockScroll(false, 'intro');
}

// Dev only: ?weather=clear|fog|rain|storm previews the scene in other weather.
const devWeather = () => {
  const kind = devParam('weather');
  if (!kind) return null;
  const wet = kind === 'rain' || kind === 'storm' || kind === 'drizzle';
  return { kind, label: kind, temp: 24, cloud: kind === 'clear' ? 0.05 : wet || kind === 'cloudy' ? 0.85 : 0.4, wind: 9 };
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function skyGradient() {
  const w = getWorld();
  const c = skyColors(w?.sun?.elevation ?? 30, { season: w?.season, weather: getWeather() });
  return `linear-gradient(180deg, ${rgbToCss(c.top)} 0%, ${rgbToCss(c.mid)} 55%, ${rgbToCss(c.horizon)} 100%)`;
}

export default function Intro() {
  const [mode, setMode] = useState(initialMode);
  const [gone, setGone] = useState(false);
  const t = useT(dict);
  const weather = useWeather();
  const loaded = useStore((s) => s.loaded);

  const root = useRef(null);
  const canvasRef = useRef(null);
  const barRef = useRef(null);
  const pctRef = useRef(null);
  const loadRef = useRef(null);
  const whoRef = useRef(null);
  const lineRef = useRef(null);
  const subRef = useRef(null);
  const liveRef = useRef(null);
  const skipRef = useRef(() => {});
  const [bg] = useState(skyGradient);

  // Radio lines, refreshed on every render so language or weather changes
  // reach the running animation.
  const knots = weather && weather.wind >= 6 ? Math.round(weather.wind / 1.852) : 0;
  const wind = knots ? t('windKnots', { n: knots }) : t('windCalm');
  const windSub = knots ? t('windKnotsSub', { n: localDigits(knots) }) : t('windCalmSub');
  const radio = [
    { who: `JANAKPUR ${t('tower').toUpperCase()}`, text: t('atcClear', { wind }), sub: t('subClear', { wind: windSub }) },
    { who: 'SS2504', text: t('atcReadback'), sub: t('subReadback') },
    { who: t('cabin').toUpperCase(), text: t('cabinLine'), sub: t('subCabin') },
  ];
  const lines = useRef(radio);
  useEffect(() => {
    lines.current = radio;
  });

  // ---- cinematic -------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'cinema') return undefined;
    let alive = true;
    let finished = false;
    let scene = null;
    let raf = 0;
    let time = 0;
    let last = 0;
    let fontsReady = false;
    let lineIdx = -1;
    let removeTimer = 0;
    let shown = '';
    const tweens = [];
    const freeze = devParam('freeze');
    const frozen = freeze !== null && !Number.isNaN(parseFloat(freeze)) ? parseFloat(freeze) : null;
    const progress = { scene: false, fonts: false };

    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setState({ intro: 'playing' });
    hidePlane('intro');
    lockScroll(true, 'intro');

    const paintProgress = () => {
      const pct = 15 + (progress.scene ? 50 : 0) + (progress.fonts ? 35 : 0);
      if (barRef.current) barRef.current.style.transform = `scaleX(${pct / 100})`;
      if (pctRef.current) pctRef.current.textContent = `${localDigits(pct)}%`;
      loadRef.current?.setAttribute('aria-valuenow', String(pct));
      if (pct >= 100 && loadRef.current) tweens.push(gsap.to(loadRef.current, { autoAlpha: 0, duration: 0.6, delay: 0.4 }));
    };
    paintProgress();

    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!alive) return;
      fontsReady = true;
      progress.fonts = true;
      paintProgress();
    });

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (scene) {
        scene.dispose();
        scene = null;
        if (import.meta.env.DEV) delete window.__ssTakeoff;
      }
    };

    const finish = (skipped) => {
      if (finished || !alive) return;
      finished = true;
      clearTimeout(slowTimer);
      clearTimeout(hardTimer);
      if (!skipped) findEgg('takeoff');
      handoff();
      const el = root.current;
      if (!el) {
        stop();
        setGone(true);
        return;
      }
      const dur = skipped ? 0.45 : 0.95;
      const remove = () => {
        clearTimeout(removeTimer);
        stop();
        if (alive) setGone(true);
      };
      tweens.push(gsap.to(el, { autoAlpha: 0, duration: dur, ease: 'power2.inOut', onComplete: remove }));
      // gsap runs on requestAnimationFrame, which a background tab pauses:
      // make sure the overlay still leaves.
      removeTimer = setTimeout(remove, dur * 1000 + 600);
      if (canvasRef.current && !skipped) tweens.push(gsap.to(canvasRef.current, { opacity:0, duration:0.9, ease:'power2.out' }));
    };
    skipRef.current = () => finish(true);

    const slowTimer = setTimeout(() => {
      if (!scene) finish(true);
    }, SCENE_WAIT_MS);
    const hardTimer = frozen === null ? setTimeout(() => finish(true), HARD_CAP_MS) : 0;

    const onKey = (e) => {
      if (e.key === 'Escape') finish(true);
    };
    window.addEventListener('keydown', onKey);

    const size = () => {
      const c = canvasRef.current;
      if (scene && c) scene.resize(c.clientWidth || window.innerWidth, c.clientHeight || window.innerHeight);
    };
    window.addEventListener('resize', size);

    const updateRadio = (tt) => {
      let idx = -1;
      for (let i = 0; i < ATC_AT.length; i++) if (tt >= ATC_AT[i]) idx = i;
      const line = lines.current[idx];
      if (idx !== lineIdx) {
        lineIdx = idx;
        shown = '';
        if (whoRef.current) whoRef.current.textContent = line ? line.who : '';
        if (subRef.current) {
          subRef.current.textContent = line?.sub || '';
          subRef.current.classList.remove('is-on');
        }
        if (liveRef.current && line) liveRef.current.textContent = `${line.who}: ${line.text}${line.sub ? ` ${line.sub}` : ''}`;
        root.current?.querySelector('.intro-radio')?.classList.toggle('is-on', !!line);
      }
      if (!line) return;
      const n = Math.max(0, Math.floor((tt - ATC_AT[idx]) * TYPE_CPS));
      const text = line.text.slice(0, n);
      if (text !== shown && lineRef.current) {
        shown = text;
        lineRef.current.textContent = text;
      }
      if (n >= line.text.length && subRef.current && !subRef.current.classList.contains('is-on')) subRef.current.classList.add('is-on');
    };

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      last = now;
      time = frozen ?? time + dt;
      if (!scene) return;
      scene.frame(time, dt);
      updateRadio(time);
      if (!finished && frozen === null && time >= scene.timeline.dissolve && fontsReady) finish(false);
    };

    const mobile = window.matchMedia?.('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 700;

    import('../../three/TakeoffScene.js')
      .then(async (mod) => {
        await (await import('../../three/airliner.js')).preloadAirliner();
        if (!alive || finished) return;
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#214b39';
        try {
          const s = mod.createTakeoffScene({
            canvas: canvasRef.current,
            accent,
            world: getWorld(),
            weather: devWeather() ?? getWeather(),
            mobile,
            onContextLost: () => finish(true),
          });
          scene = { ...s, timeline: mod.TIMELINE };
        } catch {
          // No WebGL here: the classic boarding loader takes over.
          clearTimeout(slowTimer);
          clearTimeout(hardTimer);
          finished = true;
          if (alive) setMode('fallback');
          return;
        }
        if (import.meta.env.DEV) window.__ssTakeoff = scene;
        progress.scene = true;
        paintProgress();
        size();
        canvasRef.current?.classList.add('is-ready');
        raf = requestAnimationFrame(loop);
      })
      .catch(() => {
        if (alive && !finished) {
          clearTimeout(slowTimer);
          clearTimeout(hardTimer);
          finished = true;
          setMode('fallback');
        }
      });

    return () => {
      alive = false;
      clearTimeout(removeTimer);
      clearTimeout(slowTimer);
      clearTimeout(hardTimer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', size);
      tweens.forEach((tw) => tw.kill());
      stop();
      skipRef.current = () => {};
      if (!finished) {
        lockScroll(false, 'intro');
        showPlane('intro');
      }
    };
  }, [mode]);

  // ---- calm: return visits and reduced motion --------------------------------
  useEffect(() => {
    if (mode !== 'calm') return undefined;
    let alive = true;
    let tween = null;
    setState({ intro: 'playing' });
    hidePlane('intro');
    lockScroll(true, 'intro');
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.race([Promise.all([fonts, wait(550)]), wait(1400)]).then(() => {
      if (!alive) return;
      handoff();
      if (!root.current) return setGone(true);
      tween = gsap.to(root.current, { autoAlpha: 0, duration: 0.45, ease: 'power1.out', onComplete: () => alive && setGone(true) });
    });
    return () => {
      alive = false;
      tween?.kill();
      if (!getState().loaded) {
        lockScroll(false, 'intro');
        showPlane('intro');
      }
    };
  }, [mode]);

  // ---- fallback: the boarding loader decides when the page is ready ----------
  useEffect(() => {
    if (mode !== 'fallback') return;
    lockScroll(false, 'intro');
    hidePlane('intro');
    if (loaded) {
      setState({ intro: 'done' });
      planeBus.introDone = true;
      showPlane('intro');
    } else {
      setState({ intro: 'playing' });
    }
  }, [mode, loaded]);

  if (mode === 'fallback') return <Loader />;
  if (gone) return null;

  if (mode === 'calm') {
    return (
      <div ref={root} className="intro intro-calm" role="status" aria-live="polite">
        <p className="intro-calm-mark">
          <AirplaneTiltIcon size={20} weight="duotone" aria-hidden="true" />
          <span>{t('boardingFlight')}</span>
        </p>
      </div>
    );
  }

  const clock = formatNptClock24(getWorld()?.date ?? new Date());

  return (
    <div ref={root} className="intro intro-cinema" style={{ background: bg }} role="region" aria-label={t('region')}>
      <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />
      <div className="intro-scrim" aria-hidden="true" />

      <header className="intro-strip">
        <p className="intro-flight">
          <span>SS2504</span>
          <span className="intro-tirhuta font-tirhuta" aria-hidden="true">
            {'\u{114AC}\u{114B3}\u{114A6}\u{114A7}\u{114C2}'}
          </span>
        </p>
        <p className="intro-meta">
          <span>JKR / VNJP</span>
          <span>
            {t('runway')} 27
          </span>
          <span>
            {t('elevation')} 78 m / 256 ft
          </span>
        </p>
        <p className="intro-meta intro-meta-soft">
          <span>{t('airport')}</span>
          <span>NPT {localDigits(clock)}</span>
          <span>
            {t('dest')}: {t('destValue')}
          </span>
        </p>
      </header>

      <div className="intro-radio" aria-hidden="true">
        <p className="intro-radio-who" ref={whoRef} />
        <p className="intro-radio-line" ref={lineRef} />
        <p className="intro-radio-sub" ref={subRef} />
      </div>
      <p className="sr-only" aria-live="polite" ref={liveRef} />

      <button type="button" className="intro-skip" onClick={() => skipRef.current()} aria-label={t('skipLabel')}>
        <span>{t('skip')}</span>
        <kbd aria-hidden="true">Esc</kbd>
      </button>

      <div className="intro-load" ref={loadRef} role="progressbar" aria-label={t('boarding')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={15}>
        <span className="intro-load-label">
          {t('boarding')} <span ref={pctRef}>15%</span>
        </span>
        <span className="intro-load-track">
          <span className="intro-load-bar" ref={barRef} />
        </span>
      </div>
    </div>
  );
}
