import { movementDurationMs } from '../../core/world/interaction';
import { Atom } from '../../core/state/atom';
import {
  CONTRACT_VERSION,
  commandSchema,
  eventSchema,
  snapshotSchema,
  type GameCommand,
  type GameEvent,
  type GameSnapshot,
  type CommandReceipt,
  type ChatMessage,
  type WorldEntityView,
} from '../../core/contracts';
import { WORLD_CONFIG } from '../../core/world/worldConfig';
import { worldDistance } from '../../core/world/distance';
import { createFixture } from '../fixtures/world';
import { interpolate } from '../../core/world/interpolate';
/** Authoritative mock boundary: client input never determines duration or rewards. */
export class MockWorldServer {
  sessionExpired = false;
  restoreSession() {
    this.sessionExpired = false;
  }
  private assertSession() {
    if (this.sessionExpired) throw new Error('auth.expired');
  }
  private state: GameSnapshot = createFixture();
  private history: GameEvent[] = [];
  private listeners = new Set<(event: GameEvent) => void>();
  private commands = new Map<string, { serialized: string; receipt: CommandReceipt }>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  /** Reserve at acceptance, before the execution delay, to close simultaneous-command races. */
  private activeActivity = new Map<string, { type: 'moving' | 'mining'; commandId: string }>();
  private ticker?: ReturnType<typeof setInterval>;
  latency = new Atom(200);
  get sequence() {
    return this.state.sequence;
  }
  private wait = () => new Promise<void>((resolve) => setTimeout(resolve, this.latency.get()));
  private schedule(fn: () => void, ms: number) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, ms);
    this.timers.add(timer);
  }
  start() {
    if (!this.ticker) this.ticker = setInterval(() => this.advanceWorld(), 1000);
  }
  stop() {
    clearInterval(this.ticker);
    this.ticker = undefined;
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }
  async snapshot(): Promise<GameSnapshot> {
    const half = this.latency.get() / 2;
    if (half) await new Promise<void>((resolve) => setTimeout(resolve, half));
    this.assertSession();
    const snapshot = snapshotSchema.parse(
      structuredClone({
        ...this.state,
        serverTime: new Date().toISOString(),
      }),
    );
    if (half) await new Promise<void>((resolve) => setTimeout(resolve, half));
    this.assertSession();
    return snapshot;
  }
  listen(listener: (event: GameEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  replay(after: number) {
    const available =
      after === this.sequence ||
      (after <= this.sequence && this.history.some((e) => e.sequence === after + 1));
    return {
      replay: available ? structuredClone(this.history.filter((e) => e.sequence > after)) : [],
      replayAvailable: available,
    };
  }
  publish(
    input: GameEvent extends infer E
      ? E extends GameEvent
        ? Pick<E, 'eventType' | 'payload'>
        : never
      : never,
  ): GameEvent {
    const event = eventSchema.parse({
      ...input,
      contractVersion: CONTRACT_VERSION,
      eventId: crypto.randomUUID(),
      sequence: this.state.sequence + 1,
      occurredAt: new Date().toISOString(),
    });
    this.state.sequence = event.sequence;
    switch (event.eventType) {
      case 'SESSION_UPDATED':
        this.sessionExpired = event.payload.expired;
        break;
      case 'WORLD_ENTITY_UPDATED':
      case 'MOVEMENT_STARTED':
      case 'MOVEMENT_COMPLETED':
        this.state.world = this.state.world.map((e) =>
          e.id === event.payload.id ? event.payload : e,
        );
        break;
      case 'MINING_STARTED':
        this.state.mining.active = [
          ...this.state.mining.active.filter((a) => a.characterId !== event.payload.characterId),
          event.payload,
        ];
        break;
      case 'MINING_COMPLETED':
        this.state.mining = {
          active: this.state.mining.active.filter((a) => a.commandId !== event.payload.commandId),
          recentResults: [
            event.payload,
            ...this.state.mining.recentResults.filter(
              (r) => r.commandId !== event.payload.commandId,
            ),
          ].slice(0, 10),
        };
        break;
      case 'CHARACTER_UPDATED':
        this.state.characters = event.payload;
        break;
      case 'INVENTORY_UPDATED':
        this.state.inventory = event.payload;
        break;
      case 'MAIL_UPDATED':
        this.state.mail = event.payload;
        break;
      case 'MAIL_RECEIVED':
        this.state.mail = [event.payload, ...this.state.mail];
        break;
      case 'NOTICE_PUBLISHED':
        this.state.notices = [event.payload, ...this.state.notices];
        break;
      case 'CHAT_MESSAGE':
        this.state.chat = [...this.state.chat, event.payload].slice(-200);
        break;
      case 'COMMAND_STATUS':
        this.setCommandStatus(event.payload);
        break;
    }
    this.history.push(event);
    this.history = this.history.slice(-120);
    this.listeners.forEach((fn) => fn(structuredClone(event)));
    return event;
  }
  private setCommandStatus(status: GameSnapshot['commandStatuses'][number]) {
    this.state.commandStatuses = [
      ...this.state.commandStatuses.filter((s) => s.commandId !== status.commandId),
      status,
    ];
  }
  private validationError(command: GameCommand): string | undefined {
    if (
      !this.state.characters.activeRoster.includes(command.characterId) ||
      !this.state.characters.characterPool.some((c) => c.id === command.characterId)
    )
      return 'command.rejected';
    if (command.commandType === 'MAIL_CLAIM') {
      return this.state.mail.some(
        (m) => m.id === command.payload.mailId && Date.parse(m.expiresAt) > Date.now(),
      )
        ? undefined
        : 'command.rejected';
    }
    if (command.commandType === 'MAIL_CLAIM_ALL') return;
    const player = this.state.world.find((e) => e.id === 'player-1' && e.type === 'player');
    if (!player || command.characterId !== this.state.characters.mainParty[0])
      return 'command.rejected';
    const activity = this.activeActivity.get(player.id);
    const other = activity?.commandId !== command.commandId ? activity : undefined;
    if (command.commandType === 'MOVE') {
      if (command.payload.entityId !== player.id) return 'command.rejected';
      if (other) return 'command.busy';
      return;
    }
    const node = this.state.world.find((e) => e.id === command.payload.nodeId);
    if (!node || node.type !== 'resource' || node.interaction?.type !== 'mining')
      return 'mining.invalidNode';
    if (other?.type === 'mining') return 'mining.alreadyActive';
    if (
      other?.type === 'moving' ||
      (player.movement && Date.parse(player.movement.arrivesAt) > Date.now())
    )
      return 'command.busy';
    if (
      worldDistance(interpolate(player, Date.now()), interpolate(node, Date.now())) >
      node.interaction.range
    )
      return 'mining.tooFar';
  }
  async command(input: GameCommand): Promise<CommandReceipt> {
    const parsed = commandSchema.safeParse(input);
    // Keep malformed identities/versions as contract errors; valid MOVE bounds failures have a domain key.
    const boundsError =
      !parsed.success &&
      input.commandType === 'MOVE' &&
      parsed.error.issues.every(
        (i) => i.path[0] === 'payload' && ['x', 'y'].includes(String(i.path[1])),
      );
    if (!parsed.success && !boundsError) throw parsed.error;
    const command = parsed.success ? parsed.data : input;
    await this.wait();
    this.assertSession();
    const serialized = JSON.stringify(command),
      cached = this.commands.get(command.commandId);
    if (cached) {
      if (cached.serialized !== serialized) throw new Error('command.rejected');
      return structuredClone(cached.receipt);
    }
    const errorKey = boundsError ? 'world.outOfBounds' : this.validationError(command);
    const receipt: CommandReceipt = {
      contractVersion: CONTRACT_VERSION,
      commandId: command.commandId,
      status: errorKey ? 'FAILED' : 'ACCEPTED',
      ...(errorKey ? { errorKey } : {}),
    };
    this.commands.set(command.commandId, { serialized, receipt });
    this.setCommandStatus({ commandId: command.commandId, status: receipt.status, errorKey });
    if (!errorKey) {
      if (command.commandType === 'MOVE' || command.commandType === 'START_MINING')
        this.activeActivity.set('player-1', {
          type: command.commandType === 'MOVE' ? 'moving' : 'mining',
          commandId: command.commandId,
        });
      this.schedule(() => this.execute(command), 80);
    }
    return structuredClone(receipt);
  }
  private release(command: GameCommand) {
    if (this.activeActivity.get('player-1')?.commandId === command.commandId)
      this.activeActivity.delete('player-1');
  }
  private execute(command: GameCommand) {
    const errorKey = this.validationError(command);
    if (errorKey) {
      this.fail(command, errorKey);
      return;
    }
    const now = Date.now(),
      player = this.state.world.find((e) => e.id === 'player-1');
    let duration = 150;
    if (command.commandType === 'MOVE' && player) {
      const from = interpolate(player, now);
      duration = movementDurationMs(
        worldDistance(from, command.payload),
        player.moveSpeed ?? WORLD_CONFIG.movement.playerBaseSpeed,
      );
      this.publish({
        eventType: 'MOVEMENT_STARTED',
        payload: {
          ...player,
          ...from,
          status: 'moving',
          movement: {
            fromX: from.x,
            fromY: from.y,
            toX: command.payload.x,
            toY: command.payload.y,
            startedAt: new Date(now).toISOString(),
            arrivesAt: new Date(now + duration).toISOString(),
          },
        },
      });
    }
    if (command.commandType === 'START_MINING') {
      const node = this.state.world.find((e) => e.id === command.payload.nodeId)!;
      duration = node.interaction!.durationMs;
      this.publish({
        eventType: 'MINING_STARTED',
        payload: {
          commandId: command.commandId,
          characterId: command.characterId,
          nodeId: node.id,
          startedAt: new Date(now).toISOString(),
          completesAt: new Date(now + duration).toISOString(),
        },
      });
    }
    this.publish({
      eventType: 'COMMAND_STATUS',
      payload: {
        commandId: command.commandId,
        status: 'EXECUTING',
        completesAt: new Date(now + duration).toISOString(),
      },
    });
    this.schedule(() => {
      if (command.commandType === 'START_MINING') {
        const rewards = [{ itemId: 'copper', quantity: 3 }];
        this.publish({
          eventType: 'INVENTORY_UPDATED',
          payload: {
            ...this.state.inventory,
            items: this.state.inventory.items.map((i) =>
              i.id === 'copper' ? { ...i, quantity: i.quantity + 3 } : i,
            ),
          },
        });
        this.release(command);
        this.publish({
          eventType: 'MINING_COMPLETED',
          payload: {
            commandId: command.commandId,
            characterId: command.characterId,
            nodeId: command.payload.nodeId,
            completedAt: new Date().toISOString(),
            rewards,
          },
        });
        this.notify('mining.completed', command.commandId);
      }
      if (command.commandType === 'MAIL_CLAIM' || command.commandType === 'MAIL_CLAIM_ALL')
        this.claimMail(command);
      if (command.commandType === 'MOVE') {
        const entity = this.state.world.find((e) => e.id === command.payload.entityId);
        this.release(command);
        if (entity) {
          const completed: WorldEntityView = {
            ...entity,
            x: command.payload.x,
            y: command.payload.y,
            status: 'idle',
          };
          delete completed.movement;
          this.publish({ eventType: 'MOVEMENT_COMPLETED', payload: completed });
          this.notify('world.moveDone', command.commandId);
        }
      }
      this.publish({
        eventType: 'COMMAND_STATUS',
        payload: { commandId: command.commandId, status: 'SUCCEEDED' },
      });
    }, duration);
  }
  private claimMail(
    command: Extract<GameCommand, { commandType: 'MAIL_CLAIM' | 'MAIL_CLAIM_ALL' }>,
  ) {
    const ids =
      command.commandType === 'MAIL_CLAIM'
        ? [command.payload.mailId]
        : this.state.mail.map((m) => m.id);
    const eligible = this.state.mail.filter(
      (m) => ids.includes(m.id) && !m.claimed && Date.parse(m.expiresAt) > Date.now(),
    );
    if (!eligible.length) return;
    const eligibleIds = new Set(eligible.map((m) => m.id));
    this.publish({
      eventType: 'INVENTORY_UPDATED',
      payload: {
        ...this.state.inventory,
        gold: this.state.inventory.gold + eligible.reduce((total, m) => total + m.reward, 0),
      },
    });
    this.publish({
      eventType: 'MAIL_UPDATED',
      payload: this.state.mail.map((m) =>
        eligibleIds.has(m.id) ? { ...m, claimed: true, read: true } : m,
      ),
    });
    this.notify('mail.rewardDone', command.commandId);
  }
  private fail(command: GameCommand, errorKey = 'command.rejected') {
    this.release(command);
    this.publish({
      eventType: 'COMMAND_STATUS',
      payload: { commandId: command.commandId, status: 'FAILED', errorKey },
    });
  }
  private notify(titleKey: string, commandId?: string) {
    this.publish({
      eventType: 'NOTIFICATION_CREATED',
      payload: { titleKey, kind: 'success', commandId },
    });
  }
  private advanceWorld() {
    // Ambient creatures/caravans patrol. The player moves only on a MOVE command.
    this.state.world
      .filter((e) => ['monster-1', 'transport-1'].includes(e.id))
      .forEach((entity) => {
        if (!entity.movement || Date.parse(entity.movement.arrivesAt) > Date.now()) return;
        const m = entity.movement,
          position = interpolate(entity, Date.now());
        const duration = movementDurationMs(
          worldDistance(position, { x: m.fromX, y: m.fromY }),
          entity.moveSpeed ?? WORLD_CONFIG.movement.playerBaseSpeed,
        );
        this.publish({
          eventType: 'WORLD_ENTITY_UPDATED',
          payload: {
            ...entity,
            ...position,
            movement: {
              fromX: position.x,
              fromY: position.y,
              toX: m.fromX,
              toY: m.fromY,
              startedAt: new Date().toISOString(),
              arrivesAt: new Date(Date.now() + duration).toISOString(),
            },
          },
        });
      });
  }
  async chat(channel: ChatMessage['channel'], text: string, sender: string) {
    await this.wait();
    this.assertSession();
    if (channel === 'system' || !text.trim() || text.length > 500)
      throw new Error('command.rejected');
    this.publish({
      eventType: 'CHAT_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        channel,
        sender,
        text: text.trim(),
        sentAt: new Date().toISOString(),
        decoration: { style: channel === 'guild' ? 'guild' : 'normal' },
      },
    });
  }
  async readMail(id: string) {
    await this.wait();
    this.assertSession();
    this.publish({
      eventType: 'MAIL_UPDATED',
      payload: this.state.mail.map((m) => (m.id === id ? { ...m, read: true } : m)),
    });
  }
  async deleteMail(id: string) {
    await this.wait();
    this.assertSession();
    const mail = this.state.mail.find((m) => m.id === id);
    if (!mail || (!mail.claimed && mail.reward > 0 && Date.parse(mail.expiresAt) > Date.now()))
      throw new Error('command.rejected');
    this.publish({
      eventType: 'MAIL_UPDATED',
      payload: this.state.mail.filter((m) => m.id !== id),
    });
  }
}
