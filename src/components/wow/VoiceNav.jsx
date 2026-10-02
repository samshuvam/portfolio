import { useEffect, useRef, useState } from 'react';
import { waypoints } from '../../data/waypoints';
import { scrollToTarget } from '../../lib/motion';
import { useLang, useLocalize } from '../../i18n';
import overlay from '../../i18n/content/waypoints';
export default function VoiceNav() {
  const lang=useLang(), loc=useLocalize(overlay), recognition=useRef(null);
  const [listening,setListening]=useState(false), [message,setMessage]=useState('');
  const supported=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
  const l={en:['Say the destination.','Try “go to work”, “games”, “Janakpur” or “contact”. Speech recognition depends on your browser and may use its online service.','Start listening','Stop listening','Voice is unavailable here. Pick a destination below.','Listening…','Microphone unavailable. Use a destination button.','I heard “{text}”. Try a section name.'],ne:['गन्तव्य भन्नुहोस्।','“काम”, “खेल”, “जनकपुर” वा “सम्पर्क” भन्नुहोस्। आवाज पहिचान ब्राउजरअनुसार हुन्छ र अनलाइन सेवा प्रयोग हुन सक्छ।','सुन्न सुरु','सुन्न बन्द','यहाँ आवाज उपलब्ध छैन। तल गन्तव्य छान्नुहोस्।','सुन्दैछु…','माइक्रोफोन चलेन। तलको बटन प्रयोग गर्नुहोस्।','“{text}” सुनियो। खण्डको नाम भन्नुहोस्।'],mai:['गन्तव्य कहू।','“काम”, “खेल”, “जनकपुर” वा “सम्पर्क” कहू। आवाज पहचान ब्राउजर पर निर्भर अछि आ ऑनलाइन सेवा प्रयोग भऽ सकैत अछि।','सुनब शुरू','सुनब बन्द','एतय आवाज उपलब्ध नहि अछि। नीचाँ गन्तव्य चुनू।','सुनैत छी…','माइक्रोफोन नहि चलल। बटन प्रयोग करू।','“{text}” सुनलहुँ। खण्डक नाम कहू।']}[lang];
  useEffect(()=>{const hide=()=>{if(document.hidden)recognition.current?.abort();};document.addEventListener('visibilitychange',hide);return()=>{recognition.current?.abort();document.removeEventListener('visibilitychange',hide);};},[lang]);
  const start=()=>{
    if(listening){recognition.current?.stop();return;}
    const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Speech)return;
    const r=new Speech();recognition.current=r;r.lang=lang==='en'?'en-US':lang==='ne'?'ne-NP':'hi-IN';r.interimResults=false;
    r.onstart=()=>{setListening(true);setMessage(l[5]);};r.onend=()=>setListening(false);r.onerror=()=>{setListening(false);setMessage(l[6]);};
    r.onresult=e=>{const text=e.results[0][0].transcript.toLowerCase();const w=waypoints.find(w=>[w.id,w.label.toLowerCase(),loc(w).label.toLowerCase(),...({work:['काम'],arcade:['games','खेल'],contact:['सम्पर्क'],home:['janakpur','जनकपुर'],journey:['यात्रा']}[w.id]||[])].some(k=>text.includes(k)));setMessage(w?loc(w).label:l[7].replace('{text}',text));if(w)scrollToTarget(`#${w.id}`);};
    try{r.start();}catch{setMessage(l[6]);}
  };
  return <article className="magic-card card"><p className="t-label">02 / VOICE FLIGHT DESK</p><h3 className="t-title">{l[0]}</h3><p>{l[1]}</p><div className={`voice-orb ${listening?'is-listening':''}`} aria-hidden="true">{listening?'◉':'◎'}</div>{supported?<button type="button" className="btn btn-ghost btn-sm" onClick={start}>{listening?l[3]:l[2]}</button>:<p className="magic-status">{l[4]}</p>}<p className="magic-status" role="status">{message}</p><div className="magic-chips">{waypoints.filter(w=>['work','arcade','home','contact'].includes(w.id)).map(w=><button className="chip" type="button" key={w.id} onClick={()=>scrollToTarget(`#${w.id}`)}>{loc(w).label}</button>)}</div></article>;
}
