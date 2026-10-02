import { getState, setState } from './store';
import { sound } from './sound';

// Every easter egg stamps the visitor's passport. The hints are shown on
// the empty stamp slots, so the passport doubles as a treasure map.
export const EGGS = [
  {id:'cosmos',stamp:'COSMOS',name:'Cosmic curiosity',hint:'Explore all three observatory views'},
  {id:'voyager',stamp:'VOYAGER',name:'A hello to space',hint:'Listen with your eyes to the golden record'},
  { id: 'konami', stamp: 'KONAMI', name: 'Born in 2003', hint: 'An old cheat code on the keyboard' },
  { id: 'sita', stamp: 'JANAKI', name: 'Jai Siya Ram', hint: 'Type the name of Janakpur’s daughter' },
  { id: 'momo', stamp: 'MOMO', name: 'Momo rain', hint: 'Type Nepal’s favourite food' },
  { id: 'chiya', stamp: 'CHIYA', name: 'Chiya break', hint: 'Type what Nepal runs on' },
  { id: 'everest', stamp: '8848.86', name: 'Top of the world', hint: 'Type the tallest word you know' },
  { id: 'roll', stamp: 'ROLL', name: 'Barrel roll', hint: 'Click the plane a few times' },
  { id: 'clockwise', stamp: 'MANI', name: 'Clockwise only', hint: 'Spin the prayer wheel the other way' },
  { id: 'spins', stamp: '108', name: 'Sacred number', hint: 'Turn the prayer wheel 108 times' },
  { id: 'grid', stamp: 'GRID', name: 'Star mapper', hint: 'Press G to connect the constellation' },
  { id: 'owl', stamp: 'OWL', name: 'Night owl', hint: 'Visit between 1 and 5 AM Nepal time' },
  { id: 'yap', stamp: 'YAP', name: 'Certified yapper', hint: 'Switch on Yap mode' },
  { id: 'turbulence', stamp: 'BUMPY', name: 'Turbulence', hint: 'Scroll really, really fast' },
  { id: 'sudo', stamp: 'SUDO', name: 'Root access', hint: 'Ask the terminal to make you food' },
  { id: 'ace', stamp: 'ACE', name: 'eVTOL ace', hint: 'Ten safe arrivals in the Lab' },
  { id: 'lens', stamp: 'LENS', name: 'Sharp eyes', hint: 'Take the lens to every sketch' },
  { id: 'flag', stamp: 'FLAG', name: 'Not a rectangle', hint: 'Wave the flag of Nepal' },
  { id: 'airmail', stamp: 'AIRMAIL', name: 'Airmail', hint: 'Fly an anonymous paper plane' },
  { id: 'devtools', stamp: 'DEVTOOLS', name: 'Inspector', hint: 'Read the browser console' },
  { id: 'takeoff', stamp: 'JKR 27', name: 'Cleared for takeoff', hint: 'Watch the whole takeoff from Janakpur' },
  { id: 'kalyani', stamp: 'KALYANI', name: 'Landed', hint: 'Fly all the way to the last runway' },
  { id: 'fog', stamp: 'VISIBILITY', name: 'Fog lifted', hint: 'Let the plane clear the fog' },
  { id: 'arcade', stamp: 'HIGH SCORE', name: 'Arcade regular', hint: 'Play every game in the arcade' },
  { id: 'phone', stamp: 'ROAMING', name: 'Phone friend', hint: 'Open five apps on the phone' },
  { id: 'polyglot', stamp: 'त्रिभाषी', name: 'Polyglot', hint: 'Read the site in all three languages' },
  { id: 'gesture', stamp: 'HANDS UP', name: 'Look, no mouse', hint: 'Control something with your hand' },
  { id: 'tirhuta', stamp: 'MITHILAKSHAR', name: 'Signed in Tirhuta', hint: 'Write your own name in Tirhuta' },
  { id: 'joker', stamp: 'HAHA', name: 'Dad-joke survivor', hint: 'Read ten jokes' },
];

let toastTimer = null;

export function toast(title, body, tone = 'default') {
  clearTimeout(toastTimer);
  setState({ toast: { title, body, tone, key: Date.now() } });
  toastTimer = setTimeout(() => setState({ toast: null }), 4200);
}

export function findEgg(id) {
  const egg = EGGS.find((e) => e.id === id);
  if (!egg) return false;
  const { eggs } = getState();
  if (eggs.includes(id)) return false;
  const next = [...eggs, id];
  setState({ eggs: next });
  sound.stamp();
  toast(`Passport stamped: ${egg.stamp}`, `${egg.name}. ${next.length} of ${EGGS.length} found.`, 'egg');
  return true;
}

// Counts jokes read anywhere on the site; ten earns the "joker" stamp.
export function noteJoke(id) {
  try {
    const seen = new Set(JSON.parse(localStorage.getItem('ss-jokes') || '[]'));
    seen.add(id);
    localStorage.setItem('ss-jokes', JSON.stringify([...seen]));
    if (seen.size >= 10) findEgg('joker');
    return seen.size;
  } catch {
    return 0;
  }
}
