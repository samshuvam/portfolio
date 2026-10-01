// Every arcade game, loaded only when its cartridge is opened.
// Each game file: export default function Game({ active, onScore, onEgg }) { ... }
//  - active: false when the arcade is off screen or another game is chosen (pause!)
//  - onScore(n): report the current score (the arcade shows best scores)
//  - onEgg(id): call findEgg-style stamps through the arcade
export const GAMES = [
  { id: 'memory-keeper', project: 'bio-memory', load: () => import('./games/MemoryKeeper.jsx') },
  { id: 'atc-tower', project: 'evtol-atc', load: () => import('./games/AtcTower.jsx') },
  { id: 'token-tetris', project: 'segmented-generation', load: () => import('./games/TokenTetris.jsx') },
  { id: 'hallucination-hunter', project: 'hallucination-mitigation', load: () => import('./games/HallucinationHunter.jsx') },
  { id: 'rover-run', project: 'autonomous-delivery', load: () => import('./games/RoverRun.jsx') },
  { id: 'kite-fight', project: null, load: () => import('./games/KiteFight.jsx') },
  { id: 'momo-catcher', project: null, load: () => import('./games/MomoCatcher.jsx') },
  { id: 'bus-dash', project: 'smart-bus', load: () => import('./games/BusDash.jsx') },
];
