import React, { useState, useEffect, useCallback } from 'react';
import CanvasBackground from './components/CanvasBackground';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ResearchProjects from './components/ResearchProjects';
import InteractiveDemos from './components/InteractiveDemos';
import Experience from './components/Experience';
import Publications from './components/Publications';
import SkillsMatrix from './components/SkillsMatrix';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ProjectModal from './components/ProjectModal';
import TerminalModal from './components/TerminalModal';

export default function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Audio synthesis helper via Web Audio API (Zero external assets required)
  const playSound = useCallback((type = 'click') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'synth') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'terminal') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      }
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }, [soundEnabled]);

  // Global keyboard shortcut for Terminal (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
        playSound('terminal');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playSound]);

  return (
    <div className="relative min-h-screen bg-[#090a0f] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Background Interactive Canvas Particle Field */}
      <CanvasBackground />

      {/* Cyber Grid Overlay */}
      <div className="fixed inset-0 bg-cyber-grid pointer-events-none z-0 opacity-40" />

      {/* Main App Layout */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          onOpenTerminal={() => setTerminalOpen(true)}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          playSound={playSound}
        />

        <main className="flex-1">
          <Hero
            onOpenTerminal={() => setTerminalOpen(true)}
            playSound={playSound}
          />

          <ResearchProjects
            onSelectProject={(project) => setSelectedProject(project)}
            playSound={playSound}
          />

          <InteractiveDemos playSound={playSound} />

          <Experience playSound={playSound} />

          <Publications playSound={playSound} />

          <SkillsMatrix playSound={playSound} />

          <ContactSection playSound={playSound} />
        </main>

        <Footer
          onOpenTerminal={() => setTerminalOpen(true)}
          playSound={playSound}
        />
      </div>

      {/* Modals */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        playSound={playSound}
      />

      <TerminalModal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        playSound={playSound}
      />
    </div>
  );
}
