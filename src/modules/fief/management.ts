import { PROTOTYPE_CONFIG as C } from './config';
import type { FiefState } from './model';
import { recordFief as record } from './history';
export const POLICY_IDS = [
  'RESIDENT_RELIEF',
  'COMMERCE_SUPPORT',
  'SECURITY_SUPPORT',
  'RECRUITMENT_SUPPORT',
  'RECONSTRUCTION',
] as const;
export type PolicyId = (typeof POLICY_IDS)[number];
export type TaxPolicy = 'LOW' | 'NORMAL' | 'HIGH';
export type StateMetric = 'security' | 'prosperity' | 'sentiment';
export interface SoldierState {
  healthy: number;
  wounded: number;
  deadTotal: number;
  standingAssigned: number;
  emergencyAssigned: number;
}
export interface RecruitmentState {
  status: 'NONE' | 'RECRUITING' | 'SUCCEEDED';
  count: number;
  cost: number;
  duration: number;
  elapsed: number;
}
export interface EmergencyState {
  status: 'NONE' | 'IN_PROGRESS' | 'SUCCEEDED';
  count: number;
  elapsed: number;
}
export interface ManagementState {
  soldiers: SoldierState;
  standingExposure: number;
  standingLosses: number;
  suppressionElapsed: number;
  woundedBatches: { count: number; remaining: number }[];
  recruitmentState: RecruitmentState;
  emergencyState: EmergencyState;
  recoveryTimers: Record<StateMetric, number>;
  economyElapsed: number;
  taxPolicy: TaxPolicy;
  taxCooldown: number;
  activePolicies: PolicyId[];
  policyCooldowns: Record<PolicyId, number>;
  economyReport: {
    revenue: number;
    soldierUpkeep: number;
    policyUpkeep: number;
    shortfall: number;
  };
}
const EPS = 1e-8;
const clean = (value: number) => {
  const v = Math.max(0, Math.min(100, value));
  for (const boundary of [
    0,
    C.territory.bands.unrest,
    C.saturation.rising,
    C.territory.bands.caution,
    C.saturation.danger,
    C.territory.bands.stable,
    C.saturation.critical,
    100,
  ])
    if (Math.abs(v - boundary) < EPS) return boundary;
  return v;
};
export function initialManagement(): ManagementState {
  return {
    soldiers: { ...C.initial.soldiers },
    standingExposure: 0,
    standingLosses: 0,
    suppressionElapsed: 0,
    woundedBatches: [],
    recruitmentState: { status: 'NONE', count: 0, cost: 0, duration: 0, elapsed: 0 },
    emergencyState: { status: 'NONE', count: 0, elapsed: 0 },
    recoveryTimers: { security: 0, prosperity: 0, sentiment: 0 },
    economyElapsed: 0,
    taxPolicy: 'NORMAL',
    taxCooldown: 0,
    activePolicies: [],
    policyCooldowns: Object.fromEntries(POLICY_IDS.map((id) => [id, 0])) as Record<
      PolicyId,
      number
    >,
    economyReport: { revenue: 0, soldierUpkeep: 0, policyUpkeep: 0, shortfall: 0 },
  };
}
export const livingSoldiers = (s: FiefState) => s.soldiers.healthy + s.soldiers.wounded;
export const availableGarrison = (s: FiefState) =>
  s.soldiers.healthy - s.soldiers.standingAssigned - s.soldiers.emergencyAssigned;
export const garrisonCapacity = (s: FiefState) =>
  C.castle.baseCapacity + (s.castleLevel - 1) * C.castle.capacityPerLevel;
export const policySlots = (s: FiefState) => C.policies.slots[s.manorLevel - 1];
export const maxRecruitment = (s: FiefState) =>
  C.recruitment.baseMax + (s.castleLevel - 1) * C.recruitment.maxPerLevel;
const validCount = (count: number) => Number.isInteger(count) && count > 0;
export function recruitmentQuote(s: FiefState, count: number) {
  const supported = s.activePolicies.includes('RECRUITMENT_SUPPORT');
  return {
    cost: Math.ceil(
      count *
        C.recruitment.costPerSoldier *
        (supported ? C.policies.definitions.RECRUITMENT_SUPPORT.costFactor : 1),
    ),
    duration:
      (C.recruitment.baseDuration + count * C.recruitment.secondsPerSoldier) *
      (supported ? C.policies.definitions.RECRUITMENT_SUPPORT.timeFactor : 1),
  };
}
export function canRecruit(s: FiefState, count: number = C.recruitment.defaultCount) {
  return (
    validCount(count) &&
    count <= maxRecruitment(s) &&
    s.recruitmentState.status !== 'RECRUITING' &&
    livingSoldiers(s) + count <= garrisonCapacity(s) &&
    s.treasury >= recruitmentQuote(s, count).cost
  );
}
export function recruitSoldiers(
  s: FiefState,
  count: number = C.recruitment.defaultCount,
): FiefState {
  if (!canRecruit(s, count)) return s;
  const q = recruitmentQuote(s, count);
  return record(
    {
      ...s,
      treasury: s.treasury - q.cost,
      recruitmentState: { status: 'RECRUITING', count, ...q, elapsed: 0 },
    },
    'recruitStarted',
  );
}
export function completeRecruitment(s: FiefState): FiefState {
  if (
    s.recruitmentState.status !== 'RECRUITING' ||
    s.recruitmentState.elapsed + EPS < s.recruitmentState.duration
  )
    return s;
  return record(
    {
      ...s,
      soldiers: { ...s.soldiers, healthy: s.soldiers.healthy + s.recruitmentState.count },
      recruitmentState: {
        ...s.recruitmentState,
        status: 'SUCCEEDED',
        elapsed: s.recruitmentState.duration,
      },
    },
    'recruit',
  );
}
export function canAssignStanding(s: FiefState, count: number) {
  return (
    Number.isInteger(count) &&
    count >= 0 &&
    count <= s.soldiers.healthy - s.soldiers.emergencyAssigned
  );
}
export function assignStanding(s: FiefState, count: number): FiefState {
  if (!canAssignStanding(s, count) || count === s.soldiers.standingAssigned) return s;
  return record({ ...s, soldiers: { ...s.soldiers, standingAssigned: count } }, 'standingChanged');
}
export const suppressionEfficiency = (saturation: number) =>
  Math.min(1, Math.max(0, saturation) / C.standing.efficiencyKnee);
export const standingEffect = (s: FiefState) =>
  s.soldiers.standingAssigned *
  C.standing.effectPerSoldier *
  suppressionEfficiency(s.monsterSaturation);
export function saturationRate(s: FiefState) {
  // Only the natural growth scales with dungeon design/test time, as in v0.2.
  const duration = s.mode === 'accelerated' ? C.cycle.testSeconds : C.cycle.designSeconds;
  return (
    ((C.saturation.basePerSecond +
      ['F', 'E', 'D', 'C', 'B', 'A', 'S'].indexOf(s.grade) * C.saturation.perGrade) *
      C.cycle.testSeconds) /
    duration
  );
}
function effectiveSaturation(s: FiefState) {
  // At a downward crossing, the next segment belongs to the lower band.
  return s.monsterSaturation - (saturationRate(s) - standingEffect(s) < 0 ? EPS : 0);
}
function saturationBand(s: FiefState) {
  const v = effectiveSaturation(s);
  return v >= C.saturation.critical
    ? 3
    : v >= C.saturation.danger
      ? 2
      : v >= C.saturation.rising
        ? 1
        : 0;
}
function exposureRate(s: FiefState) {
  return s.soldiers.standingAssigned * C.standing.exposureByBand[saturationBand(s)];
}
function lowCurve(s: FiefState) {
  return (
    s.monsterSaturation < C.standing.efficiencyKnee ||
    (s.monsterSaturation === C.standing.efficiencyKnee &&
      saturationRate(s) - standingEffect(s) <= 0)
  );
}
export function advanceSaturation(s: FiefState, seconds: number) {
  const a = saturationRate(s),
    b = (s.soldiers.standingAssigned * C.standing.effectPerSoldier) / C.standing.efficiencyKnee;
  return clean(
    lowCurve(s) && b > 0
      ? a / b + (s.monsterSaturation - a / b) * Math.exp(-b * seconds)
      : s.monsterSaturation + seconds * (a - standingEffect(s)),
  );
}
function saturationBoundary(s: FiefState) {
  const velocity = saturationRate(s) - standingEffect(s),
    v = s.monsterSaturation;
  if (Math.abs(velocity) < EPS) return Infinity;
  const targets = [0, C.saturation.rising, C.saturation.danger, C.saturation.critical, 100];
  const target =
    velocity > 0
      ? targets.find((t) => t > v + EPS)
      : [...targets].reverse().find((t) => t < v - EPS);
  if (target === undefined) return Infinity;
  const b = (s.soldiers.standingAssigned * C.standing.effectPerSoldier) / C.standing.efficiencyKnee;
  if (lowCurve(s) && b > 0) {
    const equilibrium = saturationRate(s) / b,
      ratio = (target - equilibrium) / (v - equilibrium);
    return ratio > 0 && ratio < 1 ? -Math.log(ratio) / b : Infinity;
  }
  return (target - v) / velocity;
}
export function emergencyCost(count: number) {
  return count * C.emergency.costPerSoldier;
}
export function canStartEmergency(s: FiefState, count: number) {
  return (
    validCount(count) &&
    count <= availableGarrison(s) &&
    s.emergencyState.status !== 'IN_PROGRESS' &&
    s.monsterSaturation > 0 &&
    s.treasury >= emergencyCost(count)
  );
}
export function startEmergency(s: FiefState, count: number): FiefState {
  if (!canStartEmergency(s, count)) return s;
  return record(
    {
      ...s,
      treasury: s.treasury - emergencyCost(count),
      soldiers: { ...s.soldiers, emergencyAssigned: count },
      emergencyState: { status: 'IN_PROGRESS', count, elapsed: 0 },
    },
    'emergencyStarted',
  );
}
function wound(s: FiefState, count: number): FiefState {
  if (count <= 0) return s;
  return {
    ...s,
    soldiers: { ...s.soldiers, wounded: s.soldiers.wounded + count },
    woundedBatches: [...s.woundedBatches, { count, remaining: C.soldiers.recoveryDuration }],
  };
}
export function completeEmergency(s: FiefState): FiefState {
  if (
    s.emergencyState.status !== 'IN_PROGRESS' ||
    s.emergencyState.elapsed + EPS < C.emergency.duration
  )
    return s;
  const count = s.emergencyState.count,
    dead = Math.floor(count * C.emergency.deadFraction),
    wounded = Math.min(count - dead, Math.ceil(count * C.emergency.woundedFraction));
  return record(
    wound(
      {
        ...s,
        monsterSaturation: clean(s.monsterSaturation - count * C.emergency.reductionPerSoldier),
        soldiers: {
          ...s.soldiers,
          healthy: s.soldiers.healthy - dead - wounded,
          deadTotal: s.soldiers.deadTotal + dead,
          emergencyAssigned: 0,
        },
        emergencyState: { ...s.emergencyState, status: 'SUCCEEDED', elapsed: C.emergency.duration },
      },
      wounded,
    ),
    'emergencyComplete',
  );
}
export function stateBand(value: number) {
  return value >= C.territory.bands.stable
    ? 'stateStable'
    : value >= C.territory.bands.caution
      ? 'stateCaution'
      : value >= C.territory.bands.unrest
        ? 'stateUnrest'
        : 'stateCrisis';
}
export function recoveryConditions(s: FiefState): Record<StateMetric, boolean> {
  const safe =
    effectiveSaturation(s) < C.saturation.rising &&
    !s.breakActive &&
    !s.waveState.some((w) => !w.damageApplied) &&
    availableGarrison(s) > 0;
  return {
    security: safe,
    prosperity: safe && s.security >= C.territory.bands.stable,
    sentiment:
      safe &&
      s.security >= C.territory.bands.stable &&
      (s.prosperity > C.territory.bands.unrest ||
        (s.prosperity === C.territory.bands.unrest &&
          (C.tax[s.taxPolicy].prosperityBurden === 0 ||
            s.recoveryTimers.prosperity + EPS >= C.territory.delays.prosperity))),
  };
}
export const resetStability = (s: FiefState): FiefState => ({
  ...s,
  recoveryTimers: { security: 0, prosperity: 0, sentiment: 0 },
});
function recoveryFactor(s: FiefState, metric: StateMetric) {
  let factor = metric === 'security' ? 1 : C.tax[s.taxPolicy].recoveryFactor;
  for (const id of s.activePolicies) {
    const d = C.policies.definitions[id];
    if ('recovery' in d && (d.recovery === metric || d.recovery === 'all')) factor *= d.factor;
  }
  return factor;
}
function metricValue(s: FiefState, metric: StateMetric) {
  return metric === 'sentiment' ? s.publicSentiment : s[metric];
}
export function territoryRates(s: FiefState): Record<StateMetric, number> {
  const saturation = effectiveSaturation(s),
    severity =
      saturation >= 100
        ? C.territory.severity.maximum
        : saturation >= C.saturation.critical
          ? C.territory.severity.critical
          : saturation >= C.saturation.danger
            ? C.territory.severity.danger
            : 0;
  const gates = recoveryConditions(s);
  return Object.fromEntries(
    (['security', 'prosperity', 'sentiment'] as const).map((metric) => {
      const recover =
        gates[metric] && s.recoveryTimers[metric] + EPS >= C.territory.delays[metric]
          ? C.territory.recovery[metric] *
            recoveryFactor(s, metric) *
            (metricValue(s, metric) >= C.territory.bands.stable ? C.territory.aboveStableFactor : 1)
          : 0;
      const burden =
        metric === 'security'
          ? 0
          : metric === 'sentiment'
            ? C.tax[s.taxPolicy].sentimentBurden
            : C.tax[s.taxPolicy].prosperityBurden;
      return [metric, recover - severity * C.territory.damage[metric] - burden];
    }),
  ) as Record<StateMetric, number>;
}
export function taxRevenue(s: FiefState) {
  return Math.floor(
    C.economy.baseRevenue *
      s.cityLevel *
      (C.economy.prosperityFloor + (C.economy.prosperityFactor * s.prosperity) / 100) *
      C.tax[s.taxPolicy].revenueFactor +
      EPS,
  );
}
export const soldierUpkeep = (s: FiefState) => livingSoldiers(s) * C.economy.upkeepPerLiving;
export const policyUpkeep = (s: FiefState) =>
  s.activePolicies.reduce((n, id) => n + C.policies.definitions[id].upkeep, 0);
export function canChangeTax(s: FiefState, tax: TaxPolicy) {
  return ['LOW', 'NORMAL', 'HIGH'].includes(tax) && tax !== s.taxPolicy && s.taxCooldown <= EPS;
}
export function changeTax(s: FiefState, tax: TaxPolicy): FiefState {
  return canChangeTax(s, tax)
    ? record({ ...s, taxPolicy: tax, taxCooldown: C.tax.cooldown }, 'taxChanged')
    : s;
}
export function canTogglePolicy(s: FiefState, id: PolicyId) {
  if (!POLICY_IDS.includes(id) || s.policyCooldowns[id] > EPS) return false;
  return (
    s.activePolicies.includes(id) ||
    (s.manorLevel >= C.policies.definitions[id].minLevel &&
      s.activePolicies.length < policySlots(s) &&
      s.treasury >= C.policies.definitions[id].upkeep)
  );
}
export function togglePolicy(s: FiefState, id: PolicyId): FiefState {
  if (!canTogglePolicy(s, id)) return s;
  return record(
    {
      ...s,
      activePolicies: s.activePolicies.includes(id)
        ? s.activePolicies.filter((p) => p !== id)
        : [...s.activePolicies, id],
      policyCooldowns: { ...s.policyCooldowns, [id]: C.policies.cooldown },
    },
    'policyChanged',
  );
}
export function managementBoundary(s: FiefState) {
  const gates = recoveryConditions(s),
    rates = territoryRates(s);
  const metricBoundaries = (['security', 'prosperity', 'sentiment'] as const).flatMap((metric) => {
    const value = metricValue(s, metric),
      rate = rates[metric];
    const target =
      rate > 0
        ? [C.territory.bands.unrest, C.territory.bands.caution, C.territory.bands.stable, 100].find(
            (t) => t > value + EPS,
          )
        : [C.territory.bands.stable, C.territory.bands.caution, C.territory.bands.unrest, 0].find(
            (t) => t < value - EPS,
          );
    return [
      gates[metric] && s.recoveryTimers[metric] < C.territory.delays[metric] - EPS
        ? C.territory.delays[metric] - s.recoveryTimers[metric]
        : Infinity,
      target !== undefined && Math.abs(rate) > EPS ? (target - value) / rate : Infinity,
    ];
  });
  return Math.min(
    saturationBoundary(s),
    C.economy.interval - s.economyElapsed,
    exposureRate(s) > 0
      ? (C.standing.exposureThreshold - s.standingExposure) / exposureRate(s)
      : Infinity,
    s.recruitmentState.status === 'RECRUITING'
      ? s.recruitmentState.duration - s.recruitmentState.elapsed
      : Infinity,
    s.emergencyState.status === 'IN_PROGRESS'
      ? C.emergency.duration - s.emergencyState.elapsed
      : Infinity,
    ...s.woundedBatches.map((b) => b.remaining),
    ...metricBoundaries,
  );
}
export function advanceManagement(s: FiefState, seconds: number): FiefState {
  const rates = territoryRates(s),
    gates = recoveryConditions(s);
  return {
    ...s,
    monsterSaturation: advanceSaturation(s, seconds),
    publicSentiment: clean(s.publicSentiment + seconds * rates.sentiment),
    security: clean(s.security + seconds * rates.security),
    prosperity: clean(s.prosperity + seconds * rates.prosperity),
    standingExposure: s.standingExposure + seconds * exposureRate(s),
    suppressionElapsed: s.suppressionElapsed + (s.soldiers.standingAssigned > 0 ? seconds : 0),
    woundedBatches: s.woundedBatches.map((b) => ({
      ...b,
      remaining: Math.max(0, b.remaining - seconds),
    })),
    recruitmentState:
      s.recruitmentState.status === 'RECRUITING'
        ? { ...s.recruitmentState, elapsed: s.recruitmentState.elapsed + seconds }
        : s.recruitmentState,
    emergencyState:
      s.emergencyState.status === 'IN_PROGRESS'
        ? { ...s.emergencyState, elapsed: s.emergencyState.elapsed + seconds }
        : s.emergencyState,
    recoveryTimers: Object.fromEntries(
      (['security', 'prosperity', 'sentiment'] as const).map((m) => [
        m,
        gates[m] ? Math.min(C.territory.delays[m], s.recoveryTimers[m] + seconds) : 0,
      ]),
    ) as Record<StateMetric, number>,
    economyElapsed: s.economyElapsed + seconds,
    taxCooldown: Math.max(0, s.taxCooldown - seconds),
    policyCooldowns: Object.fromEntries(
      POLICY_IDS.map((id) => [id, Math.max(0, s.policyCooldowns[id] - seconds)]),
    ) as Record<PolicyId, number>,
  };
}
export function finishManagement(s: FiefState): FiefState {
  let r = s;
  const healed = r.woundedBatches
    .filter((b) => b.remaining <= EPS)
    .reduce((n, b) => n + b.count, 0);
  if (healed > 0)
    r = record(
      {
        ...r,
        soldiers: {
          ...r.soldiers,
          healthy: r.soldiers.healthy + healed,
          wounded: r.soldiers.wounded - healed,
        },
        woundedBatches: r.woundedBatches.filter((b) => b.remaining > EPS),
      },
      'soldiersRecovered',
    );
  r = completeRecruitment(r);
  r = completeEmergency(r);
  while (
    r.standingExposure + EPS >= C.standing.exposureThreshold &&
    r.soldiers.standingAssigned > 0
  ) {
    const losses = r.standingLosses + 1,
      dead = losses % C.standing.deathEvery === 0;
    r = record(
      wound(
        {
          ...r,
          standingLosses: losses,
          standingExposure: Math.max(0, r.standingExposure - C.standing.exposureThreshold),
          soldiers: {
            ...r.soldiers,
            healthy: r.soldiers.healthy - 1,
            standingAssigned: r.soldiers.standingAssigned - 1,
            deadTotal: r.soldiers.deadTotal + (dead ? 1 : 0),
          },
        },
        dead ? 0 : 1,
      ),
      'standingCasualty',
    );
  }
  if (r.economyElapsed + EPS >= C.economy.interval) {
    const revenue = taxRevenue(r),
      upkeep = soldierUpkeep(r),
      funds = r.treasury + revenue,
      paid = Math.min(funds, upkeep);
    let treasury = funds - paid,
      policies = r.activePolicies,
      policyCost = policyUpkeep(r),
      shortfall = upkeep - paid;
    if (treasury < policyCost) {
      shortfall += policyCost - treasury;
      policies = [];
      policyCost = 0;
      r = record(r, 'policySuspended');
    }
    treasury -= policyCost;
    r = record(
      {
        ...r,
        treasury,
        activePolicies: policies,
        economyElapsed: Math.max(0, r.economyElapsed - C.economy.interval),
        economyReport: { revenue, soldierUpkeep: paid, policyUpkeep: policyCost, shortfall },
      },
      'economyTick',
    );
  }
  // Clear stability immediately when a boundary changes its prerequisite.
  const gates = recoveryConditions(r);
  return {
    ...r,
    recoveryTimers: {
      security: gates.security ? r.recoveryTimers.security : 0,
      prosperity: gates.prosperity ? r.recoveryTimers.prosperity : 0,
      sentiment: gates.sentiment ? r.recoveryTimers.sentiment : 0,
    },
  };
}
