# Portfolio revision review — 2 October 2026

> Historical revision. See [the current immersive revision review](immersive-revision-review.md) for the final design and validation.

Reviewed against the owner's nineteen-point request and the follow-up asking
for an A350, the original introduction portrait, and publication to `main`.

| Request | Result |
| --- | --- |
| 1. Aircraft, photos, childhood and education | Licensed A350 model; original `myimage/me.jpg` introduction; high-quality personal gallery; contextual AI artwork elsewhere. Journey includes Panchthar until about 6–7, Janakpur schooling through 2019, Lalitpur +2, SRM University, university life, research and current work. University regional suffix removed, including the CV. |
| 2. Kanya and cosmos | Everyday habits replace project evidence. Interactive Virgo chart, star selection, zoom, constellation toggle, galaxy exploration and Voyager discoveries. |
| 3. Destination | Destination pending / flight plan still open. Lalitpur is the current home, not the final landing destination. |
| 4. Kalyani | Name examples, a small single-seat joke and the quiet companion aircraft use Kalyani. The glossary explains the shared auspicious meaning of the names without presenting distinct Sanskrit words as identical. |
| 5. Green | Distinct forest-green day and muted-green night colours; favourite colour mentioned in everyday habits. |
| 6. Relevant imagery | Eight generated contextual WebP assets, with recorded prompts, replace unrelated personal photos outside the gallery and introduction. |
| 7. Nepal | Interactive cabinet for lali gurans, Mithila/Vivah Panchami, Lumbini and eastern hills, alongside the existing Nepal, Tirhuta and prayer-wheel details. |
| 8. Phone wallpaper | Forest flight artwork, contextual wallpaper choices and migration from old photo wallpapers. |
| 9. Boarding QR | Actual scannable QR links to the requested Rickroll. Payload decoded during visual verification. |
| 10. Waypoints | Aviation codes paired with plain-language departure, climb, cruise, en-route and approach explanations. |
| 11. Takeoff handoff | Frontal overhead camera pass, clearing haze, aircraft leaving the frame and a fading handoff to the hero aircraft. A350 preloaded before the cinematic begins. |
| 12. Mountain panorama | AI Himalayan panorama replaces the illustrated range; Ganesh Himal, Langtang and Dorje Lakpa text retained. |
| 13. Janaki Mandir | Contextual architectural image, architectural-study view, four explanatory hotspots, bell interaction and source link. |
| 14. Cabin-to-landing transition | Landing has a bounded visible stage and its own controls; no oversized scroll pin or hidden finale. |
| 15. Grid | Global page grid removed. G controls constellation lines only. |
| 16. Airport landing | A350 approach, touchdown, rollout, taxi and parking scene with play/pause/replay and keyboard-accessible timeline. |
| 17. Theme | Each theme click resolves immediately to the opposite displayed theme; automatic Nepal-time mode remains available. |
| 18. Aircraft interaction and UI | Aircraft positions are stable between purposeful transitions. Orbit, camera presets, gear, rotate and roll controls in the hangar. Shared overlay scroll locks and navigation offsets repaired. |
| 19. Useful finishing touches | Readable complete journey, accessible landing seek controls, multilingual copy, working sharing assets, QR, CV, fallback states and deployment checks. |

## A350 source and paint

The geometry is `A350_nologo.glb` from [amvlab/aircraft-models](https://github.com/amvlab/aircraft-models),
licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The source licence is retained under `public/models/`; attribution is also
visible in the hangar. The custom atlas changes paint only, retaining the
source geometry and cockpit. The animated flight rig adds retractable gear
with six-wheel main bogies, navigation lights, strobes and landing lights.

The custom SS2504 paint takes its packing-tape and shipping-label idea from
the [A350F cardboard-package livery](https://www.airbus.com/en/newsroom/stories/2026-09-unpacking-the-a350fs-new-livery).
Forest green, warm cream, aluminium wings, a small flower stamp, “IDEAS
INSIDE”, “FRAGILE”, “NO ETA.” and “STILL FLYING.” make it personal.
This is an artistic portfolio aircraft, not an Airbus-certified simulation.
`scripts/build-aircraft.py` records the UV painting and GLB packaging process;
the built GLB is committed and needs no Python during deployment.

## Verification and practical limits

The production build, module checks and six regression tests cover canonical
multilingual answers, content overlays, Nepal's midnight boundary, Tirhuta,
email relay acceptance/failure, and the new flight rig. Both CV pages were
rendered and inspected after editing. Browser checks include the aircraft
model, landing controls, and the other feature checks recorded in README.

Camera, microphone and a real outgoing email were not used during checks.
The Janaki Mandir and Himalayan images are generated contextual illustrations,
not documentary photographs or a measured architectural/peak survey.
