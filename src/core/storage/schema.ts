import { z } from 'zod';
const id = z.string().min(1);
export const itemDefinitionSchema = z.object({
  id,
  name: z.string().min(1),
  category: z.enum(['resource', 'consumable', 'equipment']),
  maxStack: z.number().int().positive(),
  unitWeight: z.number().finite().nonnegative(),
  assetId: id,
});
export const stackSchema = z.object({
  id,
  nameKey: id,
  assetId: id,
  quantity: z.number().int().nonnegative(),
  slotId: id.optional(),
});
export const expansionSchema = z.object({
  goldExpansion: z.number().int().min(0).max(6).optional(),
  premiumExpansion: z.number().int().min(0).max(12).optional(),
});
export const storageInventorySchema = expansionSchema.extend({
  gold: z.number().int().nonnegative(),
  gem: z.number().int().nonnegative().optional(),
  weightLimit: z.number().finite().positive().optional(),
  items: z.array(stackSchema),
});
export const warehouseSchema = expansionSchema.extend({ cityId: id, items: z.array(stackSchema) });
export const depotBatchSchema = z.object({
  id,
  cityId: id,
  itemId: id,
  quantity: z.number().int().positive(),
  arrivedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  source: z.enum(['MARKET', 'NPC_LOGISTICS', 'SYSTEM']),
  notices: z.array(z.enum(['ARRIVED', 'D7', 'D3', 'D1', 'EXPIRED'])),
});
export const vehicleSchema = z.object({
  id,
  ownerId: id,
  vehicleType: z.enum(['SMALL_CART', 'CART', 'WAGON', 'LARGE_WAGON']),
  capacity: z.number().finite().positive(),
  currentLocation: id,
  regionId: id,
  cargo: z.array(stackSchema),
  status: z.enum(['IDLE', 'IN_TRANSIT']),
});
export const shipmentSchema = z.object({
  id,
  sourceCityId: id,
  destinationCityId: id,
  cargo: z.array(stackSchema),
  startedAt: z.string().datetime(),
  arrivesAt: z.string().datetime(),
  distance: z.number().finite().positive(),
  weight: z.number().finite().positive(),
  fee: z.number().int().nonnegative(),
  status: z.enum(['IN_TRANSIT', 'DELIVERED']),
});
export const storageStateSchema = z.object({
  warehouses: z.array(warehouseSchema),
  depot: z.array(depotBatchSchema),
  shipments: z.array(shipmentSchema),
  vehicles: z.array(vehicleSchema),
});
export const storageActionSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('EXPAND'),
      target: z.enum(['INVENTORY', 'WAREHOUSE']),
      cityId: id.optional(),
      currency: z.enum(['GOLD', 'GEM']),
    })
    .strict(),
  z
    .object({
      action: z.literal('TRANSFER'),
      cityId: id,
      direction: z.enum(['DEPOSIT', 'WITHDRAW']),
      itemId: id,
      quantity: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      action: z.literal('COLLECT'),
      cityId: id,
      itemId: id,
      quantity: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      action: z.literal('SHIP'),
      cityId: id,
      destinationCityId: id,
      itemId: id,
      quantity: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      action: z.literal('VEHICLE_CARGO'),
      cityId: id,
      vehicleId: id,
      direction: z.enum(['LOAD', 'UNLOAD']),
      itemId: id,
      quantity: z.number().int().positive(),
    })
    .strict(),
]);
export type ItemDefinition = z.infer<typeof itemDefinitionSchema>;
export type ItemStack = z.infer<typeof stackSchema>;
export type StorageInventory = z.infer<typeof storageInventorySchema>;
export type Warehouse = z.infer<typeof warehouseSchema>;
export type DepotBatch = z.infer<typeof depotBatchSchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;
export type Shipment = z.infer<typeof shipmentSchema>;
export type StorageState = z.infer<typeof storageStateSchema>;
export type StorageAction = z.infer<typeof storageActionSchema>;
export const depotNoticeSchema = z.object({
  stage: z.enum(['ARRIVED', 'D7', 'D3', 'D1', 'EXPIRED']),
  batchId: id,
  cityId: id,
  itemId: id,
  quantity: z.number().int().positive(),
  expiresAt: z.string().datetime(),
});
export type DepotNotice = z.infer<typeof depotNoticeSchema>;
export const emptyStorage = (): StorageState => ({
  warehouses: [],
  depot: [],
  shipments: [],
  vehicles: [],
});
