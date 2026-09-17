import { useState } from 'react';
import { runtime, socialGateway } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { useTranslation } from '../../services/localization';
import { useCommand } from '../../core/command/useCommand';
import { createCommand } from '../../core/command/createCommand';
import {
  GameButton,
  EmptyState,
  UnreadBadge,
  CurrencyDisplay,
  StatusBadge,
  ErrorState,
} from '../../ui/components';
import { timeService } from '../../services/time/TimeService';
export function MailPanel() {
  const mail = useAtom(runtime.cache.mail),
    now = useAtom(timeService.tick),
    { t, language } = useTranslation(),
    [selected, setSelected] = useState<string | null>(null),
    [error, setError] = useState(false);
  const command = useCommand(),
    entry = mail.find((m) => m.id === selected);
  async function open(id: string) {
    setSelected(id);
    setError(false);
    try {
      await socialGateway.readMail(id);
    } catch {
      setError(true);
    }
  }
  async function remove(id: string) {
    setError(false);
    try {
      await socialGateway.deleteMail(id);
      setSelected(null);
    } catch {
      setError(true);
    }
  }
  return (
    <>
      <GameButton
        disabled={
          command.disabled || !mail.some((m) => !m.claimed && Date.parse(m.expiresAt) > now)
        }
        loading={command.busy}
        onClick={() => {
          void command.send(createCommand('MAIL_CLAIM_ALL', {}));
        }}
      >
        {t('mail.claimAll')}
      </GameButton>
      {!mail.length && <EmptyState />}
      <div className="mail-list">
        {mail.map((m) => (
          <GameButton
            className={'mail-row ' + (selected === m.id ? 'selected' : '')}
            key={m.id}
            disabled={command.disabled}
            onClick={() => {
              void open(m.id);
            }}
          >
            <span>{t(m.titleKey)}</span>
            <UnreadBadge count={m.read ? 0 : 1} />
            <small>{t(m.read ? 'mail.read' : 'mail.unread')}</small>
          </GameButton>
        ))}
      </div>
      {entry && (
        <article className="mail-detail">
          <h3>{t(entry.titleKey)}</h3>
          <p>{t(entry.bodyKey)}</p>
          <CurrencyDisplay value={entry.reward} />
          <p className="muted">
            {t('mail.expires')} ·{' '}
            {new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(
              Date.parse(entry.expiresAt),
            )}
          </p>
          <div className="button-row">
            {entry.claimed ? (
              <StatusBadge kind="success">{t('mail.claimed')}</StatusBadge>
            ) : Date.parse(entry.expiresAt) <= now ? (
              <StatusBadge kind="danger">{t('mail.expired')}</StatusBadge>
            ) : (
              <GameButton
                variant="primary"
                disabled={command.disabled}
                loading={command.busy}
                onClick={() => {
                  void command.send(createCommand('MAIL_CLAIM', { mailId: entry.id }));
                }}
              >
                {t('mail.claim')}
              </GameButton>
            )}
            <GameButton
              disabled={
                command.disabled ||
                (!entry.claimed && entry.reward > 0 && Date.parse(entry.expiresAt) > now)
              }
              onClick={() => {
                void remove(entry.id);
              }}
            >
              {t('mail.delete')}
            </GameButton>
          </div>
        </article>
      )}
      {command.errorKey && <ErrorState error={t(command.errorKey)} onRetry={command.retry} />}
      {error && <ErrorState />}
    </>
  );
}
