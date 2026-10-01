import { useEffect, useRef, useState } from 'react';
import SplitFlap from './SplitFlap';
import { useWorld } from '../../lib/world';

// Departures out of Shuvam's life. Festival rows come from the real
// calendar, so the board is never out of date.
// Flight numbers: two letters for the festival, then the date as MMDD.
const code = (name, iso) => {
  const words = name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return `${letters.toUpperCase()}${iso.slice(5, 7)}${iso.slice(8, 10)}`;
};

const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();

export default function DepartureBoard() {
  const world = useWorld();
  const ref = useRef(null);
  const [go, setGo] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setGo(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const fest = world.festivals.upcoming.filter((f) => f.id !== 'birthday').slice(0, 2);
  const bday = world.festivals.upcoming.find((f) => f.id === 'birthday');
  const status = (f) => (f.days === 0 ? 'TODAY' : f.days === 1 ? 'TOMORROW' : f.days <= 7 ? 'BOARDING' : `IN ${f.days} DAYS`);
  const rows = [
    { time: 'NOW', flight: 'SS2504', to: 'YOUR INBOX', status: 'BOARDING', hot: true },
    ...fest.map((f) => ({ time: fmt(f.peak), flight: code(f.name, f.peak), to: f.name, status: status(f) })),
    bday ? { time: fmt(bday.peak), flight: 'SS0425', to: 'BIRTHDAY', status: status(bday) } : null,
    { time: 'DAILY', flight: 'MO0001', to: 'MOMO SHOP', status: 'DELAYED' },
    { time: 'SOON', flight: 'EV0216', to: 'UAM CORRIDORS', status: 'IN RESEARCH' },
  ].filter(Boolean);

  return (
    <div ref={ref} className="board">
      <ul className="sr-only">
        {rows.map((r) => (
          <li key={r.flight}>
            {r.time}, flight {r.flight} to {r.to}: {r.status.toLowerCase()}
          </li>
        ))}
      </ul>
      <div className="board-head" aria-hidden="true">
        <span>Time</span>
        <span>Flight</span>
        <span>Destination</span>
        <span>Status</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.flight} className={`board-row ${r.hot ? 'is-hot' : ''}`} aria-hidden="true">
          <SplitFlap text={go ? r.time : ''} length={6} delay={i * 260} />
          <SplitFlap text={go ? r.flight : ''} length={6} delay={i * 260 + 120} />
          <SplitFlap text={go ? r.to : ''} length={14} delay={i * 260 + 240} className="board-to" />
          <SplitFlap text={go ? r.status : ''} length={11} delay={i * 260 + 360} className="board-status" />
        </div>
      ))}
    </div>
  );
}
