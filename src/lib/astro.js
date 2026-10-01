// Sun and moon for a place on Earth. NOAA solar equations, accurate to well
// under a degree, which is plenty for painting a sky.

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export const LALITPUR = { lat: 27.6667, lon: 85.3167, name: 'Lalitpur' };
export const JANAKPUR = { lat: 26.7288, lon: 85.9263, name: 'Janakpur' };

const julianDay = (date) => date.getTime() / 86400000 + 2440587.5;

function sunEphemeris(date) {
  const T = (julianDay(date) - 2451545.0) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C =
    Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * RAD) * 0.000289;
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) * DEG;
  const y = Math.tan((eps * RAD) / 2) ** 2;
  const eqTime =
    4 *
    DEG *
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD));
  return { decl, eqTime, lambda, eps };
}

function horizontal(decl, hourAngle, lat) {
  const cosZ = Math.sin(lat * RAD) * Math.sin(decl * RAD) + Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(hourAngle * RAD);
  const zenith = Math.acos(Math.min(1, Math.max(-1, cosZ))) * DEG;
  const azimuth =
    (Math.atan2(Math.sin(hourAngle * RAD), Math.cos(hourAngle * RAD) * Math.sin(lat * RAD) - Math.tan(decl * RAD) * Math.cos(lat * RAD)) * DEG + 180 + 360) % 360;
  return { elevation: 90 - zenith, azimuth };
}

export function sunPosition(date, place = LALITPUR) {
  const { decl, eqTime } = sunEphemeris(date);
  const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const tst = (((utcMin + eqTime + 4 * place.lon) % 1440) + 1440) % 1440;
  const hourAngle = tst / 4 - 180;
  return { ...horizontal(decl, hourAngle, place.lat), hourAngle };
}

// Sunrise / sunset for the civil date that contains `date` in the place's day.
export function sunTimes(date, place = LALITPUR) {
  const base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const { decl, eqTime } = sunEphemeris(new Date(base + 6 * 3600 * 1000));
  const cosH0 = Math.cos(90.833 * RAD) / (Math.cos(place.lat * RAD) * Math.cos(decl * RAD)) - Math.tan(place.lat * RAD) * Math.tan(decl * RAD);
  const H0 = Math.acos(Math.min(1, Math.max(-1, cosH0))) * DEG;
  const noon = 720 - 4 * place.lon - eqTime;
  return {
    sunrise: new Date(base + (noon - 4 * H0) * 60000),
    sunset: new Date(base + (noon + 4 * H0) * 60000),
    noon: new Date(base + noon * 60000),
  };
}

const SYNODIC = 29.530588853;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export function moonState(date, place = LALITPUR) {
  const days = (date.getTime() - REF_NEW_MOON) / 86400000;
  const phase = (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC; // 0 new, 0.5 full
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  // The moon trails the sun by `phase` of a full circle in longitude, so it
  // sits roughly phase * 360 degrees of hour angle behind it.
  const { lambda, eps } = sunEphemeris(date);
  const moonLambda = lambda + phase * 360;
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(moonLambda * RAD)) * DEG;
  const sun = sunPosition(date, place);
  const hourAngle = ((sun.hourAngle - phase * 360 + 540) % 360) - 180;
  const pos = horizontal(decl, hourAngle, place.lat);
  let name = 'Waxing crescent';
  if (illumination > 0.985) name = 'Full moon';
  else if (illumination < 0.015) name = 'New moon';
  else if (phase < 0.5) name = illumination > 0.6 ? 'Waxing gibbous' : illumination > 0.4 ? 'First quarter' : 'Waxing crescent';
  else name = illumination > 0.6 ? 'Waning gibbous' : illumination > 0.4 ? 'Last quarter' : 'Waning crescent';
  return { phase, illumination, waxing: phase < 0.5, name, ...pos };
}

// Sky phase from solar elevation, with how far into "day" we are (0..1).
export function skyPhase(elevation) {
  if (elevation >= 6) return 'day';
  if (elevation >= -0.833) return 'golden';
  if (elevation >= -6) return 'civil';
  if (elevation >= -12) return 'nautical';
  if (elevation >= -18) return 'astronomical';
  return 'night';
}

export function haversineKm(a, b) {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
