import type { Dispatch, SetStateAction } from 'react';
import { AtlasSprite } from '../atlas/AtlasSprite';
import { facilityFrame } from './FiefMap';
import { PROTOTYPE_CONFIG as CONFIG } from './config';
import {
  canPatrol,
  canPostContract,
  canRecruit,
  castleReadiness,
  contractBusy,
  dungeonContents,
  dungeonStatus,
  fiefWarnings,
  forecastReady,
  garrisonCapacity,
  gradeRange,
  nextGrade,
  postDungeonContract,
  pressureStatus,
  raidBusy,
  recruitSoldiers,
  remainingSeconds,
  startDirectRaid,
  startPatrol,
  type Facility,
  type FiefState,
} from './model';
export function duration(seconds: number) {
  const s = Math.ceil(seconds);
  return s >= 86400
    ? Math.floor(s / 86400) + 'd ' + Math.floor((s % 86400) / 3600) + 'h'
    : s >= 3600
      ? Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm'
      : String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
export function Meter({
  label,
  value,
  testId,
  kind = 'aether',
  t,
}: {
  label: string;
  value: number;
  testId: string;
  kind?: 'aether' | 'pressure';
  t: (key: string) => string;
}) {
  const status = kind === 'aether' ? dungeonStatus(value) : pressureStatus(value);
  return (
    <div className={'fief-meter meter-' + kind}>
      <div>
        <span>{label}</span>
        <strong data-testid={testId}>
          {value.toFixed(1)}
          <small> / 100</small>
        </strong>
      </div>
      <div
        className={'fief-aether-track status-' + status}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        <span style={{ width: value + '%' }} />
      </div>
      <small
        className={'status-' + status}
        data-testid={kind === 'aether' ? 'fief-status' : undefined}
      >
        {t(status)}
      </small>
    </div>
  );
}
export function EventLog({ state, t }: { state: FiefState; t: (key: string) => string }) {
  return (
    <div className="fief-event-log">
      <h3>{t('history')}</h3>
      {!state.log.length ? (
        <p>{t('noEvents')}</p>
      ) : (
        <ol>
          {state.log.slice(0, 6).map((entry) => (
            <li key={entry.id}>
              <span className={'fief-log-dot log-' + entry.kind} />
              <strong>{t(entry.kind + 'Event')}</strong>
              <small>#{entry.cycle}</small>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
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
    selected === 'city' ? state.cityLevel : selected === 'castle' ? state.castleLevel : 1;
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
            label={t('pressure')}
            value={state.monsterPressure}
            testId="fief-pressure-value"
            kind="pressure"
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
      {selected === 'castle' && (
        <>
          <div className="fief-garrison">
            <span>{t('garrison')}</span>
            <strong data-testid="fief-garrison">
              {state.garrison}
              <small> / {garrisonCapacity(state)}</small>
            </strong>
          </div>
          <div className="fief-capacity">
            <span>{t('readiness')}</span>
            <strong className={'readiness-' + castleReadiness(state)}>
              {t(castleReadiness(state))}
            </strong>
          </div>
          <button
            type="button"
            className="fief-action"
            data-testid="fief-recruit"
            disabled={!canRecruit(state)}
            onClick={() => setState(recruitSoldiers)}
          >
            {t('recruit')}
            <span>{CONFIG.castle.recruitCost} G</span>
          </button>
          {!canRecruit(state) && (
            <small className="fief-action-warning">
              {t(state.treasury < CONFIG.castle.recruitCost ? 'insufficientGold' : 'garrisonFull')}
            </small>
          )}
          <Meter
            label={t('pressure')}
            value={state.monsterPressure}
            testId="fief-pressure-value"
            kind="pressure"
            t={t}
          />
          <button
            type="button"
            className="fief-action primary"
            data-testid="fief-patrol-start"
            disabled={!canPatrol(state)}
            onClick={() => setState(startPatrol)}
          >
            {t('patrol')}
            <span>{CONFIG.patrol.cost} G</span>
          </button>
          <div
            className="fief-action-status"
            role="status"
            data-testid="fief-patrol-status"
            data-state={state.patrolState.status}
          >
            {t(
              state.patrolState.status === 'ON_PATROL'
                ? 'patrolMoving'
                : state.patrolState.status === 'SUCCEEDED'
                  ? 'patrolDone'
                  : 'patrolReady',
            )}
          </div>
          {state.patrolState.status === 'ON_PATROL' && (
            <div
              className="fief-action-progress"
              role="progressbar"
              aria-label={t('patrol')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((state.patrolState.elapsed / CONFIG.patrol.duration) * 100)}
            >
              <span
                style={{ width: (state.patrolState.elapsed / CONFIG.patrol.duration) * 100 + '%' }}
              />
            </div>
          )}
          {state.treasury < CONFIG.patrol.cost && (
            <small className="fief-action-warning">{t('insufficientGold')}</small>
          )}
          {state.garrison < CONFIG.patrol.requiredSoldiers && (
            <small className="fief-action-warning">{t('needSoldiers')}</small>
          )}
          <p className="fief-context-note">{t('patrolShort')}</p>
        </>
      )}
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
                : state.waveState.some((w) => w.damageApplied)
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
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <EventLog state={state} t={t} />
        </>
      )}
      {selected === 'manor' && (
        <>
          <div className="fief-garrison">
            <span>{t('treasury')}</span>
            <strong>
              {state.treasury.toLocaleString()}
              <small> G</small>
            </strong>
          </div>
          <div className="fief-report">
            <span>
              {t('warnings')} <b>{fiefWarnings(state).length}</b>
            </span>
            <span>
              {t('dungeon')}{' '}
              <b>
                {state.grade} · {t(dungeonStatus(state.aether))}
              </b>
            </span>
            <span>
              {t('castle')}{' '}
              <b>
                L{state.castleLevel} · {state.garrison}
              </b>
            </span>
            <span>
              {t('city')}{' '}
              <b>
                L{state.cityLevel} · {state.prosperity}
              </b>
            </span>
          </div>
          <EventLog state={state} t={t} />
        </>
      )}
    </aside>
  );
}
