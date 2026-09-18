import { recordFief as record } from './history';
import {
  initialManagement,
  advanceManagement,
  finishManagement,
  managementBoundary,
  resetStability,
  availableGarrison,
  garrisonCapacity,
  policySlots,
  type ManagementState,
} from './management';
export * from './management';
import { PROTOTYPE_CONFIG as CONFIG } from './config';
export { PROTOTYPE_CONFIG } from './config';
export const GRADES = ['F', 'E', 'D', 'C', 'B', 'A', 'S'] as const;
export type DungeonGrade = (typeof GRADES)[number];
export type Facility = 'castle' | 'city' | 'manor' | 'dungeon';
export type Level = 1 | 2 | 3 | 4 | 5;
export type TestMode = 'accelerated' | 'design';
export type DungeonStatus = 'stable' | 'unstable' | 'danger' | 'critical' | 'break';
export const DESIGN_CYCLE_SECONDS = CONFIG.cycle.designSeconds;
export const TEST_CYCLE_SECONDS = CONFIG.cycle.testSeconds;
export const TEST_RULES = {
  raidReduction: CONFIG.raid.reduction,
  forecastSeconds: CONFIG.forecast.testSeconds,
  maxLog: CONFIG.logLimit,
} as const;
const ranges: Record<Level, readonly DungeonGrade[]> = {
  1: ['F', 'E', 'D'],
  2: ['D', 'C'],
  3: ['D', 'C', 'B'],
  4: ['C', 'B', 'A'],
  5: ['B', 'A', 'S'],
};
export function gradeRange(level: Level) {
  return ranges[level];
}
export function gradeForCycle(level: Level, cycle: number): DungeonGrade {
  const allowed = gradeRange(level);
  return allowed[(cycle - 1) % allowed.length];
}
export function dungeonStatus(aether: number): DungeonStatus {
  return aether >= 100
    ? 'break'
    : aether >= CONFIG.aether.critical
      ? 'critical'
      : aether >= CONFIG.aether.danger
        ? 'danger'
        : aether >= CONFIG.aether.unstable
          ? 'unstable'
          : 'stable';
}
export function saturationStatus(saturation: number) {
  return saturation >= CONFIG.saturation.critical
    ? 'saturationCritical'
    : saturation >= CONFIG.saturation.danger
      ? 'saturationDanger'
      : saturation >= CONFIG.saturation.rising
        ? 'saturationRising'
        : 'saturationStable';
}
export interface TimedState<S extends string> {
  status: S;
  elapsed: number;
}
export type RaidState = TimedState<'NONE' | 'PREPARING' | 'IN_PROGRESS' | 'SUCCEEDED'>;
export type ContractState = TimedState<
  'NONE' | 'POSTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'SUCCEEDED'
>;
export interface MonsterWave {
  id: number;
  status: 'TRAVELLING' | 'ARRIVED';
  elapsed: number;
  count: number;
  damageApplied: boolean;
}
export interface FiefLog {
  id: number;
  kind:
    | 'cycle'
    | 'raid'
    | 'break'
    | 'recruit'
    | 'recruitStarted'
    | 'standingChanged'
    | 'standingCasualty'
    | 'emergencyStarted'
    | 'emergencyComplete'
    | 'soldiersRecovered'
    | 'taxChanged'
    | 'policyChanged'
    | 'policySuspended'
    | 'economyTick'
    | 'raidStarted'
    | 'contractPosted'
    | 'contractAccepted'
    | 'contractComplete'
    | 'waveDamage';
  cycle: number;
  grade: DungeonGrade;
  aether: number;
}
export interface FiefState extends ManagementState {
  id: string;
  dungeonId: string;
  cityLevel: Level;
  castleLevel: Level;
  manorLevel: Level;
  cycle: number;
  elapsed: number;
  grade: DungeonGrade;
  aether: number;
  breaks: number;
  raids: number;
  mode: TestMode;
  log: FiefLog[];
  nextLogId: number;
  treasury: number;
  publicSentiment: number;
  security: number;
  prosperity: number;
  monsterSaturation: number;
  breakActive: boolean;
  raidState: RaidState;
  contractState: ContractState;
  waveState: MonsterWave[];
  contractsSucceeded: number;
}
export function initialFief(): FiefState {
  return {
    id: 'fief-demo-01',
    dungeonId: 'dungeon-ancient-palace',
    cityLevel: 1,
    castleLevel: 1,
    manorLevel: 1,
    cycle: 1,
    elapsed: 0,
    grade: 'F',
    breaks: 0,
    raids: 0,
    mode: 'accelerated',
    log: [],
    nextLogId: 1,
    ...CONFIG.initial,
    ...initialManagement(),
    breakActive: false,
    raidState: { status: 'NONE', elapsed: 0 },
    contractState: { status: 'NONE', elapsed: 0 },
    waveState: [],
    contractsSucceeded: 0,
  };
}
export function cycleDuration(mode: TestMode) {
  return mode === 'accelerated' ? TEST_CYCLE_SECONDS : DESIGN_CYCLE_SECONDS;
}
export function remainingSeconds(state: FiefState) {
  return Math.max(0, cycleDuration(state.mode) - state.elapsed);
}
export function nextGrade(state: FiefState) {
  return gradeForCycle(state.cityLevel, state.cycle + 1);
}
export function forecastReady(state: FiefState) {
  return (
    remainingSeconds(state) <=
    (state.mode === 'accelerated' ? CONFIG.forecast.testSeconds : CONFIG.forecast.designSeconds)
  );
}
const bounded = (value: number) => {
  const result = Math.min(100, Math.max(0, value));
  return result > 100 - 1e-8 ? 100 : result;
};
const EPSILON = 1e-8;
export function aetherRate(state: FiefState) {
  return (
    ((CONFIG.aether.basePerSecond + GRADES.indexOf(state.grade) * CONFIG.aether.perGrade) *
      TEST_CYCLE_SECONDS) /
    cycleDuration(state.mode)
  );
}
export function saturationMarkerCount(saturation: number) {
  return saturation >= CONFIG.saturation.critical
    ? 5
    : saturation >= CONFIG.saturation.danger
      ? 4
      : saturation >= CONFIG.saturation.rising
        ? 2
        : 0;
}
export function triggerDungeonBreak(state: FiefState): FiefState {
  if (state.breakActive) return state;
  const id = state.breaks + 1,
    saturation = bounded(state.monsterSaturation + CONFIG.saturation.breakSpike),
    count =
      saturation >= CONFIG.saturation.danger ? 5 : saturation >= CONFIG.saturation.rising ? 4 : 3;
  return record(
    resetStability({
      ...state,
      aether: 100,
      monsterSaturation: saturation,
      breakActive: true,
      breaks: id,
      waveState: [
        ...state.waveState,
        { id, status: 'TRAVELLING', elapsed: 0, count, damageApplied: false },
      ],
    }),
    'break',
  );
}
export function devAdjustAether(state: FiefState, amount: number): FiefState {
  if (!Number.isFinite(amount)) return state;
  const aether = bounded(state.aether + amount);
  const result = { ...state, aether, breakActive: aether >= 100 && state.breakActive };
  return aether >= 100 ? triggerDungeonBreak(result) : result;
}
export function increaseMonsterSaturation(state: FiefState, amount: number): FiefState {
  return Number.isFinite(amount)
    ? { ...state, monsterSaturation: bounded(state.monsterSaturation + amount) }
    : state;
}
export function changeCycle(state: FiefState): FiefState {
  return record({ ...state, cycle: state.cycle + 1, elapsed: 0, grade: nextGrade(state) }, 'cycle');
}
// The old immediate raid is retained only for developer controls and v0.1 regression tests.
export function raidDungeon(state: FiefState): FiefState {
  if (state.aether <= 0) return state;
  return record(
    {
      ...state,
      aether: Math.max(0, state.aether - CONFIG.raid.reduction),
      breakActive: false,
      raids: state.raids + 1,
    },
    'raid',
  );
}
export function raidBusy(state: FiefState) {
  return state.raidState.status === 'PREPARING' || state.raidState.status === 'IN_PROGRESS';
}
export function startDirectRaid(state: FiefState): FiefState {
  if (raidBusy(state) || state.aether <= 0) return state;
  return record({ ...state, raidState: { status: 'PREPARING', elapsed: 0 } }, 'raidStarted');
}
export function completeDirectRaid(state: FiefState): FiefState {
  if (
    state.raidState.status !== 'IN_PROGRESS' ||
    state.raidState.elapsed + EPSILON < CONFIG.raid.duration
  )
    return state;
  return record(
    {
      ...state,
      aether: Math.max(0, state.aether - CONFIG.raid.reduction),
      breakActive: false,
      raids: state.raids + 1,
      raidState: { status: 'SUCCEEDED', elapsed: CONFIG.raid.duration },
    },
    'raid',
  );
}
export function contractBusy(state: FiefState) {
  return ['POSTED', 'ACCEPTED', 'IN_PROGRESS'].includes(state.contractState.status);
}
export function canPostContract(state: FiefState) {
  return !contractBusy(state) && state.treasury >= CONFIG.contract.reward && state.aether > 0;
}
export function postDungeonContract(state: FiefState): FiefState {
  if (!canPostContract(state)) return state;
  return record(
    {
      ...state,
      treasury: state.treasury - CONFIG.contract.reward,
      contractState: { status: 'POSTED', elapsed: 0 },
    },
    'contractPosted',
  );
}
export function acceptDungeonContract(state: FiefState): FiefState {
  if (
    state.contractState.status !== 'POSTED' ||
    state.contractState.elapsed + EPSILON < CONFIG.contract.acceptanceDelay
  )
    return state;
  return record(
    { ...state, contractState: { status: 'ACCEPTED', elapsed: 0 } },
    'contractAccepted',
  );
}
export function completeDungeonContract(state: FiefState): FiefState {
  if (
    state.contractState.status !== 'IN_PROGRESS' ||
    state.contractState.elapsed + EPSILON < CONFIG.contract.duration
  )
    return state;
  return record(
    {
      ...state,
      aether: Math.max(0, state.aether - CONFIG.contract.reduction),
      breakActive: false,
      contractsSucceeded: state.contractsSucceeded + 1,
      contractState: { status: 'SUCCEEDED', elapsed: CONFIG.contract.duration },
    },
    'contractComplete',
  );
}
export function applyWaveDamage(state: FiefState, waveId: number): FiefState {
  const wave = state.waveState.find((w) => w.id === waveId);
  if (!wave || wave.damageApplied || wave.elapsed + EPSILON < CONFIG.wave.duration) return state;
  return record(
    resetStability({
      ...state,
      publicSentiment: bounded(state.publicSentiment - CONFIG.wave.sentimentDamage),
      security: bounded(state.security - CONFIG.wave.securityDamage),
      prosperity: bounded(state.prosperity - CONFIG.wave.prosperityDamage),
      waveState: state.waveState.map((w) =>
        w.id === waveId
          ? { ...w, status: 'ARRIVED', elapsed: CONFIG.wave.duration, damageApplied: true }
          : w,
      ),
    }),
    'waveDamage',
  );
}
function contractStageDuration(state: FiefState) {
  return state.contractState.status === 'POSTED'
    ? CONFIG.contract.acceptanceDelay
    : state.contractState.status === 'ACCEPTED'
      ? CONFIG.contract.preparation
      : state.contractState.status === 'IN_PROGRESS'
        ? CONFIG.contract.duration
        : Infinity;
}
function raidStageDuration(state: FiefState) {
  return state.raidState.status === 'PREPARING'
    ? CONFIG.raid.preparation
    : state.raidState.status === 'IN_PROGRESS'
      ? CONFIG.raid.duration
      : Infinity;
}
function finishEvents(state: FiefState): FiefState {
  let result = state;
  if (result.aether >= 100 && !result.breakActive) result = triggerDungeonBreak(result);
  if (
    result.raidState.status === 'PREPARING' &&
    result.raidState.elapsed + EPSILON >= CONFIG.raid.preparation
  )
    result = { ...result, raidState: { status: 'IN_PROGRESS', elapsed: 0 } };
  else result = completeDirectRaid(result);
  if (result.contractState.status === 'POSTED') result = acceptDungeonContract(result);
  else if (
    result.contractState.status === 'ACCEPTED' &&
    result.contractState.elapsed + EPSILON >= CONFIG.contract.preparation
  )
    result = { ...result, contractState: { status: 'IN_PROGRESS', elapsed: 0 } };
  else result = completeDungeonContract(result);
  for (const wave of result.waveState) result = applyWaveDamage(result, wave.id);
  result = finishManagement(result);
  // Preserve every active wave, while bounding only completed history.
  const completed = result.waveState
    .filter((w) => w.damageApplied)
    .slice(-CONFIG.wave.historyLimit);
  result = {
    ...result,
    waveState: [...completed, ...result.waveState.filter((w) => !w.damageApplied)],
  };
  if (result.elapsed + EPSILON >= cycleDuration(result.mode)) result = changeCycle(result);
  return result;
}
export function advanceFief(state: FiefState, seconds: number): FiefState {
  if (!Number.isFinite(seconds) || seconds <= 0) return state;
  if (seconds > cycleDuration(state.mode) * 1000) throw new Error('Fief time jump too large');
  let result = finishEvents(state),
    left = seconds;
  while (left > EPSILON) {
    const timeToBreak = result.aether < 100 ? (100 - result.aether) / aetherRate(result) : Infinity;
    const step = Math.min(
      left,
      remainingSeconds(result),
      timeToBreak,
      managementBoundary(result),
      raidStageDuration(result) - result.raidState.elapsed,
      contractStageDuration(result) - result.contractState.elapsed,
      ...result.waveState
        .filter((w) => !w.damageApplied)
        .map((w) => CONFIG.wave.duration - w.elapsed),
    );
    const progressed: FiefState = {
      ...advanceManagement(result, step),
      elapsed: result.elapsed + step,
      aether: bounded(result.aether + step * aetherRate(result)),
      raidState: raidBusy(result)
        ? { ...result.raidState, elapsed: result.raidState.elapsed + step }
        : result.raidState,
      contractState: contractBusy(result)
        ? { ...result.contractState, elapsed: result.contractState.elapsed + step }
        : result.contractState,
      waveState: result.waveState.map((w) =>
        w.damageApplied ? w : { ...w, elapsed: w.elapsed + step },
      ),
    };
    result = finishEvents(progressed);
    left -= step;
  }
  return result;
}
export function setFacilityLevel(
  state: FiefState,
  facility: 'city' | 'castle' | 'manor',
  level: number,
): FiefState {
  if (!Number.isInteger(level) || level < 1 || level > 5) return state;
  const result = { ...state, [facility + 'Level']: level as Level };
  const reserved =
    result.recruitmentState.status === 'RECRUITING' ? result.recruitmentState.count : 0;
  if (result.soldiers.healthy + result.soldiers.wounded + reserved > garrisonCapacity(result))
    return state;
  return {
    ...result,
    activePolicies: result.activePolicies
      .filter((id) => CONFIG.policies.definitions[id].minLevel <= level || facility !== 'manor')
      .slice(0, policySlots(result)),
  };
}
export function setTestMode(state: FiefState, mode: TestMode): FiefState {
  return {
    ...state,
    mode,
    elapsed: (state.elapsed / cycleDuration(state.mode)) * cycleDuration(mode),
  };
}
export function castleReadiness(state: FiefState): 'ready' | 'strained' | 'insufficient' {
  const needed = Math.max(1, GRADES.indexOf(state.grade) - 1);
  return state.castleLevel >= needed
    ? 'ready'
    : state.castleLevel + 1 >= needed
      ? 'strained'
      : 'insufficient';
}
export function fiefWarnings(state: FiefState): string[] {
  const warnings: string[] = [];
  if (state.aether >= CONFIG.aether.danger) warnings.push('aetherWarning');
  if (state.monsterSaturation >= CONFIG.saturation.danger) warnings.push('saturationWarning');
  if (state.waveState.some((w) => !w.damageApplied)) warnings.push('waveApproaching');
  if (state.security < CONFIG.territory.bands.caution) warnings.push('securityWarning');
  if (state.soldiers.wounded > 0) warnings.push('woundedWarning');
  if (availableGarrison(state) === 0) warnings.push('defenseWarning');
  if (state.economyReport.shortfall > 0 || state.treasury === 0) warnings.push('fundingWarning');
  return warnings;
}
export const dungeonContents: Record<
  DungeonGrade,
  { monsters: string; boss: string; resource: string }
> = {
  F: { monsters: 'goblin', boss: 'scout', resource: 'copper' },
  E: { monsters: 'goblin', boss: 'chieftain', resource: 'iron' },
  D: { monsters: 'orc', boss: 'chieftain', resource: 'iron' },
  C: { monsters: 'orc', boss: 'troll', resource: 'crystal' },
  B: { monsters: 'troll', boss: 'warden', resource: 'crystal' },
  A: { monsters: 'undead', boss: 'lich', resource: 'aetherOre' },
  S: { monsters: 'undead', boss: 'ancientKing', resource: 'aetherOre' },
};
