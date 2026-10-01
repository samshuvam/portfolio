import { useState } from 'react';
import { Term } from '../ui/Term';

// An illustration of why segmented generation beats one big prompt on a
// small model. Evidence chunks arrive in retrieval order; the naive pipeline
// stuffs one window until it overflows, the segmented one gives each section
// of the template its own window. The +203% is the measured result.

const SECTIONS = [
  { name: 'Background', need: [520, 380, 300] },
  { name: 'Method', need: [640, 420] },
  { name: 'Results', need: [560, 480, 360] },
  { name: 'Limits', need: [300, 260] },
];
const ALL = SECTIONS.flatMap((s, si) => s.need.map((n, ci) => ({ n, si, ci })));

export default function TokenLab() {
  const [budget, setBudget] = useState(2048);
  const total = ALL.reduce((a, c) => a + c.n, 0);

  // Naive: one window, chunks in retrieval order (interleaved), cut at budget.
  const order = [...ALL].sort((a, b) => a.ci - b.ci || a.si - b.si);
  let used = 0;
  const naive = order.map((c) => {
    const fits = used + c.n <= budget;
    if (fits) used += c.n;
    return { ...c, fits };
  });
  const naiveCovered = naive.filter((c) => c.fits).reduce((a, c) => a + c.n, 0) / total;

  // Segmented: each section gets the full budget for its own chunks.
  const seg = SECTIONS.map((s) => {
    let u = 0;
    return s.need.map((n) => {
      const fits = u + n <= budget;
      if (fits) u += n;
      return { n, fits };
    });
  });
  const segCovered = seg.flat().filter((c) => c.fits).reduce((a, c) => a + c.n, 0) / total;

  return (
    <div className="lab-demo">
      <div className="lab-controls">
        <label className="lab-slider">
          <span>
            Model <Term id="context-window">context window</Term> <b>{budget.toLocaleString()} tokens</b>
          </span>
          <input type="range" min="512" max="4096" step="128" value={budget} onChange={(e) => setBudget(+e.target.value)} />
        </label>
      </div>

      <div className="token-grid">
        <div className="token-col">
          <p className="token-head">
            One big prompt <span>{Math.round(naiveCovered * 100)}% of evidence used</span>
          </p>
          <div className="token-window" style={{ '--fill': Math.min(1, used / budget) }}>
            {naive.map((c, i) => (
              <span key={i} className={`token-chunk s${c.si} ${c.fits ? '' : 'is-cut'}`} style={{ flexGrow: c.n }} title={`${SECTIONS[c.si].name}: ${c.n} tokens`} />
            ))}
          </div>
          <p className="token-caption">Chunks arrive in retrieval order. Past the budget they are simply cut, so whole sections lose their evidence.</p>
        </div>

        <div className="token-col">
          <p className="token-head">
            Segmented generation <span>{Math.round(segCovered * 100)}% of evidence used</span>
          </p>
          {SECTIONS.map((s, si) => (
            <div key={s.name} className="token-seg">
              <span className="token-seg-name">{s.name}</span>
              <div className="token-window small">
                {seg[si].map((c, i) => (
                  <span key={i} className={`token-chunk s${si} ${c.fits ? '' : 'is-cut'}`} style={{ flexGrow: c.n }} />
                ))}
              </div>
            </div>
          ))}
          <p className="token-caption">The template plans the document first. Each section gets a full window of its own evidence, and citations are checked before anything is written.</p>
        </div>
      </div>
      <p className="lab-note">
        A toy model of the idea. The real pipeline, measured on a 500-query benchmark, scored <b>+203%</b> over a naive <Term id="rag">RAG</Term> baseline.
      </p>
    </div>
  );
}
