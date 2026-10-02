// Four original tracks, synthesised live with Web Audio. Nothing is
// downloaded: each track is a small set of instruments and a step function
// that the scheduler calls for every sixteenth note.

export const TRACKS = [
  { id: 'dusk', bpm: 72, length: 150, hue: '#d6452b' },
  { id: 'kites', bpm: 108, length: 140, hue: '#eaa42a' },
  { id: 'monsoon', bpm: 78, length: 160, hue: '#3f86c9' },
  { id: 'chhath', bpm: 58, length: 150, hue: '#f08a24' },
];

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function impulse(ac, seconds, decay = 2.6) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
  }
  return buf;
}

function noise(ac, seconds = 2) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    // slightly brown, softer than white noise
    last = (last + 0.08 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.2 + (Math.random() * 2 - 1) * 0.25;
  }
  return buf;
}

export function createEngine(ac, dest) {
  const master = ac.createGain();
  master.gain.value = 0.0001;
  const analyser = ac.createAnalyser();
  analyser.fftSize = 128;
  analyser.smoothingTimeConstant = 0.8;
  master.connect(analyser);
  analyser.connect(dest);

  const dry = ac.createGain();
  dry.gain.value = 0.8;
  dry.connect(master);
  const verb = ac.createConvolver();
  verb.buffer = impulse(ac, 2.8);
  const wet = ac.createGain();
  wet.gain.value = 0.4;
  verb.connect(wet).connect(master);
  const bus = ac.createGain();
  bus.connect(dry);
  bus.connect(verb);

  const noiseBuf = noise(ac);
  const held = new Set(); // continuous nodes to stop on pause

  // ---- instruments ---------------------------------------------------------
  const voice = (t, dur, build, peak = 0.2, attack = 0.005, target = bus) => {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    g.connect(target);
    const nodes = build(g);
    nodes.forEach((n) => {
      n.start(t);
      n.stop(t + attack + dur + 0.05);
    });
  };

  const pluck = (t, midi, { dur = 0.9, peak = 0.12, type = 'sawtooth', bright = 2400 } = {}) =>
    voice(t, dur, (g) => {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = mtof(midi);
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(bright, t);
      lp.frequency.exponentialRampToValueAtTime(320, t + dur);
      o.connect(lp).connect(g);
      return [o];
    }, peak);

  const bell = (t, midi, { dur = 2.6, peak = 0.08 } = {}) =>
    voice(t, dur, (g) => {
      const f = mtof(midi);
      return [1, 2.76, 5.4].map((ratio, i) => {
        const o = ac.createOscillator();
        o.frequency.value = f * ratio;
        const og = ac.createGain();
        og.gain.value = [1, 0.35, 0.12][i];
        o.connect(og).connect(g);
        return o;
      });
    }, peak, 0.004);

  const soft = (t, midi, { dur = 0.5, peak = 0.08 } = {}) =>
    voice(t, dur, (g) => {
      const o = ac.createOscillator();
      o.type = 'triangle';
      o.frequency.value = mtof(midi);
      o.connect(g);
      return [o];
    }, peak, 0.01);

  const pad = (t, notes, { dur = 4, peak = 0.05, cutoff = 900 } = {}) =>
    voice(t, dur, (g) => {
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = cutoff;
      lp.connect(g);
      const out = [];
      notes.forEach((m) => {
        [-6, 6].forEach((cents) => {
          const o = ac.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = mtof(m);
          o.detune.value = cents;
          o.connect(lp);
          out.push(o);
        });
      });
      return out;
    }, peak, Math.min(1.6, dur * 0.4));

  const drum = (t, { from = 140, to = 50, dur = 0.35, peak = 0.35 } = {}) =>
    voice(t, dur, (g) => {
      const o = ac.createOscillator();
      o.frequency.setValueAtTime(from, t);
      o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.8);
      o.connect(g);
      return [o];
    }, peak, 0.002, dry);

  const tick = (t, { freq = 4200, q = 6, dur = 0.05, peak = 0.12 } = {}) =>
    voice(t, dur, (g) => {
      const src = ac.createBufferSource();
      src.buffer = noiseBuf;
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = q;
      src.connect(bp).connect(g);
      return [src];
    }, peak, 0.001);

  // A held, looping noise bed (the rain on the roof).
  const rainBed = (t) => {
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1600;
    bp.Q.value = 0.6;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 3);
    src.connect(bp).connect(g).connect(dry);
    src.start(t);
    held.add(src);
  };

  // Tanpura-like drone: a held fifth that breathes.
  const drone = (t, notes, peak = 0.035) => {
    notes.forEach((m) => {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = mtof(m);
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 2.5);
      const lfo = ac.createOscillator();
      lfo.frequency.value = 0.13 + Math.random() * 0.1;
      const lfoG = ac.createGain();
      lfoG.gain.value = 220;
      lfo.connect(lfoG).connect(lp.frequency);
      o.connect(lp).connect(g).connect(bus);
      o.start(t);
      lfo.start(t);
      held.add(o);
      held.add(lfo);
    });
  };

  // ---- the tracks ------------------------------------------------------------
  // Each step(s, t, p) gets the 16th-note index, its time and track progress 0..1.
  let melody = 0;
  const walk = (scale, lo, hi) => {
    melody = Math.max(lo, Math.min(hi, melody + pick([-2, -1, -1, 1, 1, 2, 0])));
    return scale[((melody % scale.length) + scale.length) % scale.length] + 12 * Math.floor(melody / scale.length);
  };

  const steps = {
    // Janakpur dusk: a tanpura drone, a sitar-ish pluck wandering in Bhupali
    // (D E F# A B), the slow bells of evening aarti.
    dusk: {
      start(t) {
        melody = 5;
        drone(t, [38, 45, 50]);
      },
      step(s, t) {
        const scale = [62, 64, 66, 69, 71];
        if (s % 16 === 0) pluck(t, 50, { dur: 2.2, peak: 0.05, bright: 900 });
        if (s % 16 === 4 || s % 16 === 8 || s % 16 === 12) pluck(t, s % 16 === 4 ? 57 : 62, { dur: 1.6, peak: 0.035, bright: 900 });
        if (s % 2 === 0 && Math.random() < 0.42) pluck(t, walk(scale, 0, 9) - 12, { dur: 1.1, peak: 0.1, bright: 3200 });
        if (s % 64 === 32) bell(t, 86, { dur: 4, peak: 0.04 });
      },
    },
    // Sharad kites: bright pentatonic arpeggios over a madal-like groove,
    // strings in the wind.
    kites: {
      start() {
        melody = 3;
      },
      step(s, t, p) {
        const bar = Math.floor(s / 16) % 4;
        const chords = [
          [55, 59, 62, 67],
          [52, 55, 59, 64],
          [48, 52, 55, 60],
          [50, 54, 57, 62],
        ];
        const ch = chords[bar];
        soft(t, ch[s % 4] + 12, { dur: 0.22, peak: 0.05 });
        if (s % 16 === 0) pad(t, ch.slice(0, 3), { dur: 3.4, peak: 0.025, cutoff: 1400 });
        const beat = s % 8;
        if (beat === 0) drum(t, { from: 120, to: 55, peak: 0.3 });
        if (beat === 3 || beat === 6) drum(t, { from: 340, to: 200, dur: 0.12, peak: 0.12 });
        if (s % 2 === 1) tick(t, { freq: 7000, peak: 0.025 });
        if (p > 0.15 && s % 4 === 2 && Math.random() < 0.35) bell(t, walk([67, 69, 71, 74, 76], 2, 9), { dur: 1.4, peak: 0.05 });
      },
    },
    // Monsoon on a tin roof: rain bed, random pings on tin, a slow minor pad
    // and the occasional far-off thunder.
    monsoon: {
      start(t) {
        melody = 4;
        rainBed(t);
      },
      step(s, t) {
        if (Math.random() < 0.32) tick(t + Math.random() * 0.1, { freq: 2500 + Math.random() * 4500, q: 14, dur: 0.06, peak: 0.05 + Math.random() * 0.06 });
        if (Math.random() < 0.06) soft(t, pick([81, 84, 86, 88, 93]), { dur: 0.25, peak: 0.03 });
        const chords = [
          [57, 60, 64],
          [53, 57, 60],
          [48, 52, 55],
          [55, 59, 62],
        ];
        if (s % 32 === 0) pad(t, chords[Math.floor(s / 32) % 4], { dur: 5.5, peak: 0.045, cutoff: 700 });
        if (s % 4 === 0 && Math.random() < 0.3) pluck(t, walk([69, 72, 74, 76, 79], 0, 8), { dur: 1.6, peak: 0.06, type: 'triangle', bright: 1800 });
        if (s % 128 === 100) drum(t, { from: 70, to: 28, dur: 2.4, peak: 0.18 });
      },
    },
    // Chhath sunrise: a conch-like swell, bells over still water, and a pad
    // that opens up as the sun rises.
    chhath: {
      start() {
        melody = 2;
      },
      step(s, t, p) {
        if (s % 128 === 0) pad(t, [48, 55, 60], { dur: 7, peak: 0.07, cutoff: 500 + p * 400 });
        if (s % 32 === 0) pad(t, [60, 64, 67, 71].slice(0, 2 + Math.floor(p * 3)), { dur: 6, peak: 0.03, cutoff: 500 + p * 2200 });
        if (s % 4 === 0 && Math.random() < 0.55) bell(t, walk([72, 74, 76, 79, 81], 0, 9), { dur: 3, peak: 0.06 });
        if (s % 16 === 8 && Math.random() < 0.5) bell(t, 96, { dur: 2, peak: 0.015 });
      },
    },
  };

  // ---- transport -----------------------------------------------------------------
  let current = null;
  let timer = 0;
  let step = 0;
  let nextAt = 0;
  let startedAt = 0; // ac time at which offset 0 would have been
  let offset = 0;
  let playing = false;

  const stopHeld = (t) => {
    held.forEach((n) => {
      try {
        n.stop(t);
      } catch {
        /* already stopped */
      }
    });
    held.clear();
  };

  const schedule = () => {
    if (!playing || !current) return;
    const tr = TRACKS.find((x) => x.id === current);
    const spb = 60 / tr.bpm / 4;
    while (nextAt < ac.currentTime + 0.15) {
      const p = Math.min(1, (nextAt - startedAt) / tr.length);
      steps[current].step(step, nextAt, p);
      step += 1;
      nextAt += spb;
    }
  };

  return {
    analyser,
    get playing() {
      return playing;
    },
    get track() {
      return current;
    },
    position() {
      return playing ? ac.currentTime - startedAt : offset;
    },
    play(id, from = 0) {
      if (playing) this.pause(true);
      current = id;
      offset = from;
      const t = ac.currentTime + 0.05;
      startedAt = t - from;
      const tr = TRACKS.find((x) => x.id === id);
      step = Math.floor(from / (60 / tr.bpm / 4));
      nextAt = t;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
      master.gain.exponentialRampToValueAtTime(0.9, t + 1.2);
      steps[id].start(t);
      playing = true;
      schedule();
      clearInterval(timer);
      timer = setInterval(schedule, 40);
    },
    pause(quick = false) {
      if (!playing) return;
      offset = ac.currentTime - startedAt;
      playing = false;
      clearInterval(timer);
      const t = ac.currentTime;
      const fade = quick ? 0.08 : 0.35;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
      master.gain.exponentialRampToValueAtTime(0.0001, t + fade);
      stopHeld(t + fade + 0.02);
    },
    dispose() {
      this.pause(true);
      setTimeout(() => {
        try {
          master.disconnect();
          analyser.disconnect();
        } catch {
          /* ignore */
        }
      }, 400);
    },
  };
}
