import { runtime } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { interactionPreview } from '../../core/world/interaction';
import { useCommand } from '../../core/command/useCommand';
import { createCommand } from '../../core/command/createCommand';
import { timeService } from '../../services/time/TimeService';
export function useWorldAction(entityId: unknown) {
  const world = useAtom(runtime.cache.world),
    characters = useAtom(runtime.cache.characters),
    mining = useAtom(runtime.cache.mining),
    now = useAtom(timeService.tick),
    commands = useAtom(runtime.commands),
    valid = useAtom(runtime.cache.valid),
    command = useCommand();
  const player = world.find((e) => e.id === 'player-1'),
    entity = world.find((e) => e.id === entityId),
    characterId = characters.mainParty[0],
    preview = interactionPreview(player, entity, mining, characterId, now);
  const pending = Object.values(commands).some(
    (c) =>
      c.characterId === characterId &&
      (c.commandType === 'MOVE' || c.commandType === 'START_MINING') &&
      ['REQUESTED', 'ACCEPTED', 'EXECUTING'].includes(c.status),
  );
  const disabled = command.disabled || !valid || pending || preview.moving || !!preview.activity;
  return {
    entity,
    player,
    characterId,
    mining,
    now,
    command,
    ...preview,
    disabled,
    move: () => {
      if (entity && characterId && preview.targetPosition && !disabled)
        void command.send(
          createCommand('MOVE', { entityId: 'player-1', ...preview.targetPosition }, characterId),
        );
    },
    mine: () => {
      if (entity && characterId && preview.canMine && !disabled)
        void command.send(createCommand('START_MINING', { nodeId: entity.id }, characterId));
    },
  };
}
