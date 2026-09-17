import { useAtom } from '../../core/state/useAtom';
import { runtime, realtimeGateway, mockServer, debugEnabled } from '../../app/bootstrap/services';
import { debugVisible, worldDebug, selectedMenu } from '../../shell/state';
import { camera } from '../camera/camera';
import { panelManager } from '../../shell/panels/PanelManager';
import { useTranslation } from '../../services/localization';
import { GamePanel, GameButton } from '../../ui/components';
import { layers } from '../../ui/theme/tokens';
export function DebugOverlay() {
  const visible = useAtom(debugVisible),
    state = useAtom(worldDebug),
    sequence = useAtom(runtime.sequence),
    connection = useAtom(runtime.connection),
    entities = useAtom(runtime.cache.world),
    panels = useAtom(panelManager.panels),
    c = useAtom(camera),
    menu = useAtom(selectedMenu),
    latency = useAtom(mockServer.latency),
    { t, language } = useTranslation();
  if (!debugEnabled || !visible) return null;
  return (
    <aside className="debug-overlay" style={{ zIndex: layers.notification }}>
      <GamePanel title={t('debug.title')}>
        <dl>
          <dt>{t('debug.sequence')}</dt>
          <dd>
            {sequence} · {t('network.' + connection)}
          </dd>
          <dt>{t('debug.entityCount')}</dt>
          <dd>
            {entities.length} / {state.visible} · {state.fps} FPS
          </dd>
          <dt>{t('debug.camera')}</dt>
          <dd>
            {Math.round(c.x)}, {Math.round(c.y)} · {c.zoom.toFixed(2)}×
          </dd>
          <dt>{t('debug.panels')}</dt>
          <dd>{panels.length}</dd>
          <dt>{t('debug.menu')}</dt>
          <dd>{menu ? t('menu.' + menu) : '—'}</dd>
          <dt>{t('debug.language')}</dt>
          <dd>{language}</dd>
        </dl>
        <label className="setting-row">
          {t('debug.latency')}
          <select value={latency} onChange={(e) => mockServer.latency.set(Number(e.target.value))}>
            {[0, 200, 800, 2000].map((n) => (
              <option key={n} value={n}>
                {n} ms
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.grid}
            onChange={(e) => worldDebug.update((s) => ({ ...s, grid: e.target.checked }))}
          />
          {t('world.grid')}
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.aoi}
            onChange={(e) => worldDebug.update((s) => ({ ...s, aoi: e.target.checked }))}
          />
          {t('world.aoi')}
        </label>
        <div className="debug-actions">
          <GameButton
            disabled={connection !== 'connected'}
            onClick={() => realtimeGateway.simulateDisconnect()}
          >
            {t('debug.disconnect')}
          </GameButton>
          <GameButton
            disabled={connection !== 'connected'}
            onClick={() => realtimeGateway.injectGap()}
          >
            {t('debug.gap')}
          </GameButton>
          <GameButton
            onClick={() =>
              mockServer.publish({ eventType: 'SESSION_UPDATED', payload: { expired: true } })
            }
          >
            {t('debug.expire')}
          </GameButton>
        </div>
      </GamePanel>
    </aside>
  );
}
