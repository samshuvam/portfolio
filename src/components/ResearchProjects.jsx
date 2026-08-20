import React, { useState } from 'react';
import { Cpu, ArrowUpRight, Sparkles, Layers, Award, Terminal, Filter, Zap, BookOpen } from 'lucide-react';
import { researchProjects } from '../data/portfolioData';

export default function ResearchProjects({ onSelectProject, playSound }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'AI & LLM Systems', 'Aerospace & Autonomous', 'Novel Architecture', 'Systems & ERP'];

  const filteredProjects = activeCategory === 'All'
    ? researchProjects
    : researchProjects.filter((p) => p.category === activeCategory);

  return (
    <section id="research" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-3">
            <Cpu className="w-3.5 h-3.5" />
            RESEARCH & SYSTEMS LAB
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white tracking-tight">
            Pioneering AI Architectures & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Aerospace Intelligence
            </span>
          </h2>
        </div>
        <p className="text-slate-400 text-sm sm:text-base max-w-md font-light">
          From deterministic token-budget RAG and Bio-Memory continual learning to 4D autonomous airspace routing for eVTOLs.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-10 pb-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              playSound?.('click');
              setActiveCategory(cat);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => {
              playSound?.('click');
              onSelectProject(project);
            }}
            className={`glass-card rounded-2xl p-6 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
              project.featured ? 'border-cyan-500/30' : 'border-slate-800/80'
            }`}
          >
            {/* Top Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              {/* Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {project.category}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {project.date}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-lg sm:text-xl font-display font-bold text-white group-hover:text-cyan-300 transition-colors mb-1.5 flex items-start justify-between gap-2">
                <span>{project.title}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 mt-1" />
              </h3>
              <p className="text-xs font-mono text-purple-300/90 mb-3">
                {project.subtitle}
              </p>

              {/* Highlight Badge */}
              {project.highlight && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
                  <Award className="w-3 h-3 text-cyan-400" />
                  <span>{project.highlight}</span>
                </div>
              )}

              {/* Summary */}
              <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed mb-5 line-clamp-3">
                {project.summary}
              </p>
            </div>

            <div>
              {/* Metrics Pills if available */}
              {project.metrics && (
                <div className="grid grid-cols-3 gap-2 mb-4 pt-3 border-t border-slate-800/60 text-center">
                  {project.metrics.slice(0, 3).map((m, idx) => (
                    <div key={idx} className="bg-slate-900/60 rounded-lg p-1.5">
                      <div className="text-[10px] text-slate-400 font-mono">{m.label}</div>
                      <div className="text-xs font-bold text-cyan-300 font-display">{m.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tech Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {project.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                  >
                    {tag}
                  </span>
                ))}
                {project.tags.length > 4 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-500">
                    +{project.tags.length - 4}
                  </span>
                )}
              </div>

              {/* Action Button */}
              <button
                className="w-full py-2 px-3 text-xs font-mono rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Inspect Technical Architecture</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
