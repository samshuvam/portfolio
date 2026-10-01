// Colour science for the hero sky. Everything is a function of the sun's
// elevation over Lalitpur, nudged by season and live weather.

const STOPS = [
  [-18, '#03050d', '#070b1c', '#0d1430'],
  [-12, '#060a1d', '#0e1636', '#1f2650'],
  [-8, '#0c1433', '#222c5a', '#3e3a6e'],
  [-4, '#1a2654', '#4a4a84', '#a8667a'],
  [-1, '#2b3d78', '#7a6aa0', '#f0956a'],
  [2, '#3f63a8', '#9aa5cf', '#ffc27a'],
  [6, '#4f86c9', '#a9c9e8', '#ffe2b0'],
  [12, '#4a8ad6', '#9cc7ee', '#e3f0fa'],
  [30, '#3d7fd4', '#8fc1ef', '#d6ebfa'],
  [90, '#3a7bd2', '#8cbff0', '#d0e8fa'],
];

export const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
export const rgbToCss = ([r, g, b], a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const luminance = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

function grey(c, t) {
  const avg = (c[0] + c[1] + c[2]) / 3;
  return mix(c, [avg, avg, avg], t);
}

export function skyColors(elevation, { season, weather } = {}) {
  const e = Math.max(-18, Math.min(90, elevation));
  let i = 0;
  while (i < STOPS.length - 2 && STOPS[i + 1][0] <= e) i++;
  const [e0, ...c0] = STOPS[i];
  const [e1, ...c1] = STOPS[i + 1];
  const t = Math.max(0, Math.min(1, (e - e0) / (e1 - e0)));
  let [top, mid, horizon] = c0.map((c, k) => mix(hexToRgb(c), hexToRgb(c1[k]), t));

  const day = Math.max(0, Math.min(1, (e + 4) / 10));
  const haze = season?.scene?.haze ?? 0.1;
  // Season: Sharad skies are famously clear; monsoon and winter go milky.
  if (season?.id === 'sharad') {
    top = mix(top, [32, 98, 196], 0.18 * day);
  } else {
    const milk = [214, 220, 226];
    horizon = mix(horizon, milk, haze * 0.35 * day);
    mid = mix(mid, milk, haze * 0.18 * day);
  }

  // Weather from Lalitpur right now.
  const cloud = weather ? weather.cloud ?? 0 : 0;
  const kind = weather?.kind;
  const overcast = kind === 'cloudy' || kind === 'rain' || kind === 'storm' || kind === 'drizzle' ? Math.max(0.55, cloud) : cloud * 0.4;
  if (overcast > 0) {
    const g = kind === 'storm' || kind === 'rain' ? 0.75 : 0.6;
    top = grey(top, overcast * g);
    mid = grey(mid, overcast * g);
    horizon = grey(horizon, overcast * g * 0.8);
    if (kind === 'rain' || kind === 'storm') {
      top = mix(top, [0, 0, 0], 0.25);
      mid = mix(mid, [0, 0, 0], 0.15);
    }
  }
  if (kind === 'fog') {
    const fogC = day > 0.5 ? [205, 210, 214] : [60, 66, 82];
    horizon = mix(horizon, fogC, 0.7);
    mid = mix(mid, fogC, 0.45);
  }
  return { top, mid, horizon, day };
}

// Seeded noise for stable mountain silhouettes.
export function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function ridge(width, seed, { base, amp, peaks = 0, jag = 1, points = 240 }) {
  const rand = seeded(seed);
  const waves = Array.from({ length: 3 }, (_, i) => ({ f: (i + 1) * (0.7 + rand()), p: rand() * 6.28, a: 0.55 / (i + 1) }));
  const peakList = Array.from({ length: peaks }, () => ({ x: 0.04 + rand() * 0.92, h: 0.45 + rand() * 0.55, w: 0.05 + rand() * 0.08 }));
  const jags = Array.from({ length: 4 }, (_, i) => ({ f: 11 + i * 9 + rand() * 6, p: rand() * 6.28, a: 0.1 / (i + 1) }));
  const out = [];
  for (let i = 0; i <= points; i++) {
    const x = i / points;
    let y = 0.32;
    waves.forEach((w) => {
      y += w.a * 0.35 * Math.sin(Math.PI * 2 * w.f * x + w.p);
    });
    peakList.forEach((p) => {
      const d = Math.abs(x - p.x) / p.w;
      if (d < 1) y += p.h * (1 - d) ** 1.15;
    });
    let detail = 0;
    jags.forEach((j) => {
      detail += j.a * (Math.abs(Math.sin(Math.PI * 2 * j.f * x + j.p)) - 0.5);
    });
    y += detail * jag * (0.35 + y);
    out.push([x * width, base - Math.max(0, y) * amp]);
  }
  return out;
}
