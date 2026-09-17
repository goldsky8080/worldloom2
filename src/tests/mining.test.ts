import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { MockWorldServer } from '../mocks/gateways/MockWorldServer';
import { MockGameGateway, MockRealtimeGateway } from '../mocks/gateways';
import { GameRuntime } from '../core/event/GameRuntime';
import { createCommand } from '../core/command/createCommand';
import {
  commandSchema,
  entitySchema,
  CONTRACT_VERSION,
  type GameEvent,
  type WorldEntityView,
} from '../core/contracts';
import { WORLD_CONFIG } from '../core/world/worldConfig';
import { interactionPreview } from '../core/world/interaction';
import { notifications } from '../services/notification';
let server: MockWorldServer,
  realtime: MockRealtimeGateway,
  runtime: GameRuntime,
  events: GameEvent[];
beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-17T00:00:00Z'));
  server = new MockWorldServer();
  server.latency.set(0);
  events = [];
  server.listen((e) => events.push(e));
  realtime = new MockRealtimeGateway(server);
  runtime = new GameRuntime(new MockGameGateway(server), realtime);
  notifications.entries.set([]);
  await runtime.start();
});
afterEach(() => {
  runtime.stop();
  server.stop();
  vi.useRealTimers();
});
async function send(c: ReturnType<typeof createCommand>) {
  const pending = runtime.send(c);
  await vi.advanceTimersByTimeAsync(0);
  return pending;
}
async function near(offset = 0) {
  const s = await server.snapshot(),
    p = { ...s.world[0], x: 1200 + offset, y: 600 };
  delete p.movement;
  server.publish({ eventType: 'WORLD_ENTITY_UPDATED', payload: p });
}
function copper() {
  return runtime.cache.inventory.get().items.find((i) => i.id === 'copper')!.quantity;
}
describe('first playable mining rules', () => {
  it('starts idle and gives both copper nodes an interaction contract', () => {
    expect(runtime.cache.world.get()[0]).toMatchObject({ moveSpeed: 120, status: 'idle' });
    expect(runtime.cache.world.get()[0].movement).toBeUndefined();
    for (const node of runtime.cache.world.get().filter((n) => n.id.startsWith('resource-')))
      expect(node.interaction).toEqual({
        type: 'mining',
        range: WORLD_CONFIG.interaction.defaultRange,
        durationMs: 5000,
      });
  });
  it('rejects mining from outside range without inventory or activity changes', async () => {
    const c = createCommand('START_MINING', { nodeId: 'resource-1' });
    expect(await send(c)).toMatchObject({ status: 'FAILED', errorKey: 'mining.tooFar' });
    await vi.advanceTimersByTimeAsync(10000);
    expect(copper()).toBe(12);
    expect(runtime.cache.mining.get().active).toEqual([]);
    expect(events.some((e) => e.eventType === 'MINING_STARTED')).toBe(false);
  });
  it('accepts the inclusive range boundary', async () => {
    await near(90);
    expect((await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).status).toBe(
      'ACCEPTED',
    );
  });
  it('rejects immediately outside the range boundary', async () => {
    await near(90.001);
    expect(await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).toMatchObject({
      status: 'FAILED',
      errorKey: 'mining.tooFar',
    });
  });
  it('rejects missing, non-resource, and decorative resource nodes', async () => {
    for (const id of ['missing', 'npc-1', 'ambient-0'])
      expect(await send(createCommand('START_MINING', { nodeId: id }))).toMatchObject({
        status: 'FAILED',
        errorKey: 'mining.invalidNode',
      });
  });
  it('rejects a resource without a mining interaction', async () => {
    const node = { ...runtime.cache.world.get().find((n) => n.id === 'resource-1')! };
    delete node.interaction;
    server.publish({ eventType: 'WORLD_ENTITY_UPDATED', payload: node });
    expect(await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).toMatchObject({
      status: 'FAILED',
      errorKey: 'mining.invalidNode',
    });
  });
  it('rejects unknown characters and actors that do not own the player', async () => {
    await near();
    for (const id of ['missing', 'character-2'])
      expect((await send(createCommand('START_MINING', { nodeId: 'resource-1' }, id))).status).toBe(
        'FAILED',
      );
    expect(copper()).toBe(12);
  });
  it('reserves activity before execution so simultaneous moves and mining cannot overlap', async () => {
    await near();
    const move = createCommand('MOVE', { entityId: 'player-1', x: 1550, y: 1100 });
    expect((await send(move)).status).toBe('ACCEPTED');
    expect(await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).toMatchObject({
      status: 'FAILED',
      errorKey: 'command.busy',
    });
    expect(
      await send(createCommand('MOVE', { entityId: 'player-1', x: 1300, y: 600 })),
    ).toMatchObject({ status: 'FAILED', errorKey: 'command.busy' });
    await vi.advanceTimersByTimeAsync(80);
    expect(await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).toMatchObject({
      status: 'FAILED',
      errorKey: 'command.busy',
    });
  });
  it('blocks movement and second mining while accepted and while executing', async () => {
    await near();
    expect((await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).status).toBe(
      'ACCEPTED',
    );
    for (const delay of [0, 80]) {
      await vi.advanceTimersByTimeAsync(delay);
      expect(
        await send(createCommand('MOVE', { entityId: 'player-1', x: 1550, y: 1100 })),
      ).toMatchObject({ status: 'FAILED', errorKey: 'command.busy' });
      expect(await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).toMatchObject({
        status: 'FAILED',
        errorKey: 'mining.alreadyActive',
      });
    }
  });
  it('uses the node duration and publishes ordered authoritative completion events', async () => {
    await near();
    events.length = 0;
    const c = createCommand('START_MINING', { nodeId: 'resource-1' });
    await send(c);
    await vi.advanceTimersByTimeAsync(80);
    const active = runtime.cache.mining.get().active[0];
    expect(Date.parse(active.completesAt) - Date.parse(active.startedAt)).toBe(5000);
    expect(copper()).toBe(12);
    await vi.advanceTimersByTimeAsync(4999);
    expect(copper()).toBe(12);
    await vi.advanceTimersByTimeAsync(1);
    expect(copper()).toBe(15);
    expect(runtime.cache.mining.get().active).toEqual([]);
    expect(runtime.cache.mining.get().recentResults[0]).toMatchObject({
      commandId: c.commandId,
      nodeId: 'resource-1',
      rewards: [{ itemId: 'copper', quantity: 3 }],
    });
    expect(events.map((e) => e.eventType)).toEqual([
      'MINING_STARTED',
      'COMMAND_STATUS',
      'INVENTORY_UPDATED',
      'MINING_COMPLETED',
      'NOTIFICATION_CREATED',
      'COMMAND_STATUS',
    ]);
    expect(runtime.commands.get()[c.commandId].status).toBe('SUCCEEDED');
    expect(notifications.entries.get().some((n) => n.titleKey === 'mining.completed')).toBe(true);
  });
  it('supports map selection target movement, arrival, and repeated mining without refresh', async () => {
    const move = createCommand('MOVE', { entityId: 'player-1', x: 1200, y: 600 });
    await send(move);
    await vi.advanceTimersByTimeAsync(80);
    const m = runtime.cache.world.get()[0].movement!;
    expect(Date.parse(m.arrivesAt) - Date.parse(m.startedAt)).toBe(2135);
    await vi.advanceTimersByTimeAsync(2135);
    expect(runtime.cache.world.get()[0]).toMatchObject({ x: 1200, y: 600, status: 'idle' });
    for (let i = 0; i < 2; i++) {
      expect((await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).status).toBe(
        'ACCEPTED',
      );
      await vi.advanceTimersByTimeAsync(5080);
    }
    expect(copper()).toBe(18);
  });
  it('makes simultaneous duplicate IDs and completed retries award exactly once', async () => {
    await near();
    const c = createCommand('START_MINING', { nodeId: 'resource-1' });
    const pending = Promise.all([runtime.send(c), runtime.send(c)]);
    await vi.advanceTimersByTimeAsync(0);
    const receipts = await pending;
    expect(receipts[0]).toEqual(receipts[1]);
    await vi.advanceTimersByTimeAsync(5080);
    await send(c);
    await vi.advanceTimersByTimeAsync(10000);
    expect(copper()).toBe(15);
    expect(events.filter((e) => e.eventType === 'MINING_COMPLETED')).toHaveLength(1);
    expect(runtime.commands.get()[c.commandId].status).toBe('SUCCEEDED');
  });
  it('revalidates acceptance before execution and releases a failed reservation', async () => {
    await near();
    const c = createCommand('START_MINING', { nodeId: 'resource-1' });
    await send(c);
    const node = { ...runtime.cache.world.get().find((n) => n.id === 'resource-1')! };
    delete node.interaction;
    server.publish({ eventType: 'WORLD_ENTITY_UPDATED', payload: node });
    await vi.advanceTimersByTimeAsync(80);
    expect(runtime.commands.get()[c.commandId]).toMatchObject({
      status: 'FAILED',
      errorKey: 'mining.invalidNode',
    });
    expect(
      (await send(createCommand('MOVE', { entityId: 'player-1', x: 1300, y: 600 }))).status,
    ).toBe('ACCEPTED');
    expect(copper()).toBe(12);
  });
  it('hydrates active mining and latest results from authoritative snapshots', async () => {
    await near();
    const c = createCommand('START_MINING', { nodeId: 'resource-1' });
    await send(c);
    await vi.advanceTimersByTimeAsync(80);
    runtime.cache.mining.set({ active: [], recentResults: [] });
    await runtime.recover();
    expect(runtime.cache.mining.get().active[0]).toMatchObject({ commandId: c.commandId });
    await vi.advanceTimersByTimeAsync(5000);
    runtime.cache.mining.set({ active: [], recentResults: [] });
    await runtime.recover();
    expect(runtime.cache.mining.get().recentResults[0].commandId).toBe(c.commandId);
    expect(copper()).toBe(15);
  });
  it('recovers mining completion once through replay after disconnection', async () => {
    await near();
    const c = createCommand('START_MINING', { nodeId: 'resource-1' });
    await send(c);
    await vi.advanceTimersByTimeAsync(80);
    realtime.simulateDisconnect();
    await vi.advanceTimersByTimeAsync(5500);
    expect(runtime.connection.get()).toBe('connected');
    expect(copper()).toBe(15);
    expect(runtime.cache.mining.get().recentResults).toHaveLength(1);
  });
  it('treats completion rewards as presentation and updates inventory only via INVENTORY_UPDATED', () => {
    const result = {
      commandId: crypto.randomUUID(),
      characterId: 'character-1',
      nodeId: 'resource-1',
      completedAt: new Date().toISOString(),
      rewards: [{ itemId: 'copper', quantity: 999 }],
    };
    server.publish({ eventType: 'MINING_COMPLETED', payload: result });
    expect(runtime.cache.mining.get().recentResults[0].rewards[0].quantity).toBe(999);
    expect(copper()).toBe(12);
  });
  it('does not grant speculative rewards or unblock mining from a display deadline', () => {
    const now = Date.now(),
      player: WorldEntityView = {
        ...runtime.cache.world.get()[0],
        movement: {
          fromX: 1040,
          fromY: 800,
          toX: 1200,
          toY: 600,
          startedAt: new Date(now - 10000).toISOString(),
          arrivesAt: new Date(now - 1).toISOString(),
        },
      };
    const node = runtime.cache.world.get().find((n) => n.id === 'resource-1')!;
    const preview = interactionPreview(
      player,
      node,
      { active: [], recentResults: [] },
      'character-1',
      now,
    );
    expect(preview.inRange).toBe(true);
    expect(preview.moving).toBe(true);
    expect(preview.canMine).toBe(false);
    expect(copper()).toBe(12);
  });
  it('rejects client-provided reward fields and invalid movement/interaction metadata', () => {
    const c = createCommand('START_MINING', { nodeId: 'resource-1' });
    expect(c.contractVersion).toBe(CONTRACT_VERSION);
    expect(
      commandSchema.safeParse({ ...c, payload: { nodeId: 'resource-1', quantity: 999 } }).success,
    ).toBe(false);
    const player = runtime.cache.world.get()[0];
    expect(entitySchema.safeParse({ ...player, moveSpeed: 0 }).success).toBe(false);
    expect(
      entitySchema.safeParse({
        ...player,
        interaction: { type: 'mining', range: 0, durationMs: 1 },
      }).success,
    ).toBe(false);
  });
  it('returns a distinct server error for a valid MOVE envelope outside world bounds', async () => {
    const c = createCommand('MOVE', { entityId: 'player-1', x: 0, y: 0 });
    expect(
      await send({ ...c, payload: { entityId: 'player-1', x: WORLD_CONFIG.width + 1, y: 0 } }),
    ).toMatchObject({ status: 'FAILED', errorKey: 'world.outOfBounds' });
  });
});
