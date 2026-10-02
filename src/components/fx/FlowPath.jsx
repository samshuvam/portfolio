import { useEffect, useRef, useState } from 'react';
import { useLang } from '../../i18n';
import { reducedMotion } from '../../lib/motion';
import { createPortal } from 'react-dom';
import { waypoints } from '../../data/waypoints';
import './flow-motion.css';

export default function FlowPath(){
  const lang=useLang(),path=useRef(null),[route,setRoute]=useState({d:'',height:1,width:1});
  const [markers,setMarkers]=useState([]);
  useEffect(()=>{setMarkers(waypoints.slice(1).map(w=>{const section=document.getElementById(w.id);return {...w,host:section?.querySelector('.sec-head,.about-copy,.fin-head')||section};}).filter(w=>w.host));},[lang]);
  useEffect(()=>{
    const main=document.getElementById('main');let raf=0,layoutRaf=0,alive=true;
    const update=()=>{raf=0;if(!alive||!path.current)return;const length=path.current.getTotalLength(),h=Math.max(1,main.offsetHeight-innerHeight),progress=Math.min(1,Math.max(0,scrollY/h));path.current.style.strokeDasharray=String(length);path.current.style.strokeDashoffset=String(length*(1-progress));};
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
    // Rebuild in document space after fonts, images, language or layout changes.
    const layout=()=>{layoutRaf=0;if(!alive)return;const width=main.clientWidth,height=main.scrollHeight;const chapters=[...main.children].filter(el=>el.tagName==='SECTION'||el.classList.contains('fog-reveal'));
      let d=`M ${width*.82} 0`,prevY=0;chapters.forEach((el,i)=>{const y=el.offsetTop+Math.min(el.offsetHeight*.35,600),x=width*(i%2?.12:.88),lastX=width*(i%2?.88:.12);d+=` C ${lastX} ${prevY+(y-prevY)*.35}, ${x} ${prevY+(y-prevY)*.65}, ${x} ${y}`;prevY=y;});d+=` C ${width*.12} ${height-180}, ${width*.85} ${height-100}, ${width*.5} ${height}`;setRoute({d,height,width});schedule();};
    const scheduleLayout=()=>{if(!layoutRaf)layoutRaf=requestAnimationFrame(layout);};
    const observer=new ResizeObserver(scheduleLayout);observer.observe(main);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',scheduleLayout);document.fonts.ready.then(scheduleLayout);layout();
    return()=>{alive=false;cancelAnimationFrame(raf);cancelAnimationFrame(layoutRaf);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',scheduleLayout);};
  },[lang]);
  useEffect(()=>{if(!route.d||!path.current)return;const length=path.current.getTotalLength();path.current.style.strokeDasharray=String(length);path.current.style.strokeDashoffset=String(length*(1-Math.min(1,scrollY/Math.max(1,route.height-innerHeight))));},[route]);
  useEffect(()=>{
    if(reducedMotion())return;const main=document.getElementById('main');
    const headings=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.add('is-written');headings.unobserve(target);}}),{threshold:.12});
    const surfaces=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.add('is-revealed');surfaces.unobserve(target);}}),{threshold:.07});
    const register=()=>{
      main.querySelectorAll('h1,h2,h3,h4').forEach((el,i)=>{if(el.closest('.hero,[role="dialog"],.journey-cards')||el.dataset.motionTitle)return;el.dataset.motionTitle='1';el.classList.add('motion-heading');el.style.setProperty('--heading-delay',`${i%3*70}ms`);headings.observe(el);});
      main.querySelectorAll('.sec-head,.mandir-heading,.panorama-copy,.nb-cell,.cabinet-tile,.life-card,.motif-card,.janaki-fact,.tirhuta-card,.sketchbook').forEach((el,i)=>{if(el.dataset.motionSurface)return;el.dataset.motionSurface='1';el.classList.add('motion-surface');el.style.setProperty('--reveal-delay',`${i%4*65}ms`);surfaces.observe(el);});
    };
    register();const mutation=new MutationObserver(register);mutation.observe(main,{childList:true,subtree:true});
    return()=>{mutation.disconnect();headings.disconnect();surfaces.disconnect();main.querySelectorAll('.motion-heading,.motion-surface').forEach(el=>{el.classList.remove('motion-heading','is-written','motion-surface','is-revealed');delete el.dataset.motionTitle;delete el.dataset.motionSurface;});};
  },[lang]);
  return <><svg className="world-trace" viewBox={`0 0 ${route.width} ${route.height}`} preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="trace-ink" x1="0" x2="1" y1="0" y2="1"><stop stopColor="var(--route-fern)"/><stop offset=".5" stopColor="var(--route-olive)"/><stop offset="1" stopColor="var(--route-teal)"/></linearGradient></defs><path className="trace-halo" d={route.d}/><path className="trace-spine" d={route.d}/><path ref={path} className="trace-written" d={route.d}/><path className="trace-dashes" d={route.d}/></svg>{markers.map((w,i)=>createPortal(<div className="waypoint-beacon" aria-label={`Waypoint ${w.code}`}><svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 12 12 22 2 12Z" fill="none" stroke="currentColor"/><path d="M12 7v10M7 12h10" stroke="currentColor"/></svg><span>GATE {String(i+1).padStart(2,'0')} / {w.code}</span><i aria-hidden="true">↗</i></div>,w.host,w.id))}</>;
}
