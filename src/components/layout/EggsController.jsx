import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getState, setState } from '../../lib/store';
import { findEgg, toast } from '../../lib/eggs';
import { toggleGrid } from '../../lib/grid';
import { getWorld } from '../../lib/world';
import { sound } from '../../lib/sound';
import { reducedMotion } from '../../lib/motion';
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
export default function EggsController() {
  useEffect(() => {
    let sequence = [], typed = '';
    const key = e => {
      if (e.target.closest?.('input,textarea,select,[contenteditable="true"],[data-game],.arcade-console,.sos-device,[role="dialog"]') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') { setState({ menu: false, retro: false }); return; }
      if (e.key.toLowerCase() === 'g') toggleGrid();
      sequence = [...sequence, e.key].slice(-10);
      if (sequence.every((k, i) => k === KONAMI[i]) && sequence.length === 10) { findEgg('konami'); setState(s => ({ retro: !s.retro })); }
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-30);
      for (const word of ['sita', 'momo', 'chiya', 'everest']) if (typed.endsWith(word)) {
        findEgg(word);
        if (word === 'sita' || word === 'chiya') sound.bowl();
        if (word === 'momo' && !reducedMotion()) confetti({ particleCount: 45, spread: 85, disableForReducedMotion: true });
        toast({ sita: 'Jai Siya Ram', momo: 'Momo weather', chiya: 'Chiya break', everest: '8,848.86 m' }[word], { sita: 'A little piece of Janakpur, wherever you are.', momo: 'Forecast: scattered dumplings.', chiya: 'The page can wait. Put the kettle on.', everest: 'Sagarmatha. Keep looking up.' }[word]);
        typed = '';
      }
    };
    if (getWorld().npt.hour >= 1 && getWorld().npt.hour < 5) findEgg('owl');
    const previous = window.stamp;
    window.stamp = () => findEgg('devtools');
    console.info('SS2504: welcome aboard. Type stamp() for a passport stamp. Ctrl/Cmd+K opens the flight desk.');
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); if (previous === undefined) delete window.stamp; else window.stamp = previous; };
  }, []);
  return null;
}
