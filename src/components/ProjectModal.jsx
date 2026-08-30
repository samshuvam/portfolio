import React, { useEffect, useState } from 'react';
import { X, Award, Code2, Play, RotateCcw, WandSparkles, Quote } from 'lucide-react';

export default function ProjectModal({ project, onClose, playSound }) {
  const [step, setStep] = useState(0);
  const [hallucination, setHallucination] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!project) return null;
  const walkthrough = project.caseStudy || { challenge: 'A technical problem made approachable through a structured system design.', steps: ['Define the constraint', 'Model the system', 'Test the edge cases', 'Measure and refine'] };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-3xl glass-panel-glow bg-[#0d0f18] rounded-2xl border border-cyan-500/30 p-6 sm:p-8 text-left shadow-2xl shadow-cyan-950/50 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            playSound?.('click');
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            {project.category}
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
            {project.date}
          </span>
          {project.highlight && (
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {project.highlight}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
          {project.title}
        </h2>
        <p className="text-sm sm:text-base text-cyan-300/90 font-mono mb-6">
          {project.subtitle}
        </p>

        {/* Metrics Grid */}
        {project.metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {project.metrics.map((metric, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-xs font-mono text-slate-400">{metric.label}</span>
                <span className="text-lg font-bold font-display text-white mt-0.5">{metric.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Detailed Breakdown */}
        <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-light">
          {(hallucination ? [`Absolutely not the real abstract: this system trained a fleet of philosophical pigeons to optimise aviation routes with quantum spaghetti. Restore reality to see the actual project.`] : project.description.split('\n\n')).map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="rounded-2xl p-5 bg-cyan-500/5 border border-cyan-500/20 mb-6">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-white flex items-center gap-2"><Play className="w-4 h-4 text-cyan-300" /> Playable architecture walkthrough</h3><button onClick={() => setStep(0)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset</button></div>
          <p className="text-sm text-slate-300 mt-3"><strong className="text-cyan-200">The constraint:</strong> {walkthrough.challenge}</p>
          <div className="flex flex-wrap gap-2 mt-4">{walkthrough.steps.map((item, i) => <button key={item} onClick={() => { setStep(i); playSound?.('click'); }} className={`px-3 py-2 rounded-lg text-xs border transition-all ${step === i ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-400'}`}>{i + 1}. {item}</button>)}</div>
          <div className="mt-4 rounded-xl bg-slate-950/70 p-4 text-sm text-cyan-100 border border-slate-800"><span className="text-xs font-mono text-slate-500">ACTIVE STAGE {step + 1}/{walkthrough.steps.length}</span><p className="mt-1">{walkthrough.steps[step]}</p></div>
        </div>

        <div className="flex flex-wrap gap-3 items-center mb-6"><button onClick={() => setHallucination(!hallucination)} className="text-xs px-3 py-2 rounded-lg border border-purple-500/30 text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 flex gap-1.5"><WandSparkles className="w-3.5 h-3.5" /> {hallucination ? 'Restore the real abstract' : 'Let LLM hallucinate'}</button><span className="text-xs text-slate-500">A deliberately silly portfolio easter egg.</span></div>

        {/* Tech Stack Tags */}
        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-cyan-400" />
            Technologies & Frameworks
          </h4>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-slate-900/60 border border-slate-800 p-4 text-sm"><Quote className="w-4 h-4 text-cyan-300 mb-2" /><p className="text-slate-200">“A draft testimonial for this kind of work will live here once approved.”</p><p className="text-xs text-slate-500 mt-2">Placeholder — replace with an attributed quote before publication.</p></div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-mono text-slate-400">
            Author: <strong className="text-slate-200">Shuvam Singh</strong>
          </span>
          <button
            onClick={() => {
              playSound?.('click');
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
