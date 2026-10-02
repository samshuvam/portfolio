import { useEffect, useRef, useState } from 'react';
import { contextImage } from '../../lib/imagery';
import { randomJoke } from '../../data/jokes';
import { noteJoke } from '../../lib/eggs';
import { useLang, useLocalize } from '../../i18n';
import { reducedMotion } from '../../lib/motion';
import { hidePlane, showPlane } from '../../three/planeBus';
import overlay from '../../i18n/content/jokes';
import './nepal.css';
import './window-flight.css';
export default function WindowView(){
  const p=contextImage('window-v2'),lang=useLang(),loc=useLocalize(overlay),[joke,setJoke]=useState(null),[fallback,setFallback]=useState(()=>reducedMotion());
  const root=useRef(null),canvas=useRef(null),stage=useRef(null);
  const l={en:['Take the window seat.','A little closer. Scroll from the aircraft into your seat above the clouds.','A word from your captain','View from an aircraft window'],ne:['झ्यालको सिट लिनुहोस्।','अलि नजिक। स्क्रोलसँग विमानबाट बादलमाथिको आफ्नो सिटमा पुग्नुहोस्।','कप्तानको एउटा कुरा','विमानको झ्यालबाट दृश्य'],mai:['खिड़की लगक सीट लिअ।','कनेक लग। स्क्रोलसँ विमानसँ बादल ऊपर अपन सीट धरि जाउ।','कप्तानक एकटा बात','विमानक खिड़की सँ दृश्य']}[lang];
  useEffect(()=>{
    if(fallback)return;let alive=true,scene,io,ro,layoutObserver,raf=0;
    const apply=progress=>{const q=Math.min(1,Math.max(0,progress));root.current.style.setProperty('--seat-progress',q);stage.current.style.setProperty('--window-opacity',1);stage.current.style.setProperty('--aircraft-opacity',1);stage.current.dataset.cabin=q>.43?'inside':'outside';scene?.setProgress(q);};
    // Read the live section position: lazy content and font loading above this
    // scene must never leave a cached scroll range pointing at the wrong place.
    const update=()=>{raf=0;if(!alive)return;const r=root.current.getBoundingClientRect();apply(-r.top/Math.max(1,r.height-innerHeight));};
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    import('../../three/WindowFlightScene').then(({createWindowFlightScene})=>{if(!alive)return;try{scene=createWindowFlightScene(canvas.current);ro=new ResizeObserver(()=>{const r=canvas.current.getBoundingClientRect();scene.resize(r.width,r.height);schedule();});ro.observe(canvas.current);layoutObserver=new ResizeObserver(schedule);layoutObserver.observe(document.getElementById('main'));update();scene.ready.then(()=>{if(!alive)return;io=new IntersectionObserver(([e])=>{if(e.isIntersecting)hidePlane('window-seat');else showPlane('window-seat');},{threshold:0});io.observe(stage.current);}).catch(()=>{if(alive)setFallback(true);});}catch{setFallback(true);}}).catch(()=>{if(alive)setFallback(true);});
    return()=>{alive=false;cancelAnimationFrame(raf);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);ro?.disconnect();layoutObserver?.disconnect();io?.disconnect();scene?.dispose();showPlane('window-seat');};
  },[fallback]);
  return <section id="window-seat" ref={root} className={`window-flight ${fallback?'is-static':''}`} aria-label={l[0]}><div className="window-flight-sticky" ref={stage}>
    {!fallback&&<canvas ref={canvas} className="window-flight-canvas" aria-hidden="true"/>}<div className="window-flight-clouds" aria-hidden="true"/>
    <div className="wrap window-flight-content">{fallback&&<div className="window-frame"><img src={p?.src} alt={l[3]} loading="lazy"/></div>}<div className="window-flight-copy"><p className="t-label">SUV-1478 / SEAT 25A</p><h2 className="t-title">{l[0]}</h2><p className="t-lede">{l[1]}</p><button className="btn btn-ghost btn-sm" onClick={()=>{const j=randomJoke('aviation');setJoke(j);noteJoke(j.id);}}>{l[2]}</button>{joke&&<p className="window-joke" aria-live="polite">{loc(joke).text}</p>}</div></div>
    {!fallback&&<span className="window-flight-hint">{lang==='en'?'SCROLL TO YOUR SEAT':lang==='ne'?'आफ्नो सिटतर्फ स्क्रोल गर्नुहोस्':'अपन सीट दिस स्क्रोल करू'} <span aria-hidden="true">↓</span></span>}
  </div></section>;
}
