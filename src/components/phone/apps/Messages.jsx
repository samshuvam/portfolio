import { useEffect, useRef, useState } from 'react';
import { ArrowUpIcon, CheckIcon, PhoneIcon, UserCircleIcon, WarningCircleIcon, WhatsappLogoIcon } from '@phosphor-icons/react';
import { sendMessage } from '../../../lib/relay';
import { contextAvatar as portrait } from '../../../lib/imagery';
import { useT, useLang } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone } from '../os';
import { AppShell } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

const KEY = 'ss-phone-thread';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WA = 'https://wa.me/9779819880850';
const QUICK = ['msg.q1', 'msg.q2', 'msg.q3', 'msg.q4'];

// The thread outlives the app (a send can finish after the app is closed).
let cache = null;
const loadThread = () => {
  if (cache) {
    try {
      if (sessionStorage.getItem(KEY) === null) cache = null; // cleared in Settings
    } catch {
      /* storage blocked: keep the in-memory thread */
    }
    if (cache) return cache;
  }
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return Array.isArray(v) ? v.map((m) => (m.status === 'sending' ? { ...m, status: 'failed' } : m)) : null;
  } catch {
    return null;
  }
};
const saveThread = (th) => {
  cache = th;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(th.slice(-40)));
  } catch {
    /* ignore */
  }
};
const uid = () => Math.random().toString(36).slice(2, 9);
const nowStamp = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function Messages() {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  const alive = useRef(true);
  const [thread, setThreadState] = useState(() => loadThread() || []);
  const setThread = (fn) => {
    const next = typeof fn === 'function' ? fn(loadThread() || []) : fn;
    saveThread(next);
    if (alive.current) setThreadState(next);
  };
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [details, setDetails] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState(null);
  const [coolUntil, setCoolUntil] = useState(0);
  const [, tick] = useState(0);
  const list = useRef(null);
  const input = useRef(null);
  const timers = useRef([]);

  const later = (fn, ms) => timers.current.push(setTimeout(() => alive.current && fn(), ms));
  useEffect(() => {
    alive.current = true;
    const tm = timers.current;
    return () => {
      alive.current = false;
      tm.forEach(clearTimeout);
    };
  }, []);

  // First visit: Shuvam "types" a greeting.
  useEffect(() => {
    if (thread.length) return;
    setTyping(true);
    later(() => {
      setThread([{ id: uid(), from: 'him', key: 'msg.g1', at: nowStamp() }]);
      sfx.blip(880);
    }, 900);
    later(() => {
      setThread((th) => [...th, { id: uid(), from: 'him', key: 'msg.g2', at: nowStamp() }]);
      setTyping(false);
      sfx.blip(990);
    }, 2100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread, typing, details]);

  useEffect(() => {
    if (coolUntil <= Date.now()) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [coolUntil]);
  const coolLeft = Math.max(0, Math.ceil((coolUntil - Date.now()) / 1000));
  const sentCount = thread.filter((m) => m.from === 'me' && m.status === 'delivered').length;

  const deliver = async (msg) => {
    ctx.flash('sending', {}, 30000);
    setThread((th) => th.map((m) => (m.id === msg.id ? { ...m, status: 'sending' } : m)));
    try {
      await sendMessage({
        name: msg.name || 'ShuvamOS visitor',
        ...(msg.email ? { email: msg.email, _replyto: msg.email } : {}),
        message: msg.text,
        _subject: `ShuvamOS message${msg.name ? ` from ${msg.name}` : ''}`,
      });
      setThread((th) => th.map((m) => (m.id === msg.id ? { ...m, status: 'delivered' } : m)));
      ctx.flash('sent', {}, 1800);
      sfx.sent();
      if (!alive.current) return;
      setCoolUntil(Date.now() + 15000);
      setTyping(true);
      later(() => {
        setTyping(false);
        sfx.blip(880);
        setThread((th) => [...th, { id: uid(), from: 'him', key: msg.email ? 'msg.r1mail' : 'msg.r1anon', vars: { email: msg.email }, auto: true, at: nowStamp() }]);
      }, 1600);
    } catch {
      setThread((th) => th.map((m) => (m.id === msg.id ? { ...m, status: 'failed' } : m)));
      ctx.flash('failed', {}, 2200);
    }
  };

  const send = (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (text.length < 2) {
      setErr(t('msg.errShort'));
      input.current?.focus({ preventScroll: true });
      return;
    }
    if (email.trim() && !EMAIL.test(email.trim())) {
      setDetails(true);
      setErr(t('msg.errEmail'));
      return;
    }
    if (coolLeft > 0) {
      setErr(t('msg.cool', { n: coolLeft }));
      return;
    }
    if (sentCount >= 6) {
      setErr(t('msg.limit'));
      return;
    }
    setErr(null);
    const msg = { id: uid(), from: 'me', text: text.slice(0, 1500), name: name.trim().slice(0, 80), email: email.trim(), status: 'sending', at: nowStamp() };
    setThread((th) => [...th, msg]);
    setDraft('');
    deliver(msg);
  };

  const lastMine = [...thread].reverse().find((m) => m.from === 'me')?.text;
  const waText = draft.trim() || lastMine || t('msg.waDefault');

  return (
    <AppShell
      title={t('msg.name')}
      sub={t('msg.status')}
      className="sos-msgs"
      scroll={false}
      flush
      actions={
        <button type="button" className="sos-iconbtn" aria-label={t('msg.call')} onClick={() => ctx.open('phone')}>
          <PhoneIcon size={20} weight="fill" />
        </button>
      }
    >
      <div className="sos-msg-list" ref={list} data-lenis-prevent role="log" aria-live="polite" aria-label={t('msg.thread')}>
        <div className="sos-msg-who">
          {portrait ? <img src={portrait.srcset?.[0]?.src || portrait.src} alt="" width="56" height="56" /> : <UserCircleIcon size={56} />}
          <p>{t('msg.who')}</p>
        </div>
        {thread.map((m) => (
          <div key={m.id} className={`sos-bubble-row is-${m.from}`}>
            <p className={`sos-bubble is-${m.from}`} lang={m.from === 'me' ? undefined : lang}>
              {m.from === 'me' ? m.text : t(m.key, m.vars)}
            </p>
            {m.from === 'me' && (
              <span className={`sos-bubble-meta is-${m.status}`}>
                {m.status === 'sending' && t('msg.sending')}
                {m.status === 'delivered' && (
                  <>
                    <CheckIcon size={11} weight="bold" /> {t('msg.delivered')}
                  </>
                )}
                {m.status === 'failed' && (
                  <button type="button" onClick={() => deliver(m)}>
                    <WarningCircleIcon size={12} weight="fill" /> {t('msg.failed')}
                  </button>
                )}
              </span>
            )}
            {m.auto && <span className="sos-bubble-meta">{t('msg.auto')}</span>}
          </div>
        ))}
        {typing && (
          <div className="sos-bubble-row is-him">
            <p className="sos-bubble is-him sos-typing" aria-label={t('msg.typing')}>
              <i />
              <i />
              <i />
            </p>
          </div>
        )}
      </div>

      <div className="sos-quick" role="group" aria-label={t('msg.quick')}>
        {QUICK.map((k) => (
          <button
            key={k}
            type="button"
            className="sos-pill is-soft is-sm"
            onClick={() => {
              setDraft(t(k));
              setErr(null);
              input.current?.focus({ preventScroll: true });
            }}
          >
            {t(k)}
          </button>
        ))}
        <a className="sos-pill is-sm sos-wa" href={`${WA}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer">
          <WhatsappLogoIcon size={15} weight="fill" /> {t('msg.wa')}
        </a>
      </div>

      <form className="sos-compose" onSubmit={send} noValidate>
        <button type="button" className={`sos-compose-who ${details ? 'is-open' : ''}`} aria-expanded={details} onClick={() => setDetails((v) => !v)}>
          {details ? t('msg.hideDetails') : name || email ? t('msg.from', { who: name || email }) : t('msg.addDetails')}
        </button>
        {details && (
          <div className="sos-compose-details">
            <label className="sr-only" htmlFor="sos-msg-name">
              {t('msg.yourName')}
            </label>
            <input id="sos-msg-name" className="sos-field" placeholder={t('msg.yourName')} autoComplete="name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            <label className="sr-only" htmlFor="sos-msg-email">
              {t('msg.yourEmail')}
            </label>
            <input
              id="sos-msg-email"
              className="sos-field"
              type="email"
              inputMode="email"
              placeholder={t('msg.yourEmail')}
              autoComplete="email"
              value={email}
              aria-invalid={email.trim() && !EMAIL.test(email.trim()) ? 'true' : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}
        <div className="sos-compose-row">
          <label className="sr-only" htmlFor="sos-msg-text">
            {t('msg.placeholder')}
          </label>
          <textarea
            id="sos-msg-text"
            ref={input}
            className="sos-field sos-compose-text"
            rows={1}
            maxLength={1500}
            placeholder={t('msg.placeholder')}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (err) setErr(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button type="submit" className="sos-send" aria-label={t('msg.send')} disabled={!draft.trim()}>
            <ArrowUpIcon size={18} weight="bold" />
          </button>
        </div>
        <p className="sos-compose-err" role="alert">
          {err}
        </p>
      </form>
    </AppShell>
  );
}
