import { Atom } from '../../core/state/atom';
import { audioService } from '../audio/AudioService';
import { settings } from '../settings';
export interface NotificationEntry {
  id: string;
  titleKey: string;
  kind: 'info' | 'success' | 'danger';
  createdAt: number;
  read: boolean;
  toastUntil: number;
  critical: boolean;
}
export class NotificationService {
  entries = new Atom<NotificationEntry[]>([]);
  add(titleKey: string, kind: NotificationEntry['kind'] = 'info', critical = false) {
    const channel = titleKey.startsWith('mining.')
      ? 'mining'
      : titleKey.startsWith('mail.')
        ? 'mail'
        : titleKey.startsWith('world.move')
          ? 'transport'
          : undefined;
    const shouldToast = !channel || settings.get().notifications[channel];
    const now = Date.now();
    this.entries.update((entries) =>
      [
        {
          id: crypto.randomUUID(),
          titleKey,
          kind,
          createdAt: now,
          read: false,
          toastUntil: shouldToast ? now + 4500 : 0,
          critical,
        },
        ...entries,
      ].slice(0, 100),
    );
    if (shouldToast) audioService.playSfx('notification.' + (channel ?? 'info'));
  }
  dismiss(id: string) {
    this.entries.update((list) =>
      list.map((n) => (n.id === id ? { ...n, toastUntil: 0, critical: false } : n)),
    );
  }
  markAllRead() {
    this.entries.update((list) => list.map((n) => ({ ...n, read: true })));
  }
}
export const notifications = new NotificationService();
