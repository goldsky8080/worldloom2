import { selectedMenu } from '../state';
import { useMediaQuery } from '../../ui/layout/useMediaQuery';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAtom } from '../../core/state/useAtom';
import { panelManager, type OpenPanel } from './PanelManager';
import { moduleRegistry } from '../../modules/registry';
import { GameWindow, GameModal, IconButton, GameButton } from '../../ui/components';
import { useTranslation } from '../../services/localization';
import { GameErrorBoundary } from '../../ui/components/GameErrorBoundary';
import { layers } from '../../ui/theme/tokens';
function PanelWindow({ panel, index }: { panel: OpenPanel; index: number }) {
  const definition = moduleRegistry.panel(panel.panelType),
    Component = definition.component,
    { t } = useTranslation(),
    ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null),
    drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  if (panel.modal)
    return (
      <GameModal title={t(definition.titleKey)} onClose={() => panelManager.close(panel.id)}>
        <GameErrorBoundary>
          <Component payload={panel.payload} />
        </GameErrorBoundary>
      </GameModal>
    );
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-label={t(definition.titleKey)}
      className={'panel-position ' + panel.mode}
      style={
        {
          '--panel-index': index % 4,
          zIndex: layers.panel,
          ...(position && panel.mode === 'floating'
            ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
            : {}),
        } as CSSProperties
      }
      onPointerDown={() => {
        const last = panelManager.panels.get().at(-1);
        if (last?.id !== panel.id) panelManager.focus(panel.id);
      }}
    >
      <div
        className="window-grip"
        onPointerDown={(e) => {
          if (panel.mode !== 'floating' || window.innerWidth < 700 || !ref.current) return;
          const bounds = ref.current.getBoundingClientRect();
          drag.current = { x: e.clientX, y: e.clientY, left: bounds.left, top: bounds.top };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPosition({
            x: Math.max(
              0,
              Math.min(window.innerWidth - 80, drag.current.left + e.clientX - drag.current.x),
            ),
            y: Math.max(
              70,
              Math.min(window.innerHeight - 80, drag.current.top + e.clientY - drag.current.y),
            ),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        aria-hidden="true"
      />
      <GameWindow
        title={t(definition.titleKey)}
        actions={
          <div className="window-actions">
            <IconButton
              icon="minus"
              label={t('common.minimize')}
              onClick={() => panelManager.minimize(panel.id)}
            />
            <IconButton
              icon="dock"
              label={t('common.dock')}
              onClick={() =>
                panelManager.mode(panel.id, panel.mode === 'docked' ? 'floating' : 'docked')
              }
            />
            <IconButton
              icon="expand"
              label={t(panel.mode === 'fullscreen' ? 'common.restore' : 'common.fullscreen')}
              onClick={() =>
                panelManager.mode(panel.id, panel.mode === 'fullscreen' ? 'floating' : 'fullscreen')
              }
            />
            <IconButton
              icon="close"
              label={t('common.close')}
              onClick={() => panelManager.close(panel.id)}
            />
          </div>
        }
      >
        <GameErrorBoundary>
          <Component payload={panel.payload} />
        </GameErrorBoundary>
      </GameWindow>
    </div>
  );
}
export function PanelHost() {
  const selected = useAtom(selectedMenu),
    mobile = useMediaQuery('(max-width: 700px)'),
    menuOpen = mobile && selected !== null,
    panels = useAtom(panelManager.panels),
    { t } = useTranslation();
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('[aria-modal="true"]')) return;
      if (
        event.key === 'Escape' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)
      )
        panelManager.back();
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);
  return (
    <>
      <div
        className={'panel-host' + (menuOpen ? ' menu-open' : '')}
        inert={menuOpen}
        aria-hidden={menuOpen || undefined}
      >
        {panels
          .filter((p) => !p.minimized)
          .map((panel, index) => (
            <PanelWindow key={panel.id} panel={panel} index={index} />
          ))}
      </div>
      <div
        className="minimized-windows"
        style={{ zIndex: layers.panel, visibility: menuOpen ? 'hidden' : undefined }}
        inert={menuOpen}
        aria-hidden={menuOpen || undefined}
      >
        {panels
          .filter((p) => p.minimized)
          .map((p) => (
            <GameButton
              key={p.id}
              onClick={() => panelManager.focus(p.id)}
              aria-label={t('common.restore') + ' ' + t(moduleRegistry.panel(p.panelType).titleKey)}
            >
              {t(moduleRegistry.panel(p.panelType).titleKey)}
            </GameButton>
          ))}
      </div>
    </>
  );
}
