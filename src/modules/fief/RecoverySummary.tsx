import { recoveryConditions, type FiefState } from './model';
import { PROTOTYPE_CONFIG as C } from './config';
import { duration } from './presentation';
export function RecoverySummary({ state, t }: { state: FiefState; t: (key: string) => string }) {
  const gates = recoveryConditions(state);
  return (
    <section className="fief-management-section">
      <h3>{t('recoveryStatus')}</h3>
      <dl className="fief-economy-report">
        {(['security', 'prosperity', 'sentiment'] as const).map((key) => (
          <div key={key}>
            <dt>{t(key)}</dt>
            <dd data-testid={'fief-recovery-' + key}>
              {!gates[key]
                ? t('recoveryBlocked')
                : state.recoveryTimers[key] >= C.territory.delays[key]
                  ? t('recovering')
                  : t('stabilityWait') +
                    ' ' +
                    duration(C.territory.delays[key] - state.recoveryTimers[key])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
