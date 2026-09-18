import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { languageLabels, languages, setLanguage, type Language } from '../../services/localization';
import { AtlasSprite } from '../atlas/AtlasSprite';
import { FiefMap, facilityFrame } from './FiefMap';
import { useFiefCopy } from './copy';
import {
  advanceFief,
  castleReadiness,
  changeCycle,
  cycleDuration,
  DESIGN_CYCLE_SECONDS,
  dungeonContents,
  dungeonStatus,
  forecastReady,
  gradeRange,
  initialFief,
  nextGrade,
  raidDungeon,
  remainingSeconds,
  setFacilityLevel,
  setTestMode,
  type Facility,
  type Level,
  type TestMode,
} from './model';
import './fief.css';
function duration(seconds: number) {
  const s = Math.ceil(seconds);
  return s >= 86400
    ? Math.floor(s / 86400) + 'd ' + Math.floor((s % 86400) / 3600) + 'h'
    : s >= 3600
      ? Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm'
      : String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
const facilities: Facility[] = ['castle', 'city', 'manor', 'dungeon'];
export function FiefPage() {
  const { t, language } = useFiefCopy();
  const [state, setState] = useState(initialFief),
    [paused, setPaused] = useState(false),
    [selected, setSelected] = useState<Facility>('dungeon');
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
  const status = dungeonStatus(state.aether),
    contents = dungeonContents[state.grade];
  const level =
    selected === 'city'
      ? state.cityLevel
      : selected === 'castle'
        ? state.castleLevel
        : state.manorLevel;
  const rangeLabel = gradeRange(state.cityLevel).at(0) + ' ~ ' + gradeRange(state.cityLevel).at(-1);
  function reset() {
    setState(initialFief());
    setSelected('dungeon');
    setPaused(false);
  }
  return (
    <main className="fief-page" data-testid="fief-page">
      <header className="fief-header">
        <Link to="/atlas" className="fief-brand" aria-label={t('atlas')}>
          W<span>WORLDLOOM</span>
        </Link>
        <div className="fief-heading">
          <span className="fief-eyebrow">{t('subtitle')}</span>
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
        </nav>
      </header>
      <div className="fief-content">
        <div className="fief-intro">
          <div>
            <span className="fief-eyebrow">
              {t('kingdom')} / {t('lord')}
            </span>
            <p>{t('prototype')}</p>
          </div>
          <span className="fief-design-badge">
            21 DAYS <small>{t('cycle')}</small>
          </span>
        </div>
        {status === 'break' && (
          <div className="fief-break-banner" role="alert" data-testid="fief-break-alert">
            <strong>⚠ {t('warning')}</strong>
            <p>{t('warningNote')}</p>
          </div>
        )}
        <section className="fief-facilities" aria-label={t('mapHint')}>
          {facilities.map((kind) => (
            <button
              type="button"
              key={kind}
              aria-pressed={selected === kind}
              className={selected === kind ? 'is-selected' : ''}
              onClick={() => setSelected(kind)}
            >
              <AtlasSprite frameKey={facilityFrame(kind, state)} size={58} />
              <span>
                {t(kind)}
                <strong>
                  {kind === 'dungeon'
                    ? state.grade
                    : 'L' +
                      (kind === 'city'
                        ? state.cityLevel
                        : kind === 'castle'
                          ? state.castleLevel
                          : 1)}
                </strong>
              </span>
            </button>
          ))}
        </section>
        <div className="fief-dashboard">
          <section className="fief-land">
            <FiefMap state={state} selected={selected} onSelect={setSelected} t={t} />
            <div className="fief-facility-info">
              <AtlasSprite frameKey={facilityFrame(selected, state)} size={76} />
              <div>
                <span className="fief-eyebrow">
                  {selected === 'dungeon' ? t('permanent') : t('instance')}
                </span>
                <h2>{selected === 'dungeon' ? t('palace') : t(selected) + ' L' + level}</h2>
                <p>{selected === 'dungeon' ? t('levelNote') : t(selected + 'Role')}</p>
              </div>
            </div>
            <div className="fief-level-controls">
              <label>
                {t('cityLevel')}
                <select
                  aria-label={t('cityLevel')}
                  value={state.cityLevel}
                  onChange={(e) =>
                    setState((s) => setFacilityLevel(s, 'city', Number(e.target.value)))
                  }
                >
                  {[1, 2, 3, 4, 5].map((l) => (
                    <option key={l} value={l}>
                      L{l} · {gradeRange(l as Level).at(0)} ~ {gradeRange(l as Level).at(-1)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t('castleLevel')}
                <select
                  aria-label={t('castleLevel')}
                  value={state.castleLevel}
                  onChange={(e) =>
                    setState((s) => setFacilityLevel(s, 'castle', Number(e.target.value)))
                  }
                >
                  {[1, 2, 3, 4, 5].map((l) => (
                    <option key={l} value={l}>
                      L{l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="fief-capacity">
              <span>{t('readiness')}</span>
              <strong className={'readiness-' + castleReadiness(state)}>
                {t(castleReadiness(state))}
              </strong>
              <p>{t('patrolNote')}</p>
            </div>
          </section>
          <aside className="fief-dungeon-panel" aria-label={t('dungeon')}>
            <div className="fief-panel-title">
              <span className="fief-eyebrow">
                {t('dungeon')} · {t('cycle')} {state.cycle}
              </span>
              <span className={'fief-status status-' + status} data-testid="fief-status">
                {t(status)}
              </span>
            </div>
            <h2>{t('palace')}</h2>
            <div className="fief-grade-row">
              <div className="fief-grade" data-testid="fief-grade">
                {state.grade}
              </div>
              <div>
                <span>{t('current')}</span>
                <strong data-testid="fief-countdown">{duration(remainingSeconds(state))}</strong>
                <small>
                  {t('cycle')} #{state.cycle}
                </small>
              </div>
            </div>
            <div
              className="fief-cycle-track"
              role="progressbar"
              aria-label={t('cycle')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((state.elapsed / cycleDuration(state.mode)) * 100)}
            >
              <span style={{ width: (state.elapsed / cycleDuration(state.mode)) * 100 + '%' }} />
            </div>
            <div className="fief-forecast">
              <span>
                {t('range')} <b data-testid="fief-grade-range">{rangeLabel}</b>
              </span>
              <strong data-testid="fief-forecast">
                {forecastReady(state) ? t('confirmed') + ' · ' + nextGrade(state) : t('analysis')}
              </strong>
              <small>{t('levelNote')}</small>
            </div>
            <div className="fief-aether-heading">
              <h3>{t('aether')}</h3>
              <strong data-testid="fief-aether-value">
                {state.aether.toFixed(1)}
                <small> / 100</small>
              </strong>
            </div>
            <div
              className={'fief-aether-track status-' + status}
              role="progressbar"
              aria-label={t('aether')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(state.aether)}
            >
              <span style={{ width: state.aether + '%' }} />
            </div>
            <div className="fief-thresholds">
              <span>0</span>
              <span>35</span>
              <span>65</span>
              <span>85</span>
              <span>100</span>
            </div>
            <button
              type="button"
              className="fief-raid"
              onClick={() => setState(raidDungeon)}
              disabled={state.aether === 0}
            >
              {t('raid')} <span>−35</span>
            </button>
            <p className="fief-small-note">{t('raidNote')}</p>
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
            <div className="fief-counts">
              <span>
                {t('raidCount')} <b>{state.raids}</b>
              </span>
              <span>
                {t('breakCount')} <b data-testid="fief-break-count">{state.breaks}</b>
              </span>
            </div>
          </aside>
        </div>
        <section className="fief-time-controls" aria-label={t('testControls')}>
          <div>
            <span className="fief-eyebrow">{t('testControls')}</span>
            <select
              aria-label={t('testControls')}
              value={state.mode}
              onChange={(e) => setState((s) => setTestMode(s, e.target.value as TestMode))}
            >
              <option value="accelerated">{t('accelerated')}</option>
              <option value="design">{t('design')}</option>
            </select>
          </div>
          <div className="fief-time-buttons">
            <button type="button" aria-pressed={paused} onClick={() => setPaused((v) => !v)}>
              {paused ? t('resume') : t('pause')}
            </button>
            <button type="button" onClick={() => setState((s) => advanceFief(s, 30))}>
              {t('advance')}
            </button>
            <button type="button" onClick={() => setState(changeCycle)}>
              {t('force')} →
            </button>
            <button type="button" className="fief-reset" onClick={reset}>
              {t('reset')}
            </button>
          </div>
        </section>
        <div className="fief-bottom">
          <section className="fief-history">
            <h2>{t('history')}</h2>
            {state.log.length === 0 ? (
              <p>{t('empty')}</p>
            ) : (
              <ol>
                {state.log.map((entry) => (
                  <li key={entry.id}>
                    <span className={'fief-log-dot log-' + entry.kind} />
                    <strong>{t(entry.kind + 'Event')}</strong>
                    <span>
                      #{entry.cycle} · {entry.grade} · {entry.aether.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className="fief-rules">
            <h2>{t('rules')}</h2>
            <p>{t('rulesNote')}</p>
            <p>{t('sessionNote')}</p>
            <p>{t('noEconomy')}</p>
            <small>DESIGN {DESIGN_CYCLE_SECONDS / 86400}d / TEST 120s · FIEF PROTOTYPE v0.1</small>
          </section>
        </div>
      </div>
    </main>
  );
}
