import { describe, it, expect, vi, afterEach } from 'vitest';
import { MenuRegistry, ModuleRegistry } from '../modules/registry';
import { FeatureFlagService } from '../services/featureFlags';
import { AssetManager } from '../services/assets/AssetManager';
import { frameworkAssets } from '../assets/manifest/framework';
import { dictionaries, languages, translate } from '../services/localization';
import { remainingSeconds, formatCountdown } from '../services/time/TimeService';
import { interpolate } from '../world-renderer/movement/interpolate';
import { inArea } from '../world-renderer/aoi/area';
import { visibleChunks } from '../world-renderer/chunk/chunks';
import { createCommand } from '../core/command/createCommand';
import {
  CONTRACT_VERSION,
  eventSchema,
  commandSchema,
  snapshotSchema,
  charactersSchema,
} from '../core/contracts';
import { createFixture } from '../mocks/fixtures/world';
import { SequenceTracker } from '../core/recovery/SequenceTracker';
import { PanelManager } from '../shell/panels/PanelManager';
import { UiEventBus } from '../core/ui-events/UiEventBus';
import { MockSettingsRepository, defaultSettings } from '../services/settings';
afterEach(() => vi.restoreAllMocks());
const menu = {
  id: 'mining',
  categoryId: 'life',
  titleKey: 'menu.mining',
  iconAssetId: 'framework.menu.mining',
  order: 10,
  target: { type: 'panel' as const, id: 'mining' },
};
describe('registries', () => {
  it('filters flags, platform and visibility and sorts order', () => {
    const flags = new FeatureFlagService(),
      registry = new MenuRegistry(flags);
    registry.register({ ...menu, featureFlag: 'MINING_ENABLED' });
    registry.register({ ...menu, id: 'first', order: 1, platforms: ['mobile'] });
    registry.register({ ...menu, id: 'hidden', visible: false });
    expect(registry.list('life').map((i) => i.id)).toEqual(['mining']);
    expect(registry.list('life', 'mobile').map((i) => i.id)).toEqual(['first', 'mining']);
    flags.set('MINING_ENABLED', false);
    expect(registry.list('life')).toEqual([]);
  });
  it('rejects duplicate menu and evaluates unlock rules', () => {
    const registry = new MenuRegistry();
    registry.register(menu);
    expect(() => registry.register(menu)).toThrow();
    const locked = { ...menu, unlockRule: 'level' };
    expect(registry.isEnabled(locked)).toBe(false);
    registry.registerUnlock('level', () => true);
    expect(registry.isEnabled(locked)).toBe(true);
  });
  it('rejects duplicate module and rolls back invalid registrations', () => {
    const registry = new ModuleRegistry();
    const module = {
      id: 'sample',
      version: '0.1.0',
      panels: [{ id: 'mining', titleKey: 'menu.mining', component: () => null }],
      menuItems: [menu],
    };
    registry.register(module);
    expect(() => registry.register(module)).toThrow();
    expect(() =>
      registry.register({
        id: 'bad',
        version: '1',
        menuItems: [{ ...menu, id: 'bad', target: { type: 'panel', id: 'missing' } }],
      }),
    ).toThrow();
    expect(registry.all()).toHaveLength(1);
    expect(registry.menus.has('bad')).toBe(false);
  });
});
describe('assets', () => {
  it('resolves missing art to a placeholder, caches and supports theme switching', async () => {
    const manager = new AssetManager();
    manager.register([{ ...frameworkAssets[0], themes: { winter: '/assets/winter.webp' } }]);
    const loader = vi.fn(async (path: string) => {
      if (!path.endsWith('.svg')) throw new Error('missing');
    });
    expect(await manager.resolve(frameworkAssets[0].id, loader)).toBe(frameworkAssets[0].fallback);
    await manager.resolve(frameworkAssets[0].id, loader);
    expect(loader).toHaveBeenCalledTimes(2);
    manager.setTheme('winter');
    await manager.resolve(frameworkAssets[0].id, loader);
    expect(loader).toHaveBeenCalledWith('/assets/winter.webp');
  });
  it('rejects unknown IDs and duplicate assets', () => {
    const manager = new AssetManager();
    manager.register(frameworkAssets);
    expect(() => manager.get('unknown')).toThrow();
    expect(() => manager.register(frameworkAssets)).toThrow();
  });
});
describe('localization and settings', () => {
  it.each(languages)('has a complete dictionary for %s', (language) => {
    expect(Object.keys(dictionaries[language]).sort()).toEqual(Object.keys(dictionaries.en).sort());
    expect(Object.values(dictionaries[language]).every(Boolean)).toBe(true);
  });
  it('interpolates translated parameters and falls back on unknown keys', () => {
    expect(translate('character.roster', 'ko', { count: 4 })).toBe('활성 로스터 · 4/5');
    expect(translate('custom.key', 'vi')).toBe('custom.key');
  });
  it('recovers corrupt persisted settings and round-trips settings', async () => {
    const repository = new MockSettingsRepository();
    localStorage.setItem('lw.settings.v1', '{"language":"bad"}');
    expect(await repository.load()).toEqual(defaultSettings);
    await repository.save({ ...defaultSettings, language: 'vi' });
    expect((await repository.load()).language).toBe('vi');
    localStorage.clear();
  });
});
describe('contracts', () => {
  it('validates fixture and separates pool, roster and party', () => {
    const fixture = snapshotSchema.parse(createFixture());
    expect(fixture.characters.characterPool).toHaveLength(7);
    expect(fixture.characters.activeRoster).toHaveLength(5);
    expect(fixture.characters.mainParty).toHaveLength(3);
  });
  it('rejects invalid membership and duplicated roster', () => {
    const c = createFixture().characters;
    expect(charactersSchema.safeParse({ ...c, mainParty: ['missing'] }).success).toBe(false);
    expect(
      charactersSchema.safeParse({ ...c, activeRoster: ['character-1', 'character-1'] }).success,
    ).toBe(false);
  });
  it('creates unique command IDs and rejects out-of-bound movement', () => {
    const a = createCommand('START_MINING', { nodeId: 'resource-1' }),
      b = createCommand('START_MINING', { nodeId: 'resource-1' });
    expect(a.commandId).not.toBe(b.commandId);
    expect(
      commandSchema.safeParse({
        ...a,
        commandType: 'MOVE',
        payload: { entityId: 'player-1', x: -1, y: 100 },
      }).success,
    ).toBe(false);
  });
  it('rejects bad version, sequence and event-specific payload', () => {
    const e = {
      contractVersion: CONTRACT_VERSION,
      eventId: crypto.randomUUID(),
      sequence: 1,
      occurredAt: new Date().toISOString(),
      eventType: 'INVENTORY_UPDATED',
      payload: { gold: 1, items: [] },
    };
    expect(eventSchema.safeParse(e).success).toBe(true);
    for (const bad of [
      { contractVersion: '999.0' },
      { sequence: -1 },
      { payload: { gold: -10, items: [] } },
      { eventType: 'UNKNOWN' },
    ])
      expect(eventSchema.safeParse({ ...e, ...bad }).success).toBe(false);
  });
});
describe('time, interpolation, AOI and sequences', () => {
  it('clamps countdown at zero and formats it', () => {
    expect(remainingSeconds('2026-01-01T00:03:21Z', Date.parse('2026-01-01T00:00:00Z'))).toBe(201);
    expect(formatCountdown(201)).toBe('03:21');
    expect(remainingSeconds('2026-01-01T00:00:00Z', Date.now())).toBe(0);
  });
  it('clamps movement before departure and after arrival', () => {
    const entity = {
      ...createFixture(100000).world[0],
      movement: {
        fromX: 1040,
        fromY: 800,
        toX: 1350,
        toY: 670,
        startedAt: new Date(100000).toISOString(),
        arrivesAt: new Date(115000).toISOString(),
      },
    };
    expect(interpolate(entity, 99999)).toEqual({ x: 1040, y: 800 });
    expect(interpolate(entity, 107500)).toEqual({ x: 1195, y: 735 });
    expect(interpolate(entity, 200000)).toEqual({ x: 1350, y: 670 });
  });
  it('accepts static entities and zero-duration movement', () => {
    const entity = createFixture(100000).world[3];
    expect(interpolate(entity, 0)).toEqual({ x: entity.x, y: entity.y });
    const moving = {
      ...createFixture(100000).world[0],
      movement: {
        fromX: 1040,
        fromY: 800,
        toX: 1350,
        toY: 670,
        startedAt: new Date(100000).toISOString(),
        arrivesAt: new Date(115000).toISOString(),
      },
    };
    moving.movement!.arrivesAt = moving.movement!.startedAt;
    expect(interpolate(moving, 100000)).toEqual({ x: 1350, y: 670 });
  });
  it('culls outside AOI and computes bounded chunks', () => {
    const area = { centerX: 1000, centerY: 800, width: 400, height: 400, zoom: 1 };
    expect(inArea({ x: 1000, y: 800 }, area)).toBe(true);
    expect(inArea({ x: 2000, y: 800 }, area)).toBe(false);
    expect(visibleChunks(area)).toEqual(['2:1', '2:2', '3:1', '3:2']);
  });
  it('detects duplicates and gaps without committing them', () => {
    const tracker = new SequenceTracker(5);
    expect(tracker.inspect(5)).toBe('duplicate');
    expect(tracker.inspect(7)).toBe('gap');
    expect(tracker.last).toBe(5);
    expect(tracker.inspect(6)).toBe('next');
    tracker.commit(6);
    expect(tracker.last).toBe(6);
  });
});
describe('panels and UI event isolation', () => {
  it('focuses singletons, restores minimization and supports multiple instances', () => {
    const manager = new PanelManager(),
      id = manager.open('inventory');
    manager.minimize(id);
    expect(manager.open('inventory')).toBe(id);
    expect(manager.panels.get()[0].minimized).toBe(false);
    manager.mode(id, 'fullscreen');
    expect(manager.panels.get()[0].mode).toBe('fullscreen');
    manager.open('entity', { singleton: false, instanceKey: 'a' });
    manager.open('entity', { singleton: false, instanceKey: 'b' });
    expect(manager.panels.get()).toHaveLength(3);
    manager.back();
    expect(manager.panels.get()).toHaveLength(2);
  });
  it('unsubscribes UI-only events', () => {
    const bus = new UiEventBus(),
      listener = vi.fn(),
      unsubscribe = bus.on('panel.open', listener);
    bus.emit('panel.open', { id: 'one' });
    unsubscribe();
    bus.emit('panel.open', { id: 'two' });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
