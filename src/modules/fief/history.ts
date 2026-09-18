import type { FiefState, FiefLog } from './model';
import { PROTOTYPE_CONFIG as CONFIG } from './config';
export function recordFief(state: FiefState, kind: FiefLog['kind']): FiefState {
  return {
    ...state,
    nextLogId: state.nextLogId + 1,
    log: [
      { id: state.nextLogId, kind, cycle: state.cycle, grade: state.grade, aether: state.aether },
      ...state.log,
    ].slice(0, CONFIG.logLimit),
  };
}
