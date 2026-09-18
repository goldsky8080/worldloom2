import { itemQuantity } from '../../core/storage/items';
import type { PanelProps } from '../registry';
import { useAtom } from '../../core/state/useAtom';
import { runtime } from '../../app/bootstrap/services';
import { selectedEntity } from '../../shell/state';
import { useTranslation } from '../../services/localization';
import {
  AssetImage,
  GameButton,
  EmptyState,
  StatusBadge,
  ErrorState,
  Countdown,
} from '../../ui/components';
import { useWorldAction } from '../world/useWorldAction';
import { MiningStatus } from './MiningStatus';
export function MiningPanel({ payload }: PanelProps) {
  const selected = useAtom(selectedEntity),
    mining = useAtom(runtime.cache.mining),
    world = useAtom(runtime.cache.world),
    characters = useAtom(runtime.cache.characters),
    inventory = useAtom(runtime.cache.inventory);
  const explicit =
    typeof payload === 'object' && payload !== null && 'nodeId' in payload
      ? payload.nodeId
      : undefined;
  const characterId = characters.mainParty[0],
    active = mining.active.find((a) => a.characterId === characterId);
  const selectedNode = world.find(
    (e) => e.id === selected && e.type === 'resource' && e.interaction?.type === 'mining',
  );
  const nodeId =
    active?.nodeId ??
    explicit ??
    selectedNode?.id ??
    mining.recentResults.find((r) => r.characterId === characterId)?.nodeId;
  const action = useWorldAction(nodeId),
    { t, language } = useTranslation(),
    { entity, command } = action;
  if (!entity || entity.type !== 'resource' || !entity.interaction)
    return <EmptyState title={t('mining.selectNode')} description={t('mining.hint')} />;
  const number = (n: number) =>
    new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(n);
  return (
    <div className="mining-panel">
      <AssetImage assetId="mining.vein" alt={t('mining.copperVein')} className="demo-art" />
      <h3>{t(entity.displayNameKey)}</h3>
      <dl className="interaction-stats">
        <div>
          <dt>{t('world.distance')}</dt>
          <dd>
            {number(action.distance ?? 0)} {t('world.units')}
          </dd>
        </div>
        <div>
          <dt>{t('mining.range')}</dt>
          <dd>
            {number(entity.interaction.range)} {t('world.units')}
          </dd>
        </div>
        <div>
          <dt>{t('world.travelTime')}</dt>
          <dd>
            {t('world.travelTimeValue', { seconds: number((action.estimatedMs ?? 0) / 1000) })}
          </dd>
        </div>
        <div>
          <dt>{t('inventory.copper')}</dt>
          <dd>{itemQuantity(inventory.items, 'copper')}</dd>
        </div>
      </dl>
      {action.moving && action.player?.movement && (
        <p role="status">
          {t('world.arrivesIn')} <Countdown endsAt={action.player.movement.arrivesAt} />
        </p>
      )}
      <p>
        <StatusBadge>{t(action.inRange ? 'mining.available' : 'mining.outOfRange')}</StatusBadge>
      </p>
      <GameButton variant="primary" disabled={action.disabled} onClick={action.move}>
        {t('mining.moveToNode')}
      </GameButton>
      <GameButton
        variant="primary"
        disabled={action.disabled || !action.canMine}
        onClick={action.mine}
      >
        {t('mining.start')}
      </GameButton>
      <MiningStatus activity={action.activity} result={action.result} now={action.now} />
      {command.tracked && <p>{t('command.' + command.tracked.status)}</p>}
      {command.errorKey && (
        <ErrorState
          error={t(command.errorKey)}
          onRetry={() => (command.tracked?.commandType === 'MOVE' ? action.move() : action.mine())}
        />
      )}
    </div>
  );
}
