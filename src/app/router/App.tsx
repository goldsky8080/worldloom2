import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAtom } from '../../core/state/useAtom';
import { authGateway, mockServer, runtime, session } from '../bootstrap/services';
import { loadSettings } from '../../services/settings';
import { assetManager } from '../../services/assets/AssetManager';
import { AuthPage } from '../../modules/auth/AuthPage';
import { GameShell } from '../../shell/GameShell/GameShell';
import { panelManager } from '../../shell/panels/PanelManager';
import { LoadingState, ErrorState, AssetImage } from '../../ui/components';
import { moduleRegistry } from '../../modules/registry';
function GameEntry() {
  const user = useAtom(session),
    valid = useAtom(runtime.cache.valid),
    connection = useAtom(runtime.connection);
  const accountId = user?.accountId;
  useEffect(() => {
    if (!accountId) return;
    let alive = true;
    runtime.connection.set('connecting');
    void assetManager
      .preload('shell')
      .catch(() => {})
      .then(() => {
        if (alive) {
          mockServer.start();
          void runtime.start();
        }
      });
    return () => {
      alive = false;
      runtime.stop();
      panelManager.clear();
    };
  }, [accountId]);
  if (!user) return <Navigate to="/login" replace />;
  if (!valid && connection === 'connecting')
    return (
      <div className="entry-loading">
        <AssetImage assetId="framework.background.login" alt="" className="auth-background" eager />
        <LoadingState />
      </div>
    );
  return <GameShell />;
}
export function App() {
  const [ready, setReady] = useState(false),
    [error, setError] = useState(false),
    user = useAtom(session);
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await loadSettings();
        await assetManager.loadOverrides();
        await assetManager.preload('core');
        session.set(await authGateway.getSession());
        if (alive) setReady(true);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  if (error)
    return (
      <div className="entry-loading">
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    );
  if (!ready)
    return (
      <div className="entry-loading">
        <LoadingState />
      </div>
    );
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/game" replace /> : <AuthPage key="login" />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/game" replace /> : <AuthPage key="signup" signup />}
        />
        <Route path="/game" element={<GameEntry />} />
        {moduleRegistry
          .all()
          .flatMap((m) => m.routes ?? [])
          .map((r) => (
            <Route key={r.path} path={r.path} element={<r.component />} />
          ))}
        <Route path="*" element={<Navigate to={user ? '/game' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
