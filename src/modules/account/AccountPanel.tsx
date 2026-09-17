import { authGateway, session } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { useState } from 'react';
import { useTranslation } from '../../services/localization';
import { GameButton, CharacterPortrait, StatusBadge, ErrorState } from '../../ui/components';
export function AccountPanel() {
  const user = useAtom(session),
    { t } = useTranslation(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  if (!user) return null;
  async function verify() {
    setBusy(true);
    try {
      session.set(await authGateway.verifyEmail());
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="account-detail">
      <CharacterPortrait name={user.nickname} />
      <h3>{user.nickname}</h3>
      <p>{user.email}</p>
      <StatusBadge kind={user.verified ? 'success' : 'info'}>
        {t(user.verified ? 'auth.verified' : 'auth.unverified')}
      </StatusBadge>
      {!user.verified && (
        <GameButton
          loading={busy}
          onClick={() => {
            void verify();
          }}
        >
          {t('auth.verify')}
        </GameButton>
      )}
      <p className="muted">{t('common.mockHint')}</p>
      <GameButton
        onClick={() => {
          void authGateway.logout().then(() => session.set(null));
        }}
      >
        {t('auth.logout')}
      </GameButton>
      {error && <ErrorState />}
    </div>
  );
}
