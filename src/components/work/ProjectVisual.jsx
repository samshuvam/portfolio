// Animated diagrams, one per project. Each one shows the idea, not a fake
// screenshot: what flows where, what changes, what gets checked.
import './project-visual.css';

const V = ({ children, label }) => (
  <svg viewBox="0 0 400 300" className="pv" role="img" aria-label={label}>
    {children}
  </svg>
);

function Segments() {
  return (
    <V label="A template split into segments, each generated with its own full context window">
      <text x="24" y="34" className="pv-label">TEMPLATE</text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="24" y={48 + i * 52} width="130" height="38" rx="8" className="pv-box" />
          <rect x="24" y={48 + i * 52} width="130" height="38" rx="8" className="pv-seg" style={{ animationDelay: `${i * 1.2}s` }} />
          <path d={`M36 ${62 + i * 52}h70M36 ${72 + i * 52}h50`} className="pv-line" />
        </g>
      ))}
      <text x="222" y="34" className="pv-label">FULL WINDOW</text>
      <rect x="222" y="48" width="154" height="142" rx="12" className="pv-box" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={234 + (i % 6) * 22.5} y={60 + Math.floor(i / 6) * 31} width="17" height="22" rx="4" className="pv-token" style={{ animationDelay: `${(i % 6) * 0.08 + Math.floor(i / 6) * 0.12}s` }} />
      ))}
      <path d="M216 120H164" className="pv-flow" />
      <path d="M170 113l-8 7 8 7" className="pv-accent-line" />
      <text x="222" y="222" className="pv-big">+203%</text>
      <text x="222" y="244" className="pv-label">vs naive RAG, 500 queries</text>
    </V>
  );
}

function Memory() {
  return (
    <V label="Memories decay on a forgetting curve, recall reinforces them, sleep consolidates them">
      <path d="M36 250H376M36 250V40" className="pv-axis" />
      <text x="36" y="32" className="pv-label">RETENTION</text>
      <text x="300" y="270" className="pv-label">TIME</text>
      <path d="M36 52C70 160 90 190 120 200" className="pv-ghost" />
      <path d="M36 52C60 120 80 140 104 146L104 70C140 140 170 150 200 152L200 64C250 110 300 118 370 120" className="pv-curve" />
      {[104, 200].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={i ? 64 : 70} r="6" className="pv-dot-accent" />
          <text x={x + 10} y={i ? 60 : 66} className="pv-small">
            {i ? 'sleep' : 'recall'}
          </text>
        </g>
      ))}
      <g transform="translate(232 196)">
        <path d="M14 0A14 14 0 1 0 28 18 11 11 0 0 1 14 0z" className="pv-moon" />
      </g>
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={268 + (i % 6) * 18} cy={190 + Math.floor(i / 6) * 18} r="5" className={i % 4 === 1 ? 'pv-node-fade' : 'pv-node'} style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </V>
  );
}

function Corridors() {
  const buildings = [
    [40, 130, 38, 120],
    [96, 90, 44, 160],
    [158, 150, 36, 100],
    [212, 70, 48, 180],
    [278, 120, 40, 130],
    [334, 100, 40, 150],
  ];
  return (
    <V label="Drones moving through layered city corridors, one conflict resolved by a climb">
      {buildings.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="3" className="pv-box" />
      ))}
      {[52, 84, 116].map((y, i) => (
        <path key={y} d={`M10 ${y}C120 ${y - 12} 260 ${y + 12} 390 ${y}`} className="pv-corridor" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      <circle r="6" className="pv-dot-accent">
        <animateMotion dur="5s" repeatCount="indefinite" path="M10 84C120 72 260 96 390 84" />
      </circle>
      <circle r="6" className="pv-dot">
        <animateMotion dur="5s" repeatCount="indefinite" path="M390 84C320 90 260 96 210 84C190 70 170 56 140 54C100 50 60 50 10 52" />
      </circle>
      <circle r="5" className="pv-dot">
        <animateMotion dur="7s" repeatCount="indefinite" path="M10 116C120 104 260 128 390 116" />
      </circle>
      <circle cx="210" cy="84" r="16" className="pv-conflict" />
      <text x="232" y="40" className="pv-small">climb to resolve</text>
    </V>
  );
}

function Symbols() {
  const units = [
    ['Ψ', 'Psifi'],
    ['ψ', 'Psif'],
    ['σ', 'Sif'],
    ['κ', 'Keno'],
  ];
  return (
    <V label="Language turned into compact symbolic units and composed">
      <text x="24" y="44" className="pv-text">"Janakpur is home."</text>
      <path d="M200 60v26" className="pv-flow" />
      {units.map(([c, name], i) => (
        <g key={name} className="pv-unit" style={{ animationDelay: `${i * 0.25}s` }}>
          <rect x={30 + i * 88} y="96" width="64" height="64" rx="14" className={i === 0 ? 'pv-fill' : 'pv-box'} />
          <text x={62 + i * 88} y="138" textAnchor="middle" className={`pv-glyph ${i === 0 ? 'pv-on-fill' : ''}`}>
            {c}
          </text>
          <text x={62 + i * 88} y="180" textAnchor="middle" className="pv-small">
            {name}
          </text>
        </g>
      ))}
      <path d="M62 196C62 236 200 220 200 256M150 196C150 230 200 226 200 256M238 196C238 230 200 226 200 256M326 196C326 236 200 220 200 256" className="pv-line pv-draw" />
      <circle cx="200" cy="262" r="8" className="pv-dot-accent" />
    </V>
  );
}

function Federated() {
  const clients = [
    [70, 70],
    [70, 230],
    [330, 70],
    [330, 230],
    [200, 270],
  ];
  return (
    <V label="Clients train locally and send only model updates to a shared model">
      <circle cx="200" cy="150" r="34" className="pv-fill pv-breathe" />
      <text x="200" y="155" textAnchor="middle" className="pv-small pv-on-fill">
        global
      </text>
      {clients.map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y}L200 150`} className="pv-line pv-dashed" />
          <rect x={x - 26} y={y - 20} width="52" height="40" rx="10" className="pv-box" />
          <rect x={x - 16} y={y - 9} width="18" height="18" rx="3" className="pv-data" />
          <path d={`M${x + 6} ${y - 4}h8M${x + 6} ${y + 4}h6`} className="pv-line" />
          <circle r="4.5" className="pv-dot-accent">
            <animateMotion dur="2.4s" begin={`${i * 0.45}s`} repeatCount="indefinite" path={`M${x} ${y}L200 150`} />
          </circle>
        </g>
      ))}
      <text x="24" y="292" className="pv-label">RAW DATA NEVER LEAVES THE DEVICE</text>
    </V>
  );
}

function Retrieval() {
  return (
    <V label="A query fans out to web pages and videos, video is transcribed, evidence is ranked">
      <rect x="20" y="126" width="70" height="44" rx="10" className="pv-fill" />
      <text x="55" y="153" textAnchor="middle" className="pv-small pv-on-fill">
        query
      </text>
      <path d="M90 140C120 120 130 80 150 72M90 156C120 176 130 216 150 224" className="pv-flow" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x="150" y={50 + i * 22} width="62" height="34" rx="6" className="pv-box" style={{ transform: `translate(${i * 8}px, 0)` }} />
        </g>
      ))}
      <rect x="150" y="196" width="78" height="52" rx="8" className="pv-box" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={158 + i * 5.5} y={222 - (4 + ((i * 7) % 12))} width="3" height={8 + ((i * 7) % 12) * 2} rx="1.5" className="pv-wave" style={{ animationDelay: `${i * 0.06}s` }} />
      ))}
      <path d="M236 222h26M236 82h26" className="pv-flow" />
      <text x="268" y="40" className="pv-label">RANKED EVIDENCE</text>
      {[0.92, 0.81, 0.64, 0.4].map((s, i) => (
        <g key={s}>
          <rect x="268" y={56 + i * 50} width="112" height="36" rx="8" className="pv-box" />
          <rect x="278" y={70 + i * 50} width={70 * s} height="8" rx="4" className={i === 0 ? 'pv-fill' : 'pv-muted'} />
          <text x="356" y={78 + i * 50} className="pv-small">
            {s.toFixed(2)}
          </text>
        </g>
      ))}
    </V>
  );
}

function Trajectory() {
  return (
    <V label="Flight paths with time stamps, a predicted conflict and a reroute">
      <path d="M20 60h360M20 150h360M20 240h360M80 20v260M200 20v260M320 20v260" className="pv-grid" />
      <path d="M20 250C120 200 220 120 380 70" className="pv-line" />
      <path d="M20 70C140 110 220 170 380 250" className="pv-line" />
      <path d="M20 70C140 110 180 70 240 100C300 130 330 200 380 250" className="pv-accent-line pv-draw" />
      {['t+2', 't+4', 't+6'].map((t, i) => (
        <g key={t}>
          <circle cx={80 + i * 120} cy={226 - i * 70} r="4" className="pv-dot" />
          <text x={88 + i * 120} y={222 - i * 70} className="pv-small">
            {t}
          </text>
        </g>
      ))}
      <circle cx="200" cy="152" r="18" className="pv-conflict" />
      <text x="214" y="196" className="pv-small">conflict at t+4</text>
    </V>
  );
}

function Verify() {
  return (
    <V label="Each claim checked against sources; ungrounded ones are dropped">
      {['Sita was born in Janakpur.', 'Everest is 9,000 m tall.', 'Chhath honours the sun.'].map((c, i) => (
        <g key={c}>
          <rect x="24" y={40 + i * 76} width="290" height="54" rx="12" className="pv-box" />
          <text x="40" y={72 + i * 76} className="pv-text-sm">
            {c}
          </text>
          {i === 1 ? (
            <path d={`M332 ${58 + i * 76}l20 20M352 ${58 + i * 76}l-20 20`} className="pv-accent-line" />
          ) : (
            <path d={`M330 ${68 + i * 76}l8 8 16-18`} className="pv-line pv-draw" style={{ animationDelay: `${i * 0.5}s` }} />
          )}
        </g>
      ))}
    </V>
  );
}

function Multimodal() {
  return (
    <V label="Text, audio and images embedded into one vector store guarded by policy">
      <rect x="24" y="40" width="70" height="52" rx="8" className="pv-box" />
      <path d="M36 56h44M36 66h34M36 76h40" className="pv-line" />
      <rect x="24" y="124" width="70" height="52" rx="8" className="pv-box" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={32 + i * 7} y={150 - (3 + ((i * 5) % 10))} width="3" height={6 + ((i * 5) % 10) * 2} rx="1.5" className="pv-wave" />
      ))}
      <rect x="24" y="208" width="70" height="52" rx="8" className="pv-box" />
      <path d="M32 252l18-20 12 12 8-8 16 16z" className="pv-muted" />
      <path d="M100 66C150 80 160 130 196 140M100 150h96M100 234C150 220 160 170 196 160" className="pv-flow" />
      <ellipse cx="250" cy="110" rx="46" ry="14" className="pv-box" />
      <path d="M204 110v80c0 8 20 14 46 14s46-6 46-14v-80" className="pv-box" />
      <path d="M204 140c0 8 20 14 46 14s46-6 46-14M204 168c0 8 20 14 46 14s46-6 46-14" className="pv-line" />
      <rect x="236" y="214" width="28" height="24" rx="5" className="pv-fill" />
      <path d="M242 214v-6a8 8 0 0 1 16 0v6" className="pv-accent-line" />
      <text x="310" y="150" className="pv-small">policy</text>
      <text x="310" y="166" className="pv-small">checked</text>
    </V>
  );
}

function Rover() {
  return (
    <V label="A rover on hilly terrain predicting its path">
      <path d="M0 230C60 210 90 160 150 170S250 230 300 190 370 150 400 160V300H0z" className="pv-ground" />
      <path d="M150 170C200 176 240 222 300 190" className="pv-accent-line pv-dashed" />
      <g className="pv-rover">
        <rect x="96" y="160" width="44" height="22" rx="5" className="pv-fill" />
        <circle cx="106" cy="186" r="7" className="pv-box" />
        <circle cx="130" cy="186" r="7" className="pv-box" />
        <path d="M140 166l14-8" className="pv-line" />
      </g>
      <path d="M240 206l10-16 10 16z" className="pv-muted" />
      <text x="24" y="40" className="pv-label">WORLD MODEL: PREDICT, THEN DRIVE</text>
    </V>
  );
}

function Hospital() {
  return (
    <V label="Patient records summarised by an LLM on request">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${30 + i * 14} ${50 + i * 14})`}>
          <rect width="140" height="100" rx="10" className="pv-box" />
          <path d="M14 22h70M14 38h100M14 52h84M14 66h96" className="pv-line" />
        </g>
      ))}
      <path d="M200 120h40" className="pv-flow" />
      <rect x="250" y="70" width="128" height="118" rx="14" className="pv-fill-soft" />
      <text x="264" y="98" className="pv-label">SUMMARY</text>
      <path d="M264 116h86M264 132h70M264 148h80" className="pv-accent-line pv-type" />
      <rect x="40" y="226" width="200" height="40" rx="20" className="pv-box" />
      <text x="58" y="251" className="pv-text-sm">History of patient 1042?</text>
    </V>
  );
}

function Gesture() {
  const pts = [
    [200, 250],
    [170, 200],
    [160, 150],
    [150, 105],
    [195, 140],
    [195, 85],
    [195, 45],
    [225, 145],
    [232, 92],
    [236, 56],
    [250, 160],
    [262, 118],
    [270, 90],
  ];
  const links = [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 4],
    [4, 5],
    [5, 6],
    [0, 7],
    [7, 8],
    [8, 9],
    [0, 10],
    [10, 11],
    [11, 12],
  ];
  return (
    <V label="Hand landmarks tracked for a gesture">
      {links.map(([a, b], i) => (
        <path key={i} d={`M${pts[a][0]} ${pts[a][1]}L${pts[b][0]} ${pts[b][1]}`} className="pv-line" />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 7 : 5} className={i % 3 === 0 ? 'pv-dot-accent pv-pulse' : 'pv-dot'} />
      ))}
      <rect x="110" y="24" width="190" height="250" rx="12" className="pv-scan" />
      <text x="310" y="60" className="pv-small">present</text>
      <text x="310" y="78" className="pv-small">mood: focused</text>
    </V>
  );
}

function Bus() {
  return (
    <V label="A bus moving along its route with seat availability and a fare">
      <path d="M30 80C120 40 200 120 370 60" className="pv-line" />
      {[30, 130, 250, 370].map((x, i) => (
        <circle key={x} cx={x} cy={[80, 66, 96, 60][i]} r="7" className="pv-box" />
      ))}
      <circle r="9" className="pv-dot-accent">
        <animateMotion dur="6s" repeatCount="indefinite" path="M30 80C120 40 200 120 370 60" />
      </circle>
      <g transform="translate(40 140)">
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={(i % 4) * 34 + (i % 4 > 1 ? 16 : 0)} y={Math.floor(i / 4) * 30} width="26" height="22" rx="5" className={[1, 6, 7, 12].includes(i) ? 'pv-fill' : 'pv-box'} />
        ))}
      </g>
      <text x="240" y="168" className="pv-label">EXAMPLE FARE</text>
      <text x="240" y="208" className="pv-big">Rs 640</text>
      <text x="240" y="230" className="pv-small">rises as seats fill</text>
    </V>
  );
}

const kinds = { segments: Segments, memory: Memory, corridors: Corridors, symbols: Symbols, federated: Federated, retrieval: Retrieval, trajectory: Trajectory, verify: Verify, multimodal: Multimodal, rover: Rover, hospital: Hospital, gesture: Gesture, bus: Bus };

export default function ProjectVisual({ kind }) {
  const C = kinds[kind] || Segments;
  return <C />;
}
