// Every numeric gameplay value here is provisional, not production balance.
export const PROTOTYPE_CONFIG = {
  initial: {
    treasury: 10000,
    publicSentiment: 70,
    security: 70,
    prosperity: 60,
    aether: 12,
    monsterPressure: 18,
    garrison: 40,
  },
  aether: { basePerSecond: 0.6, perGrade: 0.12, unstable: 35, danger: 65, critical: 85 },
  pressure: { basePerSecond: 0.25, perGrade: 0.08, rising: 35, danger: 65, critical: 85 },
  castle: { baseCapacity: 80, capacityPerLevel: 40, recruitCost: 500, recruitCount: 20 },
  patrol: { cost: 250, requiredSoldiers: 10, duration: 6, reduction: 40 },
  raid: { preparation: 1, duration: 5, reduction: 35 },
  contract: { reward: 1000, acceptanceDelay: 3, preparation: 1, duration: 5, reduction: 50 },
  wave: {
    duration: 8,
    sentimentDamage: 5,
    securityDamage: 8,
    prosperityDamage: 3,
    historyLimit: 12,
  },
  dev: { aetherStep: 20, pressureStep: 20, treasuryStep: 5000, timeStep: 30 },
  forecast: { testSeconds: 30, designSeconds: 86400 },
  logLimit: 12,
} as const;
