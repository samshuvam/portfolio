// Mithila painting motifs, drawn as line art (kachni style): double
// outlines, hatching, and the four classic symbols.

const Hatch = ({ id, color }) => (
  <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(35)">
    <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2.2" />
  </pattern>
);

export function Fish() {
  const scales = [];
  [62, 80, 98].forEach((x, i) =>
    [88, 101, 114].forEach((y) => {
      scales.push(`M${x + (i % 2) * 4 - 7} ${y}a7 7 0 0 0 14 0`);
    }),
  );
  return (
    <svg viewBox="0 0 200 200" className="motif" role="img" aria-label="Mithila fish">
      <defs>
        <Hatch id="h-fish" color="#c8311f" />
      </defs>
      <path className="m-fill" fill="url(#h-fish)" d="M30 100C55 55 125 50 160 95C125 145 55 145 30 100Z" />
      <path className="m-line" d="M30 100C55 55 125 50 160 95C125 145 55 145 30 100Z" />
      <path className="m-line m-thin" d="M41 100C63 67 122 63 149 96C122 133 63 133 41 100Z" />
      <path className="m-line" d="M30 100L8 75Q17 100 8 125Z" />
      <path className="m-line m-thin" d="M27 100L12 86M27 100H11M27 100L12 114" />
      <path className="m-line" d="M70 66Q82 42 99 60M72 134Q87 154 101 139" />
      <path className="m-line m-thin" d="M122 71Q111 96 122 121" />
      <path className="m-line m-thin" d={scales.join('')} />
      <circle className="m-line" cx="138" cy="92" r="8.5" />
      <circle className="m-dot" cx="138" cy="92" r="3.5" />
      <path className="m-line" d="M157 98q6-1 9 3" />
    </svg>
  );
}

export function Peacock() {
  return (
    <svg viewBox="0 0 200 200" className="motif" role="img" aria-label="Mithila peacock">
      <defs>
        <Hatch id="h-peacock" color="#27306b" />
      </defs>
      <path className="m-fill" fill="url(#h-peacock)" d="M121 121C111 95 86 92 79 110C74 126 93 141 121 139Z" />
      <path className="m-line" d="M121 121C111 95 86 92 79 110C74 126 93 141 121 139Z" />
      <path className="m-line m-thin" d="M114 122C106 104 90 102 86 113C83 123 96 132 114 132Z" />
      <path className="m-line" d="M84 105C75 83 69 64 74 50" />
      <path className="m-line" d="M90 101C82 82 78 66 82 52" />
      <circle className="m-line" cx="77" cy="45" r="9" />
      <circle className="m-dot" cx="74" cy="43" r="2" />
      <path className="m-line" d="M69 44L57 47L69 50" />
      <path className="m-line m-thin" d="M78 36L71 21M80 35V19M82 36L89 22" />
      <circle className="m-dot" cx="71" cy="20" r="2.2" />
      <circle className="m-dot" cx="80" cy="18" r="2.2" />
      <circle className="m-dot" cx="89" cy="21" r="2.2" />
      <path className="m-line" d="M121 126C151 120 176 136 188 164M119 133C146 141 161 161 166 188M115 137C133 153 139 176 131 196" />
      <path className="m-line m-thin" d="M126 129C140 126 152 128 160 134M124 135C136 140 145 148 150 158M120 139C128 147 132 157 133 168" />
      {[
        [185, 160],
        [163, 182],
        [131, 189],
      ].map(([x, y]) => (
        <g key={x}>
          <ellipse className="m-line" cx={x} cy={y} rx="7" ry="5" />
          <circle className="m-dot" cx={x} cy={y} r="2.4" />
        </g>
      ))}
      <path className="m-line" d="M100 139L96 162M108 139L111 162M92 162H100M106 162H115" />
    </svg>
  );
}

export function Lotus() {
  return (
    <svg viewBox="0 0 200 200" className="motif" role="img" aria-label="Mithila lotus">
      <defs>
        <Hatch id="h-lotus" color="#c8311f" />
        <Hatch id="h-leaf" color="#3e7d3a" />
      </defs>
      <path className="m-fill" fill="url(#h-lotus)" d="M100 48C116 70 116 100 100 116C84 100 84 70 100 48Z" />
      <path className="m-line" d="M100 48C116 70 116 100 100 116C84 100 84 70 100 48Z" />
      <path className="m-line m-thin" d="M100 60C110 76 110 98 100 108C90 98 90 76 100 60Z" />
      <path className="m-line" d="M100 116C70 111 55 86 58 62C80 70 95 92 100 116Z" />
      <path className="m-line" d="M100 116C130 111 145 86 142 62C120 70 105 92 100 116Z" />
      <path className="m-line" d="M100 119C60 121 35 101 30 81C60 86 85 101 100 119Z" />
      <path className="m-line" d="M100 119C140 121 165 101 170 81C140 86 115 101 100 119Z" />
      <path className="m-line m-thin" d="M92 112C76 104 68 88 67 74M108 112C124 104 132 88 133 74M88 117C66 114 50 103 43 91M112 117C134 114 150 103 157 91" />
      <path className="m-line" d="M68 121Q100 135 132 121" />
      <path className="m-line" d="M100 126C98 150 104 170 100 196" />
      <path className="m-fill" fill="url(#h-leaf)" d="M101 172C121 160 151 162 161 175C141 186 116 185 101 172Z" />
      <path className="m-line" d="M101 172C121 160 151 162 161 175C141 186 116 185 101 172Z" />
      <path className="m-line m-thin" d="M104 172C122 170 142 171 158 175" />
    </svg>
  );
}

export function Sun() {
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const p = (r, d) => `${(100 + Math.cos(a + d) * r).toFixed(1)} ${(100 + Math.sin(a + d) * r).toFixed(1)}`;
    return `M${p(46, -0.11)}L${p(76, 0)}L${p(46, 0.11)}`;
  });
  return (
    <svg viewBox="0 0 200 200" className="motif" role="img" aria-label="Mithila sun with a face">
      <defs>
        <Hatch id="h-sun" color="#e9a400" />
      </defs>
      <path className="m-fill" fill="url(#h-sun)" d={rays.join('') + 'Z'} />
      <path className="m-line" d={rays.join('')} />
      <circle className="m-line" cx="100" cy="100" r="42" />
      <circle className="m-line m-thin" cx="100" cy="100" r="36" />
      <path className="m-line" d="M80 92q8-7 16 0q-8 6-16 0ZM104 92q8-7 16 0q-8 6-16 0Z" />
      <circle className="m-dot" cx="88" cy="92" r="2.4" />
      <circle className="m-dot" cx="112" cy="92" r="2.4" />
      <path className="m-line m-thin" d="M100 97L96 110H103" />
      <path className="m-line" d="M86 117Q100 128 114 117" />
      <circle className="m-dot" cx="80" cy="110" r="2" />
      <circle className="m-dot" cx="120" cy="110" r="2" />
    </svg>
  );
}

// A border band: double rule with a triangle chain, like a kohbar frame.
export function Band({ className = '' }) {
  const tri = Array.from({ length: 40 }, (_, i) => `M${i * 30} 26L${i * 30 + 15} 6L${i * 30 + 30} 26`).join('');
  const dots = Array.from({ length: 40 }, (_, i) => <circle key={i} cx={i * 30 + 15} cy="19" r="2.2" className="m-dot" />);
  return (
    <svg viewBox="0 0 1200 32" preserveAspectRatio="none" className={`band ${className}`} aria-hidden="true">
      <path className="m-line m-thin" d="M0 2H1200M0 30H1200" />
      <path className="m-line" d={tri} />
      {dots}
    </svg>
  );
}

export const MOTIFS = { fish: Fish, peacock: Peacock, lotus: Lotus, sun: Sun };
