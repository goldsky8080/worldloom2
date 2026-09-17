import { useState } from 'react';
import { useAtom } from '../../core/state/useAtom';
import {
  settings,
  updateSettings,
  settingsPersistenceError,
  type Settings,
} from '../../services/settings';
import {
  languages,
  languageLabels,
  useTranslation,
  type Language,
} from '../../services/localization';
import { audioService } from '../../services/audio/AudioService';
import { GameTabs, GameButton, ErrorState } from '../../ui/components';
export function SettingsPanel() {
  const value = useAtom(settings),
    persistenceError = useAtom(settingsPersistenceError),
    { t } = useTranslation(),
    [tab, setTab] = useState('general');
  const change = (update: (settings: Settings) => Settings) => updateSettings(update);
  const range = (
    key: string,
    v: number,
    min: number,
    max: number,
    step: number,
    onChange: (value: number) => void,
  ) => (
    <label key={key} className="setting-row">
      <span>{t('settings.' + key)}</span>
      <div className="range-control">
        <input
          aria-label={t('settings.' + key)}
          type="range"
          min={min}
          max={max}
          step={step}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <output>{max === 1 ? Math.round(v * 100) + '%' : v}</output>
      </div>
    </label>
  );
  const toggle = (key: string, v: boolean, onChange: (value: boolean) => void) => (
    <label key={key} className="setting-row">
      <span>{t('settings.' + key)}</span>
      <input type="checkbox" checked={v} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
  return (
    <>
      <GameTabs
        tabs={['general', 'sound', 'graphics', 'interface', 'notifications'].map((id) => ({
          id,
          label: t('settings.' + id),
        }))}
        value={tab}
        onChange={setTab}
      />
      {persistenceError && <ErrorState />}
      <div className="settings-body" role="tabpanel">
        {tab === 'general' && (
          <>
            <label className="setting-row">
              {t('settings.language')}
              <select
                aria-label={t('settings.language')}
                value={value.language}
                onChange={(e) => change((s) => ({ ...s, language: e.target.value as Language }))}
              >
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {languageLabels[l]}
                  </option>
                ))}
              </select>
            </label>
            {range('uiScale', value.uiScale, 0.85, 1.2, 0.05, (v) =>
              change((s) => ({ ...s, uiScale: v })),
            )}
            <label className="setting-row">
              {t('settings.timeFormat')}
              <select
                value={value.timeFormat}
                onChange={(e) =>
                  change((s) => ({ ...s, timeFormat: e.target.value as '12' | '24' }))
                }
              >
                <option value="12">{t('settings.time12')}</option>
                <option value="24">{t('settings.time24')}</option>
              </select>
            </label>
            {toggle('numberFormat', value.numberGrouping, (v) =>
              change((s) => ({ ...s, numberGrouping: v })),
            )}
          </>
        )}
        {tab === 'sound' && (
          <>
            {(Object.keys(value.sound) as Array<keyof Settings['sound']>).map((key) =>
              range(key, value.sound[key], 0, 1, 0.05, (v) =>
                change((s) => ({ ...s, sound: { ...s.sound, [key]: v } })),
              ),
            )}
            <GameButton
              onClick={() => {
                void audioService
                  .unlock()
                  .then(() => audioService.playUi('button.preview'))
                  .catch(() => {});
              }}
            >
              {t('settings.preview')}
            </GameButton>
          </>
        )}
        {tab === 'graphics' && (
          <>
            {range('entities', value.graphics.entities, 10, 1000, 10, (v) =>
              change((s) => ({ ...s, graphics: { ...s.graphics, entities: v } })),
            )}
            <label className="setting-row">
              {t('settings.quality')}
              <select
                value={value.graphics.quality}
                onChange={(e) =>
                  change((s) => ({
                    ...s,
                    graphics: { ...s.graphics, quality: e.target.value as 'high' | 'low' },
                  }))
                }
              >
                {['low', 'high'].map((k) => (
                  <option key={k} value={k}>
                    {t('settings.' + k)}
                  </option>
                ))}
              </select>
            </label>
            {range('effects', value.graphics.effects, 0, 2, 1, (v) =>
              change((s) => ({ ...s, graphics: { ...s.graphics, effects: v } })),
            )}
            <label className="setting-row">
              {t('settings.fps')}
              <select
                value={value.graphics.fps}
                onChange={(e) =>
                  change((s) => ({
                    ...s,
                    graphics: { ...s.graphics, fps: Number(e.target.value) as 30 | 60 },
                  }))
                }
              >
                <option>30</option>
                <option>60</option>
              </select>
            </label>
            {toggle('battery', value.graphics.battery, (v) =>
              change((s) => ({ ...s, graphics: { ...s.graphics, battery: v } })),
            )}
          </>
        )}
        {tab === 'interface' && (
          <>
            {range('chatSize', value.interface.chatSize, 14, 22, 1, (v) =>
              change((s) => ({ ...s, interface: { ...s.interface, chatSize: v } })),
            )}
            {(['names', 'hp', 'tooltip'] as const).map((key) =>
              toggle(key, value.interface[key], (v) =>
                change((s) => ({ ...s, interface: { ...s.interface, [key]: v } })),
              ),
            )}
          </>
        )}
        {tab === 'notifications' &&
          (Object.keys(value.notifications) as Array<keyof Settings['notifications']>).map((key) =>
            toggle(key, value.notifications[key], (v) =>
              change((s) => ({ ...s, notifications: { ...s.notifications, [key]: v } })),
            ),
          )}
      </div>
    </>
  );
}
