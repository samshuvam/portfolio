import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon, XIcon } from '@phosphor-icons/react';
import { gsap, reducedMotion, lockScroll } from '../../lib/motion';
import { useStore, setState } from '../../lib/store';
import { findEgg } from '../../lib/eggs';
import { useT } from '../../i18n';
import dict from '../../i18n/ui/phone';
import { DEVICE, PhoneCtx, store, useClock, clockActions, timerLeft } from './os';
import { appById } from './registry';
import { Wallpaper, wallTone } from './wallpapers';
import { StatusBar, Island, VolumeHud, Banner, HomeIndicator } from './chrome';
import { sfx, setVolume, getVolume } from './audio';
import Lock from './Lock';
import Home from './Home';
import ControlCentre from './ControlCentre';
import './phone.css';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

function Splash({ app }) {
  const A = app.icon;
  return (
    <div className="sos-splash" style={{ '--tint': app.tint, color: app.ink || '#fff' }}>
      <A size={64} weight="fill" />
    </div>
  );
}

export default function ShuvamOS({ scale = 1 }) {
  const t = useT(dict);
  const tRef = useRef(t);
  tRef.current = t;
  const underBtn = useRef(null);
  const sound = useStore((s) => s.sound);
  const clock = useClock();

  const [host] = useState(() => {
    const d = document.createElement('div');
    d.className = 'sos-host';
    return d;
  });
  const anchor = useRef(null);
  const device = useRef(null);
  const screen = useRef(null);
  const appLayer = useRef(null);
  const homeLayer = useRef(null);
  const iconRefs = useRef({});
  const backRef = useRef(null);
  const busy = useRef(false);
  const origin = useRef(null);
  const appRef = useRef(null);
  const lockedRef = useRef(true);
  const unlockingRef = useRef(false);
  const pending = useRef(null);
  const flashTimer = useRef(0);
  const edge = useRef(null);
  const nudged = useRef(false);

  const [fs, setFs] = useState(false);
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [locked, setLocked] = useState(true);
  const [aod, setAod] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [app, setApp] = useState(null);
  const [cc, setCc] = useState(false);
  const [wall, setWallState] = useState(() => (() => { const wall=store.read('ss-phone-wall','forest'); return wall === 'mithila' || wall.startsWith('photo:') ? 'forest' : wall; })());
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [flashAct, setFlashAct] = useState(null);
  const [live, setLiveState] = useState({});
  const [banner, setBanner] = useState(null);
  const [torch, setTorch] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [seen, setSeen] = useState(() => store.read('ss-phone-seen', {}));

  appRef.current = app;
  lockedRef.current = locked;
  const visible = (inView || fs) && pageVisible;
  const frameless = fs && vp.w <= 560;
  const stageScale = fs ? (frameless ? 1 : Math.max(0.25, Math.min(1.15, (vp.h - 48) / DEVICE.h, (vp.w - 40) / DEVICE.w))) : scale;

  // ---- placement: the device lives in a host node that moves between the
  // inline slot and <body> (full screen) without remounting the OS.
  useLayoutEffect(() => {
    const target = fs ? document.body : anchor.current;
    if (!target) return undefined;
    host.classList.toggle('is-fs', fs);
    target.appendChild(host);
    return () => host.remove();
  }, [fs, host]);

  useEffect(() => {
    const el = anchor.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.04 });
    io.observe(el);
    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    if (!fs) return undefined;
    lockScroll(true, 'phone');
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    setTimeout(() => device.current?.querySelector('.sos-fs-exit, .sos-screen')?.focus({ preventScroll: true }), 50);
    return () => {
      window.removeEventListener('resize', onResize);
      lockScroll(false, 'phone');
      setTimeout(() => underBtn.current?.focus({ preventScroll: true }), 30);
    };
  }, [fs]);

  // ---- island ---------------------------------------------------------------
  const flash = useCallback((kind, data = {}, ms = 1700) => {
    clearTimeout(flashTimer.current);
    setFlashAct({ kind, ...data });
    flashTimer.current = setTimeout(() => setFlashAct(null), ms);
  }, []);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const setLive = useCallback((key, value) => {
    setLiveState((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const pushBanner = useCallback((b) => setBanner({ ...b, key: Date.now() }), []);
  useEffect(() => {
    if (!banner) return undefined;
    const id = setTimeout(() => setBanner(null), 4800);
    return () => clearTimeout(id);
  }, [banner]);

  // The kitchen timer keeps running when the Clock app is closed.
  useEffect(() => {
    if (!clock.timer.running) return undefined;
    const id = setTimeout(() => {
      const label = clock.timer.label;
      clockActions.timerCancel();
      sfx.whistle();
      const tt = tRef.current;
      pushBanner({ app: 'clock', title: tt('app.clock'), body: tt('clock.done', { label: label ? tt(`clock.p.${label}`) : tt('clock.timer') }) });
    }, timerLeft(clock.timer) + 30);
    return () => clearTimeout(id);
  }, [clock.timer, pushBanner]);

  // ---- apps -------------------------------------------------------------------
  const originFrom = (el) => {
    const sc = screen.current;
    if (!el || !sc) return null;
    const r = el.getBoundingClientRect();
    const sr = sc.getBoundingClientRect();
    const k = sr.width / sc.offsetWidth || 1;
    if (!r.width) return null;
    return { x: (r.left + r.width / 2 - sr.left) / k, y: (r.top + r.height / 2 - sr.top) / k };
  };

  const markOpened = (id) => {
    const list = new Set(store.read('ss-phone-opened', []));
    list.add(id);
    store.write('ss-phone-opened', [...list]);
    if (list.size >= 5) findEgg('phone');
    setSeen((s) => {
      if (s[id]) return s;
      const next = { ...s, [id]: 1 };
      store.write('ss-phone-seen', next);
      return next;
    });
  };

  const unlockRef = useRef(null);
  const open = useCallback((id, fromEl) => {
    const a = appById(id);
    if (!a) return;
    a.preload();
    setCc(false);
    setBanner(null);
    if (lockedRef.current) {
      pending.current = id;
      unlockRef.current?.();
      return;
    }
    if (busy.current) return;
    origin.current = originFrom(fromEl) || originFrom(iconRefs.current[id]) || null;
    backRef.current = null;
    sfx.tap();
    setApp(id);
    markOpened(id);
  }, []);

  const goHome = useCallback(() => {
    const id = appRef.current;
    setCc(false);
    if (!id) return;
    const el = appLayer.current;
    const home = homeLayer.current;
    const icon = iconRefs.current[id];
    const o = originFrom(icon) || origin.current;
    const finish = () => {
      busy.current = false;
      backRef.current = null;
      setApp(null);
      requestAnimationFrame(() => {
        if (device.current?.contains(document.activeElement) || document.activeElement === document.body) icon?.focus({ preventScroll: true });
      });
    };
    if (busy.current || reducedMotion() || !el) {
      if (home) gsap.set(home, { clearProps: 'transform,opacity' });
      finish();
      return;
    }
    busy.current = true;
    if (o) gsap.set(el, { transformOrigin: `${o.x}px ${o.y}px` });
    const tl = gsap
      .timeline({ onComplete: finish })
      .to(el, { scale: 0.13, opacity: 0, borderRadius: 110, duration: 0.42, ease: 'power3.inOut' }, 0)
      .to(home, { scale: 1, opacity: 1, duration: 0.42, ease: 'power2.out' }, 0.06);
    // If frames are throttled (hidden tab, busy device), never leave the OS stuck mid-zoom.
    setTimeout(() => {
      if (tl.progress() < 1) tl.progress(1);
    }, 900);
  }, []);

  const back = useCallback(() => {
    if (backRef.current?.()) return;
    goHome();
  }, [goHome]);

  // Zoom the app out of its icon.
  useLayoutEffect(() => {
    const el = appLayer.current;
    const home = homeLayer.current;
    if (!app) {
      if (home && !busy.current) gsap.set(home, { clearProps: 'transform,opacity' });
      return undefined;
    }
    if (!el) return undefined;
    if (reducedMotion()) {
      gsap.set(home, { opacity: 0 });
      return undefined;
    }
    const o = origin.current || { x: el.offsetWidth / 2, y: el.offsetHeight * 0.8 };
    gsap.set(el, { transformOrigin: `${o.x}px ${o.y}px` });
    busy.current = true;
    const tl = gsap
      .timeline({
        onComplete: () => {
          busy.current = false;
          gsap.set(el, { clearProps: 'transform,borderRadius' });
        },
      })
      .fromTo(el, { scale: 0.13, opacity: 0, borderRadius: 110 }, { scale: 1, opacity: 1, borderRadius: 0, duration: 0.55, ease: 'expo.out' }, 0)
      .to(home, { scale: 0.9, opacity: 0, duration: 0.4, ease: 'power2.out' }, 0);
    const guard = setTimeout(() => {
      if (tl.progress() < 1) tl.progress(1);
    }, 1000);
    return () => {
      clearTimeout(guard);
      tl.kill();
      busy.current = false;
    };
  }, [app]);

  // ---- lock / unlock ------------------------------------------------------------
  const unlock = useCallback(() => {
    if (!lockedRef.current || unlockingRef.current) return;
    unlockingRef.current = true;
    const reduce = reducedMotion();
    setAod(false);
    sfx.unlock();
    flash('faceid', {}, reduce ? 300 : 1100);
    setTimeout(() => setFlashAct((f) => (f?.kind === 'faceid' ? { kind: 'faceid', done: true } : f)), reduce ? 0 : 420);
    setTimeout(() => setUnlocking(true), reduce ? 0 : 560);
    setTimeout(
      () => {
        setLocked(false);
        lockedRef.current = false;
        setUnlocking(false);
        unlockingRef.current = false;
        const next = pending.current;
        pending.current = null;
        if (next) setTimeout(() => open(next), 30);
        else if (device.current?.contains(document.activeElement) || document.activeElement === document.body)
          setTimeout(() => device.current?.querySelector('.sos-home .sos-icon, .sos-home .sos-widget')?.focus({ preventScroll: true }), 30);
      },
      reduce ? 0 : 1000,
    );
  }, [flash, open]);
  unlockRef.current = unlock;

  const lock = useCallback(
    (toAod = false) => {
      setCc(false);
      setBanner(null);
      backRef.current = null;
      busy.current = false;
      setApp(null);
      setLocked(true);
      lockedRef.current = true;
      setAod(toAod);
      setTorch(false);
      sfx.lock();
    },
    [],
  );

  // A gentle nudge towards Messages after the first unlock.
  useEffect(() => {
    if (locked || nudged.current || seen.messages) return undefined;
    nudged.current = true;
    const id = setTimeout(() => {
      if (!appRef.current) pushBanner({ app: 'messages', title: tRef.current('lock.n1t'), body: tRef.current('os.nudge') });
    }, 5000);
    return () => clearTimeout(id);
  }, [locked, seen.messages, pushBanner]);

  // ---- hardware buttons ---------------------------------------------------------
  const power = () => {
    if (aod) {
      setAod(false);
      return;
    }
    lock(true);
  };
  const volume = (d) => {
    setVolume(getVolume() + d);
    sfx.tap();
  };
  const action = () => {
    const silentNow = sound;
    setState({ sound: !sound });
    flash('silent', { on: silentNow }, 1500);
  };

  // ---- gestures inside an app -----------------------------------------------------
  const onAppPointerDown = (e) => {
    const sc = screen.current;
    if (!sc) return;
    const sr = sc.getBoundingClientRect();
    const k = sr.width / sc.offsetWidth || 1;
    if ((e.clientX - sr.left) / k > 20) return;
    edge.current = { x: e.clientX, k };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onAppPointerMove = (e) => {
    if (!edge.current || !appLayer.current) return;
    const dx = Math.max(0, (e.clientX - edge.current.x) / edge.current.k);
    appLayer.current.style.transform = `translateX(${Math.min(dx, 160) * 0.7}px)`;
  };
  const onAppPointerUp = (e) => {
    if (!edge.current) return;
    const dx = (e.clientX - edge.current.x) / edge.current.k;
    edge.current = null;
    if (appLayer.current) appLayer.current.style.transform = '';
    if (dx > 80) back();
  };
  const onHomeDrag = (dy, end) => {
    const el = appLayer.current;
    if (!el || busy.current) return;
    el.style.transform = end ? '' : `translateY(${dy * 0.35}px) scale(${1 + dy / 1400})`;
    el.style.borderRadius = end ? '' : `${Math.min(40, -dy / 3)}px`;
  };

  // ---- keyboard ------------------------------------------------------------------
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (cc) {
        setCc(false);
      } else if (app) {
        back();
      } else if (fs) {
        setFs(false);
      } else return;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (fs && e.key === 'Tab' && device.current) {
      const items = [...device.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null && !el.closest('[inert]'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const setWall = useCallback((id) => {
    setWallState(id);
    store.write('ss-phone-wall', id);
  }, []);

  const ctx = useMemo(
    () => ({ visible, open, home: goHome, back, backRef, flash, setLive, banner: pushBanner, wall, setWall, fs, lock, appId: app }),
    [visible, open, goHome, back, flash, setLive, pushBanner, wall, setWall, fs, lock, app],
  );

  const persistent = live.call
    ? { kind: 'call', label: live.call, app: 'phone' }
    : live.music
      ? { kind: 'music', app: 'music' }
      : clock.timer.running
        ? { kind: 'timer', app: 'clock' }
        : clock.sw.running
          ? { kind: 'stopwatch', app: 'clock' }
          : null;
  const activity = flashAct || (persistent && persistent.app !== app ? persistent : null);
  const tone = app ? 'app' : wallTone(wall);
  const badges = useMemo(() => ({ messages: seen.messages ? 0 : 1, mail: seen.mail ? 0 : 3 }), [seen.messages, seen.mail]);
  const A = app ? appById(app) : null;
  const AppComp = A?.Comp;

  const deviceEl = (
    <div className={`sos-stage ${fs ? 'is-fs' : ''} ${frameless ? 'is-frameless' : ''}`} style={{ '--s': stageScale }}>
      {fs && !frameless && <div className="sos-fs-backdrop" onClick={() => setFs(false)} aria-hidden="true" />}
      <div
        className="sos-box"
        role={fs ? 'dialog' : undefined}
        aria-modal={fs ? 'true' : undefined}
        aria-label={fs ? t('os.fsLabel') : undefined}
      >
        <div className={`sos-device ${torch ? 'has-torch' : ''}`} ref={device} onKeyDown={onKeyDown}>
          {!frameless && (
            <>
              <span className="sos-torch" aria-hidden="true" />
              <button type="button" className="sos-hw sos-hw-action" aria-label={t('os.action')} onClick={action} />
              <button type="button" className="sos-hw sos-hw-volup" aria-label={t('os.volUp')} onClick={() => volume(0.125)} />
              <button type="button" className="sos-hw sos-hw-voldown" aria-label={t('os.volDown')} onClick={() => volume(-0.125)} />
              <button type="button" className="sos-hw sos-hw-power" aria-label={t('os.power')} onClick={power} />
            </>
          )}
          <div
            className={`sos-screen tone-${tone} ${aod ? 'is-aod' : ''} ${locked ? 'is-locked' : ''} ${visible ? '' : 'is-paused'}`}
            ref={screen}
            tabIndex={-1}
            role="region"
            aria-roledescription={t('os.roledesc')}
            aria-label={t('os.screen')}
          >
            <p className="sr-only">{t('os.srHelp')}</p>
            <Wallpaper id={wall} />
            <PhoneCtx.Provider value={ctx}>
              <div className={`sos-homelayer ${!locked || unlocking ? 'is-in' : ''}`} ref={homeLayer} inert={locked || !!app || cc}>
                <Home onOpen={open} iconRefs={iconRefs} badges={badges} />
              </div>

              {app && AppComp && (
                <div
                  className="sos-app"
                  ref={appLayer}
                  data-app={app}
                  inert={cc}
                  onPointerDown={onAppPointerDown}
                  onPointerMove={onAppPointerMove}
                  onPointerUp={onAppPointerUp}
                  onPointerCancel={onAppPointerUp}
                >
                  <Suspense fallback={<Splash app={A} />}>
                    <AppComp key={app} />
                  </Suspense>
                </div>
              )}

              {locked && (
                <Lock
                  aod={aod}
                  torch={torch}
                  unlocking={unlocking}
                  onUnlock={unlock}
                  onOpen={open}
                  onWake={() => setAod(false)}
                  onTorch={() => setTorch((v) => !v)}
                />
              )}
            </PhoneCtx.Provider>

            {!aod && (
              <div className="sos-statuswrap" inert={cc}>
                {frameless && (
                  <button type="button" className="sos-fs-exit is-inline" aria-label={t('os.collapse')} onClick={() => setFs(false)}>
                    <ArrowsInSimpleIcon size={13} weight="bold" />
                  </button>
                )}
                <StatusBar locked={locked} onControl={() => setCc((v) => !v)} />
              </div>
            )}
            <Island activity={aod ? null : activity} onOpen={open} />
            <VolumeHud />
            {!aod && (
              <ControlCentre
                open={cc}
                onClose={() => setCc(false)}
                torch={torch}
                onTorch={() => setTorch((v) => !v)}
                brightness={brightness}
                onBrightness={setBrightness}
                onLock={() => lock(false)}
              />
            )}
            {!aod && <Banner banner={banner} onOpen={(id) => open(id)} onClose={() => setBanner(null)} appIcon={banner ? appById(banner.app) : null} />}
            {!locked && <HomeIndicator onHome={goHome} onDrag={app ? onHomeDrag : undefined} label={app ? t('os.home') : t('os.homeHere')} tone={app ? 'app' : wallTone(wall)} />}
            <div className="sos-dim" style={{ opacity: (1 - brightness) * 0.85 }} aria-hidden="true" />
          </div>
        </div>
      </div>
      {fs && !frameless && (
        <button type="button" className="sos-fs-exit" aria-label={t('os.collapse')} onClick={() => setFs(false)}>
          <XIcon size={18} weight="bold" />
        </button>
      )}
    </div>
  );

  return (
    <div className="sos-wrap" style={{ '--s': scale }}>
      <div className="sos-anchor" ref={anchor} />
      <div className="sos-under">
        <button type="button" ref={underBtn} className="sos-under-btn" onClick={() => setFs((v) => !v)} aria-pressed={fs}>
          {fs ? <ArrowsInSimpleIcon size={15} weight="bold" /> : <ArrowsOutSimpleIcon size={15} weight="bold" />}
          {fs ? t('os.collapse') : t('os.expand')}
        </button>
        <span className="sos-under-hint">{locked ? t('os.hintLocked') : t('os.hint')}</span>
      </div>
      {createPortal(deviceEl, host)}
    </div>
  );
}
