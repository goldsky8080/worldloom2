import {
  snapshotSchema,
  receiptSchema,
  eventSchema,
  mailSchema,
  noticeSchema,
  chatSchema,
  type AreaSubscription,
} from '../../core/contracts';
import type {
  GameGateway,
  RealtimeGateway,
  SocialGateway,
  ConnectionState,
} from '../../core/gateway/interfaces';
import { MockWorldServer } from './MockWorldServer';
export class MockGameGateway implements GameGateway {
  constructor(private server: MockWorldServer) {}
  async getSnapshot() {
    return snapshotSchema.parse(await this.server.snapshot());
  }
  async sendCommand(command: Parameters<GameGateway['sendCommand']>[0]) {
    return receiptSchema.parse(await this.server.command(command));
  }
}
export class MockRealtimeGateway implements RealtimeGateway {
  private unsubscribe?: () => void;
  private skipNext = false;
  area?: AreaSubscription;
  private onState?: (state: ConnectionState) => void;
  constructor(private server: MockWorldServer) {}
  async connect(
    afterSequence: number,
    onEvent: (event: unknown) => void,
    onState: (state: ConnectionState) => void,
  ) {
    if (this.server.sessionExpired) throw new Error('auth.expired');
    this.disconnect();
    this.onState = onState;
    onState('connecting');
    this.unsubscribe = this.server.listen((event) => {
      if (this.skipNext) {
        this.skipNext = false;
        return;
      }
      onEvent(event);
    });
    const replay = this.server.replay(afterSequence);
    onState('connected');
    return { ...replay, replay: replay.replay.map((e) => eventSchema.parse(e)) };
  }
  disconnect() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }
  simulateDisconnect() {
    this.disconnect();
    this.onState?.('reconnecting');
  }
  injectGap() {
    this.skipNext = true;
    this.server.publish({
      eventType: 'NOTIFICATION_CREATED',
      payload: { titleKey: 'network.recovered', kind: 'info' },
    });
    this.server.publish({
      eventType: 'NOTIFICATION_CREATED',
      payload: { titleKey: 'network.recovered', kind: 'info' },
    });
  }
  subscribeArea(area: AreaSubscription) {
    this.area = { ...area };
  }
}
export class MockSocialGateway implements SocialGateway {
  constructor(private server: MockWorldServer) {}
  async getMail() {
    return mailSchema.array().parse((await this.server.snapshot()).mail);
  }
  async getNotices() {
    return noticeSchema.array().parse((await this.server.snapshot()).notices);
  }
  async getChat() {
    return chatSchema.array().parse((await this.server.snapshot()).chat);
  }
  sendChat: SocialGateway['sendChat'] = (channel, text, sender) =>
    this.server.chat(channel, text, sender);
  readMail = (id: string) => this.server.readMail(id);
  deleteMail = (id: string) => this.server.deleteMail(id);
}
