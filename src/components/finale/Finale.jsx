import { useEffect, useRef, useState } from 'react';
import { AirplaneLandingIcon, ChatCircleDotsIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { reducedMotion, scrollToTarget } from '../../lib/motion';
import { hidePlane, showPlane } from '../../three/planeBus';
import { TRAFFIC } from '../../three/trafficSchedule';
import Footer from '../layout/Footer';
import { useT, useLang, localDigits } from '../../i18n';
import dict from '../../i18n/ui/finale';
import release from '../../data/release.generated.json';
import './finale.css';

// A separate airport observation deck. The main cruise aircraft never
// hands over to this scene; only background traffic lands here.

function Board({ t, traffic }) {
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
            <td className="is-live" aria-live="polite">
              <span className="fin-flip">
                AIRBORNE
              </span>
            </td>
            <td className="is-live">OPEN</td>
          </tr>
          {TRAFFIC.map(f=><tr key={f.call}><td>{f.call}</td><td>{f.from}<small className="traffic-destination">→ {f.to}</small></td><td className={traffic?.some(r=>r.call===f.call)?'is-live':'is-dim'}>{traffic?.find(r=>r.call===f.call)?.status||'EXPECTED'}</td><td className="is-dim">{f.call==='SHUV-ACB'?'09R':'27L'}</td></tr>)}
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
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[traffic,setTraffic]=useState([]);
  const trackRef=useRef(null),canvasRef=useRef(null),sceneRef=useRef(null);
  useEffect(()=>{
    let alive=true,scene,observer,resize;
    import('../../three/AirportScene').then(({createAirportScene})=>{
      if(!alive)return;
      try{scene=createAirportScene(canvasRef.current,{onTraffic:rows=>{if(alive)setTraffic(rows);}});sceneRef.current=scene;
        resize=new ResizeObserver(()=>{const r=canvasRef.current.getBoundingClientRect();scene.resize(r.width,r.height);});resize.observe(canvasRef.current);
        scene.ready.then(()=>{if(alive)setReady(true);}).catch(()=>{if(alive)setFailed(true);});
        observer=new IntersectionObserver(([e])=>{scene.setActive(e.isIntersecting&&!reduced);if(e.isIntersecting)hidePlane('airport-observation');else showPlane('airport-observation');},{threshold:.05});observer.observe(trackRef.current);
      }catch{setFailed(true);}
    }).catch(()=>{if(alive)setFailed(true);});
    return()=>{alive=false;observer?.disconnect();resize?.disconnect();scene?.dispose();sceneRef.current=null;showPlane('airport-observation');};
  },[reduced]);
  const pointer=e=>{if(e.pointerType!=='mouse')return;const r=trackRef.current.getBoundingClientRect();sceneRef.current?.setPointer((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5);};
  const text={en:['OBSERVATION DECK / OPEN DESTINATIONS','The airport never stands still.','Arrivals, connections, and a little life between flights. SUV-1478 is still out there, following its own route.','Mostly arrivals · Remote departures on 09R','LIVE AIRPORT / 27L + 09R'],ne:['अवलोकन डेक / खुला गन्तव्य','विमानस्थल चलिरहन्छ।','आगमन र नयाँ यात्राहरू। SUV-1478 अझै आफ्नै मार्गमा उड्दैछ।','धेरैजसो आगमन · टाढाको 09R बाट प्रस्थान','प्रत्यक्ष विमानस्थल / 27L + 09R'],mai:['अवलोकन डेक / खुलल गन्तव्य','विमानस्थल चलैत रहैत अछि।','आगमन आ नव यात्रा। SUV-1478 एखनो अपन मार्ग पर उड़ैत अछि।','अधिकतर आगमन · दूरक 09R सँ प्रस्थान','प्रत्यक्ष विमानस्थल / 27L + 09R']}[lang];
  return <><section id="airport" className="fin airport-finale" aria-labelledby="fin-title">
    <div className="airport-concourse wrap">
      <header className="fin-head"><p className="t-label fin-kicker"><AirplaneLandingIcon size={18}/>{text[0]}</p><h2 id="fin-title" className="t-display fin-title">{text[1]}</h2><p className="t-lede">{text[2]}</p></header>
      <div className="airport-gate-grid"><Card t={t}/><Board t={t} traffic={traffic}/></div>
      <div className="arrival-boarding"><p className="t-label">BOARDING / THE NEXT CHAPTER</p><div><span>PASSENGER<b>SHUVAM SINGH</b></span><span>DESTINATION<b>JKR → TBA</b><small>{t('gateFuture')}</small></span><span>SEAT<b>25A + 25B?</b></span><strong>SUV-1478<small>STILL FLYING</small></strong></div><span className="boarding-barcode" aria-hidden="true"/></div>
    </div>
    <Footer airport/>
  </section>
  <section id="landing" className="airport-observation" aria-label="Airport observation deck" ref={trackRef} onPointerMove={pointer}>
    <div className="airport-deck-heading"><span className="t-label">{text[4]}</span><span>{text[3]}</span></div>
    <div className="airport-panorama"><canvas ref={canvasRef} aria-label="Distant airport with terminals, arriving aircraft and ground traffic"/>{!ready&&<p className="fin-loading">{failed?t('unavailable'):t('loading')}</p>}
      <div className="airport-deck-live"><span className="airport-status-dot"/> {traffic.filter(r=>r.status!=='EXPECTED').map(r=><span key={r.call}>{r.call} · {r.status}</span>)}</div>
      <span className="airport-deck-caption">SHUVAM INTERNATIONAL / THE NEXT CHAPTER IS OPEN</span>
    </div>
    <div className="airport-deployment">{release.code} · {release.npt} · {release.shortCommit}</div>
  </section></>;
}
