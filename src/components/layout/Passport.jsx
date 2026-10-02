import Dialog from '../ui/Dialog';
import { EGGS } from '../../lib/eggs';
import { setState, useStore } from '../../lib/store';
import { useLang, useLocalize, localDigits } from '../../i18n';
import overlay from '../../i18n/content/eggs';
const close = () => setState({ passport: false });
export default function Passport() {
  const open = useStore(s => s.passport), found = useStore(s => s.eggs);
  const lang = useLang(), loc = useLocalize(overlay);
  const l = { en: ['Your passport.', 'Collect stamps as you explore. Empty spaces come with a clue.', 'found'], ne: ['तपाईंको राहदानी।', 'घुम्दै छाप सङ्कलन गर्नुहोस्। खाली ठाउँमा सङ्केत छ।', 'भेटियो'], mai: ['अहाँक पासपोर्ट।', 'घुमैत छाप जमा करू। खाली ठाम मे संकेत अछि।', 'भेटल'] }[lang];
  const count = EGGS.filter(e => found.includes(e.id)).length;
  return <Dialog open={open} onClose={close} label={l[0]} className="passport-panel">
    <p className="t-label">SS2504 / JKR → ???</p><h2 className="t-title">{l[0]}</h2><p className="t-lede">{l[1]}</p>
    <p className="passport-count">{localDigits(count)} / {localDigits(EGGS.length)} {l[2]}</p>
    <progress value={count} max={EGGS.length} aria-label={l[2]} />
    <div className="passport-stamps">{EGGS.map(e => { const egg = loc(e); const done = found.includes(e.id); return <article className={`passport-stamp ${done ? 'is-found' : ''}`} key={e.id}><strong>{done ? egg.stamp : '?'}</strong><h3>{egg.name}</h3><p>{egg.hint}</p></article>; })}</div>
  </Dialog>;
}
