import { useEffect, useState } from 'react';
import Dialog from '../ui/Dialog';
import { waypoints } from '../../data/waypoints';
import { projects } from '../../data/projects';
import { setState, useStore } from '../../lib/store';
import { scrollToTarget } from '../../lib/motion';
import { ask } from '../../lib/qa';
import { findEgg, toast, noteJoke } from '../../lib/eggs';
import { randomJoke } from '../../data/jokes';
import { useLang, useLocalize } from '../../i18n';
import waypointOverlay from '../../i18n/content/waypoints';
import projectOverlay from '../../i18n/content/projects';
import jokeOverlay from '../../i18n/content/jokes';
const close = () => setState({ palette: false });
const labels = {
  en: ['Ask or search', 'Sections, projects, or a question about Shuvam', 'Ask the local assistant', 'No matching flights. Try another search.', 'Passport', 'Tell me a joke', 'Switch theme', 'Answers use only the content on this site.'],
  ne: ['सोध्नुहोस् वा खोज्नुहोस्', 'खण्ड, परियोजना वा शुभमबारे प्रश्न', 'स्थानीय सहायकलाई सोध्नुहोस्', 'मिल्ने नतिजा छैन। अर्को शब्द खोज्नुहोस्।', 'राहदानी', 'एउटा जोक सुनाउनुहोस्', 'थिम बदल्नुहोस्', 'जवाफ यस साइटमा भएको सामग्रीबाट मात्र आउँछ।'],
  mai: ['पूछू वा खोजू', 'खण्ड, परियोजना वा शुभमक बारे मे प्रश्न', 'स्थानीय सहायक सँ पूछू', 'मिलैत परिणाम नहि अछि। दोसर शब्द खोजू।', 'पासपोर्ट', 'एकटा चुटकुला सुनाउ', 'थिम बदलू', 'उत्तर एहि साइटक सामग्री सँ मात्र अबैत अछि।'],
};
export default function CommandPalette() {
  const open = useStore(s => s.palette);
  const lang = useLang();
  const loc = useLocalize(waypointOverlay), lp = useLocalize(projectOverlay), lj = useLocalize(jokeOverlay);
  const [query, setQuery] = useState(''), [answer, setAnswer] = useState(null);
  const l = labels[lang];
  useEffect(() => {
    const key = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setState(s => ({ palette: !s.palette, menu: false }));
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  useEffect(() => { if (open) { setQuery(''); setAnswer(null); } }, [open]);
  const q = query.trim().toLowerCase();
  const rows = [
    ...waypoints.map(w => ({ id: w.id, title: loc(w).label, detail: w.code, run: () => { close(); requestAnimationFrame(() => scrollToTarget(`#${w.id}`)); } })),
    ...projects.map(p => ({ id: p.id, title: lp(p).title, detail: lp(p).category, run: () => setState({ palette: false, project: p.id }) })),
    { id: 'passport-command', title: l[4], run: () => setState({ palette: false, passport: true }) },
    { id: 'joke-command', title: l[5], run: () => { const j = randomJoke(); noteJoke(j.id); close(); toast(l[5], lj(j).text); } },
    { id: 'theme-command', title: l[6], run: () => { setState(s => ({ themePref: s.themePref === 'night' ? 'day' : 'night' })); close(); } },
  ].filter(r => !q || `${r.title} ${r.detail || ''} ${r.id}`.toLowerCase().includes(q));
  const submit = e => {
    e.preventDefault();
    if (!q) return;
    if (/sudo.*(momo|sandwich|food)/.test(q)) { findEgg('sudo'); setAnswer({ title: 'sudo make momo', text: 'Permission granted. Sadly, this terminal has no steamer.' }); }
    else setAnswer(ask(query));
  };
  return <Dialog open={open} onClose={close} label={l[0]} className="palette-panel" variant="center">
    <h2 className="t-title">{l[0]}</h2>
    <form onSubmit={submit} className="palette-form">
      <input className="input" data-autofocus aria-label={l[1]} placeholder={l[1]} value={query} onChange={e => { setQuery(e.target.value); setAnswer(null); }} maxLength={300} />
      <button type="submit" className="btn btn-accent btn-sm" disabled={!q}>{l[2]}</button>
    </form>
    {answer && <article className="palette-answer" role="status"><h3>{answer.title}</h3><p>{answer.text}</p><small>{l[7]}</small></article>}
    <div className="palette-results">{rows.length ? rows.slice(0, 18).map(r => <button key={r.id} type="button" onClick={r.run}><span>{r.title}</span><small>{r.detail || '↵'}</small></button>) : <p>{l[3]}</p>}</div>
  </Dialog>;
}
