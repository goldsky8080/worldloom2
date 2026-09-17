import type { GameModuleDefinition } from '../registry';
import { MiningPanel } from './MiningPanel';
export const MiningModule: GameModuleDefinition = {
  id: 'mining',
  version: '0.2.0',
  featureFlag: 'MINING_ENABLED',
  localizationNamespaces: ['mining'],
  assets: [
    {
      id: 'mining.vein',
      path: '/assets/content/locations/copper-vein.webp',
      fallback: '/assets/placeholders/item-copper.svg',
      aspectRatio: '1/1',
      recommendedSize: [512, 512],
      group: 'module',
    },
  ],
  panels: [{ id: 'mining', titleKey: 'menu.mining', component: MiningPanel }],
  menuItems: [
    {
      id: 'life.mining',
      categoryId: 'life',
      titleKey: 'menu.mining',
      iconAssetId: 'framework.menu.mining',
      order: 10,
      target: { type: 'panel', id: 'mining' },
      featureFlag: 'MINING_ENABLED',
    },
  ],
};
