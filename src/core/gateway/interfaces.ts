import type {
  AreaSubscription,
  ChatMessage,
  CommandReceipt,
  GameCommand,
  GameEvent,
  GameSnapshot,
  Mail,
  Notice,
} from '../contracts';
export interface Session {
  accountId: string;
  nickname: string;
  email: string;
  verified: boolean;
}
export interface SignupInput {
  email: string;
  password: string;
  nickname: string;
  language: string;
  terms: boolean;
}
export interface AuthGateway {
  getSession(): Promise<Session | null>;
  login(email: string, password: string): Promise<Session>;
  signup(input: SignupInput): Promise<Session>;
  resetPassword(email: string): Promise<void>;
  verifyEmail(): Promise<Session>;
  logout(): Promise<void>;
}
export interface GameGateway {
  getSnapshot(): Promise<GameSnapshot>;
  sendCommand(command: GameCommand): Promise<CommandReceipt>;
}
export type ConnectionState =
  'connecting' | 'connected' | 'reconnecting' | 'recovering' | 'offline' | 'expired' | 'fatal';
export interface RealtimeGateway {
  connect(
    afterSequence: number,
    onEvent: (event: unknown) => void,
    onState: (state: ConnectionState) => void,
  ): Promise<{ replay: GameEvent[]; replayAvailable: boolean }>;
  disconnect(): void;
  subscribeArea(area: AreaSubscription): void;
}
export interface SocialGateway {
  getMail(): Promise<Mail[]>;
  getNotices(): Promise<Notice[]>;
  getChat(): Promise<ChatMessage[]>;
  sendChat(channel: ChatMessage['channel'], text: string, sender: string): Promise<void>;
  readMail(id: string): Promise<void>;
  deleteMail(id: string): Promise<void>;
}
