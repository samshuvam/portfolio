import { useEffect, useRef } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { Term } from '../ui/Term';
import Yap from '../ui/Yap';
import { profile, stats } from '../../data/profile';
import { photoById, portrait } from '../../lib/photos';
import { gsap, SplitText, reducedMotion } from '../../lib/motion';
import { useWorld } from '../../lib/world';
import './about.css';

function Pill({ photo, children, label }) {
  const p = photo ? photoById(photo) : null;
  return (
    <span className="pill-img" aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined} aria-label={label}>
      {p ? <img src={p.srcset[0].src} alt="" loading="lazy" style={{ background: p.color }} /> : children}
    </span>
  );
}

const CurvePill = () => (
  <svg viewBox="0 0 80 36" className="pill-svg">
    <path d="M4 6C14 22 20 26 28 27L28 9C38 22 46 24 54 24L54 12C62 21 70 22 78 22" />
  </svg>
);

const steps = [
  { verb: 'Find the constraint', text: 'A context window, a crowded corridor, a legacy workflow. The bottleneck is rarely a single model.' },
  { verb: 'Instrument it', text: 'Break the failure point into measurable stages and add observability.' },
  { verb: 'Iterate', text: 'Change one thing, measure again. Repeat until it is fast and understandable.' },
  { verb: 'Ship something trusted', text: 'A result people can rely on, not just a demo that works on a good day.' },
];

export default function About() {
  const root = useRef(null);
  const world = useWorld();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion()) return;
      const split = new SplitText('.manifesto-text', { type: 'words', wordsClass: 'mf-word' });
      gsap.fromTo(
        split.words,
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: { trigger: '.manifesto', start: 'top 78%', end: 'bottom 45%', scrub: true },
        },
      );
      gsap.from('.manifesto .pill-img', {
        scale: 0.4,
        rotate: -12,
        stagger: 0.12,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: '.manifesto', start: 'top 75%', end: 'center 50%', scrub: 1 },
      });
      gsap.fromTo('.about-portrait img', { yPercent: -8, scale: 1.12 }, { yPercent: 8, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.about-portrait', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from('.about-stat', { y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.9, scrollTrigger: { trigger: '.about-stats', start: 'top 85%' } });
      gsap.from('.how-step', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.how', start: 'top 80%' } });
    }, root);
    return () => ctx.revert();
  }, []);

  const age = world.npt.year - 2003 - (world.npt.month < 4 || (world.npt.month === 4 && world.npt.day < 25) ? 1 : 0);

  return (
    <section id="about" ref={root} className="section about" aria-labelledby="about-title">
      <div className="wrap">
        <p className="manifesto">
          <span className="manifesto-text">
            Born in <Pill photo="img-20260527-185937-774" /> <Term id="janakpur">Janakpur</Term>, the city where <Term id="sita">Sita</Term> was born. Now I build <Pill>
              <CurvePill />
            </Pill>{' '}
            AI that remembers, <Pill photo="1000024316" /> airspace that thinks, and <Pill photo="1000053325" /> systems people trust.
          </span>
        </p>

        <div className="about-grid">
          <figure className="about-portrait">
            {portrait ? (
              <img src={portrait.src} srcSet={portrait.srcsetAttr} sizes="(min-width: 1024px) 34vw, 90vw" alt="Shuvam Singh at a café table, hand on his chin, looking out of the window" style={{ background: portrait.color }} />
            ) : (
              <div className="about-portrait-empty font-tirhuta">{profile.tirhuta}</div>
            )}
            <figcaption>
              <span>Lalitpur. Thinking, as usual.</span>
              <span className="t-mono">Kanya rashi</span>
            </figcaption>
          </figure>

          <div className="about-copy">
            <h2 id="about-title" className="t-title">
              Hi, I’m Shuvam. <span className="light">I work where research meets real systems.</span>
            </h2>
            <p className="t-lede mt-6">
              A computer science engineer (B.Tech, Big Data, SRM University AP) splitting time between two kinds of problems. Research: memory architectures that let <Term id="llm">LLMs</Term> learn like people, and AI for air
              traffic, from <Term id="4d-trajectory">4D trajectories</Term> to <Term id="evtol">eVTOL</Term> corridors. Systems: <Term id="erp">ERP</Term> migrations, smart inventory and the plumbing a company actually runs on.
            </p>
            <Yap>
              Okay, the longer version. I like problems that sit between fields. A token budget is a resource-allocation problem. Air traffic is a scheduling problem in four dimensions. Moving a company onto Odoo is a people
              problem wearing a software costume. A lot of my work is noticing which old idea solves a new problem, like borrowing a forgetting curve from 1885 to decide what an AI should remember.
            </Yap>

            <dl className="about-facts">
              <div>
                <dt>Born</dt>
                <dd>
                  <Term id="janakpur">Janakpur</Term>, 25 April 2003, <span className="font-deva">१२ बैशाख २०६०</span>. That makes {age}.
                </dd>
              </div>
              <div>
                <dt>Home</dt>
                <dd>Lalitpur, Nepal</dd>
              </div>
              <div>
                <dt>Speaks</dt>
                <dd>
                  <Term id="maithili">Maithili</Term>, Nepali, English
                </dd>
              </div>
              <div>
                <dt>Now</dt>
                <dd>{profile.current}</dd>
              </div>
            </dl>

            <a className="btn btn-ghost mt-8" href={profile.cv} target="_blank" rel="noopener noreferrer">
              <DownloadSimpleIcon size={18} weight="bold" /> Download CV
            </a>
          </div>
        </div>

        <div className="about-stats" role="list">
          {stats.map((s) => (
            <div key={s.label} className="about-stat" role="listitem">
              <p className="about-stat-value">{s.term ? <Term id={s.term}>{s.value}</Term> : s.value}</p>
              <p className="about-stat-label">{s.label}</p>
              <p className="about-stat-detail">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="how">
          <h3 className="how-title">How I work, in four verbs.</h3>
          <ol className="how-steps">
            {steps.map((s, i) => (
              <li key={s.verb} className="how-step">
                <span className="how-index" aria-hidden="true">
                  {['क', 'ख', 'ग', 'घ'][i]}
                </span>
                <p className="how-verb">{s.verb}</p>
                <p className="how-text">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
