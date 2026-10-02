import { useEffect, useRef, useState } from 'react';
import { ArrowUpIcon, CheckCircleIcon, EnvelopeOpenIcon, NotePencilIcon, PaperPlaneTiltIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { sendMessage } from '../../../lib/relay';
import { profile } from '../../../data/profile';
import { useT } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone, useBack, store } from '../os';
import { AppShell } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INBOX = ['m1', 'm2', 'm3'];

function Compose({ onDone }) {
  const t = useT(dict);
  const ctx = usePhone();
  const alive = useRef(true);
  const [f, setF] = useState(() => store.read('ss-phone-mail', { name: '', email: '', subject: '', body: '' }));
  const [errors, setErrors] = useState({});
  const [state, setStateMail] = useState('idle'); // idle | sending | sent | failed
  const first = useRef(null);
  useEffect(() => {
    alive.current = true;
    if (window.matchMedia?.('(pointer: fine)').matches) first.current?.focus({ preventScroll: true });
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    store.write('ss-phone-mail', state === 'sent' ? null : f);
  }, [f, state]);

  const set = (k) => (e) => {
    setF((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: null }));
  };
  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(f.subject || t('mail.defSubject'))}&body=${encodeURIComponent(f.body)}`;

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!f.email.trim()) err.email = t('mail.errNeed');
    else if (!EMAIL.test(f.email.trim())) err.email = t('msg.errEmail');
    if (f.body.trim().length < 5) err.body = t('mail.errBody');
    setErrors(err);
    if (Object.keys(err).length) {
      document.getElementById(err.email ? 'sos-mail-email' : 'sos-mail-body')?.focus();
      return;
    }
    setStateMail('sending');
    ctx.flash('sending', {}, 30000);
    try {
      await sendMessage({
        name: f.name.trim() || 'ShuvamOS visitor',
        email: f.email.trim(),
        _replyto: f.email.trim(),
        _subject: `ShuvamOS mail: ${(f.subject || 'Hello').slice(0, 120)}`,
        message: f.body.trim().slice(0, 4000),
      });
      sfx.sent();
      ctx.flash('sent', {}, 1800);
      if (alive.current) setStateMail('sent');
    } catch {
      ctx.flash('failed', {}, 2200);
      if (alive.current) setStateMail('failed');
    }
  };

  if (state === 'sent')
    return (
      <div className="sos-mail-done" role="status">
        <CheckCircleIcon size={54} weight="fill" />
        <h3>{t('mail.sent')}</h3>
        <p>{t('mail.sentBody', { email: f.email })}</p>
        <button
          type="button"
          className="sos-pill"
          onClick={() => {
            setF({ name: f.name, email: f.email, subject: '', body: '' });
            onDone();
          }}
        >
          {t('mail.back')}
        </button>
      </div>
    );

  return (
    <form className="sos-mail-form" onSubmit={submit} noValidate>
      <div className="sos-mail-line">
        <span>{t('mail.to')}</span>
        <b className="sos-mail-to">{profile.email}</b>
      </div>
      <label className="sos-mail-line">
        <span>{t('mail.fromName')}</span>
        <input ref={first} className="sos-mail-in" value={f.name} maxLength={80} autoComplete="name" onChange={set('name')} placeholder={t('mail.namePh')} />
      </label>
      <label className="sos-mail-line">
        <span>{t('mail.from')}</span>
        <input
          id="sos-mail-email"
          className="sos-mail-in"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={f.email}
          onChange={set('email')}
          placeholder={t('mail.emailPh')}
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={errors.email ? 'sos-mail-email-err' : undefined}
        />
      </label>
      {errors.email && (
        <p className="sos-err" id="sos-mail-email-err">
          {errors.email}
        </p>
      )}
      <label className="sos-mail-line">
        <span>{t('mail.subject')}</span>
        <input className="sos-mail-in" value={f.subject} maxLength={120} onChange={set('subject')} placeholder={t('mail.defSubject')} />
      </label>
      <label className="sr-only" htmlFor="sos-mail-body">
        {t('mail.body')}
      </label>
      <textarea
        id="sos-mail-body"
        className="sos-mail-body"
        value={f.body}
        maxLength={4000}
        onChange={set('body')}
        placeholder={t('mail.bodyPh')}
        aria-invalid={errors.body ? 'true' : undefined}
        aria-describedby={errors.body ? 'sos-mail-body-err' : undefined}
      />
      {errors.body && (
        <p className="sos-err" id="sos-mail-body-err">
          {errors.body}
        </p>
      )}
      {state === 'failed' && (
        <div className="sos-mail-fail" role="alert">
          <WarningCircleIcon size={18} weight="fill" />
          <span>{t('mail.failed')}</span>
          <a className="sos-pill is-sm is-ghost" href={mailto}>
            {t('mail.openApp')}
          </a>
        </div>
      )}
      <div className="sos-mail-actions">
        <a className="sos-mail-alt" href={mailto}>
          {t('mail.useApp')}
        </a>
        <button type="submit" className="sos-pill" disabled={state === 'sending'}>
          {state === 'sending' ? t('msg.sending') : t('mail.send')}
          {state === 'sending' ? null : <ArrowUpIcon size={16} weight="bold" />}
        </button>
      </div>
      <p className="sos-note">{t('mail.privacy')}</p>
    </form>
  );
}

export default function Mail() {
  const t = useT(dict);
  const [view, setView] = useState('inbox'); // inbox | read:<id> | compose
  useBack(() => {
    if (view === 'inbox') return false;
    setView('inbox');
    return true;
  });
  const reading = view.startsWith('read:') ? view.slice(5) : null;
  return (
    <AppShell
      title={view === 'compose' ? t('mail.new') : t('app.mail')}
      sub={view === 'inbox' ? t('mail.inboxSub') : undefined}
      className="sos-mail"
      backLabel={view === 'inbox' ? undefined : t('mail.inbox')}
      onBack={view === 'inbox' ? undefined : () => setView('inbox')}
      actions={
        view !== 'compose' && (
          <button type="button" className="sos-iconbtn" aria-label={t('mail.new')} onClick={() => setView('compose')}>
            <NotePencilIcon size={22} weight="bold" />
          </button>
        )
      }
    >
      {view === 'inbox' && (
        <>
          <button type="button" className="sos-mail-cta" onClick={() => setView('compose')}>
            <PaperPlaneTiltIcon size={20} weight="fill" />
            <span>
              <b>{t('mail.cta')}</b>
              <small>{profile.email}</small>
            </span>
          </button>
          <ul className="sos-mail-list">
            {INBOX.map((id) => (
              <li key={id}>
                <button type="button" className="sos-mail-item" onClick={() => setView(`read:${id}`)}>
                  <span className="sos-mail-from">
                    <b>{t(`mail.${id}.from`)}</b>
                    <small>{t(`mail.${id}.when`)}</small>
                  </span>
                  <span className="sos-mail-subj">{t(`mail.${id}.subj`)}</span>
                  <span className="sos-mail-prev">{t(`mail.${id}.body`)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {reading && (
        <article className="sos-mail-read">
          <p className="sos-mail-read-meta">
            <EnvelopeOpenIcon size={16} weight="bold" aria-hidden="true" /> {t(`mail.${reading}.from`)} · {t(`mail.${reading}.when`)}
          </p>
          <h3>{t(`mail.${reading}.subj`)}</h3>
          <p>{t(`mail.${reading}.body`)}</p>
          <button type="button" className="sos-pill" onClick={() => setView('compose')}>
            {t('mail.reply')}
          </button>
        </article>
      )}
      {view === 'compose' && <Compose onDone={() => setView('inbox')} />}
    </AppShell>
  );
}
