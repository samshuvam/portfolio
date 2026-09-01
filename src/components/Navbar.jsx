import React, { useState, useEffect } from 'react';
import { Terminal, Volume2, VolumeX, Menu, X, FileText, Cpu, BrainCircuit, Palette, RotateCcw, Check } from 'lucide-react';
import { personalInfo } from '../data/portfolioData';

const palettes = [
  { id: 'aqua', name: 'Aqua', colors: ['#22d3ee', '#2563eb', '#a855f7'] },
  { id: 'violet', name: 'Violet', colors: ['#c084fc', '#8b5cf6', '#ec4899'] },
  { id: 'ember', name: 'Ember', colors: ['#fb7185', '#f97316', '#facc15'] },
  { id: 'forest', name: 'Forest', colors: ['#34d399', '#14b8a6', '#84cc16'] },
  { id: 'sunset', name: 'Sunset', colors: ['#f59e0b', '#ef4444', '#db2777'] },
  { id: 'ocean', name: 'Ocean', colors: ['#38bdf8', '#0ea5e9', '#2dd4bf'] },
  { id: 'rose', name: 'Rose', colors: ['#fb7185', '#f43f5e', '#a855f7'] },
  { id: 'lime', name: 'Lime', colors: ['#a3e635', '#22c55e', '#06b6d4'] },
  { id: 'gold', name: 'Gold', colors: ['#facc15', '#f59e0b', '#fb7185'] },
  { id: 'mono', name: 'Monochrome', colors: ['#e2e8f0', '#94a3b8', '#64748b'] },
];

const surfaces = [
  { id: 'void', name: 'Void' }, { id: 'aurora', name: 'Aurora' }, { id: 'graphite', name: 'Graphite' },
];

export default function Navbar({ onOpenTerminal, soundEnabled, setSoundEnabled, playSound, palette, setPalette, surface, setSurface, noise, setNoise }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeStudioOpen, setThemeStudioOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Watch', href: '#watch' },
    { name: 'Photography', href: '#photography' },
    { name: 'Research & AI', href: '#research' },
    { name: 'Live Demos', href: '#demos' },
    { name: 'Experience', href: '#experience' },
    { name: 'Publications', href: '#publications' },
    { name: 'Now', href: '#now' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    playSound?.('click');
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#090a0f]/85 backdrop-blur-xl border-b border-cyan-500/20 py-3 shadow-lg shadow-black/40'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero')}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 p-[1px] flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-all">
            <div className="w-full h-full bg-[#090a0f] rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold tracking-wider text-base sm:text-lg bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                SHUVAM SINGH
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse">
                SYS:ACTIVE
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 tracking-tight">
              {personalInfo.domain}
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-3 py-1.5 text-xs xl:text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-all"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3">
          {/* Audio Toggle */}
          <button
            onClick={() => {
              const newState = !soundEnabled;
              setSoundEnabled(newState);
              if (newState) playSound?.('synth');
            }}
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Futuristic Audio FX'}
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className="relative"><button onClick={() => setThemeStudioOpen(!themeStudioOpen)} title="Open theme studio" className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"><Palette className="w-4 h-4" /></button>{themeStudioOpen && <div className="theme-studio absolute right-0 top-11 w-80 rounded-2xl border border-slate-700 bg-[#0d0f18]/95 p-4 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between mb-3"><span className="text-xs font-mono text-slate-300">COLOR SPECTRUM</span><button onClick={() => { setPalette('aqua'); setSurface('void'); }} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"><RotateCcw className="w-3.5 h-3.5" /> Reset</button></div><div className="grid grid-cols-5 gap-2">{palettes.map((item) => <button key={item.id} onClick={() => setPalette(item.id)} title={item.name} className={`theme-swatch ${palette === item.id ? 'is-selected' : ''}`} style={{ background: `linear-gradient(135deg, ${item.colors.join(', ')})` }}>{palette === item.id && <Check className="w-3.5 h-3.5 text-white" />}</button>)}</div><div className="mt-4 pt-3 border-t border-slate-800"><span className="text-[11px] font-mono text-slate-400">BACKGROUND</span><div className="grid grid-cols-3 gap-2 mt-2">{surfaces.map((item) => <button key={item.id} onClick={() => setSurface(item.id)} className={`theme-surface theme-surface-${item.id} ${surface === item.id ? 'is-selected' : ''}`}>{item.name}</button>)}</div></div></div>}</div>
          <button onClick={() => setNoise(!noise)} title={noise ? 'Restore Synapses' : 'Inject Noise'} className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-purple-300 hover:border-purple-500/40 transition-all"><BrainCircuit className="w-4 h-4" /></button>

          {/* Terminal Trigger */}
          <button
            onClick={() => {
              playSound?.('terminal');
              onOpenTerminal();
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-lg text-slate-300 hover:text-cyan-300 transition-all shadow-inner"
            title="Open Interactive Terminal (Ctrl + K)"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">CLI</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400">
              ^K
            </kbd>
          </button>

          {/* Download / View CV */}
          <a
            href="/CV.pdf"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSound?.('click')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CV / Resume</span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => {
              playSound?.('terminal');
              onOpenTerminal();
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400"
          >
            <Terminal className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 px-4 pt-2 pb-6 bg-[#090a0f]/95 backdrop-blur-2xl border-b border-slate-800 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block px-3 py-2 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <a
              href="/CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950"
            >
              <FileText className="w-4 h-4" />
              <span>Download CV (PDF)</span>
            </a>
            <button
              onClick={() => {
                const s = !soundEnabled;
                setSoundEnabled(s);
                if (s) playSound?.('synth');
              }}
              className="p-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-300"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
