import { useState } from 'react';
import { contextImage } from '../../lib/imagery';
import { randomJoke } from '../../data/jokes';
import { noteJoke } from '../../lib/eggs';
import { useLang, useLocalize } from '../../i18n';
import overlay from '../../i18n/content/jokes';
import './nepal.css';
export default function WindowView() {
  const p = contextImage('window'), lang = useLang(), loc = useLocalize(overlay);
  const [joke, setJoke] = useState(null);
  const l = { en: ['Take the window seat.', 'Somewhere between the work and the next chapter, a little room to look out.', 'A word from your captain', 'View from an aircraft window'], ne: ['झ्यालको सिट लिनुहोस्।', 'काम र अर्को अध्यायको बीचमा, बाहिर हेर्न अलिकति समय।', 'कप्तानको एउटा कुरा', 'विमानको झ्यालबाट दृश्य'], mai: ['खिड़की लगक सीट लिअ।', 'काम आ अगिला अध्यायक बीच, बाहर देखबाक कनेक समय।', 'कप्तानक एकटा बात', 'विमानक खिड़की सँ दृश्य'] }[lang];
  return <section className="window-interlude section" aria-label={l[0]}><div className="wrap window-grid"><div className="window-frame"><img src={p.src} alt={l[3]} loading="lazy"/></div><div><p className="t-label">SS2504 / SEAT 25A</p><h2 className="t-title">{l[0]}</h2><p className="t-lede">{l[1]}</p><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{const j=randomJoke('aviation');setJoke(j);noteJoke(j.id);}}>{l[2]}</button>{joke && <p className="window-joke" aria-live="polite">{loc(joke).text}</p>}</div></div></section>;
}
