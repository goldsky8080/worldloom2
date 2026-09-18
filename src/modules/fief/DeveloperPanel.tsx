import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { PROTOTYPE_CONFIG as CONFIG } from './config';
import {
  advanceFief,
  changeCycle,
  devAdjustAether,
  gradeRange,
  increaseMonsterSaturation,
  raidDungeon,
  setFacilityLevel,
  setTestMode,
  triggerDungeonBreak,
  type FiefState,
  type Level,
  type TestMode,
} from './model';
export function DeveloperPanel({
  state,
  setState,
  paused,
  onPause,
  onReset,
  onClose,
  t,
}: {
  state: FiefState;
  setState: Dispatch<SetStateAction<FiefState>>;
  paused: boolean;
  onPause: () => void;
  onReset: () => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <section
      className="fief-dev-panel"
      id="fief-dev-panel"
      aria-label={t('devPanel')}
      data-testid="fief-dev-panel"
    >
      <header>
        <h2>{t('devPanel')}</h2>
        <button type="button" onClick={onClose} aria-label={t('close')}>
          ×
        </button>
      </header>
      <p>{t('devNote')}</p>
      <div className="fief-dev-levels">
        <label>
          {t('cityLevel')}
          <select
            data-testid="fief-dev-city-level"
            aria-label={t('cityLevel')}
            value={state.cityLevel}
            onChange={(e) => setState((s) => setFacilityLevel(s, 'city', Number(e.target.value)))}
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
            data-testid="fief-dev-castle-level"
            aria-label={t('castleLevel')}
            value={state.castleLevel}
            onChange={(e) => setState((s) => setFacilityLevel(s, 'castle', Number(e.target.value)))}
          >
            {[1, 2, 3, 4, 5].map((l) => (
              <option key={l} value={l}>
                L{l}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('manorLevel')}
          <select
            data-testid="fief-dev-manor-level"
            aria-label={t('manorLevel')}
            value={state.manorLevel}
            onChange={(e) => setState((s) => setFacilityLevel(s, 'manor', Number(e.target.value)))}
          >
            {[1, 2, 3, 4, 5].map((l) => (
              <option key={l} value={l}>
                L{l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        {t('testControls')}
        <select
          aria-label={t('testControls')}
          value={state.mode}
          onChange={(e) => setState((s) => setTestMode(s, e.target.value as TestMode))}
        >
          <option value="accelerated">{t('accelerated')}</option>
          <option value="design">{t('design')}</option>
        </select>
      </label>
      <div className="fief-dev-buttons">
        <button type="button" data-testid="fief-dev-pause" aria-pressed={paused} onClick={onPause}>
          {paused ? t('resume') : t('pause')}
        </button>
        <button
          type="button"
          data-testid="fief-dev-advance"
          onClick={() => setState((s) => advanceFief(s, CONFIG.dev.timeStep))}
        >
          {t('advance')}
        </button>
        <button
          type="button"
          data-testid="fief-dev-next-cycle"
          onClick={() => setState(changeCycle)}
        >
          {t('force')}
        </button>
        <button
          type="button"
          data-testid="fief-dev-aether"
          onClick={() => setState((s) => devAdjustAether(s, CONFIG.dev.aetherStep))}
        >
          {t('devAether')}
        </button>
        <button
          type="button"
          data-testid="fief-dev-saturation"
          onClick={() => setState((s) => increaseMonsterSaturation(s, CONFIG.dev.saturationStep))}
        >
          {t('devSaturation')}
        </button>
        <button
          type="button"
          data-testid="fief-dev-saturation-down"
          onClick={() => setState((s) => increaseMonsterSaturation(s, -CONFIG.dev.saturationStep))}
        >
          {t('devSaturationDown')}
        </button>
        <button
          type="button"
          data-testid="fief-dev-states"
          onClick={() =>
            setState((s) => ({
              ...s,
              security: 30,
              prosperity: 30,
              publicSentiment: 30,
              recoveryTimers: { security: 0, prosperity: 0, sentiment: 0 },
            }))
          }
        >
          {t('devStates')}
        </button>
        <button
          type="button"
          data-testid="fief-dev-treasury"
          onClick={() =>
            setState((s) => ({ ...s, treasury: s.treasury + CONFIG.dev.treasuryStep }))
          }
        >
          {t('devTreasury')}
        </button>
        <button
          type="button"
          data-testid="fief-dev-instant-raid"
          disabled={state.aether === 0}
          onClick={() => setState(raidDungeon)}
        >
          {t('devInstantRaid')}
        </button>
        <button
          type="button"
          data-testid="fief-dev-break"
          disabled={state.breakActive}
          onClick={() => setState(triggerDungeonBreak)}
        >
          {t('devBreak')}
        </button>
        <button
          type="button"
          data-testid="fief-dev-empty-treasury"
          onClick={() => setState((s) => ({ ...s, treasury: 0 }))}
        >
          {t('devEmptyTreasury')}
        </button>
        <button type="button" data-testid="fief-dev-reset" onClick={onReset}>
          {t('reset')}
        </button>
      </div>
      <div className="fief-dev-counters">
        <span>
          {t('raidCount')} {state.raids}
        </span>
        <span>
          {t('breakCount')} <b data-testid="fief-break-count">{state.breaks}</b>
        </span>
      </div>
      <details>
        <summary>{t('rules')}</summary>
        <p>{t('rulesNote')}</p>
        <p>{t('sessionNote')}</p>
      </details>
    </section>
  );
}
