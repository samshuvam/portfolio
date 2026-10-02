import { useEffect, useRef, useState } from 'react';
import { AirplaneLandingIcon, ArrowDownIcon, ChatCircleDotsIcon, DownloadSimpleIcon, SpeakerHighIcon } from '@phosphor-icons/react';
import { gsap, reducedMotion, scrollToTarget } from '../../lib/motion';
import { hidePlane, showPlane } from '../../three/planeBus';
import { findEgg } from '../../lib/eggs';
import { sound } from '../../lib/sound';
import { useT, useLang, localDigits } from '../../i18n';
import dict from '../../i18n/ui/finale';
import { P, beatFor, statusFor } from './timeline';
import './finale.css';

// The landing. Flight SS2504 took off from Janakpur in the intro; here, at
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
            <td>SS2504</td>
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
  const t = useT(dict), lang = useLang();
  const reduced = useRef(reducedMotion()).current;
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const sectionRef = useRef(null), stageRef = useRef(null), canvasRef = useRef(null);
  const kTagRef = useRef(null), pTagRef = useRef(null), sceneRef = useRef(null), controlRef = useRef(null);
  const signRef = useRef(t('sign'));
  useEffect(() => { signRef.current=t('sign'); sceneRef.current?.setSign(signRef.current); }, [lang]);
  useEffect(() => {
    let alive=true, scene, tween, visible=false, started=false, egged=false, resumeWhenVisible=false;
    const clock={p:reduced?1:0};
    const follow=()=>{
      scene?.setProgress(clock.p,true); scene?.renderOnce();
      if(alive) setProgress(clock.p);
      if(clock.p>=P.parked&&!egged){ egged=true; findEgg('kalyani'); }
    };
    const play=()=>{
      if(!scene) return;
      if(clock.p>=.999) clock.p=0;
      tween?.kill(); started=true; setPlaying(true);
      tween=gsap.to(clock,{p:1,duration:(1-clock.p)*19,ease:'none',onUpdate:follow,onComplete:()=>setPlaying(false)});
      if(!visible||document.hidden) tween.pause();
    };
    controlRef.current={play,pause:()=>{resumeWhenVisible=false;tween?.pause();setPlaying(false);},seek:p=>{resumeWhenVisible=false;tween?.kill();tween=null;clock.p=p;setPlaying(false);follow();}};
    const run=()=>{
      if(visible&&!document.hidden){
        if(!started&&!reduced) play();
      } else if(tween&&!tween.paused()) { tween.pause(); resumeWhenVisible=true; }
      if(visible&&!document.hidden&&tween&&resumeWhenVisible){resumeWhenVisible=false;tween.resume();}
    };
    const size=()=>scene?.setSize(stageRef.current.clientWidth,stageRef.current.clientHeight);
    const lazy=new IntersectionObserver(entries=>{
      if(!entries.some(e=>e.isIntersecting))return;
      lazy.disconnect();
      import('../../three/LandingScene.js').then(async ({createLandingScene})=>{
        await (await import('../../three/airliner.js')).preloadAirliner();
        if(!alive)return;
        try{
          scene=createLandingScene(canvasRef.current,{accent:accentNow(),sign:signRef.current,plain:true,onFrame:(p,labels)=>{
            placeTag(kTagRef.current,labels.kalyani,smooth(.66,.78,p));
            placeTag(pTagRef.current,labels.plane,smooth(.8,.88,p));
          },onTouchdown:()=>sound.whoosh(.4)});
          sceneRef.current=scene;size();follow();setReady(true);run();
        }catch{setFailed(true);}
      }).catch(()=>{if(alive)setFailed(true);});
    },{rootMargin:'100% 0px'});
    lazy.observe(stageRef.current);
    const seen=new IntersectionObserver(([e])=>{
      visible=e.isIntersecting&&e.intersectionRatio>=.15;
      if(visible)hidePlane('finale');else showPlane('finale');run();
    },{threshold:[0,.15]});seen.observe(stageRef.current);
    const ro=new ResizeObserver(size);ro.observe(stageRef.current);
    const mo=new MutationObserver(()=>scene?.refresh(accentNow()));
    mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','style']});
    document.addEventListener('visibilitychange',run);
    return()=>{alive=false;tween?.kill();lazy.disconnect();seen.disconnect();ro.disconnect();mo.disconnect();document.removeEventListener('visibilitychange',run);scene?.dispose();sceneRef.current=null;controlRef.current=null;showPlane('finale');};
  },[reduced]);
  const beat=beatFor(progress),status=statusFor(progress);
  return <section id="landing" ref={sectionRef} className="fin section" aria-labelledby="fin-title">
    <div className="wrap">
      <header className="fin-head"><p className="t-label fin-kicker"><AirplaneLandingIcon size={18}/>{t('kicker')}</p><h2 id="fin-title" className="t-display fin-title">{t('title')}</h2><p className="t-lede">{t('imagination')}</p></header>
      <div className="fin-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="fin-canvas" role="img" aria-label={t('srScene')} hidden={failed}/>
        {!ready&&<p className="fin-loading">{failed?t('unavailable'):t('loading')}</p>}
        <div className="fin-tag" ref={kTagRef} aria-hidden="true"><b>KALYANI</b><span>9N-KLY / {t('tagKalyani')}</span></div>
        <div className="fin-tag" ref={pTagRef} aria-hidden="true"><b>SS2504</b><span>{t('tagSs')}</span></div>
      </div>
      <div className="fin-controls"><button type="button" className="btn btn-accent" disabled={!ready} onClick={()=>playing?controlRef.current?.pause():controlRef.current?.play()}>{playing?t('pause'):progress>=.999?t('replay'):t('watch')}</button><label>{t('timeline')}<input type="range" min="0" max="1000" value={Math.round(progress*1000)} disabled={!ready} onChange={e=>controlRef.current?.seek(Number(e.target.value)/1000)} aria-valuetext={t('st'+status)}/></label><span className="t-label">{t('st'+status)}</span></div>
      <div className="fin-bottom"><div className="fin-slot"><Notes t={t} beat={beat} staticMode={false}/>{beat>=4&&<p className="fin-note">{t('stillFlying')}</p>}</div><Board t={t} status={status} live/></div>
      <Card t={t}/>
    </div>
  </section>;
}

import './visible.css';
