import { useMemo, useState } from 'react';
import { ArrowCounterClockwiseIcon, PlusIcon } from '@phosphor-icons/react';
import { Term } from '../ui/Term';
import { sound } from '../../lib/sound';

// Illustrative model of the bio-memory idea: retention decays as
// R = e^(-dt / S). Each recall resets it and makes it sturdier (S grows);
// each night of "sleep" consolidates (S grows a little more).

const HOURS = 168;
const W = 560;
const H = 240;
const S0 = 14;

function simulate({ sleep, recalls }) {
  const events = [...recalls.map((t) => ({ t, kind: 'recall' })), ...(sleep ? Array.from({ length: 7 }, (_, d) => ({ t: 22 + d * 24, kind: 'sleep' })) : [])].sort((a, b) => a.t - b.t);
  const pts = [];
  let S = S0;
  let last = 0;
  let base = 1;
  let e = 0;
  for (let t = 0; t <= HOURS; t += 0.5) {
    while (e < events.length && events[e].t <= t) {
      const ev = events[e];
      const r = base * Math.exp(-(ev.t - last) / S);
      if (ev.kind === 'recall') {
        S *= 1.9;
        base = 1;
      } else {
        S *= 1.35;
        base = r;
      }
      last = ev.t;
      e++;
    }
    pts.push([t, base * Math.exp(-(t - last) / S)]);
  }
  return { pts, events };
}

export default function MemoryLab() {
  const [time, setTime] = useState(48);
  const [sleep, setSleep] = useState(true);
  const [recalls, setRecalls] = useState([30]);

  const { pts, events } = useMemo(() => simulate({ sleep, recalls }), [sleep, recalls]);
  const x = (t) => (t / HOURS) * W;
  const y = (r) => H - r * (H - 16) - 8;
  const path = pts.map(([t, r], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)} ${y(r).toFixed(1)}`).join('');
  const naive = Array.from({ length: 80 }, (_, i) => {
    const t = (i / 79) * HOURS;
    return `${i ? 'L' : 'M'}${x(t).toFixed(1)} ${y(Math.exp(-t / S0)).toFixed(1)}`;
  }).join('');
  const now = pts[Math.min(pts.length - 1, Math.round(time * 2))][1];
  const kept = Math.round(1024 * Math.max(now, 0.04));
  const pruned = 1024 - kept;

  return (
    <div className="lab-demo">
      <div className="lab-controls">
        <label className="lab-slider">
          <span>
            Time since learning <b>{time < 48 ? `${time} h` : `${(time / 24).toFixed(1)} days`}</b>
          </span>
          <input type="range" min="0" max={HOURS} value={time} onChange={(e) => setTime(+e.target.value)} />
        </label>
        <div className="lab-buttons">
          <button type="button" className={`chip lab-toggle ${sleep ? 'is-on' : ''}`} aria-pressed={sleep} onClick={() => setSleep(!sleep)}>
            Sleep consolidation
          </button>
          <button
            type="button"
            className="chip lab-toggle"
            onClick={() => {
              setRecalls((r) => [...new Set([...r, time])].sort((a, b) => a - b));
              sound.click();
            }}
          >
            <PlusIcon size={13} weight="bold" /> Recall at {time} h
          </button>
          <button type="button" className="chip lab-toggle" onClick={() => setRecalls([])}>
            <ArrowCounterClockwiseIcon size={13} weight="bold" /> Clear recalls
          </button>
        </div>
      </div>

      <svg viewBox={`-8 -8 ${W + 16} ${H + 40}`} className="lab-chart" role="img" aria-label={`Retention after ${time} hours is ${Math.round(now * 100)} percent`}>
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <g key={r}>
            <path d={`M0 ${y(r)}H${W}`} className="lab-gridline" />
            <text x="-4" y={y(r) + 4} textAnchor="end" className="lab-axis">
              {Math.round(r * 100)}
            </text>
          </g>
        ))}
        {Array.from({ length: 8 }, (_, d) => (
          <text key={d} x={x(d * 24)} y={H + 20} textAnchor="middle" className="lab-axis">
            {d === 0 ? 'learn' : `day ${d}`}
          </text>
        ))}
        <path d={naive} className="lab-naive" />
        <path d={path} className="lab-curve" />
        {events.map((ev) => (
          <g key={`${ev.kind}-${ev.t}`}>
            <path d={`M${x(ev.t)} 0V${H}`} className={ev.kind === 'recall' ? 'lab-recall' : 'lab-sleep'} />
          </g>
        ))}
        <path d={`M${x(time)} 0V${H}`} className="lab-now" />
        <circle cx={x(time)} cy={y(now)} r="7" className="lab-now-dot" />
      </svg>

      <div className="lab-readout">
        <div>
          <p className="lab-big">{Math.round(now * 100)}%</p>
          <p className="t-small text-ink-3">retained right now</p>
        </div>
        <div className="lab-dots" aria-hidden="true">
          {Array.from({ length: 128 }, (_, i) => (
            <i key={i} className={i < Math.round(kept / 8) ? 'on' : ''} />
          ))}
        </div>
        <div>
          <p className="lab-mid">
            {kept} kept, {pruned} pruned
          </p>
          <p className="t-small text-ink-3">of 1,024 memory vectors</p>
        </div>
      </div>
      <p className="lab-note">
        Dashed: a plain <Term id="ebbinghaus">forgetting curve</Term>. Solid: the same memory with recall and nightly consolidation, which is roughly how the bio-memory model decides what an assistant keeps. An illustration, not the paper’s code.
      </p>
    </div>
  );
}
