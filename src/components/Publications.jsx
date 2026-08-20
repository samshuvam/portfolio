import React, { useState } from 'react';
import { BookOpen, Award, Copy, Check, FileCode, Sparkles, ExternalLink } from 'lucide-react';
import { publications } from '../data/portfolioData';

export default function Publications({ playSound }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopyBibtex = (pub, idx) => {
    playSound?.('click');
    const bibtex = `@inproceedings{singh${pub.year}${pub.tags[0].toLowerCase()},
  author    = {Shuvam Singh},
  title     = {${pub.title}},
  booktitle = {${pub.conference}},
  year      = {${pub.year}},
  address   = {Nepal / India}
}`;
    navigator.clipboard.writeText(bibtex);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <section id="publications" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-3">
          <Award className="w-3.5 h-3.5" />
          PEER-REVIEWED SCHOLARSHIP
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Conference Publications & <span className="bg-gradient-to-r from-amber-400 to-cyan-400 bg-clip-text text-transparent">Accepted Papers</span>
        </h2>
        <p className="text-slate-400 text-sm sm:text-base font-light">
          Formal academic contributions accepted at premier IEEE and Aerospace engineering venues.
        </p>
      </div>

      <div className="space-y-6 max-w-5xl mx-auto">
        {publications.map((pub, idx) => (
          <div
            key={idx}
            className="glass-card rounded-2xl p-6 sm:p-8 border border-amber-500/20 hover:border-amber-400/40 relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {pub.type}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Year: {pub.year}
                </span>
              </div>

              <button
                onClick={() => handleCopyBibtex(pub, idx)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all"
                title="Copy BibTeX Citation"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">BibTeX Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy BibTeX</span>
                  </>
                )}
              </button>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
              {pub.title}
            </h3>
            <p className="text-sm font-mono text-cyan-400 mb-4">
              {pub.conference}
            </p>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-5">
              <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                Abstract
              </h5>
              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                {pub.abstract}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-1.5">
                {pub.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-xs font-mono text-slate-400">
                Author: <strong className="text-slate-200">{pub.authors}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
