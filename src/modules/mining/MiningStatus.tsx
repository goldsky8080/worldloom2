import type { MiningActivity, MiningResult } from '../../core/contracts';
import { Countdown, ProgressBar, StatusBadge } from '../../ui/components';
import { useTranslation } from '../../services/localization';
/** Presentation derives progress from server deadlines, never grants a reward at zero. */
export function MiningStatus({
  activity,
  result,
  now,
}: {
  activity?: MiningActivity;
  result?: MiningResult;
  now: number;
}) {
  const { t } = useTranslation();
  const start = activity ? Date.parse(activity.startedAt) : 0,
    end = activity ? Date.parse(activity.completesAt) : 0;
  const progress = activity
    ? Math.max(0, Math.min(100, ((now - start) / Math.max(1, end - start)) * 100))
    : 0;
  return (
    <>
      {activity && (
        <div className="activity-progress" aria-live="polite">
          <StatusBadge>{t('mining.progress')}</StatusBadge>
          <p>
            {t('mining.timer')} <Countdown endsAt={activity.completesAt} />
          </p>
          <ProgressBar value={progress} label={t('mining.progress')} />
          {now >= end && <small className="muted">{t('mining.awaitingResult')}</small>}
        </div>
      )}
      {result && (
        <div className="mining-result" role="status">
          <small className="muted">{t('mining.recentResult')}</small>
          <p>
            <StatusBadge kind="success">{t('mining.completed')}</StatusBadge>
          </p>
          {result.rewards.map((r) => (
            <p key={r.itemId}>
              {t('mining.reward', { item: t('inventory.' + r.itemId), quantity: r.quantity })}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
