import type { AreaSubscription } from '../../core/contracts';
export function inArea(point: { x: number; y: number }, area: AreaSubscription, padding = 96) {
  return (
    Math.abs(point.x - area.centerX) <= area.width / 2 + padding &&
    Math.abs(point.y - area.centerY) <= area.height / 2 + padding
  );
}
