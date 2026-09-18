import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { languageLabels, languages, setLanguage, type Language } from '../../services/localization';
import { FiefMap } from './FiefMap';
import { ContextPanel } from './ContextPanel';
import { duration, formatScore } from './presentation';
import { stateBand } from './management';
import { DeveloperPanel } from './DeveloperPanel';
import { useFiefCopy } from './copy';
import {
  advanceFief,
  dungeonStatus,
  fiefWarnings,
  initialFief,
  remainingSeconds,
  type Facility,
} from './model';
import './fief.css';
export function FiefPage() {
  const { t, language } = useFiefCopy();
  const [state, setState] = useState(initialFief),
    [paused, setPaused] = useState(false),
    [selected, setSelected] = useState<Facility>('dungeon'),
    [devOpen, setDevOpen] = useState(false);
  const devButton = useRef<HTMLButtonElement>(null);
  const closeDev = useCallback(() => {
    setDevOpen(false);
    devButton.current?.focus();
  }, []);
  useEffect(() => {
    if (paused) return;
    let previous = performance.now();
    const onVisibility = () => {
      previous = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const timer = window.setInterval(() => {
      const now = performance.now(),
        seconds = (now - previous) / 1000;
      previous = now;
      if (!document.hidden) setState((s) => advanceFief(s, Math.min(seconds, 5)));
    }, 250);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [paused]);
  const warnings = fiefWarnings(state),
    travelling = state.waveState.some((w) => !w.damageApplied),
    status = dungeonStatus(state.aether);
  function reset() {
    setState(initialFief());
    setSelected('dungeon');
    setPaused(false);
  }
  return (
    <main className="fief-page fief-gameplay" data-testid="fief-page">
      <header className="fief-header">
        <Link to="/atlas" className="fief-brand" aria-label={t('atlas')}>
          W<span>WORLDLOOM</span>
        </Link>
        <div className="fief-heading">
          <span className="fief-eyebrow">
            {t('kingdom')} · {t('prototypeShort')}
          </span>
          <h1>{t('title')}</h1>
        </div>
        <nav aria-label="Worldloom">
          <Link to="/atlas">{t('atlas')} ↗</Link>
          <Link to="/game">{t('game')} ↗</Link>
          <select
            aria-label={t('language')}
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {languageLabels[l]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="fief-dev-toggle"
            data-testid="fief-dev-toggle"
            ref={devButton}
            aria-expanded={devOpen}
            aria-controls={devOpen ? 'fief-dev-panel' : undefined}
            onClick={() => setDevOpen((v) => !v)}
          >
            DEV
          </button>
        </nav>
      </header>
      <div className="fief-content">
        <section className="fief-hud" aria-label={t('report')}>
          <div className="fief-treasury">
            <span aria-hidden="true">◈</span>
            <div>
              <small>{t('treasury')}</small>
              <strong data-testid="fief-treasury" data-value={state.treasury}>
                {state.treasury.toLocaleString(language)} <small>G</small>
              </strong>
            </div>
          </div>
          <dl>
            {[
              ['sentiment', state.publicSentiment],
              ['security', state.security],
              ['prosperity', state.prosperity],
            ].map(([key, value]) => (
              <div key={key}>
                <dt>
                  {t(String(key))}{' '}
                  <small className={'fief-state-tag ' + stateBand(Number(value))}>
                    {t(stateBand(Number(value)))}
                  </small>
                </dt>
                <dd data-testid={'fief-' + key + '-value'}>{formatScore(Number(value))}</dd>
              </div>
            ))}
          </dl>
          <div className="fief-hud-risks">
            <div>
              <span>{t('aetherShort')}</span>
              <strong data-testid="fief-hud-aether">
                {formatScore(state.aether)}
                <small> / 100</small>
              </strong>
            </div>
            <div>
              <span>{t('saturation')}</span>
              <strong data-testid="fief-hud-saturation">
                {formatScore(state.monsterSaturation)}
                <small> / 100</small>
              </strong>
            </div>
          </div>
          <div className="fief-hud-grade">
            <span>{t('grade')}</span>
            <strong data-testid="fief-grade">{state.grade}</strong>
            <small>
              {t('cycleShort')} {duration(remainingSeconds(state))}
            </small>
          </div>
        </section>
        <div
          className={'fief-world-status status-' + (travelling ? 'break' : status)}
          role={travelling || status === 'break' ? 'alert' : 'status'}
          data-testid="fief-world-status"
        >
          <span>{travelling ? '⚠' : warnings.length ? '◇' : '✦'}</span>
          {t(travelling ? 'waveApproaching' : (warnings[0] ?? 'calm'))}
          {status === 'break' && (
            <span className="fief-status" data-testid="fief-break-alert">
              {t('break')}
            </span>
          )}
          <small>{warnings.length ? t('warnings') + ' ' + warnings.length : t('lord')}</small>
        </div>
        <div className="fief-dashboard">
          <section className="fief-land">
            <FiefMap state={state} selected={selected} onSelect={setSelected} t={t} />
          </section>
          <ContextPanel state={state} selected={selected} setState={setState} t={t} />
        </div>
      </div>
      {devOpen && (
        <DeveloperPanel
          state={state}
          setState={setState}
          paused={paused}
          onPause={() => setPaused((v) => !v)}
          onReset={reset}
          onClose={closeDev}
          t={t}
        />
      )}
    </main>
  );
}
