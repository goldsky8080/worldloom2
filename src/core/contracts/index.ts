import { WORLD_CONFIG } from '../world/worldConfig';
import { z } from 'zod';
export const CONTRACT_VERSION = '2.0' as const;
const iso = z.string().datetime();
const id = z.string().min(1);
export const movementSchema = z.object({
  fromX: z.number().finite(),
  fromY: z.number().finite(),
  toX: z.number().finite(),
  toY: z.number().finite(),
  startedAt: iso,
  arrivesAt: iso,
});
export const interactionSchema = z.object({
  type: z.literal('mining'),
  range: z.number().finite().positive(),
  durationMs: z.number().int().positive(),
});
export const entitySchema = z.object({
  id,
  type: z.enum(['player', 'npc', 'monster', 'transport', 'resource', 'party']),
  x: z.number().finite(),
  y: z.number().finite(),
  displayNameKey: z.string(),
  markerAssetId: id,
  interaction: interactionSchema.optional(),
  moveSpeed: z.number().finite().positive().optional(),
  movement: movementSchema.optional(),
  status: z.string().optional(),
});
export const characterSchema = z.object({
  id,
  name: z.string(),
  portraitAssetId: id,
  level: z.number().int().positive(),
  hp: z.number().nonnegative(),
  maxHp: z.number().positive(),
  roleKey: id,
});
export const inventorySchema = z.object({
  gold: z.number().int().nonnegative(),
  items: z.array(
    z.object({ id, nameKey: id, assetId: id, quantity: z.number().int().nonnegative() }),
  ),
});
export const charactersSchema = z
  .object({
    characterPool: z.array(characterSchema),
    activeRoster: z.array(id).max(5),
    mainParty: z.array(id).max(3),
  })
  .superRefine((value, ctx) => {
    const pool = new Set(value.characterPool.map((c) => c.id));
    if (
      pool.size !== value.characterPool.length ||
      new Set(value.activeRoster).size !== value.activeRoster.length ||
      new Set(value.mainParty).size !== value.mainParty.length ||
      value.activeRoster.some((i) => !pool.has(i)) ||
      value.mainParty.some((i) => !value.activeRoster.includes(i))
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid character roster' });
  });
export const mailSchema = z.object({
  id,
  titleKey: id,
  bodyKey: id,
  read: z.boolean(),
  claimed: z.boolean(),
  reward: z.number().int().nonnegative(),
  expiresAt: iso,
});
export const noticeSchema = z.object({
  id,
  titleKey: id,
  bodyKey: id,
  categoryKey: id,
  pinned: z.boolean(),
  important: z.boolean(),
  startsAt: iso,
  endsAt: iso,
  popup: z.boolean(),
  emergency: z.boolean(),
});
export const chatSchema = z.object({
  id,
  channel: z.enum(['global', 'region', 'guild', 'system']),
  sender: z.string(),
  text: z.string().max(500).optional(),
  textKey: z.string().optional(),
  sentAt: iso,
  decoration: z
    .object({
      titleKey: z.string().optional(),
      style: z.enum(['normal', 'system', 'guild']).optional(),
    })
    .optional(),
});
export const miningActivitySchema = z.object({
  commandId: z.string().uuid(),
  characterId: id,
  nodeId: id,
  startedAt: iso,
  completesAt: iso,
});
export const miningResultSchema = z.object({
  commandId: z.string().uuid(),
  characterId: id,
  nodeId: id,
  completedAt: iso,
  rewards: z.array(z.object({ itemId: id, quantity: z.number().int().positive() })),
});
export const miningStateSchema = z.object({
  active: z.array(miningActivitySchema),
  recentResults: z.array(miningResultSchema),
});
export const snapshotSchema = z.object({
  contractVersion: z.literal(CONTRACT_VERSION),
  sequence: z.number().int().nonnegative(),
  serverTime: iso,
  commandStatuses: z.array(
    z.object({
      commandId: z.string().uuid(),
      status: z.enum(['ACCEPTED', 'EXECUTING', 'SUCCEEDED', 'FAILED']),
      completesAt: iso.optional(),
      errorKey: id.optional(),
    }),
  ),
  world: z.array(entitySchema),
  mining: miningStateSchema,
  characters: charactersSchema,
  inventory: inventorySchema,
  mail: z.array(mailSchema),
  notices: z.array(noticeSchema),
  chat: z.array(chatSchema),
});
const commandBase = {
  contractVersion: z.literal(CONTRACT_VERSION),
  commandId: z.string().uuid(),
  characterId: id,
  requestedAt: iso,
};
export const commandSchema = z.discriminatedUnion('commandType', [
  z.object({
    ...commandBase,
    commandType: z.literal('START_MINING'),
    payload: z.object({ nodeId: id }).strict(),
  }),
  z.object({
    ...commandBase,
    commandType: z.literal('MOVE'),
    payload: z.object({
      entityId: id,
      x: z.number().min(0).max(WORLD_CONFIG.width),
      y: z.number().min(0).max(WORLD_CONFIG.height),
    }),
  }),
  z.object({
    ...commandBase,
    commandType: z.literal('MAIL_CLAIM'),
    payload: z.object({ mailId: id }),
  }),
  z.object({ ...commandBase, commandType: z.literal('MAIL_CLAIM_ALL'), payload: z.object({}) }),
]);
export const receiptSchema = z.object({
  contractVersion: z.literal(CONTRACT_VERSION),
  commandId: z.string().uuid(),
  status: z.enum(['ACCEPTED', 'FAILED']),
  errorKey: z.string().optional(),
});
const eventBase = {
  contractVersion: z.literal(CONTRACT_VERSION),
  eventId: z.string().uuid(),
  sequence: z.number().int().positive(),
  occurredAt: iso,
};
export const eventSchema = z.discriminatedUnion('eventType', [
  z.object({ ...eventBase, eventType: z.literal('WORLD_ENTITY_UPDATED'), payload: entitySchema }),
  z.object({ ...eventBase, eventType: z.literal('MOVEMENT_STARTED'), payload: entitySchema }),
  z.object({ ...eventBase, eventType: z.literal('MOVEMENT_COMPLETED'), payload: entitySchema }),
  z.object({ ...eventBase, eventType: z.literal('MINING_STARTED'), payload: miningActivitySchema }),
  z.object({ ...eventBase, eventType: z.literal('MINING_COMPLETED'), payload: miningResultSchema }),
  z.object({ ...eventBase, eventType: z.literal('CHARACTER_UPDATED'), payload: charactersSchema }),
  z.object({ ...eventBase, eventType: z.literal('INVENTORY_UPDATED'), payload: inventorySchema }),
  z.object({ ...eventBase, eventType: z.literal('MAIL_UPDATED'), payload: z.array(mailSchema) }),
  z.object({ ...eventBase, eventType: z.literal('MAIL_RECEIVED'), payload: mailSchema }),
  z.object({ ...eventBase, eventType: z.literal('NOTICE_PUBLISHED'), payload: noticeSchema }),
  z.object({ ...eventBase, eventType: z.literal('CHAT_MESSAGE'), payload: chatSchema }),
  z.object({
    ...eventBase,
    eventType: z.literal('NOTIFICATION_CREATED'),
    payload: z.object({
      titleKey: id,
      kind: z.enum(['info', 'success', 'danger']),
      commandId: z.string().uuid().optional(),
    }),
  }),
  z.object({
    ...eventBase,
    eventType: z.literal('COMMAND_STATUS'),
    payload: z.object({
      commandId: z.string().uuid(),
      status: z.enum(['EXECUTING', 'SUCCEEDED', 'FAILED']),
      errorKey: id.optional(),
      completesAt: iso.optional(),
    }),
  }),
  z.object({
    ...eventBase,
    eventType: z.literal('SESSION_UPDATED'),
    payload: z.object({ expired: z.boolean() }),
  }),
]);
export type GameCommand = z.infer<typeof commandSchema>;
export type GameEvent = z.infer<typeof eventSchema>;
export type CommandReceipt = z.infer<typeof receiptSchema>;
export type GameSnapshot = z.infer<typeof snapshotSchema>;
export type WorldEntityView = z.infer<typeof entitySchema>;
export type Characters = z.infer<typeof charactersSchema>;
export type Inventory = z.infer<typeof inventorySchema>;
export type Mail = z.infer<typeof mailSchema>;
export type Notice = z.infer<typeof noticeSchema>;
export type ChatMessage = z.infer<typeof chatSchema>;
export type CommandStatus = 'REQUESTED' | 'ACCEPTED' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED';
export interface AreaSubscription {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  zoom: number;
}

export type MiningActivity = z.infer<typeof miningActivitySchema>;
export type MiningResult = z.infer<typeof miningResultSchema>;
export type MiningState = z.infer<typeof miningStateSchema>;
