import { useEffect, useRef, useState } from 'react';
import { AirplaneTiltIcon } from '@phosphor-icons/react';
import { findEgg } from '../../lib/eggs';
import { useLang } from '../../i18n';
const VERSION = '0.10.22';
export default function GestureLab() {
  const lang = useLang(), video = useRef(null), root = useRef(null), plane = useRef(null);
  const runtime = useRef({ stream:null, model:null, raf:0, ticket:0 });
  const [status, setStatus] = useState('idle');
  const l = { en: ['Look, no mouse.', 'Steer with your fingertip. Camera frames stay on your device. You can also drag across the sky.', 'Enable hand control', 'Stop camera', 'Loading the hand tracker…', 'Camera unavailable. You can still drag to fly.', 'Hold up one hand in front of the camera.', 'Hand found. You are the pilot.'], ne: ['माउसबिना उडान।', 'औँलाले उडाउनुहोस्। क्यामेराका तस्बिर तपाईंको उपकरणमै रहन्छन्। आकाशमा तानेर पनि चलाउन सकिन्छ।', 'हातले चलाउनुहोस्', 'क्यामेरा बन्द', 'हात पहिचान लोड हुँदैछ…', 'क्यामेरा चलेन। तानेर उडाउन सक्नुहुन्छ।', 'क्यामेराअगाडि एउटा हात राख्नुहोस्।', 'हात भेटियो। अब तपाईं पाइलट।'], mai: ['माउसबिना उड़ान।', 'अंगुरी सँ उड़ाउ। कैमरा चित्र अहाँक उपकरण पर रहैत अछि। आकाश मे खींचि क सेहो चला सकैत छी।', 'हाथ सँ चलाउ', 'कैमरा बन्द', 'हाथ चिन्हबाक मॉडल लोड होइत अछि…', 'कैमरा नहि चलल। खींचि क उड़ा सकैत छी।', 'कैमराक सोझाँ एकटा हाथ राखू।', 'हाथ भेटल। अहाँ पायलट छी।'] }[lang];
  const stop = () => {
    const r=runtime.current; r.ticket++; cancelAnimationFrame(r.raf); r.raf=0;
    r.stream?.getTracks().forEach(t=>t.stop()); r.stream=null;
    r.model?.close(); r.model=null;
    if(video.current) video.current.srcObject=null;
  };
  const steer = (x,y) => { if(plane.current) plane.current.style.transform=`translate(${(x-.5)*240}px,${(y-.5)*130}px) rotate(${(x-.5)*65}deg)`; };
  useEffect(() => {
    const hide = () => { if(document.hidden){stop();setStatus('idle');} };
    const io = new IntersectionObserver(([e])=>{if(!e.isIntersecting && runtime.current.stream){stop();setStatus('idle');}});
    if(root.current) io.observe(root.current);
    document.addEventListener('visibilitychange',hide);
    return ()=>{stop();io.disconnect();document.removeEventListener('visibilitychange',hide);};
  }, []);
  const start = async () => {
    stop(); const ticket=runtime.current.ticket; setStatus('loading');
    let model, stream;
    try {
      if(!navigator.mediaDevices?.getUserMedia) throw new Error('camera unavailable');
      stream=await navigator.mediaDevices.getUserMedia({video:{width:320,height:240,facingMode:'user'},audio:false});
      if(runtime.current.ticket!==ticket){stream.getTracks().forEach(t=>t.stop());return;}
      runtime.current.stream=stream; video.current.srcObject=stream; await video.current.play();
      const url=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/vision_bundle.mjs`;
      const {FilesetResolver,HandLandmarker}=await import(/* @vite-ignore */ url);
      const vision=await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`);
      model=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:1});
      if(runtime.current.ticket!==ticket){model.close();return;}
      runtime.current.model=model; setStatus('tracking');
      let last=0, stamped=false;
      const frame=now=>{
        if(runtime.current.ticket!==ticket) return;
        if(now-last>85 && video.current?.readyState>=2){
          last=now;
          try{const hand=model.detectForVideo(video.current,now).landmarks[0];if(hand){steer(1-hand[8].x,hand[8].y);setStatus('found');if(!stamped){findEgg('gesture');stamped=true;}}else setStatus('tracking');}
          catch{stop();setStatus('error');return;}
        }
        runtime.current.raf=requestAnimationFrame(frame);
      };
      runtime.current.raf=requestAnimationFrame(frame);
    } catch { if(runtime.current.ticket===ticket){stop();setStatus('error');} }
  };
  return <article ref={root} className="magic-card card"><p className="t-label">01 / AIR GESTURES</p><h3 className="t-title">{l[0]}</h3><p>{l[1]}</p>
    <div className="gesture-sky" role="application" aria-label={l[0]} tabIndex={0} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(e.buttons || e.pointerType==='mouse'){const r=e.currentTarget.getBoundingClientRect();steer((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);}}} onKeyDown={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();steer(e.key==='ArrowLeft'? 0.1 : e.key==='ArrowRight'? 0.9 : .5,e.key==='ArrowUp'? 0.1 : e.key==='ArrowDown'? 0.9 : .5);}}}><span ref={plane}><AirplaneTiltIcon size={58} weight="duotone"/></span><video ref={video} muted playsInline className={`gesture-video ${runtime.current.stream?'is-on':''}`} aria-hidden="true"/></div>
    <button type="button" className="btn btn-ghost btn-sm" onClick={()=>{if(status==='loading'||status==='tracking'||status==='found'){stop();setStatus('idle');}else start();}}>{['loading','tracking','found'].includes(status)?l[3]:l[2]}</button>
    <p className="magic-status" role="status">{status==='loading'?l[4]:status==='error'?l[5]:status==='tracking'?l[6]:status==='found'?l[7]:''}</p>
  </article>;
}
