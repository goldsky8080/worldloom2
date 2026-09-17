import { timeService } from '../services/time/TimeService';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { MockWorldServer } from '../mocks/gateways/MockWorldServer';
import { MockGameGateway, MockRealtimeGateway, MockSocialGateway } from '../mocks/gateways';
import { GameRuntime } from '../core/event/GameRuntime';
import { createCommand } from '../core/command/createCommand';
import { MockAuthGateway } from '../mocks/gateways/MockAuthGateway';
let server: MockWorldServer,
  game: MockGameGateway,
  realtime: MockRealtimeGateway,
  runtime: GameRuntime;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-17T00:00:00Z'));
  server = new MockWorldServer();
  server.latency.set(0);
  game = new MockGameGateway(server);
  realtime = new MockRealtimeGateway(server);
  runtime = new GameRuntime(game, realtime);
  sessionStorage.clear();
});
afterEach(() => {
  runtime.stop();
  server.stop();
  vi.useRealTimers();
});
async function boot() {
  const start = runtime.start();
  await vi.advanceTimersByTimeAsync(0);
  await start;
}
async function send(command: ReturnType<typeof createCommand>) {
  const pending = runtime.send(command);
  await vi.advanceTimersByTimeAsync(0);
  return pending;
}
async function arriveAtVein() {
  await send(createCommand('MOVE', { entityId: 'player-1', x: 1200, y: 600 }));
  await vi.advanceTimersByTimeAsync(3000);
}
describe('authoritative mock integration', () => {
  it('keeps ACCEPTED separate from completion and changes inventory only through events', async () => {
    await boot();
    await arriveAtVein();
    const command = createCommand('START_MINING', { nodeId: 'resource-1' });
    expect((await send(command)).status).toBe('ACCEPTED');
    expect(runtime.commands.get()[command.commandId].status).toBe('ACCEPTED');
    expect(runtime.cache.inventory.get().items[0].quantity).toBe(12);
    await vi.advanceTimersByTimeAsync(80);
    expect(runtime.commands.get()[command.commandId].status).toBe('EXECUTING');
    await vi.advanceTimersByTimeAsync(5000);
    expect(runtime.commands.get()[command.commandId].status).toBe('SUCCEEDED');
    expect(runtime.cache.inventory.get().items[0].quantity).toBe(15);
  });
  it('handles concurrent duplicate IDs once and rejects a reused ID with a changed payload', async () => {
    await boot();
    await arriveAtVein();
    const command = createCommand('START_MINING', { nodeId: 'resource-1' });
    const pending = Promise.all([runtime.send(command), runtime.send(command)]);
    await vi.advanceTimersByTimeAsync(0);
    const receipts = await pending;
    expect(receipts[0]).toEqual(receipts[1]);
    await vi.advanceTimersByTimeAsync(6000);
    expect(runtime.cache.inventory.get().items[0].quantity).toBe(15);
    const changed = game.sendCommand({ ...command, payload: { nodeId: 'resource-2' } });
    const rejection = expect(changed).rejects.toThrow('command.rejected');
    await vi.advanceTimersByTimeAsync(0);
    await rejection;
  });
  it('prevents duplicate mail reward claims even with different command IDs', async () => {
    await boot();
    await send(createCommand('MAIL_CLAIM', { mailId: 'mail-1' }));
    await send(createCommand('MAIL_CLAIM', { mailId: 'mail-1' }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(runtime.cache.inventory.get().gold).toBe(1300);
    expect(runtime.cache.mail.get()[0].claimed).toBe(true);
    await send(createCommand('MAIL_CLAIM_ALL', {}));
    await vi.advanceTimersByTimeAsync(1000);
    expect(runtime.cache.inventory.get().gold).toBe(1325);
  });
  it('rejects invalid nodes without changing resources', async () => {
    await boot();
    const command = createCommand('START_MINING', { nodeId: 'missing' });
    expect((await send(command)).status).toBe('FAILED');
    await vi.advanceTimersByTimeAsync(5000);
    expect(runtime.cache.inventory.get().items[0].quantity).toBe(12);
  });
  it('replays missed events after reconnect', async () => {
    await boot();
    await arriveAtVein();
    await send(createCommand('START_MINING', { nodeId: 'resource-1' }));
    realtime.simulateDisconnect();
    expect(runtime.connection.get()).toBe('reconnecting');
    await vi.advanceTimersByTimeAsync(6000);
    expect(runtime.connection.get()).toBe('connected');
    expect(runtime.cache.inventory.get().items[0].quantity).toBe(15);
    expect(runtime.sequence.get()).toBe(server.sequence);
  });
  it('uses a fresh snapshot when replay history is gone and recovers terminal command status', async () => {
    await boot();
    const command = createCommand('MAIL_CLAIM', { mailId: 'mail-1' });
    await send(command);
    realtime.simulateDisconnect();
    await vi.advanceTimersByTimeAsync(500);
    for (let i = 0; i < 125; i++)
      server.publish({
        eventType: 'NOTIFICATION_CREATED',
        payload: { titleKey: 'network.recovered', kind: 'info' },
      });
    const snapshot = vi.spyOn(game, 'getSnapshot');
    await vi.advanceTimersByTimeAsync(3000);
    expect(snapshot).toHaveBeenCalled();
    expect(runtime.commands.get()[command.commandId].status).toBe('SUCCEEDED');
    expect(runtime.cache.inventory.get().gold).toBe(1300);
    expect(runtime.sequence.get()).toBe(server.sequence);
  });
  it('invalidates and refetches on a sequence gap', async () => {
    await boot();
    const snapshot = vi.spyOn(game, 'getSnapshot');
    realtime.injectGap();
    expect(runtime.cache.valid.get()).toBe(false);
    expect(runtime.connection.get()).toBe('recovering');
    await vi.advanceTimersByTimeAsync(0);
    expect(snapshot).toHaveBeenCalledTimes(1);
    expect(runtime.cache.valid.get()).toBe(true);
    expect(runtime.sequence.get()).toBe(2);
  });
  it('refetches safely after an invalid transport payload', async () => {
    await boot();
    const snapshot = vi.spyOn(game, 'getSnapshot');
    server.publish({ eventType: 'INVENTORY_UPDATED', payload: { gold: 1200, items: [] } });
    expect(runtime.cache.inventory.get().gold).toBe(1200);
    const privateReceiver = runtime as unknown as { receive(value: unknown): void };
    privateReceiver.receive({ contractVersion: 'wrong' });
    await vi.advanceTimersByTimeAsync(0);
    expect(snapshot).toHaveBeenCalledTimes(1);
    expect(runtime.connection.get()).toBe('connected');
  });
  it('blocks game commands while disconnected and after session expiration', async () => {
    await boot();
    realtime.simulateDisconnect();
    await expect(runtime.send(createCommand('MAIL_CLAIM_ALL', {}))).rejects.toThrow(
      'command.offline',
    );
    await vi.advanceTimersByTimeAsync(3000);
    server.publish({ eventType: 'SESSION_UPDATED', payload: { expired: true } });
    expect(runtime.connection.get()).toBe('expired');
    await vi.advanceTimersByTimeAsync(5000);
    expect(runtime.connection.get()).toBe('expired');
  });
  it('recovers mail read/delete and chat through social gateway events', async () => {
    await boot();
    const social = new MockSocialGateway(server);
    const read = social.readMail('mail-1');
    await vi.advanceTimersByTimeAsync(0);
    await read;
    expect(runtime.cache.mail.get()[0].read).toBe(true);
    const chat = social.sendChat('region', '<script>alert(1)</script>', 'Aerin');
    await vi.advanceTimersByTimeAsync(0);
    await chat;
    expect(runtime.cache.chat.get().at(-1)?.text).toBe('<script>alert(1)</script>');
    const remove = social.deleteMail('mail-1');
    const rejected = expect(remove).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(0);
    await rejected;
  });
  it('does not hydrate stale state after stop during a slow bootstrap', async () => {
    server.latency.set(2000);
    const start = runtime.start();
    runtime.stop();
    await vi.advanceTimersByTimeAsync(2000);
    await start;
    expect(runtime.cache.valid.get()).toBe(false);
    expect(runtime.connection.get()).toBe('offline');
  });
});
describe('mock auth', () => {
  it('logs in, validates sessions and logs out', async () => {
    const auth = new MockAuthGateway();
    const login = auth.login('demo@living.world', 'demo1234');
    await vi.advanceTimersByTimeAsync(200);
    expect((await login).accountId).toBe('demo-account');
    expect(await auth.getSession()).not.toBeNull();
    await auth.logout();
    expect(await auth.getSession()).toBeNull();
  });
  it('signs up with an unverified account and verifies it locally', async () => {
    const auth = new MockAuthGateway();
    const signup = auth.signup({
      email: 'test@example.com',
      password: 'fakepass123',
      nickname: 'Tester',
      language: 'ko',
      terms: true,
    });
    await vi.advanceTimersByTimeAsync(200);
    expect((await signup).verified).toBe(false);
    const verify = auth.verifyEmail();
    await vi.advanceTimersByTimeAsync(200);
    expect((await verify).verified).toBe(true);
    expect(sessionStorage.getItem('lw.mock.session')).not.toContain('fakepass123');
  });
});

describe('recovery race conditions and session authority', () => {
  it('applies live events received after snapshot capture while preserving clock sync', async () => {
    await boot();
    server.latency.set(2000);
    const recovered = runtime.recover();
    await vi.advanceTimersByTimeAsync(1000);
    server.publish({ eventType: 'INVENTORY_UPDATED', payload: { gold: 999, items: [] } });
    await vi.advanceTimersByTimeAsync(1000);
    await recovered;
    expect(runtime.cache.inventory.get().gold).toBe(999);
    expect(runtime.sequence.get()).toBe(server.sequence);
    expect(Math.abs(timeService.now() - Date.now())).toBeLessThan(2);
  });
  it('stays offline when stopped during reconnect snapshot fallback', async () => {
    await boot();
    realtime.simulateDisconnect();
    for (let i = 0; i < 125; i++)
      server.publish({
        eventType: 'NOTIFICATION_CREATED',
        payload: { titleKey: 'network.recovered', kind: 'info' },
      });
    server.latency.set(2000);
    const reconnect = runtime.reconnect();
    await vi.advanceTimersByTimeAsync(1000);
    runtime.stop();
    await vi.advanceTimersByTimeAsync(1000);
    await reconnect;
    expect(runtime.connection.get()).toBe('offline');
    expect(runtime.cache.valid.get()).toBe(false);
  });
  it('requires reauthentication when the session expired while offline', async () => {
    await boot();
    realtime.simulateDisconnect();
    server.publish({ eventType: 'SESSION_UPDATED', payload: { expired: true } });
    await vi.advanceTimersByTimeAsync(3000);
    expect(runtime.connection.get()).toBe('expired');
    server.restoreSession();
    runtime.stop();
    await boot();
    expect(runtime.connection.get()).toBe('connected');
  });
  it('prevents mining while traveling and travel while mining, including pending commands', async () => {
    await boot();
    const move = createCommand('MOVE', { entityId: 'player-1', x: 1200, y: 600 });
    expect((await send(move)).status).toBe('ACCEPTED');
    expect(await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).toMatchObject({
      status: 'FAILED',
      errorKey: 'command.busy',
    });
    expect(
      await send(createCommand('MOVE', { entityId: 'player-1', x: 1500, y: 700 })),
    ).toMatchObject({ status: 'FAILED', errorKey: 'command.busy' });
    await vi.advanceTimersByTimeAsync(3000);
    const mining = createCommand('START_MINING', { nodeId: 'resource-1' });
    expect((await send(mining)).status).toBe('ACCEPTED');
    expect(
      await send(createCommand('MOVE', { entityId: 'player-1', x: 1500, y: 700 })),
    ).toMatchObject({ status: 'FAILED', errorKey: 'command.busy' });
    expect(await send(createCommand('START_MINING', { nodeId: 'resource-1' }))).toMatchObject({
      status: 'FAILED',
      errorKey: 'mining.alreadyActive',
    });
    await vi.advanceTimersByTimeAsync(5080);
    expect(runtime.commands.get()[mining.commandId].status).toBe('SUCCEEDED');
    expect(runtime.cache.inventory.get().items[0].quantity).toBe(15);
  });
  it('subscribes and unsubscribes module event handlers', async () => {
    await boot();
    const handler = vi.fn(),
      unsubscribe = runtime.onGameEvent('INVENTORY_UPDATED', handler);
    server.publish({ eventType: 'INVENTORY_UPDATED', payload: { gold: 1, items: [] } });
    unsubscribe();
    server.publish({ eventType: 'INVENTORY_UPDATED', payload: { gold: 2, items: [] } });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('connection retry backoff', () => {
  it('increases retry intervals until the authoritative snapshot succeeds', async () => {
    await boot();
    const snapshot = vi.spyOn(game, 'getSnapshot').mockRejectedValue(new Error('common.error'));
    await runtime.recover();
    expect(runtime.connection.get()).toBe('offline');
    await vi.advanceTimersByTimeAsync(3000);
    expect(snapshot).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(snapshot).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(snapshot).toHaveBeenCalledTimes(3);
  });
});
