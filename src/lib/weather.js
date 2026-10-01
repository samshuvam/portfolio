import { useEffect, useSyncExternalStore } from 'react';
import { LALITPUR } from './astro';

// Real weather over Lalitpur drives the hero sky: if it is raining at home,
// it rains on the page. Open-Meteo needs no key and allows browser requests.

const KEY = 'ss-weather-v1';
const MAX_AGE = 20 * 60 * 1000;

const KINDS = [
  { codes: [0], kind: 'clear', label: 'Clear' },
  { codes: [1], kind: 'clear', label: 'Mostly clear' },
  { codes: [2], kind: 'partly', label: 'Partly cloudy' },
  { codes: [3], kind: 'cloudy', label: 'Overcast' },
  { codes: [45, 48], kind: 'fog', label: 'Fog' },
  { codes: [51, 53, 55, 56, 57], kind: 'drizzle', label: 'Drizzle' },
  { codes: [61, 63, 66, 80, 81], kind: 'rain', label: 'Rain' },
  { codes: [65, 67, 82], kind: 'rain', label: 'Heavy rain' },
  { codes: [71, 73, 75, 77, 85, 86], kind: 'snow', label: 'Snow' },
  { codes: [95, 96, 99], kind: 'storm', label: 'Thunderstorm' },
];

const classify = (code) => KINDS.find((k) => k.codes.includes(code)) || { kind: 'partly', label: 'Fair' };

let weather = null;
try {
  const cached = JSON.parse(sessionStorage.getItem(KEY) || 'null');
  if (cached && Date.now() - cached.at < MAX_AGE) weather = cached;
} catch {
  /* ignore */
}

const listeners = new Set();
let inflight = null;

async function load() {
  if (weather && Date.now() - weather.at < MAX_AGE) return weather;
  if (inflight) return inflight;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LALITPUR.lat}&longitude=${LALITPUR.lon}` +
    '&current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,precipitation,wind_speed_10m,is_day&timezone=Asia%2FKathmandu';
  inflight = fetch(url, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data) => {
      const c = data.current || {};
      const { kind, label } = classify(c.weather_code);
      weather = {
        at: Date.now(),
        kind,
        label,
        code: c.weather_code,
        temp: Math.round(c.temperature_2m),
        humidity: c.relative_humidity_2m,
        cloud: (c.cloud_cover ?? 30) / 100,
        precip: c.precipitation ?? 0,
        wind: c.wind_speed_10m ?? 0,
      };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(weather));
      } catch {
        /* ignore */
      }
      listeners.forEach((l) => l());
      return weather;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const get = () => weather;

export function useWeather() {
  useEffect(() => {
    load();
    const id = setInterval(load, MAX_AGE);
    return () => clearInterval(id);
  }, []);
  return useSyncExternalStore(subscribe, get, get);
}

export const getWeather = get;
