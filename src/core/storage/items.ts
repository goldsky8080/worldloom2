import { STORAGE_CONFIG as C } from './config';
import type { ItemDefinition, ItemStack, StorageInventory } from './schema';
/** Demo catalog values are deliberately small and replaceable, not final item balance. */
export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  copper: {
    id: 'copper',
    name: 'inventory.copper',
    category: 'resource',
    maxStack: 100,
    unitWeight: 2,
    assetId: 'item.copper',
  },
  ration: {
    id: 'ration',
    name: 'inventory.ration',
    category: 'consumable',
    maxStack: 20,
    unitWeight: 0.5,
    assetId: 'item.ration',
  },
  pickaxe: {
    id: 'pickaxe',
    name: 'inventory.pickaxe',
    category: 'equipment',
    maxStack: 1,
    unitWeight: 8,
    assetId: 'item.pickaxe',
  },
};
export function itemDefinition(id: string) {
  const d = Object.hasOwn(ITEM_DEFINITIONS, id) ? ITEM_DEFINITIONS[id] : undefined;
  if (!d) throw Error('storage.unknownItem');
  return d;
}
export function itemQuantity(items: readonly ItemStack[], id: string) {
  return items.filter((i) => i.id === id).reduce((n, i) => n + i.quantity, 0);
}
export function totalWeight(items: readonly ItemStack[]) {
  return items.reduce((n, i) => n + i.quantity * itemDefinition(i.id).unitWeight, 0);
}
export function slotLimit(s: { goldExpansion?: number; premiumExpansion?: number }) {
  return C.slots.base + (s.goldExpansion ?? 0) * C.slots.goldIncrement + (s.premiumExpansion ?? 0);
}
export function inventoryWeightLimit(s: StorageInventory) {
  return s.weightLimit ?? C.personalWeightLimit;
}
/** Immutable and atomic: fill existing stacks first, then allocate deterministic slot IDs. */
export function addItems(
  items: readonly ItemStack[],
  id: string,
  quantity: number,
  slots: number,
  weightLimit = Infinity,
): ItemStack[] {
  if (!Number.isInteger(quantity) || quantity <= 0) throw Error('storage.invalidQuantity');
  const d = itemDefinition(id),
    r = items.map((i) => ({ ...i }));
  if (totalWeight(r) + quantity * d.unitWeight > weightLimit + 1e-8)
    throw Error('storage.weightFull');
  let left = quantity;
  for (const i of r) {
    if (i.id !== id) continue;
    const n = Math.min(left, Math.max(0, d.maxStack - i.quantity));
    i.quantity += n;
    left -= n;
    if (!left) break;
  }
  const used = new Set(r.map((i) => i.slotId ?? i.id));
  while (left > 0) {
    if (r.length >= slots) throw Error('storage.slotsFull');
    let index = 1;
    while (used.has(id + '-' + index)) index++;
    const slotId = id + '-' + index,
      n = Math.min(left, d.maxStack);
    used.add(slotId);
    r.push({ id, slotId, nameKey: d.name, assetId: d.assetId, quantity: n });
    left -= n;
  }
  return r;
}
export function removeItems(
  items: readonly ItemStack[],
  id: string,
  quantity: number,
): ItemStack[] {
  itemDefinition(id);
  if (!Number.isInteger(quantity) || quantity <= 0) throw Error('storage.invalidQuantity');
  if (itemQuantity(items, id) < quantity) throw Error('storage.insufficientItems');
  let left = quantity;
  return items
    .map((i) => {
      if (i.id !== id || left <= 0) return { ...i };
      const n = Math.min(left, i.quantity);
      left -= n;
      return { ...i, quantity: i.quantity - n };
    })
    .filter((i) => i.quantity > 0);
}
export function fitQuantity(
  items: readonly ItemStack[],
  id: string,
  slots: number,
  weightLimit = Infinity,
) {
  const d = itemDefinition(id),
    stackSpace = items
      .filter((i) => i.id === id)
      .reduce((n, i) => n + Math.max(0, d.maxStack - i.quantity), 0),
    slotSpace = stackSpace + Math.max(0, slots - items.length) * d.maxStack,
    weightSpace =
      d.unitWeight === 0
        ? Infinity
        : Math.floor(Math.max(0, weightLimit - totalWeight(items) + 1e-8) / d.unitWeight);
  return Math.min(slotSpace, weightSpace);
}
