import { useEffect, useRef } from 'react';
import { getWorld } from '../../lib/world';
import { getWeather } from '../../lib/weather';
import { getState } from '../../lib/store';
import { reducedMotion } from '../../lib/motion';
import { skyColors, ridge, mix, rgbToCss, luminance, seeded } from './sky';
import { seasonById } from '../../data/seasons';

// The hero sky is a painting of the sky over Lalitpur right now.
// Static layers are cached and re-painted every 20 seconds; stars, clouds,
// rain and festival details animate on top.

const param = (k) => {
  try {
    return new URLSearchParams(window.location.search).get(k);
  } catch {
    return null;
  }
};

export default function SkyCanvas({ onTone }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduce = reducedMotion();
    let W = 0;
    let H = 0;
    let dpr = 1;
    let visible = true;
    let raf = 0;
    let lastPaint = 0;
    let layers = null;
    let stars = [];
    let clouds = [];
    let drops = [];
    let kites = [];
    let diyos = [];
    let puffs = [];
    let flash = 0;
    let tone = null;

    const state = () => {
      const world = getWorld();
      const season = param('season') ? seasonById(param('season')) : world.season;
      let weather = getWeather();
      const wParam = param('weather');
      if (wParam) weather = { kind: wParam, cloud: wParam === 'clear' ? 0 : 0.9, label: wParam };
      const pref = getState().themePref;
      let elevation = world.sun.elevation;
      // A forced theme moves the painted sky to match it.
      if (pref === 'night' && elevation > -8) elevation = -14;
      if (pref === 'day' && elevation < 8) elevation = 24;
      const festival = param('festival') || (world.festivals.isBirthday ? 'birthday' : world.festivals.active?.mode);
      return { world, season, weather, elevation, festival };
    };

    const offscreen = () => {
      const c = document.createElement('canvas');
      c.width = W * dpr;
      c.height = H * dpr;
      const g = c.getContext('2d');
      g.scale(dpr, dpr);
      return [c, g];
    };

    const paintStatic = () => {
      const { world, season, weather, elevation, festival } = state();
      const col = skyColors(elevation, { season, weather });
      const night = Math.max(0, Math.min(1, (-elevation - 2) / 10));

      // Sky gradient + sun + moon.
      const [sky, g] = offscreen();
      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, rgbToCss(col.top));
      grad.addColorStop(0.55, rgbToCss(col.mid));
      grad.addColorStop(0.82, rgbToCss(col.horizon));
      grad.addColorStop(1, rgbToCss(col.horizon));
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);

      // Map azimuth to x with south at the centre, so the day's arc is visible.
      const azX = (az) => W * (0.5 + (az - 180) / 220);
      const elY = (el) => H * 0.72 - (el / 70) * H * 0.62;

      const sunVisible = elevation > -3;
      if (sunVisible) {
        const sx = Math.max(W * 0.08, Math.min(W * 0.92, azX(world.sun.azimuth)));
        const sy = elY(Math.max(-2, world.sun.elevation));
        const warm = Math.max(0, 1 - Math.max(0, elevation) / 14);
        const sunCol = mix([255, 252, 240], [255, 170, 90], warm);
        const r = Math.min(W, H) * 0.035;
        const glow = g.createRadialGradient(sx, sy, 0, sx, sy, r * 9);
        glow.addColorStop(0, rgbToCss(sunCol, 0.55));
        glow.addColorStop(0.25, rgbToCss(sunCol, 0.18));
        glow.addColorStop(1, rgbToCss(sunCol, 0));
        g.fillStyle = glow;
        g.fillRect(0, 0, W, H);
        const cover = weather?.kind === 'cloudy' || weather?.kind === 'rain' || weather?.kind === 'storm' ? 0.25 : 1;
        g.fillStyle = rgbToCss(sunCol, cover);
        g.beginPath();
        g.arc(sx, sy, r, 0, Math.PI * 2);
        g.fill();
      }

      const moon = world.moon;
      if (moon.elevation > -2 && moon.illumination > 0.02 && night > 0.1) {
        const mx = Math.max(W * 0.1, Math.min(W * 0.9, azX(moon.azimuth)));
        const my = elY(moon.elevation);
        const r = Math.min(W, H) * 0.028;
        const halo = g.createRadialGradient(mx, my, 0, mx, my, r * 7);
        halo.addColorStop(0, `rgba(220,226,255,${0.22 * moon.illumination})`);
        halo.addColorStop(1, 'rgba(220,226,255,0)');
        g.fillStyle = halo;
        g.fillRect(0, 0, W, H);
        // Draw the lit part of the disc for the real phase.
        g.save();
        g.translate(mx, my);
        g.fillStyle = 'rgba(30,34,52,0.9)';
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#f2efe4';
        g.beginPath();
        const waxing = moon.waxing;
        const k = Math.cos(moon.phase * Math.PI * 2); // 1 new, -1 full
        g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, !waxing);
        g.ellipse(0, 0, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === waxing ? true : false);
        g.fill();
        g.restore();
      }

      // Mountains, far to near, with atmospheric perspective.
      const dayness = col.day;
      const alpenglow = Math.max(0, 1 - Math.abs(elevation - 1.5) / 7) * (1 - night);
      const farBase = mix(col.horizon, col.top, 0.25);
      const far = mix(farBase, [20, 26, 48], 0.25 + night * 0.4);
      const midC = mix(far, dayness > 0.5 ? [58, 78, 92] : [12, 16, 32], 0.55);
      const nearC = dayness > 0.5 ? mix([40, 58, 58], col.mid, 0.12) : [6, 8, 16];
      const snow = mix(mix([248, 250, 255], [255, 176, 150], alpenglow), [96, 106, 140], night * 0.85);

      const layer = (pts, fill, snowLine, snowColor) => {
        const [c, lg] = offscreen();
        lg.beginPath();
        lg.moveTo(0, H);
        pts.forEach(([x, y]) => lg.lineTo(x, y));
        lg.lineTo(W, H);
        lg.closePath();
        lg.fillStyle = rgbToCss(fill);
        lg.fill();
        if (snowLine) {
          lg.save();
          lg.clip();
          const sg = lg.createLinearGradient(0, snowLine - H * 0.09, 0, snowLine + H * 0.02);
          sg.addColorStop(0, rgbToCss(snowColor, 0.95));
          sg.addColorStop(1, rgbToCss(snowColor, 0));
          lg.fillStyle = sg;
          lg.fillRect(0, 0, W, snowLine + H * 0.02);
          lg.restore();
        }
        return c;
      };

      const farPts = ridge(W, 11, { base: H * 0.74, amp: H * 0.2, peaks: 6, jag: 1.2 });
      const minFar = Math.min(...farPts.map((p) => p[1]));
      const farLayer = layer(farPts, far, minFar + H * 0.075, snow);
      const midLayer = layer(ridge(W, 23, { base: H * 0.84, amp: H * 0.12, peaks: 2, jag: 0.6 }), midC);
      const nearLayer = layer(ridge(W, 41, { base: H * 0.95, amp: H * 0.1, peaks: 1, jag: 0.4 }), nearC);

      layers = { sky, farLayer, midLayer, nearLayer, col, night, festival, weather, season, elevation };

      const lum = luminance(mix(col.mid, col.top, 0.4));
      const nextTone = lum > 0.32 ? 'light' : 'dark';
      if (nextTone !== tone) {
        tone = nextTone;
        onTone?.(tone);
      }

      // Seed the moving parts for this sky.
      const rand = seeded(7);
      if (!stars.length) stars = Array.from({ length: 240 }, () => ({ x: rand(), y: rand() * 0.72, r: rand() ** 3 * 1.6 + 0.3, tw: rand() * Math.PI * 2, sp: 0.6 + rand() * 1.8 }));
      const cloudCount = Math.round(4 + (weather?.cloud ?? 0.25) * 10 + (season?.id === 'barsha' ? 6 : 0) - (season?.id === 'sharad' && !weather ? 2 : 0));
      if (clouds.length !== cloudCount) clouds = Array.from({ length: Math.max(2, cloudCount) }, (_, i) => ({ x: rand() * 1.2 - 0.1, y: 0.12 + rand() * 0.45, w: 0.12 + rand() * 0.22, h: 0.03 + rand() * 0.05, sp: 0.002 + rand() * 0.006, layer: i % 2 }));
      const raining = ['rain', 'drizzle', 'storm'].includes(weather?.kind);
      drops = raining ? Array.from({ length: weather.kind === 'drizzle' ? 90 : 220 }, () => ({ x: rand(), y: rand(), l: 0.02 + rand() * 0.03, sp: 0.9 + rand() * 0.8 })) : [];
      kites = festival === 'kites' ? Array.from({ length: 5 }, (_, i) => ({ x: 0.15 + i * 0.17 + rand() * 0.05, y: 0.18 + rand() * 0.25, s: 0.7 + rand() * 0.6, hue: ['#e2312f', '#f2a31b', '#2b6cd6', '#1f9d55', '#c9268c'][i], ph: rand() * 6 })) : [];
      diyos = festival === 'diyo' ? Array.from({ length: 18 }, (_, i) => ({ x: (i + 0.5) / 18, ph: rand() * 6 })) : [];
      puffs = festival === 'colours' ? Array.from({ length: 14 }, () => ({ x: rand(), y: 0.25 + rand() * 0.5, r: 0.05 + rand() * 0.1, c: ['#ff3d7f', '#ffd400', '#18c3a1', '#7a5cff', '#ff7a1a'][Math.floor(rand() * 5)] })) : [];
    };

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, W < 768 ? 1.5 : 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintStatic();
      draw(performance.now());
    };

    const cloudShape = (x, y, w, h, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, w);
      g.addColorStop(0, rgbToCss(color, 0.55));
      g.addColorStop(0.6, rgbToCss(color, 0.2));
      g.addColorStop(1, rgbToCss(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h * 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = (time) => {
      if (!layers) return;
      const t = time / 1000;
      const { sky, farLayer, midLayer, nearLayer, col, night, festival, weather } = layers;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(sky, 0, 0, W, H);

      // Stars, dimmed by clouds.
      const starVis = night * (1 - (weather?.cloud ?? 0) * 0.85);
      if (starVis > 0.02) {
        stars.forEach((s) => {
          const a = starVis * (0.55 + 0.45 * Math.sin(t * s.sp + s.tw));
          ctx.fillStyle = `rgba(240,240,255,${a})`;
          ctx.beginPath();
          ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Clouds behind the far range.
      const cloudCol = mix(mix(col.mid, [255, 255, 255], 0.55 * col.day + 0.1), col.horizon, 0.25);
      clouds.forEach((c) => {
        if (c.layer !== 0) return;
        const x = (((c.x + t * c.sp * 0.1) % 1.3) - 0.15) * W;
        cloudShape(x, c.y * H, c.w * W, c.h * H, cloudCol);
      });

      ctx.drawImage(farLayer, 0, 0, W, H);
      clouds.forEach((c) => {
        if (c.layer !== 1) return;
        const x = (((c.x + t * c.sp * 0.14) % 1.3) - 0.15) * W;
        cloudShape(x, (c.y + 0.2) * H, c.w * W * 1.2, c.h * H, cloudCol);
      });
      ctx.drawImage(midLayer, 0, 0, W, H);

      // Festival: Dashain kites over the valley.
      kites.forEach((k) => {
        const x = k.x * W + Math.sin(t * 0.7 + k.ph) * 18;
        const y = k.y * H + Math.cos(t * 0.9 + k.ph) * 10;
        const s = 16 * k.s;
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + s);
        ctx.quadraticCurveTo(x + 40, y + H * 0.3, x - 20 + k.x * 40, H * 0.95);
        ctx.stroke();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t * 1.3 + k.ph) * 0.18);
        ctx.fillStyle = k.hue;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.8, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(0, s);
        ctx.moveTo(-s * 0.8, 0);
        ctx.lineTo(s * 0.8, 0);
        ctx.stroke();
        ctx.restore();
      });

      // Holi colour in the air.
      puffs.forEach((p) => {
        const g = ctx.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, p.r * W);
        g.addColorStop(0, `${p.c}55`);
        g.addColorStop(1, `${p.c}00`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });

      ctx.drawImage(nearLayer, 0, 0, W, H);

      // Chhath: the sun reflected in a pond at the foot of the hills.
      if (festival === 'sun') {
        const py = H * 0.9;
        const pg = ctx.createLinearGradient(0, py, 0, H);
        pg.addColorStop(0, rgbToCss(mix(col.horizon, [30, 40, 60], 0.3), 0.9));
        pg.addColorStop(1, rgbToCss(mix(col.mid, [10, 14, 24], 0.5), 0.95));
        ctx.fillStyle = pg;
        ctx.fillRect(0, py, W, H - py);
        for (let i = 0; i < 14; i++) {
          const yy = py + 6 + i * 6;
          const w = (60 - i * 3) * (1 + 0.15 * Math.sin(t * 2 + i));
          ctx.fillStyle = `rgba(255,190,110,${0.5 - i * 0.03})`;
          ctx.fillRect(W * 0.5 - w / 2, yy, w, 2);
        }
      }

      // Tihar: a row of diyo along the bottom edge.
      diyos.forEach((d) => {
        const x = d.x * W;
        const y = H * 0.965;
        const f = 0.8 + 0.2 * Math.sin(t * 9 + d.ph) + 0.1 * Math.sin(t * 23 + d.ph);
        const g = ctx.createRadialGradient(x, y - 8, 0, x, y - 8, 26);
        g.addColorStop(0, `rgba(255,200,90,${0.55 * f})`);
        g.addColorStop(1, 'rgba(255,160,60,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 30, y - 40, 60, 60);
        ctx.fillStyle = '#b4532a';
        ctx.beginPath();
        ctx.ellipse(x, y, 9, 4, 0, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = `rgba(255,${190 + 40 * f},120,${f})`;
        ctx.beginPath();
        ctx.ellipse(x, y - 6, 2.4, 6 * f, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Rain and lightning, when it is really raining in Lalitpur.
      if (drops.length) {
        ctx.strokeStyle = col.day > 0.5 ? 'rgba(220,230,245,0.35)' : 'rgba(170,185,220,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        drops.forEach((d) => {
          const y = ((d.y + t * d.sp * 0.9) % 1.1) - 0.05;
          const x = d.x * W - y * 30;
          ctx.moveTo(x, y * H);
          ctx.lineTo(x - 6, y * H + d.l * H);
        });
        ctx.stroke();
        if (weather?.kind === 'storm') {
          if (flash <= 0 && Math.random() < 0.004) flash = 1;
          if (flash > 0) {
            ctx.fillStyle = `rgba(220,225,255,${flash * 0.35})`;
            ctx.fillRect(0, 0, W, H);
            flash -= 0.08;
          }
        }
      }

      // Fog lying in the valley (fog weather, or Shishir mornings).
      const fogAmt = weather?.kind === 'fog' ? 0.8 : (layers.season?.scene?.fog ?? 0) * (col.day > 0.3 && layers.elevation < 25 ? 1 : 0.4);
      if (fogAmt > 0.05) {
        const fg = ctx.createLinearGradient(0, H * 0.55, 0, H);
        const fc = mix(col.horizon, [230, 232, 236], col.day * 0.6);
        fg.addColorStop(0, rgbToCss(fc, 0));
        fg.addColorStop(0.6, rgbToCss(fc, fogAmt * 0.55));
        fg.addColorStop(1, rgbToCss(fc, fogAmt * 0.75));
        ctx.fillStyle = fg;
        ctx.fillRect(0, H * 0.55, W, H * 0.45);
      }
    };

    const loop = (time) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (time - lastPaint > 20000) {
        paintStatic();
        lastPaint = time;
      }
      draw(time);
    };

    resize();
    lastPaint = performance.now();
    window.addEventListener('resize', resize);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);
    if (!reduce) raf = requestAnimationFrame(loop);

    // Repaint when the theme preference or weather changes.
    const mo = new MutationObserver(() => {
      paintStatic();
      draw(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-season', 'data-festival'] });
    const weatherPoll = setInterval(() => {
      const w = getWeather();
      if (w && w !== layers?.weather && !param('weather')) {
        paintStatic();
        draw(performance.now());
      }
    }, 3000);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      io.disconnect();
      mo.disconnect();
      clearInterval(weatherPoll);
    };
  }, [onTone]);

  return <canvas ref={ref} className="sky-canvas" aria-hidden="true" />;
}
