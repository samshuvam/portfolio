# Autonomous flight and window seats — 2 October 2026

Historical review. The [cabin and airport observation revision](cabin-and-airport-observation-review.md) replaces the photo layer, magnified window, and main-aircraft landing described here.

This review covers the latest owner request. It supersedes the previous scroll-controlled flight and landing behaviour.

| Request | Delivered |
| --- | --- |
| Takeoff leaves fog over the homepage | The departing cinematic hands over to a dense cloud mask over the already mounted page. A separate flyby clears a corridor before the remaining fog disperses. The main aircraft then enters beside the name. |
| Planes move without scrolling | Main cruise uses elapsed visible time on a closed route with real depth. Fog passes and occasional foreground archive passes also use time. Scrolling brings different sections into view. |
| Occasional additional flights | One additional moving aircraft slot, quiet gaps, alternating directions and route/callsign captions. Normally one moving plane; at most two moving planes in the shared flight layer. |
| Airport arrivals and distant departures | SUV-1478 approaches, lands, rolls out and taxis automatically over 68 seconds while the airport is visible. SHUV-15937, SHUV-5711 and SHUV-SAM arrive; SHUV-ACB departs from a separate distant runway. Arrivals taxi behind the terminal before leaving the scene. |
| Different flight details | Four named traffic routes and live LANDING / DEPARTING / EXPECTED board statuses. The main callsign remains SUV-1478. |
| Solid exterior into believable seating | Exterior shell remains solid; the camera crosses into a photographic cabin entry with woven seats, then into the textured 3D cabin/window. No exposed airframe or transparent cutaway. |
| Select other Nepal window views | Himalayan morning, Pokhara golden hour and Kathmandu blue hour are preloaded in neighboring windows. Selecting a view backs the camera into the cabin, travels to the adjacent seat and approaches its already loaded view over 4.8 seconds. Controls lock during travel. |
| Mobile and reduced motion | 390 × 844 phone review: no horizontal overflow and all three choices visible. Reduced motion keeps a static window/gallery and terminal. |
| Keep airport terminal and version marker | Existing four terminal gates, cockpit clock, waypoint links, passport and social/CV connections retained. Version/commit/Nepal timestamp remain at the document end. |

Validation: module graph check, production build and all nine regression tests pass. Browser checks cover the opaque fog and clearing flyby, photographic cabin entry, unobstructed window landscapes, seat selection and control locking, phone layout, and autonomous airport status changes at a stationary scroll position. The production deployment is checked against build-info.json after publishing.

## Generated imagery

Four illustrated assets were created with the built-in image generation tool and compressed to WebP with Sharp. These are generated visualizations, not documentary photographs. The UI labels the Nepal views as illustrated. Original generated PNG files remain in the Codex generated-images directory; deployable files are saved below.

- `public/imagery/seat-cabin.webp`: photorealistic A350 economy cabin, empty, eye height from the right aisle toward the window seats; sage woven upholstery, visible stitching, ivory headrest cloths, believable screens, trays, overhead bins, reading lights and Himalayan sky. No people, logos or text.
- `public/imagery/seat-himalaya.webp`: photorealistic wide Nepal Himalayan morning at cruise altitude, Langtang-like snow peaks over layered clouds, crisp daylight and atmospheric depth; full bleed, no aircraft, window frame, text or logos.
- `public/imagery/seat-pokhara.webp`: detailed aerial view over emerald Phewa Lake and Pokhara, golden afternoon light, western hills and distant Annapurna mountains; full bleed, no aircraft, window frame, text or logos.
- `public/imagery/seat-kathmandu.webp`: detailed aerial Kathmandu valley at blue hour, warm city lights, winding river, layered hills, mist and distant Himalayan horizon; full bleed, no aircraft, window frame, text or logos.

The cabin entry blends photographic-style imagery with a code-built 3D cabin for camera travel. This is a hybrid visual treatment, not a scanned aircraft interior.
