import { profile } from '../data/profile';

// Sends a message to Shuvam's inbox through FormSubmit (no backend needed).
// Used by the contact boarding pass, the paper plane and the phone apps.
const RELAY = `https://formsubmit.co/ajax/${profile.email}`;

export async function sendMessage(fields) {
  const body = new FormData();
  Object.entries(fields).forEach(([k, v]) => body.append(k, v));
  body.append('_template', 'table');
  body.append('_captcha', 'false');
  const res = await fetch(RELAY, { method: 'POST', body, headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Relay answered ${res.status}`);
  const result = await res.json();
  if (result.success !== true && result.success !== 'true') throw new Error(result.message || 'Relay did not accept the message');
  return result;
}
