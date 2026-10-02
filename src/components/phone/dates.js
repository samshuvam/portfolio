import { formatNptClock } from '../../lib/world';
import { localDigits } from '../../i18n';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// "9:41" in Nepal time, in the visitor's chosen digits.
export const shortClock = (date, lang) => localDigits(formatNptClock(date).replace(/\s?[AP]M$/i, ''), lang);
export const ampm = (date) => (formatNptClock(date).match(/[AP]M$/i)?.[0] || '');

export function adLine(npt, lang, t) {
  const wd = WEEKDAYS.indexOf(npt.weekday);
  return `${t(`wd.${wd}`)}, ${localDigits(npt.day, lang)} ${t(`mo.${npt.month - 1}`)}`;
}

export function bsLine(bs, lang, t) {
  return t('os.bsDate', { d: localDigits(bs.day, lang), m: t(`bs.${bs.month - 1}`), y: localDigits(bs.year, lang) });
}

export const weekdayShort = (i, t) => t(`wds.${i}`);
