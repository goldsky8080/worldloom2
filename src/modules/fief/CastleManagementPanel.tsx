import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { PROTOTYPE_CONFIG as C } from './config';
import {
  assignStanding,
  availableGarrison,
  canAssignStanding,
  canRecruit,
  canStartEmergency,
  emergencyCost,
  garrisonCapacity,
  livingSoldiers,
  maxRecruitment,
  recruitmentQuote,
  recruitSoldiers,
  startEmergency,
  standingEffect,
  type FiefState,
} from './model';
import { Meter, duration } from './presentation';
import { JobProgress } from './JobProgress';
export function CastleManagementPanel({
  state,
  setState,
  t,
}: {
  state: FiefState;
  setState: Dispatch<SetStateAction<FiefState>>;
  t: (key: string) => string;
}) {
  const [standing, setStanding] = useState(String(state.soldiers.standingAssigned));
  const [recruits, setRecruits] = useState(String(C.recruitment.defaultCount));
  const [emergency, setEmergency] = useState(String(C.emergency.defaultCount));
  useEffect(
    () => setStanding(String(state.soldiers.standingAssigned)),
    [state.soldiers.standingAssigned],
  );
  const recruitment = state.recruitmentState,
    count = Number(recruits),
    quote = recruitmentQuote(state, count),
    busy = recruitment.status === 'RECRUITING';
  const job = state.emergencyState,
    available = availableGarrison(state);
  return (
    <>
      <div className="fief-garrison">
        <span>{t('living')}</span>
        <strong data-testid="fief-garrison">
          {livingSoldiers(state)}
          <small> / {garrisonCapacity(state)}</small>
        </strong>
      </div>
      <dl className="fief-soldier-grid">
        {(
          [
            ['healthy', state.soldiers.healthy],
            ['wounded', state.soldiers.wounded],
            ['dead', state.soldiers.deadTotal],
            ['available', available],
            ['standingAssigned', state.soldiers.standingAssigned],
            ['emergencyAssigned', state.soldiers.emergencyAssigned],
          ] as const
        ).map(([key, value]) => (
          <div key={key}>
            <dt>{t(key)}</dt>
            <dd data-testid={'fief-' + key}>{value}</dd>
          </div>
        ))}
      </dl>
      <section className="fief-management-section">
        <h3>{t('standing')}</h3>
        <label className="fief-count-control">
          {t('assignedCount')}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={state.soldiers.healthy - state.soldiers.emergencyAssigned}
            value={standing}
            data-testid="fief-standing-count"
            onChange={(e) => setStanding(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="fief-action"
          data-testid="fief-standing-apply"
          disabled={
            !canAssignStanding(state, Number(standing)) ||
            Number(standing) === state.soldiers.standingAssigned
          }
          onClick={() => setState((s) => assignStanding(s, Number(standing)))}
        >
          {t('applyAssignment')}
          <span>⚑</span>
        </button>
        <p className="fief-context-note">{t('standingHint')}</p>
        <small>
          {t('suppressionEffect')} {standingEffect(state).toFixed(2)} / s · {t('casualties')}{' '}
          {state.standingLosses}
        </small>
      </section>
      <Meter
        label={t('saturation')}
        value={state.monsterSaturation}
        testId="fief-saturation-value"
        kind="saturation"
        t={t}
      />
      <section className="fief-management-section">
        <h3>{t('recruit')}</h3>
        <label className="fief-count-control">
          {t('recruitCount')}
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={maxRecruitment(state)}
            value={recruits}
            disabled={busy}
            data-testid="fief-recruit-count"
            onChange={(e) => setRecruits(e.target.value)}
          />
        </label>
        <p className="fief-quote">
          {Math.max(0, quote.cost)} G · {duration(Math.max(0, quote.duration))} · {t('maxCount')}{' '}
          {maxRecruitment(state)}
        </p>
        <button
          type="button"
          className="fief-action"
          data-testid="fief-recruit"
          disabled={!canRecruit(state, count)}
          onClick={() => setState((s) => recruitSoldiers(s, count))}
        >
          {t('recruitStart')}
          <span>＋</span>
        </button>
        <div role="status" data-testid="fief-recruitment-status" data-state={recruitment.status}>
          {t(
            busy ? 'recruiting' : recruitment.status === 'SUCCEEDED' ? 'recruited' : 'recruitReady',
          )}
          {busy ? ' · ' + recruitment.count : ''}
        </div>
        {busy && (
          <JobProgress
            label={t('recruit')}
            elapsed={recruitment.elapsed}
            duration={recruitment.duration}
          />
        )}
        {!busy && !canRecruit(state, count) && (
          <small className="fief-action-warning">
            {t(
              count > maxRecruitment(state)
                ? 'invalidCount'
                : livingSoldiers(state) + count > garrisonCapacity(state)
                  ? 'garrisonFull'
                  : state.treasury < quote.cost
                    ? 'insufficientGold'
                    : 'invalidCount',
            )}
          </small>
        )}
      </section>
      <section className="fief-management-section">
        <h3>{t('emergency')}</h3>
        <label className="fief-count-control">
          {t('deployCount')}
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={available}
            disabled={job.status === 'IN_PROGRESS'}
            value={emergency}
            data-testid="fief-emergency-count"
            onChange={(e) => setEmergency(e.target.value)}
          />
        </label>
        <p className="fief-quote">
          {Math.max(0, emergencyCost(Number(emergency)))} G · {duration(C.emergency.duration)}
        </p>
        <button
          type="button"
          className="fief-action primary"
          data-testid="fief-emergency-start"
          disabled={!canStartEmergency(state, Number(emergency))}
          onClick={() => setState((s) => startEmergency(s, Number(emergency)))}
        >
          {t('emergencyStart')}
          <span>⚔</span>
        </button>
        <div role="status" data-testid="fief-emergency-status" data-state={job.status}>
          {t(
            job.status === 'IN_PROGRESS'
              ? 'emergencyProgress'
              : job.status === 'SUCCEEDED'
                ? 'emergencyDone'
                : 'emergencyReady',
          )}
        </div>
        {job.status === 'IN_PROGRESS' && (
          <JobProgress
            label={t('emergency')}
            elapsed={job.elapsed}
            duration={C.emergency.duration}
          />
        )}
        <p className="fief-context-note">{t('emergencyHint')}</p>
        {state.treasury < emergencyCost(Number(emergency)) && (
          <small className="fief-action-warning">{t('insufficientGold')}</small>
        )}
      </section>
      <section className="fief-management-section">
        <h3>{t('soldierRecovery')}</h3>
        <p data-testid="fief-soldier-recovery">
          {state.soldiers.wounded > 0
            ? t('nextRecovery') +
              ' ' +
              duration(Math.min(...state.woundedBatches.map((b) => b.remaining)))
            : t('noWounded')}
        </p>
        <p className="fief-context-note">{t('recoveryHint')}</p>
      </section>
    </>
  );
}
