import { useSyncExternalStore } from 'react';
import type { Atom } from './atom';
export function useAtom<T>(atom: Atom<T>): T {
  return useSyncExternalStore(atom.subscribe, atom.get, atom.get);
}
