import type { GameGateway, RealtimeGateway, AuthGateway, SocialGateway } from './interfaces';
import { snapshotSchema, receiptSchema, commandSchema } from '../contracts';
/** Opt-in transport adapter, unused by the mock demo. Backend must implement this contract. */
export class HttpGameGateway implements GameGateway {
  constructor(private baseUrl: string) {}
  private async request(path: string, init?: RequestInit) {
    const response = await fetch(this.baseUrl + path, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    if (response.status === 401) throw new Error('auth.expired');
    if (!response.ok) throw new Error('common.error');
    return response.json() as Promise<unknown>;
  }
  async getSnapshot() {
    return snapshotSchema.parse(await this.request('/game/snapshot'));
  }
  async sendCommand(command: Parameters<GameGateway['sendCommand']>[0]) {
    return receiptSchema.parse(
      await this.request('/game/commands', {
        method: 'POST',
        body: JSON.stringify(commandSchema.parse(command)),
      }),
    );
  }
}
const unavailable = (): never => {
  throw new Error('Real backend adapter is a skeleton; use mock mode.');
};
export class WebSocketRealtimeGateway implements RealtimeGateway {
  connect: RealtimeGateway['connect'] = async () => unavailable();
  disconnect() {}
  subscribeArea: RealtimeGateway['subscribeArea'] = () => unavailable();
}
export class RealAuthGateway implements AuthGateway {
  getSession: AuthGateway['getSession'] = async () => unavailable();
  login: AuthGateway['login'] = async () => unavailable();
  signup: AuthGateway['signup'] = async () => unavailable();
  resetPassword: AuthGateway['resetPassword'] = async () => unavailable();
  verifyEmail: AuthGateway['verifyEmail'] = async () => unavailable();
  logout: AuthGateway['logout'] = async () => unavailable();
}
export class RealSocialGateway implements SocialGateway {
  getMail: SocialGateway['getMail'] = async () => unavailable();
  getNotices: SocialGateway['getNotices'] = async () => unavailable();
  getChat: SocialGateway['getChat'] = async () => unavailable();
  sendChat: SocialGateway['sendChat'] = async () => unavailable();
  readMail: SocialGateway['readMail'] = async () => unavailable();
  deleteMail: SocialGateway['deleteMail'] = async () => unavailable();
}
