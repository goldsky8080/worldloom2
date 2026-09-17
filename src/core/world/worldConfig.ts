/** Shared world coordinates and gameplay defaults; no renderer or DOM dependency. */
export const WORLD_CONFIG = {
  width: 2400,
  height: 1600,
  chunkSize: 400,
  camera: {
    defaultX: 1150,
    defaultY: 780,
    defaultZoom: 0.85,
    minZoom: 0.35,
    maxZoom: 2.4,
  },
  movement: { playerBaseSpeed: 120, minimumMovementMs: 500 },
  interaction: { defaultRange: 90, miningDurationMs: 5000 },
} as const;
export interface WorldBounds {
  width: number;
  height: number;
}
