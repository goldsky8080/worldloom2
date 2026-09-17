import { useTranslation } from '../../services/localization';
import type { PanelProps } from '../registry';
import {
  AssetImage,
  GameButton,
  StatusBadge,
  ErrorState,
  EmptyState,
  Countdown,
} from '../../ui/components';
import { useWorldAction } from './useWorldAction';
import { MiningStatus } from '../mining/MiningStatus';
import { panelManager } from '../../shell/panels/PanelManager';
export function EntityPanel({ payload }: PanelProps) {
  const id =
    typeof payload === 'object' && payload !== null && 'entityId' in payload
      ? payload.entityId
      : undefined;
  const action = useWorldAction(id),
    { t, language } = useTranslation();
  const { entity, player, command, distance, estimatedMs, moving, activity, inRange, now, result } =
    action;
  if (!entity) return <EmptyState />;
  const number = (value: number) =>
    new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(value);
  const resource = entity.type === 'resource' && entity.interaction?.type === 'mining';
  return (
    <div className="entity-detail">
      <AssetImage
        assetId={entity.markerAssetId}
        alt={t(entity.displayNameKey)}
        className="demo-art"
      />
      <StatusBadge>{t('world.' + entity.type)}</StatusBadge>
      <h3>{t(entity.displayNameKey)}</h3>
      <p className="muted">
        {t('world.coords')} · {Math.round(action.targetPosition?.x ?? entity.x)},{' '}
        {Math.round(action.targetPosition?.y ?? entity.y)}
      </p>
      {entity.id !== player?.id && (
        <dl className="interaction-stats">
          <div>
            <dt>{t('world.distance')}</dt>
            <dd data-testid="world-distance">
              {distance !== undefined ? number(distance) : '—'} {t('world.units')}
            </dd>
          </div>
          <div>
            <dt>{t('world.travelTime')}</dt>
            <dd>
              {estimatedMs !== undefined
                ? t('world.travelTimeValue', { seconds: number(estimatedMs / 1000) })
                : '—'}
            </dd>
          </div>
          {resource && (
            <div>
              <dt>{t('mining.range')}</dt>
              <dd>
                {number(entity.interaction!.range)} {t('world.units')}
              </dd>
            </div>
          )}
        </dl>
      )}
      {moving && player?.movement && (
        <div className="activity-progress" role="status">
          <StatusBadge>{t('world.moving')}</StatusBadge>
          <p>
            {t('world.arrivesIn')} <Countdown endsAt={player.movement.arrivesAt} />
          </p>
          <small className="muted">
            {t('world.destination')} · {Math.round(player.movement.toX)},{' '}
            {Math.round(player.movement.toY)}
          </small>
        </div>
      )}
      {entity.id !== player?.id && (
        <GameButton
          variant="primary"
          disabled={action.disabled}
          loading={command.busy && command.tracked?.commandType === 'MOVE'}
          onClick={action.move}
        >
          {t(resource ? 'mining.moveToNode' : 'world.moveTo')}
        </GameButton>
      )}
      {resource && (
        <>
          <p className="muted">{t(inRange ? 'mining.available' : 'mining.outOfRange')}</p>
          <GameButton
            variant="primary"
            disabled={action.disabled || !action.canMine}
            onClick={action.mine}
          >
            {t('mining.start')}
          </GameButton>
          {activity && activity.nodeId !== entity.id && <p>{t('command.busy')}</p>}
          <MiningStatus
            activity={activity?.nodeId === entity.id ? activity : undefined}
            result={result}
            now={now}
          />
          <GameButton
            onClick={() => panelManager.open('mining', { payload: { nodeId: entity.id } })}
          >
            {t('mining.details')}
          </GameButton>
        </>
      )}
      {command.tracked && <p>{t('command.' + command.tracked.status)}</p>}
      {command.errorKey && (
        <ErrorState
          error={t(command.errorKey)}
          onRetry={() =>
            command.tracked?.commandType === 'START_MINING' ? action.mine() : action.move()
          }
        />
      )}
    </div>
  );
}
