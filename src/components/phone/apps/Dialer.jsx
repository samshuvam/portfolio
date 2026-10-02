import { useEffect, useRef, useState } from 'react';
import {
  BackspaceIcon,
  ChatCircleTextIcon,
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  InstagramLogoIcon,
  PhoneCallIcon,
  PhoneDisconnectIcon,
  PhoneIcon,
  PlayIcon,
  StopIcon,
  UserCircleIcon,
  VoicemailIcon,
  WhatsappLogoIcon,
  XLogoIcon,
} from '@phosphor-icons/react';
import { contextAvatar as portrait } from '../../../lib/imagery';
import { profile } from '../../../data/profile';
import { useT, useLang, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone, useBack, fmtDuration } from '../os';
import { AppShell, Group, Row, Seg } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

const TEL = 'tel:+9779819880850';
const KEYS = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
  ['*', ''],
  ['0', '+'],
  ['#', ''],
];
const VOICEMAILS = ['vm1', 'vm2', 'vm3'];

function Avatar({ size = 72 }) {
  return portrait ? (
    <img className="sos-avatar" src={portrait.srcset?.[0]?.src || portrait.src} alt="" width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <UserCircleIcon size={size} />
  );
}

// The call screen: it rings, nobody picks up (he is probably cooking), and
// the voicemail greeting is a joke. The real number is one tap away.
function Call({ onEnd }) {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  const [stage, setStage] = useState('ringing');
  const [secs, setSecs] = useState(0);
  const endBtn = useRef(null);
  useBack(() => {
    onEnd();
    return true;
  });
  useEffect(() => {
    ctx.setLive('call', t('call.label'));
    endBtn.current?.focus({ preventScroll: true });
    sfx.ring();
    const ring = setInterval(() => sfx.ring(), 3000);
    const vm = setTimeout(() => {
      clearInterval(ring);
      setStage('voicemail');
      sfx.blip(1000);
    }, 9200);
    const sec = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => {
      clearInterval(ring);
      clearInterval(sec);
      clearTimeout(vm);
      ctx.setLive('call', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="sos-call" role="dialog" aria-label={t('call.label')}>
      <div className="sos-call-top">
        <Avatar size={96} />
        <h3>{profile.name}</h3>
        <p aria-live="polite">{stage === 'ringing' ? t('call.ringing') : t('call.vm')}</p>
        <span className="sos-call-time">{localDigits(fmtDuration(secs * 1000), lang)}</span>
      </div>
      {stage === 'voicemail' && (
        <div className="sos-call-vm" aria-live="polite">
          <VoicemailIcon size={20} weight="bold" aria-hidden="true" />
          <p>{t('call.greeting')}</p>
        </div>
      )}
      <div className="sos-call-actions">
        <button type="button" className="sos-call-act" onClick={() => ctx.open('messages')}>
          <span>
            <ChatCircleTextIcon size={24} weight="fill" />
          </span>
          {t('call.text')}
        </button>
        <a className="sos-call-act" href={TEL}>
          <span>
            <PhoneCallIcon size={24} weight="fill" />
          </span>
          {t('call.real')}
        </a>
        <a className="sos-call-act" href={profile.whatsapp} target="_blank" rel="noopener noreferrer">
          <span>
            <WhatsappLogoIcon size={24} weight="fill" />
          </span>
          {t('call.wa')}
        </a>
      </div>
      <button type="button" ref={endBtn} className="sos-call-end" aria-label={t('call.end')} onClick={onEnd}>
        <PhoneDisconnectIcon size={30} weight="fill" />
      </button>
    </div>
  );
}

function Keypad({ onCall }) {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  const [num, setNum] = useState('');
  const [note, setNote] = useState('');
  const press = (k) => {
    sfx.dtmf(k);
    setNote('');
    setNum((n) => {
      const next = (n + k).slice(-18);
      if (next.endsWith('*#2504#')) {
        ctx.flash('notice', { text: t('dial.code') }, 2600);
        setNote(t('dial.codeNote'));
        return '';
      }
      if (next.endsWith('*#06#')) {
        setNote(t('dial.imei'));
        return '';
      }
      return next;
    });
  };
  const onKey = (e) => {
    if (/^[0-9*#]$/.test(e.key)) {
      e.preventDefault();
      press(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setNum((n) => n.slice(0, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onCall();
    }
  };
  const call = () => {
    const digits = num.replace(/\D/g, '');
    if (digits && !digits.endsWith('9819880850')) setNote(t('dial.only'));
    onCall();
  };
  return (
    <div className="sos-keypad" onKeyDown={onKey}>
      <p className="sos-dial-num" aria-live="polite">
        {num ? localDigits(num, lang) : <span>{t('dial.hint')}</span>}
      </p>
      <p className="sos-dial-note" aria-live="polite">
        {note}
      </p>
      <div className="sos-keys">
        {KEYS.map(([k, sub]) => (
          <button key={k} type="button" className="sos-key" onClick={() => press(k)} aria-label={k}>
            <b>{localDigits(k, lang)}</b>
            <small>{sub}</small>
          </button>
        ))}
      </div>
      <div className="sos-dial-row">
        <button type="button" className="sos-dial-fill" onClick={() => setNum('9819880850')}>
          {t('dial.fill')}
        </button>
        <button type="button" className="sos-dial-call" aria-label={t('dial.call')} onClick={call}>
          <PhoneIcon size={28} weight="fill" />
        </button>
        <button type="button" className="sos-dial-del" aria-label={t('dial.del')} onClick={() => setNum((n) => n.slice(0, -1))} disabled={!num}>
          <BackspaceIcon size={24} weight="fill" />
        </button>
      </div>
    </div>
  );
}

function Contact({ onCall }) {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  return (
    <div className="sos-contact">
      <div className="sos-contact-head">
        <Avatar size={84} />
        <h3>{profile.name}</h3>
        <p lang="ne">{profile.devanagari}</p>
        <p className="sos-note">{t('contact.role')}</p>
      </div>
      <div className="sos-contact-quick">
        <button type="button" onClick={() => ctx.open('messages')}>
          <ChatCircleTextIcon size={22} weight="fill" />
          {t('contact.message')}
        </button>
        <button type="button" onClick={onCall}>
          <PhoneIcon size={22} weight="fill" />
          {t('contact.call')}
        </button>
        <button type="button" onClick={() => ctx.open('mail')}>
          <EnvelopeSimpleIcon size={22} weight="fill" />
          {t('contact.mail')}
        </button>
      </div>
      <Group>
        <Row icon={<PhoneIcon size={16} weight="fill" />} label={localDigits(profile.phone, lang)} sub={t('contact.mobile')} href={TEL} />
        <Row icon={<WhatsappLogoIcon size={16} weight="fill" />} label="WhatsApp" sub={localDigits(profile.phone, lang)} href={profile.whatsapp} />
        <Row icon={<EnvelopeSimpleIcon size={16} weight="fill" />} label={profile.email} sub={t('contact.email')} href={`mailto:${profile.email}`} />
      </Group>
      <Group>
        <Row icon={<XLogoIcon size={16} weight="fill" />} label={profile.links.x.handle} sub="X" href={profile.links.x.url} />
        <Row icon={<GithubLogoIcon size={16} weight="fill" />} label={profile.links.github.handle} sub="GitHub" href={profile.links.github.url} />
        <Row icon={<InstagramLogoIcon size={16} weight="fill" />} label={profile.links.instagram.handle} sub="Instagram" href={profile.links.instagram.url} />
      </Group>
      <Group>
        <Row label={t('contact.home')} sub={t('contact.homeV')} />
        <Row label={t('contact.bday')} sub={t('contact.bdayV')} />
        <Row label={t('contact.langs')} sub={t('contact.langsV')} />
      </Group>
    </div>
  );
}

function Voicemail() {
  const t = useT(dict);
  const [open, setOpen] = useState(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const play = (id) => {
    clearTimeout(timer.current);
    if (open === id) {
      setOpen(null);
      return;
    }
    setOpen(id);
    sfx.blip(1000);
    timer.current = setTimeout(() => setOpen((o) => (o === id ? null : o)), 9000);
  };
  return (
    <div className="sos-vm">
      <ul className="sos-vm-list">
        {VOICEMAILS.map((id) => (
          <li key={id} className={open === id ? 'is-open' : ''}>
            <button type="button" className="sos-vm-row" aria-expanded={open === id} onClick={() => play(id)}>
              <span className="sos-vm-play">{open === id ? <StopIcon size={14} weight="fill" /> : <PlayIcon size={14} weight="fill" />}</span>
              <span className="sos-row-text">
                <b>{t(`dial.${id}.from`)}</b>
                <small>{t(`dial.${id}.when`)}</small>
              </span>
            </button>
            {open === id && (
              <p className="sos-vm-text" aria-live="polite">
                <span className="sos-vm-wave" aria-hidden="true">
                  {Array.from({ length: 18 }, (_, i) => (
                    <i key={i} style={{ animationDelay: `${(i % 6) * 0.08}s` }} />
                  ))}
                </span>
                {t(`dial.${id}`)}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="sos-note">{t('dial.vmNote')}</p>
    </div>
  );
}

export default function Dialer() {
  const t = useT(dict);
  const [tab, setTab] = useState('contact');
  const [calling, setCalling] = useState(false);
  return (
    <AppShell title={t('app.phone')} className="sos-dialer">
      <Seg
        value={tab}
        onChange={setTab}
        label={t('app.phone')}
        options={[
          { id: 'contact', label: t('dial.contact') },
          { id: 'keypad', label: t('dial.keypad') },
          { id: 'vm', label: t('dial.voicemail') },
        ]}
      />
      {tab === 'keypad' && <Keypad onCall={() => setCalling(true)} />}
      {tab === 'contact' && <Contact onCall={() => setCalling(true)} />}
      {tab === 'vm' && <Voicemail />}
      {calling && <Call onEnd={() => setCalling(false)} />}
    </AppShell>
  );
}
