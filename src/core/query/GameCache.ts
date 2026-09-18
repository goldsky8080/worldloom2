import { emptyStorage } from '../storage/schema';
import { Atom } from '../state/atom';
import type {
  Characters,
  ChatMessage,
  GameSnapshot,
  Inventory,
  Mail,
  MiningState,
  Notice,
  WorldEntityView,
} from '../contracts';
/** Separate query resources. An entity event does not render the inventory or entire shell. */
export class GameCache {
  world = new Atom<WorldEntityView[]>([]);
  characters = new Atom<Characters>({ characterPool: [], activeRoster: [], mainParty: [] });
  inventory = new Atom<Inventory>({ gold: 0, items: [] });
  storage = new Atom(emptyStorage());
  mail = new Atom<Mail[]>([]);
  notices = new Atom<Notice[]>([]);
  chat = new Atom<ChatMessage[]>([]);
  mining = new Atom<MiningState>({ active: [], recentResults: [] });
  valid = new Atom(false);
  hydrate(snapshot: GameSnapshot) {
    this.world.set(snapshot.world);
    this.mining.set(snapshot.mining);
    this.characters.set(snapshot.characters);
    this.inventory.set(snapshot.inventory);
    this.storage.set(snapshot.storage);
    this.mail.set(snapshot.mail);
    this.notices.set(snapshot.notices);
    this.chat.set(snapshot.chat);
    this.valid.set(true);
  }
  invalidate() {
    this.valid.set(false);
  }
  clear() {
    this.world.set([]);
    this.mining.set({ active: [], recentResults: [] });
    this.chat.set([]);
    this.mail.set([]);
    this.notices.set([]);
    this.characters.set({ characterPool: [], activeRoster: [], mainParty: [] });
    this.inventory.set({ gold: 0, items: [] });
    this.storage.set(emptyStorage());
    this.invalidate();
  }
}
