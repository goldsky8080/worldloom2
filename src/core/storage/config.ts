/** Economic values specified by the checkpoint; item weights, speed and demo capacity are prototype values. */
export const STORAGE_CONFIG = {
  incomeGoldPerMinute: 10,
  slots: {
    base: 20,
    goldIncrement: 3,
    goldCosts: [300, 600, 1200, 2400, 4800, 9600],
    premiumIncrement: 1,
    premiumCosts: Array.from({ length: 12 }, (_, i) => 15 + 5 * i),
    maximum: 50,
  },
  personalWeightLimit: 120,
  transportSpeed: 60,
  transportFeePerWeightMinute: 0.02,
  minimumTransportFee: 20,
  transportFeeRound: 10,
  depotLifetimeMs: 30 * 86400000,
  reminderDays: [7, 3, 1],
  cityRange: 30,
} as const;
export const PUBLIC_CITIES = [
  { id: 'dawn', nameKey: 'storage.city.dawn', x: 870, y: 980 },
  { id: 'harbor', nameKey: 'storage.city.harbor', x: 1700, y: 1050 },
] as const;
