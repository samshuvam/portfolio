import { getState, setState, useStore } from '../lib/store';

// Three languages: English, Nepali and Maithili (both in Devanagari).
//
// UI strings live in small dictionaries next to the feature that uses them:
//   src/i18n/ui/<feature>.js  ->  export default { en: { key: 'text' }, ne: {...}, mai: {...} }
//   const t = useT(dict);  t('key', { name: 'Shuvam' })   // {name} placeholders
// Content (projects, papers, ...) is translated with overlays:
//   src/i18n/content/<module>.js -> export default { ne: { [id]: { ...fields } }, mai: {...} }
//   const loc = useLocalize(overlay); loc(project)          // deep-merges the overlay
// Anything missing falls back to English, so partial translations are safe.

export const LANGS = [
  { id: 'en', label: 'English', native: 'English', short: 'EN', html: 'en' },
  { id: 'ne', label: 'Nepali', native: 'नेपाली', short: 'ने', html: 'ne' },
  { id: 'mai', label: 'Maithili', native: 'मैथिली', short: 'मै', html: 'mai' },
];

export const useLang = () => useStore((s) => s.lang);
export const getLang = () => getState().lang;
export const setLang = (lang) => {
  if (LANGS.some((l) => l.id === lang)) setState({ lang });
};

const NP_DIGITS = '०१२३४५६७८९';
// Numbers in Devanagari digits for Nepali and Maithili.
export const localDigits = (value, lang = getLang()) => (lang === 'en' ? String(value) : String(value).replace(/[0-9]/g, (d) => NP_DIGITS[d]));

export function translate(dict, lang, key, vars) {
  let s = dict?.[lang]?.[key] ?? dict?.en?.[key] ?? key;
  if (vars) s = String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  return s;
}

export function useT(dict) {
  const lang = useLang();
  return (key, vars) => translate(dict, lang, key, vars);
}

function deepMerge(base, over) {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(over)) return base;
    const len = Math.max(base.length, over.length);
    return Array.from({ length: len }, (_, i) => deepMerge(base[i], over[i]));
  }
  if (base && typeof base === 'object') {
    if (typeof over !== 'object') return base;
    const out = { ...base };
    Object.keys(over).forEach((k) => {
      out[k] = deepMerge(base[k], over[k]);
    });
    return out;
  }
  return over;
}

export function localize(item, overlay, lang = getLang(), id = item?.id) {
  if (!item || lang === 'en') return item;
  const o = overlay?.[lang]?.[id];
  return o ? deepMerge(item, o) : item;
}

export function useLocalize(overlay) {
  const lang = useLang();
  return (item, id) => localize(item, overlay, lang, id);
}
