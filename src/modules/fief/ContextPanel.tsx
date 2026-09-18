import { RecoverySummary } from './RecoverySummary';
import { CastleManagementPanel } from './CastleManagementPanel';
import { ManorManagementPanel } from './ManorManagementPanel';
import { Meter, EventLog, duration, formatScore } from './presentation';
import type { Dispatch, SetStateAction } from 'react';
import { AtlasSprite } from '../atlas/AtlasSprite';
import { facilityFrame } from './FiefMap';
import { PROTOTYPE_CONFIG as CONFIG } from './config';
import {
  stateBand,
  gradeRange,
  canPostContract,
  contractBusy,
  dungeonContents,
  forecastReady,
  nextGrade,
  postDungeonContract,
  raidBusy,
  remainingSeconds,
  startDirectRaid,
  type Facility,
  type FiefState,
} from './model';
const contractLabels = {
  NONE: 'contractNone',
  POSTED: 'contractPosted',
  ACCEPTED: 'contractAccepted',
  IN_PROGRESS: 'contractProgress',
  SUCCEEDED: 'contractDone',
};
export function ContextPanel({
  state,
  selected,
  setState,
  t,
}: {
  state: FiefState;
  selected: Facility;
  setState: Dispatch<SetStateAction<FiefState>>;
  t: (key: string) => string;
}) {
  const contents = dungeonContents[state.grade],
    waves = state.waveState.filter((w) => !w.damageApplied);
  const level =
    selected === 'city'
      ? state.cityLevel
      : selected === 'castle'
        ? state.castleLevel
        : state.manorLevel;
  const raidLabel =
    state.raidState.status === 'PREPARING'
      ? 'raidPreparing'
      : state.raidState.status === 'IN_PROGRESS'
        ? 'raidProgress'
        : state.raidState.status === 'SUCCEEDED'
          ? 'raidDone'
          : 'raidReady';
  return (
    <aside
      className={'fief-context context-' + selected}
      aria-label={t(selected)}
      data-testid="fief-context"
      data-facility={selected}
    >
      <div className="fief-context-handle" aria-hidden="true" />
      <header>
        <AtlasSprite frameKey={facilityFrame(selected, state)} size={65} />
        <div>
          <span className="fief-eyebrow">
            {selected === 'dungeon' ? t('dungeon') : t('instance')}
          </span>
          <h2>{selected === 'dungeon' ? t('palace') : t(selected) + ' L' + level}</h2>
        </div>
        <b className="fief-context-level">{selected === 'dungeon' ? state.grade : 'L' + level}</b>
      </header>
      {selected === 'dungeon' && (
        <>
          <Meter label={t('aether')} value={state.aether} testId="fief-aether-value" t={t} />
          <Meter
            label={t('saturation')}
            value={state.monsterSaturation}
            testId="fief-saturation-value"
            kind="saturation"
            t={t}
          />
          <div className="fief-cycle-summary">
            <span>
              {t('cycleShort')}{' '}
              <b data-testid="fief-countdown">{duration(remainingSeconds(state))}</b>
            </span>
            <small>
              {t('range')}{' '}
              <b data-testid="fief-grade-range">
                {gradeRange(state.cityLevel).at(0)} ~ {gradeRange(state.cityLevel).at(-1)}
              </b>
            </small>
            <strong data-testid="fief-forecast">
              {forecastReady(state) ? t('confirmed') + ' · ' + nextGrade(state) : t('analysis')}
            </strong>
          </div>
          <dl className="fief-dungeon-contents">
            <div>
              <dt>{t('monsters')}</dt>
              <dd>{t(contents.monsters)}</dd>
            </div>
            <div>
              <dt>{t('boss')}</dt>
              <dd>{t(contents.boss)}</dd>
            </div>
            <div>
              <dt>{t('resource')}</dt>
              <dd>{t(contents.resource)}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="fief-action primary"
            data-testid="fief-raid-start"
            disabled={raidBusy(state) || state.aether <= 0}
            onClick={() => setState(startDirectRaid)}
          >
            {t('raidAction')} <span>⚔</span>
          </button>
          <div
            className="fief-action-status"
            role="status"
            data-testid="fief-raid-status"
            data-state={state.raidState.status}
          >
            {t(raidLabel)}
          </div>
          {raidBusy(state) && (
            <div
              className="fief-action-progress"
              role="progressbar"
              aria-label={t('raidAction')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(
                ((state.raidState.status === 'PREPARING'
                  ? state.raidState.elapsed
                  : CONFIG.raid.preparation + state.raidState.elapsed) /
                  (CONFIG.raid.preparation + CONFIG.raid.duration)) *
                  100,
              )}
            >
              <span
                style={{
                  width:
                    ((state.raidState.status === 'PREPARING'
                      ? state.raidState.elapsed
                      : CONFIG.raid.preparation + state.raidState.elapsed) /
                      (CONFIG.raid.preparation + CONFIG.raid.duration)) *
                      100 +
                    '%',
                }}
              />
            </div>
          )}
          <div className="fief-contract-card">
            <div>
              <span>{t('simulatedParty')}</span>
              <b>{CONFIG.contract.reward.toLocaleString()} G</b>
            </div>
            <p>{t('contractGoal')}</p>
            <button
              type="button"
              className="fief-action"
              data-testid="fief-contract-start"
              disabled={!canPostContract(state)}
              onClick={() => setState(postDungeonContract)}
            >
              {t('contractAction')} <span>→</span>
            </button>
            <div
              className="fief-action-status"
              role="status"
              data-testid="fief-contract-status"
              data-state={state.contractState.status}
            >
              {t(contractLabels[state.contractState.status])}
            </div>
            {!contractBusy(state) && state.treasury < CONFIG.contract.reward && (
              <small className="fief-action-warning">{t('insufficientGold')}</small>
            )}
          </div>
        </>
      )}
      {selected === 'castle' && <CastleManagementPanel state={state} setState={setState} t={t} />}
      {selected === 'city' && (
        <>
          <div
            className={'fief-city-state ' + (waves.length ? 'status-break' : '')}
            role="status"
            data-testid="fief-city-status"
          >
            {t(
              waves.length
                ? 'waveApproaching'
                : state.waveState.some((w) => w.damageApplied) &&
                    Math.min(state.security, state.prosperity, state.publicSentiment) <
                      CONFIG.territory.bands.stable
                  ? 'cityDamaged'
                  : 'cityCalm',
            )}
          </div>
          <dl className="fief-city-stats">
            {[
              ['sentiment', state.publicSentiment],
              ['security', state.security],
              ['prosperity', state.prosperity],
            ].map(([key, value]) => (
              <div key={key}>
                <dt>{t(String(key))}</dt>
                <dd>
                  {formatScore(Number(value))}{' '}
                  <small className={'fief-state-tag ' + stateBand(Number(value))}>
                    {t(stateBand(Number(value)))}
                  </small>
                </dd>
              </div>
            ))}
          </dl>
          <p className="fief-context-note">{t('cityEconomyHint')}</p>
          <p className="fief-context-note">{t('stateHint')}</p>
          <p>
            {t('range')} {gradeRange(state.cityLevel).join(' / ')}
          </p>
          <RecoverySummary state={state} t={t} />
          <EventLog state={state} t={t} />
        </>
      )}
      {selected === 'manor' && <ManorManagementPanel state={state} setState={setState} t={t} />}
    </aside>
  );
}
