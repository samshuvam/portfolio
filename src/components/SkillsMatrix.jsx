import React, { useState } from 'react';
import { Cpu, Code2, Server, Compass, BrainCircuit, ChevronDown } from 'lucide-react';
import { technicalSkills } from '../data/portfolioData';

export default function SkillsMatrix({ playSound }) {
  const [open, setOpen] = useState('Languages & Core');
  const groups = [
    { title: 'Languages & Core', icon: Code2, tone: 'cyan', items: technicalSkills.languages },
    { title: 'AI & LLM Architecture', icon: Cpu, tone: 'purple', items: technicalSkills.aiAndSystems },
    { title: 'Systems & Infrastructure', icon: Server, tone: 'blue', items: technicalSkills.infrastructure },
  ];
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

      <div className="max-w-4xl mx-auto space-y-3">{groups.map(({ title, icon: Icon, tone, items }) => <div key={title} className="glass-card rounded-2xl border-slate-800 overflow-hidden"><button onClick={() => setOpen(open === title ? '' : title)} className="w-full p-5 flex items-center justify-between text-left"><span className="flex items-center gap-3"><span className={`p-2 rounded-lg bg-${tone}-500/10 border border-${tone}-500/30`}><Icon className={`w-5 h-5 text-${tone}-400`} /></span><span className="text-lg font-bold text-white">{title}</span></span><ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open === title ? 'rotate-180' : ''}`} /></button>{open === title && <div className="px-5 pb-5 grid sm:grid-cols-2 gap-4">{items.map((item) => <div key={item.name}><div className="flex justify-between text-xs font-mono mb-1.5"><span className="text-slate-200">{item.name}</span><span className="text-cyan-300">{item.level}%</span></div><div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" style={{ width: `${item.level}%` }} /></div></div>)}</div>}</div>)}</div>

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
