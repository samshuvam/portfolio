import { useEffect, useRef, useState } from 'react';
import { ArrowUpIcon, WaveformIcon } from '@phosphor-icons/react';
import { ask } from '../../../lib/qa';
import { useT, useLang } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone } from '../os';
import { AppShell } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

// Search the site, or ask the pocket yapper. Answers come from the site's
// own data (src/lib/qa.js), offline, in the selected language.
const SUGGEST = ['yap.s1', 'yap.s2', 'yap.s3', 'yap.s4', 'yap.s5'];
const APP_WORDS = [
  ['messages', ['message', 'text', 'sms', 'chat', 'सन्देश', 'मेसेज']],
  ['mail', ['mail', 'email', 'इमेल']],
  ['phone', ['call', 'phone', 'number', 'फोन']],
  ['music', ['music', 'song', 'संगीत', 'गीत']],
  ['games', ['game', 'snake', 'खेल']],
  ['photos', ['photo', 'picture', 'फोटो']],
  ['weather', ['weather', 'मौसम']],
  ['maps', ['map', 'where', 'नक्सा']],
];

export default function Yapper() {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  const [q, setQ] = useState('');
  const [log, setLog] = useState([]);
  const input = useRef(null);
  const list = useRef(null);
  useEffect(() => {
    // Only on desktop: on touch screens this would pop the keyboard up.
    if (!window.matchMedia?.('(pointer: fine)').matches) return undefined;
    const id = setTimeout(() => input.current?.focus({ preventScroll: true }), 80);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  const run = (text) => {
    const query = text.trim();
    if (!query) return;
    const lower = query.toLowerCase();
    const appHit = APP_WORDS.find(([, words]) => words.some((w) => lower.includes(w)));
    const res = ask(query, lang);
    sfx.blip(760);
    setLog((l) => [...l.slice(-8), { id: Date.now(), q: query, res, app: appHit && (!res || res.kind === 'none') ? appHit[0] : null }]);
    setQ('');
  };

  return (
    <AppShell title={t('app.yapper')} sub={t('yap.sub')} className="sos-yapper" scroll={false} flush>
      <div className="sos-yap-log" ref={list} data-lenis-prevent aria-live="polite">
        {!log.length && (
          <div className="sos-yap-empty">
            <WaveformIcon size={34} weight="bold" aria-hidden="true" />
            <p>{t('yap.hello')}</p>
            <div className="sos-yap-sugg">
              {SUGGEST.map((k) => (
                <button key={k} type="button" className="sos-pill is-soft is-sm" onClick={() => run(t(k))}>
                  {t(k)}
                </button>
              ))}
            </div>
          </div>
        )}
        {log.map((m) => (
          <div key={m.id} className="sos-yap-turn">
            <p className="sos-bubble is-me">{m.q}</p>
            <div className="sos-yap-ans">
              {m.res ? (
                <>
                  <b>{m.res.kind === 'none' ? t('yap.none') : m.res.title}</b>
                  <p>{m.res.text}</p>
                </>
              ) : (
                <p>{t('yap.empty')}</p>
              )}
              {m.app && (
                <button type="button" className="sos-pill is-sm" onClick={() => ctx.open(m.app)}>
                  {t('os.openApp', { app: t(`app.${m.app}`) })}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <form
        className="sos-compose sos-yap-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
      >
        <div className="sos-compose-row">
          <label className="sr-only" htmlFor="sos-yap-in">
            {t('yap.ph')}
          </label>
          <input id="sos-yap-in" ref={input} className="sos-field" type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('yap.ph')} autoComplete="off" />
          <button type="submit" className="sos-send" aria-label={t('yap.ask')} disabled={!q.trim()}>
            <ArrowUpIcon size={18} weight="bold" />
          </button>
        </div>
        {lang !== 'en' && <p className="sos-note sos-yap-lang">{t('yap.enNote')}</p>}
      </form>
    </AppShell>
  );
}
