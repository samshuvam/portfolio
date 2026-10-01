import { useState } from 'react';

// A phone, exploded into its layers on hover or tap. An engineering diagram,
// not a product screenshot: cover glass to back glass.
const LAYERS = [
  { id: 'glass', label: 'Cover glass' },
  { id: 'display', label: 'OLED panel' },
  { id: 'frame', label: 'Mid-frame' },
  { id: 'board', label: 'Logic board' },
  { id: 'battery', label: 'Battery' },
  { id: 'back', label: 'Back glass + cameras' },
];

export default function ExplodedPhone() {
  const [open, setOpen] = useState(false);
  return (
    <button type="button" className={`phone ${open ? 'is-open' : ''}`} onClick={() => setOpen(!open)} aria-pressed={open} aria-label={open ? 'Put the phone back together' : 'Explode the phone into its layers'}>
      <span className="phone-stack" aria-hidden="true">
        {LAYERS.map((l, i) => (
          <span key={l.id} className={`phone-layer layer-${l.id}`} style={{ '--i': i }}>
            {l.id === 'board' && (
              <>
                <i className="chip chip-soc" />
                <i className="chip chip-ram" />
                <i className="chip chip-a" />
                <i className="chip chip-b" />
              </>
            )}
            {l.id === 'back' && (
              <span className="cam">
                <i />
                <i />
                <i />
              </span>
            )}
            <b className="phone-label">{l.label}</b>
          </span>
        ))}
      </span>
    </button>
  );
}
