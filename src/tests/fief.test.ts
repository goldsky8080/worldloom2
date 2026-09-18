import { describe, expect, it } from 'vitest';
import {
  advanceFief,
  castleReadiness,
  changeCycle,
  cycleDuration,
  DESIGN_CYCLE_SECONDS,
  dungeonStatus,
  forecastReady,
  gradeRange,
  initialFief,
  nextGrade,
  raidDungeon,
  remainingSeconds,
  setFacilityLevel,
  setTestMode,
} from '../modules/fief/model';
import { facilityFrame } from '../modules/fief/FiefMap';
import { assetManager } from '../services/assets/AssetManager';
describe('instance fief prototype', () => {
  it('uses registered atlas assets for every selectable facility level', () => {
    for (let level = 1; level <= 5; level++) {
      const s = setFacilityLevel(setFacilityLevel(initialFief(), 'city', level), 'castle', level);
      for (const kind of ['city', 'castle', 'manor', 'dungeon'] as const)
        expect(assetManager.frame(facilityFrame(kind, s)).atlasId).toMatch(/^world-/);
    }
  });
  it('starts with one permanent dungeon and all three facilities at L1', () => {
    const s = initialFief();
    expect([s.cityLevel, s.castleLevel, s.manorLevel]).toEqual([1, 1, 1]);
    expect(s.cycle).toBe(1);
    expect(s.grade).toBe('F');
    expect(cycleDuration('design')).toBe(21 * 86400);
    expect(cycleDuration('accelerated')).toBe(120);
  });
  it('uses each specified city grade range over successive cycles', () => {
    const ranges = [
      ['F', 'E', 'D'],
      ['D', 'C'],
      ['D', 'C', 'B'],
      ['C', 'B', 'A'],
      ['B', 'A', 'S'],
    ];
    ranges.forEach((expected, i) => {
      let s = setFacilityLevel(initialFief(), 'city', i + 1);
      const observed = new Set<string>();
      for (let j = 0; j < 18; j++) {
        s = changeCycle(s);
        observed.add(s.grade);
        expect(expected).toContain(s.grade);
      }
      expect([...observed].sort()).toEqual([...expected].sort());
    });
  });
  it('defers city changes until the next cycle including a city downgrade', () => {
    let s = setFacilityLevel(initialFief(), 'city', 5);
    expect(s.grade).toBe('F');
    s = changeCycle(changeCycle(s));
    expect(s.grade).toBe('S');
    s = setFacilityLevel(s, 'city', 1);
    expect(s.grade).toBe('S');
    expect(gradeRange(s.cityLevel)).toEqual(['F', 'E', 'D']);
    expect(gradeRange(1)).toContain(changeCycle(s).grade);
  });
  it('keeps castle level independent of grades and aether', () => {
    const s = changeCycle(changeCycle(setFacilityLevel(initialFief(), 'city', 5)));
    const strong = setFacilityLevel(s, 'castle', 5);
    expect(nextGrade(strong)).toBe(nextGrade(s));
    expect(strong.grade).toBe(s.grade);
    expect(advanceFief(strong, 10).aether).toBe(advanceFief(s, 10).aether);
    expect(castleReadiness(s)).toBe('insufficient');
    expect(castleReadiness(strong)).toBe('ready');
  });
  it('crosses an automatic boundary with the new grade only after the boundary', () => {
    const s = advanceFief(initialFief(), 125);
    expect(s.cycle).toBe(2);
    expect(s.grade).toBe('E');
    expect(s.elapsed).toBe(5);
    expect(s.aether).toBeCloseTo(12 + 120 * 0.6 + 5 * 0.72);
    expect(s.log[0].kind).toBe('cycle');
  });
  it('preserves dungeon identity and aether across cycles', () => {
    const s = advanceFief(initialFief(), 50),
      next = changeCycle(s);
    expect(next.dungeonId).toBe(s.dungeonId);
    expect(next.id).toBe(s.id);
    expect(next.aether).toBe(s.aether);
    expect(next.elapsed).toBe(0);
    expect(s.cycle).toBe(1);
    expect(s.log).toHaveLength(0);
  });
  it('progresses through provisional danger thresholds', () => {
    expect([0, 34.9, 35, 64.9, 65, 84.9, 85, 99.9, 100].map(dungeonStatus)).toEqual([
      'stable',
      'stable',
      'unstable',
      'unstable',
      'danger',
      'danger',
      'critical',
      'critical',
      'break',
    ]);
  });
  it('counts each break once until a raid recovers the dungeon', () => {
    const broken = advanceFief(initialFief(), 180);
    expect(broken.aether).toBe(100);
    expect(broken.breaks).toBe(1);
    const continuing = advanceFief(changeCycle(broken), 120);
    expect(continuing.breaks).toBe(1);
    expect(dungeonStatus(continuing.aether)).toBe('break');
    const recovered = raidDungeon(continuing);
    expect(recovered.aether).toBe(65);
    expect(dungeonStatus(recovered.aether)).toBe('danger');
    expect(advanceFief(recovered, 100).breaks).toBe(2);
  });
  it('clamps raids at zero and leaves the input unchanged', () => {
    const s = initialFief(),
      cleared = raidDungeon(s);
    expect(cleared.aether).toBe(0);
    expect(cleared.raids).toBe(1);
    expect(raidDungeon(cleared)).toBe(cleared);
    expect(s.aether).toBe(12);
  });
  it('announces a grade late in the cycle and invalidates it on city changes', () => {
    const s = advanceFief(initialFief(), 90);
    expect(forecastReady(s)).toBe(true);
    expect(nextGrade(s)).toBe('E');
    const grown = setFacilityLevel(s, 'city', 5);
    expect(nextGrade(grown)).toBe('A');
    expect(changeCycle(grown).grade).toBe(nextGrade(grown));
    expect(forecastReady(initialFief())).toBe(false);
  });
  it('preserves normalized progress when switching test time and design time', () => {
    const s = advanceFief(initialFief(), 30),
      design = setTestMode(s, 'design');
    expect(design.elapsed).toBe(DESIGN_CYCLE_SECONDS / 4);
    expect(remainingSeconds(design)).toBe(DESIGN_CYCLE_SECONDS * 0.75);
    expect(setTestMode(design, 'accelerated').elapsed).toBe(30);
    expect(design.aether).toBe(s.aether);
    expect(advanceFief(setTestMode(initialFief(), 'design'), DESIGN_CYCLE_SECONDS).grade).toBe('E');
  });
  it('bounds event history while preserving unique identifiers', () => {
    let s = initialFief();
    for (let i = 0; i < 30; i++) s = changeCycle(s);
    expect(s.log).toHaveLength(12);
    expect(new Set(s.log.map((e) => e.id)).size).toBe(12);
    expect(s.nextLogId).toBe(31);
    expect(s.log[0].cycle).toBe(31);
  });
  it('rejects invalid levels and invalid time input', () => {
    const s = initialFief();
    for (const level of [0, 6, 2.5, NaN]) expect(setFacilityLevel(s, 'city', level)).toBe(s);
    for (const seconds of [-1, 0, NaN, Infinity]) expect(advanceFief(s, seconds)).toBe(s);
    expect(() => advanceFief(s, 120001)).toThrow('too large');
  });
});
