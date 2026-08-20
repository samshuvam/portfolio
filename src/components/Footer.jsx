import React, { useState, useEffect } from 'react';
import { ShieldCheck, Globe, ArrowUp, Cpu, Heart, Terminal } from 'lucide-react';
import { personalInfo } from '../data/portfolioData';

export default function Footer({ onOpenTerminal, playSound }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const nptTime = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kathmandu',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setTimeStr(`${nptTime} NPT (UTC+5:45)`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    playSound?.('click');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-slate-800/80 bg-[#07080d] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono text-slate-400">
        {/* Left Info */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200 font-semibold">{personalInfo.name}</span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-slate-400">
            Target Host: <strong className="text-cyan-300">https://{personalInfo.domain}</strong>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-purple-300">{timeStr}</span>
        </div>

        {/* Center / Right actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              playSound?.('terminal');
              onOpenTerminal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Terminal (`^K`)</span>
          </button>

          <button
            onClick={scrollToTop}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-400 hover:text-white transition-all"
            title="Scroll to Top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
        <div>
          © {new Date().getFullYear()} Shuvam Singh. All rights reserved. Cloudflare NS: <code className="text-slate-400">sima & vick.ns.cloudflare.com</code>
        </div>
        <div className="flex items-center gap-1">
          <span>Engineered with React, Vite & Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
}
