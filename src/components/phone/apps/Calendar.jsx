import { CakeIcon, SparkleIcon } from '@phosphor-icons/react';
import { useWorld } from '../../../lib/world';
import { useT, useLang, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { AppShell } from '../parts';
import { adLine, bsLine } from '../dates';
import '../apps.css';

// Today in both calendars, this week, and what Nepal is celebrating next.
export default function Calendar() {
  const t = useT(dict);
  const lang = useLang();
  const world = useWorld();
  const { npt, bs, festivals } = world;
  const today = new Date(Date.UTC(npt.year, npt.month - 1, npt.day));
  const wd = today.getUTCDay();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() + (i - wd) * 86400000);
    return { i, day: d.getUTCDate(), today: i === wd };
  });
  const list = festivals.upcoming.slice(0, 6);
  return (
    <AppShell title={t('app.calendar')} sub={t('cal.sub')} className="sos-cal">
      <div className="sos-cal-today">
        <div className="sos-cal-big">
          <small>{t(`mo.${npt.month - 1}`)}</small>
          <b>{localDigits(npt.day, lang)}</b>
        </div>
        <div className="sos-cal-bs">
          <p>{adLine(npt, lang, t)}</p>
          <p className="sos-cal-bsline">{bsLine(bs, lang, t)}</p>
          <p className="sos-note">{t('cal.bsNote')}</p>
        </div>
      </div>
      <ol className="sos-cal-week" aria-label={t('cal.week')}>
        {week.map((d) => (
          <li key={d.i} className={d.today ? 'is-today' : ''} aria-current={d.today ? 'date' : undefined}>
            <small>{t(`wds.${d.i}`)}</small>
            <b>{localDigits(d.day, lang)}</b>
          </li>
        ))}
      </ol>
      {festivals.active && (
        <p className="sos-cal-now">
          <SparkleIcon size={16} weight="fill" aria-hidden="true" /> {t('cal.active', { name: t(`fest.${festivals.active.id}`) })}
        </p>
      )}
      <p className="sos-group-title">{t('cal.next')}</p>
      <ul className="sos-cal-list">
        {list.map((f) => (
          <li key={f.id} className={f.id === 'birthday' ? 'is-bday' : ''}>
            <span className="sos-cal-days">
              {f.days === 0 ? t('cal.today') : <b>{localDigits(f.days, lang)}</b>}
              {f.days > 0 && <small>{t('cal.days')}</small>}
            </span>
            <span className="sos-row-text">
              <b>
                {f.id === 'birthday' && <CakeIcon size={14} weight="fill" aria-hidden="true" />} {t(`fest.${f.id}`)}
              </b>
              <small>{t(`fest.${f.id}.d`)}</small>
            </span>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
