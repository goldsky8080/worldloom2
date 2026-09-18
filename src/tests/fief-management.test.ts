import { describe, it, expect } from 'vitest';
import { PROTOTYPE_CONFIG as C } from '../modules/fief/config';
import {
  advanceFief,
  initialFief,
  increaseMonsterSaturation,
  triggerDungeonBreak,
  raidDungeon,
  assignStanding,
  availableGarrison,
  livingSoldiers,
  suppressionEfficiency,
  standingEffect,
  recruitSoldiers,
  completeRecruitment,
  recruitmentQuote,
  maxRecruitment,
  garrisonCapacity,
  startEmergency,
  completeEmergency,
  stateBand,
  territoryRates,
  changeTax,
  togglePolicy,
  policySlots,
  taxRevenue,
  soldierUpkeep,
  setFacilityLevel,
  type FiefState,
} from '../modules/fief/model';
const safe = (): FiefState => ({
  ...initialFief(),
  mode: 'design',
  aether: 0,
  monsterSaturation: 0,
});
const high = (): FiefState => ({ ...safe(), monsterSaturation: 100 });
function expectSame(a: FiefState, b: FiefState) {
  for (const key of [
    'treasury',
    'breaks',
    'raids',
    'cycle',
    'grade',
    'nextLogId',
    'taxPolicy',
    'standingLosses',
  ] as const)
    expect(a[key]).toEqual(b[key]);
  for (const key of [
    'aether',
    'monsterSaturation',
    'security',
    'prosperity',
    'publicSentiment',
    'standingExposure',
    'economyElapsed',
    'suppressionElapsed',
    'taxCooldown',
  ] as const)
    expect(a[key]).toBeCloseTo(b[key], 7);
  expect(a.soldiers).toEqual(b.soldiers);
  expect(a.log.map((e) => ({ ...e, aether: 0 }))).toEqual(b.log.map((e) => ({ ...e, aether: 0 })));
  a.log.forEach((entry, i) => expect(entry.aether).toBeCloseTo(b.log[i].aether, 7));
  expect(a.activePolicies).toEqual(b.activePolicies);
  for (const key of ['security', 'prosperity', 'sentiment'] as const)
    expect(a.recoveryTimers[key]).toBeCloseTo(b.recoveryTimers[key], 7);
  expect(a.woundedBatches.length).toBe(b.woundedBatches.length);
  a.woundedBatches.forEach((batch, i) => {
    expect(batch.count).toBe(b.woundedBatches[i].count);
    expect(batch.remaining).toBeCloseTo(b.woundedBatches[i].remaining, 7);
  });
}
describe('v0.3 saturation and soldier lifecycle', () => {
  it('spikes saturation exactly once per break and preserves dispatched waves after recovery', () => {
    const s = initialFief(),
      broken = triggerDungeonBreak(s);
    expect(broken.monsterSaturation).toBe(s.monsterSaturation + C.saturation.breakSpike);
    expect(triggerDungeonBreak(broken)).toBe(broken);
    expect(advanceFief(broken, 1).breaks).toBe(1);
    const again = triggerDungeonBreak(raidDungeon(broken));
    expect(again.monsterSaturation).toBe(
      Math.min(100, broken.monsterSaturation + C.saturation.breakSpike),
    );
    expect(again.waveState).toHaveLength(2);
  });
  it('saturation 100 never triggers a dungeon break', () => {
    expect(advanceFief(high(), 60).breaks).toBe(0);
  });
  it('standing assignment excludes only healthy subsets without duplicating capacity', () => {
    let s = assignStanding(initialFief(), 20);
    s = startEmergency(s, 15);
    expect(livingSoldiers(s)).toBe(40);
    expect(availableGarrison(s)).toBe(5);
    expect(assignStanding(s, 26)).toBe(s);
    expect(assignStanding(s, -1)).toBe(s);
    expect(assignStanding(s, 1.5)).toBe(s);
  });
  it('standing forces offset natural growth and sufficient troops reduce saturation', () => {
    const s = initialFief(),
      standing = assignStanding(s, 20),
      none = advanceFief(s, 10),
      suppressed = advanceFief(standing, 10);
    expect(suppressed.monsterSaturation).toBeLessThan(s.monsterSaturation);
    expect(suppressed.monsterSaturation).toBeLessThan(none.monsterSaturation);
  });
  it('diminishing efficiency approaches a positive equilibrium instead of free negative saturation', () => {
    expect(suppressionEfficiency(5)).toBeLessThan(suppressionEfficiency(35));
    const s = assignStanding(initialFief(), 20),
      later = advanceFief(s, 20);
    expect(standingEffect(later)).toBeLessThan(standingEffect(s));
    expect(later.monsterSaturation).toBeGreaterThan(0);
  });
  it('standing exposure has deterministic wounds, deaths and shrinking assignments', () => {
    const s = assignStanding(high(), 20),
      a = advanceFief(s, 35),
      b = advanceFief(s, 35);
    expect(a).toEqual(b);
    expect(a.soldiers.wounded).toBeGreaterThan(0);
    expect(a.soldiers.deadTotal).toBeGreaterThan(0);
    expect(a.soldiers.standingAssigned).toBeLessThan(20);
    expect(livingSoldiers(a)).toBe(40 - a.soldiers.deadTotal);
  });
  it('unassigning and reassigning never erase accrued casualty exposure', () => {
    let s = advanceFief(assignStanding(high(), 20), 3);
    const exposure = s.standingExposure;
    s = assignStanding(assignStanding(s, 0), 20);
    expect(s.standingExposure).toBe(exposure);
  });
  it('timed recruitment charges once, reserves capacity and joins healthy only at completion', () => {
    const s = initialFief(),
      job = recruitSoldiers(s, 20),
      quote = recruitmentQuote(s, 20);
    expect(job.treasury).toBe(s.treasury - quote.cost);
    expect(job.soldiers.healthy).toBe(s.soldiers.healthy);
    expect(recruitSoldiers(job, 1)).toBe(job);
    expect(completeRecruitment(job)).toBe(job);
    expect(advanceFief(job, quote.duration - 0.01).soldiers.healthy).toBe(40);
    const done = advanceFief(job, quote.duration);
    expect(done.soldiers.healthy).toBe(60);
    expect(completeRecruitment(done)).toBe(done);
    expect(advanceFief(job, 120).recruitmentState.status).toBe('SUCCEEDED');
  });
  it('living capacity includes wounded but ignores dead statistics', () => {
    const s = initialFief(),
      full = { ...s, soldiers: { ...s.soldiers, healthy: 60, wounded: 20 } };
    expect(recruitSoldiers(full, 1)).toBe(full);
    expect(
      recruitSoldiers({ ...s, soldiers: { ...s.soldiers, deadTotal: 500 } }, 20).recruitmentState
        .status,
    ).toBe('RECRUITING');
    expect(recruitSoldiers(s, 0)).toBe(s);
    expect(recruitSoldiers(s, 21)).toBe(s);
    expect(recruitSoldiers(s, 2.5)).toBe(s);
  });
  it('recruitment max and capacity rise with castle level and pending recruits block shrinking', () => {
    const s = setFacilityLevel(initialFief(), 'castle', 5);
    expect(maxRecruitment(s)).toBeGreaterThan(maxRecruitment(initialFief()));
    expect(garrisonCapacity(s)).toBeGreaterThan(garrisonCapacity(initialFief()));
    const job = recruitSoldiers(s, 60);
    expect(setFacilityLevel(job, 'castle', 1)).toBe(job);
  });
  it('emergency requires available troops, fees and a single active job', () => {
    const s = assignStanding(initialFief(), 30);
    expect(startEmergency(s, 11)).toBe(s);
    const job = startEmergency(s, 10);
    expect(availableGarrison(job)).toBe(0);
    expect(startEmergency(job, 1)).toBe(job);
    expect(completeEmergency(job)).toBe(job);
    const poor = { ...initialFief(), treasury: 0 };
    expect(startEmergency(poor, 1)).toBe(poor);
  });
  it('emergency applies saturation reduction and casualties once, never internal aether reduction', () => {
    const s = { ...safe(), monsterSaturation: 90 },
      job = startEmergency(s, 20),
      done = advanceFief(job, C.emergency.duration);
    expect(done.emergencyState.status).toBe('SUCCEEDED');
    expect(done.monsterSaturation).toBeCloseTo(90 - 20 * C.emergency.reductionPerSoldier, 2);
    expect(done.soldiers).toEqual({
      healthy: 36,
      wounded: 3,
      deadTotal: 1,
      standingAssigned: 0,
      emergencyAssigned: 0,
    });
    expect(done.aether).toBeGreaterThanOrEqual(s.aether);
    expect(completeEmergency(done)).toBe(done);
  });
  it('wounded return at their own boundary while dead never return', () => {
    const done = advanceFief(startEmergency({ ...safe(), monsterSaturation: 50 }, 20), 6);
    expect(advanceFief(done, C.soldiers.recoveryDuration - 0.1).soldiers.wounded).toBe(3);
    const recovered = advanceFief(done, C.soldiers.recoveryDuration);
    expect(recovered.soldiers.healthy).toBe(39);
    expect(recovered.soldiers.wounded).toBe(0);
    expect(recovered.soldiers.deadTotal).toBe(1);
    expect(recovered.log.filter((e) => e.kind === 'soldiersRecovered')).toHaveLength(1);
  });
});
describe('territory deterioration and delayed recovery', () => {
  it('uses the exact common state bands', () => {
    expect([100, 80, 79, 60, 59, 30, 29, 0].map(stateBand)).toEqual([
      'stateStable',
      'stateStable',
      'stateCaution',
      'stateCaution',
      'stateUnrest',
      'stateUnrest',
      'stateCrisis',
      'stateCrisis',
    ]);
  });
  it('saturation 100 continuously damages security fastest, then prosperity, then sentiment', () => {
    const s = high(),
      a = advanceFief(s, 10),
      b = advanceFief(a, 10);
    expect(s.security - a.security).toBeGreaterThan(s.prosperity - a.prosperity);
    expect(s.prosperity - a.prosperity).toBeGreaterThan(s.publicSentiment - a.publicSentiment);
    expect(b.security).toBeLessThan(a.security);
    expect(b.publicSentiment).toBeLessThan(a.publicSentiment);
  });
  it('security waits for safety and a recovery delay instead of instant restoration', () => {
    const s = safe(),
      a = advanceFief(s, 5),
      b = advanceFief(a, 2);
    expect(a.security).toBe(s.security);
    expect(b.security).toBeGreaterThan(s.security);
    expect(b.prosperity).toBe(s.prosperity);
    expect(b.publicSentiment).toBe(s.publicSentiment);
    expect(advanceFief({ ...s, breakActive: true }, 30).security).toBe(s.security);
    expect(advanceFief(assignStanding(s, 40), 4).security).toBe(s.security);
  });
  it('prosperity waits for stable security and sentiment waits longer', () => {
    const s = { ...safe(), security: 80 },
      early = advanceFief(s, 15),
      middle = advanceFief(s, 20),
      late = advanceFief(s, 35);
    expect(early.prosperity).toBe(s.prosperity);
    expect(middle.prosperity).toBeGreaterThan(s.prosperity);
    expect(middle.publicSentiment).toBe(s.publicSentiment);
    expect(late.publicSentiment).toBeGreaterThan(s.publicSentiment);
  });
  it('a break and wave arrival reset accumulated stability', () => {
    const s = advanceFief({ ...safe(), security: 80 }, 20),
      broken = triggerDungeonBreak(s);
    expect(broken.recoveryTimers).toEqual({ security: 0, prosperity: 0, sentiment: 0 });
    expect(advanceFief(raidDungeon(broken), 8).recoveryTimers).toEqual({
      security: 0,
      prosperity: 0,
      sentiment: 0,
    });
  });
  it('recovery is slower from 80 and can reach 100 in safe natural conditions', () => {
    const low = advanceFief({ ...safe(), security: 79 }, 5),
      strong = advanceFief({ ...safe(), security: 80 }, 5);
    expect(territoryRates(low).security).toBeGreaterThan(territoryRates(strong).security);
    const recovered = advanceFief(
      { ...safe(), security: 80, prosperity: 80, publicSentiment: 80 },
      1000,
    );
    expect([recovered.security, recovered.prosperity, recovered.publicSentiment]).toEqual([
      100, 100, 100,
    ]);
  });
  it('there is no direct stat deterioration cascade in safe conditions', () => {
    const s = { ...safe(), security: 0, prosperity: 80, publicSentiment: 80 },
      later = advanceFief(s, 10);
    expect(later.prosperity).toBe(80);
    expect(later.publicSentiment).toBe(80);
  });
});
describe('tax, policies and recurring treasury', () => {
  it('settles revenue and living-soldier upkeep once at each tick', () => {
    const s = initialFief(),
      early = advanceFief(s, 29.9);
    expect(early.treasury).toBe(s.treasury);
    const first = advanceFief(s, 30);
    expect(first.treasury).toBe(s.treasury + taxRevenue(first) - soldierUpkeep(first));
    expect(first.economyReport.revenue).toBe(taxRevenue(first));
    expect(first.log.filter((e) => e.kind === 'economyTick')).toHaveLength(1);
    expect(advanceFief(s, 60).log.filter((e) => e.kind === 'economyTick')).toHaveLength(2);
  });
  it('LOW/NORMAL/HIGH revenues are ordered, city and prosperity scale revenue', () => {
    const s = safe();
    expect(taxRevenue({ ...s, taxPolicy: 'LOW' })).toBeLessThan(taxRevenue(s));
    expect(taxRevenue({ ...s, taxPolicy: 'HIGH' })).toBeGreaterThan(taxRevenue(s));
    expect(taxRevenue({ ...s, cityLevel: 5 })).toBeGreaterThan(taxRevenue(s));
    expect(taxRevenue({ ...s, prosperity: 100 })).toBeGreaterThan(taxRevenue(s));
  });
  it('tax changes preserve current stats, enforce cooldown and add only gradual HIGH burdens', () => {
    const s = safe(),
      changed = changeTax(s, 'HIGH');
    expect([changed.publicSentiment, changed.prosperity]).toEqual([
      s.publicSentiment,
      s.prosperity,
    ]);
    expect(changeTax(changed, 'LOW')).toBe(changed);
    const later = advanceFief(changed, 10);
    expect(later.publicSentiment).toBeLessThan(s.publicSentiment);
    expect(later.prosperity).toBeLessThan(s.prosperity);
    expect(changeTax(advanceFief(changed, C.tax.cooldown), 'LOW').taxPolicy).toBe('LOW');
  });
  it('policy slots are 1/1/2/2/3 and minimum manor levels are enforced', () => {
    expect(
      ([1, 2, 3, 4, 5] as const).map((l) => policySlots(setFacilityLevel(safe(), 'manor', l))),
    ).toEqual([1, 1, 2, 2, 3]);
    const s = safe();
    expect(togglePolicy(s, 'COMMERCE_SUPPORT')).toBe(s);
    const one = togglePolicy(s, 'RESIDENT_RELIEF');
    expect(togglePolicy(one, 'SECURITY_SUPPORT')).toBe(one);
    const big = togglePolicy(
      togglePolicy(setFacilityLevel(s, 'manor', 3), 'RESIDENT_RELIEF'),
      'COMMERCE_SUPPORT',
    );
    expect(big.activePolicies).toHaveLength(2);
    expect(togglePolicy(big, 'SECURITY_SUPPORT')).toBe(big);
  });
  it('policy cooldown guards rapid cancellation and activation requires upkeep funds', () => {
    const s = togglePolicy(safe(), 'RESIDENT_RELIEF');
    expect(togglePolicy(s, 'RESIDENT_RELIEF')).toBe(s);
    expect(togglePolicy(advanceFief(s, 20), 'RESIDENT_RELIEF').activePolicies).toHaveLength(0);
    const poor = { ...safe(), treasury: 59 };
    expect(togglePolicy(poor, 'RESIDENT_RELIEF')).toBe(poor);
  });
  it('policies have no instant stat boost, pay recurring upkeep and support only gated recovery', () => {
    const s = { ...safe(), security: 80 },
      policy = togglePolicy(s, 'RESIDENT_RELIEF');
    expect(policy.publicSentiment).toBe(s.publicSentiment);
    expect(policy.treasury).toBe(s.treasury);
    expect(advanceFief(policy, 35).publicSentiment).toBeGreaterThan(
      advanceFief(s, 35).publicSentiment,
    );
    expect(advanceFief(policy, 30).economyReport.policyUpkeep).toBe(60);
    const unsafe = togglePolicy(high(), 'SECURITY_SUPPORT');
    expect(advanceFief(unsafe, 10).security).toBeLessThan(unsafe.security);
  });
  it('recruitment support quotes lower cost and time and freezes jobs at start', () => {
    const s = setFacilityLevel(safe(), 'manor', 2),
      policy = togglePolicy(s, 'RECRUITMENT_SUPPORT');
    expect(recruitmentQuote(policy, 20).cost).toBeLessThan(recruitmentQuote(s, 20).cost);
    expect(recruitmentQuote(policy, 20).duration).toBeLessThan(recruitmentQuote(s, 20).duration);
    const job = recruitSoldiers(policy, 20),
      downgraded = setFacilityLevel(job, 'manor', 1);
    expect(downgraded.activePolicies).toHaveLength(0);
    expect(downgraded.recruitmentState).toEqual(job.recruitmentState);
  });
  it('reconstruction improves all gated recovery but never bypasses safety or stability', () => {
    const s = { ...setFacilityLevel(safe(), 'manor', 4), security: 80 },
      policy = togglePolicy(s, 'RECONSTRUCTION');
    const early = advanceFief(policy, 4);
    expect(early.security).toBe(s.security);
    const a = advanceFief(s, 35),
      b = advanceFief(policy, 35);
    expect(b.security).toBeGreaterThan(a.security);
    expect(b.prosperity).toBeGreaterThan(a.prosperity);
    expect(b.publicSentiment).toBeGreaterThan(a.publicSentiment);
  });
  it('shortfalls auto-stop policies, preserve soldiers, warn and never produce negative money', () => {
    const s = {
      ...high(),
      treasury: 0,
      security: 0,
      prosperity: 0,
      publicSentiment: 0,
      activePolicies: ['RESIDENT_RELIEF' as const],
    };
    const later = advanceFief(s, 30);
    expect(later.activePolicies).toHaveLength(0);
    expect(later.treasury).toBe(0);
    expect(later.economyReport.shortfall).toBeGreaterThan(0);
    expect(later.soldiers).toEqual(s.soldiers);
    expect(recruitSoldiers(later, 1)).toBe(later);
  });
});
describe('complete event-boundary simulation', () => {
  it('matches variable small ticks and one large jump through losses, recovery, policies and income', () => {
    let s = setFacilityLevel(initialFief(), 'manor', 5);
    s = togglePolicy(togglePolicy(s, 'RESIDENT_RELIEF'), 'SECURITY_SUPPORT');
    s = assignStanding(s, 20);
    s = startEmergency(increaseMonsterSaturation(s, 60), 15);
    s = recruitSoldiers(s, 20);
    const large = advanceFief(s, 237.25);
    let small = s;
    for (let i = 0; i < 949; i++) small = advanceFief(small, 0.25);
    expectSame(large, small);
  });
  it('matches non-aligned ticks through low saturation exponential efficiency and score thresholds', () => {
    const s = assignStanding({ ...safe(), security: 79, prosperity: 29.9 }, 20),
      large = advanceFief(s, 70.3);
    let small = s;
    for (let i = 0; i < 703; i++) small = advanceFief(small, 0.1);
    expectSame(large, small);
  });
  it('maintains soldier subsets, reserved capacity and bounded stats throughout long management', () => {
    let s = assignStanding(high(), 20);
    s = startEmergency(s, 20);
    for (let i = 0; i < 800; i++) {
      s = advanceFief(s, 0.25);
      expect(availableGarrison(s)).toBeGreaterThanOrEqual(0);
      expect(livingSoldiers(s)).toBeLessThanOrEqual(garrisonCapacity(s));
      expect(s.soldiers.healthy).toBeGreaterThanOrEqual(0);
      expect(s.soldiers.wounded).toBeGreaterThanOrEqual(0);
      expect(s.publicSentiment).toBeGreaterThanOrEqual(0);
      expect(s.treasury).toBeGreaterThanOrEqual(0);
    }
  });
});

it('a downward prosperity crisis boundary immediately blocks sentiment recovery under high tax', () => {
  const s = {
    ...safe(),
    taxPolicy: 'HIGH' as const,
    security: 80,
    prosperity: 30,
    recoveryTimers: { security: 5, prosperity: 0, sentiment: 30 },
  };
  const big = advanceFief(s, 1);
  let small = s as FiefState;
  for (let i = 0; i < 10; i++) small = advanceFief(small, 0.1);
  expectSame(big, small);
  expect(big.publicSentiment).toBeCloseTo(s.publicSentiment - C.tax.HIGH.sentimentBurden);
  expect(big.recoveryTimers.sentiment).toBe(0);
});
