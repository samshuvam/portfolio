import { profile } from '../data/profile';
import { projects } from '../data/projects';
import { papers } from '../data/papers';
import { logbook, typeRatings } from '../data/logbook';
import { journey } from '../data/journey';
import { glossary } from '../data/glossary';
import { nowLog } from '../data/misc';
import { getWorld } from './world';

// A small, private, on-page assistant. Everything is answered locally from
// the site's own data (plus any notes in src/knowledge). Nothing is sent
// anywhere.

const notes = import.meta.glob('../knowledge/*.{md,txt}', { eager: true, query: '?raw', import: 'default' });

const age = () => {
  const w = getWorld();
  return w.npt.year - 2003 - (w.npt.month < 4 || (w.npt.month === 4 && w.npt.day < 25) ? 1 : 0);
};

const FACTS = [
  { k: ['cgpa', 'gpa', 'grade', 'marks', 'score'], a: () => `CGPA ${profile.cgpa} out of 10, B.Tech in Computer Science and Engineering (Big Data), SRM University AP, 2022 to 2026.` },
  { k: ['ielts', 'english'], a: () => `IELTS band ${profile.ielts}.` },
  { k: ['degree', 'education', 'university', 'college', 'btech', 'b.tech', 'study', 'studied'], a: () => 'B.Tech in Computer Science and Engineering with a Big Data specialisation at SRM University AP, Andhra Pradesh, India (2022 to 2026, CGPA 8.61).' },
  { k: ['email', 'mail', 'contact', 'reach', 'hire'], a: () => `Email ${profile.email}, or use the boarding pass in the Contact section. Phone and WhatsApp: ${profile.phone}.` },
  { k: ['phone', 'whatsapp', 'number', 'call'], a: () => `Phone and WhatsApp: ${profile.phone}.` },
  { k: ['github', 'code', 'repo'], a: () => `GitHub: ${profile.links.github.url}` },
  { k: ['twitter', ' x ', 'tweet'], a: () => `On X as ${profile.links.x.handle}: ${profile.links.x.url}` },
  { k: ['instagram', 'insta'], a: () => `Instagram: ${profile.links.instagram.handle}` },
  { k: ['paper', 'publication', 'conference', 'ieee', 'icaast', 'icaii', 'research paper'], a: () => papers.map((p) => `${p.venueShort}: ${p.title} (${p.status.toLowerCase()}).`).join(' ') },
  { k: ['experience', 'work', 'job', 'intern', 'satyadip', 'united lubricants', 'company', 'employ'], a: () => `${logbook[0].aircraft} at ${logbook[0].route}, ${logbook[0].place} (${logbook[0].date}): ERP migration to Odoo, QR smart inventory, LLM analytics on HS import codes for EV strategy, and a local RAG knowledge base.` },
  { k: ['born', 'birthday', 'birth', 'age', 'old'], a: () => `Born 25 April 2003 (12 Baisakh 2060 BS) in Janakpur, Nepal. That makes him ${age()}.` },
  { k: ['where', 'live', 'location', 'based', 'home', 'from'], a: () => 'Born in Janakpur, the city of Sita in Mithila. Lives and works in Lalitpur, Nepal. Studied at SRM University AP in India.' },
  { k: ['language', 'speak', 'maithili', 'nepali'], a: () => 'Maithili (mother tongue), Nepali and English.' },
  { k: ['zodiac', 'rashi', 'virgo', 'kanya', 'sign', 'astrology'], a: () => 'Kanya rashi, Virgo. In Hindu jyotish the rashi comes from the kundali, not just the birth date. Ruled by Budh (Mercury): intellect and speech.' },
  { k: ['hobby', 'hobbies', 'free time', 'food', 'cook', 'eat', 'foodie', 'momo'], a: () => 'Big-time foodie and a happy cook, a professional yapper, a hardware and smartphone nerd, a plane spotter, always active, and a photographer (36 frames on this site).' },
  { k: ['skill', 'stack', 'tech', 'tools', 'know'], a: () => typeRatings.map((g) => `${g.group}: ${g.items.map((i) => i.name).join(', ')}`).join('. ') + '.' },
  { k: ['now', 'currently', 'working on', 'doing'], a: () => `${nowLog[0].text} Right now in Nepal, his best guess is: ${getWorld().doing.toLowerCase()}.` },
  { k: ['photo', 'camera', 'photography'], a: () => 'He shoots on phones: CMF Phone 2 Pro, Galaxy Note20 Ultra and iPhone 16 Pro Max among them. The prayer wheel in Frames holds 36 photos.' },
];

function corpus() {
  return [
    ...projects.map((p) => ({ title: p.title, text: `${p.title}. ${p.subtitle}. ${p.summary} ${p.intro} ${p.points.map((x) => `${x.title}: ${x.text}`).join(' ')} ${p.tags.join(' ')}` })),
    ...papers.map((p) => ({ title: p.title, text: `${p.title}. ${p.venue}. ${p.abstract} ${p.plain}` })),
    ...journey.map((j) => ({ title: `${j.when}: ${j.title}`, text: `${j.title}. ${j.text}` })),
    ...Object.entries(notes).map(([path, text]) => ({ title: path.split('/').pop().replace(/\.(md|txt)$/, ''), text })),
  ];
}

const STOP = new Set(['what', 'whats', 'does', 'about', 'with', 'have', 'your', 'shuvam', 'his', 'him', 'the', 'and', 'for', 'tell', 'show', 'who', 'how', 'did', 'are', 'was', 'this', 'that', 'can', 'you', 'which', 'when', 'where']);

export function ask(query) {
  const q = ` ${query.toLowerCase().replace(/[^a-z0-9.\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  if (!q.trim()) return null;
  const fact = FACTS.find((f) => f.k.some((k) => q.includes(k.startsWith(' ') ? k : ` ${k}`) || q.includes(k)));
  const term = Object.entries(glossary)
    .sort((a, b) => b[1].term.length - a[1].term.length)
    .find(([, g]) => q.includes(` ${g.term.toLowerCase()} `) || q.includes(` ${g.term.toLowerCase()}`));
  if (term && (!fact || q.includes(' what is ') || q.includes(' explain ') || q.includes(' meaning '))) {
    const [, g] = term;
    return { kind: 'term', title: g.term, text: `${g.full ? `${g.full}. ` : ''}${g.body}` };
  }
  if (fact) return { kind: 'fact', title: 'Answer', text: fact.a() };
  const words = q.split(' ').filter((w) => w.length > 2 && !STOP.has(w));
  if (!words.length) return null;
  const ranked = corpus()
    .map((c) => ({ ...c, score: words.reduce((s, w) => s + (c.text.toLowerCase().includes(w) ? 1 : 0) + (c.title.toLowerCase().includes(w) ? 1.5 : 0), 0) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  if (!ranked.length) return { kind: 'none', title: 'Not sure', text: 'I could not find that on the site. Try a shorter question: “CGPA”, “papers”, “eVTOL”, “born”, or “what is RAG?”' };
  return { kind: 'search', title: ranked[0].title, text: ranked.map((r) => r.text.replace(/\s+/g, ' ').slice(0, 260) + (r.text.length > 260 ? '…' : '')).join('\n\n') };
}
