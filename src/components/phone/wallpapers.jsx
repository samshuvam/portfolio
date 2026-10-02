import { memo, useId, useMemo } from 'react';
import { useWorld } from '../../lib/world';
import { useWeather } from '../../lib/weather';
import { KEEPSAKE_FRAMES, frameDataUrl } from '../../lib/keepsakes';
import { skyColors, rgbToCss, mix } from '../hero/sky';

// Wallpapers are drawn in code (Mithila art, a live Himalaya sky, the
// season's pigment). No section photograph is repeated. `tone` tells the OS
// whether text on top should be light or dark.
export const WALLPAPERS = [
  { id: 'forest', tone: 'dark' },
  { id: 'mithila', tone: 'dark' },
  { id: 'himalaya', tone: 'dark' },
  { id: 'janaki', tone: 'light' },
  { id: 'season', tone: 'dark' },
  { id: 'boudha', tone: 'dark' },
];

export const wallTone = (id) => (id?.startsWith('art:') ? 'dark' : WALLPAPERS.find((w) => w.id === id)?.tone || 'dark');

const C = { bg: '#1e2453', bg2: '#151a40', cream: '#f3e3c3', red: '#d6452b', yellow: '#eaa42a', green: '#3e8a4a', pink: '#e2708c', ink: '#11142e' };

function Fish({ x, y, r = 0, flip = false, body = C.red }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -1 : 1} 1)`}>
      <path d="M0 0 C22 -26 78 -28 108 -5 L132 -24 L126 0 L132 24 L108 5 C78 28 22 26 0 0 Z" fill={body} stroke={C.cream} strokeWidth="3" strokeLinejoin="round" />
      <path d="M8 0 C26 -18 74 -20 100 -4 L100 4 C74 20 26 18 8 0 Z" fill="none" stroke={C.ink} strokeWidth="1.3" />
      {[34, 50, 66, 82].map((sx) => (
        <path key={sx} d={`M${sx} -14 q8 14 0 28`} fill="none" stroke={C.cream} strokeWidth="1.4" />
      ))}
      <path d="M44 -20 q14 -16 30 -14 l-10 12" fill={C.yellow} stroke={C.cream} strokeWidth="1.6" />
      <circle cx="16" cy="-4" r="5" fill={C.cream} />
      <circle cx="16" cy="-4" r="2.2" fill={C.ink} />
      <path d="M112 -3 l14 -12 M112 3 l14 12" stroke={C.cream} strokeWidth="1.2" />
    </g>
  );
}

function Lotus({ x, y, s = 1 }) {
  const petal = 'M0 0 C-14 -22 -9 -48 0 -62 C9 -48 14 -22 0 0 Z';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-64, -32, 0, 32, 64].map((a, i) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d={petal} fill={i % 2 ? C.pink : C.red} stroke={C.cream} strokeWidth="2.6" />
          <path d="M0 -6 C-6 -22 -4 -40 0 -50 C4 -40 6 -22 0 -6" fill="none" stroke={C.ink} strokeWidth="1.1" />
        </g>
      ))}
      <ellipse cx="0" cy="-2" rx="16" ry="8" fill={C.yellow} stroke={C.cream} strokeWidth="2" />
    </g>
  );
}

function Mithila() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rays = Array.from({ length: 18 }, (_, i) => i * 20);
  return (
    <svg className="sos-wall-svg" viewBox="0 0 360 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id={`sos-hatch-${uid}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={C.cream} strokeWidth="1.1" />
        </pattern>
        <pattern id={`sos-dots-${uid}`} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="1.3" fill={C.cream} opacity="0.35" />
        </pattern>
        <radialGradient id={`sos-mglow-${uid}`} cx="50%" cy="38%" r="60%">
          <stop offset="0" stopColor="#2c3474" />
          <stop offset="1" stopColor={C.bg2} />
        </radialGradient>
      </defs>
      <rect width="360" height="780" fill={`url(#sos-mglow-${uid})`} />
      <rect width="360" height="780" fill={`url(#sos-dots-${uid})`} />
      {/* kachni border: a double outline with hatching in between */}
      <path d="M10 10 H350 V770 H10 Z M22 22 V758 H338 V22 Z" fill={`url(#sos-hatch-${uid})`} fillRule="evenodd" opacity="0.8" />
      <rect x="10" y="10" width="340" height="760" rx="4" fill="none" stroke={C.cream} strokeWidth="2" />
      <rect x="22" y="22" width="316" height="736" rx="2" fill="none" stroke={C.cream} strokeWidth="1.2" />
      {/* the sun, with a face, as on a Mithila wall */}
      <g transform="translate(180 300)">
        {rays.map((a, i) => (
          <path key={a} transform={`rotate(${a})`} d="M-11 -70 L0 -112 L11 -70 Z" fill={i % 2 ? C.yellow : C.red} stroke={C.cream} strokeWidth="2" strokeLinejoin="round" />
        ))}
        <circle r="70" fill={C.red} stroke={C.cream} strokeWidth="3" />
        <circle r="60" fill="none" stroke={C.ink} strokeWidth="1.4" />
        <circle r="54" fill={C.yellow} stroke={C.cream} strokeWidth="2.4" />
        <path d="M-26 -10 q8 -9 16 0 M10 -10 q8 -9 16 0" fill="none" stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="-18" cy="-4" r="3.2" fill={C.ink} />
        <circle cx="18" cy="-4" r="3.2" fill={C.ink} />
        <path d="M0 -2 q-5 12 0 16" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
        <path d="M-14 24 q14 10 28 0" fill={C.red} stroke={C.ink} strokeWidth="2" />
        <circle cx="0" cy="-30" r="4" fill={C.red} />
      </g>
      {/* a pair of fish: good fortune */}
      <Fish x={70} y={520} r={-18} body={C.red} />
      <Fish x={290} y={600} r={-18 + 180} body={C.green} flip={false} />
      {/* lotus pond */}
      <path d="M22 690 C80 672 140 700 200 686 C260 672 300 694 338 684 V758 H22 Z" fill={C.bg} stroke={C.cream} strokeWidth="1.6" />
      {[56, 108, 250, 302].map((x, i) => (
        <ellipse key={x} cx={x} cy={712 + (i % 2) * 14} rx="22" ry="7" fill={C.green} stroke={C.cream} strokeWidth="1.5" />
      ))}
      <Lotus x={180} y={712} s={0.9} />
      <Lotus x={82} y={738} s={0.5} />
      <Lotus x={280} y={738} s={0.5} />
    </svg>
  );
}

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function ridge(seed, base, amp, peaks) {
  const r = seeded(seed);
  const pts = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * 360;
    let y = base;
    peaks.forEach(([px, h, w]) => {
      y -= h * Math.exp(-(((x - px) / w) ** 2));
    });
    y += (r() - 0.5) * amp;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M0,780 L${pts.join(' L')} L360,780 Z`;
}

const RANGES = {
  far: ridge(7, 470, 10, [[60, 120, 40], [150, 170, 34], [210, 210, 30], [290, 140, 46]]),
  mid: ridge(13, 560, 14, [[30, 80, 60], [130, 60, 50], [250, 110, 60], [340, 70, 40]]),
  near: ridge(29, 650, 10, [[80, 50, 90], [260, 40, 80]]),
};
const STARS = (() => {
  const r = seeded(4);
  return Array.from({ length: 70 }, () => [r() * 360, r() * 420, r() * 1.2 + 0.3, r()]);
})();

function Himalaya() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const world = useWorld();
  const weather = useWeather();
  const sky = skyColors(world.sun.elevation, { season: world.season, weather });
  const night = 1 - sky.day;
  const far = mix(sky.horizon, [235, 240, 248], 0.55 * sky.day + 0.1);
  const mid = mix(sky.mid, [30, 38, 70], 0.55);
  const near = mix([24, 30, 58], [18, 22, 40], night);
  return (
    <svg className="sos-wall-svg" viewBox="0 0 360 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sos-sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rgbToCss(sky.top)} />
          <stop offset="0.5" stopColor={rgbToCss(sky.mid)} />
          <stop offset="0.75" stopColor={rgbToCss(sky.horizon)} />
        </linearGradient>
        <linearGradient id={`sos-snow-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor={rgbToCss(far)} />
          <stop offset="1" stopColor={rgbToCss(mix(far, sky.mid, 0.6))} />
        </linearGradient>
      </defs>
      <rect width="360" height="780" fill={`url(#sos-sky-${uid})`} />
      {night > 0.4 && STARS.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={(o * 0.7 + 0.2) * night} />)}
      {night > 0.4 && <circle cx="282" cy="150" r="16" fill="#f4efe0" opacity="0.9" />}
      <path d={RANGES.far} fill={`url(#sos-snow-${uid})`} />
      <path d={RANGES.mid} fill={rgbToCss(mid)} />
      <path d={RANGES.near} fill={rgbToCss(near)} />
    </svg>
  );
}

function Season() {
  const world = useWorld();
  const s = world.season;
  const fill = s.accent.day.fill;
  return (
    <div className="sos-wall-season" style={{ '--w-a': fill, '--w-b': s.accent.night.fill }}>
      <span className="sos-wall-season-word" lang="ne">
        {s.np}
      </span>
    </div>
  );
}

function Photo({id}){const f=KEEPSAKE_FRAMES.find(f=>f.id===id);return f?<div className="sos-wall-photo" style={{background:f.palette[1]}}><img src={frameDataUrl(f)} alt="" decoding="async"/></div>:<Forest/>;}
function Janaki(){return <svg className="sos-wall-svg" viewBox="0 0 360 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="360" height="780" fill="#eee8d8"/><circle cx="270" cy="235" r="90" fill="#d0dbc4"/><g fill="none" stroke="#497560" strokeWidth="2"><path d="M30 560H330V430H30Z M45 430V380Q60 335 75 380V430 M285 430V380Q300 335 315 380V430 M100 430Q100 380 130 375Q160 380 160 430 M200 430Q200 380 230 375Q260 380 260 430 M75 340V360 M300 340V360"/>{[50,105,160,215,270].map(x=><path key={x} d={`M${x} 555V480Q${x+20} 450 ${x+40} 480V555`}/>)}</g><text x="35" y="640" fill="#3d6856" fontSize="12" letterSpacing="4">JANAKPUR / HOME</text></svg>;}
function Forest(){return <svg className="sos-wall-svg" viewBox="0 0 360 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="360" height="780" fill="#183d32"/>{Array.from({length:22},(_,i)=><path key={i} d={`M-90 ${240+i*27}Q130 ${80+i*26} 230 ${320+i*18}T480 ${250+i*24}`} fill="none" stroke={i%3?'#a8c2a0':'#d6dabc'} strokeWidth=".8" opacity=".18"/>)}<path d="M-30 730Q140 450 225 480T390 330" fill="none" stroke="#a3d9b7" strokeWidth="1" strokeDasharray="3 9" opacity=".5"/><circle cx="225" cy="480" r="4" fill="#dcebdc"/><text x="38" y="690" fill="#c5dec9" fontSize="12" letterSpacing="4">SS / STILL FLYING</text></svg>;}
function Boudha(){return <svg className="sos-wall-svg" viewBox="0 0 360 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="360" height="780" fill="#253e3b"/><circle cx="180" cy="340" r="100" fill="#d9cda7" opacity=".12"/><g fill="none" stroke="#e2d4a4" strokeWidth="2"><path d="M30 560H330M65 540Q70 420 180 420Q290 420 295 540 M155 420V350H205V420 M165 350L180 290L195 350 M175 290V265 M160 367Q170 360 178 367 M184 367Q194 360 202 367 M70 560V585H290V560"/></g><text x="65" y="650" fill="#e2d4a4" fontSize="12" letterSpacing="4">A LITTLE STILLNESS</text></svg>;}
function WallpaperInner({ id }) {
  const node = useMemo(() => {
    if (id === 'forest') return <Forest />;
    if (id === 'himalaya') return <Himalaya />;
    if (id === 'janaki') return <Janaki />;
    if (id === 'season') return <Season />;
    if (id === 'boudha') return <Boudha />;
    if (id?.startsWith('art:')) return <Photo id={id.slice(4)} />;
    return <Mithila />;
  }, [id]);
  return (
    <div className="sos-wall" data-tone={wallTone(id)} aria-hidden="true">
      {node}
    </div>
  );
}

export const Wallpaper = memo(WallpaperInner);
// Small previews for Settings.
export const WallThumb = memo(function WallThumb({ id }) {
  return (
    <div className="sos-wall-thumb">
      <WallpaperInner id={id} />
    </div>
  );
});
