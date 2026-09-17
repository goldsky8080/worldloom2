export interface WorldPoint {
  x: number;
  y: number;
}
export function worldDistance(a: WorldPoint, b: WorldPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
