import { WORLD_CONFIG } from '../../core/world/worldConfig';
import { CONTRACT_VERSION, type GameSnapshot } from '../../core/contracts';
export function createFixture(now = Date.now()): GameSnapshot {
  const iso = (offset: number) => new Date(now + offset).toISOString();
  const entity = (
    id: string,
    type: GameSnapshot['world'][number]['type'],
    x: number,
    y: number,
  ) => ({
    id,
    type,
    x,
    y,
    displayNameKey: 'world.' + type,
    markerAssetId: 'framework.marker.' + type,
    ...(type !== 'resource'
      ? {
          moveSpeed: {
            player: WORLD_CONFIG.movement.playerBaseSpeed,
            monster: 90,
            transport: 65,
            npc: 80,
            party: 105,
          }[type],
        }
      : {}),
  });
  const pool = ['Aerin', 'Mira', 'Rowan', 'Kael', 'Sena', 'Lio', 'Tara'].map((name, index) => ({
    id: 'character-' + (index + 1),
    name,
    portraitAssetId: 'framework.portrait.default',
    level: 12 - index,
    hp: 85 + index,
    maxHp: 100,
    roleKey: ['character.scout', 'character.miner', 'character.guard'][index % 3],
  }));
  return {
    contractVersion: CONTRACT_VERSION,
    sequence: 0,
    serverTime: iso(0),
    commandStatuses: [],
    mining: { active: [], recentResults: [] },
    world: [
      { ...entity('player-1', 'player', 1040, 800), status: 'idle' },
      {
        ...entity('monster-1', 'monster', 1420, 940),
        movement: {
          fromX: 1420,
          fromY: 940,
          toX: 1580,
          toY: 800,
          startedAt: iso(0),
          arrivesAt: iso(19000),
        },
      },
      {
        ...entity('transport-1', 'transport', 650, 740),
        movement: {
          fromX: 650,
          fromY: 740,
          toX: 1220,
          toY: 1080,
          startedAt: iso(0),
          arrivesAt: iso(22000),
        },
      },
      ...[
        ['resource-1', 1200, 600],
        ['resource-2', 1550, 1100],
      ].map(([id, x, y]) => ({
        ...entity(String(id), 'resource', Number(x), Number(y)),
        displayNameKey: 'mining.copperVein',
        interaction: {
          type: 'mining' as const,
          range: WORLD_CONFIG.interaction.defaultRange,
          durationMs: WORLD_CONFIG.interaction.miningDurationMs,
        },
      })),
      entity('npc-1', 'npc', 870, 980),
      ...Array.from({ length: 38 }, (_, i) =>
        entity(
          'ambient-' + i,
          i % 3 === 0 ? 'resource' : i % 3 === 1 ? 'monster' : 'npc',
          140 + ((i * 347) % (WORLD_CONFIG.width - 280)),
          140 + ((i * 193) % (WORLD_CONFIG.height - 280)),
        ),
      ),
    ],
    characters: {
      characterPool: pool,
      activeRoster: pool.slice(0, 5).map((c) => c.id),
      mainParty: pool.slice(0, 3).map((c) => c.id),
    },
    inventory: {
      gold: 1250,
      items: [
        { id: 'copper', nameKey: 'inventory.copper', assetId: 'item.copper', quantity: 12 },
        { id: 'ration', nameKey: 'inventory.ration', assetId: 'item.ration', quantity: 8 },
        { id: 'pickaxe', nameKey: 'inventory.pickaxe', assetId: 'item.pickaxe', quantity: 1 },
      ],
    },
    mail: [
      {
        id: 'mail-1',
        titleKey: 'mail.welcomeTitle',
        bodyKey: 'mail.welcomeBody',
        read: false,
        claimed: false,
        reward: 50,
        expiresAt: iso(7 * 86400000),
      },
      {
        id: 'mail-2',
        titleKey: 'mail.supplyTitle',
        bodyKey: 'mail.supplyBody',
        read: false,
        claimed: false,
        reward: 25,
        expiresAt: iso(3 * 86400000),
      },
    ],
    notices: [
      {
        id: 'notice-1',
        titleKey: 'notice.frameworkTitle',
        bodyKey: 'notice.frameworkBody',
        categoryKey: 'notice.news',
        pinned: true,
        important: true,
        startsAt: iso(-86400000),
        endsAt: iso(365 * 86400000),
        popup: true,
        emergency: false,
      },
      {
        id: 'notice-2',
        titleKey: 'notice.maintenanceTitle',
        bodyKey: 'notice.maintenanceBody',
        categoryKey: 'notice.system',
        pinned: false,
        important: false,
        startsAt: iso(-86400000),
        endsAt: iso(365 * 86400000),
        popup: false,
        emergency: false,
      },
    ],
    chat: [
      {
        id: 'chat-1',
        channel: 'system',
        sender: 'Living World',
        textKey: 'chat.welcome',
        sentAt: iso(0),
        decoration: { style: 'system' },
      },
      { id: 'chat-2', channel: 'global', sender: 'Nora', textKey: 'chat.trader', sentAt: iso(0) },
    ],
  };
}
