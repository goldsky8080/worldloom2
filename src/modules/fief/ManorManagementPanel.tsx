import type { Dispatch, SetStateAction } from 'react';
import { PROTOTYPE_CONFIG as C } from './config';
import {
  POLICY_IDS,
  canChangeTax,
  canTogglePolicy,
  changeTax,
  fiefWarnings,
  policySlots,
  policyUpkeep,
  soldierUpkeep,
  stateBand,
  taxRevenue,
  togglePolicy,
  type FiefState,
  type TaxPolicy,
} from './model';
import { duration, EventLog, formatScore } from './presentation';
export function ManorManagementPanel({
  state,
  setState,
  t,
}: {
  state: FiefState;
  setState: Dispatch<SetStateAction<FiefState>>;
  t: (key: string) => string;
}) {
  return (
    <>
      <section className="fief-management-section">
        <h3>{t('taxPolicy')}</h3>
        <div className="fief-tax-options">
          {(['LOW', 'NORMAL', 'HIGH'] as const).map((tax) => (
            <button
              key={tax}
              type="button"
              aria-pressed={state.taxPolicy === tax}
              disabled={!canChangeTax(state, tax)}
              data-testid={'fief-tax-' + tax.toLowerCase()}
              onClick={() => setState((s) => changeTax(s, tax as TaxPolicy))}
            >
              {t('tax' + tax)}
            </button>
          ))}
        </div>
        <p role="status" data-testid="fief-tax-status" data-policy={state.taxPolicy}>
          {t('tax' + state.taxPolicy)} ·{' '}
          {state.taxCooldown > 0
            ? t('cooldown') + ' ' + duration(state.taxCooldown)
            : t('changeReady')}
        </p>
        <p className="fief-context-note">{t('taxHint')}</p>
      </section>
      <section className="fief-management-section">
        <h3>
          {t('activePolicies')}{' '}
          <span data-testid="fief-policy-slots">
            {state.activePolicies.length} / {policySlots(state)}
          </span>
        </h3>
        <div className="fief-policy-list">
          {POLICY_IDS.map((id) => {
            const active = state.activePolicies.includes(id),
              definition = C.policies.definitions[id],
              locked = state.manorLevel < definition.minLevel;
            return (
              <div key={id} className={'fief-policy-card ' + (active ? 'is-active' : '')}>
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={!canTogglePolicy(state, id)}
                  data-testid={'fief-policy-' + id.toLowerCase()}
                  onClick={() => setState((s) => togglePolicy(s, id))}
                >
                  <strong>{t(id)}</strong>
                  <span>
                    {t(active ? 'policyActive' : locked ? 'policyLocked' : 'policyInactive')}
                  </span>
                </button>
                <p>{t(id + 'Hint')}</p>
                <small>
                  {definition.upkeep} G / {duration(C.economy.interval)}
                  {locked ? ' · ' + t('unlockLevel') + ' L' + definition.minLevel : ''}
                  {state.policyCooldowns[id] > 0
                    ? ' · ' + t('cooldown') + ' ' + duration(state.policyCooldowns[id])
                    : ''}
                </small>
              </div>
            );
          })}
        </div>
        <p className="fief-context-note">{t('policyFundingHint')}</p>
      </section>
      <section className="fief-management-section">
        <h3>{t('treasury')}</h3>
        <dl className="fief-economy-report">
          <div>
            <dt>{t('taxRevenue')}</dt>
            <dd data-testid="fief-revenue-estimate">+{taxRevenue(state)} G</dd>
          </div>
          <div>
            <dt>{t('soldierUpkeep')}</dt>
            <dd>−{soldierUpkeep(state)} G</dd>
          </div>
          <div>
            <dt>{t('policyUpkeep')}</dt>
            <dd>−{policyUpkeep(state)} G</dd>
          </div>
          <div>
            <dt>{t('nextEconomyTick')}</dt>
            <dd data-testid="fief-economy-countdown">
              {duration(C.economy.interval - state.economyElapsed)}
            </dd>
          </div>
        </dl>
        <small data-testid="fief-economy-last">
          {t('lastSettlement')}: +{state.economyReport.revenue} / −
          {state.economyReport.soldierUpkeep + state.economyReport.policyUpkeep} G
        </small>
        {state.economyReport.shortfall > 0 && (
          <p role="alert" className="fief-action-warning">
            {t('fundingWarning')} · {state.economyReport.shortfall} G
          </p>
        )}
      </section>
      <section className="fief-management-section">
        <h3>{t('report')}</h3>
        <dl className="fief-state-report">
          {(
            [
              ['sentiment', state.publicSentiment],
              ['security', state.security],
              ['prosperity', state.prosperity],
            ] as const
          ).map(([key, value]) => (
            <div key={key}>
              <dt>{t(key)}</dt>
              <dd>
                {formatScore(value)}{' '}
                <small className={'fief-state-tag ' + stateBand(value)}>
                  {t(stateBand(value))}
                </small>
              </dd>
            </div>
          ))}
        </dl>
        <p className="fief-context-note">{t('stateHint')}</p>
        <p>
          {t('warnings')} {fiefWarnings(state).length}
        </p>
      </section>
      <EventLog state={state} t={t} />
    </>
  );
}
