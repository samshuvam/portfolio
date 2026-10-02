import { lazy,Suspense,useState } from 'react';
import TirhutaName from './TirhutaName';
import Postcard from './Postcard';
import { useLang } from '../../i18n';
import { randomJoke } from '../../data/jokes';
import { noteJoke } from '../../lib/eggs';
import { useLocalize } from '../../i18n';
import overlay from '../../i18n/content/jokes';
import './wow.css';
const GestureLab=lazy(()=>import('./GestureLab'));
const VoiceNav=lazy(()=>import('./VoiceNav'));
export default function Wow() {
  const lang=useLang(),loc=useLocalize(overlay),[joke,setJoke]=useState(null);
  const l={en:['A few things you can’t put on a CV.','Try a little magic. Your hands, your voice, your name, and a souvenir from home.','Cabin humour','Another one','Loading…'],ne:['CV मा नअटाउने केही कुरा।','अलिकति जादु। तपाईंका हात, आवाज, नाम र घरको सम्झना।','केबिनको रमाइलो','अर्को जोक','लोड हुँदैछ…'],mai:['CV मे नहि अँटय बला किछु बात।','कनेक जादू। अहाँक हाथ, आवाज, नाम आ घरक याद।','केबिनक हँसी','दोसर चुटकुला','लोड होइत अछि…']}[lang];
  return (
    <section id="wow" className="section wow" aria-labelledby="wow-title">
      <div className="wrap">
        <header className="sec-head"><p className="t-label">MAGIC / IN-FLIGHT EXPERIMENTS</p><h2 id="wow-title" className="t-display">{l[0]}</h2><p className="t-lede">{l[1]}</p></header>
        <div className="magic-grid"><Suspense fallback={<article className="magic-card card">{l[4]}</article>}><GestureLab/></Suspense><Suspense fallback={<article className="magic-card card">{l[4]}</article>}><VoiceNav/></Suspense><TirhutaName/><Postcard/></div>
        <div className="magic-jokes"><p className="t-label">{l[2]}</p><p aria-live="polite">{joke?loc(joke).text:{en:'My code has no bugs. It has surprise features.',ne:'मेरो कोडमा बग छैन। अनपेक्षित सुविधा छन्।',mai:'हमर कोड मे बग नहि अछि। अनपेक्षित सुविधा अछि।'}[lang]}</p><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{const j=randomJoke();setJoke(j);noteJoke(j.id);}}>{l[3]}</button></div>
      </div>
    </section>
  );
}
