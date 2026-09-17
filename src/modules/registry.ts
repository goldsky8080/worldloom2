import type { ComponentType } from 'react';
import type { AssetDefinition } from '../assets/manifest/framework';
import { featureFlags, type FeatureFlagService } from '../services/featureFlags';
export interface PanelProps {
  payload?: unknown;
}
export interface PanelDefinition {
  id: string;
  titleKey: string;
  component: ComponentType<PanelProps>;
  singleton?: boolean;
}
export interface GameMenuItem {
  id: string;
  categoryId: string;
  titleKey: string;
  iconAssetId: string;
  order: number;
  target: { type: 'panel' | 'route' | 'modal'; id: string };
  badgeSource?: 'mail' | 'notifications';
  featureFlag?: string;
  unlockRule?: string;
  visible?: boolean;
  enabled?: boolean;
  platforms?: Array<'web' | 'mobile'>;
}
export interface RouteDefinition {
  path: string;
  component: ComponentType;
}
export interface GameModuleDefinition {
  id: string;
  version: string;
  routes?: RouteDefinition[];
  panels?: PanelDefinition[];
  menuItems?: GameMenuItem[];
  eventHandlers?: { eventType: string; handler: (event: unknown) => void }[];
  assets?: AssetDefinition[];
  localizationNamespaces?: string[];
  featureFlag?: string;
}
export const menuCategories = ['world', 'life', 'battle', 'economy', 'social', 'system'] as const;
export class MenuRegistry {
  private items = new Map<string, GameMenuItem>();
  private unlocks = new Map<string, () => boolean>();
  constructor(private flags: FeatureFlagService = featureFlags) {}
  register(item: GameMenuItem) {
    if (this.items.has(item.id)) throw new Error('Duplicate menu: ' + item.id);
    this.items.set(item.id, item);
  }
  registerUnlock(id: string, evaluate: () => boolean) {
    this.unlocks.set(id, evaluate);
  }
  list(categoryId: string, platform: 'web' | 'mobile' = 'web') {
    return [...this.items.values()]
      .filter(
        (i) =>
          i.categoryId === categoryId &&
          i.visible !== false &&
          this.flags.enabled(i.featureFlag) &&
          (!i.platforms || i.platforms.includes(platform)),
      )
      .sort((a, b) => a.order - b.order);
  }
  isEnabled(item: GameMenuItem) {
    return (
      item.enabled !== false && (!item.unlockRule || this.unlocks.get(item.unlockRule)?.() === true)
    );
  }
  has(id: string) {
    return this.items.has(id);
  }
}
export class ModuleRegistry {
  private modules = new Map<string, GameModuleDefinition>();
  private panels = new Map<string, PanelDefinition>();
  menus = new MenuRegistry();
  register(module: GameModuleDefinition) {
    if (this.modules.has(module.id)) throw new Error('Duplicate module: ' + module.id);
    if (!featureFlags.enabled(module.featureFlag)) return;
    const menuIds = module.menuItems?.map((m) => m.id) ?? [],
      panelIds = module.panels?.map((p) => p.id) ?? [];
    if (
      new Set(menuIds).size !== menuIds.length ||
      new Set(panelIds).size !== panelIds.length ||
      menuIds.some((i) => this.menus.has(i)) ||
      panelIds.some((i) => this.panels.has(i))
    )
      throw new Error('Duplicate module registration');
    for (const menu of module.menuItems ?? []) {
      if (!menuCategories.includes(menu.categoryId as (typeof menuCategories)[number]))
        throw new Error('Unknown category');
      if (
        (menu.target.type === 'panel' || menu.target.type === 'modal') &&
        !this.panels.has(menu.target.id) &&
        !panelIds.includes(menu.target.id)
      )
        throw new Error('Unknown panel target');
    }
    this.modules.set(module.id, module);
    module.panels?.forEach((panel) => this.panels.set(panel.id, panel));
    module.menuItems?.forEach((item) => this.menus.register(item));
  }
  panel(id: string) {
    const panel = this.panels.get(id);
    if (!panel) throw new Error('Unknown panel: ' + id);
    return panel;
  }
  all() {
    return [...this.modules.values()];
  }
}
export const moduleRegistry = new ModuleRegistry();
