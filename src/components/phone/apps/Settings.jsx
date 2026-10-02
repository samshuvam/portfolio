import { useState } from 'react';
import { ChatsCircleIcon, DeviceMobileIcon, InfoIcon, SpeakerHighIcon, TrashIcon, UserCircleIcon } from '@phosphor-icons/react';
import { useStore, setState } from '../../../lib/store';
import { findEgg } from '../../../lib/eggs';
import { contextAvatar as portrait } from '../../../lib/imagery';
import { useT, useLang, setLang, LANGS, localDigits } from '../../../i18n';
import dict from '../../../i18n/ui/phone';
import { usePhone, store } from '../os';
import { AppShell, Group, Row, Seg, Switch } from '../parts';
import { WALLPAPERS, WallThumb } from '../wallpapers';
import { getVolume, setVolume, sfx } from '../audio';
import '../apps.css';

export default function Settings() {
  const t = useT(dict);
  const lang = useLang();
  const ctx = usePhone();
  const theme = useStore((s) => s.themePref);
  const sound = useStore((s) => s.sound);
  const yap = useStore((s) => s.yap);
  const [vol, setVol] = useState(getVolume());
  const [reset, setReset] = useState(false);

  const walls = ctx.wall?.startsWith('photo:') ? [...WALLPAPERS.map((w) => w.id), ctx.wall] : WALLPAPERS.map((w) => w.id);

  return (
    <AppShell title={t('app.settings')} className="sos-settings">
      <div className="sos-set-me">
        {portrait ? <img src={portrait.srcset?.[0]?.src || portrait.src} alt="" width="56" height="56" /> : <UserCircleIcon size={56} />}
        <span>
          <b>{t('set.owner')}</b>
          <small>{t('set.guest')}</small>
        </span>
      </div>

      <Group title={t('set.lang')}>
        <div className="sos-set-pad">
          <Seg value={lang} onChange={setLang} label={t('set.lang')} options={LANGS.map((l) => ({ id: l.id, label: l.native }))} />
        </div>
      </Group>

      <Group title={t('set.look')}>
        <div className="sos-set-pad">
          <Seg
            value={theme}
            onChange={(v) => setState({ themePref: v })}
            label={t('cc.theme')}
            options={['auto', 'day', 'night'].map((id) => ({ id, label: t(`theme.${id}`) }))}
          />
          <p className="sos-note">{t('set.themeNote')}</p>
        </div>
      </Group>

      <Group title={t('set.wall')}>
        <ul className="sos-walls">
          {walls.map((id) => (
            <li key={id}>
              <button
                type="button"
                className={`sos-wall-pick ${ctx.wall === id ? 'is-on' : ''}`}
                aria-pressed={ctx.wall === id}
                onClick={() => {
                  ctx.setWall(id);
                  sfx.tap();
                }}
              >
                <WallThumb id={id} />
                <span>{id.startsWith('photo:') ? t('set.w.photo') : t(`set.w.${id}`)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Group>

      <Group title={t('set.sound')}>
        <Switch checked={sound} onChange={(v) => setState({ sound: v })} label={t('cc.sound')} sub={t('set.soundSub')} icon={<SpeakerHighIcon size={16} weight="fill" />} />
        <label className="sos-row sos-set-vol">
          <span className="sos-row-text">
            <b>{t('set.volume')}</b>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={vol}
            onChange={(e) => {
              setVolume(+e.target.value);
              setVol(+e.target.value);
            }}
            onPointerUp={() => sfx.tap()}
          />
        </label>
      </Group>

      <Group title={t('set.fun')}>
        <Switch
          checked={yap}
          onChange={(v) => {
            setState({ yap: v });
            if (v) findEgg('yap');
          }}
          label={t('cc.yap')}
          sub={t('set.yapSub')}
          icon={<ChatsCircleIcon size={16} weight="fill" />}
        />
      </Group>

      <Group title={t('set.about')}>
        <Row icon={<DeviceMobileIcon size={16} weight="fill" />} label={t('set.model')} end="ShuvamOS 25.04" />
        <Row icon={<InfoIcon size={16} weight="fill" />} label={t('set.build')} end={t('set.buildV')} />
        <Row label={t('set.storage')} sub={t('set.storageV')} />
        <Row label={t('set.carrier')} end="SUV-1478" />
        <Row label={t('set.uptime')} end={t('set.uptimeV', { n: localDigits(2003, lang) })} />
      </Group>

      <Group>
        <button
          type="button"
          className="sos-row sos-set-reset"
          onClick={() => {
            ['ss-phone-thread'].forEach((k) => {
              try {
                sessionStorage.removeItem(k);
              } catch {
                /* ignore */
              }
            });
            ['ss-phone-wall', 'ss-phone-seen', 'ss-phone-mail', 'ss-phone-snake'].forEach((k) => store.write(k, null));
            ctx.setWall('mithila');
            setReset(true);
          }}
        >
          <span className="sos-row-icon">
            <TrashIcon size={16} weight="fill" />
          </span>
          <span className="sos-row-text">
            <b>{t('set.reset')}</b>
            <small aria-live="polite">{reset ? t('set.resetDone') : t('set.resetSub')}</small>
          </span>
        </button>
      </Group>
      <p className="sos-note sos-set-foot">{t('set.foot')}</p>
    </AppShell>
  );
}
