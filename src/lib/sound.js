import { getState } from './store';

// Everything is synthesised with Web Audio, so there are no audio files to
// download. Sound is off until the visitor switches it on.

let ctx = null;
let master = null;

function audio() {
  if (!getState().sound) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function env(gainNode, t, attack, peak, decay) {
  gainNode.gain.cancelScheduledValues(t);
  gainNode.gain.setValueAtTime(0.0001, t);
  gainNode.gain.exponentialRampToValueAtTime(peak, t + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function noiseBuffer(c, seconds = 1) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export const sound = {
  click() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(440, t + 0.06);
    env(g, t, 0.004, 0.08, 0.07);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.1);
  },

  // A Tibetan singing bowl: inharmonic partials with slow beating.
  bowl(pitch = 1) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const base = 196 * pitch;
    [
      [1, 0.22, 5.5],
      [2.76, 0.1, 3.8],
      [5.4, 0.05, 2.4],
      [8.93, 0.025, 1.6],
    ].forEach(([ratio, peak, decay], i) => {
      [0, 1.8].forEach((detune) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.value = base * ratio + detune * (i + 1);
        env(g, t, 0.02, peak / 2, decay);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + decay + 0.1);
      });
    });
  },

  whoosh(strength = 1) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 1.2);
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.8;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(1800, t + 0.45);
    f.frequency.exponentialRampToValueAtTime(400, t + 1.1);
    const g = c.createGain();
    env(g, t, 0.25, 0.18 * strength, 0.85);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + 1.2);
  },

  flap() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.05);
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1800 + Math.random() * 1200;
    const g = c.createGain();
    env(g, t, 0.001, 0.12, 0.025);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.05);
  },

  stamp() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
    env(g, t, 0.003, 0.35, 0.22);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.3);
  },

  success() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      env(g, t + i * 0.07, 0.01, 0.07, 0.5);
      o.connect(g).connect(master);
      o.start(t + i * 0.07);
      o.stop(t + i * 0.07 + 0.6);
    });
  },
};
