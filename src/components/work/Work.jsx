import { useEffect, useRef, useState } from 'react';
import { ArrowRightIcon, ArrowUpRightIcon, PlayIcon } from '@phosphor-icons/react';
import ProjectVisual from './ProjectVisual';
import { Term } from '../ui/Term';
import Yap from '../ui/Yap';
import { featuredProjects, archiveProjects } from '../../data/projects';
import { setState } from '../../lib/store';
import { gsap, ScrollTrigger, reducedMotion, scrollToTarget } from '../../lib/motion';
import { sound } from '../../lib/sound';
import { useT, useLocalize, localDigits, useLang } from '../../i18n';
import dict from '../../i18n/ui/work';
import overlay from '../../i18n/content/projects';
import './work.css';

const TONES = ['tone-a', 'tone-b', 'tone-c'];

function open(id) {
  sound.click();
  setState({ project: id });
}

function FeaturedCard({ p, i, total, t, lang }) {
  return (
    <article className={`stack-card ${TONES[i % 3]}`} style={{ '--i': i }} aria-labelledby={`p-${p.id}`}>
      <div className="stack-inner">
        <div className="stack-copy">
          <p className="stack-meta">
            <span className="stack-no">{t('flightNo', { n: localDigits(String(i + 1).padStart(2, '0'), lang), total: localDigits(String(total).padStart(2, '0'), lang) })}</span>
            <span>{p.category}</span>
            <span>{localDigits(p.date, lang)}</span>
            <span className="stack-status">{p.status}</span>
          </p>
          <h3 id={`p-${p.id}`} className="stack-title">
            {p.title}
          </h3>
          <p className="stack-sub">{p.subtitle}</p>
          <p className="stack-highlight">{localDigits(p.highlight, lang)}</p>
          <p className="stack-summary">{p.summary}</p>
          <dl className="stack-metrics">
            {p.metrics.map((m) => (
              <div key={m.label}>
                <dt>{m.label}</dt>
                <dd>{localDigits(m.value, lang)}</dd>
              </div>
            ))}
          </dl>
          <p className="stack-terms">
            <span>{t('jargon')}</span>
            {p.terms.slice(0, 4).map((term) => (
              <Term key={term} id={term} />
            ))}
          </p>
          <div className="stack-actions">
            <button type="button" className="btn btn-accent" onClick={() => open(p.id)} aria-label={t('readCaseAria', { title: p.title })}>
              {t('readCase')} <ArrowRightIcon size={17} weight="bold" aria-hidden="true" />
            </button>
            {p.video && (
              <button type="button" className="btn btn-ghost" onClick={() => scrollToTarget('#watch')}>
                <PlayIcon size={16} weight="fill" aria-hidden="true" /> {t('watch')}
              </button>
            )}
          </div>
        </div>
        <div className="stack-visual">
          <ProjectVisual kind={p.visual} />
        </div>
      </div>
    </article>
  );
}

function Archive({ t, lang, loc }) {
  const preview = useRef(null);
  const [hover, setHover] = useState(null);
  const pos = useRef(null);

  useEffect(() => {
    const el = preview.current;
    if (!el) return undefined;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    pos.current = { xTo, yTo };
    return () => {
      pos.current = null;
      gsap.killTweensOf(el);
    };
  }, []);

  const move = (e) => {
    if (!pos.current) return;
    const w = 320;
    const x = Math.min(window.innerWidth - w - 16, e.clientX + 28);
    const y = Math.min(window.innerHeight - 300, Math.max(80, e.clientY - 140));
    pos.current.xTo(x);
    pos.current.yTo(y);
  };

  const raw = archiveProjects.find((a) => a.id === hover);
  const p = raw ? loc(raw) : null;

  return (
    <div className="archive" onPointerMove={move} onPointerLeave={() => setHover(null)}>
      <h3 className="archive-title">
        {t('archiveA')} <span className="light">{t('archiveB')}</span>
      </h3>
      <ul className="archive-list">
        {archiveProjects.map((orig) => {
          const a = loc(orig);
          return (
          <li key={a.id}>
            <button
              type="button"
              className="archive-row"
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') setHover(a.id);
              }}
              onFocus={() => setHover(null)}
              onClick={() => open(a.id)}
            >
              <span className="archive-year">{localDigits(a.year, lang)}</span>
              <span className="archive-main">
                <span className="archive-name">{a.title}</span>
                <span className="archive-hl-sm">{localDigits(a.highlight, lang)}</span>
              </span>
              <span className="archive-cat">{a.category}</span>
              <span className="archive-hl">{localDigits(a.highlight, lang)}</span>
              <ArrowUpRightIcon className="archive-arrow" size={20} weight="bold" aria-hidden="true" />
            </button>
          </li>
          );
        })}
      </ul>
      <p className="archive-joke">{t('archiveJoke')}</p>
      <div ref={preview} className={`archive-preview ${p ? 'is-on' : ''}`} aria-hidden="true">
        {p && (
          <>
            <div className="archive-preview-art">
              <ProjectVisual kind={p.visual} />
            </div>
            <p className="archive-preview-text">{p.summary}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function Work() {
  const root = useRef(null);
  const t = useT(dict);
  const lang = useLang();
  const loc = useLocalize(overlay);

  useEffect(() => {
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      // The stack only pins on wide screens; phones get a plain list.
      mm.add('(min-width: 1024px)', () => {
        const cards = gsap.utils.toArray('.stack-card');
        cards.forEach((card, i) => {
          if (i === cards.length - 1) return;
          gsap.to(card.querySelector('.stack-inner'), {
            scale: 0.92,
            opacity: 0.45,
            filter: 'blur(1.5px)',
            ease: 'none',
            scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 12%', scrub: true },
          });
        });
      });
      gsap.from('.work-head > *', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.work-head', start: 'top 80%' } });
      gsap.from('.archive-row', { y: 24, autoAlpha: 0, stagger: 0.06, duration: 0.7, scrollTrigger: { trigger: '.archive', start: 'top 80%' } });
    }, root);
    const refresh = setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => {
      clearTimeout(refresh);
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section id="work" ref={root} className="section work" aria-labelledby="work-title">
      <div className="wrap">
        <header className="work-head sec-head">
          <h2 id="work-title" className="t-display">
            {t('titleA')} <span className="light">{t('titleB')}</span>
          </h2>
          <p className="t-lede">{t('lede')}</p>
          <Yap>{localDigits(t('yap'), lang)}</Yap>
        </header>

        <div className="stack">
          {featuredProjects.map((p, i) => (
            <FeaturedCard key={p.id} p={loc(p)} i={i} total={featuredProjects.length} t={t} lang={lang} />
          ))}
        </div>

        <Archive t={t} lang={lang} loc={loc} />
      </div>
    </section>
  );
}
