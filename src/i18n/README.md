# Translations: English, नेपाली (ne), मैथिली (mai)

Language lives in the store (`lang`), is persisted, and sets `<html lang data-lang>`.
`src/i18n/index.js` exports `LANGS`, `useLang()`, `setLang()`, `useT(dict)`,
`useLocalize(overlay)`, `localize(item, overlay, lang, id)` and `localDigits(n)`.

## 1. UI strings (component text)

One dictionary per feature in `src/i18n/ui/<feature>.js`:

```js
export default {
  en: { title: 'Selected work.', cta: 'Read the case study', days: '{n} days' },
  ne: { title: '...', cta: '...', days: '{n} दिन' },
  mai: { title: '...', cta: '...', days: '{n} दिन' },
};
```

```jsx
import dict from '../../i18n/ui/work';
const t = useT(dict);
<h2>{t('title')}</h2>  <p>{t('days', { n: localDigits(5) })}</p>
```

Missing keys fall back to English, then to the key itself.

## 2. Content overlays (data in src/data/*)

`src/i18n/content/<module>.js` exports `{ ne: { [key]: partial }, mai: { [key]: partial } }`.
`localize(item, overlay, lang, key)` deep-merges the partial over the English item.
Arrays merge by index (so a partial array only needs the entries you translate,
in order). Strings are replaced. Keep proper nouns (Shuvam, Janakpur, SRM, IEEE,
Odoo, RAG, LoRA, eVTOL, etc.) recognisable; product and tech names usually stay in Latin.

| Overlay file | Keys | Translate these fields |
|---|---|---|
| projects-a.js / projects-b.js | project `id` (a: segmented-generation, bio-memory, evtol-atc, elser, federated-learning, multistage-retrieval, air-traffic-intelligence; b: the rest) | short, subtitle, category, date (only words like "Ongoing"), highlight, status, summary, intro, points[{title,text}], caseStudy{challenge, steps[]}, metrics[{label, value only if it is words}]. `title` too (keep it close to the original). |
| papers.js | paper `id` | status, abstract, plain, keywords[] (venue and title stay English: they are official) |
| glossary.js | glossary key (e.g. `rag`, `janakpur`) | term (only when a natural local word exists, e.g. culture terms), full, kind, body |
| journey.js | milestone `id` | when (words only, e.g. "Now", "First year"), sub (words only), title, text |
| logbook.js | `satyadip`, `srm` (entries); `leadership` (array); `typeRatings` (array of {group, items[{name}]}); `researchDomains` (array of strings); `levels` ({Captain, 'First officer', 'Type rated'} -> {label, text}) | date words, aircraft, route, place, hours (words), remarks[], skills[] |
| profile.js | `profile` ({tagline, heroLine, home, university, current, born{place}}); `stats` (array of {label, detail}) | as listed |
| home.js | `janakpurFacts` (array {label, text}); plate id ({title, note}); `nepalFacts` id ({title,text}); motif id (`fish`, `peacock`, `lotus`, `sun`: {name, meaning}) | as listed |
| kanya.js | trait `id` ({trait, evidence}) | as listed |
| life.js | `dishes` (array {from, note}; `name` only if there is a Devanagari spelling, e.g. मम); `gadgets` (array {name, text}) | as listed |
| misc.js | video id ({title, description, length}); `nowLog` (array {label, text}); `nowUpdated` (string); `photoCaptions` ({[photoId]: caption}); `doing.<id>` for each id in `DOING` in src/lib/world.js (string) | as listed |
| seasons.js | season id ({english, monthNames, pigment, line}) | `name` and `np` stay |
| festivals.js | festival id incl. `birthday` ({name, peakLabel, blurb}); for birthday use `{n}` in peakLabel for the age | as listed |
| waypoints.js | waypoint id ({label}) | label |
| eggs.js | egg id ({name, hint}; `stamp` only if you want a Devanagari stamp) | as listed |
| jokes.js | joke id ({text}) | text: translate the joke so it is still funny; adapt wordplay rather than translating literally |

## Style

- Nepali: natural, conversational, written Nepali (म, तपाईं, गर्छु, छ...).
- Maithili: real Maithili, not Hindi or Nepali with a few words changed:
  हम (I), अहाँ (you), छी / अछि / छल, केर / क, मे, सँ, आ (and), सेहो (also), नहि (not),
  जे, एहि, ओहि, करैत छी, बनबैत छी, मोन (mind/memory). Example:
  "I build AI that remembers" = ne: "म सम्झने AI बनाउँछु" / mai: "हम मोन राखय बला AI बनबैत छी".
- No em dashes (—) or en dashes (–) anywhere. Use a comma, colon or full stop.
- Numbers: keep digits as data; components render them with `localDigits()`.
