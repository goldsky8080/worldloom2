import { useEffect, useRef, useState } from 'react';
import { panelManager } from '../shell/panels/PanelManager';
import { selectedEntity, selectedMenu, worldDebug } from '../shell/state';
import { camera, clampZoom, defaultCamera } from './camera/camera';
import { useTranslation } from '../services/localization';
import { IconButton, ErrorState, LoadingState } from '../ui/components';
import { uiEvents } from '../core/ui-events/UiEventBus';
import { useAtom } from '../core/state/useAtom';
export function WorldCanvas() {
  const host = useRef<HTMLDivElement>(null),
    [error, setError] = useState(false),
    [loading, setLoading] = useState(true),
    [attempt, setAttempt] = useState(0),
    { t } = useTranslation();
  const debug = useAtom(worldDebug);
  useEffect(() => {
    let alive = true,
      scene: { destroy: () => void } | undefined;
    setLoading(true);
    setError(false);
    void import('./pixi/WorldScene')
      .then(async ({ WorldScene }) => {
        if (!alive || !host.current) return;
        const world = new WorldScene(host.current, (id) => {
          selectedEntity.set(id);
          selectedMenu.set(null);
          uiEvents.emit('entity.selected', { id });
          panelManager.open('entity', { mode: 'docked', payload: { entityId: id } });
        });
        scene = world;
        try {
          await world.init();
          if (alive) setLoading(false);
        } catch {
          world.destroy();
          if (alive) {
            setError(true);
            setLoading(false);
          }
        }
      })
      .catch(() => {
        if (alive) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
      scene?.destroy();
    };
  }, [attempt]);
  return (
    <>
      <div ref={host} className="world-canvas" role="region" aria-label={t('menu.map')} />
      {loading && (
        <div className="world-loading">
          <LoadingState />
        </div>
      )}
      {error && (
        <div className="world-loading">
          <ErrorState error={t('world.gpuError')} onRetry={() => setAttempt((a) => a + 1)} />
        </div>
      )}
      <div className="world-controls">
        <IconButton
          icon="plus"
          label={t('world.zoomIn')}
          onClick={() => camera.update((c) => ({ ...c, zoom: clampZoom(c.zoom * 1.15) }))}
        />
        <IconButton
          icon="minus"
          label={t('world.zoomOut')}
          onClick={() => camera.update((c) => ({ ...c, zoom: clampZoom(c.zoom / 1.15) }))}
        />
        <IconButton
          icon="refresh"
          label={t('world.center')}
          onClick={() => camera.set(defaultCamera())}
        />
      </div>
      <div className="world-hint">
        <span className="desktop-hint">{t('world.hint')}</span>
        <span className="mobile-hint">{t('world.touchHint')}</span>
        {debug.grid && (
          <small>
            {t('world.grid')} · {debug.chunks}
          </small>
        )}
      </div>
    </>
  );
}
