export interface UiEvents {
  'panel.open': { id: string };
  'panel.close': { id: string };
  'entity.selected': { id: string };
  'settings.changed': undefined;
  'notification.open': undefined;
  'mail.received': { id: string };
}
export class UiEventBus {
  private listeners = new Map<keyof UiEvents, Set<(payload: never) => void>>();
  on<K extends keyof UiEvents>(name: K, handler: (payload: UiEvents[K]) => void) {
    const group = this.listeners.get(name) ?? new Set();
    group.add(handler as (payload: never) => void);
    this.listeners.set(name, group);
    return () => {
      group.delete(handler as (payload: never) => void);
    };
  }
  emit<K extends keyof UiEvents>(name: K, payload: UiEvents[K]) {
    this.listeners.get(name)?.forEach((fn) => fn(payload as never));
  }
}
export const uiEvents = new UiEventBus();
