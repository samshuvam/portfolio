import React, { useMemo, useState } from 'react';
import { Bot, Search, X, LockKeyhole } from 'lucide-react';
import { personalInfo, researchProjects, publications, technicalSkills } from '../data/portfolioData';

const notes = import.meta.glob('../knowledge/*.{md,txt}', { eager: true, query: '?raw', import: 'default' });

function buildCorpus() {
  const entries = [
    { title: 'About Shuvam', text: `${personalInfo.name}. ${personalInfo.title}. ${personalInfo.aboutBio}` },
    ...researchProjects.map((project) => ({ title: project.title, text: `${project.title}. ${project.subtitle}. ${project.summary} ${project.description}` })),
    ...publications.map((paper) => ({ title: paper.title, text: `${paper.title}. ${paper.conference}. ${paper.abstract}` })),
    { title: 'Technical skills', text: JSON.stringify(technicalSkills) },
    ...Object.entries(notes).map(([path, text]) => ({ title: path.split('/').pop(), text })),
  ];
  return entries;
}

function answer(query, corpus) {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  if (!words.length) return 'Ask me about Shuvam’s research, projects, skills, publications, or experience.';
  const ranked = corpus.map((entry) => ({ ...entry, score: words.reduce((score, word) => score + (entry.text.toLowerCase().includes(word) ? 1 : 0), 0) })).filter((entry) => entry.score).sort((a, b) => b.score - a.score).slice(0, 3);
  if (!ranked.length) return 'I could not find that in the public portfolio knowledge base. Try asking about federated learning, RAG, aerospace, photography, or Shuvam’s experience.';
  return ranked.map((entry) => `${entry.title}: ${entry.text.replace(/\s+/g, ' ').slice(0, 280)}${entry.text.length > 280 ? '…' : ''}`).join('\n\n');
}

export default function SmartSearch() {
  const corpus = useMemo(buildCorpus, []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const ask = (event) => { event.preventDefault(); setReply(answer(query, corpus)); };
  return <><button onClick={() => setOpen(true)} className="smart-search-trigger" aria-label="Open smart portfolio search"><Bot className="w-4 h-4" /> Ask the portfolio</button>{open && <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-8 bg-black/35" onClick={() => setOpen(false)}><div className="smart-search-panel glass-panel-glow w-full max-w-md rounded-2xl p-5" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between mb-3"><h2 className="text-white font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-cyan-300" /> Portfolio assistant</h2><button onClick={() => setOpen(false)} aria-label="Close search"><X className="w-5 h-5 text-slate-400" /></button></div><p className="text-xs text-slate-400 mb-4">Local smart search. It only reads public portfolio content and files in <code className="text-cyan-300">src/knowledge</code>.</p><form onSubmit={ask} className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about a project…" autoFocus className="flex-1 min-w-0 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400" /><button className="rounded-xl bg-cyan-400 px-3 text-slate-950" aria-label="Search"><Search className="w-4 h-4" /></button></form>{reply && <div className="mt-4 whitespace-pre-line rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-relaxed text-slate-200">{reply}</div>}<div className="mt-4 flex items-center gap-1 text-[11px] text-slate-500"><LockKeyhole className="w-3 h-3" /> No API key, cookies, or external query logging.</div></div></div>}</>;
}
