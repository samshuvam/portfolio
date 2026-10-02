import { useEffect, useRef, useState } from 'react';
import { AirplaneLandingIcon, ArrowDownIcon, ChatCircleDotsIcon, DownloadSimpleIcon, SpeakerHighIcon } from '@phosphor-icons/react';
import { gsap, reducedMotion, scrollToTarget } from '../../lib/motion';
import { planeBus } from '../../three/planeBus';
import Footer from '../layout/Footer';
import { findEgg } from '../../lib/eggs';
import { sound } from '../../lib/sound';
import { useT, useLang, localDigits } from '../../i18n';
import dict from '../../i18n/ui/finale';
import { P, beatFor, statusFor, landingFromScroll } from './timeline';
import release from '../../data/release.generated.json';
import './finale.css';

// The landing. Flight SUV-1478 took off from Janakpur in the intro; here, at
// the bottom of the page, it lands at an airport nobody has announced yet
// and parks next to an aircraft named Kalyani. Play and seek controls drive a
// Three.js scene (src/three/LandingScene.js, lazy-loaded); the copy beats
// and the arrivals board follow the same timeline (./timeline.js).

const accentNow = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#214b39';
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function placeTag(el, at, alpha) {
  if (!el) return;
  const a = at.on ? alpha : 0;
  el.style.opacity = a.toFixed(3);
  if (a > 0) el.style.transform = `translate3d(${at.x.toFixed(1)}px, ${(at.y - 8).toFixed(1)}px, 0) translate(-50%, -100%)`;
}

function Board({ t, status, live }) {
  const states = [t('st0'), t('st1'), t('st2'), t('st3')];
  return (
    <div className="fin-board" role="group" aria-label={t('boardTitle')}>
      <div className="fin-board-top">
        <b>{t('boardTitle')}</b>
        <span>{t('airport')}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th scope="col" style={{ width: '24%' }}>
              {t('colFlight')}
            </th>
            <th scope="col" style={{ width: '27%' }}>
              {t('colFrom')}
            </th>
            <th scope="col" style={{ width: '28%' }}>
              {t('colStatus')}
            </th>
            <th scope="col">{t('colGate')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SUV-1478</td>
            <td>{t('fromJkr')}</td>
            <td className="is-live" aria-live={live ? 'polite' : undefined}>
              <span key={status} className="fin-flip">
                {states[status]}
              </span>
            </td>
            <td className="is-live">{t('gateFuture')}</td>
          </tr>
          <tr>
            <td>9N-KLY</td>
            <td className="is-dim">TBF</td>
            <td className="is-dim">{t('kalyaniStatus')}</td>
            <td className="is-dim">TBF</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Notes({ t, beat, staticMode }) {
  const cls = (i) => (staticMode ? 'fin-note' : `fin-beat fin-note${beat === i ? ' is-on' : ''}`);
  return (
    <>
      <div className={cls(0)}>
        <h3>{t('beat0Title', { year: localDigits(2003) })}</h3>
        <p>{t('beat0Text', { rwy: localDigits(27), m: localDigits(78) })}</p>
      </div>
      <div className={cls(1)}>
        <h3>{t('beat1Title')}</h3>
        <p>{t('beat1Text')}</p>
      </div>
      <div className={cls(2)}>
        <h3>{t('beat2Title')}</h3>
        <p>{t('beat2Text')}</p>
      </div>
      <div className={cls(3)}>
        <p className="fin-pa-label t-label">
          <SpeakerHighIcon size={16} weight="bold" aria-hidden="true" />
          {t('beat3Label')}
        </p>
        <p className="fin-pa-text">{t('beat3Text')}</p>
        <p className="t-small">{t('beat3Small')}</p>
      </div>
    </>
  );
}

function Card({ t, className = '', onFocus }) {
  const toContact = (e) => {
    e.preventDefault();
    scrollToTarget('#contact');
  };
  return (
    <div className={`fin-note fin-card ${className}`} onFocus={onFocus}>
      <p className="t-label fin-kicker">{t('cardKicker')}</p>
      <h3>{t('cardTitle')}</h3>
      <p>{t('cardText')}</p>
      <ul className="fin-chips">
        <li className="chip">{t('chip1', { cgpa: localDigits('8.61') })}</li>
        <li className="chip">{t('chip2', { n: localDigits(2) })}</li>
        <li className="chip">{t('chip3')}</li>
      </ul>
      <div className="fin-actions">
        <a className="btn btn-accent" href="/CV.pdf" download="Shuvam-Singh-CV.pdf">
          <DownloadSimpleIcon size={18} weight="bold" aria-hidden="true" />
          {t('cv')}
        </a>
        <a className="btn btn-ghost" href="#contact" onClick={toContact}>
          <ChatCircleDotsIcon size={18} weight="bold" aria-hidden="true" />
          {t('contact')}
        </a>
      </div>
    </div>
  );
}

export default function Finale() {
  const t=useT(dict),lang=useLang(),reduced=useRef(reducedMotion()).current;
  const [progress,setProgress]=useState(reduced?1:0),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  const sectionRef=useRef(null),trackRef=useRef(null),stageRef=useRef(null),canvasRef=useRef(null),sceneRef=useRef(null);
  useEffect(()=>{sceneRef.current?.setSign(t('sign'));},[lang]);
  useEffect(()=>{
    let alive=true,scene,ro,io,observer,raf=0,taxi=null,visible=false,egged=false;const clock={p:reduced?1:0};
    const publish=(p,labels)=>{
      const r=stageRef.current.getBoundingClientRect();
      if(!visible||!labels.flightPose){planeBus.landingPose=null;return;}
      const f=labels.flightPose;const blend=Math.min(1,Math.max(0,(innerHeight-r.top)/(innerHeight*.8)));
      planeBus.landingPose={...f,x:(r.left+(f.x*.5+.5)*r.width)/innerWidth*2-1,y:1-(r.top+(-f.y*.5+.5)*r.height)/innerHeight*2,s:f.s*r.width/innerWidth,blend};
    };
    const draw=()=>{if(!alive)return;scene?.setProgress(clock.p,true);scene?.renderOnce();setProgress(clock.p);if(clock.p>=P.parked&&!egged){egged=true;findEgg('kalyani');}};
    const update=()=>{
      raf=0;if(!alive||reduced)return;
      const r=trackRef.current.getBoundingClientRect(),range=Math.max(1,r.height-stageRef.current.offsetHeight),q=Math.max(0,Math.min(1,-r.top/range));
      if(q<.998){taxi?.kill();taxi=null;clock.p=landingFromScroll(q);draw();}
      else if(!taxi&&scene){clock.p=Math.max(clock.p,P.touchdown);draw();taxi=gsap.to(clock,{p:1,duration:(1-clock.p)*28,ease:'none',onUpdate:draw});}
    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(!visible){planeBus.landingPose=null;taxi?.pause();scene?.stop();}else{taxi?.resume();if(!reduced)scene?.start();schedule();}},{threshold:0});io.observe(stageRef.current);
    observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;observer.disconnect();import('../../three/LandingScene').then(async({createLandingScene})=>{
      await(await import('../../three/airliner')).preloadAirliner();if(!alive)return;
      try{scene=createLandingScene(canvasRef.current,{accent:accentNow(),sign:t('sign'),plain:true,externalPlane:true,onFrame:publish,onTouchdown:()=>sound.whoosh(.4)});sceneRef.current=scene;
        ro=new ResizeObserver(()=>{const r=stageRef.current.getBoundingClientRect();scene.setSize(r.width,r.height);schedule();});ro.observe(stageRef.current);
        const r=stageRef.current.getBoundingClientRect();scene.setSize(r.width,r.height);setReady(true);draw();if(visible&&!reduced)scene.start();schedule();
      }catch{setFailed(true);}
    }).catch(()=>{if(alive)setFailed(true);});},{rootMargin:'120% 0px'});observer.observe(stageRef.current);
    const environment=new MutationObserver(()=>scene?.refresh(accentNow()));environment.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','style']});
    return()=>{alive=false;cancelAnimationFrame(raf);taxi?.kill();ro?.disconnect();io?.disconnect();observer?.disconnect();environment.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);scene?.dispose();sceneRef.current=null;planeBus.landingPose=null;};
  },[reduced]);
  const status=statusFor(progress),beat=beatFor(progress);
  const boarding={en:['BOARDING / THE NEXT CHAPTER','PASSENGER','SHUVAM SINGH','DESTINATION','TO BE ANNOUNCED','SEAT','25A + 25B?','STILL FLYING','Scroll slowly. Touch down at the end; we’ll taxi from there.'],ne:['बोर्डिङ / अर्को अध्याय','यात्रु','शुवम सिंह','गन्तव्य','पछि घोषणा हुनेछ','सिट','25A + 25B?','अझै उड्दै','बिस्तारै स्क्रोल गर्नुहोस्। अन्त्यमा अवतरण, त्यसपछि ट्याक्सी।'],mai:['बोर्डिङ / अगिला अध्याय','यात्री','शुवम सिंह','गन्तव्य','बादमे घोषणा होयत','सीट','25A + 25B?','एखनो उड़ैत','धीरे स्क्रोल करू। अन्तमे अवतरण, तकर बाद ट्याक्सी।']}[lang];
  return <section id="landing" ref={sectionRef} className={`fin airport-finale ${reduced?'is-reduced':''}`} aria-labelledby="fin-title">
    <div className="airport-concourse wrap">
      <header className="fin-head"><p className="t-label fin-kicker"><AirplaneLandingIcon size={18}/>{t('kicker')}</p><h2 id="fin-title" className="t-display fin-title">{t('title')}</h2><p className="t-lede">{t('imagination')}</p></header>
      <div className="airport-gate-grid"><Card t={t}/><Board t={t} status={status} live/></div>
      <div className="arrival-boarding"><p className="t-label">{boarding[0]}</p><div><span>{boarding[1]}<b>{boarding[2]}</b></span><span>{boarding[3]}<b>JKR → TBA</b><small>{boarding[4]}</small></span><span>{boarding[5]}<b>{boarding[6]}</b></span><strong>SUV-1478<small>{boarding[7]}</small></strong></div><span className="boarding-barcode" aria-hidden="true"/></div>
    </div>
    <Footer airport/>
    <div className="airport-approach-track" ref={trackRef}>
      <div className="fin-stage airport-runway" ref={stageRef} onPointerMove={e=>{if(e.pointerType!=='mouse')return;const r=e.currentTarget.getBoundingClientRect();sceneRef.current?.setPointer((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5);}} onPointerLeave={()=>sceneRef.current?.setPointer(0,0)}>
        <canvas ref={canvasRef} className="fin-canvas" role="img" aria-label={t('srScene')} hidden={failed}/>
        {!ready&&<p className="fin-loading">{failed?t('unavailable'):t('loading')}</p>}
        <div className="airport-runway-sign"><span className="t-label">SUV-1478 / JKR → TBA</span><h3>{progress<P.touchdown?t('beat2Title'):t('cardTitle')}</h3><p>{progress<P.touchdown?boarding[8]:progress<P.parked?t('beat3Text'):boarding[7]}</p></div>
        <div className="airport-ground-status"><span className="airport-status-dot"/><span>{t('st'+status)} · SUV-1478</span><span>KALYANI / 9N-KLY</span></div>
        <div className="airport-runway-end"><span>END OF RUNWAY / THE NEXT CHAPTER IS OPEN</span><span>DEPLOYMENT / {release.code} · {release.npt} · {release.shortCommit}</span></div>
      </div>
    </div>
  </section>;
}
