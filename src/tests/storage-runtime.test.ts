import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { MockWorldServer } from '../mocks/gateways/MockWorldServer';
import { MockGameGateway, MockRealtimeGateway } from '../mocks/gateways';
import { GameRuntime } from '../core/event/GameRuntime';
import { createCommand } from '../core/command/createCommand';
import { createDepotBatch } from '../core/storage/model';
import { itemQuantity } from '../core/storage/items';
import type { GameCommand, GameEvent } from '../core/contracts';
let server: MockWorldServer, runtime: GameRuntime, events: GameEvent[];
beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-19T00:00:00Z'));
  server = new MockWorldServer();
  server.latency.set(0);
  events = [];
  server.listen((e) => events.push(e));
  runtime = new GameRuntime(new MockGameGateway(server), new MockRealtimeGateway(server));
  await runtime.start();
});
afterEach(() => {
  runtime.stop();
  server.stop();
  vi.useRealTimers();
});
async function send(c: GameCommand) {
  const p = runtime.send(c);
  await vi.advanceTimersByTimeAsync(0);
  return p;
}
async function arrive(city = 'dawn') {
  const s = await server.snapshot(),
    player = { ...s.world[0], x: city === 'dawn' ? 870 : 1700, y: city === 'dawn' ? 980 : 1050 };
  delete player.movement;
  server.publish({ eventType: 'WORLD_ENTITY_UPDATED', payload: player });
}
const deposit = (q = 10) =>
  createCommand('STORAGE_ACTION', {
    action: 'TRANSFER',
    cityId: 'dawn',
    direction: 'DEPOSIT',
    itemId: 'copper',
    quantity: q,
  });
const ship = (q = 20) =>
  createCommand('STORAGE_ACTION', {
    action: 'SHIP',
    cityId: 'dawn',
    destinationCityId: 'harbor',
    itemId: 'copper',
    quantity: q,
  });
describe('storage authority, commands and recovery', () => {
  it('rejects a warehouse action before visiting without changing assets', async () => {
    expect(await send(deposit())).toMatchObject({
      status: 'FAILED',
      errorKey: 'storage.mustVisit',
    });
    expect(itemQuantity(runtime.cache.inventory.get().items, 'copper')).toBe(12);
  });
  it('only applies a storage transfer after server execution and updates both caches', async () => {
    await arrive();
    expect(await send(deposit())).toMatchObject({ status: 'ACCEPTED' });
    expect(itemQuantity(runtime.cache.inventory.get().items, 'copper')).toBe(12);
    await vi.advanceTimersByTimeAsync(100);
    expect(itemQuantity(runtime.cache.inventory.get().items, 'copper')).toBe(2);
    expect(itemQuantity(runtime.cache.storage.get().warehouses[0].items, 'copper')).toBe(90);
  });
  it('deduplicates the same command ID across transfer, fees and delivery', async () => {
    await arrive();
    const c = ship();
    await send(c);
    await send(c);
    await vi.advanceTimersByTimeAsync(100);
    expect(runtime.cache.inventory.get().gold).toBe(1230);
    expect(runtime.cache.storage.get().shipments).toHaveLength(1);
    server.start();
    await vi.advanceTimersByTimeAsync(16000);
    await send(c);
    await vi.advanceTimersByTimeAsync(100);
    expect(runtime.cache.storage.get().depot).toHaveLength(1);
    expect(runtime.cache.inventory.get().gold).toBe(1230);
    expect(events.filter((e) => e.eventType === 'MAIL_RECEIVED')).toHaveLength(1);
  });
  it('revalidates concurrent accepted withdrawals instead of duplicating assets', async () => {
    await arrive();
    const first = ship(60),
      second = ship(60);
    expect((await send(first)).status).toBe('ACCEPTED');
    expect((await send(second)).status).toBe('ACCEPTED');
    await vi.advanceTimersByTimeAsync(100);
    expect(runtime.commands.get()[second.commandId]).toMatchObject({
      status: 'FAILED',
      errorKey: 'storage.insufficientItems',
    });
    expect(runtime.cache.storage.get().shipments).toHaveLength(1);
    expect(runtime.cache.inventory.get().gold).toBe(1230);
    expect(itemQuantity(runtime.cache.storage.get().warehouses[0].items, 'copper')).toBe(20);
  });
  it('cannot reuse an existing ID with altered storage payload', async () => {
    await arrive();
    const c = deposit();
    await send(c);
    const changed = { ...c, payload: { ...c.payload, quantity: 1 } } as GameCommand;
    const p = runtime.send(changed);
    const assertion = expect(p).rejects.toThrow('command.rejected');
    await vi.advanceTimersByTimeAsync(0);
    await assertion;
  });
  it('uses actual movement completion before warehouse access and blocks moving actors', async () => {
    await arrive();
    const moving = createCommand('MOVE', { entityId: 'player-1', x: 1700, y: 1050 });
    await send(moving);
    expect(await send(deposit())).toMatchObject({ status: 'FAILED', errorKey: 'command.busy' });
    await vi.advanceTimersByTimeAsync(8000);
    const expansion = createCommand('STORAGE_ACTION', {
      action: 'EXPAND',
      target: 'WAREHOUSE',
      cityId: 'harbor',
      currency: 'GOLD',
    });
    expect((await send(expansion)).status).toBe('ACCEPTED');
    await vi.advanceTimersByTimeAsync(100);
    expect(runtime.cache.storage.get().warehouses[1].goldExpansion).toBe(1);
    expect(runtime.cache.storage.get().warehouses[0].goldExpansion).toBe(0);
  });
  it('delivers without moving the character, leaves the warehouse empty at destination and emits existing Mail', async () => {
    await arrive();
    await send(ship());
    await vi.advanceTimersByTimeAsync(100);
    const before = runtime.cache.world.get()[0];
    server.start();
    await vi.advanceTimersByTimeAsync(16000);
    expect(runtime.cache.world.get()[0]).toEqual(before);
    expect(runtime.cache.storage.get().warehouses[1].items).toEqual([]);
    expect(runtime.cache.storage.get().depot[0]).toMatchObject({ cityId: 'harbor', quantity: 20 });
    expect(runtime.cache.mail.get().find((m) => m.depotNotice)).toMatchObject({
      reward: 0,
      claimed: true,
      depotNotice: { stage: 'ARRIVED', cityId: 'harbor' },
    });
  });
  it('cannot collect a delivery by claiming its mail; partial collection works only locally', async () => {
    await arrive();
    await send(ship());
    await vi.advanceTimersByTimeAsync(100);
    server.start();
    await vi.advanceTimersByTimeAsync(16000);
    const mail = runtime.cache.mail.get().find((m) => m.depotNotice)!;
    await send(createCommand('MAIL_CLAIM', { mailId: mail.id }));
    await vi.advanceTimersByTimeAsync(400);
    expect(itemQuantity(runtime.cache.inventory.get().items, 'copper')).toBe(12);
    const c = () =>
      createCommand('STORAGE_ACTION', {
        action: 'COLLECT',
        cityId: 'harbor',
        itemId: 'copper',
        quantity: 7,
      });
    expect(await send(c())).toMatchObject({ status: 'FAILED', errorKey: 'storage.mustVisit' });
    await arrive('harbor');
    await send(c());
    await vi.advanceTimersByTimeAsync(100);
    expect(itemQuantity(runtime.cache.inventory.get().items, 'copper')).toBe(19);
    expect(runtime.cache.storage.get().depot[0].quantity).toBe(13);
  });
  it('hydrates warehouse, shipments and batches consistently after snapshot recovery', async () => {
    await arrive();
    await send(ship());
    await vi.advanceTimersByTimeAsync(100);
    runtime.cache.storage.set({ warehouses: [], depot: [], shipments: [], vehicles: [] });
    await runtime.recover();
    expect(runtime.cache.storage.get().shipments).toHaveLength(1);
    expect(runtime.cache.inventory.get().gold).toBe(1230);
  });
  it('settles arrivals and exact 30-day expiry on snapshot, even without the ticker', async () => {
    const s = await server.snapshot(),
      started = Date.now();
    server.publish({
      eventType: 'STORAGE_UPDATED',
      payload: {
        ...s.storage,
        depot: [createDepotBatch('batch', 'dawn', 'copper', 20, started, 'SYSTEM')],
      },
    });
    await server.snapshot();
    expect(runtime.cache.mail.get().filter((m) => m.depotNotice?.stage === 'ARRIVED')).toHaveLength(
      1,
    );
    for (const [days, stage] of [
      [23, 'D7'],
      [27, 'D3'],
      [29, 'D1'],
      [30, 'EXPIRED'],
    ] as const) {
      vi.setSystemTime(started + days * 86400000);
      await server.snapshot();
      await server.snapshot();
      expect(runtime.cache.mail.get().filter((m) => m.depotNotice?.stage === stage)).toHaveLength(
        1,
      );
    }
    expect(runtime.cache.storage.get().depot).toEqual([]);
  });
  it('charges inventory expansion exactly once and retains old wallet mail reward behavior', async () => {
    const c = createCommand('STORAGE_ACTION', {
      action: 'EXPAND',
      target: 'INVENTORY',
      currency: 'GOLD',
    });
    await send(c);
    await send(c);
    await vi.advanceTimersByTimeAsync(100);
    expect(runtime.cache.inventory.get()).toMatchObject({ gold: 950, goldExpansion: 1, gem: 0 });
    await send(createCommand('MAIL_CLAIM_ALL', {}));
    await vi.advanceTimersByTimeAsync(400);
    expect(runtime.cache.inventory.get().gold).toBe(1025);
  });
  it('fails and releases mining safely if inventory capacity changes before completion', async () => {
    const s = await server.snapshot();
    server.publish({
      eventType: 'WORLD_ENTITY_UPDATED',
      payload: { ...s.world[0], x: 1200, y: 600 },
    });
    const c = createCommand('START_MINING', { nodeId: 'resource-1' });
    await send(c);
    await vi.advanceTimersByTimeAsync(100);
    expect(runtime.cache.mining.get().active).toHaveLength(1);
    server.publish({
      eventType: 'INVENTORY_UPDATED',
      payload: { ...s.inventory, weightLimit: totalInitialWeight() + 1 },
    });
    await vi.advanceTimersByTimeAsync(5000);
    expect(runtime.commands.get()[c.commandId]).toMatchObject({
      status: 'FAILED',
      errorKey: 'storage.weightFull',
    });
    expect(runtime.cache.mining.get().active).toEqual([]);
    expect(itemQuantity(runtime.cache.inventory.get().items, 'copper')).toBe(12);
    expect(events.filter((e) => e.eventType === 'MINING_CANCELLED')).toHaveLength(1);
    expect(
      (await send(createCommand('MOVE', { entityId: 'player-1', x: 870, y: 980 }))).status,
    ).toBe('ACCEPTED');
  });
  it('rejects mining rewards that cannot fit without starting work', async () => {
    const s = await server.snapshot();
    server.publish({
      eventType: 'WORLD_ENTITY_UPDATED',
      payload: { ...s.world[0], x: 1200, y: 600 },
    });
    server.publish({
      eventType: 'INVENTORY_UPDATED',
      payload: { ...s.inventory, weightLimit: totalInitialWeight() + 5 },
    });
    expect(await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).toMatchObject({
      status: 'FAILED',
      errorKey: 'storage.weightFull',
    });
    expect(runtime.cache.mining.get().active).toEqual([]);
  });
});
function totalInitialWeight() {
  return 12 * 2 + 8 * 0.5 + 8;
}
