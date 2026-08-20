import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal as TerminalIcon, CornerDownLeft, Sparkles } from 'lucide-react';
import { personalInfo, researchProjects, publications, technicalSkills } from '../data/portfolioData';

export default function TerminalModal({ isOpen, onClose, playSound }) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'system', text: '⚡ SHUVAM SINGH // NEURAL KERNEL v2.6.4 [ONLINE]' },
    { type: 'system', text: 'Domain: shuvamsingh.com.np | Type "help" for active directives.' },
  ]);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const trimmed = input.trim();
      if (!trimmed) return;

      playSound?.('terminal');
      const newHistory = [...history, { type: 'user', text: `$ ${trimmed}` }];
      setCmdHistory((prev) => [trimmed, ...prev]);
      setHistoryIndex(-1);

      const [cmd, ...args] = trimmed.toLowerCase().split(' ');

      switch (cmd) {
        case 'help':
          newHistory.push({
            type: 'response',
            text: `Available Directives:
  whoami       - Display identity, CGPA & academic background
  papers       - List accepted IEEE & ICAAsT research papers
  projects     - List key AI, RAG & Aerospace projects
  skills       - Print technical arsenal & research domains
  experience   - Display industry systems engineering record
  contact      - Display verified contact channels (Email, Phone, WA)
  download-cv  - Trigger instant CV PDF download
  clear        - Flush terminal buffer
  exit         - Terminate terminal session`
          });
          break;

        case 'whoami':
          newHistory.push({
            type: 'response',
            text: `Identity: ${personalInfo.name}
Role: ${personalInfo.title}
Education: SRM University - AP (B.Tech CSE Big Data) | CGPA: ${personalInfo.cgpa}
Location: ${personalInfo.location}
IELTS: ${personalInfo.ielts} (Scientific Writing & Tech Presentation)`
          });
          break;

        case 'papers':
          newHistory.push({
            type: 'response',
            text: publications.map((p, i) => `[${i+1}] ${p.title}\n    Venue: ${p.conference} (${p.year})\n    Status: ${p.type}`).join('\n\n')
          });
          break;

        case 'projects':
          newHistory.push({
            type: 'response',
            text: researchProjects.map((p, i) => `[${i+1}] ${p.title} (${p.date})\n    Category: ${p.category} | ${p.highlight || 'Active'}`).join('\n\n')
          });
          break;

        case 'skills':
          newHistory.push({
            type: 'response',
            text: `Languages: Python, SQL, C/C++, TypeScript, HTML5/CSS3
AI & LLM: RAG Context Orchestration, LoRA/PEFT, ChromaDB, LanceDB, Ollama
Aerospace: 4D Trajectory Conflict Detection, GeoPandas, eVTOL ATC
Systems: Odoo ERP Migration, QR Smart Inventory, AWS Fundamentals`
          });
          break;

        case 'experience':
          newHistory.push({
            type: 'response',
            text: `United Lubricants & SatyaDip International (Lalitpur, Nepal)
Role: Systems Intern & Technical Associate
Period: May–June 2024 | Dec 2025 – Present
Highlights: ERP migration to Odoo, QR smart inventory, 100+ HS code analytics for EV strategy, locally hosted RAG knowledge base.`
          });
          break;

        case 'contact':
          newHistory.push({
            type: 'response',
            text: `Email: ${personalInfo.email}
Phone/WA: ${personalInfo.phone}
GitHub: ${personalInfo.github}
Domain: https://${personalInfo.domain}`
          });
          break;

        case 'download-cv':
        case 'cv':
          newHistory.push({
            type: 'response',
            text: 'Triggering download for /CV.pdf...'
          });
          window.open('/CV.pdf', '_blank');
          break;

        case 'clear':
          setHistory([{ type: 'system', text: 'Terminal buffer cleared. Type "help" for commands.' }]);
          setInput('');
          return;

        case 'exit':
          onClose();
          return;

        default:
          newHistory.push({
            type: 'error',
            text: `Directive "${cmd}" not recognized. Type "help" for valid directives.`
          });
      }

      setHistory(newHistory);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      if (cmdHistory.length > 0 && historyIndex < cmdHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInput(cmdHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(cmdHistory[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-3xl h-[520px] bg-[#07080d] border border-cyan-500/40 rounded-2xl flex flex-col shadow-2xl shadow-cyan-950/60 overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer" onClick={onClose} />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs text-slate-400 ml-2 font-mono flex items-center gap-1">
              <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
              shuvam@singh-kernel:~
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 text-xs sm:text-sm">
          {history.map((line, idx) => (
            <div key={idx}>
              {line.type === 'user' && (
                <div className="text-cyan-300 font-bold">{line.text}</div>
              )}
              {line.type === 'system' && (
                <div className="text-purple-400 font-medium">{line.text}</div>
              )}
              {line.type === 'response' && (
                <div className="text-slate-300 whitespace-pre-line leading-relaxed pl-2 border-l border-slate-800">
                  {line.text}
                </div>
              )}
              {line.type === 'error' && (
                <div className="text-rose-400">{line.text}</div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-2">
          <span className="text-cyan-400 font-bold">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleCommand}
            placeholder="Type 'help' or command..."
            className="flex-1 bg-transparent border-none outline-none text-slate-200 text-xs sm:text-sm font-mono placeholder:text-slate-600"
          />
          <CornerDownLeft className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </div>
  );
}
