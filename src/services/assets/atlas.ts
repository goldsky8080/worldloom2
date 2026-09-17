import { z } from 'zod';
const frameSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});
export const atlasManifestSchema = z
  .object({
    id: z.string().min(1),
    image: z.string().startsWith('/assets/'),
    width: z.number().int().positive().max(4096),
    height: z.number().int().positive().max(4096),
    frames: z.record(frameSchema),
  })
  .superRefine((atlas, context) => {
    for (const [key, frame] of Object.entries(atlas.frames))
      if (frame.x + frame.w > atlas.width || frame.y + frame.h > atlas.height)
        context.addIssue({
          code: 'custom',
          path: ['frames', key],
          message: 'Atlas frame outside sheet',
        });
  });
export type AtlasManifest = z.infer<typeof atlasManifestSchema>;
export interface AtlasDefinition {
  id: string;
  manifestPath: string;
}
export interface AtlasFrameAsset {
  atlasId: string;
  frameKey: string;
  recommendedDisplaySize: [number, number];
  anchor: [number, number];
}
export const previewAtlases: AtlasDefinition[] = [
  { id: 'world-settlements', manifestPath: '/assets/world/atlas/world-settlements.json' },
  { id: 'world-objects', manifestPath: '/assets/world/atlas/world-objects.json' },
  { id: 'item-bases', manifestPath: '/assets/items/atlas/item-bases.json' },
  { id: 'common-overlays', manifestPath: '/assets/common/atlas/common-overlays.json' },
];
const frames: AtlasFrameAsset[] = [];
for (const [kind, levels] of [
  ['city', 5],
  ['castle', 5],
  ['town', 5],
  ['village', 5],
  ['outpost', 3],
  ['port', 3],
  ['mine', 3],
  ['manor', 3],
] as const)
  for (let level = 1; level <= levels; level++)
    frames.push({
      atlasId: 'world-settlements',
      frameKey: `settlement.${kind}.l${level}`,
      recommendedDisplaySize: [
        kind === 'city' || kind === 'castle' ? 210 : 160,
        kind === 'city' || kind === 'castle' ? 210 : 160,
      ],
      anchor: [0.5, 0.73],
    });
for (const key of [
  'forest.base',
  'farm.base',
  'dungeon.base',
  'player.base',
  'npc.merchant',
  'npc.guard',
  'npc.miner',
  'npc.farmer',
  'monster.wolf',
  'monster.bandit',
  'resource.copper',
  'resource.iron',
  'resource.wood',
  'resource.grain',
  'caravan.base',
  'event.base',
])
  frames.push({
    atlasId: 'world-objects',
    frameKey: `world.${key}`,
    recommendedDisplaySize: [120, 120],
    anchor: [0.5, 0.7],
  });
for (const kind of ['pickaxe', 'sword'])
  for (let tier = 1; tier <= 5; tier++)
    frames.push({
      atlasId: 'item-bases',
      frameKey: `item.${kind}.t${tier}`,
      recommendedDisplaySize: [88, 88],
      anchor: [0.5, 0.5],
    });
for (const key of [
  'rarity.common',
  'rarity.uncommon',
  'rarity.rare',
  'rarity.epic',
  'rarity.legendary',
  'enhance.low',
  'enhance.mid',
  'enhance.high',
  'enhance.great',
  'enhance.max',
  'settlement.prosperous',
  'settlement.damaged',
  'settlement.burning',
  'settlement.siege',
  'settlement.plague',
  'settlement.abandoned',
  'settlement.construction',
  'rank.elite',
  'rank.boss',
])
  frames.push({
    atlasId: 'common-overlays',
    frameKey: key,
    recommendedDisplaySize: [88, 88],
    anchor: [0.5, 0.5],
  });
export const previewFrameAssets = frames;
export function enhancementKey(level: number) {
  return level === 0
    ? undefined
    : `enhance.${level <= 3 ? 'low' : level <= 6 ? 'mid' : level <= 9 ? 'high' : level <= 12 ? 'great' : 'max'}`;
}
