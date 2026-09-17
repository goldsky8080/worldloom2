import { Atom } from '../../core/state/atom';
import { WORLD_CONFIG, type WorldBounds } from '../../core/world/worldConfig';
export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}
export function clampZoom(zoom: number) {
  return Math.max(WORLD_CONFIG.camera.minZoom, Math.min(WORLD_CONFIG.camera.maxZoom, zoom));
}
export function clampCamera(state: CameraState, bounds: WorldBounds = WORLD_CONFIG): CameraState {
  return {
    x: Math.max(0, Math.min(bounds.width, state.x)),
    y: Math.max(0, Math.min(bounds.height, state.y)),
    zoom: clampZoom(state.zoom),
  };
}
export function defaultCamera(): CameraState {
  return clampCamera({
    x: WORLD_CONFIG.camera.defaultX,
    y: WORLD_CONFIG.camera.defaultY,
    zoom: WORLD_CONFIG.camera.defaultZoom,
  });
}
export const camera = new Atom<CameraState>(defaultCamera());
