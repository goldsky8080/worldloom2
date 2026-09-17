export interface Point {
  x: number;
  y: number;
}
export type AtlasLod = 'far' | 'medium' | 'near';
export type Scenario = 'frontier' | 'prosperity' | 'conflict' | 'decline';
export type RegionState =
  | 'DORMANT'
  | 'DISCOVERED'
  | 'FRONTIER'
  | 'ACTIVE'
  | 'MATURE'
  | 'CONTESTED'
  | 'DECLINING'
  | 'ABANDONED';
export type TerritoryState =
  | 'dormant'
  | 'frontier'
  | 'surveyed'
  | 'claimed'
  | 'developing'
  | 'established'
  | 'contested'
  | 'declining'
  | 'abandoned';
export type SettlementState =
  | 'normal'
  | 'prosperous'
  | 'damaged'
  | 'burning'
  | 'siege'
  | 'plague'
  | 'abandoned'
  | 'construction';
export type ObjectKind =
  | 'capital'
  | 'city'
  | 'castle'
  | 'town'
  | 'village'
  | 'manor'
  | 'outpost'
  | 'port'
  | 'mine'
  | 'forest'
  | 'farm'
  | 'dungeon'
  | 'player'
  | 'npc'
  | 'monster'
  | 'resource'
  | 'caravan'
  | 'event';
export interface Crest {
  shield: number;
  pattern: number;
  sigil: number;
  banner: number;
  ornament: number;
  primaryColor: string;
  secondaryColor: string;
}
export interface House {
  id: string;
  name: [string, string];
  level: number;
  prestige: number;
  influence: number;
  titleRank: 'crown' | 'knight' | 'baron' | 'count' | 'marquess' | 'untitled';
  crest: Crest;
  seatEntityId?: string;
}
export interface Territory {
  id: string;
  regionId: string;
  name: [string, string];
  polygon: Point[];
  center: Point;
  sizeClass: 'small' | 'medium' | 'large';
  state: TerritoryState;
  ownerHouseId?: string;
  controllerHouseId?: string;
  operatorHouseId?: string;
  stewardshipDays?: number;
  zone: 'core' | 'frontier' | 'contested' | 'wild';
  potential: {
    agriculture: number;
    mining: number;
    forestry: number;
    water: number;
    trade: number;
    defense: number;
    danger: number;
    capacity: number;
  };
  siteIds: string[];
}
export interface WorldObject extends Point {
  id: string;
  territoryId: string;
  regionId: string;
  kind: ObjectKind;
  name: [string, string];
  level: number;
  state: SettlementState;
  ownerHouseId?: string;
  controllerHouseId?: string;
  operatorHouseId?: string;
  siteId?: string;
  role?: string;
  resourceType?: string;
  rank?: 'common' | 'elite' | 'boss';
  population?: number;
  economy?: number;
  infrastructure?: number;
  security?: number;
  supply?: number;
  fortification?: number;
  garrisonCapacity?: number;
  supplyCapacity?: number;
  patrolRadius?: number;
  siegeResistance?: number;
}
export interface Site extends Point {
  id: string;
  territoryId: string;
  kind: 'castle' | 'city' | 'village' | 'mine' | 'port';
  name: [string, string];
  entityId?: string;
}
export interface SampleRegion {
  id: string;
  name: [string, string];
  width: number;
  height: number;
  state: RegionState;
  territories: Territory[];
  objects: WorldObject[];
  sites: Site[];
  houses: House[];
  rivers: Point[][];
  roads: Point[][];
}
export interface AtlasLayers {
  borders: boolean;
  houses: boolean;
  settlements: boolean;
  resources: boolean;
  actors: boolean;
  sites: boolean;
}
export interface AtlasCamera extends Point {
  zoom: number;
}
export type Selection = { type: 'territory' | 'object' | 'site' | 'house'; id: string };
export const PREVIEW_WORLD = {
  width: 200_000,
  height: 120_000,
  regionTarget: 60,
  provisional: true,
} as const;
export const atlasLod = (zoom: number): AtlasLod =>
  zoom < 0.23 ? 'far' : zoom < 0.6 ? 'medium' : 'near';
export function containsPoint(polygon: Point[], point: Point) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
export function objectVisible(object: WorldObject, lod: AtlasLod, layers: AtlasLayers) {
  if (['player', 'npc', 'monster', 'caravan'].includes(object.kind)) {
    return layers.actors && (object.kind === 'caravan' ? lod !== 'far' : lod === 'near');
  }
  if (['resource', 'farm', 'forest', 'mine', 'dungeon'].includes(object.kind))
    return layers.resources && (object.kind !== 'resource' ? lod !== 'far' : lod === 'near');
  return (
    layers.settlements &&
    (lod !== 'far' || ['capital', 'city', 'castle', 'manor', 'event'].includes(object.kind))
  );
}
export function visualKey(object: WorldObject) {
  const kind = object.kind === 'capital' ? 'city' : object.kind;
  if (['city', 'castle', 'town', 'village', 'mine', 'port', 'outpost', 'manor'].includes(kind))
    return `settlement.${kind}.l${object.level}`;
  return `world.${kind}.${object.resourceType ?? object.role ?? 'base'}`;
}
export function clampAtlasCamera(
  camera: AtlasCamera,
  region: Pick<SampleRegion, 'width' | 'height'>,
) {
  return {
    x: Math.max(0, Math.min(region.width, camera.x)),
    y: Math.max(0, Math.min(region.height, camera.y)),
    zoom: Math.max(0.065, Math.min(1.8, camera.zoom)),
  };
}
