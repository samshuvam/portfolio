// Shared state between the global plane layer (PlaneLayer.jsx) and the
// scenes that borrow the plane: the takeoff intro, the fog reveal sections
// and the landing finale. Plain mutable object, read every frame.
export const planeBus = {
  // Written by PlaneLayer each frame: where the plane is on screen (CSS px).
  screen: { x: -9999, y: -9999, size: 0, visible: false, heading: 0, vx: 0, vy: 0 },
  // Reasons to hide the global plane (e.g. 'intro', 'finale'). Hidden if any.
  hidden: new Set(),
  // Set by a FogReveal section while active: the plane sweeps horizontally.
  // { y: 0..1 (viewport fraction), dir: 1 | -1, progress: 0..1 }
  sweep: null,
  // When true, PlaneLayer raises its canvas above page content.
  aboveContent: false,
  // True once the takeoff intro has handed the plane over to the page.
  introDone: false,
};

export const hidePlane = (reason) => planeBus.hidden.add(reason);
export const showPlane = (reason) => planeBus.hidden.delete(reason);
