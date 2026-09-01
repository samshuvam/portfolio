import React, { useMemo, useState } from 'react';
import { Bot, Search, X } from 'lucide-react';
import { personalInfo, researchProjects, publications, technicalSkills, glossaryTerms, experienceData, educationData } from '../data/portfolioData';

const notes = import.meta.glob('../knowledge/*.{md,txt}', { eager: true, query: '?raw', import: 'default' });

const facts = [
  { aliases: ['cgpa', 'gpa', 'grade', 'academic score', 'marks'], response: `Shuvam’s CGPA is ${personalInfo.cgpa} / 10.0 at SRM University - AP.` },
  { aliases: ['ielts', 'english score'], response: `Shuvam’s IELTS proficiency is ${personalInfo.ielts}.` },
  { aliases: ['degree', 'education', 'university', 'college', 'btech', 'b.tech'], response: 'Shuvam completed a B.Tech in Computer Science and Engineering with a Big Data specialization at SRM University - AP.' },
  { aliases: ['email', 'contact email', 'mail'], response: `You can contact Shuvam at ${personalInfo.email}.` },
  { aliases: ['phone', 'whatsapp', 'number'], response: `Shuvam’s phone and WhatsApp number is ${personalInfo.phone}.` },
  { aliases: ['instagram', 'insta'], response: 'Instagram: @sam.shuvam — https://www.instagram.com/sam.shuvam' },
  { aliases: ['papers', 'publications', 'research papers', 'conference'], response: 'Shuvam has 2 accepted international research papers: IEEE ICAII 2026 on Bio-Memory continual learning and ICAAsT 2024 on aerospace 4D trajectory conflict detection.' },
  { aliases: ['experience', 'work experience', 'internship', 'employment', 'job', 'united lubricants', 'satyadip'], response: `Shuvam’s industry experience includes ${experienceData[0].role} at ${experienceData[0].company} in ${experienceData[0].location} (${experienceData[0].period}). His work includes Odoo ERP migration, workflow automation, smart inventory, LLM analytics, and RAG systems.` },
  { aliases: ['academic experience', 'academic background', 'coursework'], response: `${educationData[0].degree} in ${educationData[0].field} at ${educationData[0].institution}. Key coursework includes ${educationData[0].coursework.slice(0, 4).join(', ')}.` },
];

function buildCorpus() {
  return [
    { title: 'Profile', text: `${personalInfo.name}. ${personalInfo.title}. CGPA ${personalInfo.cgpa}. IELTS ${personalInfo.ielts}. ${personalInfo.aboutBio}` },
    ...researchProjects.map((project) => ({ title: project.title, text: `${project.title}. ${project.subtitle}. ${project.summary} ${project.description}` })),
    ...publications.map((paper) => ({ title: paper.title, text: `${paper.title}. ${paper.conference}. ${paper.abstract}` })),
    { title: 'Technical skills', text: JSON.stringify(technicalSkills) },
    ...Object.entries(notes).map(([path, text]) => ({ title: path.split('/').pop(), text })),
  ];
}

function answer(query, corpus) {
  const normalized = query.toLowerCase().replace(/[^a-z0-9.\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Ask about projects, skills, CGPA, education, publications, or experience.';
  const fact = facts.find((item) => item.aliases.some((alias) => normalized.includes(alias)));
  if (fact) return fact.response;
  const term = [...glossaryTerms].sort((a, b) => b.term.length - a.term.length).find((item) => normalized.includes(item.term.toLowerCase()));
  if (term) return `${term.term}: ${term.definition}`;
  const words = normalized.split(' ').filter((word) => word.length > 2 && !['what', 'does', 'about', 'with', 'have', 'your', 'shuvam'].includes(word));
  const ranked = corpus.map((entry) => ({ ...entry, score: words.reduce((score, word) => score + (entry.text.toLowerCase().includes(word) ? 1 : 0), 0) })).filter((entry) => entry.score).sort((a, b) => b.score - a.score).slice(0, 2);
  if (!ranked.length) return 'I could not find a clear answer. Try a shorter question, such as “CGPA”, “federated learning”, “RAG”, “aerospace”, or “publications”.';
  return ranked.map((entry) => `${entry.title}: ${entry.text.replace(/\s+/g, ' ').slice(0, 320)}${entry.text.length > 320 ? '…' : ''}`).join('\n\n');
}

export default function SmartSearch() {
  const corpus = useMemo(buildCorpus, []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const ask = (event) => { event.preventDefault(); setReply(answer(query, corpus)); };
  return <><button onClick={() => setOpen(true)} className="smart-search-trigger" aria-label="Open smart portfolio search"><Bot className="w-4 h-4" /> Ask the portfolio</button>{open && <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-8 bg-black/35" onClick={() => setOpen(false)}><div className="smart-search-panel glass-panel-glow w-full max-w-md rounded-2xl p-5" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="text-white font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-cyan-300" /> Portfolio assistant</h2><button onClick={() => setOpen(false)} aria-label="Close search"><X className="w-5 h-5 text-slate-400" /></button></div><form onSubmit={ask} className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “CGPA” or “federated learning”" autoFocus className="flex-1 min-w-0 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400" /><button className="rounded-xl bg-cyan-400 px-3 text-slate-950" aria-label="Search"><Search className="w-4 h-4" /></button></form>{reply && <div className="mt-4 whitespace-pre-line rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-relaxed text-slate-200">{reply}</div>}</div></div>}</>;
}
