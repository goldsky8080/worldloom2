import { Atom } from '../../core/state/atom';
import { uiEvents } from '../../core/ui-events/UiEventBus';
export interface OpenPanel {
  id: string;
  moduleId: string;
  panelType: string;
  instanceKey?: string;
  mode: 'floating' | 'docked' | 'fullscreen';
  payload?: unknown;
  minimized: boolean;
  modal: boolean;
}
export class PanelManager {
  panels = new Atom<OpenPanel[]>([]);
  open(
    panelType: string,
    options: {
      moduleId?: string;
      singleton?: boolean;
      instanceKey?: string;
      payload?: unknown;
      mode?: OpenPanel['mode'];
      modal?: boolean;
    } = {},
  ) {
    const existing = this.panels
      .get()
      .find(
        (p) =>
          p.panelType === panelType &&
          (options.singleton !== false ||
            (p.instanceKey === options.instanceKey && options.instanceKey !== undefined)),
      );
    if (existing) {
      this.panels.update((list) => [
        ...list.filter((p) => p.id !== existing.id),
        { ...existing, minimized: false, payload: options.payload ?? existing.payload },
      ]);
      return existing.id;
    }
    const panel: OpenPanel = {
      id: crypto.randomUUID(),
      moduleId: options.moduleId ?? panelType,
      panelType,
      mode: options.mode ?? 'floating',
      minimized: false,
      modal: options.modal ?? false,
      payload: options.payload,
      instanceKey: options.instanceKey,
    };
    this.panels.update((list) => [...list, panel]);
    uiEvents.emit('panel.open', { id: panel.id });
    return panel.id;
  }
  close(id: string) {
    this.panels.update((list) => list.filter((p) => p.id !== id));
    uiEvents.emit('panel.close', { id });
  }
  focus(id: string) {
    this.panels.update((list) => {
      const panel = list.find((p) => p.id === id);
      return panel ? [...list.filter((p) => p.id !== id), { ...panel, minimized: false }] : list;
    });
  }
  minimize(id: string) {
    this.panels.update((list) => list.map((p) => (p.id === id ? { ...p, minimized: true } : p)));
  }
  mode(id: string, mode: OpenPanel['mode']) {
    this.panels.update((list) => list.map((p) => (p.id === id ? { ...p, mode } : p)));
  }
  back() {
    const top = this.panels
      .get()
      .filter((p) => !p.minimized)
      .at(-1);
    if (top) this.close(top.id);
  }
  clear() {
    this.panels.set([]);
  }
}
export const panelManager = new PanelManager();
