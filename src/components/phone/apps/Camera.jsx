import { useEffect, useRef, useState } from 'react';
import { CameraIcon, DownloadSimpleIcon, ImageIcon } from '@phosphor-icons/react';
import { useT } from '../../../i18n';
import { useCopy } from '../../../i18n/Text';
import dict from '../../../i18n/ui/phone';
import { usePhone, useBack } from '../os';
import { AppShell } from '../parts';
import { KEEPSAKE_FRAMES, frameDataUrl, composeKeepsake } from '../../../lib/keepsakes';
import { sfx } from '../audio';
import '../apps.css';
import './camera-v3.css';

export default function Camera(){
  const t=useT(dict),c=useCopy(),phone=usePhone(),video=useRef(null),stream=useRef(null),request=useRef(0),picker=useRef(null);
  const [state,setCamera]=useState('idle'),[raw,setRaw]=useState(null),[shot,setShot]=useState(null),[frameId,setFrame]=useState('nepal-1'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const frame=KEEPSAKE_FRAMES.find(f=>f.id===frameId);
  const stop=()=>{request.current++;stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(video.current)video.current.srcObject=null;};
  useEffect(()=>()=>stop(),[]);
  useEffect(()=>{if(!phone.visible){stop();setCamera('idle');}},[phone.visible]);
  useEffect(()=>{if(!raw){setShot(null);return;}let alive=true;setBusy(true);composeKeepsake(raw,frame).then(url=>{if(alive)setShot(url);}).catch(()=>{if(alive)setError(c('Could not read this image. Try a JPG, PNG or WebP.'));}).finally(()=>{if(alive)setBusy(false);});return()=>{alive=false;};},[raw,frameId]);
  useBack(()=>{if(!raw)return false;setRaw(null);return true;});
  const start=async()=>{setError('');if(!navigator.mediaDevices?.getUserMedia){setCamera('unsupported');return;}setCamera('starting');const id=++request.current;try{const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1200},height:{ideal:1600}},audio:false});if(id!==request.current){media.getTracks().forEach(track=>track.stop());return;}stream.current=media;video.current.srcObject=media;await video.current.play();setCamera('live');}catch{if(id===request.current)setCamera('denied');}};
  const snap=()=>{const v=video.current;if(!v?.videoWidth)return;const cv=document.createElement('canvas');cv.width=1200;cv.height=1600;const g=cv.getContext('2d'),s=Math.max(1200/v.videoWidth,1600/v.videoHeight);g.translate(1200,0);g.scale(-1,1);g.drawImage(v,(1200-v.videoWidth*s)/2,(1600-v.videoHeight*s)/2,v.videoWidth*s,v.videoHeight*s);setRaw(cv.toDataURL('image/jpeg',.97));sfx.shutter();stop();setCamera('idle');};
  const choose=e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setError('');if(!/^image\/(jpeg|png|webp|avif)$/.test(file.type)||file.size>20*1024*1024){setError(c('Choose a JPG, PNG or WebP under 20 MB.'));return;}stop();setCamera('idle');const reader=new FileReader();reader.onload=()=>setRaw(reader.result);reader.onerror=()=>setError(c('Could not read this image. Try a JPG, PNG or WebP.'));reader.readAsDataURL(file);};
  return <AppShell title={t('app.camera')} sub={c('A little Nepal, in your frame.')} className="sos-camera" dark>
    <div className="sos-cam keepsake-camera"><div className="sos-cam-view">
      <video ref={video} playsInline muted className={state==='live'&&!raw?'is-on':''} style={{filter:frame.filter}} aria-hidden="true"/>
      {shot&&<img src={shot} alt={c('Your photo, framed for Nepal.') } className="sos-cam-shot"/>}
      {!raw&&<img src={frameDataUrl(frame)} className="sos-cam-frame" alt=""/>}
      {state!=='live'&&!raw&&<div className="sos-cam-intro"><CameraIcon size={28}/><p>{state==='denied'?t('cam.denied'):state==='unsupported'?t('cam.unsupported'):c('Take a photo or choose one from your device.')}</p>{state!=='unsupported'&&<button className="sos-pill" onClick={start} disabled={state==='starting'}>{state==='starting'?t('cam.starting'):t('cam.start')}</button>}<button className="sos-pill is-ghost" onClick={()=>picker.current.click()}><ImageIcon size={15}/>{c('Choose photo')}</button></div>}
      {busy&&<span className="keepsake-working" role="status">{c('Framing…')}</span>}
    </div>
    <label className="keepsake-select">{c('Frame and filter')}<select value={frameId} onChange={e=>setFrame(e.target.value)}>{KEEPSAKE_FRAMES.map(f=><option key={f.id} value={f.id}>{c(f.name)}</option>)}</select><span>{c('20 frames · made for Nepal')}</span></label>
    <p className="sos-cam-privacy">{c('Stays on your device. Downloads include a small watermark.')}</p>{error&&<p className="keepsake-error" role="alert">{error}</p>}
    <div className="sos-cam-ctrl">{raw?<><button className="sos-pill is-ghost" onClick={()=>{setRaw(null);setShot(null);}}>{c('Choose another')}</button><a className="sos-pill" href={shot||undefined} download={`Nepal-keepsake-${frame.id}.jpg`} aria-disabled={busy||!shot} onClick={e=>{if(busy||!shot)e.preventDefault();}}><DownloadSimpleIcon size={16}/>{c('Download keepsake')}</a></>:state==='live'?<button className="sos-shutter" aria-label={t('cam.snap')} onClick={snap}><span/></button>:null}</div>
    <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={choose}/></div>
  </AppShell>;
}
