import { MockAuthGateway } from '../../mocks/gateways/MockAuthGateway';
import { MockWorldServer } from '../../mocks/gateways/MockWorldServer';
import { MockGameGateway, MockRealtimeGateway, MockSocialGateway } from '../../mocks/gateways';
import { GameRuntime } from '../../core/event/GameRuntime';
import { Atom } from '../../core/state/atom';
import type { Session } from '../../core/gateway/interfaces';
export const authGateway = new MockAuthGateway(() => mockServer.restoreSession());
export const mockServer = new MockWorldServer();
export const gameGateway = new MockGameGateway(mockServer);
export const realtimeGateway = new MockRealtimeGateway(mockServer);
export const socialGateway = new MockSocialGateway(mockServer);
export const runtime = new GameRuntime(gameGateway, realtimeGateway);
export const session = new Atom<Session | null>(null);
export const debugEnabled = import.meta.env.DEV && import.meta.env.VITE_DEBUG !== 'false';
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    runtime.stop();
    mockServer.stop();
  });
