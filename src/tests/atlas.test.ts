import fs from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { sampleRegion, regionForScenario, territoryAt } from '../modules/atlas/sampleRegion';
import {
  atlasLod,
  objectVisible,
  visualKey,
  containsPoint,
  clampAtlasCamera,
} from '../modules/atlas/model';
import {
  atlasManifestSchema,
  enhancementKey,
  previewAtlases,
  previewFrameAssets,
} from '../services/assets/atlas';
import { AssetManager } from '../services/assets/AssetManager';
const layers = {
  borders: true,
  houses: true,
  settlements: true,
  resources: true,
  actors: true,
  sites: true,
};
describe('sample region topology and identity', () => {
  it('covers the region with 16 fixed natural polygons with neither holes nor overlap', () => {
    expect(sampleRegion.territories).toHaveLength(16);
    for (let y = 23; y < 4000; y += 107)
      for (let x = 31; x < 6000; x += 113)
        expect(
          sampleRegion.territories.filter((t) => containsPoint(t.polygon, { x, y })),
        ).toHaveLength(1);
    expect(new Set(sampleRegion.territories.map((t) => t.sizeClass)).size).toBe(3);
  });
  it('keeps every object and reserved site in its designated territory', () => {
    const ids = new Set(sampleRegion.objects.map((o) => o.id));
    expect(ids.size).toBe(sampleRegion.objects.length);
    for (const o of [...sampleRegion.objects, ...sampleRegion.sites])
      expect(territoryAt(sampleRegion, o)?.id).toBe(o.territoryId);
    for (const site of sampleRegion.sites)
      if (site.entityId) {
        const o = sampleRegion.objects.find((o) => o.id === site.entityId)!;
        expect(o.siteId).toBe(site.id);
        expect(o.x).toBe(site.x);
      }
    expect(sampleRegion.sites.filter((s) => s.kind === 'castle')).toHaveLength(4);
    expect(sampleRegion.sites.filter((s) => s.kind === 'city')).toHaveLength(2);
    expect(sampleRegion.sites.some((s) => !s.entityId)).toBe(true);
  });
  it('separates crown ownership from stewardship and leaves landless houses intact', () => {
    const core = sampleRegion.territories.filter((t) => t.zone === 'core');
    expect(core.every((t) => t.ownerHouseId === 'crown' && t.stewardshipDays === 30)).toBe(true);
    expect(core.some((t) => t.controllerHouseId !== t.ownerHouseId)).toBe(true);
    expect(sampleRegion.houses.some((h) => h.id === 'wanderer')).toBe(true);
    expect(sampleRegion.territories.some((t) => t.ownerHouseId === 'wanderer')).toBe(false);
    expect(
      sampleRegion.objects.some(
        (o) => (o.kind as string) === 'house' || (o.kind as string) === 'party',
      ),
    ).toBe(false);
  });
});
describe('scenes and LOD', () => {
  it('changes controllers without resetting city development or deleting its house', () => {
    const prosperity = regionForScenario('prosperity'),
      conflict = regionForScenario('conflict');
    const before = prosperity.objects.find((o) => o.id === 'city-1')!,
      after = conflict.objects.find((o) => o.id === 'city-1')!;
    expect(after.level).toBe(before.level);
    expect(after.ownerHouseId).toBe(before.ownerHouseId);
    expect(after.controllerHouseId).not.toBe(before.controllerHouseId);
    expect(after.state).toBe('siege');
    expect(conflict.houses.map((h) => h.id)).toEqual(prosperity.houses.map((h) => h.id));
  });
  it('leaves opened regions as history when declining and does not mutate the base fixture', () => {
    const original = JSON.stringify(sampleRegion),
      prosperity = regionForScenario('prosperity'),
      decline = regionForScenario('decline');
    expect(decline.territories.some((t) => t.state === 'dormant')).toBe(false);
    expect(decline.objects.map((o) => o.id)).toEqual(prosperity.objects.map((o) => o.id));
    expect(decline.territories.some((t) => t.state === 'abandoned')).toBe(true);
    decline.territories[0].ownerHouseId = 'changed';
    expect(JSON.stringify(sampleRegion)).toBe(original);
  });
  it('shows majors far, towns and caravans medium, and people and individual resources near', () => {
    const player = sampleRegion.objects.find((o) => o.kind === 'player')!,
      caravan = sampleRegion.objects.find((o) => o.kind === 'caravan')!,
      city = sampleRegion.objects.find((o) => o.kind === 'city')!,
      resource = sampleRegion.objects.find((o) => o.kind === 'resource')!;
    expect(atlasLod(0.22)).toBe('far');
    expect(atlasLod(0.23)).toBe('medium');
    expect(atlasLod(0.6)).toBe('near');
    expect(objectVisible(city, 'far', layers)).toBe(true);
    expect(objectVisible(player, 'far', layers)).toBe(false);
    expect(objectVisible(caravan, 'medium', layers)).toBe(true);
    expect(objectVisible(player, 'medium', layers)).toBe(false);
    expect(objectVisible(resource, 'near', layers)).toBe(true);
    expect(objectVisible(player, 'near', { ...layers, actors: false })).toBe(false);
    expect(objectVisible(city, 'far', { ...layers, settlements: false })).toBe(false);
  });
  it('bounds cameras to the sample, independent of the provisional logical world', () => {
    expect(clampAtlasCamera({ x: -10, y: 100000, zoom: 80 }, sampleRegion)).toEqual({
      x: 0,
      y: 4000,
      zoom: 1.8,
    });
  });
});
describe('atlas contracts and composed visuals', () => {
  it('validates all actual manifests and every registered and scenario visual key', () => {
    const manifests = previewAtlases.map((a) =>
      atlasManifestSchema.parse(JSON.parse(fs.readFileSync('public' + a.manifestPath, 'utf8'))),
    );
    const frameKeys = new Set(manifests.flatMap((m) => Object.keys(m.frames)));
    for (const f of previewFrameAssets)
      expect(manifests.find((m) => m.id === f.atlasId)!.frames[f.frameKey]).toBeDefined();
    for (const scenario of ['frontier', 'prosperity', 'conflict', 'decline'] as const)
      for (const o of regionForScenario(scenario).objects)
        expect(frameKeys.has(visualKey(o))).toBe(true);
    const city = manifests[0];
    expect(city.frames['settlement.city.l1']).not.toEqual(city.frames['settlement.city.l5']);
  });
  it('rejects frame bounds and oversized sheets', () => {
    expect(
      atlasManifestSchema.safeParse({
        id: 'bad',
        image: '/assets/bad.webp',
        width: 128,
        height: 128,
        frames: { bad: { x: 110, y: 0, w: 30, h: 20 } },
      }).success,
    ).toBe(false);
    expect(
      atlasManifestSchema.safeParse({
        id: 'bad',
        image: '/assets/bad.webp',
        width: 8192,
        height: 128,
        frames: {},
      }).success,
    ).toBe(false);
  });
  it('fails missing manifests safely and allows retry rather than caching failure', async () => {
    const manager = new AssetManager();
    manager.registerAtlases(previewAtlases, previewFrameAssets);
    const request = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false } as Response);
    await expect(manager.loadAtlas('world-settlements')).rejects.toThrow('unavailable');
    await expect(manager.loadAtlas('world-settlements')).rejects.toThrow('unavailable');
    expect(request).toHaveBeenCalledTimes(2);
    request.mockRestore();
  });
  it('keeps tier, rarity and numeric enhancement separate with six effect bands', () => {
    expect(enhancementKey(0)).toBeUndefined();
    expect([1, 3, 4, 6, 7, 9, 10, 12, 13, 15].map(enhancementKey)).toEqual([
      'enhance.low',
      'enhance.low',
      'enhance.mid',
      'enhance.mid',
      'enhance.high',
      'enhance.high',
      'enhance.great',
      'enhance.great',
      'enhance.max',
      'enhance.max',
    ]);
  });
});
