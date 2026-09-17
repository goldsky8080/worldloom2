import type { AreaSubscription } from '../../core/contracts';
import { WORLD_CONFIG, type WorldBounds } from '../../core/world/worldConfig';
export const CHUNK_SIZE = WORLD_CONFIG.chunkSize;
export type ChunkConfig = WorldBounds & { chunkSize: number };
export function chunkBounds(config: ChunkConfig = WORLD_CONFIG) {
  return {
    maxX: Math.ceil(config.width / config.chunkSize) - 1,
    maxY: Math.ceil(config.height / config.chunkSize) - 1,
  };
}
export function visibleChunks(
  area: AreaSubscription,
  config: ChunkConfig = WORLD_CONFIG,
): string[] {
  const result: string[] = [],
    size = config.chunkSize,
    max = chunkBounds(config);
  for (
    let x = Math.max(0, Math.floor((area.centerX - area.width / 2) / size));
    x <= Math.min(max.maxX, Math.floor((area.centerX + area.width / 2) / size));
    x++
  )
    for (
      let y = Math.max(0, Math.floor((area.centerY - area.height / 2) / size));
      y <= Math.min(max.maxY, Math.floor((area.centerY + area.height / 2) / size));
      y++
    )
      result.push(`${x}:${y}`);
  return result;
}
export function chunkSubscriptionKey(area: AreaSubscription): string {
  return visibleChunks(area).join('|');
}
/** Subscribe to the entire chunk set, so small camera moves cannot leave a gap. */
export function chunkSubscriptionArea(area: AreaSubscription): AreaSubscription {
  const chunks = visibleChunks(area).map((key) => key.split(':').map(Number));
  if (!chunks.length) return { ...area, width: 0, height: 0 };
  const minX = Math.min(...chunks.map((c) => c[0])) * CHUNK_SIZE;
  const minY = Math.min(...chunks.map((c) => c[1])) * CHUNK_SIZE;
  const maxX = Math.min(
    WORLD_CONFIG.width,
    (Math.max(...chunks.map((c) => c[0])) + 1) * CHUNK_SIZE,
  );
  const maxY = Math.min(
    WORLD_CONFIG.height,
    (Math.max(...chunks.map((c) => c[1])) + 1) * CHUNK_SIZE,
  );
  return {
    ...area,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}
