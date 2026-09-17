import { assetManager } from '../../services/assets/AssetManager';
import { visualKey, type AtlasLod, type ObjectKind, type WorldObject } from './model';
export interface WorldVisual {
  atlasId: string;
  frameKey: string;
  scale: number;
  anchorX: number;
  anchorY: number;
  zIndex: number;
  lodMin: AtlasLod;
}
interface ObjectDefinition {
  kind: ObjectKind;
  lodMin: AtlasLod;
  zIndex: number;
}
const definitions: ObjectDefinition[] = [
  ...(['capital', 'city', 'castle', 'manor', 'event'] as ObjectKind[]).map((kind) => ({
    kind,
    lodMin: 'far' as const,
    zIndex: kind === 'event' ? 3 : 1,
  })),
  ...(
    [
      'town',
      'village',
      'outpost',
      'port',
      'mine',
      'forest',
      'farm',
      'dungeon',
      'caravan',
    ] as ObjectKind[]
  ).map((kind) => ({
    kind,
    lodMin: 'medium' as const,
    zIndex: kind === 'forest' || kind === 'farm' ? 0 : 1,
  })),
  ...(['player', 'npc', 'monster', 'resource'] as ObjectKind[]).map((kind) => ({
    kind,
    lodMin: 'near' as const,
    zIndex: 2,
  })),
];
export class WorldObjectRegistry {
  private entries = new Map<ObjectKind, ObjectDefinition>();
  constructor(values: ObjectDefinition[]) {
    for (const value of values) {
      if (this.entries.has(value.kind)) throw new Error('Duplicate world object kind');
      this.entries.set(value.kind, value);
    }
  }
  get(kind: ObjectKind) {
    const definition = this.entries.get(kind);
    if (!definition) throw new Error('Unknown world object kind: ' + kind);
    return definition;
  }
  visual(object: WorldObject): WorldVisual {
    const definition = this.get(object.kind),
      frameKey = visualKey(object),
      frame = assetManager.frame(frameKey);
    return {
      atlasId: frame.atlasId,
      frameKey,
      scale: 1,
      anchorX: frame.anchor[0],
      anchorY: frame.anchor[1],
      zIndex: definition.zIndex,
      lodMin: definition.lodMin,
    };
  }
}
export const worldObjectRegistry = new WorldObjectRegistry(definitions);
