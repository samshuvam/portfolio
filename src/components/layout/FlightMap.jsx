import { useEffect, useState } from 'react';
import { waypoints } from '../../data/waypoints';
import { scrollToTarget } from '../../lib/motion';
import { useLocalize, useLang } from '../../i18n';
import overlay from '../../i18n/content/waypoints';
import {phases,phaseIndex} from './flightPhases';
export default function FlightMap() {
  const [active, setActive] = useState('top'), [open, setOpen] = useState(false);
  const loc = useLocalize(overlay), lang = useLang();
  const label = { en: 'Flight map', ne: 'उडान नक्सा', mai: 'उड़ान नक्शा' }[lang];
  useEffect(() => {
    const io = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }); }, { rootMargin: '-20% 0px -65% 0px' });
    waypoints.forEach(w => { const el = document.getElementById(w.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  const index = Math.max(0, waypoints.findIndex(w => w.id === active));
  const phase=phases[lang][phaseIndex(index)];
  return <aside className="flight-map" aria-label={label}>
    {open && <div className="flight-phase"><p className="t-label">SS2504 · JKR → TBF</p><b>{phase[0]}</b><p>{phase[1]}</p><small>{lang==='en'?'TBF: to be finalised. Choose any waypoint below.':lang==='ne'?'TBF: तय हुन बाँकी। तलको बिन्दु छान्नुहोस्।':'TBF: तय होयब बाँकी। नीचाँ बिन्दु चुनू।'}</small></div>}
    {open && <nav className="flight-map-list" aria-label={label}>{waypoints.map(w => <a key={w.id} href={`#${w.id}`} aria-current={active === w.id ? 'location' : undefined} onClick={e => { e.preventDefault(); setOpen(false); scrollToTarget(`#${w.id}`); }}><small>{w.code}</small><span>{loc(w).label}<em>{phases[lang][phaseIndex(waypoints.indexOf(w))][0]}</em></span></a>)}</nav>}
    <button type="button" className="flight-map-toggle" aria-expanded={open} onClick={() => setOpen(!open)}><span aria-hidden="true">✈</span> {waypoints[index].code}<span className="sr-only"> {label}</span><span className="flight-map-track" aria-hidden="true"><i style={{ width: `${index / (waypoints.length - 1) * 100}%` }} /></span></button>
  </aside>;
}
