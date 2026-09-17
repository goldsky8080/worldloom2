import { CONTRACT_VERSION, commandSchema, type GameCommand } from '../contracts';
export function createCommand<T extends GameCommand['commandType']>(
  commandType: T,
  payload: Extract<GameCommand, { commandType: T }>['payload'],
  characterId = 'character-1',
): Extract<GameCommand, { commandType: T }> {
  return commandSchema.parse({
    contractVersion: CONTRACT_VERSION,
    commandId: crypto.randomUUID(),
    commandType,
    characterId,
    requestedAt: new Date().toISOString(),
    payload,
  }) as Extract<GameCommand, { commandType: T }>;
}
