import React from 'react';
import { Cpu, Code2, Database, Layers, Terminal, Sparkles, Server, Compass, BrainCircuit } from 'lucide-react';
import { technicalSkills } from '../data/portfolioData';

export default function SkillsMatrix({ playSound }) {
  return (
    <section id="skills" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-3">
          <BrainCircuit className="w-3.5 h-3.5" />
          SYSTEMS & ARCHITECTURE ARSENAL
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Technical Arsenal & <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Core Competencies</span>
        </h2>
        <p className="text-slate-400 text-sm sm:text-base font-light">
          A high-performance stack spanning low-level algorithms, Big Data pipelines, and state-of-the-art LLM fine-tuning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Languages & Core */}
        <div className="glass-card rounded-2xl p-6 border-slate-800">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <Code2 className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-display font-bold text-white">Languages & Core</h3>
          </div>

          <div className="space-y-4">
            {technicalSkills.languages.map((lang) => (
              <div key={lang.name}>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-200 font-medium">{lang.name}</span>
                  <span className="text-cyan-400">{lang.level}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${lang.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI & LLM Systems */}
        <div className="glass-card rounded-2xl p-6 border-slate-800">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-display font-bold text-white">AI & LLM Architecture</h3>
          </div>

          <div className="space-y-4">
            {technicalSkills.aiAndSystems.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-200 font-medium">{item.name}</span>
                  <span className="text-purple-400">{item.level}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${item.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Systems & Cloud */}
        <div className="glass-card rounded-2xl p-6 border-slate-800">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-display font-bold text-white">Systems & Infrastructure</h3>
          </div>

          <div className="space-y-4">
            {technicalSkills.infrastructure.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-200 font-medium">{item.name}</span>
                  <span className="text-blue-400">{item.level}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{ width: `${item.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deep Research Domains Badge Grid */}
      <div className="mt-10 p-6 rounded-2xl glass-panel-glow bg-[#0d0f18] border border-cyan-500/30">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-mono uppercase tracking-wider text-cyan-300 font-semibold">
            Core Specialized Research Domains
          </h4>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {technicalSkills.researchDomains.map((domain) => (
            <span
              key={domain}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-slate-200 hover:border-cyan-400 hover:text-cyan-300 transition-all cursor-default"
            >
              ✦ {domain}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
