import { useEffect } from 'react';
import { getState, useStore } from './store';

let context, master, voices = [], unlocked = false, language = 'en';
const chords = { en: [130.81, 196, 261.63], ne: [146.83, 220, 405.25], mai: [138.59, 207.65, 277.18, 415.3] };

export function stopAmbient() {
  if (!context || !master) return;
  const old = voices;
  voices = [];
  master.gain.cancelScheduledValues(context.currentTime);
  master.gain.setTargetAtTime(0, context.currentTime, 0.12);
  old.forEach(({ oscillator, gain }) => {
    oscillator.stop(context.currentTime + 0.5);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}

export function startAmbient() {
  if (!unlocked || !getState().sound || document.hidden || voices.length) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    context ??= new AC();
    if (!master) { master = context.createGain(); master.gain.value = 0; master.connect(context.destination); }
    context.resume().catch(() => {});
    voices = chords[language].map((frequency, i) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = i % 2 ? 3 : -3;
      gain.gain.value = 1 / (i + 2);
      oscillator.connect(gain).connect(master);
      oscillator.start();
      return { oscillator, gain };
    });
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0.028, context.currentTime, 0.8);
  } catch { stopAmbient(); }
}

export function setAmbientLang(lang) {
  if (lang === language) return;
  language = chords[lang] ? lang : 'en';
  stopAmbient();
  startAmbient();
}

export function useAmbient() {
  const lang = useStore(s => s.lang);
  const enabled = useStore(s => s.sound);
  useEffect(() => {
    const unlock = () => { unlocked = true; startAmbient(); };
    const visibility = () => document.hidden ? stopAmbient() : startAmbient();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', visibility);
      stopAmbient();
    };
  }, []);
  useEffect(() => { setAmbientLang(lang); enabled ? startAmbient() : stopAmbient(); }, [lang, enabled]);
}
