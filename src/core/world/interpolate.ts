import type { WorldEntityView } from '../contracts';
export function interpolate(entity: WorldEntityView, now: number): { x: number; y: number } {
  if (!entity.movement) return { x: entity.x, y: entity.y };
  const m = entity.movement,
    start = Date.parse(m.startedAt),
    end = Date.parse(m.arrivesAt);
  const progress = end <= start ? 1 : Math.min(1, Math.max(0, (now - start) / (end - start)));
  return { x: m.fromX + (m.toX - m.fromX) * progress, y: m.fromY + (m.toY - m.fromY) * progress };
}
