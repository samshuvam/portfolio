import { profile } from '../data/profile';

// Sends a message to Shuvam's inbox through FormSubmit (no backend needed).
// Used by the contact boarding pass, the paper plane and the phone apps.
const RELAY = `https://formsubmit.co/ajax/${profile.email}`;

export async function sendMessage(fields) {
  const body = new FormData();
  Object.entries(fields).forEach(([k, v]) => body.append(k, v));
  body.append('_template', 'table');
  body.append('_captcha', 'false');
  const res = await fetch(RELAY, { method: 'POST', body, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Relay answered ${res.status}`);
  return res.json().catch(() => ({}));
}
