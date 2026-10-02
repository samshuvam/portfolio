import { useEffect, useRef } from 'react';
import { useCopy } from '../../i18n/Text';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { Term } from '../ui/Term';
import Yap from '../ui/Yap';
import { profile, stats } from '../../data/profile';
import TermArt from '../ui/TermArt';
import { portrait } from '../../lib/photos';
import { gsap, reducedMotion } from '../../lib/motion';
import { useWorld } from '../../lib/world';
import { useT, useLocalize, localDigits, rich } from '../../i18n';
import dict from '../../i18n/ui/core';
import overlay from '../../i18n/content/profile';
import './about.css';

function Pill({ photo, children, label }) {
  return (
    <span className="pill-img" aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined} aria-label={label}>
      {photo ? <TermArt art={photo==='janaki'?'janaki':photo==='window'?'plane':'tokens'}/> : children}
    </span>
  );
}

const CurvePill = () => (
  <svg viewBox="0 0 80 36" className="pill-svg">
    <path d="M4 6C14 22 20 26 28 27L28 9C38 22 46 24 54 24L54 12C62 21 70 22 78 22" />
  </svg>
);

const steps = [
  { verb: 'Find the constraint', text: 'A context window, a crowded corridor, a legacy workflow. The bottleneck is rarely a single model.' },
  { verb: 'Instrument it', text: 'Break the failure point into measurable stages and add observability.' },
  { verb: 'Iterate', text: 'Change one thing, measure again. Repeat until it is fast and understandable.' },
  { verb: 'Ship something trusted', text: 'A result people can rely on, not just a demo that works on a good day.' },
];

export default function About() {
  const c=useCopy();
  const t = useT(dict), loc = useLocalize(overlay);
  const person = loc(profile, 'profile');
  const localizedStats = loc(stats, 'stats');
  const root = useRef(null);
  const world = useWorld();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      gsap.fromTo(
        '.manifesto-text',
        { opacity: 0.35 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.manifesto', start: 'top 78%', end: 'bottom 45%', scrub: true },
        },
      );
      gsap.from('.manifesto .pill-img', {
        scale: 0.4,
        rotate: -12,
        stagger: 0.12,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: '.manifesto', start: 'top 75%', end: 'center 50%', scrub: 1 },
      });
      gsap.fromTo('.about-portrait img', { yPercent: -8, scale: 1.12 }, { yPercent: 8, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.about-portrait', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from('.about-stat', { y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.9, scrollTrigger: { trigger: '.about-stats', start: 'top 85%' } });
      gsap.from('.how-step', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.how', start: 'top 80%' } });
    }, root);
    return () => ctx.revert();
  }, []);

  const age = world.npt.year - 2003 - (world.npt.month < 4 || (world.npt.month === 4 && world.npt.day < 25) ? 1 : 0);

  return (
    <section id="about" ref={root} className="section about" aria-labelledby="about-title">
      <div className="wrap">
        <p className="manifesto">
          <span className="manifesto-text">
            {rich(t('about.manifesto'), {p1:<Pill photo="janaki"/>,janakpur:<Term id="janakpur">{t('about.janakpur')}</Term>,sita:<Term id="sita">{t('about.sita')}</Term>,p2:<Pill><CurvePill/></Pill>,p3:<Pill photo="window"/>,p4:<Pill photo="research"/>})}
          </span>
        </p>

        <div className="about-grid">
          <figure className="about-portrait">
            <img src={portrait.src} srcSet={portrait.srcsetAttr} sizes="(min-width: 800px) 40vw, 90vw" alt={t("about.portraitAlt")} width={portrait.width} height={portrait.height}/>
            <figcaption>
              <span>{c("AI / aviation / a little curiosity")}</span>
              <span className="t-mono">Shuvam Singh</span>
            </figcaption>
          </figure>

          <div className="about-copy">
            <h2 id="about-title" className="t-title">
              {t('about.hi')} <span className="light">{t('about.hiLight')}</span>
            </h2>
            <p className="t-lede mt-6">
              {rich(t('about.lede'),{llms:<Term id="llm">{t('about.llms')}</Term>,traj:<Term id="4d-trajectory">{t('about.traj')}</Term>,evtol:<Term id="evtol">eVTOL</Term>,erp:<Term id="erp">ERP</Term>})}
            </p>
            <Yap>
              {t('about.yap')}
            </Yap>

            <dl className="about-facts">
              <div>
                <dt>{t('about.born')}</dt>
                <dd>
                  {rich(t('about.bornValue'),{janakpur:<Term id="janakpur">{t('about.janakpur')}</Term>,bs:<span className="font-deva">१२ बैशाख २०६०</span>,age:localDigits(age)})}
                </dd>
              </div>
              <div>
                <dt>{t('about.home')}</dt>
                <dd>{person.home}</dd>
              </div>
              <div>
                <dt>{t('about.speaks')}</dt>
                <dd>
                  {rich(t('about.speaksValue'),{maithili:<Term id="maithili">{t('about.maithili')}</Term>})}
                </dd>
              </div>
              <div>
                <dt>{t('about.now')}</dt>
                <dd>{person.current}</dd>
              </div>
            </dl>

            <a className="btn btn-ghost mt-8" href={profile.cv} target="_blank" rel="noopener noreferrer">
              <DownloadSimpleIcon size={18} weight="bold" /> {t('about.cv')}
            </a>
          </div>
        </div>

        <div className="about-stats" role="list">
          {localizedStats.map((s) => (
            <div key={s.label} className="about-stat" role="listitem">
              <p className="about-stat-value">{s.term ? <Term id={s.term}>{localDigits(s.value)}</Term> : localDigits(s.value)}</p>
              <p className="about-stat-label">{s.label}</p>
              <p className="about-stat-detail">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="how">
          <h3 className="how-title">{t('about.howTitle')}</h3>
          <ol className="how-steps">
            {steps.map((s, i) => (
              <li key={s.verb} className="how-step">
                <span className="how-index" aria-hidden="true">
                  {['क', 'ख', 'ग', 'घ'][i]}
                </span>
                <p className="how-verb">{t(`about.step${i+1}v`)}</p>
                <p className="how-text">{t(`about.step${i+1}t`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
