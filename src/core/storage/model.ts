import { STORAGE_CONFIG as C, PUBLIC_CITIES } from './config';
import {
  addItems,
  itemDefinition,
  removeItems,
  slotLimit,
  totalWeight,
  inventoryWeightLimit,
} from './items';
import {
  emptyStorage,
  type StorageState,
  type StorageInventory,
  type StorageAction,
  type DepotBatch,
  type DepotNotice,
  type Vehicle,
  type ItemStack,
} from './schema';
export { emptyStorage };
export function publicCity(id: string) {
  const city = PUBLIC_CITIES.find((c) => c.id === id);
  if (!city) throw Error('storage.invalidCity');
  return city;
}
export function cityAt(position: { x: number; y: number; movement?: unknown } | undefined) {
  if (!position || position.movement) return undefined;
  return PUBLIC_CITIES.find((c) => Math.hypot(position.x - c.x, position.y - c.y) <= C.cityRange);
}
export function createStorageFixture(): StorageState {
  return {
    warehouses: PUBLIC_CITIES.map((c) => ({
      cityId: c.id,
      goldExpansion: 0,
      premiumExpansion: 0,
      items:
        c.id === 'dawn'
          ? [
              {
                id: 'copper',
                slotId: 'warehouse-copper',
                nameKey: 'inventory.copper',
                assetId: 'item.copper',
                quantity: 80,
              },
            ]
          : [],
    })),
    depot: [],
    shipments: [],
    vehicles: [],
  };
}
export function expansionQuote(
  s: { goldExpansion?: number; premiumExpansion?: number },
  currency: 'GOLD' | 'GEM',
) {
  const gold = s.goldExpansion ?? 0,
    premium = s.premiumExpansion ?? 0;
  if (currency === 'GOLD') {
    if (gold >= C.slots.goldCosts.length) throw Error('storage.goldExpansionDone');
    return { cost: C.slots.goldCosts[gold], nextSlots: slotLimit(s) + C.slots.goldIncrement };
  }
  if (gold < C.slots.goldCosts.length) throw Error('storage.goldExpansionFirst');
  if (premium >= C.slots.premiumCosts.length) throw Error('storage.maxSlots');
  return { cost: C.slots.premiumCosts[premium], nextSlots: slotLimit(s) + 1 };
}
export function deliveryQuote(
  sourceId: string,
  destinationId: string,
  cargo: readonly ItemStack[],
) {
  const source = publicCity(sourceId),
    destination = publicCity(destinationId);
  if (source.id === destination.id) throw Error('storage.sameCity');
  const distance = Math.hypot(source.x - destination.x, source.y - destination.y),
    weight = totalWeight(cargo);
  if (weight <= 0) throw Error('storage.invalidQuantity');
  return quoteTransport(distance, weight);
}
export function quoteTransport(distance: number, weight: number, speed: number = C.transportSpeed) {
  if (
    !Number.isFinite(distance) ||
    distance <= 0 ||
    !Number.isFinite(weight) ||
    weight <= 0 ||
    !Number.isFinite(speed) ||
    speed <= 0
  )
    throw Error('storage.invalidRoute');
  const durationMs = (distance / speed) * 1000,
    fee = Math.max(
      C.minimumTransportFee,
      Math.round(
        ((durationMs / 60000) * weight * C.transportFeePerWeightMinute) / C.transportFeeRound,
      ) * C.transportFeeRound,
    );
  return { distance, weight, durationMs, fee };
}
export function createDepotBatch(
  id: string,
  cityId: string,
  itemId: string,
  quantity: number,
  arrivedAt: number,
  source: DepotBatch['source'],
): DepotBatch {
  publicCity(cityId);
  itemDefinition(itemId);
  if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(arrivedAt))
    throw Error('storage.invalidQuantity');
  return {
    id,
    cityId,
    itemId,
    quantity,
    arrivedAt: new Date(arrivedAt).toISOString(),
    expiresAt: new Date(arrivedAt + C.depotLifetimeMs).toISOString(),
    source,
    notices: [],
  };
}
export function createVehicle(
  id: string,
  ownerId: string,
  vehicleType: Vehicle['vehicleType'],
  cityId: string,
  capacity: number,
): Vehicle {
  publicCity(cityId);
  if (!id || !ownerId || !Number.isFinite(capacity) || capacity <= 0)
    throw Error('storage.invalidVehicle');
  return {
    id,
    ownerId,
    vehicleType,
    currentLocation: cityId,
    regionId: 'dawnwater',
    capacity,
    cargo: [],
    status: 'IDLE',
  };
}
export function advanceStorage(
  state: StorageState,
  now: number,
): { storage: StorageState; notices: DepotNotice[] } {
  if (!Number.isFinite(now)) throw Error('storage.invalidTime');
  let depot = state.depot.map((b) => ({ ...b, notices: [...b.notices] }));
  const shipments = state.shipments.map((s) => {
    if (s.status !== 'IN_TRANSIT' || Date.parse(s.arrivesAt) > now) return s;
    const arrived = Date.parse(s.arrivesAt);
    depot.push(
      ...s.cargo.map((i, index) =>
        createDepotBatch(
          s.id + ':' + index,
          s.destinationCityId,
          i.id,
          i.quantity,
          arrived,
          'NPC_LOGISTICS',
        ),
      ),
    );
    return { ...s, status: 'DELIVERED' as const };
  });
  const notices: DepotNotice[] = [];
  const notice = (b: DepotBatch, stage: DepotNotice['stage']) => {
    if (b.notices.includes(stage)) return;
    b.notices.push(stage);
    notices.push({
      stage,
      batchId: b.id,
      cityId: b.cityId,
      itemId: b.itemId,
      quantity: b.quantity,
      expiresAt: b.expiresAt,
    });
  };
  for (const b of depot) {
    if (Date.parse(b.arrivedAt) > now) continue;
    const expires = Date.parse(b.expiresAt);
    if (expires <= now) {
      notice(b, 'EXPIRED');
      continue;
    }
    notice(b, 'ARRIVED');
    for (const day of C.reminderDays)
      if (now >= expires - day * 86400000) notice(b, ('D' + day) as DepotNotice['stage']);
  }
  depot = depot.filter((b) => Date.parse(b.expiresAt) > now);
  return { storage: { ...state, shipments, depot }, notices };
}
export function collectFefo(
  state: StorageState,
  inventory: StorageInventory,
  cityId: string,
  itemId: string,
  quantity: number,
  now: number,
) {
  const eligible = state.depot
    .filter(
      (b) =>
        b.cityId === cityId &&
        b.itemId === itemId &&
        Date.parse(b.arrivedAt) <= now &&
        Date.parse(b.expiresAt) > now,
    )
    .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt) || a.id.localeCompare(b.id));
  if (!Number.isInteger(quantity) || quantity <= 0) throw Error('storage.invalidQuantity');
  if (eligible.reduce((n, b) => n + b.quantity, 0) < quantity)
    throw Error('storage.insufficientItems');
  const items = addItems(
    inventory.items,
    itemId,
    quantity,
    slotLimit(inventory),
    inventoryWeightLimit(inventory),
  );
  let left = quantity;
  const quantities = new Map<string, number>();
  for (const b of eligible) {
    const take = Math.min(left, b.quantity);
    quantities.set(b.id, b.quantity - take);
    left -= take;
    if (!left) break;
  }
  const depot = state.depot
    .map((b) => (quantities.has(b.id) ? { ...b, quantity: quantities.get(b.id)! } : b))
    .filter((b) => b.quantity > 0);
  return { storage: { ...state, depot }, inventory: { ...inventory, items } };
}
export function processStorageAction(
  state: StorageState,
  inventory: StorageInventory,
  action: StorageAction,
  context: { cityId?: string; ownerId: string; now: number; commandId: string },
) {
  let storage = state,
    inv = inventory;
  const local = (id: string | undefined) => {
    if (!id || context.cityId !== id) throw Error('storage.mustVisit');
    publicCity(id);
  };
  if (action.action === 'EXPAND') {
    const target =
      action.target === 'INVENTORY'
        ? inv
        : state.warehouses.find((w) => w.cityId === action.cityId);
    if (action.target === 'WAREHOUSE') local(action.cityId);
    if (!target) throw Error('storage.invalidCity');
    const quote = expansionQuote(target, action.currency);
    if (
      (action.currency === 'GOLD' && inv.gold < quote.cost) ||
      (action.currency === 'GEM' && (inv.gem ?? 0) < quote.cost)
    )
      throw Error('storage.insufficientFunds');
    inv = {
      ...inv,
      gold: inv.gold - (action.currency === 'GOLD' ? quote.cost : 0),
      gem: (inv.gem ?? 0) - (action.currency === 'GEM' ? quote.cost : 0),
    };
    const upgrade = {
      ...target,
      goldExpansion: (target.goldExpansion ?? 0) + (action.currency === 'GOLD' ? 1 : 0),
      premiumExpansion: (target.premiumExpansion ?? 0) + (action.currency === 'GEM' ? 1 : 0),
    };
    if (action.target === 'INVENTORY')
      inv = {
        ...inv,
        goldExpansion: upgrade.goldExpansion,
        premiumExpansion: upgrade.premiumExpansion,
      };
    else
      storage = {
        ...storage,
        warehouses: storage.warehouses.map((w) =>
          w.cityId === action.cityId ? (upgrade as typeof w) : w,
        ),
      };
  } else {
    local(action.cityId);
    if (action.action === 'COLLECT')
      return collectFefo(storage, inv, action.cityId, action.itemId, action.quantity, context.now);
    if (action.action === 'VEHICLE_CARGO') {
      const vehicle = state.vehicles.find((v) => v.id === action.vehicleId);
      if (
        !vehicle ||
        vehicle.ownerId !== context.ownerId ||
        vehicle.currentLocation !== action.cityId ||
        vehicle.regionId !== 'dawnwater' ||
        vehicle.status !== 'IDLE'
      )
        throw Error('storage.invalidVehicle');
      const loading = action.direction === 'LOAD',
        source = loading ? inv.items : vehicle.cargo;
      const removed = removeItems(source, action.itemId, action.quantity),
        added = addItems(
          loading ? vehicle.cargo : inv.items,
          action.itemId,
          action.quantity,
          loading ? Number.MAX_SAFE_INTEGER : slotLimit(inv),
          loading ? vehicle.capacity : inventoryWeightLimit(inv),
        );
      inv = { ...inv, items: loading ? removed : added };
      storage = {
        ...storage,
        vehicles: storage.vehicles.map((v) =>
          v.id === vehicle.id ? { ...v, cargo: loading ? added : removed } : v,
        ),
      };
    } else {
      const warehouse = state.warehouses.find((w) => w.cityId === action.cityId);
      if (!warehouse) throw Error('storage.invalidCity');
      if (action.action === 'TRANSFER') {
        const deposit = action.direction === 'DEPOSIT',
          removed = removeItems(
            deposit ? inv.items : warehouse.items,
            action.itemId,
            action.quantity,
          ),
          added = addItems(
            deposit ? warehouse.items : inv.items,
            action.itemId,
            action.quantity,
            deposit ? slotLimit(warehouse) : slotLimit(inv),
            deposit ? Infinity : inventoryWeightLimit(inv),
          );
        inv = { ...inv, items: deposit ? removed : added };
        storage = {
          ...storage,
          warehouses: storage.warehouses.map((w) =>
            w.cityId === warehouse.cityId ? { ...w, items: deposit ? added : removed } : w,
          ),
        };
      } else {
        const items = removeItems(warehouse.items, action.itemId, action.quantity);
        const cargo = addItems([], action.itemId, action.quantity, Number.MAX_SAFE_INTEGER);
        const quote = deliveryQuote(action.cityId, action.destinationCityId, cargo);
        if (inv.gold < quote.fee) throw Error('storage.insufficientFunds');
        inv = { ...inv, gold: inv.gold - quote.fee };
        storage = {
          ...storage,
          warehouses: storage.warehouses.map((w) =>
            w.cityId === warehouse.cityId ? { ...w, items } : w,
          ),
          shipments: [
            ...storage.shipments,
            {
              id: context.commandId,
              sourceCityId: action.cityId,
              destinationCityId: action.destinationCityId,
              cargo,
              startedAt: new Date(context.now).toISOString(),
              arrivesAt: new Date(context.now + quote.durationMs).toISOString(),
              distance: quote.distance,
              weight: quote.weight,
              fee: quote.fee,
              status: 'IN_TRANSIT',
            },
          ],
        };
      }
    }
  }
  return { storage, inventory: inv };
}
