import { useEffect, useRef } from 'react';
import { ChatsCircleIcon, FlashlightIcon, LockSimpleIcon, MoonIcon, SpeakerHighIcon, SpeakerSlashIcon, SunIcon, SunDimIcon, TranslateIcon, CircleHalfIcon } from '@phosphor-icons/react';
import { useStore, setState } from '../../lib/store';
import { findEgg } from '../../lib/eggs';
import { useT, useLang, setLang, LANGS } from '../../i18n';
import dict from '../../i18n/ui/phone';

const THEMES = ['auto', 'day', 'night'];

export default function ControlCentre({ open, onClose, torch, onTorch, brightness, onBrightness, onLock }) {
  const t = useT(dict);
  const lang = useLang();
  const sound = useStore((s) => s.sound);
  const theme = useStore((s) => s.themePref);
  const yap = useStore((s) => s.yap);
  const panel = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => panel.current?.querySelector('button')?.focus({ preventScroll: true }), 60);
  }, [open]);

  const ThemeIcon = theme === 'day' ? SunIcon : theme === 'night' ? MoonIcon : CircleHalfIcon;
  const langObj = LANGS.find((l) => l.id === lang) || LANGS[0];

  return (
    <div className={`sos-cc ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <button type="button" className="sos-cc-scrim" aria-label={t('cc.close')} onClick={onClose} tabIndex={-1} />
      <div className="sos-cc-panel" ref={panel} role="group" aria-label={t('os.control')}>
        <div className="sos-cc-grid">
          <button type="button" className={`sos-cc-tile ${sound ? 'is-on' : ''}`} aria-pressed={sound} onClick={() => setState({ sound: !sound })}>
            {sound ? <SpeakerHighIcon size={22} weight="fill" /> : <SpeakerSlashIcon size={22} weight="fill" />}
            <span>{t('cc.sound')}</span>
            <small>{sound ? t('on') : t('off')}</small>
          </button>
          <button type="button" className="sos-cc-tile" onClick={() => setState({ themePref: THEMES[(THEMES.indexOf(theme) + 1) % 3] })}>
            <ThemeIcon size={22} weight="fill" />
            <span>{t('cc.theme')}</span>
            <small>{t(`theme.${theme}`)}</small>
          </button>
          <button
            type="button"
            className={`sos-cc-tile ${yap ? 'is-on' : ''}`}
            aria-pressed={yap}
            onClick={() => {
              setState({ yap: !yap });
              if (!yap) findEgg('yap');
            }}
          >
            <ChatsCircleIcon size={22} weight="fill" />
            <span>{t('cc.yap')}</span>
            <small>{yap ? t('on') : t('off')}</small>
          </button>
          <button type="button" className="sos-cc-tile" onClick={() => setLang(LANGS[(LANGS.indexOf(langObj) + 1) % LANGS.length].id)}>
            <TranslateIcon size={22} weight="fill" />
            <span>{t('cc.lang')}</span>
            <small>{langObj.native}</small>
          </button>
          <button type="button" className={`sos-cc-tile ${torch ? 'is-on' : ''}`} aria-pressed={torch} onClick={onTorch}>
            <FlashlightIcon size={22} weight="fill" />
            <span>{t('cc.torch')}</span>
            <small>{torch ? t('on') : t('off')}</small>
          </button>
          <button type="button" className="sos-cc-tile" onClick={onLock}>
            <LockSimpleIcon size={22} weight="fill" />
            <span>{t('cc.lock')}</span>
            <small>{t('cc.lockSub')}</small>
          </button>
        </div>
        <label className="sos-cc-slider">
          <SunDimIcon size={18} weight="fill" aria-hidden="true" />
          <span className="sr-only">{t('cc.bright')}</span>
          <input type="range" min="0.35" max="1" step="0.01" value={brightness} onChange={(e) => onBrightness(+e.target.value)} />
        </label>
        <p className="sos-cc-note">{t('cc.note')}</p>
      </div>
    </div>
  );
}
