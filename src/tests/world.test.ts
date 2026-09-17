import { describe, it, expect } from 'vitest';
import { WORLD_CONFIG } from '../core/world/worldConfig';
import { worldDistance } from '../core/world/distance';
import {
  chunkBounds,
  visibleChunks,
  chunkSubscriptionKey,
  chunkSubscriptionArea,
} from '../world-renderer/chunk/chunks';
import { clampCamera, defaultCamera } from '../world-renderer/camera/camera';
import { commandSchema } from '../core/contracts';
import { createCommand } from '../core/command/createCommand';
describe('configurable world foundation', () => {
  it('uses Euclidean distance, including coincident and reversed points', () => {
    expect(worldDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(worldDistance({ x: 3, y: 4 }, { x: 0, y: 0 })).toBe(5);
    expect(worldDistance({ x: 3, y: 4 }, { x: 3, y: 4 })).toBe(0);
  });
  it('calculates all chunks from dimensions including partial edge chunks', () => {
    const config = { width: 6001, height: 4001, chunkSize: 400 };
    expect(chunkBounds(config)).toEqual({ maxX: 15, maxY: 10 });
    const all = visibleChunks(
      { centerX: 3000, centerY: 2000, width: 20000, height: 20000, zoom: 1 },
      config,
    );
    expect(all).toHaveLength(176);
    expect(all).toContain('15:10');
    expect(
      visibleChunks({ centerX: 8000, centerY: 8000, width: 100, height: 100, zoom: 1 }, config),
    ).toEqual([]);
  });
  it('covers world edges without negative or nonexistent chunks', () => {
    const { width, height } = WORLD_CONFIG;
    const edge = visibleChunks({ centerX: width, centerY: height, width: 1, height: 1, zoom: 1 });
    const max = chunkBounds();
    expect(edge).toEqual([`${max.maxX}:${max.maxY}`]);
    expect(visibleChunks({ centerX: 0, centerY: 0, width: 1, height: 1, zoom: 1 })).toEqual([
      '0:0',
    ]);
  });
  it('clamps camera coordinates and zoom while using configured defaults', () => {
    expect(clampCamera({ x: -1, y: 100000, zoom: 100 })).toEqual({
      x: 0,
      y: WORLD_CONFIG.height,
      zoom: WORLD_CONFIG.camera.maxZoom,
    });
    expect(clampCamera({ x: 7000, y: -1, zoom: 0 }, { width: 6000, height: 4000 })).toEqual({
      x: 6000,
      y: 0,
      zoom: WORLD_CONFIG.camera.minZoom,
    });
    expect(defaultCamera()).toEqual({
      x: WORLD_CONFIG.camera.defaultX,
      y: WORLD_CONFIG.camera.defaultY,
      zoom: WORLD_CONFIG.camera.defaultZoom,
    });
  });
  it('validates inclusive MOVE bounds and rejects overshooting either axis', () => {
    const c = createCommand('MOVE', {
      entityId: 'player-1',
      x: WORLD_CONFIG.width,
      y: WORLD_CONFIG.height,
    });
    expect(commandSchema.safeParse(c).success).toBe(true);
    for (const p of [
      { x: WORLD_CONFIG.width + 1, y: 0 },
      { x: 0, y: WORLD_CONFIG.height + 1 },
      { x: -1, y: 0 },
    ])
      expect(
        commandSchema.safeParse({ ...c, payload: { entityId: 'player-1', ...p } }).success,
      ).toBe(false);
  });
  it('only changes subscription keys when chunks change and covers full chunks', () => {
    const a = { centerX: 1000, centerY: 800, width: 200, height: 200, zoom: 1 };
    expect(chunkSubscriptionKey(a)).toBe(chunkSubscriptionKey({ ...a, centerX: 1001 }));
    expect(chunkSubscriptionKey(a)).not.toBe(chunkSubscriptionKey({ ...a, centerX: 1450 }));
    expect(chunkSubscriptionArea(a)).toMatchObject({
      centerX: 1000,
      centerY: 800,
      width: 400,
      height: 800,
    });
  });
});
