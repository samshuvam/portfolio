import { useEffect, useRef, useState } from 'react';
import L, { useCopy } from '../../i18n/Text';
import { useLocalize } from '../../i18n';
import overlay from '../../i18n/content/journey';
import seasonOverlay from '../../i18n/content/seasons';
import { journey } from '../../data/journey';
import { SEASONS, seasonById } from '../../data/seasons';
import { useWorld } from '../../lib/world';
import { contextImage } from '../../lib/imagery';
import { setState } from '../../lib/store';
import { reducedMotion } from '../../lib/motion';
import { useSeason } from '../ThemeSync';
import { Term } from '../ui/Term';
import './journey-v3.css';

export default function Journey() {
  const c=useCopy(),world=useWorld(),loc=useLocalize(overlay),ls=useLocalize(seasonOverlay),live=useSeason();
  const [pick,setPick]=useState('live'),[phase,setPhase]=useState('live'),[active,setActive]=useState(0),[open,setOpen]=useState(false);
  const [compact,setCompact]=useState(()=>matchMedia('(max-width: 767px)').matches);
  const [sceneFallback,setSceneFallback]=useState(false);
  const season=pick==='live'?live:seasonById(pick),light=phase==='live'?(world.phase==='day'?'day':'night'):phase;
  const environment=useRef({season,light});environment.current={season,light};
  const canvas=useRef(null),sceneRef=useRef(null),cards=useRef([]),target=useRef(0),viewer=useRef(null);
  useEffect(()=>{const mq=matchMedia('(max-width: 767px)');const change=()=>setCompact(mq.matches);mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change);},[]);
  useEffect(()=>{
    const io=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>Math.abs(a.boundingClientRect.top-innerHeight*.4)-Math.abs(b.boundingClientRect.top-innerHeight*.4));if(visible[0]){const i=Number(visible[0].target.dataset.index);setActive(i);target.current=i/(journey.length-1);}},{rootMargin:'-15% 0px -45% 0px',threshold:0});
    cards.current.forEach(el=>el&&io.observe(el));return()=>io.disconnect();
  },[]);
  useEffect(()=>{
    if(compact||sceneFallback||reducedMotion())return;
    let alive=true,scene,ro,io,raf=0,visible=false;
    import('../../three/BoughScene').then(({BoughScene})=>{if(!alive)return;try{scene=new BoughScene(canvas.current,{milestones:journey.length,mobile:false});sceneRef.current=scene;scene.dress(environment.current.season);scene.light(environment.current.light,environment.current.season);ro=new ResizeObserver(()=>{const r=canvas.current.getBoundingClientRect();scene.resize(r.width,r.height);});ro.observe(canvas.current);io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;});io.observe(viewer.current);const frame=()=>{if(!alive)return;raf=requestAnimationFrame(frame);if(!visible||document.hidden)return;scene.progress+=(target.current-scene.progress)*.055;scene.render();};frame();}catch{setSceneFallback(true);}}).catch(()=>{if(alive)setSceneFallback(true);});
    return()=>{alive=false;cancelAnimationFrame(raf);ro?.disconnect();io?.disconnect();scene?.dispose();sceneRef.current=null;};
  },[compact,sceneFallback]);
  useEffect(()=>{const s=sceneRef.current;if(s){s.dress(season);s.light(light,season);}},[season,light]);
  return <section id="journey" className="section journey journey-v3" aria-labelledby="journey-title">
    <div className="wrap journey-head sec-head"><h2 id="journey-title" className="t-display"><L text="The journey,"/> <span className="light"><L text="in the season you’re reading it."/></span></h2><p className="t-lede"><L text="This bough is dressed for Nepal right now. It is"/> <Term id="ritu">{ls(season).english}</Term>. {ls(season).line}</p></div>
    <div className="wrap journey-layout">
      <aside ref={viewer} className="journey-viewer" aria-label={c('The season along the way')}>
        {!compact&&!sceneFallback&&!reducedMotion()?<canvas ref={canvas} className="journey-scene" aria-hidden="true"/>:<svg viewBox="0 0 420 150" className="journey-season-art" aria-hidden="true"><path d="M-10 130Q120 30 215 80T430 20" fill="none" stroke="currentColor" strokeWidth="5"/>{Array.from({length:12},(_,i)=><ellipse key={i} cx={22+i*34} cy={92-Math.sin(i*.7)*34} rx="21" ry="9" transform={`rotate(${i%2?35:-35} ${22+i*34} ${92-Math.sin(i*.7)*34})`} fill={season.accent.day.fill} opacity={.35+i/25}/>)}</svg>}
        <div className="journey-focus"><p className="t-label">{active+1} / {journey.length} · {ls(season).english}</p><h3>{loc(journey[active]).title}</h3><p>{loc(journey[active]).sub}</p></div>
        <button type="button" className="chip" aria-expanded={open} onClick={()=>setOpen(!open)}>{c(open?'Done':'Change season')}</button>
        {open&&<div className="journey-season-picker"><div>{SEASONS.map(s=><button className="chip" key={s.id} aria-pressed={season.id===s.id} onClick={()=>setPick(s.id)}>{ls(s).english}</button>)}</div><div>{['day','night'].map(p=><button className="chip" key={p} aria-pressed={light===p} onClick={()=>setPhase(p)}>{c(p==='day'?'Day':'Night')}</button>)}<button className="chip" onClick={()=>{setPick('live');setPhase('live');}}>{c('Back to live')}</button></div></div>}
      </aside>
      <ol className="journey-timeline">{journey.map(m=>loc(m)).map((m,i)=><li data-index={i} ref={el=>cards.current[i]=el} key={m.id} className={active===i?'is-active':''}><span className="journey-node" aria-hidden="true"/><article className="journey-entry"><p className="t-label">{m.when} · {m.sub}</p><h3>{m.title}</h3><p>{m.text}{m.term&&<> <Term id={m.term}>6–7</Term> {c('years old.')}</>}</p>{m.image&&<img src={contextImage(m.image).src} alt="" loading="lazy"/>}{m.project&&<button type="button" className="btn btn-ghost btn-sm" onClick={()=>setState({project:m.project})}>{c('The project')} ↗</button>}</article></li>)}</ol>
    </div>
  </section>;
}
