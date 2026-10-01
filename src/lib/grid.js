import { findEgg } from './eggs';

// The Kanya alignment grid: twelve columns and an 8px baseline, drawn over
// the whole page. Toggled from the Kanya section or by pressing G.
let el = null;

export function setGrid(on) {
  if (on && !el) {
    el = document.createElement('div');
    el.className = 'kanya-grid';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    findEgg('grid');
  } else if (!on && el) {
    el.remove();
    el = null;
  }
}

export const toggleGrid = () => setGrid(!el);
