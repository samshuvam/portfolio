import { useCallback, useEffect, useRef } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react';
import Dialog from '../ui/Dialog';
import ProjectVisual from './ProjectVisual';
import { Term } from '../ui/Term';
import { projects, projectById } from '../../data/projects';
import { setState, useStore } from '../../lib/store';
import { sound } from '../../lib/sound';
import { useT, useLocalize, useLang, localDigits } from '../../i18n';
import dict from '../../i18n/ui/work';
import overlay from '../../i18n/content/projects';
import './project-dialog.css';

const STEP_MARKS = ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज'];

export default function ProjectDialog() {
  const id = useStore((s) => s.project);
  const t = useT(dict);
  const lang = useLang();
  const loc = useLocalize(overlay);
  const raw = id ? projectById(id) : null;
  const close = useCallback(() => setState({ project: null }), []);
  const idx = raw ? projects.indexOf(raw) : -1;
  const prev = idx >= 0 ? loc(projects[(idx - 1 + projects.length) % projects.length]) : null;
  const next = idx >= 0 ? loc(projects[(idx + 1) % projects.length]) : null;
  const p = raw ? loc(raw) : null;
  const title = useRef(null);
  const switched = useRef(false);
  const go = (target) => {
    sound.click();
    switched.current = true;
    setState({ project: target });
  };

  // Moving between projects inside the open sheet: start the new one at the
  // top and put focus on its title (the old nav button no longer exists).
  useEffect(() => {
    if (!switched.current || !title.current) return;
    switched.current = false;
    const panel = title.current.closest('.dialog-panel');
    if (panel) panel.scrollTop = 0;
    title.current.focus({ preventScroll: true });
  }, [id]);

  return (
    <Dialog open={!!p} onClose={close} label={p ? t('dialogLabel', { title: p.title }) : t('dialogFallback')} className="pd-panel">
      {p && (
        <article className="pd" key={p.id}>
          <header className="pd-head">
            <p className="pd-meta">
              <span>{p.category}</span>
              <span>{localDigits(p.date, lang)}</span>
              <span className="pd-status">{p.status}</span>
            </p>
            <h2 className="pd-title" ref={title} tabIndex={-1}>{p.title}</h2>
            <p className="pd-sub">{p.subtitle}</p>
            <p className="pd-hl">{localDigits(p.highlight, lang)}</p>
          </header>

          <div className="pd-visual">
            <ProjectVisual kind={p.visual} />
          </div>

          <div className="pd-body">
            <div className="pd-main">
              <p className="pd-intro">{p.intro}</p>
              <ul className="pd-points">
                {p.points.map((pt, i) => (
                  <li key={i}>
                    <h3>{pt.title}</h3>
                    <p>{pt.text}</p>
                  </li>
                ))}
              </ul>
              <section className="pd-case" aria-label={t('caseAria')}>
                <p className="pd-case-q">{p.caseStudy.challenge}</p>
                <ol className="pd-flow">
                  {p.caseStudy.steps.map((s, i) => (
                    <li key={i}>
                      <span aria-hidden="true">{STEP_MARKS[i] ?? localDigits(i + 1, lang)}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
            <aside className="pd-side">
              <dl className="pd-metrics">
                {p.metrics.map((m, i) => (
                  <div key={i}>
                    <dt>{m.label}</dt>
                    <dd>{localDigits(m.value, lang)}</dd>
                  </div>
                ))}
              </dl>
              <div className="pd-block">
                <p className="t-label">{t('builtWith')}</p>
                <ul className="pd-tags">
                  {p.tags.map((tag) => (
                    <li key={tag} className="chip">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
              {p.terms?.length > 0 && (
                <div className="pd-block">
                  <p className="t-label">{t('jargonExplained')}</p>
                  <p className="pd-terms">
                    {p.terms.map((term) => (
                      <Term key={term} id={term} />
                    ))}
                  </p>
                </div>
              )}
            </aside>
          </div>

          <footer className="pd-nav">
            <p className="pd-joke">{t('navJoke')}</p>
            <div className="pd-nav-row">
              {prev && (
                <button type="button" className="btn btn-ghost btn-sm pd-nav-btn" onClick={() => go(prev.id)} aria-label={t('prevAria', { title: prev.short })}>
                  <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
                  <span className="pd-nav-label">{prev.short}</span>
                </button>
              )}
              <span className="pd-count t-mono" aria-hidden="true">
                {t('counter', { n: localDigits(idx + 1, lang), total: localDigits(projects.length, lang) })}
              </span>
              {next && (
                <button type="button" className="btn btn-ghost btn-sm pd-nav-btn pd-nav-next" onClick={() => go(next.id)} aria-label={t('nextAria', { title: next.short })}>
                  <span className="pd-nav-label">{next.short}</span>
                  <ArrowRightIcon size={16} weight="bold" aria-hidden="true" />
                </button>
              )}
            </div>
          </footer>
        </article>
      )}
    </Dialog>
  );
}
