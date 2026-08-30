import React from 'react';
import { Terminal, ArrowRight, Cpu, Orbit } from 'lucide-react';
import { personalInfo, heroStats } from '../data/portfolioData';

export default function Hero({ onOpenTerminal, onOpenBioModal, playSound }) {
  return (
    <section id="hero" className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background glow flares */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-purple-600/10 to-blue-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto w-full text-center flex flex-col items-center">
        {/* Status Chip */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-slate-300 text-xs sm:text-sm font-mono mb-8 shadow-lg shadow-cyan-500/10 hover:border-cyan-400/60 transition-all cursor-default">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-cyan-400 font-semibold">AI SYSTEMS & BIG DATA ARCHITECT</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 hidden sm:inline">2x International Research Papers (IEEE & ICAAsT)</span>
          <span className="text-slate-300 sm:hidden">IEEE & ICAAsT</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-white max-w-5xl leading-[1.15] mb-6">
          AI, Aviation and <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,245,212,0.3)]">Everything</span> in Between
        </h1>

        <p className="text-cyan-200/90 uppercase tracking-[.18em] text-xs sm:text-sm font-mono mb-5">Exploring intelligence across domains and beyond.</p>

        {/* Subtitle / Bio */}
        <p className="text-slate-300 text-base sm:text-lg md:text-xl max-w-3xl font-light leading-relaxed mb-10 text-center">
          Hey, I'm <strong className="text-white font-semibold">Shuvam Singh</strong>. Computer Science Engineer from SRM University with a specialization in Big Data.
          Specializing in <span className="text-cyan-300 font-medium">Bio-Inspired Continual Learning</span>, <span className="text-purple-300 font-medium">Deterministic Context Orchestration</span>, and <span className="text-blue-300 font-medium">4D Autonomous Air Traffic Control (eVTOL & UAM)</span>.
        </p>
        <p className="max-w-2xl rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-slate-200 mb-8">TL;DR — I build AI systems that remember like humans, protect data by design, and help autonomous vehicles move safely through complex spaces.</p>

        {/* CTA Button Array */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <a
            href="#research"
            onClick={() => playSound?.('click')}
            className="group flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:-translate-y-0.5 transition-all"
          >
            <Cpu className="w-4 h-4 text-slate-950" />
            <span>Explore Research & Projects</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href="#demos"
            onClick={() => playSound?.('click')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 hover:border-purple-500/50 text-slate-200 font-medium text-sm transition-all hover:-translate-y-0.5 shadow-md"
          >
            <Orbit className="w-4 h-4 text-purple-400" />
            <span>Live Interactive Simulators</span>
          </a>

          <button
            onClick={() => {
              playSound?.('terminal');
              onOpenTerminal();
            }}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 hover:border-cyan-500/50 text-slate-200 font-mono text-sm transition-all hover:-translate-y-0.5 shadow-md"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Launch CLI (`Ctrl+K`)</span>
          </button>
        </div>

        {/* Hero HUD Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-5xl">
          {heroStats.map((stat, idx) => (
            <div
              key={idx}
              className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text mb-1">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                {stat.label}
              </span>
              <span className="text-[11px] font-mono text-slate-400 mt-1">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
