import { lazy, Suspense } from 'react';
import type { GameModuleDefinition } from '../registry';
const AtlasPage = lazy(() =>
  import('./AtlasPage').then((module) => ({ default: module.AtlasPage })),
);
function AtlasEntry() {
  return (
    <Suspense
      fallback={
        <div className="entry-loading" role="status">
          World Atlas…
        </div>
      }
    >
      <AtlasPage />
    </Suspense>
  );
}
export const AtlasModule: GameModuleDefinition = {
  id: 'atlas-preview',
  version: '0.2.0',
  localizationNamespaces: ['atlas'],
  routes: [{ path: '/atlas', component: AtlasEntry }],
  menuItems: [
    {
      id: 'world.atlas',
      categoryId: 'world',
      titleKey: 'menu.atlas',
      iconAssetId: 'framework.menu.map',
      order: 15,
      target: { type: 'route', id: '/atlas' },
    },
  ],
};
