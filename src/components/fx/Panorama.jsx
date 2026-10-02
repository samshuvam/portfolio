import { useState } from 'react';
import { useWorld } from '../../lib/world';
import { useLang } from '../../i18n';
import { skyColors, rgbToCss } from '../hero/sky';
import { useWeather } from '../../lib/weather';
import './nepal.css';
// A composed skyline, not a surveying diagram. Ranges grounded in NTB's
// Kathmandu hill-station and Langtang guides: https://trade.ntb.gov.np/tourist-destination/hill-stations/
const PEAKS = [{ name: 'Ganesh Himal', np: 'गणेश हिमाल', x: 240, y: 165 }, { name: 'Langtang', np: 'लाङटाङ', x: 565, y: 120 }, { name: 'Dorje Lakpa', np: 'दोर्जे लाक्पा', x: 880, y: 180 }];
export default function Panorama() {
  const world = useWorld(), weather = useWeather(), lang = useLang();
  const [selected, setSelected] = useState(1);
  const c = skyColors(world.sun.elevation, { season: world.season, weather });
  const l = { en: ['A little closer to home.', 'A composed view of the central Himalaya. The sky follows the sun over Lalitpur.', 'Ganesh, Langtang and the Jugal range form part of the skyline north of the Kathmandu Valley.'], ne: ['घरको अलि नजिक।', 'मध्य हिमालयको कलात्मक दृश्य। आकाश ललितपुरको घामसँग बदलिन्छ।', 'गणेश, लाङटाङ र जुगल शृङ्खला काठमाडौं उपत्यकाको उत्तरतिरको आकाशरेखाका अंश हुन्।'], mai: ['घरक कनेक लग।', 'मध्य हिमालयक कलात्मक दृश्य। आकाश ललितपुरक सूर्य संग बदलैत अछि।', 'गणेश, लाङटाङ आ जुगल शृंखला काठमाडौं उपत्यकाक उत्तर दिसक आकाशरेखाक हिस्सा अछि।'] }[lang];
  return <section className="nepal-panorama" aria-label={l[0]} style={{ background: `linear-gradient(${rgbToCss(c.top)},${rgbToCss(c.horizon)})` }}>
    <div className="wrap panorama-copy"><p className="t-label">NEPAL / HIMALAYA</p><h2 className="t-title">{l[0]}</h2><p>{l[1]}</p></div>
    <div className="panorama-image"><img src="/imagery/himalaya.webp" alt={l[2]} loading="lazy" decoding="async" style={{transform:'scale(1.04)',transformOrigin:(20+selected*27)+'% 45%'}}/><div className="panorama-tint" aria-hidden="true" style={{opacity:Math.max(0,1-c.day)*.5}}/></div>
    <div className="wrap panorama-controls"><div className="panorama-peaks">{PEAKS.map((p, i) => <button className="chip" type="button" key={p.name} aria-pressed={selected === i} onClick={() => setSelected(i)}>{lang === 'en' ? p.name : p.np}</button>)}</div><p aria-live="polite">{lang === 'en' ? PEAKS[selected].name : PEAKS[selected].np} <span> / {l[2]}</span></p></div>
  </section>;
}
