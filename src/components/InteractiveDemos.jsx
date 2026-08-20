import React, { useState, useEffect } from 'react';
import { Orbit, Activity, ShieldAlert, Cpu, Sparkles, Sliders, RefreshCw, CheckCircle, Navigation, Radio, Database } from 'lucide-react';

export default function InteractiveDemos({ playSound }) {
  const [activeTab, setActiveTab] = useState('biomemory');

  // Bio-Memory State
  const [elapsedHours, setElapsedHours] = useState(24);
  const [sleepConsolidation, setSleepConsolidation] = useState(true);
  const [retrievalReinforcement, setRetrievalReinforcement] = useState(true);

  // Calculate retention using Ebbinghaus decay with consolidation boost
  const baseDecay = Math.exp(-elapsedHours / 20);
  const boost = (sleepConsolidation ? 0.35 : 0) + (retrievalReinforcement ? 0.25 : 0);
  const retentionRate = Math.min(Math.round((baseDecay + boost) * 100), 98);
  const activeVectors = Math.round((retentionRate / 100) * 1024);
  const prunedVectors = 1024 - activeVectors;

  // 4D ATC Radar State
  const [radarConflict, setRadarConflict] = useState(false);
  const [droneCount, setDroneCount] = useState(6);
  const [radarScanAngle, setRadarScanAngle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRadarScanAngle((prev) => (prev + 4) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // RAG Token Budget State
  const [tokenBudget, setTokenBudget] = useState(1024);
  const naiveFidelity = Math.max(20, Math.round((tokenBudget / 4096) * 60));
  const segmentedFidelity = Math.min(99, Math.round(75 + (tokenBudget / 4096) * 24));

  return (
    <section id="demos" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          INTERACTIVE ARCHITECTURE LAB
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Test My <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Research Algorithms</span> Live
        </h2>
        <p className="text-slate-300 text-sm sm:text-base font-light">
          Interact with real-time simulations of the cognitive memory curves, 4D airspace deconfliction, and deterministic RAG token allocation.
        </p>
      </div>

      {/* Tab Selectors */}
      <div className="flex justify-center gap-3 mb-10">
        <button
          onClick={() => {
            playSound?.('click');
            setActiveTab('biomemory');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'biomemory'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4 text-purple-300" />
          <span>Bio-Memory & Forgetting Curve</span>
        </button>

        <button
          onClick={() => {
            playSound?.('click');
            setActiveTab('radar');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'radar'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>4D Airspace Trajectory Radar</span>
        </button>

        <button
          onClick={() => {
            playSound?.('click');
            setActiveTab('rag');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'rag'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-blue-300" />
          <span>RAG Token Budget Optimizer</span>
        </button>
      </div>

      {/* Demo 1: Bio-Memory */}
      {activeTab === 'biomemory' && (
        <div className="glass-panel-glow bg-[#0d0f18] rounded-3xl p-6 sm:p-8 border border-purple-500/30 max-w-5xl mx-auto shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Controls */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                  <span>Elapsed Time (Decay Window)</span>
                  <span className="text-purple-400 font-bold">{elapsedHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={elapsedHours}
                  onChange={(e) => setElapsedHours(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-purple-500/40 transition-all">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={sleepConsolidation}
                      onChange={(e) => {
                        playSound?.('click');
                        setSleepConsolidation(e.target.checked);
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-200">
                      Sleep-Phase Consolidation
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400">+35% Retention</span>
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-purple-500/40 transition-all">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={retrievalReinforcement}
                      onChange={(e) => {
                        playSound?.('click');
                        setRetrievalReinforcement(e.target.checked);
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-200">
                      Retrieval-Induced Reinforcement
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">+25% Retention</span>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs font-mono text-purple-200 leading-relaxed">
                💡 <strong>Mathematical Formulation:</strong> <span className="text-cyan-300 font-semibold">R(t) = e^(-t / S)</span> where stability <span className="text-purple-300 font-semibold">S</span> increases proportionally with sleep consolidation &amp; synaptic vector reinforcement, preventing catastrophic forgetting in LoRA layers.
              </div>
            </div>

            {/* Visual Output */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#1e2238"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="url(#purpleGradient)"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * retentionRate) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f5d4" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold font-display text-white">{retentionRate}%</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Memory Retention</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full text-left">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-mono text-slate-400">Active Vector Nodes</span>
                  <div className="text-lg font-bold text-cyan-400 font-display">{activeVectors} / 1024</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-mono text-slate-400">Pruned Redundancies</span>
                  <div className="text-lg font-bold text-purple-400 font-display">{prunedVectors} nodes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo 2: 4D ATC Radar */}
      {activeTab === 'radar' && (
        <div className="glass-panel-glow bg-[#0d0f18] rounded-3xl p-6 sm:p-8 border border-cyan-500/30 max-w-5xl mx-auto shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Radar Screen */}
            <div className="w-full lg:w-1/2 flex flex-col items-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-slate-950 border-2 border-cyan-500/40 p-2 flex items-center justify-center overflow-hidden shadow-inner">
                {/* Concentric Rings */}
                <div className="absolute inset-4 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-12 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-20 rounded-full border border-cyan-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-cyan-500/20" />
                  <div className="h-full w-[1px] bg-cyan-500/20 absolute" />
                </div>

                {/* Radar Sweep Line */}
                <div
                  className="absolute inset-0 origin-center pointer-events-none"
                  style={{
                    transform: `rotate(${radarScanAngle}deg)`,
                    background: 'conic-gradient(from 0deg, rgba(0, 245, 212, 0.35) 0deg, transparent 60deg, transparent 360deg)'
                  }}
                />

                {/* Drone Blips */}
                <div className="absolute top-16 left-20 flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[9px] font-mono text-cyan-300">eVTOL-01 [FL120]</span>
                </div>
                <div className="absolute bottom-16 right-16 flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-cyan-300">UAV-09 [FL040]</span>
                </div>
                <div className="absolute top-28 right-20 flex items-center gap-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${radarConflict ? 'bg-amber-400 animate-bounce' : 'bg-cyan-400'}`} />
                  <span className={`text-[9px] font-mono ${radarConflict ? 'text-amber-300 font-bold' : 'text-cyan-300'}`}>
                    {radarConflict ? 'CONFLICT CORRIDOR B' : 'eVTOL-04 [FL080]'}
                  </span>
                </div>
              </div>
            </div>

            {/* ATC Radar Controls */}
            <div className="w-full lg:w-1/2 space-y-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-mono text-slate-300">Conflict Deconfliction Mode</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  AUTONOMOUS ML ACTIVE
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    playSound?.('terminal');
                    setRadarConflict(!radarConflict);
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                    radarConflict
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>{radarConflict ? 'Resolve 4D Trajectory Conflict' : 'Inject Airspace Micro-Weather Conflict'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Resolution Latency</span>
                  <div className="text-base font-bold text-cyan-400 mt-1">&lt; 180 ms</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Separation Distance</span>
                  <div className="text-base font-bold text-emerald-400 mt-1">500m 3D Margin</div>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Accepted at <strong>ICAAsT 2024</strong>: Evaluates dynamic waypoint routing using GeoPandas spatial indexing & XGBoost risk classifiers to maintain real-time urban flight corridors.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demo 3: RAG Token Budget */}
      {activeTab === 'rag' && (
        <div className="glass-panel-glow bg-[#0d0f18] rounded-3xl p-6 sm:p-8 border border-blue-500/30 max-w-5xl mx-auto shadow-2xl">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>LLM Context Window Budget</span>
                <span className="text-blue-400 font-bold">{tokenBudget} Tokens</span>
              </div>
              <input
                type="range"
                min="512"
                max="4096"
                step="256"
                value={tokenBudget}
                onChange={(e) => setTokenBudget(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Naive RAG Card */}
              <div className="p-5 rounded-2xl bg-red-950/10 border border-red-900/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-red-400">Standard Naive RAG</span>
                  <span className="text-xs font-mono text-red-300">{naiveFidelity}% Fidelity</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-3">
                  <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${naiveFidelity}%` }} />
                </div>
                <p className="text-xs text-slate-400 font-light">
                  Suffers from context drift, chunk truncation, and ungrounded hallucinations under token constraints.
                </p>
              </div>

              {/* Shuvam's Segmented RAG Card */}
              <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-cyan-400">Dynamic Segmented RAG</span>
                  <span className="text-xs font-mono text-cyan-300 font-bold">{segmentedFidelity}% Fidelity (+203%)</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-3">
                  <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300" style={{ width: `${segmentedFidelity}%` }} />
                </div>
                <p className="text-xs text-cyan-100/80 font-light">
                  Employs deterministic template planning, iterative window injection, and evidence validation before generation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
