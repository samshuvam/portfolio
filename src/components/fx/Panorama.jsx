import { useState, useRef, useEffect } from 'react';
import { gsap, reducedMotion } from '../../lib/motion';
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
  const image=useRef(null),root=useRef(null);
  useEffect(()=>{const tween=gsap.to(image.current,{scale:selected===null?1:1.52,transformOrigin:`${selected===null?50:[20,50,80][selected]}% 48%`,duration:reducedMotion()?0:1.8,ease:'power3.inOut'});return()=>tween.kill();},[selected]);
  useEffect(()=>{if(reducedMotion())return;const ctx=gsap.context(()=>gsap.fromTo('.panorama-image',{clipPath:'inset(14% 7% 14% 7% round 32px)'},{clipPath:'inset(0% 0% 0% 0% round 0px)',ease:'none',scrollTrigger:{trigger:root.current,start:'top 85%',end:'top 15%',scrub:1}}),root);return()=>ctx.revert();},[]);
  const c = skyColors(world.sun.elevation, { season: world.season, weather });
  const l = { en: ['A little closer to home.', 'A composed view of the central Himalaya. The sky follows the sun over Lalitpur.', 'Ganesh, Langtang and the Jugal range form part of the skyline north of the Kathmandu Valley.'], ne: ['घरको अलि नजिक।', 'मध्य हिमालयको कलात्मक दृश्य। आकाश ललितपुरको घामसँग बदलिन्छ।', 'गणेश, लाङटाङ र जुगल शृङ्खला काठमाडौं उपत्यकाको उत्तरतिरको आकाशरेखाका अंश हुन्।'], mai: ['घरक कनेक लग।', 'मध्य हिमालयक कलात्मक दृश्य। आकाश ललितपुरक सूर्य संग बदलैत अछि।', 'गणेश, लाङटाङ आ जुगल शृंखला काठमाडौं उपत्यकाक उत्तर दिसक आकाशरेखाक हिस्सा अछि।'] }[lang];
  return <section id="himalaya" ref={root} className="nepal-panorama" aria-label={l[0]} style={{ background: `linear-gradient(${rgbToCss(c.top)},${rgbToCss(c.horizon)})` }}>
    <div className="wrap panorama-copy"><p className="t-label">NEPAL / HIMALAYA</p><h2 className="t-title">{l[0]}</h2><p>{l[1]}</p></div>
    <div className="panorama-image"><img ref={image} src="/imagery/himalaya.webp" alt={l[2]} loading="lazy" decoding="async"/><div className="panorama-tint" aria-hidden="true" style={{opacity:Math.max(0,1-c.day)*.5}}/></div>
    <div className="wrap panorama-controls"><div className="panorama-peaks"><button className="chip" type="button" aria-pressed={selected===null} onClick={()=>setSelected(null)}>{lang==='en'?'Whole skyline':lang==='ne'?'पूरा आकाशरेखा':'पूरा आकाशरेखा'}</button>{PEAKS.map((p, i) => <button className="chip" type="button" key={p.name} aria-pressed={selected === i} onClick={() => setSelected(i)}>{lang === 'en' ? p.name : p.np}</button>)}</div><p aria-live="polite">{selected===null ? (lang==='en'?'Central Himalaya':'मध्य हिमालय') : lang === 'en' ? PEAKS[selected].name : PEAKS[selected].np} <span> / {l[2]}</span></p></div>
  </section>;
}
