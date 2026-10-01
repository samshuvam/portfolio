import { useSyncExternalStore } from 'react';
import NepaliDate from 'nepali-date-converter';
import { sunPosition, sunTimes, moonState, skyPhase, LALITPUR } from './astro';
import { seasonForBsMonth } from '../data/seasons';
import { FESTIVALS, BIRTHDAY } from '../data/festivals';

export const NPT_TZ = 'Asia/Kathmandu';

// Time travel for previews: ?at=2026-11-08T19:30 (Nepal time) shows the site
// as it will look at that moment, then lets the clock keep running.
let offsetMs = 0;
try {
  const at = new URLSearchParams(window.location.search).get('at');
  const m = at && at.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (m) offsetMs = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 12), +(m[5] || 0)) - 345 * 60000 - Date.now();
} catch {
  /* ignore */
}
export const isTimeTravel = () => offsetMs !== 0;
export const worldNow = () => new Date(Date.now() + offsetMs);
const NP_DIGITS = '०१२३४५६७८९';
export const toNepaliDigits = (value) => String(value).replace(/[0-9]/g, (d) => NP_DIGITS[d]);

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: NPT_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'long',
  hourCycle: 'h23',
});

export function nptParts(date = new Date()) {
  const p = {};
  for (const part of partsFmt.formatToParts(date)) if (part.type !== 'literal') p[part.type] = part.value;
  return {
    year: +p.year,
    month: +p.month,
    day: +p.day,
    hour: +p.hour % 24,
    minute: +p.minute,
    second: +p.second,
    weekday: p.weekday,
    iso: `${p.year}-${p.month}-${p.day}`,
  };
}

const clockFmt = new Intl.DateTimeFormat('en-US', { timeZone: NPT_TZ, hour: 'numeric', minute: '2-digit' });
export const formatNptClock = (date) => clockFmt.format(date);
const clockFmt24 = new Intl.DateTimeFormat('en-GB', { timeZone: NPT_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
export const formatNptClock24 = (date) => clockFmt24.format(date);

const BS_MONTHS = ['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];

export function bsDate(npt) {
  const nd = new NepaliDate(new Date(npt.year, npt.month - 1, npt.day));
  const month = nd.getMonth() + 1;
  return {
    year: nd.getYear(),
    month,
    day: nd.getDate(),
    monthName: BS_MONTHS[month - 1],
    np: nd.format('DD MMMM YYYY', 'np'),
    en: `${nd.getDate()} ${BS_MONTHS[month - 1]} ${nd.getYear()}`,
  };
}

const dayNumber = (iso) => Math.round(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000);
export const daysBetween = (fromIso, toIso) => dayNumber(toIso) - dayNumber(fromIso);

function nextBirthday(npt) {
  const thisYear = `${npt.year}-04-25`;
  const iso = npt.iso <= thisYear ? thisYear : `${npt.year + 1}-04-25`;
  const turning = +iso.slice(0, 4) - BIRTHDAY.year;
  return { id: 'birthday', name: 'Shuvam’s birthday', np: 'जन्मदिन', peak: iso, start: iso, end: iso, peakLabel: `Turning ${turning}`, blurb: `12 Baisakh in the Nepali calendar. He turns ${turning}.`, mode: 'birthday' };
}

export function festivalState(npt) {
  const birthday = nextBirthday(npt);
  const all = [...FESTIVALS, birthday];
  const active = all.find((f) => npt.iso >= f.start && npt.iso <= f.end) || null;
  const upcoming = all
    .filter((f) => f.peak >= npt.iso)
    .sort((a, b) => (a.peak < b.peak ? -1 : 1))
    .map((f) => ({ ...f, days: daysBetween(npt.iso, f.peak) }));
  return { active, upcoming, isBirthday: npt.month === BIRTHDAY.month && npt.day === BIRTHDAY.day };
}

// A light-hearted guess, labelled as such wherever it is shown. Returns an
// id; DOING holds the English text (translations live in i18n/content/misc.js
// under "doing.<id>").
export const DOING = {
  'up-late': 'Still awake, overthinking a research idea',
  asleep: 'Asleep. Replies arrive after the morning chiya',
  'morning-chiya': 'Morning chiya and too many tech headlines',
  'saturday-cooking': 'Saturday, Nepal’s day off. Probably cooking something ambitious',
  'saturday-food': 'Saturday afternoon. Out hunting for good food',
  starting: 'Getting the day started',
  work: 'At work on systems for United Lubricants and SatyaDip',
  cooking: 'Cooking, or hunting for something good to eat',
  research: 'Research, side projects, or yapping on X',
};

export function probablyDoingId(npt) {
  const h = npt.hour + npt.minute / 60;
  const saturday = npt.weekday === 'Saturday';
  if (h < 1.5) return 'up-late';
  if (h < 6) return 'asleep';
  if (h < 8) return 'morning-chiya';
  if (saturday && h < 21) return h < 13 ? 'saturday-cooking' : 'saturday-food';
  if (h < 9.5) return 'starting';
  if (h < 17.5) return 'work';
  if (h < 20) return 'cooking';
  return 'research';
}

export const probablyDoing = (npt) => DOING[probablyDoingId(npt)];

export function visitorRelative(date = new Date()) {
  const visitorOffset = -date.getTimezoneOffset();
  const diff = 345 - visitorOffset;
  let zone = 'your timezone';
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || zone;
  } catch {
    /* ignore */
  }
  const city = zone.includes('/') ? zone.split('/').pop().replace(/_/g, ' ') : zone;
  if (diff === 0) return { diff, city, zone, text: 'You are on Nepal time right now.' };
  const abs = Math.abs(diff);
  const hrs = Math.floor(abs / 60);
  const mins = abs % 60;
  const span = `${hrs ? `${hrs}h` : ''}${hrs && mins ? ' ' : ''}${mins ? `${mins}m` : ''}`;
  return { diff, city, zone, text: diff > 0 ? `Nepal is ${span} ahead of ${city}.` : `Nepal is ${span} behind ${city}.` };
}

export function computeWorld(date = worldNow()) {
  const npt = nptParts(date);
  const bs = bsDate(npt);
  const sun = sunPosition(date, LALITPUR);
  const times = sunTimes(date, LALITPUR);
  const moon = moonState(date, LALITPUR);
  const season = seasonForBsMonth(bs.month);
  const phase = skyPhase(sun.elevation);
  return {
    date,
    npt,
    bs,
    sun,
    times,
    moon,
    phase,
    isDaylight: sun.elevation > -2,
    season,
    festivals: festivalState(npt),
    doing: probablyDoing(npt),
    doingId: probablyDoingId(npt),
  };
}

// ---- live store ---------------------------------------------------------
let world = computeWorld();
const listeners = new Set();
let timer = null;

function tick() {
  world = computeWorld(worldNow());
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  if (!timer) timer = setInterval(tick, 20000);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export const getWorld = () => world;
export const useWorld = () => useSyncExternalStore(subscribe, getWorld, getWorld);

// A per-second clock for places that show seconds, kept separate so the
// whole tree does not re-render every second.
let now = worldNow();
const clockListeners = new Set();
let clockTimer = null;
function subscribeClock(l) {
  clockListeners.add(l);
  if (!clockTimer)
    clockTimer = setInterval(() => {
      now = worldNow();
      clockListeners.forEach((fn) => fn());
    }, 1000);
  return () => {
    clockListeners.delete(l);
    if (!clockListeners.size && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}
const getNow = () => now;
export const useNow = () => useSyncExternalStore(subscribeClock, getNow, getNow);
