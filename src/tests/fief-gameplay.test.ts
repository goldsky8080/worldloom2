import { describe, expect, it } from 'vitest';
import { PROTOTYPE_CONFIG as C } from '../modules/fief/config';
import {
  acceptDungeonContract,
  advanceFief,
  applyWaveDamage,
  completeDirectRaid,
  completeDungeonContract,
  completePatrol,
  devAdjustAether,
  garrisonCapacity,
  increaseMonsterPressure,
  initialFief,
  postDungeonContract,
  pressureMarkerCount,
  raidDungeon,
  recruitSoldiers,
  setFacilityLevel,
  startDirectRaid,
  startPatrol,
  triggerDungeonBreak,
} from '../modules/fief/model';
describe('fief gameplay state transitions', () => {
  it('increases pressure with time and grade, independently of internal aether', () => {
    const s = initialFief(),
      strong = { ...s, grade: 'S' as const };
    expect(advanceFief(s, 10).monsterPressure).toBeCloseTo(
      s.monsterPressure + 10 * C.pressure.basePerSecond,
    );
    expect(advanceFief(strong, 10).monsterPressure).toBeGreaterThan(
      advanceFief(s, 10).monsterPressure,
    );
    expect(increaseMonsterPressure(s, 200).monsterPressure).toBe(100);
    expect(advanceFief(increaseMonsterPressure(s, 200), 1).breaks).toBe(0);
    expect(pressureMarkerCount(100)).toBeGreaterThan(pressureMarkerCount(34));
  });
  it('recruits paid soldiers up to capacity and rejects shortages without charging', () => {
    const s = initialFief(),
      recruited = recruitSoldiers(s);
    expect(recruited.treasury).toBe(s.treasury - C.castle.recruitCost);
    expect(recruited.garrison).toBe(s.garrison + C.castle.recruitCount);
    expect(s.treasury).toBe(C.initial.treasury);
    const full = { ...s, garrison: garrisonCapacity(s) };
    expect(recruitSoldiers(full)).toBe(full);
    const poor = { ...s, treasury: C.castle.recruitCost - 1 };
    expect(recruitSoldiers(poor)).toBe(poor);
    const large = setFacilityLevel({ ...s, garrison: 200 }, 'castle', 1);
    expect(large.garrison).toBe(garrisonCapacity(large));
  });
  it('charges a patrol once and its completion lowers only external pressure', () => {
    const s = increaseMonsterPressure(initialFief(), 60),
      patrol = startPatrol(s);
    expect(patrol.treasury).toBe(s.treasury - C.patrol.cost);
    expect(startPatrol(patrol)).toBe(patrol);
    expect(completePatrol(patrol)).toBe(patrol);
    const ready = { ...patrol, patrolState: { ...patrol.patrolState, elapsed: C.patrol.duration } };
    const done = completePatrol(ready);
    expect(done.monsterPressure).toBe(ready.monsterPressure - C.patrol.reduction);
    expect(done.aether).toBe(ready.aether);
    expect(completePatrol(done)).toBe(done);
    expect(advanceFief(patrol, 6).patrolState.status).toBe('SUCCEEDED');
  });
  it('rejects patrols with insufficient money or soldiers', () => {
    const poor = { ...initialFief(), treasury: C.patrol.cost - 1 };
    expect(startPatrol(poor)).toBe(poor);
    const empty = { ...initialFief(), garrison: 0 };
    expect(startPatrol(empty)).toBe(empty);
  });
  it('direct raid prepares and progresses before changing aether; duplicate starts are inert', () => {
    const s = { ...initialFief(), aether: 70 },
      raid = startDirectRaid(s);
    expect(raid.aether).toBe(s.aether);
    expect(startDirectRaid(raid)).toBe(raid);
    expect(completeDirectRaid(raid)).toBe(raid);
    const prepared = advanceFief(raid, C.raid.preparation);
    expect(prepared.raidState.status).toBe('IN_PROGRESS');
    const almost = advanceFief(prepared, C.raid.duration - 0.1);
    expect(almost.aether).toBeGreaterThan(70);
    const done = advanceFief(almost, 0.1);
    expect(done.raidState.status).toBe('SUCCEEDED');
    expect(done.aether).toBeCloseTo(70 + 6 * 0.6 - C.raid.reduction);
    expect(done.raids).toBe(1);
    expect(completeDirectRaid(done)).toBe(done);
  });
  it('rejects contracts without funds and deducts the reward only when posting', () => {
    const s = { ...initialFief(), treasury: C.contract.reward - 1 };
    expect(postDungeonContract(s)).toBe(s);
    const posted = postDungeonContract(initialFief());
    expect(posted.treasury).toBe(C.initial.treasury - C.contract.reward);
    expect(postDungeonContract(posted)).toBe(posted);
    expect(acceptDungeonContract(posted)).toBe(posted);
  });
  it('contracts expose deterministic posted, accepted, progress and success stages once', () => {
    const s = { ...initialFief(), aether: 80 },
      posted = postDungeonContract(s);
    const accepted = advanceFief(posted, 3);
    expect(accepted.contractState.status).toBe('ACCEPTED');
    const started = advanceFief(accepted, 1);
    expect(started.contractState.status).toBe('IN_PROGRESS');
    const done = advanceFief(started, 5);
    expect(done.contractState.status).toBe('SUCCEEDED');
    expect(done.aether).toBeCloseTo(80 + 9 * 0.6 - C.contract.reduction);
    expect(done.contractsSucceeded).toBe(1);
    expect(done.treasury).toBe(s.treasury - C.contract.reward);
    expect(completeDungeonContract(done)).toBe(done);
    expect(advanceFief(done, 5).contractsSucceeded).toBe(1);
  });
  it('overlapping raid and contract completions never produce negative aether or disappear from records', () => {
    const s = startDirectRaid(postDungeonContract(initialFief()));
    const done = advanceFief(s, 12);
    expect(done.aether).toBeGreaterThanOrEqual(0);
    expect(done.raids).toBe(1);
    expect(done.contractsSucceeded).toBe(1);
    expect(done.log.filter((e) => e.kind === 'raid')).toHaveLength(1);
    expect(done.log.filter((e) => e.kind === 'contractComplete')).toHaveLength(1);
  });
  it('aether reaching 100 creates one wave, with pressure controlling only its icon count', () => {
    const s = devAdjustAether(initialFief(), 88);
    expect(s.breaks).toBe(1);
    expect(s.waveState[0].count).toBe(3);
    expect(triggerDungeonBreak(s)).toBe(s);
    expect(advanceFief(s, 1).waveState).toHaveLength(1);
    const high = triggerDungeonBreak(increaseMonsterPressure(initialFief(), 100));
    expect(high.waveState[0].count).toBe(5);
    expect(high.publicSentiment).toBe(s.publicSentiment);
  });
  it('wave damage waits for city arrival and applies exactly once per break', () => {
    const s = triggerDungeonBreak(initialFief());
    expect(applyWaveDamage(s, 1)).toBe(s);
    const almost = advanceFief(s, 7.9);
    expect(almost.publicSentiment).toBe(C.initial.publicSentiment);
    const done = advanceFief(almost, 0.1);
    expect([done.publicSentiment, done.security, done.prosperity]).toEqual([65, 62, 57]);
    expect(done.waveState[0].damageApplied).toBe(true);
    expect(applyWaveDamage(done, 1)).toBe(done);
    expect(advanceFief(done, 30).publicSentiment).toBe(65);
  });
  it('recovery permits a new wave while an earlier wave is still travelling', () => {
    const first = triggerDungeonBreak(initialFief());
    const second = triggerDungeonBreak(raidDungeon(first));
    expect(second.waveState).toHaveLength(2);
    expect(second.breaks).toBe(2);
    const done = advanceFief(second, 8);
    expect(done.publicSentiment).toBe(60);
    expect(done.waveState.every((w) => w.damageApplied)).toBe(true);
    expect(new Set(done.waveState.map((w) => w.id)).size).toBe(2);
  });
  it('continuous time detects a break at the correct instant before advancing its new wave', () => {
    const s = { ...initialFief(), aether: 99 };
    const later = advanceFief(s, 2);
    expect(later.breaks).toBe(1);
    expect(later.waveState[0].elapsed).toBeCloseTo(2 - 1 / 0.6);
    expect(later.publicSentiment).toBe(70);
  });
  it('a large time step matches small steps across simultaneous actions, waves and cycles', () => {
    let start = startPatrol(
      startDirectRaid(postDungeonContract({ ...initialFief(), aether: 90, monsterPressure: 80 })),
    );
    start = triggerDungeonBreak(start);
    const large = advanceFief(start, 140);
    let small = start;
    for (let i = 0; i < 560; i++) small = advanceFief(small, 0.25);
    expect([
      large.cycle,
      large.grade,
      large.breaks,
      large.treasury,
      large.publicSentiment,
      large.contractsSucceeded,
      large.raids,
    ]).toEqual([
      small.cycle,
      small.grade,
      small.breaks,
      small.treasury,
      small.publicSentiment,
      small.contractsSucceeded,
      small.raids,
    ]);
    expect(large.aether).toBeCloseTo(small.aether);
    expect(large.monsterPressure).toBeCloseTo(small.monsterPressure);
    expect(large.log.map((e) => e.kind)).toEqual(small.log.map((e) => e.kind));
  });
  it('damage stats clamp at zero and old wave history remains bounded without dropping active waves', () => {
    let s = { ...initialFief(), publicSentiment: 2, security: 3, prosperity: 1 };
    for (let i = 0; i < 20; i++) {
      s = advanceFief(triggerDungeonBreak(raidDungeon(s)), 8);
    }
    expect([s.publicSentiment, s.security, s.prosperity]).toEqual([0, 0, 0]);
    expect(s.waveState.length).toBeLessThanOrEqual(C.wave.historyLimit);
    expect(s.breaks).toBe(20);
    expect(s.log.length).toBeLessThanOrEqual(C.logLimit);
  });
});
