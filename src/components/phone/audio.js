import { getState } from '../../lib/store';

// ShuvamOS has its own small audio graph (keypad tones, ringing, chimes,
// the music app). Everything is synthesised; nothing is downloaded. It
// respects the site's master sound switch and the phone's volume buttons.

let ctx = null;
let out = null;
let volume = 0.7;
const volListeners = new Set();

export function phoneAudio() {
  if (!getState().sound) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      out = ctx.createGain();
      out.gain.value = volume;
      out.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export const phoneOut = () => out;

export const getVolume = () => volume;
export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (out && ctx) out.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
  volListeners.forEach((l) => l(volume));
}
export function onVolume(l) {
  volListeners.add(l);
  return () => volListeners.delete(l);
}

function env(g, t, a, peak, d) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function osc(c, type, freq, t, dur, peak, a = 0.005, dest = out) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  env(g, t, a, peak, dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + a + dur + 0.05);
  return o;
}

let noise = null;
export function noiseBuffer(c) {
  if (noise && noise.sampleRate === c.sampleRate) return noise;
  noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

const DTMF = {
  1: [697, 1209], 2: [697, 1336], 3: [697, 1477],
  4: [770, 1209], 5: [770, 1336], 6: [770, 1477],
  7: [852, 1209], 8: [852, 1336], 9: [852, 1477],
  '*': [941, 1209], 0: [941, 1336], '#': [941, 1477],
};

export const sfx = {
  tap() {
    const c = phoneAudio();
    if (!c) return;
    osc(c, 'sine', 1400, c.currentTime, 0.03, 0.03, 0.002);
  },
  dtmf(key) {
    const c = phoneAudio();
    const f = DTMF[key];
    if (!c || !f) return;
    const t = c.currentTime;
    f.forEach((freq) => osc(c, 'sine', freq, t, 0.14, 0.05, 0.004));
  },
  // One ring-back burst (two seconds of 400 + 450 Hz, like many Asian networks).
  ring() {
    const c = phoneAudio();
    if (!c) return;
    const t = c.currentTime;
    [400, 450].forEach((freq) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.04, t + 0.03);
      g.gain.setValueAtTime(0.04, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      g.gain.setValueAtTime(0.0001, t + 0.6);
      g.gain.exponentialRampToValueAtTime(0.04, t + 0.63);
      g.gain.setValueAtTime(0.04, t + 1.0);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 1.1);
    });
  },
  chime() {
    const c = phoneAudio();
    if (!c) return;
    const t = c.currentTime;
    [659.25, 830.61, 987.77, 1318.5].forEach((f, i) => osc(c, 'sine', f, t + i * 0.12, 0.9, 0.06, 0.01));
  },
  unlock() {
    const c = phoneAudio();
    if (!c) return;
    const t = c.currentTime;
    osc(c, 'sine', 880, t, 0.08, 0.04, 0.004);
    osc(c, 'sine', 1320, t + 0.06, 0.12, 0.035, 0.004);
  },
  lock() {
    const c = phoneAudio();
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.06);
    env(g, t, 0.002, 0.12, 0.06);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.1);
  },
  sent() {
    const c = phoneAudio();
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(500, t);
    o.frequency.exponentialRampToValueAtTime(1500, t + 0.18);
    env(g, t, 0.01, 0.05, 0.2);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.3);
  },
  // A pressure cooker whistle: every Nepali kitchen's notification sound.
  whistle() {
    const c = phoneAudio();
    if (!c) return;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 18;
    bp.frequency.setValueAtTime(1800, t);
    bp.frequency.linearRampToValueAtTime(2900, t + 0.5);
    bp.frequency.setValueAtTime(2900, t + 1.4);
    bp.frequency.linearRampToValueAtTime(2200, t + 1.9);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.35);
    g.gain.setValueAtTime(0.5, t + 1.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
    src.connect(bp).connect(g).connect(out);
    src.start(t);
    src.stop(t + 2.05);
    const o = c.createOscillator();
    const og = c.createGain();
    o.frequency.setValueAtTime(1800, t);
    o.frequency.linearRampToValueAtTime(2900, t + 0.5);
    o.frequency.linearRampToValueAtTime(2200, t + 1.9);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.025, t + 0.4);
    og.gain.setValueAtTime(0.025, t + 1.5);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 2);
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 2.05);
  },
  shutter() {
    const c = phoneAudio();
    if (!c) return;
    const t = c.currentTime;
    [0, 0.07].forEach((d) => {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c);
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2500;
      const g = c.createGain();
      env(g, t + d, 0.001, 0.25, 0.05);
      src.connect(hp).connect(g).connect(out);
      src.start(t + d);
      src.stop(t + d + 0.08);
    });
  },
  blip(freq = 660) {
    const c = phoneAudio();
    if (!c) return;
    osc(c, 'square', freq, c.currentTime, 0.06, 0.025, 0.003);
  },
  thud() {
    const c = phoneAudio();
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
    env(g, t, 0.003, 0.2, 0.3);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.35);
  },
};
