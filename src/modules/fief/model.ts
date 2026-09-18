import { PROTOTYPE_CONFIG as CONFIG } from './config';
export { PROTOTYPE_CONFIG } from './config';
export const GRADES = ['F', 'E', 'D', 'C', 'B', 'A', 'S'] as const;
export type DungeonGrade = (typeof GRADES)[number];
export type Facility = 'castle' | 'city' | 'manor' | 'dungeon';
export type Level = 1 | 2 | 3 | 4 | 5;
export type TestMode = 'accelerated' | 'design';
export type DungeonStatus = 'stable' | 'unstable' | 'danger' | 'critical' | 'break';
export const DESIGN_CYCLE_SECONDS = 21 * 24 * 60 * 60;
export const TEST_CYCLE_SECONDS = 120;
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
export function pressureStatus(pressure: number) {
  return pressure >= CONFIG.pressure.critical
    ? 'pressureCritical'
    : pressure >= CONFIG.pressure.danger
      ? 'pressureDanger'
      : pressure >= CONFIG.pressure.rising
        ? 'pressureRising'
        : 'pressureStable';
}
export interface TimedState<S extends string> {
  status: S;
  elapsed: number;
}
export type PatrolState = TimedState<'NONE' | 'ON_PATROL' | 'SUCCEEDED'>;
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
    | 'patrolStarted'
    | 'patrolComplete'
    | 'raidStarted'
    | 'contractPosted'
    | 'contractAccepted'
    | 'contractComplete'
    | 'waveDamage';
  cycle: number;
  grade: DungeonGrade;
  aether: number;
}
export interface FiefState {
  id: string;
  dungeonId: string;
  cityLevel: Level;
  castleLevel: Level;
  manorLevel: 1;
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
  garrison: number;
  monsterPressure: number;
  breakActive: boolean;
  patrolState: PatrolState;
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
    breakActive: false,
    patrolState: { status: 'NONE', elapsed: 0 },
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
function record(state: FiefState, kind: FiefLog['kind']): FiefState {
  return {
    ...state,
    nextLogId: state.nextLogId + 1,
    log: [
      { id: state.nextLogId, kind, cycle: state.cycle, grade: state.grade, aether: state.aether },
      ...state.log,
    ].slice(0, CONFIG.logLimit),
  };
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
export function pressureRate(state: FiefState) {
  return (
    ((CONFIG.pressure.basePerSecond + GRADES.indexOf(state.grade) * CONFIG.pressure.perGrade) *
      TEST_CYCLE_SECONDS) /
    cycleDuration(state.mode)
  );
}
export function pressureMarkerCount(pressure: number) {
  return pressure >= CONFIG.pressure.critical
    ? 5
    : pressure >= CONFIG.pressure.danger
      ? 4
      : pressure >= CONFIG.pressure.rising
        ? 2
        : 0;
}
export function triggerDungeonBreak(state: FiefState): FiefState {
  if (state.breakActive) return state;
  const id = state.breaks + 1,
    count =
      state.monsterPressure >= CONFIG.pressure.danger
        ? 5
        : state.monsterPressure >= CONFIG.pressure.rising
          ? 4
          : 3;
  return record(
    {
      ...state,
      aether: 100,
      breakActive: true,
      breaks: id,
      waveState: [
        ...state.waveState,
        { id, status: 'TRAVELLING', elapsed: 0, count, damageApplied: false },
      ],
    },
    'break',
  );
}
export function devAdjustAether(state: FiefState, amount: number): FiefState {
  if (!Number.isFinite(amount)) return state;
  const aether = bounded(state.aether + amount);
  const result = { ...state, aether, breakActive: aether >= 100 && state.breakActive };
  return aether >= 100 ? triggerDungeonBreak(result) : result;
}
export function increaseMonsterPressure(state: FiefState, amount: number): FiefState {
  return Number.isFinite(amount)
    ? { ...state, monsterPressure: bounded(state.monsterPressure + amount) }
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
export function garrisonCapacity(state: FiefState) {
  return CONFIG.castle.baseCapacity + (state.castleLevel - 1) * CONFIG.castle.capacityPerLevel;
}
export function canRecruit(state: FiefState) {
  return (
    state.treasury >= CONFIG.castle.recruitCost &&
    state.garrison + CONFIG.castle.recruitCount <= garrisonCapacity(state)
  );
}
export function recruitSoldiers(state: FiefState): FiefState {
  if (!canRecruit(state)) return state;
  return record(
    {
      ...state,
      treasury: state.treasury - CONFIG.castle.recruitCost,
      garrison: state.garrison + CONFIG.castle.recruitCount,
    },
    'recruit',
  );
}
export function canPatrol(state: FiefState) {
  return (
    state.patrolState.status !== 'ON_PATROL' &&
    state.treasury >= CONFIG.patrol.cost &&
    state.garrison >= CONFIG.patrol.requiredSoldiers &&
    state.monsterPressure > 0
  );
}
export function startPatrol(state: FiefState): FiefState {
  if (!canPatrol(state)) return state;
  return record(
    {
      ...state,
      treasury: state.treasury - CONFIG.patrol.cost,
      patrolState: { status: 'ON_PATROL', elapsed: 0 },
    },
    'patrolStarted',
  );
}
export function completePatrol(state: FiefState): FiefState {
  if (
    state.patrolState.status !== 'ON_PATROL' ||
    state.patrolState.elapsed + EPSILON < CONFIG.patrol.duration
  )
    return state;
  return record(
    {
      ...state,
      monsterPressure: Math.max(0, state.monsterPressure - CONFIG.patrol.reduction),
      patrolState: { status: 'SUCCEEDED', elapsed: CONFIG.patrol.duration },
    },
    'patrolComplete',
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
    {
      ...state,
      publicSentiment: bounded(state.publicSentiment - CONFIG.wave.sentimentDamage),
      security: bounded(state.security - CONFIG.wave.securityDamage),
      prosperity: bounded(state.prosperity - CONFIG.wave.prosperityDamage),
      waveState: state.waveState.map((w) =>
        w.id === waveId
          ? { ...w, status: 'ARRIVED', elapsed: CONFIG.wave.duration, damageApplied: true }
          : w,
      ),
    },
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
  result = completePatrol(result);
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
      result.patrolState.status === 'ON_PATROL'
        ? CONFIG.patrol.duration - result.patrolState.elapsed
        : Infinity,
      raidStageDuration(result) - result.raidState.elapsed,
      contractStageDuration(result) - result.contractState.elapsed,
      ...result.waveState
        .filter((w) => !w.damageApplied)
        .map((w) => CONFIG.wave.duration - w.elapsed),
    );
    const progressed: FiefState = {
      ...result,
      elapsed: result.elapsed + step,
      aether: bounded(result.aether + step * aetherRate(result)),
      monsterPressure: bounded(result.monsterPressure + step * pressureRate(result)),
      patrolState:
        result.patrolState.status === 'ON_PATROL'
          ? { ...result.patrolState, elapsed: result.patrolState.elapsed + step }
          : result.patrolState,
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
  facility: 'city' | 'castle',
  level: number,
): FiefState {
  if (!Number.isInteger(level) || level < 1 || level > 5) return state;
  const result = { ...state, [facility === 'city' ? 'cityLevel' : 'castleLevel']: level as Level };
  return { ...result, garrison: Math.min(result.garrison, garrisonCapacity(result)) };
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
  if (state.monsterPressure >= CONFIG.pressure.danger) warnings.push('pressureWarning');
  if (state.waveState.some((w) => !w.damageApplied)) warnings.push('waveApproaching');
  if (state.security < CONFIG.pressure.rising) warnings.push('securityWarning');
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
