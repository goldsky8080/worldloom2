export const GRADES = ['F', 'E', 'D', 'C', 'B', 'A', 'S'] as const;
export type DungeonGrade = (typeof GRADES)[number];
export type Facility = 'castle' | 'city' | 'manor' | 'dungeon';
export type Level = 1 | 2 | 3 | 4 | 5;
export type TestMode = 'accelerated' | 'design';
export type DungeonStatus = 'stable' | 'unstable' | 'danger' | 'critical' | 'break';
export const DESIGN_CYCLE_SECONDS = 21 * 24 * 60 * 60;
export const TEST_CYCLE_SECONDS = 120;
export const TEST_RULES = { raidReduction: 35, forecastSeconds: 30, maxLog: 12 } as const;
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
    : aether >= 85
      ? 'critical'
      : aether >= 65
        ? 'danger'
        : aether >= 35
          ? 'unstable'
          : 'stable';
}
export interface FiefLog {
  id: number;
  kind: 'cycle' | 'raid' | 'break';
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
    aether: 12,
    breaks: 0,
    raids: 0,
    mode: 'accelerated',
    log: [],
    nextLogId: 1,
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
  // The reveal window is provisional, not a production scheduling rule.
  const window = state.mode === 'accelerated' ? TEST_RULES.forecastSeconds : 24 * 60 * 60;
  return remainingSeconds(state) <= window;
}
function record(state: FiefState, kind: FiefLog['kind']): FiefState {
  return {
    ...state,
    nextLogId: state.nextLogId + 1,
    log: [
      { id: state.nextLogId, kind, cycle: state.cycle, grade: state.grade, aether: state.aether },
      ...state.log,
    ].slice(0, TEST_RULES.maxLog),
  };
}
function increaseAether(state: FiefState, seconds: number): FiefState {
  // Test values only: stronger grades raise the management burden.
  const perTestSecond = 0.6 + GRADES.indexOf(state.grade) * 0.12;
  const rate = (perTestSecond * TEST_CYCLE_SECONDS) / cycleDuration(state.mode);
  const aether = Math.min(100, state.aether + seconds * rate);
  const result = { ...state, aether };
  return state.aether < 100 && aether >= 100
    ? record({ ...result, breaks: state.breaks + 1 }, 'break')
    : result;
}
export function changeCycle(state: FiefState): FiefState {
  return record({ ...state, cycle: state.cycle + 1, elapsed: 0, grade: nextGrade(state) }, 'cycle');
}
export function advanceFief(state: FiefState, seconds: number): FiefState {
  if (!Number.isFinite(seconds) || seconds <= 0) return state;
  // UI uses small visible-tab deltas. Reject oversized test jumps instead of blocking the browser.
  if (seconds > cycleDuration(state.mode) * 1000) throw new Error('Fief time jump too large');
  let result = state,
    left = seconds;
  while (left > 0) {
    const step = Math.min(left, remainingSeconds(result));
    result = increaseAether({ ...result, elapsed: result.elapsed + step }, step);
    left -= step;
    if (result.elapsed >= cycleDuration(result.mode)) result = changeCycle(result);
  }
  return result;
}
export function raidDungeon(state: FiefState): FiefState {
  if (state.aether <= 0) return state;
  return record(
    {
      ...state,
      aether: Math.max(0, state.aether - TEST_RULES.raidReduction),
      raids: state.raids + 1,
    },
    'raid',
  );
}
export function setFacilityLevel(
  state: FiefState,
  facility: 'city' | 'castle',
  level: number,
): FiefState {
  if (!Number.isInteger(level) || level < 1 || level > 5) return state;
  return { ...state, [facility === 'city' ? 'cityLevel' : 'castleLevel']: level as Level };
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
