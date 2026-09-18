import { Atom } from '../state/atom';
import {
  eventSchema,
  receiptSchema,
  snapshotSchema,
  type GameCommand,
  type GameEvent,
  type CommandStatus,
} from '../contracts';
import type { GameGateway, RealtimeGateway, ConnectionState } from '../gateway/interfaces';
import { GameCache } from '../query/GameCache';
import { SequenceTracker } from '../recovery/SequenceTracker';
import { timeService } from '../../services/time/TimeService';
import { notifications } from '../../services/notification';
import { uiEvents } from '../ui-events/UiEventBus';
export interface TrackedCommand {
  commandId: string;
  commandType?: GameCommand['commandType'];
  characterId?: string;
  status: CommandStatus;
  completesAt?: string;
  errorKey?: string;
}
export class GameRuntime {
  cache = new GameCache();
  connection = new Atom<ConnectionState>('offline');
  commands = new Atom<Record<string, TrackedCommand>>({});
  sequence = new Atom(0);
  lastError = new Atom<string | null>(null);
  private tracker = new SequenceTracker();
  private buffering = true;
  private buffer: unknown[] = [];
  private recovery?: Promise<void>;
  private epoch = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private retryAttempt = 0;
  private active = false;
  private handlers = new Map<string, Set<(event: GameEvent) => void>>();
  onGameEvent(eventType: string, handler: (event: GameEvent) => void) {
    const group = this.handlers.get(eventType) ?? new Set();
    group.add(handler);
    this.handlers.set(eventType, group);
    return () => {
      group.delete(handler);
    };
  }
  private visibility = () => {
    if (!document.hidden && this.active && this.connection.get() === 'connected')
      void this.recover();
  };
  constructor(
    private game: GameGateway,
    private realtime: RealtimeGateway,
  ) {}
  async start() {
    document.addEventListener('visibilitychange', this.visibility);
    this.active = true;
    const epoch = ++this.epoch;
    this.buffering = true;
    this.buffer = [];
    this.connection.set('connecting');
    this.lastError.set(null);
    timeService.start();
    try {
      await this.snapshot(epoch);
      if (epoch !== this.epoch) return;
      await this.attach(epoch);
      this.lastError.set(null);
      this.retryAttempt = 0;
    } catch (error) {
      if (epoch === this.epoch) this.handleError(error);
    }
  }
  private async snapshot(epoch: number) {
    this.cache.invalidate();
    const started = Date.now();
    const snapshot = snapshotSchema.parse(await this.game.getSnapshot());
    if (epoch !== this.epoch || !this.active) return;
    timeService.sync(snapshot.serverTime, started, Date.now());
    this.cache.hydrate(snapshot);
    this.tracker.commit(snapshot.sequence);
    this.sequence.set(snapshot.sequence);
    this.commands.update((commands) => ({
      ...commands,
      ...Object.fromEntries(
        snapshot.commandStatuses.map((s) => [s.commandId, { ...commands[s.commandId], ...s }]),
      ),
    }));
  }
  private async attach(epoch: number) {
    this.buffering = true;
    const replay = await this.realtime.connect(
      this.tracker.last,
      (value) => {
        if (epoch === this.epoch && this.active) this.receive(value);
      },
      (state) => {
        if (epoch !== this.epoch || !this.active || this.connection.get() === 'expired') return;
        if (state === 'reconnecting' || state === 'offline') {
          this.connection.set(state);
          this.scheduleReconnect();
        }
      },
    );
    if (epoch !== this.epoch || !this.active) return;
    if (!replay.replayAvailable) await this.snapshot(epoch);
    if (epoch !== this.epoch || !this.active) return;
    this.buffer.push(...replay.replay);
    this.drain();
    if (!this.recovery && this.cache.valid.get() && this.connection.get() !== 'expired') {
      this.connection.set('connected');
      this.retryAttempt = 0;
    }
  }
  private receive(value: unknown) {
    if (this.connection.get() === 'expired') return;
    if (this.buffering) {
      this.buffer.push(value);
      return;
    }
    const parsed = eventSchema.safeParse(value);
    if (!parsed.success) {
      if (import.meta.env.DEV)
        console.warn(
          'Invalid transport event',
          parsed.error.issues.map((i) => i.path),
        );
      this.lastError.set('common.error');
      void this.recover();
      return;
    }
    const decision = this.tracker.inspect(parsed.data.sequence);
    if (decision === 'duplicate') return;
    if (decision === 'gap') {
      this.buffer.push(value);
      void this.recover();
      return;
    }
    this.apply(parsed.data);
    this.handlers.get(parsed.data.eventType)?.forEach((handler) => {
      try {
        handler(parsed.data);
      } catch {
        if (import.meta.env.DEV)
          console.error('Module event handler failed', parsed.data.eventType);
      }
    });
    this.tracker.commit(parsed.data.sequence);
    this.sequence.set(parsed.data.sequence);
  }
  private drain() {
    const queued = this.buffer;
    this.buffer = [];
    this.buffering = false;
    queued
      .sort(
        (a, b) =>
          (eventSchema.safeParse(a).data?.sequence ?? 0) -
          (eventSchema.safeParse(b).data?.sequence ?? 0),
      )
      .forEach((value) => this.receive(value));
  }
  recover(): Promise<void> {
    if (!this.active || this.connection.get() === 'expired') return Promise.resolve();
    if (this.recovery) return this.recovery;
    this.connection.set('recovering');
    this.buffering = true;
    const epoch = this.epoch;
    const operation = this.snapshot(epoch)
      .then(() => {
        if (epoch !== this.epoch || !this.active) return;
        this.lastError.set(null);
        this.drain();
        if (this.connection.get() !== 'expired' && !this.buffer.length) {
          this.connection.set('connected');
          this.retryAttempt = 0;
        }
        notifications.add('network.recovered', 'info');
      })
      .catch((error) => {
        if (epoch === this.epoch) this.handleError(error);
      })
      .finally(() => {
        if (this.recovery === operation) {
          this.recovery = undefined;
          if (
            this.active &&
            this.connection.get() === 'recovering' &&
            this.buffer.length &&
            epoch === this.epoch
          )
            void this.recover();
        }
      });
    this.recovery = operation;
    return operation;
  }
  private apply(event: GameEvent) {
    switch (event.eventType) {
      case 'WORLD_ENTITY_UPDATED':
      case 'MOVEMENT_STARTED':
      case 'MOVEMENT_COMPLETED':
        this.cache.world.update((world) =>
          world.some((e) => e.id === event.payload.id)
            ? world.map((e) => (e.id === event.payload.id ? event.payload : e))
            : [...world, event.payload],
        );
        break;
      case 'MINING_STARTED':
        this.cache.mining.update((state) => ({
          ...state,
          active: [
            ...state.active.filter((a) => a.characterId !== event.payload.characterId),
            event.payload,
          ],
        }));
        break;
      case 'MINING_CANCELLED':
        this.cache.mining.update((s) => ({
          ...s,
          active: s.active.filter((a) => a.commandId !== event.payload.commandId),
        }));
        break;
      case 'MINING_COMPLETED':
        this.cache.mining.update((state) => ({
          active: state.active.filter((a) => a.commandId !== event.payload.commandId),
          recentResults: [
            event.payload,
            ...state.recentResults.filter((r) => r.commandId !== event.payload.commandId),
          ].slice(0, 10),
        }));
        break;
      case 'CHARACTER_UPDATED':
        this.cache.characters.set(event.payload);
        break;
      case 'STORAGE_UPDATED':
        this.cache.storage.set(event.payload);
        break;
      case 'INVENTORY_UPDATED':
        this.cache.inventory.set(event.payload);
        break;
      case 'MAIL_UPDATED':
        this.cache.mail.set(event.payload);
        break;
      case 'MAIL_RECEIVED':
        this.cache.mail.update((mail) => [
          event.payload,
          ...mail.filter((m) => m.id !== event.payload.id),
        ]);
        uiEvents.emit('mail.received', { id: event.payload.id });
        notifications.add('mail.received');
        break;
      case 'NOTICE_PUBLISHED':
        this.cache.notices.update((list) => [
          event.payload,
          ...list.filter((n) => n.id !== event.payload.id),
        ]);
        break;
      case 'CHAT_MESSAGE':
        this.cache.chat.update((list) => [...list, event.payload].slice(-200));
        break;
      case 'NOTIFICATION_CREATED':
        notifications.add(
          event.payload.titleKey,
          event.payload.kind,
          event.payload.kind === 'danger',
        );
        break;
      case 'COMMAND_STATUS':
        this.commands.update((commands) => ({
          ...commands,
          [event.payload.commandId]: { ...commands[event.payload.commandId], ...event.payload },
        }));
        break;
      case 'SESSION_UPDATED':
        if (event.payload.expired) {
          this.connection.set('expired');
          clearTimeout(this.reconnectTimer);
          this.realtime.disconnect();
        }
        break;
    }
  }
  async send(command: GameCommand) {
    if (this.connection.get() !== 'connected' || !this.cache.valid.get())
      throw new Error('command.offline');
    const epoch = this.epoch;
    this.commands.update((commands) => {
      const current = commands[command.commandId];
      // Resending an ID must not regress an authoritative terminal/executing status.
      if (current && !['REQUESTED', 'FAILED'].includes(current.status)) return commands;
      return {
        ...commands,
        [command.commandId]: {
          commandId: command.commandId,
          commandType: command.commandType,
          characterId: command.characterId,
          status: 'REQUESTED',
        },
      };
    });
    try {
      const receipt = receiptSchema.parse(await this.game.sendCommand(command));
      if (receipt.commandId !== command.commandId) throw new Error('command.rejected');
      if (epoch !== this.epoch) return receipt;
      this.commands.update((commands) => {
        const current = commands[command.commandId];
        return current?.status === 'REQUESTED'
          ? {
              ...commands,
              [command.commandId]: {
                ...current,
                status: receipt.status,
                errorKey: receipt.errorKey,
              },
            }
          : commands;
      });
      return receipt;
    } catch (error) {
      if (epoch === this.epoch) {
        this.commands.update((commands) =>
          commands[command.commandId]?.status === 'SUCCEEDED'
            ? commands
            : {
                ...commands,
                [command.commandId]: {
                  ...commands[command.commandId],
                  commandId: command.commandId,
                  status: 'FAILED',
                  errorKey: error instanceof Error ? error.message : 'common.error',
                },
              },
        );
        if (error instanceof Error && error.message === 'auth.expired') this.handleError(error);
      }
      throw error;
    }
  }
  private handleError(error: unknown) {
    if (error instanceof Error && error.message === 'auth.expired') {
      this.connection.set('expired');
      this.lastError.set('auth.expired');
      this.realtime.disconnect();
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    } else {
      this.connection.set('offline');
      this.lastError.set('common.error');
      this.scheduleReconnect();
    }
  }
  private scheduleReconnect() {
    if (!this.active || this.connection.get() === 'expired' || this.reconnectTimer) return;
    const delay = Math.min(15000, 3000 * 2 ** this.retryAttempt++);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.reconnect();
    }, delay);
  }
  async reconnect() {
    if (!this.active || this.connection.get() === 'expired') return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    const epoch = ++this.epoch;
    this.buffering = true;
    this.buffer = [];
    this.connection.set('reconnecting');
    try {
      await this.attach(epoch);
      if (epoch === this.epoch && !this.cache.valid.get()) await this.recover();
    } catch (error) {
      if (epoch === this.epoch) this.handleError(error);
    }
  }
  stop() {
    document.removeEventListener('visibilitychange', this.visibility);
    this.active = false;
    this.epoch++;
    this.realtime.disconnect();
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.buffer = [];
    this.buffering = true;
    this.recovery = undefined;
    this.cache.clear();
    this.commands.set({});
    this.connection.set('offline');
    timeService.stop();
  }
}
