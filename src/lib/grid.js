import { findEgg } from './eggs';

// The Kanya alignment grid: twelve columns and an 8px baseline, drawn over
// the whole page. Toggled from the Kanya section or by pressing G.
let active = false;

export function setGrid(on) {
  document.querySelector('.kanya-grid')?.remove();
  active = on;
  document.dispatchEvent(new CustomEvent('ss-star-chart',{detail:on}));
  if(on) findEgg('grid');
}

export const toggleGrid = () => setGrid(!active);
