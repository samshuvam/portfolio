import { useEffect, useRef, useState } from 'react';
import { CircleHalfIcon, CommandIcon, ListIcon, MoonIcon, SpeakerHighIcon, SpeakerSlashIcon, SunIcon, XIcon } from '@phosphor-icons/react';
import { waypoints } from '../../data/waypoints';
import { profile } from '../../data/profile';
import { setState, useStore } from '../../lib/store';
import { useNow, formatNptClock } from '../../lib/world';
import { ScrollTrigger, scrollToTarget, lockScroll } from '../../lib/motion';
import { findEgg } from '../../lib/eggs';
import { sound } from '../../lib/sound';
import LangSwitch from './LangSwitch';
import { useT, useLocalize, localDigits } from '../../i18n';
import dict from '../../i18n/ui/core';
import overlay from '../../i18n/content/waypoints';
import './nav.css';
import { useResolvedTheme } from '../ThemeSync';

const links = waypoints.filter((w) => w.nav);

export default function Nav() {
  const t = useT(dict), loc = useLocalize(overlay);
  const [active, setActive] = useState('top');
  const [hidden, setHidden] = useState(false);
  const themePref = useStore((s) => s.themePref);
  const resolvedTheme = useResolvedTheme();
  const yap = useStore((s) => s.yap);
  const soundOn = useStore((s) => s.sound);
  const menu = useStore((s) => s.menu);
  const now = useNow();
  const sheetRef = useRef(null);

  useEffect(() => {
    const els = waypoints.map((w) => document.getElementById(w.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => setHidden(self.direction === 1 && self.scroll() > window.innerHeight * 0.6),
    });
    return () => {
      io.disconnect();
      st.kill();
    };
  }, []);

  useEffect(() => {
    lockScroll(menu, 'menu');
    if (menu) sheetRef.current?.querySelector('a,button')?.focus();
    return () => lockScroll(false, 'menu');
  }, [menu]);

  const go = (id) => (e) => {
    e.preventDefault();
    setState({ menu: false });
    lockScroll(false, 'menu');
    sound.click();
    scrollToTarget(`#${id}`);
  };

  const cycleTheme = () => {
    const next = resolvedTheme === 'day' ? 'night' : 'day';
    setState({ themePref: next });
    sound.click();
  };

  const toggleYap = () => {
    setState({ yap: !yap });
    if (!yap) findEgg('yap');
    sound.click();
  };

  const ThemeIcon = themePref === 'day' ? SunIcon : themePref === 'night' ? MoonIcon : CircleHalfIcon;
  const activeId = waypoints.find((w) => w.id === active && w.nav)?.id || links.reduce((acc, l) => (waypoints.findIndex((w) => w.id === l.id) <= waypoints.findIndex((w) => w.id === active) ? l.id : acc), null);

  return (
    <>
      <header className={`nav ${hidden && !menu ? 'is-hidden' : ''}`}>
        <a href="#top" className="nav-logo" onClick={go('top')} aria-label={`${profile.name}, back to top`}>
          <span className="font-tirhuta">{'\u{114AC}\u{114B3}'}</span>
        </a>

        <nav className="nav-pill" aria-label={t('nav.sections')}>
          {links.map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={go(l.id)} aria-current={activeId === l.id ? 'true' : undefined}>
              {loc(l).label}
            </a>
          ))}
        </nav>

        <div className="nav-tools">
          <LangSwitch />
          <span className="nav-clock" title={t('nav.clockTitle')}>
            {localDigits(formatNptClock(now))} <span>NPT</span>
          </span>
          <div className="nav-yap" role="group" aria-label={t('nav.yapGroup')}>
            <button type="button" aria-pressed={!yap} onClick={() => yap && toggleYap()}>
              {t('nav.tldr')}
            </button>
            <button type="button" aria-pressed={yap} onClick={() => !yap && toggleYap()}>
              {t('nav.yap')}
            </button>
          </div>
          <button type="button" className="icon-btn" onClick={cycleTheme} aria-label={t({auto:'nav.themeAuto',day:'nav.themeDay',night:'nav.themeNight'}[themePref])} title={t({auto:'nav.themeAuto',day:'nav.themeDay',night:'nav.themeNight'}[themePref])}>
            <ThemeIcon size={17} weight="bold" />
          </button>
          <button
            type="button"
            className="icon-btn nav-hide-sm"
            aria-pressed={soundOn}
            aria-label={soundOn ? t('nav.mute') : t('nav.unmute')}
            title={soundOn ? t('nav.mute') : t('nav.unmute')}
            onClick={() => {
              setState({ sound: !soundOn });
              if (!soundOn) setTimeout(() => sound.bowl(1.5), 30);
            }}
          >
            {soundOn ? <SpeakerHighIcon size={17} weight="bold" /> : <SpeakerSlashIcon size={17} weight="bold" />}
          </button>
          <button type="button" className="nav-k nav-hide-sm" onClick={() => setState({ palette: true })} aria-label={t('nav.palette')}>
            <CommandIcon size={15} weight="bold" />K
          </button>
          <button type="button" className="icon-btn nav-menu-btn" onClick={() => setState({ menu: !menu })} aria-expanded={menu} aria-label={menu ? t('nav.close') : t('nav.open')}>
            {menu ? <XIcon size={18} weight="bold" /> : <ListIcon size={18} weight="bold" />}
          </button>
        </div>
      </header>

      <div ref={sheetRef} className={`nav-sheet ${menu ? 'is-open' : ''}`} aria-hidden={!menu} inert={!menu}>
        <nav aria-label={t('nav.all')}>
          {waypoints.map((w, i) => (
            <a key={w.id} href={`#${w.id}`} onClick={go(w.id)} style={{ transitionDelay: menu ? `${0.04 * i}s` : '0s' }}>
              <span className="t-mono">{w.code}</span>
              {loc(w).label}
            </a>
          ))}
        </nav>
        <div className="nav-sheet-tools">
          <LangSwitch variant="sheet" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setState({ palette: true, menu: false })}>
            <CommandIcon size={15} /> {t('nav.askSearch')}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setState({ sound: !soundOn })}>
            {soundOn ? t('nav.soundOn') : t('nav.soundOff')}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" aria-pressed={themePref === 'auto'} onClick={() => setState({themePref:'auto'})}>{t('nav.themeAuto')}</button>
        </div>
      </div>
    </>
  );
}
