import { useAtom } from '../../core/state/useAtom';
import { notifications } from '../../services/notification';
import { timeService } from '../../services/time/TimeService';
import { useTranslation } from '../../services/localization';
import { NotificationToast, GameButton, GameModal } from '../../ui/components';
import { layers } from '../../ui/theme/tokens';
export function NotificationLayer() {
  const entries = useAtom(notifications.entries),
    now = useAtom(timeService.tick),
    { t } = useTranslation(),
    critical = entries.find((n) => n.critical);
  return (
    <>
      <div className="toast-stack" style={{ zIndex: layers.notification }} aria-live="polite">
        {entries
          .filter((n) => n.toastUntil > now)
          .slice(0, 3)
          .map((n) => (
            <NotificationToast key={n.id} kind={n.kind} onClose={() => notifications.dismiss(n.id)}>
              {t(n.titleKey)}
            </NotificationToast>
          ))}
      </div>
      {critical && (
        <GameModal
          title={t(critical.titleKey)}
          onClose={() => notifications.dismiss(critical.id)}
          layer="critical"
          role="alertdialog"
        >
          <GameButton variant="primary" onClick={() => notifications.dismiss(critical.id)}>
            {t('common.confirm')}
          </GameButton>
        </GameModal>
      )}
    </>
  );
}
