import { Atom } from '../core/state/atom';
import type { ChatMessage } from '../core/contracts';
export const selectedMenu = new Atom<string | null>(null);
export const selectedEntity = new Atom<string | null>('player-1');
export const chatUi = new Atom<{
  channel: ChatMessage['channel'];
  minimized: boolean;
  seen: Record<ChatMessage['channel'], string[]>;
}>({
  channel: 'global',
  minimized: window.matchMedia?.('(max-width: 700px)').matches ?? false,
  seen: { global: [], region: [], guild: [], system: [] },
});
export const worldDebug = new Atom({ grid: false, aoi: false, visible: 0, chunks: 0, fps: 0 });
export const debugVisible = new Atom(false);
