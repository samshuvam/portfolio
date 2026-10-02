import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
const AircraftHangar=lazy(()=>import('./AircraftHangar'));
import { ArrowDownRightIcon, CommandIcon, MapPinIcon } from '@phosphor-icons/react';
import SkyCanvas from './SkyCanvas';
import { Term } from '../ui/Term';
import { profile } from '../../data/profile';
import { useWorld, useNow, formatNptClock } from '../../lib/world';
import { useWeather } from '../../lib/weather';
import { setState, useStore } from '../../lib/store';
import { gsap, SplitText, reducedMotion, scrollToTarget } from '../../lib/motion';
import { useSeason } from '../ThemeSync';
import { useT, useLocalize, localDigits, rich } from '../../i18n';
import dict from '../../i18n/ui/core';
import seasonOverlay from '../../i18n/content/seasons';
import festivalOverlay from '../../i18n/content/festivals';
import './hero.css';

export default function Hero() {
  const t = useT(dict), ls = useLocalize(seasonOverlay), lf = useLocalize(festivalOverlay);
  const root = useRef(null);
  const [tone, setTone] = useState('dark');
  const onTone = useCallback((t) => setTone(t), []);
  const loaded = useStore((s) => s.loaded);
  const world = useWorld();
  const now = useNow();
  const weather = useWeather();
  const season = ls(useSeason());
  const festival = lf(world.festivals.active);

  useEffect(() => {
    if (!loaded) return undefined;
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      const split = new SplitText('.hero-line-text', { type: 'chars', charsClass: 'hero-char' });
      gsap.from(split.chars, { yPercent: 115, rotate: 7, duration: 1.25, stagger: 0.04, ease: 'power4.out', delay: 0.45 });
      gsap.from('.hero-reveal', { y: 26, autoAlpha: 0, duration: 1.1, stagger: 0.09, delay: 1.05, ease: 'power3.out' });
      const st = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.hero-line-1', { xPercent: -7, ease: 'none', scrollTrigger: st });
      gsap.to('.hero-line-2', { xPercent: 6, ease: 'none', scrollTrigger: { ...st } });
      gsap.to('.hero-copy', { y: -60, autoAlpha: 0.2, ease: 'none', scrollTrigger: { ...st, start: 'top top', end: '70% top' } });
    }, root);
    return () => ctx.revert();
  }, [loaded]);

  return (
    <section id="top" ref={root} className="hero" data-sky={tone} aria-label={t('hero.label')}>
      <SkyCanvas onTone={onTone} />
      <div className="hero-fade" aria-hidden="true" />

      <div className="wrap hero-inner">
        <p className="hero-greet hero-reveal">
          <Term id="pranam" className="font-deva">
            प्रणाम
          </Term>
          <span aria-hidden="true">/</span>
          <Term id="namaste" className="font-deva">
            नमस्ते
          </Term>
          <span aria-hidden="true">/</span>
          <span>hello</span>
          {festival && (
            <span className="hero-festival">
              <span className="font-deva">{festival.np}</span> {t('hero.festivalOn', {name:festival.name})}
            </span>
          )}
          {world.festivals.isBirthday && <span className="hero-festival">{t('hero.birthday')}</span>}
        </p>

        <h1 className="hero-name" aria-label={profile.name}>
          <span className="hero-line hero-line-1" aria-hidden="true">
            <span className="hero-line-text">Shuvam</span>
          </span>
          <span className="hero-line hero-line-2" aria-hidden="true">
            <span className="hero-tirhuta hero-reveal" title={t('hero.tirhutaTitle')}>
              <Term id="tirhuta">{profile.tirhuta}</Term>
            </span>
            <span className="hero-line-text">Singh.</span>
          </span>
        </h1>

        <div className="hero-copy">
          <p className="hero-sub hero-reveal">
            {rich(t('hero.sub'), {remembers:<Term id="continual-learning">{t('hero.remembers')}</Term>, thinks:<Term id="4d-trajectory">{t('hero.thinks')}</Term>})}
          </p>
          <div className="hero-ctas hero-reveal">
            <a
              className="btn btn-accent"
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget('#work');
              }}
            >
              {t('hero.seeWork')} <ArrowDownRightIcon size={18} weight="bold" />
            </a>
            <button type="button" className="btn btn-ghost hero-ghost" onClick={() => setState({ palette: true })}>
              <CommandIcon size={17} /> {t('hero.ask')}
            </button>
            <Suspense fallback={null}><AircraftHangar/></Suspense>
          </div>
        </div>

        <div className="hero-live hero-reveal" aria-label={t('hero.live')}>
          <span>
            <MapPinIcon size={15} weight="fill" /> {t('hero.place')}
          </span>
          <span>
            <Term id="npt">{localDigits(formatNptClock(now))} NPT</Term>
          </span>
          <span>{weather ? t('hero.weather', {temp:localDigits(weather.temp),label:t(`wx.${weather.kind}`)}) : t('hero.checking')}</span>
          <span>
            <Term id="ritu">
              {t('hero.ritu', {name:season.name,english:season.english.toLowerCase(),np:season.np})}
            </Term>
          </span>
          <span className="font-deva hero-bs">
            <Term id="bikram-sambat">{world.bs.np}</Term>
          </span>
        </div>
      </div>
    </section>
  );
}
