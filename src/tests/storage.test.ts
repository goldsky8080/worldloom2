import { describe, it, expect } from 'vitest';
import { STORAGE_CONFIG as C } from '../core/storage/config';
import {
  ITEM_DEFINITIONS,
  addItems,
  removeItems,
  totalWeight,
  slotLimit,
  itemQuantity,
  fitQuantity,
} from '../core/storage/items';
import {
  createStorageFixture,
  expansionQuote,
  processStorageAction,
  createDepotBatch,
  advanceStorage,
  quoteTransport,
  deliveryQuote,
  createVehicle,
  cityAt,
} from '../core/storage/model';
import {
  itemDefinitionSchema,
  storageActionSchema,
  type StorageInventory,
  type StorageState,
  type ItemStack,
  type StorageAction,
} from '../core/storage/schema';
const now = Date.parse('2026-09-19T00:00:00Z'),
  day = 86400000;
const stack = (id: string, quantity: number, slotId = id): ItemStack => ({
  id,
  quantity,
  slotId,
  nameKey: ITEM_DEFINITIONS[id].name,
  assetId: ITEM_DEFINITIONS[id].assetId,
});
const inv = (): StorageInventory => ({
  gold: 25000,
  gem: 600,
  items: [stack('copper', 12)],
  goldExpansion: 0,
  premiumExpansion: 0,
  weightLimit: 120,
});
const context = { cityId: 'dawn', ownerId: 'owner', now, commandId: 'shipment' };
const act = (s: StorageState, i: StorageInventory, a: StorageAction, c = context) =>
  processStorageAction(s, i, a, c);
describe('common item stacks, slots and weight', () => {
  it('defines category, maxStack and unitWeight on every catalog entry', () => {
    for (const d of Object.values(ITEM_DEFINITIONS))
      expect(itemDefinitionSchema.safeParse(d).success).toBe(true);
  });
  it('fills existing stacks before allocating new slots without mutating source', () => {
    const input = [stack('copper', 90, 'a'), stack('copper', 20, 'b')],
      result = addItems(input, 'copper', 130, 4);
    expect(result.map((i) => i.quantity)).toEqual([100, 100, 40]);
    expect(input.map((i) => i.quantity)).toEqual([90, 20]);
    expect(new Set(result.map((i) => i.slotId)).size).toBe(3);
  });
  it('keeps equipment in one-item slots', () =>
    expect(addItems([], 'pickaxe', 3, 3).map((i) => i.quantity)).toEqual([1, 1, 1]));
  it('accepts exact slot capacity and exact weight limit', () =>
    expect(addItems([], 'copper', 60, 1, 120)[0].quantity).toBe(60));
  it('rejects overflow atomically even after partially filling a stack', () => {
    const input = [stack('copper', 99)];
    expect(() => addItems(input, 'copper', 2, 1)).toThrow('storage.slotsFull');
    expect(input[0].quantity).toBe(99);
  });
  it('rejects weight before allocation and counts all items', () => {
    expect(totalWeight([stack('copper', 3), stack('ration', 2), stack('pickaxe', 1)])).toBe(15);
    expect(() => addItems([], 'copper', 61, 20, 120)).toThrow('storage.weightFull');
  });
  it('removes across stacks and discards empty slots', () => {
    const input = [stack('copper', 100, 'a'), stack('copper', 20, 'b')];
    expect(removeItems(input, 'copper', 110)).toEqual([stack('copper', 10, 'b')]);
    expect(input[0].quantity).toBe(100);
  });
  it.each([0, -1, 1.5, Infinity, NaN])('rejects invalid quantity %s', (q) => {
    expect(() => addItems([], 'copper', q, 20)).toThrow();
    expect(() => removeItems([stack('copper', 10)], 'copper', q)).toThrow();
  });
  it('rejects unknown and prototype property item IDs', () => {
    for (const id of ['missing', '__proto__', 'constructor'])
      expect(() => addItems([], id, 1, 20)).toThrow('storage.unknownItem');
  });
  it('reports fitting quantities limited by stack space and weight', () => {
    expect(fitQuantity([stack('copper', 90)], 'copper', 1)).toBe(10);
    expect(fitQuantity([stack('copper', 50)], 'copper', 20, 120)).toBe(10);
  });
});
describe('sequential, independent capacity expansions', () => {
  it('applies the six Gold steps and twelve premium steps to reach 50 slots', () => {
    let s = createStorageFixture(),
      i = inv();
    const limits: number[] = [];
    for (let n = 0; n < 6; n++) {
      ({ storage: s, inventory: i } = act(s, i, {
        action: 'EXPAND',
        target: 'INVENTORY',
        currency: 'GOLD',
      }));
      limits.push(slotLimit(i));
    }
    expect(limits).toEqual([23, 26, 29, 32, 35, 38]);
    expect(i.gold).toBe(6100);
    for (let n = 0; n < 12; n++)
      ({ storage: s, inventory: i } = act(s, i, {
        action: 'EXPAND',
        target: 'INVENTORY',
        currency: 'GEM',
      }));
    expect(slotLimit(i)).toBe(50);
    expect(i.gem).toBe(90);
    expect(C.slots.premiumCosts.reduce((a, b) => a + b, 0)).toBe(510);
    expect(() => act(s, i, { action: 'EXPAND', target: 'INVENTORY', currency: 'GEM' })).toThrow(
      'storage.maxSlots',
    );
    expect(() => act(s, i, { action: 'EXPAND', target: 'INVENTORY', currency: 'GOLD' })).toThrow(
      'storage.goldExpansionDone',
    );
  });
  it('does not permit premium expansion before all Gold steps', () =>
    expect(() => expansionQuote(inv(), 'GEM')).toThrow('storage.goldExpansionFirst'));
  it('does not change funds or capacity when unaffordable', () => {
    const i = { ...inv(), gold: 299 };
    expect(() =>
      act(createStorageFixture(), i, { action: 'EXPAND', target: 'INVENTORY', currency: 'GOLD' }),
    ).toThrow('storage.insufficientFunds');
    expect(i.gold).toBe(299);
    expect(slotLimit(i)).toBe(20);
  });
  it('expands each city independently without altering personal or other city slots', () => {
    const s = createStorageFixture(),
      i = inv(),
      r = act(s, i, { action: 'EXPAND', target: 'WAREHOUSE', cityId: 'dawn', currency: 'GOLD' });
    expect(slotLimit(r.storage.warehouses[0])).toBe(23);
    expect(slotLimit(r.storage.warehouses[1])).toBe(20);
    expect(slotLimit(r.inventory)).toBe(20);
    expect(s.warehouses[0].goldExpansion).toBe(0);
  });
  it('requires actual city arrival for warehouse expansion', () =>
    expect(() =>
      act(createStorageFixture(), inv(), {
        action: 'EXPAND',
        target: 'WAREHOUSE',
        cityId: 'harbor',
        currency: 'GOLD',
      }),
    ).toThrow('storage.mustVisit'));
});
describe('public warehouse transfers and visits', () => {
  it('treats stopped exact city range as local and movement as unavailable', () => {
    expect(cityAt({ x: 900, y: 980 })?.id).toBe('dawn');
    expect(cityAt({ x: 900.01, y: 980 })).toBeUndefined();
    expect(cityAt({ x: 870, y: 980, movement: {} })).toBeUndefined();
  });
  it('atomically deposits and withdraws with conservation', () => {
    const s = createStorageFixture(),
      i = inv(),
      r = act(s, i, {
        action: 'TRANSFER',
        cityId: 'dawn',
        direction: 'DEPOSIT',
        itemId: 'copper',
        quantity: 10,
      });
    expect(itemQuantity(r.inventory.items, 'copper')).toBe(2);
    expect(itemQuantity(r.storage.warehouses[0].items, 'copper')).toBe(90);
    const back = act(r.storage, r.inventory, {
      action: 'TRANSFER',
      cityId: 'dawn',
      direction: 'WITHDRAW',
      itemId: 'copper',
      quantity: 10,
    });
    expect(itemQuantity(back.inventory.items, 'copper')).toBe(12);
    expect(itemQuantity(back.storage.warehouses[0].items, 'copper')).toBe(80);
  });
  it('has no warehouse weight limit, while receiving inventory does', () => {
    const s = createStorageFixture(),
      i = { ...inv(), weightLimit: 1, items: [stack('copper', 60)] };
    const r = act(s, i, {
      action: 'TRANSFER',
      cityId: 'dawn',
      direction: 'DEPOSIT',
      itemId: 'copper',
      quantity: 60,
    });
    expect(totalWeight(r.storage.warehouses[0].items)).toBe(280);
    expect(() =>
      act(r.storage, r.inventory, {
        action: 'TRANSFER',
        cityId: 'dawn',
        direction: 'WITHDRAW',
        itemId: 'copper',
        quantity: 1,
      }),
    ).toThrow('storage.weightFull');
    expect(itemQuantity(r.storage.warehouses[0].items, 'copper')).toBe(140);
  });
  it('rejects remote transfers and nonexistent cities', () => {
    expect(() =>
      act(createStorageFixture(), inv(), {
        action: 'TRANSFER',
        cityId: 'harbor',
        direction: 'WITHDRAW',
        itemId: 'copper',
        quantity: 1,
      }),
    ).toThrow('storage.mustVisit');
  });
  it('checks receiving slot capacity without deducting source items', () => {
    const s = createStorageFixture(),
      i = {
        ...inv(),
        items: Array.from({ length: 20 }, (_, n) => stack('pickaxe', 1, 'tool-' + n)),
        weightLimit: 1000,
      };
    expect(() =>
      act(s, i, {
        action: 'TRANSFER',
        cityId: 'dawn',
        direction: 'WITHDRAW',
        itemId: 'copper',
        quantity: 1,
      }),
    ).toThrow('storage.slotsFull');
    expect(itemQuantity(s.warehouses[0].items, 'copper')).toBe(80);
  });
});
describe('transaction depot batches, FEFO and Mail notices', () => {
  const batches = () => [
    createDepotBatch('later', 'dawn', 'copper', 8, now + day, 'MARKET'),
    createDepotBatch('earlier', 'dawn', 'copper', 5, now, 'SYSTEM'),
  ];
  it('retains independent expiry dates and receives earliest expiry first', () => {
    const s = { ...createStorageFixture(), depot: batches() },
      r = act(
        s,
        inv(),
        { action: 'COLLECT', cityId: 'dawn', itemId: 'copper', quantity: 7 },
        { ...context, now: now + 2 * day },
      );
    expect(r.storage.depot).toHaveLength(1);
    expect(r.storage.depot[0]).toMatchObject({
      id: 'later',
      quantity: 6,
      expiresAt: new Date(now + 31 * day).toISOString(),
    });
    expect(itemQuantity(r.inventory.items, 'copper')).toBe(19);
    expect(s.depot[1].quantity).toBe(5);
  });
  it('uses unlimited depot capacity while enforcing personal capacity on collection', () => {
    const s = {
      ...createStorageFixture(),
      depot: [createDepotBatch('bulk', 'dawn', 'copper', 10000, now, 'SYSTEM')],
    };
    expect(() =>
      act(s, inv(), { action: 'COLLECT', cityId: 'dawn', itemId: 'copper', quantity: 100 }),
    ).toThrow('storage.weightFull');
    expect(s.depot[0].quantity).toBe(10000);
    expect(
      act(s, inv(), { action: 'COLLECT', cityId: 'dawn', itemId: 'copper', quantity: 1 }).storage
        .depot[0].quantity,
    ).toBe(9999);
  });
  it('requires local city and cannot collect future or expired goods', () => {
    for (const time of [now - day, now + 30 * day])
      expect(() =>
        act(
          {
            ...createStorageFixture(),
            depot: [createDepotBatch('b', 'dawn', 'copper', 10, now, 'SYSTEM')],
          },
          inv(),
          { action: 'COLLECT', cityId: 'dawn', itemId: 'copper', quantity: 1 },
          { ...context, now: time },
        ),
      ).toThrow('storage.insufficientItems');
    expect(() =>
      act({ ...createStorageFixture(), depot: batches() }, inv(), {
        action: 'COLLECT',
        cityId: 'harbor',
        itemId: 'copper',
        quantity: 1,
      }),
    ).toThrow('storage.mustVisit');
  });
  it('does not allow depot goods to be shipped without collection and warehouse deposit', () => {
    const s = {
      ...createStorageFixture(),
      depot: [createDepotBatch('b', 'dawn', 'ration', 10, now, 'MARKET')],
    };
    expect(() =>
      act(s, inv(), {
        action: 'SHIP',
        cityId: 'dawn',
        destinationCityId: 'harbor',
        itemId: 'ration',
        quantity: 1,
      }),
    ).toThrow('storage.insufficientItems');
  });
  it('notifies arrival, 7/3/1 days and expiry exactly once', () => {
    let s = {
      ...createStorageFixture(),
      depot: [createDepotBatch('b', 'dawn', 'copper', 10, now, 'SYSTEM')],
    };
    for (const [elapsed, stage] of [
      [0, 'ARRIVED'],
      [23, 'D7'],
      [27, 'D3'],
      [29, 'D1'],
      [30, 'EXPIRED'],
    ] as const) {
      const r = advanceStorage(s, now + elapsed * day);
      expect(r.notices.map((n) => n.stage)).toEqual([stage]);
      s = r.storage;
      expect(advanceStorage(s, now + elapsed * day).notices).toEqual([]);
    }
    expect(s.depot).toEqual([]);
  });
  it('reports remaining quantity after partial receipt and never notifies a fully claimed batch', () => {
    const s = {
      ...createStorageFixture(),
      depot: [createDepotBatch('b', 'dawn', 'copper', 10, now, 'SYSTEM')],
    };
    const r = act(s, inv(), { action: 'COLLECT', cityId: 'dawn', itemId: 'copper', quantity: 4 });
    expect(
      advanceStorage(r.storage, now + 23 * day).notices.find((n) => n.stage === 'D7')?.quantity,
    ).toBe(6);
    const full = act(r.storage, r.inventory, {
      action: 'COLLECT',
      cityId: 'dawn',
      itemId: 'copper',
      quantity: 6,
    });
    expect(advanceStorage(full.storage, now + 30 * day).notices).toEqual([]);
  });
  it('expires exactly at 30 days without replaying obsolete reminders after a long time jump', () => {
    const s = {
      ...createStorageFixture(),
      depot: [createDepotBatch('b', 'dawn', 'copper', 10, now, 'SYSTEM')],
    };
    const r = advanceStorage(s, now + 60 * day);
    expect(r.storage.depot).toEqual([]);
    expect(r.notices.map((n) => n.stage)).toEqual(['EXPIRED']);
  });
});
describe('fixed-speed NPC logistics and independent vehicle cargo', () => {
  it('uses distance/speed and the minute-weight fee, minimum and nearest 10G', () => {
    expect(quoteTransport(3600, 100, 1)).toEqual({
      distance: 3600,
      weight: 100,
      durationMs: 3600000,
      fee: 120,
    });
    expect(quoteTransport(30, 1).fee).toBe(20);
    expect(quoteTransport(3600, 104, 1).fee).toBe(120);
    expect(quoteTransport(3600, 105, 1).fee).toBe(130);
  });
  it('keeps delivery speed identical for different cargo weights', () => {
    const a = deliveryQuote('dawn', 'harbor', [stack('copper', 1)]),
      b = deliveryQuote('dawn', 'harbor', [stack('copper', 80)]);
    expect(a.durationMs).toBe(b.durationMs);
    expect(a.distance).toBeCloseTo(Math.hypot(830, 70));
  });
  it('rejects invalid routes, weights and speeds', () => {
    for (const v of [
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
      [Infinity, 1, 1],
      [-1, 1, 1],
    ])
      expect(() => quoteTransport(...(v as [number, number, number]))).toThrow(
        'storage.invalidRoute',
      );
    expect(() => deliveryQuote('dawn', 'dawn', [stack('copper', 1)])).toThrow('storage.sameCity');
  });
  it('deducts fee and source once, has no vehicle requirement, and delivers only to destination depot', () => {
    const r = act(createStorageFixture(), inv(), {
      action: 'SHIP',
      cityId: 'dawn',
      destinationCityId: 'harbor',
      itemId: 'copper',
      quantity: 20,
    });
    expect(r.inventory.gold).toBe(24980);
    expect(itemQuantity(r.storage.warehouses[0].items, 'copper')).toBe(60);
    expect(r.storage.vehicles).toEqual([]);
    const shipment = r.storage.shipments[0],
      arrival = Date.parse(shipment.arrivesAt);
    expect(advanceStorage(r.storage, arrival - 1).storage.depot).toEqual([]);
    const done = advanceStorage(r.storage, arrival);
    expect(done.storage.depot[0]).toMatchObject({
      cityId: 'harbor',
      quantity: 20,
      source: 'NPC_LOGISTICS',
      arrivedAt: shipment.arrivesAt,
    });
    expect(done.storage.warehouses[1].items).toEqual([]);
    expect(advanceStorage(done.storage, arrival + 10000).storage.depot).toHaveLength(1);
  });
  it('dates expiry from actual delivery time even when processing late', () => {
    const r = act(createStorageFixture(), inv(), {
      action: 'SHIP',
      cityId: 'dawn',
      destinationCityId: 'harbor',
      itemId: 'copper',
      quantity: 20,
    });
    const delivered = Date.parse(r.storage.shipments[0].arrivesAt),
      done = advanceStorage(r.storage, delivered + 2 * day);
    expect(done.storage.depot[0].expiresAt).toBe(new Date(delivered + 30 * day).toISOString());
    expect(advanceStorage(r.storage, delivered + 31 * day).storage.depot).toEqual([]);
  });
  it('is atomic when funds are insufficient', () => {
    const s = createStorageFixture(),
      i = { ...inv(), gold: 19 };
    expect(() =>
      act(s, i, {
        action: 'SHIP',
        cityId: 'dawn',
        destinationCityId: 'harbor',
        itemId: 'copper',
        quantity: 20,
      }),
    ).toThrow('storage.insufficientFunds');
    expect(s.shipments).toEqual([]);
    expect(itemQuantity(s.warehouses[0].items, 'copper')).toBe(80);
  });
  it('models a regional vehicle asset independent from inventory, with caller-specified capacity', () => {
    const vehicle = createVehicle('cart', 'owner', 'CART', 'dawn', 20),
      s = { ...createStorageFixture(), vehicles: [vehicle] };
    const r = act(s, inv(), {
      action: 'VEHICLE_CARGO',
      cityId: 'dawn',
      vehicleId: 'cart',
      direction: 'LOAD',
      itemId: 'copper',
      quantity: 10,
    });
    expect(itemQuantity(r.inventory.items, 'copper')).toBe(2);
    expect(totalWeight(r.storage.vehicles[0].cargo)).toBe(20);
    expect(() =>
      act(r.storage, r.inventory, {
        action: 'VEHICLE_CARGO',
        cityId: 'dawn',
        vehicleId: 'cart',
        direction: 'LOAD',
        itemId: 'copper',
        quantity: 1,
      }),
    ).toThrow('storage.weightFull');
    const back = act(r.storage, r.inventory, {
      action: 'VEHICLE_CARGO',
      cityId: 'dawn',
      vehicleId: 'cart',
      direction: 'UNLOAD',
      itemId: 'copper',
      quantity: 10,
    });
    expect(itemQuantity(back.inventory.items, 'copper')).toBe(12);
    expect(back.storage.vehicles[0].cargo).toEqual([]);
  });
  it('rejects cargo use from another owner, location, region or while travelling', () => {
    const vehicle = createVehicle('cart', 'owner', 'CART', 'dawn', 20);
    for (const patch of [
      { ownerId: 'other' },
      { currentLocation: 'harbor' },
      { regionId: 'other' },
      { status: 'IN_TRANSIT' as const },
    ]) {
      expect(() =>
        act({ ...createStorageFixture(), vehicles: [{ ...vehicle, ...patch }] }, inv(), {
          action: 'VEHICLE_CARGO',
          cityId: 'dawn',
          vehicleId: 'cart',
          direction: 'LOAD',
          itemId: 'copper',
          quantity: 1,
        }),
      ).toThrow('storage.invalidVehicle');
    }
  });
  it('rejects client-supplied fee, arrival or capacity overrides at contract boundary', () => {
    expect(
      storageActionSchema.safeParse({
        action: 'SHIP',
        cityId: 'dawn',
        destinationCityId: 'harbor',
        itemId: 'copper',
        quantity: 1,
        fee: 0,
      }).success,
    ).toBe(false);
  });
});
