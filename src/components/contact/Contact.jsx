import L, { useCopy } from '../../i18n/Text';
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AirplaneTiltIcon, CheckIcon, CopyIcon, DownloadSimpleIcon, EnvelopeSimpleIcon, GithubLogoIcon, InstagramLogoIcon, PaperPlaneTiltIcon, PhoneIcon, WhatsappLogoIcon, XLogoIcon } from '@phosphor-icons/react';
import { profile } from '../../data/profile';
import { visitorRelative, useNow } from '../../lib/world';
import { findEgg, toast } from '../../lib/eggs';
import { gsap, reducedMotion } from '../../lib/motion';
import { sound } from '../../lib/sound';
import { sendMessage as send } from '../../lib/relay';
import Phone from '../phone/Phone';
import './contact.css';

function Copy({ value, label, icon: Icon }) {
  const c=useCopy();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="channel"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          sound.click();
          setTimeout(() => setDone(false), 2000);
        } catch {
          setDone(false);
        }
      }}
    >
      <Icon size={20} weight="duotone" />
      <span>
        <b>{c(label)}</b>
        {value}
      </span>
      {done ? <CheckIcon size={16} weight="bold" className="channel-end" /> : <CopyIcon size={16} className="channel-end" />}
    </button>
  );
}

function BoardingPass() {
  const c=useCopy();
  const now = useNow();
  const rel = visitorRelative(now);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const stub = useRef(null);
  const from = rel.city && rel.city !== 'your timezone' ? rel.city : c("Wherever you are");
  const fromCode = from.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'YOU';

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = c("Who should I address the reply to?");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = c("That email does not look complete.");
    if (form.message.trim().length < 10) e.message = c("A few more words, please. At least ten characters.");
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setState('sending');
    try {
      await send({ name: form.name.trim(), email: form.email.trim(), _replyto: form.email.trim(), message: form.message.trim(), _subject: `Portfolio message from ${form.name} (${from})` });
      setState('sent');
      sound.success();
      if (!reducedMotion() && stub.current) {
        gsap.to(stub.current, { rotate: 14, y: 40, x: 30, autoAlpha: 0, duration: 0.9, ease: 'power2.in' });
      }
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ['#f08a24', '#c8311f', '#e9a400', '#3e7d3a', '#27306b'], disableForReducedMotion: true });
      toast('Boarded.', 'Your message is on its way to my inbox. Expect a reply soon.');
    } catch {
      setState('error');
    }
  };

  const field = (k) => ({
    id: `bp-${k}`,
    value: form[k],
    maxLength: k === "message" ? 5000 : k === "email" ? 254 : 100,
    onChange: (e) => setForm({ ...form, [k]: e.target.value }),
    'aria-invalid': errors[k] ? 'true' : undefined,
    'aria-describedby': errors[k] ? `bp-${k}-err` : undefined,
  });

  return (
    <div className={`pass ${state === 'sent' ? 'is-sent' : ''}`}>
      <form className="pass-main" onSubmit={submit} noValidate>
        <div className="pass-top">
          <span className="pass-brand">
            <AirplaneTiltIcon size={18} weight="fill" /> <L text={"Boarding pass"} /> </span>
          <span className="t-mono"> <L text={"SUV-1478, first class"} /> </span>
        </div>
        <div className="pass-route">
          <div>
            <p className="pass-k"> <L text={"From"} /> </p>
            <p className="pass-code">{fromCode}</p>
            <p className="pass-city">{from}</p>
          </div>
          <div className="pass-line" aria-hidden="true">
            <span />
            <AirplaneTiltIcon size={22} weight="fill" />
            <span />
          </div>
          <div className="pass-to">
            <p className="pass-k"> <L text={"To"} /> </p>
            <p className="pass-code">KTM</p>
            <p className="pass-city"> <L text={"Lalitpur, Nepal"} /> </p>
          </div>
        </div>

        {state === 'sent' ? (
          <div className="pass-done" role="status">
            <CheckIcon size={28} weight="bold" />
            <p className="pass-done-title">{c('You are boarded, {name}.',{name:form.name.split(' ')[0]})}</p>
            <p>{c('The relay accepted your message. I reply from {email}.',{email:profile.email})}</p>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setForm({ name: '', email: '', message: '' });
                setState('idle');
                if (stub.current) gsap.set(stub.current, { clearProps: 'all' });
              }}
            > <L text={"Write another"} /> </button>
          </div>
        ) : (
          <div className="pass-fields">
            <div className="pass-field">
              <label className="field-label" htmlFor="bp-name"> <L text={"Passenger name"} /> </label>
              <input className="input" autoComplete="name" placeholder={c("e.g. Kalyani")} {...field('name')} />
              {errors.name && (
                <p className="field-err" id="bp-name-err">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="pass-field">
              <label className="field-label" htmlFor="bp-email"> <L text={"Email for the reply"} /> </label>
              <input className="input" type="email" autoComplete="email" placeholder="you@example.com" {...field('email')} />
              {errors.email && (
                <p className="field-err" id="bp-email-err">
                  {errors.email}
                </p>
              )}
            </div>
            <div className="pass-field pass-msg">
              <label className="field-label" htmlFor="bp-message"> <L text={"Message"} /> </label>
              <textarea className="input" rows={4} placeholder={c("A research idea, a role, a question about eVTOLs, or just hello.")} {...field('message')} />
              {errors.message && (
                <p className="field-err" id="bp-message-err">
                  {errors.message}
                </p>
              )}
            </div>
            <div className="pass-actions">
              <button type="submit" className="btn btn-accent" disabled={state === 'sending'}>
                {c(state === 'sending' ? 'Boarding' : 'Board')} <PaperPlaneTiltIcon size={17} weight="bold" />
              </button>
              <p className="t-small text-ink-3"> <L text={"Your email is only used to reply."} /> </p>
            </div>
            {state === 'error' && (
              <p className="field-err" role="alert">
                {c('The relay could not deliver that just now. Please try again, or email {email} directly.',{email:profile.email})}
              </p>
            )}
          </div>
        )}
      </form>
      <div ref={stub} className="pass-stub">
        <p className="pass-k"> <L text={"Flight"} /> </p>
        <p className="pass-stub-v">SUV-1478</p>
        <p className="pass-k"> <L text={"Seat"} /> </p>
        <p className="pass-stub-v">1A</p>
        <p className="pass-k"> <L text={"Gate"} /> </p>
        <p className="pass-stub-v"> <L text={"Inbox"} /> </p>
        <a className="pass-qr" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noreferrer" aria-label={c('A surprise boarding destination')}><img src="/boarding-qr.svg" width="112" height="112" alt={c('Scan for a surprise')}/><span>{c('Scan for a surprise')} ↗</span></a>
      </div>
    </div>
  );
}

function PaperPlane() {
  const c=useCopy();
  const [msg, setMsg] = useState('');
  const [state, setState] = useState('idle');
  const paper = useRef(null);
  const plane = useRef(null);

  const fly = async (e) => {
    e.preventDefault();
    if (msg.trim().length < 3) return;
    setState('sending');
    try {
      await send({ message: msg, _subject: 'Anonymous paper plane from shuvamsingh.com.np' });
      sound.whoosh(1);
      if (!reducedMotion() && paper.current && plane.current) {
        const tl = gsap.timeline();
        tl.to(paper.current, { scaleY: 0.2, scaleX: 0.5, rotate: -8, autoAlpha: 0, duration: 0.5, ease: 'power2.in' })
          .fromTo(plane.current, { autoAlpha: 1, x: 0, y: 0, rotate: 0, scale: 1 }, { x: '60vw', y: '-50vh', rotate: -25, scale: 0.6, duration: 1.4, ease: 'power2.in' }, '-=0.1')
          .set(plane.current, { autoAlpha: 0 })
          .set(paper.current, { clearProps: 'all' });
      }
      setMsg('');
      setState('sent');
      findEgg('airmail');
    } catch {
      setState('error');
    }
  };

  return (
    <form className="note" onSubmit={fly}>
      <div ref={paper} className="note-paper">
        <label className="field-label" htmlFor="note-msg"> <L text={"Or fly an anonymous paper plane"} /> </label>
        <textarea id="note-msg" className="note-text" rows={4} maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={c("No name, no email. Feedback, an idea, a hello.")} />
      </div>
      <span ref={plane} className="note-plane" aria-hidden="true">
        <PaperPlaneTiltIcon size={42} weight="duotone" />
      </span>
      <div className="note-actions">
        <button type="submit" className="btn btn-ghost btn-sm" disabled={state === 'sending' || msg.trim().length < 3}>
          {state === 'sending' ? c("Folding") : c("Fold and fly")} <PaperPlaneTiltIcon size={15} weight="bold" />
        </button>
        <p className="t-small text-ink-3" aria-live="polite">
          {state === 'sent' ? c("It landed. Thank you.") : state === 'error' ? c("It crashed on takeoff. Try again in a moment.") : c("No name or email requested. Sent via FormSubmit.")}
        </p>
      </div>
    </form>
  );
}

export default function Contact() {
  const c=useCopy();
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      gsap.from('.pass', { y: 60, rotate: -2, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.pass', start: 'top 85%' } });
      gsap.from('.channel', { y: 20, autoAlpha: 0, stagger: 0.05, duration: 0.6, scrollTrigger: { trigger: '.channels', start: 'top 90%' } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="contact" ref={root} className="section contact" aria-labelledby="contact-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="contact-title" className="t-display"> <L text={"Your boarding pass."} /> </h2>
          <p className="t-lede"> <L text={"Research collaborations, roles, eVTOL arguments, momo recommendations. Fill in the pass and it lands in my inbox."} /> </p>
        </header>

        <div className="contact-grid">
          <div className="contact-main"><BoardingPass /><PaperPlane /></div>
          <aside className="contact-side">
            <div className="channels">
              <Copy value={profile.email} label="Email" icon={EnvelopeSimpleIcon} />
              <Copy value={profile.phone} label="Phone" icon={PhoneIcon} />
              <a className="channel" href={profile.whatsapp} target="_blank" rel="noopener noreferrer">
                <WhatsappLogoIcon size={20} weight="duotone" />
                <span>
                  <b>WhatsApp</b> <L text={"Message me"} /> </span>
              </a>
              <a className="channel" href={profile.links.github.url} target="_blank" rel="noopener noreferrer">
                <GithubLogoIcon size={20} weight="duotone" />
                <span>
                  <b>GitHub</b>
                  {profile.links.github.handle}
                </span>
              </a>
              <a className="channel" href={profile.links.x.url} target="_blank" rel="noopener noreferrer">
                <XLogoIcon size={20} weight="duotone" />
                <span>
                  <b>X</b>
                  {profile.links.x.handle}
                </span>
              </a>
              <a className="channel" href={profile.links.instagram.url} target="_blank" rel="noopener noreferrer">
                <InstagramLogoIcon size={20} weight="duotone" />
                <span>
                  <b>Instagram</b>
                  {profile.links.instagram.handle}
                </span>
              </a>
              <a className="channel channel-cv" href={profile.cv} target="_blank" rel="noopener noreferrer">
                <DownloadSimpleIcon size={20} weight="bold" />
                <span>
                  <b> <L text={"Download CV"} /> </b> <L text={"PDF, two pages"} /> </span>
              </a>
            </div>
            <Phone />
          </aside>
        </div>
      </div>
    </section>
  );
}
