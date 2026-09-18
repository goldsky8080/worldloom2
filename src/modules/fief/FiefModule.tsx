import { lazy, Suspense } from 'react';
import type { GameModuleDefinition } from '../registry';
const FiefPage = lazy(() => import('./FiefPage').then((m) => ({ default: m.FiefPage })));
function FiefEntry() {
  return (
    <Suspense
      fallback={
        <div className="entry-loading" role="status">
          Fief…
        </div>
      }
    >
      <FiefPage />
    </Suspense>
  );
}
export const FiefModule: GameModuleDefinition = {
  id: 'fief-prototype',
  version: '0.1.0',
  localizationNamespaces: ['fief'],
  routes: [{ path: '/fief', component: FiefEntry }],
  menuItems: [
    {
      id: 'world.fief',
      categoryId: 'world',
      titleKey: 'menu.fief',
      iconAssetId: 'framework.menu.map',
      order: 16,
      target: { type: 'route', id: '/fief' },
    },
  ],
};
