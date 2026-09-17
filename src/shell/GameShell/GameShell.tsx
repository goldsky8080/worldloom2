import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HUD } from '../HUD/HUD';
import { MainMenu, SubMenu } from '../MainMenu/MainMenu';
import { ChatDock } from '../ChatDock/ChatDock';
import { PanelHost } from '../panels/PanelHost';
import { WorldCanvas } from '../../world-renderer/WorldCanvas';
import { DebugOverlay } from '../../world-renderer/debug/DebugOverlay';
import { NotificationLayer } from './NotificationLayer';
import { NoticeLayer } from './NoticeLayer';
import { runtime, authGateway, session, debugEnabled } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { useTranslation } from '../../services/localization';
import { debugVisible } from '../state';
import { GameButton, LoadingState, GameModal } from '../../ui/components';
import { audioService } from '../../services/audio/AudioService';
export function GameShell() {
  const connection = useAtom(runtime.connection),
    { t } = useTranslation(),
    navigate = useNavigate();
  useEffect(() => {
    audioService.setBgm('world.default');
    const key = (e: KeyboardEvent) => {
      if (e.key === 'F2' && debugEnabled) {
        e.preventDefault();
        debugVisible.update((v) => !v);
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      audioService.stopBgm();
    };
  }, []);
  const blocked = connection !== 'connected';
  async function loginAgain() {
    await authGateway.logout();
    session.set(null);
    navigate('/login', { replace: true, state: { expired: true } });
  }
  return (
    <div className="game-shell">
      <main className="game-play" inert={blocked}>
        <WorldCanvas />
        <HUD />
        <div className="region-title">
          <span className="eyebrow">{t('world.subtitle')}</span>
          <h1>{t('world.region')}</h1>
        </div>
        <Link className="atlas-entry-link" to="/atlas">
          {t('menu.atlas')} ↗
        </Link>
        <MainMenu />
        <SubMenu />
        <ChatDock />
        <PanelHost />
        <DebugOverlay />
      </main>
      <NoticeLayer enabled={!blocked} />
      <NotificationLayer />
      {blocked && (
        <GameModal
          title={t('network.' + connection)}
          onClose={() => {}}
          layer="critical"
          dismissible={false}
          role="alertdialog"
          className="connection-dialog"
        >
          {connection === 'connecting' ||
          connection === 'recovering' ||
          connection === 'reconnecting' ? (
            <LoadingState label={t('network.hint')} />
          ) : (
            <p>{t(connection === 'expired' ? 'auth.expired' : 'network.hint')}</p>
          )}
          <GameButton
            variant="primary"
            onClick={() => {
              if (connection === 'expired') void loginAgain();
              else void runtime.reconnect();
            }}
          >
            {t(connection === 'expired' ? 'auth.login' : 'common.retry')}
          </GameButton>
        </GameModal>
      )}
    </div>
  );
}
