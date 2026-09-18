import { dungeonStatus, saturationStatus, type FiefState } from './model';
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
  kind?: 'aether' | 'saturation';
  t: (key: string) => string;
}) {
  const status = kind === 'aether' ? dungeonStatus(value) : saturationStatus(value);
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

export const formatScore = (value: number) => Math.round(value * 10) / 10;
