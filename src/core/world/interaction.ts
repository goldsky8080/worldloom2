import type { MiningState, WorldEntityView } from '../contracts';
import { WORLD_CONFIG } from './worldConfig';
import { worldDistance } from './distance';
import { interpolate } from './interpolate';
/** Display estimates only. Servers independently validate actions and publish deadlines. */
export function movementDurationMs(distance: number, speed: number) {
  return Math.max(WORLD_CONFIG.movement.minimumMovementMs, Math.ceil((distance / speed) * 1000));
}
export function interactionPreview(
  player: WorldEntityView | undefined,
  target: WorldEntityView | undefined,
  mining: MiningState,
  characterId: string | undefined,
  now: number,
) {
  const position = player ? interpolate(player, now) : undefined;
  const targetPosition = target ? interpolate(target, now) : undefined;
  const distance = position && targetPosition ? worldDistance(position, targetPosition) : undefined;
  const activity = mining.active.find((a) => a.characterId === characterId);
  // A movement remains active until the server sends completion, even when countdown reaches zero.
  const moving = !!player?.movement;
  const node = target?.type === 'resource' && target.interaction?.type === 'mining';
  const inRange = !!node && distance !== undefined && distance <= target!.interaction!.range;
  return {
    position,
    targetPosition,
    distance,
    activity,
    moving,
    inRange,
    estimatedMs:
      distance !== undefined
        ? movementDurationMs(distance, player?.moveSpeed ?? WORLD_CONFIG.movement.playerBaseSpeed)
        : undefined,
    canMine: !!player && !!characterId && !!node && inRange && !moving && !activity,
    result: mining.recentResults.find(
      (r) => r.characterId === characterId && r.nodeId === target?.id,
    ),
  };
}
