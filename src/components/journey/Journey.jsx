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
import { gsap, reducedMotion, getLenis } from '../../lib/motion';
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
  const track = useRef(null);
  const sceneRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const reduce = useMemo(() => reducedMotion(), []);

  // Build the scene once, lazily (three.js is already loaded for the plane).
  useEffect(() => {
    let disposed = false;
    let scene = null;
    let running = false;
    let observer, resizeObserver;
    let mobile = window.innerWidth < 768;
    const pos = { x: 0, y: 0, z: 0 };

    import('../../three/BoughScene').then(({ BoughScene }) => {
      if (disposed) return;
      try {
        scene = new BoughScene(canvas.current, { milestones: journey.length, mobile });
      } catch {
        setFailed(true);
        return;
      }
      sceneRef.current = scene;
      if (import.meta.env.DEV) window.__bough = scene;
      setReady(true);

      const size = () => {
        mobile = window.innerWidth < 768;
        scene.mobile = mobile;
        scene.camera.fov = mobile ? 52 : 38;
        const r = stage.current.getBoundingClientRect();
        scene.resize(r.width, r.height);
      };
      size();
      const ro = new ResizeObserver(size);
      ro.observe(stage.current);
      scene._ro = ro;

      const frame = () => {
        if (!reduce) {
          const bounds = track.current.getBoundingClientRect();
          scene.progress = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height - stage.current.clientHeight)));
        }
        scene.render();
        const r = stage.current.getBoundingClientRect();
        let best = Math.round(scene.progress * (journey.length - 1));
        let bestD = Infinity;
        scene.anchors.forEach((a, i) => {
          const el = cardsRef.current[i];
          if (!el) return;
          if(Math.abs(i-best)<=2){const image=el.querySelector('img');if(image)image.loading='eager';}
          const pt = a.p.clone();
          pt.y += i % 2 === 0 ? 0.25 : -0.25;
          scene.project(pt, r.width, r.height, pos);
          const d = Math.abs(pos.x - r.width / 2) / (r.width / 2);
          if (!mobile && d < bestD) {
            bestD = d;
            best = i;
          }
          const vis = mobile ? i === best : pos.z < 1 && d < 1.05;
          el.style.visibility = vis ? 'visible' : 'hidden';
          if (!vis) return;
          el.style.opacity = mobile ? '1' : String(Math.max(0, 1 - Math.max(0, d - 0.25) * 1.25));
          const cardHeight = el.firstElementChild.offsetHeight;
          const y = mobile ? Math.max(132, (r.height-cardHeight)/2+35) : i%2===0 ? Math.max(cardHeight+110,pos.y) : Math.min(r.height-cardHeight-82,pos.y);
          el.style.transform = `translate3d(${mobile ? r.width/2 : pos.x}px, ${y}px, 0)`;
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
        scene.render();
        return;
      }
      observer = new IntersectionObserver(([entry]) => entry.isIntersecting ? start() : stop(), {rootMargin:'200px'});
      observer.observe(track.current);
      resizeObserver = new ResizeObserver(size);
      resizeObserver.observe(stage.current);
      frame();
    }).catch(() => {if(!disposed)setFailed(true);});

    return () => {
      disposed = true;
      observer?.disconnect();
      resizeObserver?.disconnect();
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
  const jump = i => {
    const el=track.current, target=window.scrollY+el.getBoundingClientRect().top+(el.offsetHeight-stage.current.offsetHeight)*i/(journey.length-1);
    const lenis=getLenis();
    if(lenis)lenis.scrollTo(target,{duration:1.1});else window.scrollTo({top:target,behavior:reduce?'auto':'smooth'});
  };

  return (
    <section id="journey" ref={section} className="section journey" aria-labelledby="journey-title">
      <div className="wrap journey-head sec-head">
        <h2 id="journey-title" className="t-display"> <L text={"The journey,"} /> <span className="light"> <L text={"in the season you’re reading it."} /> </span>
        </h2>
        <p className="t-lede"> <L text={"This bough is dressed for Nepal right now. It is"} /> <Term id="ritu">{ls(liveSeason).english}</Term>. {ls(liveSeason).line}
        </p>
      </div>

      <div ref={track} className={`journey-track ${reduce || failed ? 'is-static' : ''}`}>
      <div ref={stage} className={`journey-stage ${reduce || failed ? 'is-static' : ''}`} data-phase={phase}>
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

        <div className="journey-stepper" aria-label={c('Milestones')}><button type="button" onClick={()=>jump(Math.max(0,active-1))} disabled={active===0} aria-label={c('Previous')}>←</button><span aria-live="polite">{String(active+1).padStart(2,'0')} / {journey.length} · {journey[active].when}</span><button type="button" onClick={()=>jump(Math.min(journey.length-1,active+1))} disabled={active===journey.length-1} aria-label={c('Next')}>→</button></div>
        <ol className="journey-rail" aria-label={c('Milestones')}>
          {journey.map((m, i) => (
            <li key={m.id} className={active === i ? 'is-active' : ''}>
              <button type="button" onClick={()=>jump(i)} aria-label={loc(m).title} aria-current={active===i?'step':undefined}>{String(i+1).padStart(2,'0')}</button>
            </li>
          ))}
        </ol>
      </div>
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
