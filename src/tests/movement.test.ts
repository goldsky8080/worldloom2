import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { MockWorldServer } from '../mocks/gateways/MockWorldServer';
import { createCommand } from '../core/command/createCommand';
import { WORLD_CONFIG } from '../core/world/worldConfig';
import { worldDistance } from '../core/world/distance';
import { interpolate } from '../world-renderer/movement/interpolate';
import type { GameEvent } from '../core/contracts';
describe('authoritative distance based movement', () => {
  let server: MockWorldServer;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-17T00:00:00Z'));
    server = new MockWorldServer();
    server.latency.set(0);
  });
  afterEach(() => {
    server.stop();
    vi.useRealTimers();
  });
  async function movement(x: number, y: number) {
    const events: GameEvent[] = [];
    server.listen((e) => events.push(e));
    const pending = server.command(createCommand('MOVE', { entityId: 'player-1', x, y }));
    await vi.advanceTimersByTimeAsync(80);
    await pending;
    const event = events.find((e) => e.eventType === 'MOVEMENT_STARTED');
    if (!event || event.eventType !== 'MOVEMENT_STARTED') throw Error('No movement');
    return event.payload;
  }
  it('computes duration from actual departure coordinates and speed', async () => {
    const player = await movement(1760, 800);
    const m = player.movement!;
    expect(Date.parse(m.arrivesAt) - Date.parse(m.startedAt)).toBe(
      Math.max(
        WORLD_CONFIG.movement.minimumMovementMs,
        Math.ceil(
          (worldDistance({ x: m.fromX, y: m.fromY }, { x: m.toX, y: m.toY }) / player.moveSpeed!) *
            1000,
        ),
      ),
    );
    await vi.advanceTimersByTimeAsync(Date.parse(m.arrivesAt) - Date.now());
    const state = await server.snapshot();
    expect(state.world[0]).toMatchObject({ x: 1760, y: 800 });
    expect(state.world[0].movement).toBeUndefined();
  });
  it('gives a nearby destination a shorter time than a distant destination', async () => {
    // Override idle coordinates without changing world configuration.
    const state = await server.snapshot();
    const player = { ...state.world[0], x: 1040, y: 800 };
    delete player.movement;
    server.publish({ eventType: 'WORLD_ENTITY_UPDATED', payload: player });
    const near = (await movement(1050, 800)).movement!;
    const nearMs = Date.parse(near.arrivesAt) - Date.parse(near.startedAt);
    expect(nearMs).toBe(WORLD_CONFIG.movement.minimumMovementMs);
    await vi.advanceTimersByTimeAsync(nearMs);
    const far = (await movement(1770, 800)).movement!;
    expect(Date.parse(far.arrivesAt) - Date.parse(far.startedAt)).toBe(6000);
    expect(Date.parse(far.arrivesAt) - Date.parse(far.startedAt)).toBeGreaterThan(nearMs);
  });
  it('uses the current interpolated position instead of a stale stored origin', async () => {
    const snapshot = await server.snapshot();
    const p = snapshot.world[0];
    p.movement = {
      fromX: 500,
      fromY: 500,
      toX: 1000,
      toY: 500,
      startedAt: new Date(Date.now() - 2000).toISOString(),
      arrivesAt: new Date(Date.now() + 2000).toISOString(),
    };
    server.publish({ eventType: 'WORLD_ENTITY_UPDATED', payload: p });
    const moved = await movement(1500, 500);
    const actual = interpolate(p, Date.parse(moved.movement!.startedAt));
    expect(moved.movement!.fromX).toBeCloseTo(actual.x);
    expect(moved.movement!.fromY).toBeCloseTo(actual.y);
  });
});
