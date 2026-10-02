import { useMemo, useState } from 'react';
import { MagnifyingGlassIcon, PushPinIcon, ShuffleIcon } from '@phosphor-icons/react';
import { jokes } from '../../../data/jokes';
import jokesOverlay from '../../../i18n/content/jokes';
import { noteJoke } from '../../../lib/eggs';
import { useT, useLang, localize, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { useBack } from '../os';
import { AppShell } from '../parts';
import { sfx } from '../audio';
import '../apps.css';

// Shuvam's own notes (pinned) and his joke collection. Opening a joke counts
// towards the "Dad-joke survivor" stamp.
const PINNED = ['n.about', 'n.food', 'n.kanya'];
const TAG_KEY = { ai: 'nt.ai', nepal: 'nt.nepal', food: 'nt.food', kanya: 'nt.kanya', aviation: 'nt.aviation', time: 'nt.nepal' };

export default function Notes() {
  const t = useT(dict);
  const lang = useLang();

  const [open, setOpen] = useState(null); // { kind: 'pin'|'joke', id }
  const [q, setQ] = useState('');
  const list = useMemo(() => jokes.map((j) => localize(j, jokesOverlay, lang)), [lang]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? list.filter((j) => j.text.toLowerCase().includes(s)) : list;
  }, [list, q]);

  useBack(() => {
    if (!open) return false;
    setOpen(null);
    return true;
  });

  const openJoke = (id) => {
    setOpen({ kind: 'joke', id });
    noteJoke(id);
    sfx.tap();
  };

  if (open) {
    const joke = open.kind === 'joke' ? list.find((j) => j.id === open.id) : null;
    const idx = joke ? list.indexOf(joke) : -1;
    return (
      <AppShell title={open.kind === 'pin' ? t(`${open.id}.t`) : t('notes.joke', { n: localDigits(idx + 1, lang) })} className="sos-notes is-reading" backLabel={t('app.notes')} onBack={() => setOpen(null)}>
        <article className="sos-note-paper">
          {open.kind === 'pin' ? (
            <p>{t(`${open.id}.b`)}</p>
          ) : (
            <>
              <p className="sos-note-tags">{joke.tags.map((tag) => t(TAG_KEY[tag] || 'nt.misc')).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</p>
              <p className="sos-note-joke">{joke.text}</p>
            </>
          )}
        </article>
        {joke && (
          <div className="sos-note-nav">
            <button type="button" className="sos-pill is-soft" disabled={idx <= 0} onClick={() => openJoke(list[idx - 1].id)}>
              {t('notes.prev')}
            </button>
            <button type="button" className="sos-pill" disabled={idx >= list.length - 1} onClick={() => openJoke(list[idx + 1].id)}>
              {t('notes.next')}
            </button>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell
      title={t('app.notes')}
      sub={t('notes.sub', { n: localDigits(list.length + PINNED.length, lang) })}
      className="sos-notes"
      actions={
        <button type="button" className="sos-iconbtn" aria-label={t('notes.random')} onClick={() => openJoke(list[Math.floor(Math.random() * list.length)].id)}>
          <ShuffleIcon size={20} weight="bold" />
        </button>
      }
    >
      <label className="sos-search-field">
        <MagnifyingGlassIcon size={15} weight="bold" aria-hidden="true" />
        <span className="sr-only">{t('notes.search')}</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('notes.search')} />
      </label>
      {!q && (
        <>
          <p className="sos-group-title">
            <PushPinIcon size={11} weight="fill" aria-hidden="true" /> {t('notes.pinned')}
          </p>
          <ul className="sos-note-list">
            {PINNED.map((id) => (
              <li key={id}>
                <button type="button" className="sos-note-item" onClick={() => setOpen({ kind: 'pin', id })}>
                  <b>{t(`${id}.t`)}</b>
                  <span>{t(`${id}.b`)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="sos-group-title">{t('notes.jokes')}</p>
      <ul className="sos-note-list" aria-live="polite">
        {shown.map((j) => (
          <li key={j.id}>
            <button type="button" className="sos-note-item" onClick={() => openJoke(j.id)}>
              <b>{j.text.split(/[.?!:]/)[0]}</b>
              <span>{j.text}</span>
            </button>
          </li>
        ))}
        {!shown.length && <li className="sos-empty">{t('notes.none')}</li>}
      </ul>
    </AppShell>
  );
}
