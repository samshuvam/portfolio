# Shuvam Singh portfolio

React 19 / Vite portfolio with a Nepal-time sky, multilingual content, aviation scenes, research labs, eight arcade games, and the sixteen-app ShuvamOS phone.

## Run locally

Use Node.js 22 and install the locked dependencies with `npm ci`.

```sh
npm run dev
npm test
npm run check
npm run build
npm run preview
```

The development server defaults to port 3000. The production preview defaults to port 4173. `predev` and `prebuild` regenerate the optimized photo assets from `myimage/`; do not commit the generated `public/photos/` or photo manifest.

## Edit content

- Canonical profile, projects, papers, milestones, and photos: `src/data/` and `myimage/`.
- Nepali and Maithili content overlays: `src/i18n/content/`.
- Interface translations: `src/i18n/ui/`.
- Section components: `src/components/`.
- Shared language, theme, sound, and persistent preferences: `src/lib/store.js`.

Preserve canonical IDs when editing translations: project links, festival calculations, and passport stamps depend on them. The Yapper answers from the site's content locally; it has no remote model or API key.

## Completion and validation — 2 October 2026

The inherited implementation has been completed and integrated: language switching and ambient audio, command palette, flight map, passport and keyboard discoveries, Nepal panorama and Janaki Mandir, gesture/voice controls, Tirhuta lettering and postcard export, and the contact phone.

Repairs include React crashes when switching language, scroll locks shared between overlays, mobile menu navigation, pointer capture swallowing gallery buttons, phone exits during app transitions, camera cleanup, and canvas sizing that caused an enormous blank region below Janakpur. Email forms now require explicit relay acceptance before displaying success. Missing favicon and sharing assets are included.

Verified locally:

- `npm run check` and production `npm run build` pass.
- All six regression tests pass: multilingual assistant answers, immutable content overlays, Nepal's midnight boundary, Tirhuta mapping, relay failure/success handling with mocked requests, and A350 gear/light controls.
- Browser checks covered the takeoff and landing, language switching, palette and passport, all eight arcade games, all sixteen phone app entry points, calculator arithmetic, multilingual Yapper, gallery grid and lightbox, contact validation, lab tab transitions, and Tirhuta/postcard rendering.
- Desktop and narrow layouts were inspected. The runaway Janakpur height and gallery interaction regressions were reproduced and fixed.

External/device checks still require the owner:

- FormSubmit may require inbox activation. No real message was sent during verification; mocked acceptance does not prove inbox delivery.
- Camera and microphone permissions were not granted during verification. Hand tracking additionally downloads MediaPipe and its model when requested. Speech recognition availability depends on the browser. Manual gesture steering and voice navigation buttons provide alternatives.
- The postcard reached its ready state, but this in-app browser did not expose a download event, so the saved PNG was not verified on disk.
- Weather can fall back to an estimate when its external service is unavailable. The mountain illustration is an artistic composition.

GitHub Pages deployment runs on pushes to `main` or `master`; it uses Node 22, runs the regression tests, builds the photo assets, and publishes `dist/` with the existing custom domain, `shuvamsingh.com.np`.

The [nineteen-point revision review](docs/revision-review.md) records the latest content and visual changes. The A350 geometry comes from [amvlab/aircraft-models](https://github.com/amvlab/aircraft-models), CC BY 4.0, with custom SS2504 packaging-inspired paint. Source licence: `public/models/LICENSE-a350.txt`. Artwork generation prompts: `public/imagery/prompts.json`. The introduction uses the original `myimage/me.jpg`; other personal photography is confined to the gallery.
