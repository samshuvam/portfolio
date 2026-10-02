import { contextImage } from '../../lib/imagery';
import { localDigits, useLang, useT } from '../../i18n';
import dict from '../../i18n/ui/core';

// Tiny animated diagrams for glossary cards. Line art in currentColor with
// the season accent, animated with CSS so they cost nothing when hidden.

// Each diagram's accessible label comes from the core dictionary (art.<key>).
function S({ children, k }) {
  const t = useT(dict);
  return (
    <svg viewBox="0 0 300 120" className="term-art" role="img" aria-label={t(`art.${k}`)}>
      {children}
    </svg>
  );
}

// Translated words drawn inside the diagrams.
function Word({ k }) {
  const t = useT(dict);
  return t(k);
}
function Digits({ children }) {
  const lang = useLang();
  return localDigits(children, lang);
}

const arts = {
  rag: (
    <S k="rag">
      {[0, 1, 2].map((i) => (
        <g key={i} className="ta-float" style={{ animationDelay: `${i * 0.3}s` }}>
          <rect x={30 + i * 34} y={30 + i * 6} width="38" height="50" rx="5" className="ta-paper" />
          <path d={`M${38 + i * 34} ${44 + i * 6}h22M${38 + i * 34} ${52 + i * 6}h18M${38 + i * 34} ${60 + i * 6}h20`} className="ta-line" />
        </g>
      ))}
      <path d="M150 62h40" className="ta-accent ta-dash" />
      <path d="M186 56l8 6-8 6" className="ta-accent" />
      <rect x="205" y="34" width="70" height="56" rx="10" className="ta-paper" />
      <path d="M216 50h48M216 60h40M216 70h44" className="ta-line ta-type" />
    </S>
  ),
  tokens: (
    <S k="tokens">
      {['Jan', 'ak', 'pur', ' is', ' home'].map((t, i) => (
        <g key={t} className="ta-pop" style={{ animationDelay: `${i * 0.18}s` }}>
          <rect x={22 + i * 52} y="42" width="46" height="34" rx="8" className={i % 2 ? 'ta-paper' : 'ta-fill'} />
          <text x={45 + i * 52} y="64" textAnchor="middle" className="ta-text">
            {t}
          </text>
        </g>
      ))}
    </S>
  ),
  window: (
    <S k="window">
      <rect x="40" y="30" width="220" height="60" rx="10" className="ta-paper" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={50 + i * 20.5} y="42" width="16" height="36" rx="4" className="ta-fill ta-pop" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </S>
  ),
  lora: (
    <S k="lora">
      <rect x="40" y="25" width="150" height="70" rx="10" className="ta-paper" />
      {Array.from({ length: 5 }, (_, r) => Array.from({ length: 9 }, (_, c) => <circle key={`${r}-${c}`} cx={55 + c * 15} cy={36 + r * 12} r="2.4" className="ta-dot" />))}
      <rect x="210" y="40" width="50" height="40" rx="8" className="ta-fill ta-pulse" />
      <path d="M190 60h20" className="ta-accent" />
    </S>
  ),
  nodes: (
    <S k="nodes">
      <circle cx="150" cy="60" r="16" className="ta-fill" />
      {[
        [50, 30],
        [50, 90],
        [250, 30],
        [250, 90],
        [150, 108],
      ].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y}L150 60`} className="ta-line ta-dash" />
          <circle cx={x} cy={y} r="9" className="ta-paper" />
          <circle r="3" className="ta-accent-dot">
            <animateMotion dur="1.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" path={`M${x} ${y}L150 60`} />
          </circle>
        </g>
      ))}
    </S>
  ),
  noise: (
    <S k="noise">
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={30 + (i % 10) * 26} cy={30 + Math.floor(i / 10) * 20} r="4" className={i === 17 ? 'ta-accent-dot' : 'ta-dot ta-jitter'} style={{ animationDelay: `${(i * 0.07) % 1}s` }} />
      ))}
    </S>
  ),
  vectors: (
    <S k="vectors">
      <path d="M40 100h220M40 100V18" className="ta-line" />
      {[
        [80, 40],
        [92, 52],
        [76, 58],
        [200, 70],
        [214, 82],
        [190, 88],
        [150, 30],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="6" className={i < 3 ? 'ta-fill ta-pop' : 'ta-paper ta-pop'} style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </S>
  ),
  curve: (
    <S k="curve">
      <path d="M30 100h240M30 100V20" className="ta-line" />
      <path d="M30 24C60 70 80 80 100 84L100 30C130 66 150 72 175 74L175 34C205 60 230 64 270 66" className="ta-accent ta-draw" />
    </S>
  ),
  graph: (
    <S k="graph">
      {[
        [60, 40, 150, 70],
        [150, 70, 240, 36],
        [150, 70, 210, 100],
        [60, 40, 90, 100],
      ].map(([a, b, c, d], i) => (
        <path key={i} d={`M${a} ${b}L${c} ${d}`} className="ta-line" />
      ))}
      {[
        [60, 40],
        [150, 70],
        [240, 36],
        [210, 100],
        [90, 100],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 1 ? 12 : 8} className={i === 1 ? 'ta-fill ta-pulse' : 'ta-paper'} />
      ))}
    </S>
  ),
  verify: (
    <S k="verify">
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="40" y={22 + i * 28} width="170" height="20" rx="6" className="ta-paper" />
          <path d={`M232 ${32 + i * 28}l6 6 12-12`} className={i === 1 ? 'ta-line' : 'ta-accent ta-draw'} style={{ animationDelay: `${i * 0.4}s` }} />
          {i === 1 && <path d={`M230 ${26 + i * 28}l14 14M244 ${26 + i * 28}l-14 14`} className="ta-accent" />}
        </g>
      ))}
    </S>
  ),
  symbols: (
    <S k="symbols">
      {['Ψ', 'ψ', 'σ', 'κ'].map((c, i) => (
        <g key={c} className="ta-float" style={{ animationDelay: `${i * 0.25}s` }}>
          <rect x={36 + i * 60} y="38" width="44" height="44" rx="10" className={i === 0 ? 'ta-fill' : 'ta-paper'} />
          <text x={58 + i * 60} y="68" textAnchor="middle" className="ta-text ta-big">
            {c}
          </text>
        </g>
      ))}
    </S>
  ),
  wave: (
    <S k="wave">
      {Array.from({ length: 22 }, (_, i) => (
        <rect key={i} x={30 + i * 7} y={60 - (8 + ((i * 37) % 26))} width="4" height={16 + ((i * 37) % 26) * 2} rx="2" className="ta-fill ta-bar" style={{ animationDelay: `${i * 0.05}s` }} />
      ))}
      <path d="M200 46h70M200 60h56M200 74h64" className="ta-line ta-type" />
    </S>
  ),
  trees: (
    <S k="trees">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${45 + i * 80} 20)`}>
          <path d="M30 6L12 40M30 6L48 40M12 40L4 76M12 40L20 76M48 40L40 76M48 40L56 76" className="ta-line" />
          <circle cx="30" cy="6" r="5" className="ta-fill" />
        </g>
      ))}
    </S>
  ),
  shield: (
    <S k="shield">
      <path d="M150 18l44 14v28c0 26-20 40-44 48-24-8-44-22-44-48V32z" className="ta-paper" />
      <path d="M132 62l12 12 24-26" className="ta-accent ta-draw" />
    </S>
  ),
  rover: (
    <S k="rover">
      <path d="M10 96C70 84 110 100 160 86s90 4 130-8" className="ta-line" />
      <g className="ta-drive">
        <rect x="40" y="62" width="44" height="20" rx="5" className="ta-fill" />
        <circle cx="50" cy="86" r="6" className="ta-paper" />
        <circle cx="76" cy="86" r="6" className="ta-paper" />
      </g>
      <path d="M90 70C130 60 170 72 220 62" className="ta-accent ta-dash" />
    </S>
  ),
  erp: (
    <S k="erp">
      <circle cx="150" cy="60" r="20" className="ta-fill ta-pulse" />
      {['art.sales', 'art.stock', 'art.books', 'art.people'].map((t, i) => {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 4;
        const x = 150 + Math.cos(a) * 95;
        const y = 60 + Math.sin(a) * 42;
        return (
          <g key={t}>
            <path d={`M150 60L${x} ${y}`} className="ta-line" />
            <rect x={x - 24} y={y - 11} width="48" height="22" rx="11" className="ta-paper" />
            <text x={x} y={y + 4} textAnchor="middle" className="ta-text ta-small">
              <Word k={t} />
            </text>
          </g>
        );
      })}
    </S>
  ),
  vision: (
    <S k="vision">
      <rect x="70" y="20" width="160" height="80" rx="10" className="ta-paper" />
      <rect x="120" y="34" width="60" height="52" rx="4" className="ta-accent ta-scan-box" />
      <path d="M140 80V54m8 26V48m8 32V50m8 30V58" className="ta-line" />
    </S>
  ),
  drone: (
    <S k="drone">
      {[60, 110, 170, 220].map((x, i) => (
        <rect key={x} x={x} y={120 - (40 + (i % 2) * 30)} width="34" height={40 + (i % 2) * 30} rx="3" className="ta-paper" />
      ))}
      <path d="M10 40C90 20 200 60 290 30" className="ta-accent ta-dash" />
      <g>
        <circle r="5" className="ta-accent-dot">
          <animateMotion dur="3.4s" repeatCount="indefinite" path="M10 40C90 20 200 60 290 30" />
        </circle>
      </g>
    </S>
  ),
  radar: (
    <S k="radar">
      <circle cx="150" cy="60" r="50" className="ta-line" />
      <circle cx="150" cy="60" r="30" className="ta-line" />
      <g className="ta-sweep" style={{ transformOrigin: '150px 60px' }}>
        <path d="M150 60L150 10A50 50 0 0 1 193 35z" className="ta-sweep-fill" />
      </g>
      <circle cx="176" cy="44" r="4" className="ta-accent-dot ta-pulse" />
      <circle cx="128" cy="84" r="3" className="ta-dot" />
    </S>
  ),
  lotus: (
    <S k="lotus">
      <g transform="translate(150 72)">
        {[-60, -30, 0, 30, 60].map((r, i) => (
          <path key={r} d="M0 0C-14 -20 -10 -44 0 -56C10 -44 14 -20 0 0" transform={`rotate(${r})`} className={i === 2 ? 'ta-fill' : 'ta-paper'} />
        ))}
        <path d="M-70 10h140" className="ta-line" />
      </g>
    </S>
  ),
  fish: (
    <S k="fish">
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${i ? 190 : 110} ${i ? 72 : 48}) scale(${i ? -1 : 1} 1)`} className="ta-swim">
          <path d="M-40 0C-20 -22 20 -22 34 0C20 22 -20 22 -40 0z" className={i ? 'ta-paper' : 'ta-fill'} />
          <path d="M34 0l16 -14v28z" className={i ? 'ta-paper' : 'ta-fill'} />
          <circle cx="-26" cy="-3" r="3" className="ta-dot" />
          <path d="M-14 -12v24M-4 -14v28M6 -13v26M16 -9v18" className="ta-line" />
        </g>
      ))}
    </S>
  ),
  script: (
    <S k="script">
      <text x="150" y="74" textAnchor="middle" className="ta-text ta-tirhuta">
        {'\u{114A7}\u{114B1}\u{1149F}\u{114B1}\u{114AA}\u{114B0}'}
      </text>
      <text x="150" y="104" textAnchor="middle" className="ta-text ta-small">
        <Word k="art.scriptCaption" />
      </text>
    </S>
  ),
  sun: (
    <S k="sun">
      <circle cx="150" cy="56" r="22" className="ta-fill ta-pulse" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M150 22v-10" transform={`rotate(${i * 30} 150 56)`} className="ta-accent" />
      ))}
      <path d="M60 96h180M90 106h120" className="ta-line ta-dash" />
    </S>
  ),
  kite: (
    <S k="kite">
      <g className="ta-float">
        <path d="M150 14l30 34-30 34-30-34z" className="ta-fill" />
        <path d="M150 14v68M120 48h60" className="ta-line" />
      </g>
      <path d="M150 82C170 96 120 104 150 120" className="ta-line ta-dash" />
    </S>
  ),
  diyo: (
    <S k="diyo">
      {[90, 150, 210].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 18} 84h36c-4 12-30 12-36 0z`} className="ta-paper" />
          <path d={`M${x} 82c-6-10 0-22 0-30 0 8 6 20 0 30z`} className="ta-fill ta-flicker" style={{ animationDelay: `${i * 0.2}s` }} />
        </g>
      ))}
    </S>
  ),
  calendar: (
    <S k="calendar">
      <rect x="50" y="24" width="90" height="76" rx="10" className="ta-paper" />
      <rect x="160" y="24" width="90" height="76" rx="10" className="ta-fill" />
      <text x="95" y="74" textAnchor="middle" className="ta-text ta-big">
        2026
      </text>
      <text x="205" y="74" textAnchor="middle" className="ta-text ta-big ta-on-fill">
        २०८३
      </text>
    </S>
  ),
  clock: (
    <S k="clock">
      <circle cx="150" cy="60" r="44" className="ta-paper" />
      <path d="M150 60V30" className="ta-line" />
      <path d="M150 60h-30" className="ta-accent ta-hand" style={{ transformOrigin: '150px 60px' }} />
      <text x="230" y="66" className="ta-text">
        <Digits>+5:45</Digits>
      </text>
    </S>
  ),
  seasons: (
    <S k="seasons">
      {['#d42c43', '#f2a31b', '#1f7a45', '#f08a24', '#d9a520', '#3557c4'].map((c, i) => (
        <path key={c} d="M150 60L150 14A46 46 0 0 1 189.8 37z" transform={`rotate(${i * 60} 150 60)`} style={{ fill: c, opacity: 0.85 }} />
      ))}
      <circle cx="150" cy="60" r="14" className="ta-paper" />
    </S>
  ),
  paper: (
    <S k="paper">
      <rect x="70" y="20" width="160" height="84" rx="4" style={{ fill: '#efe7d6' }} />
      {Array.from({ length: 18 }, (_, i) => (
        <path key={i} d={`M${80 + ((i * 53) % 140)} ${28 + ((i * 29) % 68)}q6 3 14 0`} style={{ stroke: '#b9a77f', fill: 'none', strokeWidth: 1 }} />
      ))}
    </S>
  ),
  flower: (
    <S k="flower">
      {[
        [110, 56],
        [150, 46],
        [190, 60],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`} className="ta-pop" style={{ animationDelay: `${i * 0.2}s` }}>
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} rx="9" ry="16" cy="-12" transform={`rotate(${r})`} style={{ fill: '#d42c43' }} />
          ))}
          <circle r="5" style={{ fill: '#f7d36a' }} />
        </g>
      ))}
    </S>
  ),
  mountain: (
    <S k="mountain">
      <path d="M0 110L70 50 100 72 150 14 190 64 220 46 300 110z" className="ta-paper" />
      <path d="M150 14l-14 22 10-4 6 8 8-12 10 4z" style={{ fill: '#fff' }} />
      <text x="150" y="104" textAnchor="middle" className="ta-text ta-small">
        <Digits>8,848.86 m</Digits>
      </text>
    </S>
  ),
  stars: (
    <S k="stars">
      <path d="M40 50L60 58 92 64 120 66 150 78 166 100 220 80 250 82M130 26L126 46 120 66M150 78L176 66 206 60 260 58" className="ta-line ta-draw" />
      {[
        [40, 50],
        [60, 58],
        [92, 64],
        [120, 66],
        [150, 78],
        [166, 100],
        [220, 80],
        [130, 26],
        [176, 66],
        [206, 60],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 5 ? 5 : 3} className={i === 5 ? 'ta-accent-dot ta-pulse' : 'ta-dot'} />
      ))}
    </S>
  ),
  planet: (
    <S k="planet">
      <circle cx="150" cy="60" r="10" className="ta-fill" />
      <ellipse cx="150" cy="60" rx="90" ry="30" className="ta-line" />
      <circle r="6" className="ta-accent-dot">
        <animateMotion dur="4s" repeatCount="indefinite" path="M60 60a90 30 0 1 0 180 0a90 30 0 1 0-180 0" />
      </circle>
    </S>
  ),
};

export default function TermArt({ art, image }) {
  const p = image ? contextImage(image) : null;
  if(p) return <img src={p.src} alt="" loading="lazy" decoding="async" />;
  return arts[art] || arts.tokens;
}
