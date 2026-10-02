import { useEffect, useRef, useState } from 'react';
import { sound } from '../../lib/sound';
import { reducedMotion } from '../../lib/motion';

const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:+';

// A row of split-flap cells. When `text` changes, every cell clatters
// through random letters before landing, a little later than its neighbour.
export default function SplitFlap({ text, length, delay = 0, className = '' }) {
  const scriptText = /[^\x00-\x7F]/.test(text);
  const target = text.toUpperCase().padEnd(length, ' ').slice(0, length);
  const [shown, setShown] = useState(() => (reducedMotion() ? target : ' '.repeat(length)));
  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (reducedMotion() || scriptText) {
      setShown(target);
      return undefined;
    }
    const cur = shown.split('');
    target.split('').forEach((ch, i) => {
      const flips = 4 + Math.floor(Math.random() * 6);
      for (let f = 0; f <= flips; f++) {
        const id = setTimeout(
          () => {
            cur[i] = f === flips ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
            setShown(cur.join(''));
            if (f === flips && i % 3 === 0) sound.flap();
          },
          delay + i * 35 + f * 55,
        );
        timers.current.push(id);
      }
    });
    return () => timers.current.forEach(clearTimeout);
    // `shown` is intentionally left out: we animate from whatever is showing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, delay, scriptText]);

  return (
    <span className={`flap ${className}`} aria-label={text}>
      {scriptText ? <span className="flap-cell flap-script" aria-hidden="true">{text}</span> :
      shown.split('').map((c, i) => (
        <span key={i} className="flap-cell" aria-hidden="true">
          {c}
        </span>
      ))}
    </span>
  );
}
