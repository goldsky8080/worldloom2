export interface AssetDefinition {
  id: string;
  path: string;
  fallback: string;
  aspectRatio: string;
  recommendedSize: [number, number];
  group: 'core' | 'login' | 'shell' | 'module' | 'optional';
  themes?: Record<string, string>;
  spriteSheet?: { atlas: string; frame: string };
  nineSlice?: [number, number, number, number];
}
const icon = (name: string): AssetDefinition => ({
  id: 'framework.menu.' + name,
  path: '/assets/framework/menu-icons/' + name + '.webp',
  fallback: '/assets/placeholders/menu-' + name + '.svg',
  aspectRatio: '1/1',
  recommendedSize: [256, 256],
  group: 'shell',
});
const marker = (name: string): AssetDefinition => ({
  id: 'framework.marker.' + name,
  path: '/assets/framework/map-markers/' + name + '.webp',
  fallback: '/assets/placeholders/marker-' + name + '.svg',
  aspectRatio: '1/1',
  recommendedSize: [64, 64],
  group: 'module',
});
export const frameworkAssets: AssetDefinition[] = [
  {
    id: 'framework.background.login',
    path: '/assets/framework/backgrounds/login.webp',
    fallback: '/assets/placeholders/background-16x9.svg',
    aspectRatio: '16/9',
    recommendedSize: [1920, 1080],
    group: 'login',
  },
  {
    id: 'framework.frame.panel',
    path: '/assets/framework/frames/panel.webp',
    fallback: '/assets/placeholders/frame.svg',
    aspectRatio: '1/1',
    recommendedSize: [256, 256],
    group: 'optional',
    nineSlice: [24, 24, 24, 24],
  },
  {
    id: 'framework.portrait.default',
    path: '/assets/content/characters/default.webp',
    fallback: '/assets/placeholders/portrait.svg',
    aspectRatio: '3/4',
    recommendedSize: [384, 512],
    group: 'shell',
  },
  {
    id: 'framework.empty',
    path: '/assets/framework/empty-states/empty.webp',
    fallback: '/assets/placeholders/empty.svg',
    aspectRatio: '1/1',
    recommendedSize: [256, 256],
    group: 'core',
  },
  ...[
    'world',
    'life',
    'battle',
    'economy',
    'social',
    'system',
    'map',
    'character',
    'inventory',
    'mining',
    'market',
    'combat',
    'guild',
    'chat',
    'mail',
    'notice',
    'settings',
    'account',
    'notifications',
  ].map(icon),
  ...['player', 'monster', 'transport', 'resource', 'npc', 'party'].map(marker),
  ...['copper', 'ration', 'pickaxe'].map((name) => ({
    id: 'item.' + name,
    path: '/assets/content/items/' + name + '.webp',
    fallback: '/assets/placeholders/item-' + name + '.svg',
    aspectRatio: '1/1',
    recommendedSize: [128, 128] as [number, number],
    group: 'module' as const,
  })),
];
