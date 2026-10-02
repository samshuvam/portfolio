import { useState } from 'react';
import { useLang } from '../../i18n';
import { findEgg } from '../../lib/eggs';
import { romanToDeva,toTirhuta } from './translit';
export default function TirhutaName(){
  const lang=useLang(),[roman,setRoman]=useState('Shuvam Singh'),[deva,setDeva]=useState('शुभम् सिंह'),[copied,setCopied]=useState(false);
  const l={en:['Your name, in Mithilakshar.','Try a Roman spelling, then correct the Devanagari spelling to match your name. A phonetic sketch, not a language translation.','Roman spelling','Devanagari spelling','Copy Tirhuta','Copied'],ne:['मिथिलाक्षरमा तपाईंको नाम।','रोमनमा लेख्नुहोस्, अनि देवनागरी हिज्जे मिलाउनुहोस्। यो ध्वनिअनुसार लिपि परिवर्तन हो।','रोमन हिज्जे','देवनागरी हिज्जे','तिरहुता कपी','कपी भयो'],mai:['मिथिलाक्षर मे अहाँक नाम।','रोमन मे लिखू, फेर देवनागरी हिज्जे सुधारू। ई ध्वनिक आधार पर लिपि परिवर्तन अछि।','रोमन हिज्जे','देवनागरी हिज्जे','तिरहुता कॉपी','कॉपी भेल']}[lang];
  const result=toTirhuta(deva);
  return <article className="magic-card card"><p className="t-label">03 / MITHILAKSHAR</p><h3 className="t-title">{l[0]}</h3><p>{l[1]}</p><label className="field-label" htmlFor="tirhuta-roman">{l[2]}</label><input className="input" id="tirhuta-roman" value={roman} maxLength={50} onChange={e=>{setRoman(e.target.value);setDeva(romanToDeva(e.target.value));setCopied(false);}}/><label className="field-label" htmlFor="tirhuta-deva">{l[3]}</label><input className="input" id="tirhuta-deva" value={deva} maxLength={70} onChange={e=>{setDeva(e.target.value);setCopied(false);}}/><p className="tirhuta-result font-tirhuta" aria-live="polite">{result||'𑒀'}</p><button className="btn btn-ghost btn-sm" type="button" disabled={!deva.trim()} onClick={async()=>{findEgg('tirhuta');try{await navigator.clipboard.writeText(result);setCopied(true);}catch{setCopied(false);}}}>{copied?l[5]:l[4]}</button></article>;
}
