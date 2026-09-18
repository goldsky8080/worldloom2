import { moduleRegistry, type GameMenuItem, type PanelDefinition } from './registry';
import { frameworkAssets } from '../assets/manifest/framework';
import { assetManager } from '../services/assets/AssetManager';
import { CharacterPanel } from './character/CharacterPanel';
import { StoragePanel } from './storage/StoragePanel';
import { InventoryPanel } from './inventory/InventoryPanel';
import { EntityPanel } from './world/EntityPanel';
import { MailPanel } from './mail/MailPanel';
import { NoticePanel } from './notice/NoticePanel';
import { SettingsPanel } from './settings/SettingsPanel';
import { AccountPanel } from './account/AccountPanel';
import { NotificationPanel } from './notification/NotificationPanel';
import { AtlasModule } from './atlas/AtlasModule';
import { FiefModule } from './fief/FiefModule';
import { previewAtlases, previewFrameAssets } from '../services/assets/atlas';
import { MiningModule } from './mining/MiningModule';
import { runtime } from '../app/bootstrap/services';
import { EmptyState } from '../ui/components';
import { useTranslation } from '../services/localization';
function PlaceholderPanel() {
  const { t } = useTranslation();
  return <EmptyState title={t('common.placeholder')} description={t('common.placeholderHint')} />;
}
function menu(
  categoryId: string,
  name: string,
  order: number,
  options: Partial<GameMenuItem> = {},
): GameMenuItem {
  return {
    id: categoryId + '.' + name,
    categoryId,
    titleKey: 'menu.' + name,
    iconAssetId: 'framework.menu.' + name,
    order,
    target: { type: 'panel', id: name },
    ...options,
  };
}
const panel = (
  id: string,
  component: PanelDefinition['component'],
  titleKey = 'menu.' + id,
): PanelDefinition => ({ id, titleKey, component });
export function registerModules() {
  if (moduleRegistry.all().length) return;
  assetManager.register(frameworkAssets);
  assetManager.registerAtlases(previewAtlases, previewFrameAssets);
  moduleRegistry.register(AtlasModule);
  moduleRegistry.register(FiefModule);
  moduleRegistry.register({
    id: 'world',
    version: '0.1.0',
    localizationNamespaces: ['world'],
    panels: [panel('entity', EntityPanel, 'world.entity')],
    menuItems: [menu('world', 'map', 10, { target: { type: 'route', id: '/game' } })],
  });
  moduleRegistry.register({
    id: 'character',
    version: '0.1.0',
    localizationNamespaces: ['character'],
    panels: [panel('character', CharacterPanel)],
    menuItems: [menu('world', 'character', 20)],
  });
  moduleRegistry.register({
    id: 'inventory',
    version: '0.1.0',
    localizationNamespaces: ['inventory'],
    panels: [panel('inventory', InventoryPanel)],
    menuItems: [menu('economy', 'inventory', 10)],
  });
  moduleRegistry.register({
    id: 'storage',
    version: '0.4.0',
    localizationNamespaces: ['storage'],
    panels: [panel('storage', StoragePanel)],
    menuItems: [menu('economy', 'storage', 30, { iconAssetId: 'framework.menu.market' })],
  });
  moduleRegistry.register({
    id: 'market',
    version: '0.1.0',
    panels: [panel('market', PlaceholderPanel)],
    menuItems: [menu('economy', 'market', 20)],
  });
  moduleRegistry.register({
    id: 'battle',
    version: '0.1.0',
    panels: [panel('combat', PlaceholderPanel)],
    menuItems: [menu('battle', 'combat', 10)],
  });
  moduleRegistry.register({
    id: 'social',
    version: '0.1.0',
    localizationNamespaces: ['chat', 'mail', 'notice'],
    panels: [
      panel('chat', PlaceholderPanel),
      panel('mail', MailPanel),
      panel('notice', NoticePanel),
      panel('guild', PlaceholderPanel),
    ],
    menuItems: [
      menu('social', 'chat', 10),
      menu('social', 'mail', 20, { badgeSource: 'mail', featureFlag: 'MAIL_ENABLED' }),
      menu('social', 'notice', 30),
      menu('social', 'guild', 40, { enabled: false }),
    ],
  });
  moduleRegistry.register({
    id: 'system',
    version: '0.1.0',
    localizationNamespaces: ['settings', 'auth'],
    panels: [
      panel('settings', SettingsPanel),
      panel('account', AccountPanel),
      panel('notifications', NotificationPanel),
    ],
    menuItems: [
      menu('system', 'settings', 10),
      menu('system', 'account', 20),
      menu('system', 'notifications', 30, { badgeSource: 'notifications' }),
    ],
  });
  moduleRegistry.register(MiningModule);
  for (const module of moduleRegistry.all()) {
    if (module.assets) assetManager.register(module.assets);
    module.eventHandlers?.forEach((subscription) =>
      runtime.onGameEvent(subscription.eventType, subscription.handler),
    );
  }
}
