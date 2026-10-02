import { LANGS, useLang, setLang } from '../../i18n';
import { findEgg } from '../../lib/eggs';
const seen = new Set();
export default function LangSwitch({ variant = 'nav' }) {
  const lang = useLang();
  seen.add(lang);
  return <label className={`lang-switch lang-${variant}`}>
    <span className="sr-only">Language / भाषा</span>
    <select aria-label="Language / भाषा" value={lang} onChange={e => {
      seen.add(e.target.value);
      setLang(e.target.value);
      if (seen.size === LANGS.length) findEgg('polyglot');
    }}>{LANGS.map(l => <option key={l.id} value={l.id}>{variant === 'nav' ? l.short : l.native}</option>)}</select>
  </label>;
}
