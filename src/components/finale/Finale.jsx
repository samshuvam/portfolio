import { useEffect, useRef, useState } from 'react';
import { AirplaneLandingIcon, ChatCircleDotsIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { gsap, reducedMotion, scrollToTarget } from '../../lib/motion';
import { planeBus } from '../../three/planeBus';
import { TRAFFIC } from '../../three/trafficSchedule';
import Footer from '../layout/Footer';
import { findEgg } from '../../lib/eggs';
import { useT, useLang, localDigits } from '../../i18n';
import dict from '../../i18n/ui/finale';
import { P, statusFor } from './timeline';
import release from '../../data/release.generated.json';
import './finale.css';

// Scrolling brings the airport into view. Flight, touchdown and taxi use
// elapsed time, so arrivals keep moving while the visitor watches.

const accentNow = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#214b39';
function Board({ t, status, live, traffic }) {
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
          {TRAFFIC.map(f=><tr key={f.call}><td>{f.call}</td><td>{f.from}<small className="traffic-destination">→ {f.to}</small></td><td className={traffic?.call===f.call?'is-live':'is-dim'}>{traffic?.call===f.call?traffic.status:'EXPECTED'}</td><td className="is-dim">{f.call==='SHUV-ACB'?'09R':'27L'}</td></tr>)}
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
  const [traffic,setTraffic]=useState(null);
  const sectionRef=useRef(null),trackRef=useRef(null),stageRef=useRef(null),canvasRef=useRef(null),sceneRef=useRef(null);
  useEffect(()=>{sceneRef.current?.setSign(t('sign'));},[lang]);
  useEffect(()=>{
    let alive=true,scene,ro,observer,raf=0,taxi=null,egged=false,active=false,q=0,trafficKey='';
    const clock={p:reduced?1:0},smooth=t=>t*t*(3-2*t),clamp=v=>Math.max(0,Math.min(1,v));
    const publish=(p,labels)=>{
      if(!active||!labels.flightPose){planeBus.landingPose=null;return;}
      const flight=labels.traffic;if(flight){const state=flight.visible?(flight.departing?'DEPARTING':'LANDING'):'EXPECTED',key=flight.flight.call+state;if(key!==trafficKey){trafficKey=key;setTraffic({call:flight.flight.call,status:state});}}
      const blend=smooth(clamp((q-.15)/.6));
      planeBus.landingPose={...labels.flightPose,blend,touchdown:p>=P.touchdown};
    };
    const draw=()=>{
      if(!alive)return;scene?.setProgress(clock.p,true);scene?.renderOnce();setProgress(clock.p);
      if(clock.p>=P.parked&&!egged){egged=true;findEgg('kalyani');}
    };
    const update=()=>{
      raf=0;if(!alive)return;
      const now=document.getElementById('now'),y=window.scrollY;
      const start=y+(now?.getBoundingClientRect().top??sectionRef.current.getBoundingClientRect().top)-innerHeight*.25;
      const end=Math.max(start+1,document.documentElement.scrollHeight-innerHeight);
      q=clamp((y-start)/(end-start));active=q>0;
      const world=canvasRef.current.parentElement;
      world.style.opacity=String(reduced?0:q<.82?smooth(clamp(q/.24))*.43:.43+.57*smooth(clamp((q-.82)/.18)));
      world.style.visibility=active&&!failed?'visible':'hidden';
      document.documentElement.classList.toggle('airport-in-view',active);
      if(!active){scene?.stop();planeBus.landingPose=null;taxi?.pause();}
      else if(!reduced){scene?.start();taxi?.resume();}
      if(reduced){clock.p=1;draw();return;}
      if(!taxi&&scene&&active){taxi=gsap.to(clock,{p:1,duration:(1-clock.p)*68,ease:'none',onUpdate:draw});}    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
    const pointer=e=>{if(active&&e.pointerType==='mouse')scene?.setPointer((e.clientX/innerWidth-.5)*.65,(e.clientY/innerHeight-.5)*.65);};
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.addEventListener('pointermove',pointer,{passive:true});
    observer=new IntersectionObserver(entries=>{
      if(!entries.some(e=>e.isIntersecting))return;observer.disconnect();
      import('../../three/LandingScene').then(async({createLandingScene})=>{
        await(await import('../../three/airliner')).preloadAirliner();if(!alive)return;
        try{scene=createLandingScene(canvasRef.current,{accent:accentNow(),sign:t('sign'),plain:true,externalPlane:true,onFrame:publish});sceneRef.current=scene;
          ro=new ResizeObserver(()=>{scene.setSize(innerWidth,innerHeight);schedule();});ro.observe(document.documentElement);
          scene.setSize(innerWidth,innerHeight);setReady(true);schedule();
        }catch{setFailed(true);}
      }).catch(()=>{if(alive)setFailed(true);});
    },{rootMargin:'100% 0px'});observer.observe(document.getElementById('now')||sectionRef.current);observer.observe(sectionRef.current);observer.observe(trackRef.current);
    const layout=new ResizeObserver(schedule);layout.observe(document.getElementById('main'));
    const environment=new MutationObserver(()=>scene?.refresh(accentNow()));environment.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-season']});
    schedule();
    return()=>{alive=false;cancelAnimationFrame(raf);taxi?.kill();ro?.disconnect();observer?.disconnect();layout.disconnect();environment.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.removeEventListener('pointermove',pointer);scene?.dispose();sceneRef.current=null;planeBus.landingPose=null;document.documentElement.classList.remove('airport-in-view');};
  },[reduced]);
  const status=statusFor(progress);
  const boarding={en:['BOARDING / THE NEXT CHAPTER','PASSENGER','SHUVAM SINGH','DESTINATION','TO BE ANNOUNCED','SEAT','25A + 25B?','STILL FLYING','The airport keeps moving. Stay a while and watch the arrivals.'],ne:['बोर्डिङ / अर्को अध्याय','यात्रु','शुवम सिंह','गन्तव्य','पछि घोषणा हुनेछ','सिट','25A + 25B?','अझै उड्दै','विमानस्थल चलिरहन्छ। केही बेर बसेर आगमन हेर्नुहोस्।'],mai:['बोर्डिङ / अगिला अध्याय','यात्री','शुवम सिंह','गन्तव्य','बादमे घोषणा होयत','सीट','25A + 25B?','एखनो उड़ैत','विमानस्थल चलैत रहैत अछि। कनेक ठहरि कए आगमन देखू।']}[lang];
  return <><div className="airport-world" aria-hidden="true"><canvas ref={canvasRef} className="airport-world-canvas" hidden={failed}/></div><section id="airport" ref={sectionRef} className={`fin airport-finale ${reduced?'is-reduced':''}`} aria-labelledby="fin-title">
    <div className="airport-concourse wrap">
      <header className="fin-head"><p className="t-label fin-kicker"><AirplaneLandingIcon size={18}/>{t('kicker')}</p><h2 id="fin-title" className="t-display fin-title">{t('title')}</h2><p className="t-lede">{t('imagination')}</p></header>
      <div className="airport-gate-grid"><Card t={t}/><Board t={t} status={status} traffic={traffic} live/></div>
      <div className="arrival-boarding"><p className="t-label">{boarding[0]}</p><div><span>{boarding[1]}<b>{boarding[2]}</b></span><span>{boarding[3]}<b>JKR → TBA</b><small>{boarding[4]}</small></span><span>{boarding[5]}<b>{boarding[6]}</b></span><strong>SUV-1478<small>{boarding[7]}</small></strong></div><span className="boarding-barcode" aria-hidden="true"/></div>
    </div>
    <Footer airport/>
    </section>
    <section id="landing" className="airport-touchdown" aria-label="SUV-1478 runway and touchdown" ref={trackRef}>
      <div className="airport-runway" ref={stageRef}>
        {!ready&&<p className="fin-loading">{failed?t('unavailable'):t('loading')}</p>}
        <div className="airport-runway-sign"><span className="t-label">SUV-1478 / JKR → TBA</span><h3>{progress<P.touchdown?t('beat2Title'):t('cardTitle')}</h3><p>{progress<P.touchdown?boarding[8]:progress<P.parked?t('beat3Text'):boarding[7]}</p></div>
        <div className="airport-ground-status"><span className="airport-status-dot"/><span>{t('st'+status)} · SUV-1478</span><span>KALYANI / 9N-KLY</span></div>
        <div className="airport-runway-end"><span>END OF RUNWAY / THE NEXT CHAPTER IS OPEN</span><span>DEPLOYMENT / {release.code} · {release.npt} · {release.shortCommit}</span></div>
      </div>
    </section></>;
}
