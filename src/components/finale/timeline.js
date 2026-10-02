// Shared timeline for the landing finale (scroll progress 0..1).
// Imported by Finale.jsx (copy beats) and src/three/LandingScene.js (motion),
// so the words and the aircraft always agree on where we are.
export const P = {
  gearDown: [0.02, 0.15], // gear extends
  touchdown: 0.4, // main wheels on the runway, tyre smoke
  rollEnd: 0.62, // rollout finished, turn off the runway
  parked: 0.88, // stopped next to Kalyani
};

// Copy beats: 0 approach, 1 destination unknown, 2 touchdown, 3 taxi, 4 arrived.
export function beatFor(p) {
  if (p < 0.2) return 0;
  if (p < P.touchdown) return 1;
  if (p < P.rollEnd) return 2;
  if (p < P.parked - 0.02) return 3;
  return 4;
}

// Arrivals board status index: 0 on final, 1 landed, 2 taxiing, 3 on stand.
export function statusFor(p) {
  if (p < P.touchdown) return 0;
  if (p < P.rollEnd) return 1;
  if (p < P.parked - 0.02) return 2;
  return 3;
}
