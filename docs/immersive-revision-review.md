# Immersive portfolio revision — 2 October 2026

This records the previous revision. The flight and airport rows are superseded by flight-continuity-review.md. The two earlier review files describe previously published revisions and have been superseded where the owner requested another design.

| Owner request | Final implementation |
| --- | --- |
| Realistic A350 and closer supplied livery | Licensed A350 geometry remains throughout. The newest flat Suvmith Air reference drives Nepal engraving artwork, pearl paint, forest/lime flowing ribbons, green engines and Himalayan fin graphics. Side-aware lettering avoids mirrored titles. Callsign SUV-1478 throughout. Model licence and generation provenance retained. |
| Restore seasonal branch journey; repair phones | Original 3D bough journey restored with native sticky scrolling and live layout measurements. Desktop cards follow projected branch anchors. Phones show one readable milestone, with previous/next controls clear of the flight-map badge. Season and day/night controls, complete readable fallback and original chronology remain. |
| Unique imagery for every milestone | All 16 milestones have distinct installed images. Eleven new contextual illustrations cover school, bus tracking, internship, ICAAsT, rover, building, associate work, memory, segmented generation, graduation and current research. Prompts recorded in public/imagery/journey-prompts.json. |
| Keep personal introduction photo | Original me.jpg portrait preserved. Personal photographs remain in the Frames gallery; contextual artwork is identified as illustrative. |
| Photo choice, many Nepal frames and download | Existing local-file chooser and camera workflow retained with 20 distinct Nepal frames, 20 filters and watermarked download. Public storage/sharing omitted at the owner's explicit direction. |
| Heading, section and continuous path animations | Viewport-driven heading and surface reveals, an alternating multi-green continuous route, diamond waypoint symbols, archive departure label and boarding motifs. Accessible reduced-motion presentation retained. |
| Plane foreground passes, no arbitrary disappearing | Shared aircraft travels between section poses, crosses the archive and foreground, and stays visible through layer changes. Window passage explicitly borrows a clone for the physical cabin view; the final airport projects the shared page aircraft into the runway scene. |
| Physical window-seat transition | Reversible camera path from the A350 exterior through an opening cutaway, two-aisle nine-abreast cabin, individual seats and real geometry window opening to the cloud/wing image. Global aircraft is borrowed only once the local model is ready. |
| Mountain pan/zoom, scrolling entry | Each peak animates its zoom and transform origin; Whole skyline zooms back out. Scroll reveals the panorama. |
| Janaki Mandir architectural study | Orbitable 3D interpretation with three separate storeys, arches, domes, courtyard and roof-plan view. Floor separation, turntable and zoom controls; sourced explanatory feature notes. It is clearly an artistic interpretation, not a measured survey. |
| Remove air-hop caption and six-season mini card | Both removed from Home's rendered content; seasonal journey retained. Nepal facts and story drawers remain merged under Nepal, beyond the postcard. |
| Frost and contrasting green ornament | Matte translucent cards/buttons, readable foreground text, stronger day ornament and lighter night ornament. Forest, fern and teal route colours vary through the page. |
| Connected takeoff handoff | Existing aircraft preload, haze dissolution, hero lettering reveal and shared aircraft return retained. |
| Airport footer, all links and boarding vibe | Concourse includes gate card, live arrivals board, next-chapter boarding pass, cockpit clock/date, all 15 waypoint links, email/social/CV links, passport and takeoff-again. Terminal blueprint, pier lights, taxiway flow, pointer glint and panel/camera parallax animate the airport. |
| Slow landing controlled by scroll | Native sticky approach spans 340 viewport heights. Scroll is reversible and maps only to approach through touchdown. At the final page scroll, touchdown hands off to automatic rollout/taxi/parking beside Kalyani. Scrolling back cancels taxi and returns to approach. |
| Runway is the website's final section | Airport links are inside the airport before the final runway. Deployment code, Nepal timestamp and commit are integrated into the runway's bottom edge. Nothing follows it in document flow. |
| Direct waypoint links | Intro completion and hash changes align Lenis immediately to the target; direct section URLs no longer get overwritten by smooth-scroll initialization. |
| Publication | Commit to main and GitHub Pages deployment, with live build-info.json verification. |

## Validation

- Module graph check, production build and nine regression tests pass.
- Regression coverage includes reversible landing-to-touchdown mapping, 16 unique installed milestone images, 20 unique frame/filter/watermark exports, three-language facts, canonical data, Nepal midnight, Tirhuta, contact failure handling and A350 gear/lights.
- Browser checks: desktop and actual 390 × 844 phone journey layouts; seasonal bough and navigation; temple study, separated floors and roof view; mountain selected zoom and Whole skyline reset; physical cabin/window passage; aircraft side paint; final page touchdown, automatic taxi, reverse scrolling and continuously visible shared aircraft.
- Airport terminal pointer handling and reduced-motion/static fallback paths were reviewed in code. No camera/microphone permission or real outgoing message was used for this revision.

## References and assets

The user's three root reference images remain preserved. Nepal mural provenance is recorded in public/models/livery-artwork.json. Generated milestone illustrations are contextual scenes, not claims of documentary photographs of Shuvam's life.

Janaki notes: [Nepal Tourism Board](https://ntb.gov.np/en/janaki-mandir--janakpur--dhanusha).
Aircraft: [amvlab/aircraft-models](https://github.com/amvlab/aircraft-models), CC BY 4.0; licence retained in public/models.

Design references inspected: [Lusion](https://lusion.co/), [Masar](https://masar.ae/), [Bartlett](https://bartlett.co.uk/), [ThreeUI Kage](https://threeui.com/components/kage), [Koi Mecha](https://threeui.com/components/koi-mecha), [Sketchbook](https://threeui.com/components/sketchbook), [Sylva Sakura](https://threeui.com/components/sylva-sakura), [Gallery](https://threeui.com/components/gallery), [GSAP showcase](https://gsap.com/showcase/), [TasteSkill](https://tasteskill.com/), [21st hover-preview](https://21st.dev/community/components/ruixenui/hover-preview/default). References informed motion, depth and composition; their source code was not copied.
