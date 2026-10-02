import L, { useCopy } from '../../i18n/Text';
import { useLocalize, localDigits } from '../../i18n';
import overlay from '../../i18n/content/journey';
import seasonOverlay from '../../i18n/content/seasons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { journey } from '../../data/journey';
import { SEASONS, seasonById } from '../../data/seasons';
import { useWorld } from '../../lib/world';
import { contextImage } from '../../lib/imagery';
import { setState } from '../../lib/store';
import { gsap, ScrollTrigger, reducedMotion } from '../../lib/motion';
import { useSeason } from '../ThemeSync';
import { Term } from '../ui/Term';
import './journey.css';

const PHASES = [
  { id: 'dawn', label: 'Dawn' },
  { id: 'day', label: 'Day' },
  { id: 'dusk', label: 'Dusk' },
  { id: 'night', label: 'Night' },
];

function livePhase(world) {
  const { phase, sun } = world;
  if (phase === 'day') return 'day';
  if (phase === 'golden' || phase === 'civil') return sun.azimuth < 180 ? 'dawn' : 'dusk';
  if (phase === 'nautical' && sun.azimuth >= 180 && sun.elevation > -9) return 'dusk';
  return 'night';
}

export default function Journey() {
  const c=useCopy();
  const world = useWorld();
  const loc=useLocalize(overlay), ls=useLocalize(seasonOverlay);
  const liveSeason = useSeason();
  const [seasonPick, setSeasonPick] = useState('live');
  const [phasePick, setPhasePick] = useState('live');
  const season = seasonPick === 'live' ? liveSeason : seasonById(seasonPick);
  const phase = phasePick === 'live' ? livePhase(world) : phasePick;
  const isLive = seasonPick === 'live' && phasePick === 'live';

  const section = useRef(null);
  const stage = useRef(null);
  const canvas = useRef(null);
  const cardsRef = useRef([]);
  const sceneRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const reduce = useMemo(() => reducedMotion(), []);

  // Build the scene once, lazily (three.js is already loaded for the plane).
  useEffect(() => {
    let disposed = false;
    let scene = null;
    let running = false;
    let st = null;
    const mobile = window.innerWidth < 768;
    const pos = { x: 0, y: 0, z: 0 };

    import('../../three/BoughScene').then(({ BoughScene }) => {
      if (disposed) return;
      try {
        scene = new BoughScene(canvas.current, { milestones: journey.length, mobile });
      } catch {
        return;
      }
      sceneRef.current = scene;
      if (import.meta.env.DEV) window.__bough = scene;
      setReady(true);

      const size = () => {
        const r = stage.current.getBoundingClientRect();
        scene.resize(r.width, r.height);
      };
      size();
      const ro = new ResizeObserver(size);
      ro.observe(stage.current);
      scene._ro = ro;

      const frame = () => {
        scene.render();
        const r = stage.current.getBoundingClientRect();
        let best = 0;
        let bestD = Infinity;
        scene.anchors.forEach((a, i) => {
          const el = cardsRef.current[i];
          if (!el) return;
          const pt = a.p.clone();
          pt.y += i % 2 === 0 ? 0.25 : -0.25;
          scene.project(pt, r.width, r.height, pos);
          const d = Math.abs(pos.x - r.width / 2) / (r.width / 2);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
          const vis = pos.z < 1 && d < 1.25;
          el.style.visibility = vis ? 'visible' : 'hidden';
          if (!vis) return;
          el.style.opacity = String(Math.max(0, 1 - Math.max(0, d - 0.25) * 1.25));
          el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        });
        setActive((cur) => (cur === best ? cur : best));
      };

      const start = () => {
        if (!running) {
          running = true;
          gsap.ticker.add(frame);
        }
      };
      const stop = () => {
        running = false;
        gsap.ticker.remove(frame);
      };
      scene._start = start;
      scene._stop = stop;

      if (reduce) {
        scene.progress = 0;
        frame();
        return;
      }
      st = ScrollTrigger.create({
        trigger: stage.current,
        start: 'top top',
        end: () => `+=${journey.length * window.innerHeight * 0.55}`,
        pin: stage.current,
        scrub: true,
        onUpdate: (self) => {
          scene.progress = self.progress;
        },
        onToggle: (self) => (self.isActive ? start() : stop()),
      });
      // Also render while approaching, before the pin engages.
      const near = ScrollTrigger.create({ trigger: section.current, start: 'top bottom', end: 'bottom top', onToggle: (self) => (self.isActive ? start() : stop()) });
      scene._near = near;
      ScrollTrigger.refresh();
    });

    return () => {
      disposed = true;
      st?.kill();
      if (scene) {
        scene._near?.kill();
        scene._stop?.();
        scene._ro?.disconnect();
        scene.dispose();
      }
      sceneRef.current = null;
    };
  }, [reduce]);

  // Re-dress and re-light whenever the season or time changes.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.dress(season);
    scene.light(phase, season);
    if (reduce) scene.render();
  }, [ready, season, phase, reduce]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reduce) return;
      gsap.from('.journey-head > *', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.journey-head', start: 'top 80%' } });
    }, section);
    return () => ctx.revert();
  }, [reduce]);

  const liveLabel = c('{season}, {phase} in Lalitpur', {season: ls(liveSeason).english, phase: c(PHASES.find(p=>p.id===livePhase(world))?.label || 'Night')});

  return (
    <section id="journey" ref={section} className="section journey" aria-labelledby="journey-title">
      <div className="wrap journey-head sec-head">
        <h2 id="journey-title" className="t-display"> <L text={"The journey,"} /> <span className="light"> <L text={"in the season you’re reading it."} /> </span>
        </h2>
        <p className="t-lede"> <L text={"This bough is dressed for Nepal right now. It is"} /> <Term id="ritu">{ls(liveSeason).english}</Term>. {ls(liveSeason).line}
        </p>
      </div>

      <div ref={stage} className={`journey-stage ${reduce || !ready ? 'is-static' : ''}`} data-phase={phase}>
        <canvas ref={canvas} className="journey-canvas" aria-hidden="true" />

        <div className="journey-cards" aria-label="Milestones">
          {journey.map(m=>loc(m)).map((m, i) => {
            const photo = m.image ? contextImage(m.image) : null;
            // Prefer the straightened plate where a photo was shot at an angle.
            const photoSrc = photo?.src;
            return (
              <article key={m.id} ref={(el) => (cardsRef.current[i] = el)} className={`jcard ${i % 2 === 0 ? 'is-up' : 'is-down'} ${active === i ? 'is-active' : ''}`}>
                <div className="jcard-inner">
                  {photo && <img src={photoSrc} alt="" loading="lazy" className="jcard-photo" style={{ background: photo.color }} />}
                  <p className="jcard-when">
                    <span>{m.when}</span>
                    <span>{m.sub}</span>
                  </p>
                  <h3 className="jcard-title">{m.title}</h3>
                  <p className="jcard-text">{m.term ? <>{m.text} <Term id={m.term}>{m.term === 'six-seven' ? '6–7' : m.term}</Term>{m.term==='six-seven'&&<> {c('years old.')}</>}</> : m.text}</p>
                  {m.project && (
                    <button type="button" className="jcard-link" onClick={() => setState({ project: m.project })}> <L text={"The project"} /> <ArrowUpRightIcon size={14} weight="bold" />
                    </button>
                  )}
                </div>
                <span className="jcard-stem" aria-hidden="true" />
              </article>
            );
          })}
        </div>

        <div className={`journey-controls ${open ? 'is-open' : ''}`} role="group" aria-label="Season and time of day">
          <div className="journey-live">
            {isLive ? (
              <span>
                <span className="journey-dot" aria-hidden="true" /> {c('Live')}: {liveLabel}
              </span>
            ) : (
              <span>
                {c('Previewing')} {ls(season).english}, {c(PHASES.find(p=>p.id===phase)?.label || phase)}
              </span>
            )}
            <button type="button" className="journey-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
              {c(open ? 'Done' : 'Change season')}
            </button>
            {!isLive && (
              <button
                type="button"
                className="journey-toggle"
                onClick={() => {
                  setSeasonPick('live');
                  setPhasePick('live');
                }}
              > <L text={"Back to live"} /> </button>
            )}
          </div>
          {open && (
            <div className="journey-pickers">
              <div className="journey-chips">
                {SEASONS.map((s) => (
                  <button key={s.id} type="button" className="journey-chip" aria-pressed={season.id === s.id && seasonPick !== 'live'} onClick={() => setSeasonPick(s.id === liveSeason.id && seasonPick !== 'live' ? 'live' : s.id)} title={`${s.name}: ${ls(s).english}`}>
                    <i style={{ background: s.accent.day.fill }} />
                    {s.name}
                    <span className="journey-chip-en">{ls(s).english}</span>
                  </button>
                ))}
              </div>
              <div className="journey-chips">
                {PHASES.map((p) => (
                  <button key={p.id} type="button" className="journey-chip" aria-pressed={phasePick === p.id} onClick={() => setPhasePick(phasePick === p.id ? 'live' : p.id)}>
                    <L text={p.label}/>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ol className="journey-rail" aria-hidden="true">
          {journey.map((m, i) => (
            <li key={m.id} className={active === i ? 'is-active' : ''}>
              <span>{m.when}</span>
            </li>
          ))}
        </ol>
      </div>
      <details className="wrap journey-readable">
        <summary>{c('Read the whole journey')}</summary>
        <ol>{journey.map(m=>loc(m)).map(m=><li key={m.id}>
          <p className="t-label">{m.when} · {m.sub}</p><h3>{m.title}</h3>
          <p>{m.text}{m.term&&<> <Term id={m.term}>{m.term==='six-seven'?'6–7':m.term}</Term>{m.term==='six-seven'&&<> {c('years old.')}</>}</>}</p>
          {m.image&&<img src={contextImage(m.image).src} alt="" loading="lazy"/>}
        </li>)}</ol>
      </details>
    </section>
  );
}
