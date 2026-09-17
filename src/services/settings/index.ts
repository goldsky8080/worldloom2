import { z } from 'zod';
import { Atom } from '../../core/state/atom';
import { languages, setLanguage } from '../localization';
import { uiEvents } from '../../core/ui-events/UiEventBus';
export const settingsSchema = z.object({
  language: z.enum(languages),
  uiScale: z.number().min(0.85).max(1.2),
  timeFormat: z.enum(['12', '24']),
  numberGrouping: z.boolean(),
  sound: z.object({
    master: z.number().min(0).max(1),
    bgm: z.number().min(0).max(1),
    sfx: z.number().min(0).max(1),
    ui: z.number().min(0).max(1),
    notification: z.number().min(0).max(1),
  }),
  graphics: z.object({
    entities: z.number().int().min(10).max(1000),
    quality: z.enum(['low', 'high']),
    effects: z.number().int().min(0).max(2),
    fps: z.union([z.literal(30), z.literal(60)]),
    battery: z.boolean(),
  }),
  interface: z.object({
    chatSize: z.number().min(14).max(22),
    names: z.boolean(),
    hp: z.boolean(),
    tooltip: z.boolean(),
  }),
  notifications: z.object({
    mining: z.boolean(),
    transport: z.boolean(),
    attack: z.boolean(),
    contract: z.boolean(),
    market: z.boolean(),
    guild: z.boolean(),
    mail: z.boolean(),
  }),
});
export type Settings = z.infer<typeof settingsSchema>;
export interface SettingsRepository {
  load(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}
export const defaultSettings: Settings = {
  language: 'ko',
  uiScale: 1,
  timeFormat: '24',
  numberGrouping: true,
  sound: { master: 0.5, bgm: 0.25, sfx: 0.5, ui: 0.3, notification: 0.4 },
  graphics: { entities: 200, quality: 'high', effects: 1, fps: 60, battery: false },
  interface: { chatSize: 14, names: true, hp: true, tooltip: true },
  notifications: {
    mining: true,
    transport: true,
    attack: true,
    contract: true,
    market: true,
    guild: true,
    mail: true,
  },
};
export class MockSettingsRepository implements SettingsRepository {
  async load() {
    try {
      const raw = localStorage.getItem('lw.settings.v1');
      return raw ? settingsSchema.parse(JSON.parse(raw)) : structuredClone(defaultSettings);
    } catch {
      return structuredClone(defaultSettings);
    }
  }
  async save(value: Settings) {
    localStorage.setItem('lw.settings.v1', JSON.stringify(settingsSchema.parse(value)));
  }
}
export const settings = new Atom<Settings>(structuredClone(defaultSettings));
const repository: SettingsRepository = new MockSettingsRepository();
export const settingsPersistenceError = new Atom(false);
function apply(value: Settings) {
  settings.set(value);
  setLanguage(value.language);
  document.documentElement.style.setProperty('--ui-scale', String(value.uiScale));
  document.documentElement.dataset.motion = value.graphics.quality;
  document.documentElement.dataset.effects = String(value.graphics.effects);
}
export async function loadSettings() {
  apply(await repository.load());
}
export function updateSettings(update: (value: Settings) => Settings) {
  const value = settingsSchema.parse(update(settings.get()));
  apply(value);
  uiEvents.emit('settings.changed', undefined);
  void repository
    .save(value)
    .then(() => settingsPersistenceError.set(false))
    .catch(() => settingsPersistenceError.set(true));
}
export function formatNumber(value: number) {
  const s = settings.get();
  return new Intl.NumberFormat(s.language, { useGrouping: s.numberGrouping }).format(value);
}
export function formatTime(value: number) {
  const s = settings.get();
  return new Intl.DateTimeFormat(s.language, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: s.timeFormat === '12',
  }).format(value);
}
