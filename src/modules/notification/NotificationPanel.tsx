import { useAtom } from '../../core/state/useAtom';
import { notifications } from '../../services/notification';
import { useTranslation } from '../../services/localization';
import { GameButton, StatusBadge, EmptyState } from '../../ui/components';
import { formatTime } from '../../services/settings';
export function NotificationPanel() {
  const list = useAtom(notifications.entries),
    { t } = useTranslation();
  return (
    <>
      <GameButton onClick={() => notifications.markAllRead()}>{t('notification.clear')}</GameButton>
      {list.length ? (
        list.map((n) => (
          <article className={'notification-row ' + (n.read ? 'read' : '')} key={n.id}>
            <StatusBadge kind={n.kind}>{t(n.titleKey)}</StatusBadge>
            <small>{formatTime(n.createdAt)}</small>
          </article>
        ))
      ) : (
        <EmptyState />
      )}
    </>
  );
}
