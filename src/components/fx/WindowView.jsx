import { useEffect, useRef, useState } from 'react';

import { randomJoke } from '../../data/jokes';
import { noteJoke } from '../../lib/eggs';
import { useLang, useLocalize } from '../../i18n';
import { reducedMotion } from '../../lib/motion';
import { hidePlane, showPlane } from '../../three/planeBus';
import overlay from '../../i18n/content/jokes';
import { WINDOW_VIEWS } from '../../data/windowViews';
import './nepal.css';
import './window-flight.css';
export default function WindowView(){
  const lang=useLang(),loc=useLocalize(overlay),[joke,setJoke]=useState(null),[fallback,setFallback]=useState(()=>reducedMotion());
  const root=useRef(null),canvas=useRef(null),stage=useRef(null),sceneHandle=useRef(null),viewTimer=useRef(null);
  const [view,setView]=useState(0),[changing,setChanging]=useState(false),[seated,setSeated]=useState(false),[fit,setFit]=useState(false);
  useEffect(()=>()=>clearTimeout(viewTimer.current),[]);
  const l={en:['Take the window seat.','A little closer. Scroll from the aircraft into your seat above the clouds.','A word from your captain','View from an aircraft window'],ne:['झ्यालको सिट लिनुहोस्।','अलि नजिक। स्क्रोलसँग विमानबाट बादलमाथिको आफ्नो सिटमा पुग्नुहोस्।','कप्तानको एउटा कुरा','विमानको झ्यालबाट दृश्य'],mai:['खिड़की लगक सीट लिअ।','कनेक लग। स्क्रोलसँ विमानसँ बादल ऊपर अपन सीट धरि जाउ।','कप्तानक एकटा बात','विमानक खिड़की सँ दृश्य']}[lang];
  useEffect(()=>{
    if(fallback)return;let alive=true,scene,io,ro,layoutObserver,raf=0;
    const apply=progress=>{const q=Math.min(1,Math.max(0,progress));root.current.style.setProperty('--seat-progress',q);stage.current.style.setProperty('--window-opacity',1);stage.current.style.setProperty('--aircraft-opacity',1);stage.current.dataset.cabin=q>.36?'inside':'outside';stage.current.dataset.seated=q>.88?'true':'false';stage.current.style.setProperty('--shell-flash',Math.max(0,1-Math.abs(q-.36)/.06));stage.current.style.setProperty('--panorama',Math.min(1,Math.max(0,(q-.76)/.14)));setSeated(q>.88);scene?.setProgress(q);};
    // Read the live section position: lazy content and font loading above this
    // scene must never leave a cached scroll range pointing at the wrong place.
    const update=()=>{raf=0;if(!alive)return;const r=root.current.getBoundingClientRect();apply(-r.top/Math.max(1,r.height-innerHeight));};
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    import('../../three/WindowFlightScene').then(({createWindowFlightScene})=>{if(!alive)return;try{scene=createWindowFlightScene(canvas.current,{onViewChange:(i,busy)=>{setView(i);setChanging(busy);}});sceneHandle.current=scene;ro=new ResizeObserver(()=>{const r=canvas.current.getBoundingClientRect();scene.resize(r.width,r.height);schedule();});ro.observe(canvas.current);layoutObserver=new ResizeObserver(schedule);layoutObserver.observe(document.getElementById('main'));update();scene.ready.then(()=>{if(!alive)return;io=new IntersectionObserver(([e])=>{scene.setActive(e.isIntersecting);if(e.isIntersecting)hidePlane('window-seat');else showPlane('window-seat');},{threshold:0});io.observe(stage.current);}).catch(()=>{if(alive)setFallback(true);});}catch{setFallback(true);}}).catch(()=>{if(alive)setFallback(true);});
    return()=>{alive=false;cancelAnimationFrame(raf);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);ro?.disconnect();layoutObserver?.disconnect();io?.disconnect();scene?.dispose();sceneHandle.current=null;showPlane('window-seat');};
  },[fallback]);
  return <section id="window-seat" ref={root} className={`window-flight ${fallback?'is-static':''}`} aria-label={l[0]}><div className="window-flight-sticky" ref={stage}>
    {!fallback&&<canvas ref={canvas} className="window-flight-canvas" aria-hidden="true"/>}<div className="window-flight-clouds" aria-hidden="true"/><div className="window-shell-flash" aria-hidden="true"/>
    <div className="wrap window-flight-content">{fallback&&<div className="window-frame"><img src={WINDOW_VIEWS[view].src} alt={l[3]} loading="lazy"/></div>}<div className="window-flight-copy"><p className="t-label">SUV-1478 / SEAT {WINDOW_VIEWS[view].seat}</p><h2 className="t-title">{l[0]}</h2><p className="t-lede">{l[1]}</p><button className="btn btn-ghost btn-sm" onClick={()=>{const j=randomJoke('aviation');setJoke(j);noteJoke(j.id);}}>{l[2]}</button>{joke&&<p className="window-joke" aria-live="polite">{loc(joke).text}</p>}</div></div>
    {!fallback&&<span className="window-flight-hint">{lang==='en'?'SCROLL TO YOUR SEAT':lang==='ne'?'आफ्नो सिटतर्फ स्क्रोल गर्नुहोस्':'अपन सीट दिस स्क्रोल करू'} <span aria-hidden="true">↓</span></span>}
    <div className={`seat-panorama ${changing?'is-changing':''} ${fit?'is-fit':''}`} aria-hidden={!seated}>{WINDOW_VIEWS.map((v,i)=><img key={v.seat} src={v.src} alt={v.caption} className={view===i?'is-current':''} />)}</div>
    <div className="seat-view-controls" hidden={!seated&&!fallback}>
      <div><span className="t-label">SUV-1478 / {WINDOW_VIEWS[view].seat}</span><span aria-live="polite">{changing?'Opening your next view…':WINDOW_VIEWS[view].caption}</span><button className="panorama-fit" onClick={()=>setFit(!fit)} aria-pressed={fit}>{fit?'Fill screen':'Fit full image'}</button></div>
      <div role="group" aria-label="Choose your window view">{WINDOW_VIEWS.map((v,i)=><button key={v.seat} className={`seat-view-button ${view===i?'is-selected':''}`} aria-pressed={view===i} disabled={changing} onClick={()=>{if(fallback){setView(i);return;}setChanging(true);clearTimeout(viewTimer.current);viewTimer.current=setTimeout(()=>{sceneHandle.current?.selectView(i);setView(i);setChanging(false);},700);}}><img src={v.src} alt=""/><span>{v.name}<small>SEAT {v.seat}</small></span></button>)}</div>
      <small>Illustrated Nepal views · {lang==='en'?'Full view · Scroll down to continue':'SUV-1478'}</small>
    </div>
  </div></section>;
}
