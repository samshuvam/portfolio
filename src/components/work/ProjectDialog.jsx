import { useCallback } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react';
import Dialog from '../ui/Dialog';
import ProjectVisual from './ProjectVisual';
import { Term } from '../ui/Term';
import { projects, projectById } from '../../data/projects';
import { setState, useStore } from '../../lib/store';
import './project-dialog.css';

export default function ProjectDialog() {
  const id = useStore((s) => s.project);
  const p = id ? projectById(id) : null;
  const close = useCallback(() => setState({ project: null }), []);
  const idx = p ? projects.indexOf(p) : -1;
  const prev = idx > 0 ? projects[idx - 1] : projects[projects.length - 1];
  const next = idx >= 0 ? projects[(idx + 1) % projects.length] : null;

  return (
    <Dialog open={!!p} onClose={close} label={p ? `${p.title}, case study` : 'Case study'}>
      {p && (
        <article className="pd" key={p.id}>
          <header className="pd-head">
            <p className="pd-meta">
              <span>{p.category}</span>
              <span>{p.date}</span>
              <span className="pd-status">{p.status}</span>
            </p>
            <h2 className="pd-title">{p.title}</h2>
            <p className="pd-sub">{p.subtitle}</p>
            <p className="pd-hl">{p.highlight}</p>
          </header>

          <div className="pd-visual">
            <ProjectVisual kind={p.visual} />
          </div>

          <div className="pd-body">
            <div className="pd-main">
              <p className="pd-intro">{p.intro}</p>
              <ul className="pd-points">
                {p.points.map((pt) => (
                  <li key={pt.title}>
                    <h3>{pt.title}</h3>
                    <p>{pt.text}</p>
                  </li>
                ))}
              </ul>
              <section className="pd-case" aria-label="The problem and the approach">
                <p className="pd-case-q">{p.caseStudy.challenge}</p>
                <ol className="pd-flow">
                  {p.caseStudy.steps.map((s, i) => (
                    <li key={s}>
                      <span aria-hidden="true">{['क', 'ख', 'ग', 'घ', 'ङ'][i]}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
            <aside className="pd-side">
              <dl className="pd-metrics">
                {p.metrics.map((m) => (
                  <div key={m.label}>
                    <dt>{m.label}</dt>
                    <dd>{m.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="pd-block">
                <p className="t-label">Built with</p>
                <ul className="pd-tags">
                  {p.tags.map((t) => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              {p.terms?.length > 0 && (
                <div className="pd-block">
                  <p className="t-label">Jargon, explained</p>
                  <p className="pd-terms">
                    {p.terms.map((t) => (
                      <Term key={t} id={t} />
                    ))}
                  </p>
                </div>
              )}
            </aside>
          </div>

          <footer className="pd-nav">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setState({ project: prev.id })}>
              <ArrowLeftIcon size={16} weight="bold" /> {prev.short}
            </button>
            {next && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setState({ project: next.id })}>
                {next.short} <ArrowRightIcon size={16} weight="bold" />
              </button>
            )}
          </footer>
        </article>
      )}
    </Dialog>
  );
}
