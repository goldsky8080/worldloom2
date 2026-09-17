import {
  containsPoint,
  type House,
  type Point,
  type SampleRegion,
  type Scenario,
  type Site,
  type Territory,
  type WorldObject,
} from './model';

const crest = (primaryColor: string, secondaryColor: string, sigil: number, pattern = 0) => ({
  shield: sigil % 6,
  pattern,
  sigil,
  banner: sigil % 5,
  ornament: sigil % 6,
  primaryColor,
  secondaryColor,
});
export const sampleHouses: House[] = [
  {
    id: 'crown',
    name: ['에르덴 왕실', 'Crown of Erden'],
    level: 20,
    prestige: 12800,
    influence: 960,
    titleRank: 'crown',
    crest: crest('#b9a26b', '#18292d', 0, 2),
    seatEntityId: 'capital-1',
  },
  {
    id: 'aurora',
    name: ['새벽사슴 가문', 'House Dawnstag'],
    level: 12,
    prestige: 3420,
    influence: 420,
    titleRank: 'count',
    crest: crest('#73b4a3', '#153b38', 1, 1),
    seatEntityId: 'manor-1',
  },
  {
    id: 'iron',
    name: ['철까마귀 가문', 'House Ironraven'],
    level: 9,
    prestige: 2210,
    influence: 310,
    titleRank: 'baron',
    crest: crest('#c68d63', '#362b2b', 2, 3),
    seatEntityId: 'castle-1',
  },
  {
    id: 'thorn',
    name: ['붉은가시 가문', 'House Redthorn'],
    level: 16,
    prestige: 6180,
    influence: 560,
    titleRank: 'marquess',
    crest: crest('#bb7174', '#38242d', 3, 4),
    seatEntityId: 'castle-3',
  },
  {
    id: 'tide',
    name: ['푸른돛 상단', 'House Bluesail'],
    level: 11,
    prestige: 1870,
    influence: 230,
    titleRank: 'knight',
    crest: crest('#7aadc6', '#203344', 4, 5),
    seatEntityId: 'port-1',
  },
  {
    id: 'wanderer',
    name: ['길벗 용병 가문', 'House Wayfarer'],
    level: 7,
    prestige: 1260,
    influence: 145,
    titleRank: 'untitled',
    crest: crest('#a9a18b', '#353630', 5, 6),
  },
];
// The central boundary follows exactly the river curve used by the terrain renderer.
const riverControl: Point[] = [
  { x: 3100, y: 0 },
  { x: 3250, y: 480 },
  { x: 2790, y: 1000 },
  { x: 3010, y: 1600 },
  { x: 2760, y: 2080 },
  { x: 2560, y: 2450 },
  { x: 2950, y: 2900 },
  { x: 3150, y: 3400 },
  { x: 3500, y: 4000 },
];
const riverBorder: Point[] = [];
for (let i = 1; i < riverControl.length; i++) {
  const a = riverControl[i - 1],
    b = riverControl[i],
    p1 = { x: a.x, y: a.y + (b.y - a.y) * 0.55 },
    p2 = { x: b.x - (b.x - a.x) * 0.3, y: b.y };
  for (let n = 0; n < 80; n++) {
    const t = n / 80,
      u = 1 - t;
    riverBorder.push({
      x: u * u * u * a.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * b.x,
      y: u * u * u * a.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * b.y,
    });
  }
}
riverBorder.push(riverControl[riverControl.length - 1]);
function riverPoint(y: number) {
  const end = riverBorder.findIndex((p) => p.y >= y);
  if (end <= 0) return riverBorder[0];
  const a = riverBorder[end - 1],
    b = riverBorder[end],
    t = (y - a.y) / (b.y - a.y);
  return { x: a.x + (b.x - a.x) * t, y };
}
const columns = [0, 1350, 2900, 4250, 6000],
  rows = [0, 900, 1950, 3000, 4000];
const vertices = rows.map((y, r) =>
  columns.map((x, c) => ({
    x: x + (c > 0 && c < 4 && r > 0 && r < 4 ? Math.sin(r * 7 + c * 3) * 210 : 0),
    y: y + (r > 0 && r < 4 && c > 0 && c < 4 ? Math.cos(r * 5 + c * 8) * 180 : 0),
  })),
);
vertices.forEach((row) => {
  row[2] = riverPoint(row[2].y);
});
const riverVertices = new Set(vertices.map((row) => row[2]));
function edge(a: Point, b: Point) {
  if (riverVertices.has(a) && riverVertices.has(b)) {
    const points = riverBorder.filter((p) => p.y > Math.min(a.y, b.y) && p.y < Math.max(a.y, b.y));
    return [a, ...(a.y < b.y ? points : points.reverse())];
  }
  const vertical = Math.abs(a.x - b.x) < Math.abs(a.y - b.y);
  const exterior =
    (a.x === b.x && (a.x === 0 || a.x === 6000)) || (a.y === b.y && (a.y === 0 || a.y === 4000));
  const bend = exterior ? 0 : Math.sin((a.x + b.x + a.y + b.y) / 630) * 145;
  return [
    a,
    { x: (a.x + b.x) / 2 + (vertical ? bend : 0), y: (a.y + b.y) / 2 + (vertical ? 0 : bend) },
  ];
}
const names: [string, string][] = [
  ['까마귀 산릉', 'Ravenridge'],
  ['은빛 수림', 'Silverbough'],
  ['북녘 고원', 'Northreach'],
  ['가시 관문', 'Thorngate'],
  ['밀빛 평야', 'Wheatmere'],
  ['왕도 분지', 'Crownvale'],
  ['구리빛 골짜기', 'Copperhollow'],
  ['안개 숲', 'Mistwood'],
  ['서부 성곽', 'Westwatch'],
  ['푸른나루', 'Azureford'],
  ['교역 삼각주', 'Trade Delta'],
  ['붉은 변경', 'Redmarch'],
  ['남부 목초지', 'Southmead'],
  ['검은 바위', 'Blackstone'],
  ['새벽 개척지', 'Dawn Frontier'],
  ['잊힌 해안', 'Forgotten Coast'],
];
const zones: Territory['zone'][] = [
  'frontier',
  'frontier',
  'wild',
  'contested',
  'core',
  'core',
  'frontier',
  'wild',
  'core',
  'core',
  'frontier',
  'contested',
  'core',
  'frontier',
  'frontier',
  'contested',
];
const owners = [
  'iron',
  'aurora',
  undefined,
  'thorn',
  'crown',
  'crown',
  'iron',
  undefined,
  'crown',
  'crown',
  'aurora',
  'thorn',
  'crown',
  undefined,
  undefined,
  undefined,
];
const territories: Territory[] = names.map((name, i) => {
  const r = Math.floor(i / 4),
    c = i % 4;
  const points = [vertices[r][c], vertices[r][c + 1], vertices[r + 1][c + 1], vertices[r + 1][c]];
  const polygon = points.flatMap((point, j) => edge(point, points[(j + 1) % 4]));
  const center = {
    x: points.reduce((sum, p) => sum + p.x, 0) / 4,
    y: points.reduce((sum, p) => sum + p.y, 0) / 4,
  };
  return {
    id: `A-${String(i + 1).padStart(2, '0')}`,
    regionId: 'erden',
    name,
    polygon,
    center,
    sizeClass: [0, 3, 15].includes(i) ? 'large' : [1, 6, 9, 13].includes(i) ? 'small' : 'medium',
    zone: zones[i],
    state: owners[i]
      ? zones[i] === 'core'
        ? 'established'
        : 'claimed'
      : i === 2 || i === 7
        ? 'dormant'
        : 'frontier',
    ownerHouseId: owners[i],
    controllerHouseId: owners[i] === 'crown' ? (i === 9 ? 'tide' : 'aurora') : owners[i],
    operatorHouseId: i === 9 ? 'tide' : undefined,
    stewardshipDays: owners[i] === 'crown' ? 30 : undefined,
    potential: {
      agriculture: [1, 2, 1, 2, 5, 4, 2, 1, 3, 4, 4, 2, 5, 1, 3, 2][i],
      mining: [5, 2, 4, 3, 1, 2, 5, 2, 2, 1, 2, 3, 1, 5, 3, 2][i],
      forestry: i % 4 === 1 || i === 7 ? 5 : 2,
      water: [5, 6, 9, 10, 14, 15].includes(i) ? 5 : 2,
      trade: zones[i] === 'core' ? 5 : i === 10 ? 5 : 2,
      defense: [0, 3, 8, 11, 13].includes(i) ? 5 : 2,
      danger: zones[i] === 'core' ? 1 : zones[i] === 'contested' || zones[i] === 'wild' ? 5 : 3,
      capacity: (i % 3) + 3,
    },
    siteIds: [],
  };
});
const sites: Site[] = [];
const objects: WorldObject[] = [];
function place(
  index: number,
  id: string,
  kind: WorldObject['kind'],
  name: [string, string],
  level: number,
  dx = 0,
  dy = 0,
  extra: Partial<WorldObject> = {},
) {
  const t = territories[index];
  const object: WorldObject = {
    id,
    regionId: 'erden',
    territoryId: t.id,
    kind,
    name,
    level,
    state: 'normal',
    x: t.center.x + dx,
    y: t.center.y + dy,
    ownerHouseId: t.ownerHouseId,
    controllerHouseId: t.controllerHouseId,
    ...extra,
  };
  objects.push(object);
  return object;
}
function site(index: number, kind: Site['kind'], entity?: WorldObject, dx = 0, dy = 0) {
  const t = territories[index],
    id = `site-${kind}-${index + 1}`;
  sites.push({
    id,
    territoryId: t.id,
    kind,
    name: [`${t.name[0]} ${kind} 후보지`, `${t.name[1]} ${kind} site`],
    x: entity?.x ?? t.center.x + dx,
    y: entity?.y ?? t.center.y + dy,
    entityId: entity?.id,
  });
  t.siteIds.push(id);
  if (entity) entity.siteId = id;
}
site(
  0,
  'castle',
  place(0, 'castle-1', 'castle', ['철까마귀 요새', 'Ironraven Keep'], 2, -80, 110, {
    fortification: 52,
    garrisonCapacity: 240,
    supplyCapacity: 680,
    patrolRadius: 460,
    siegeResistance: 45,
  }),
);
site(
  3,
  'castle',
  place(3, 'castle-2', 'castle', ['가시 관문성', 'Thorn Gate'], 4, 50, 110, {
    fortification: 84,
    garrisonCapacity: 850,
    supplyCapacity: 2300,
    patrolRadius: 900,
    siegeResistance: 80,
  }),
);
site(
  8,
  'castle',
  place(8, 'castle-3', 'castle', ['왕실 서부성', 'Royal Westwatch'], 5, -30, 60, {
    controllerHouseId: 'thorn',
    fortification: 96,
    garrisonCapacity: 1500,
    supplyCapacity: 4800,
    patrolRadius: 1200,
    siegeResistance: 92,
  }),
);
site(11, 'castle', undefined, 70, 60);
site(
  5,
  'city',
  place(5, 'capital-1', 'capital', ['에르덴 왕도', 'Erden Capital'], 5, 0, 60, {
    population: 18640,
    economy: 92,
    infrastructure: 95,
    security: 89,
    supply: 94,
  }),
);
site(
  10,
  'city',
  place(10, 'city-1', 'city', ['세 강의 도시', 'Three Rivers'], 3, 0, 60, {
    population: 5840,
    economy: 75,
    infrastructure: 68,
    security: 71,
    supply: 82,
  }),
);
place(1, 'manor-1', 'manor', ['새벽사슴 장원', 'Dawnstag Manor'], 2, 0, 80, {
  ownerHouseId: 'aurora',
  controllerHouseId: 'aurora',
});
place(9, 'port-1', 'port', ['푸른나루 항구', 'Azureford Port'], 2, 20, 80, {
  operatorHouseId: 'tide',
});
place(12, 'town-1', 'town', ['밀빛 시장', 'Wheatmere Market'], 2, 0, 70, {
  population: 1680,
  economy: 55,
  infrastructure: 51,
  security: 73,
  supply: 80,
});
place(14, 'outpost-1', 'outpost', ['새벽 전초기지', 'Dawn Outpost'], 1, 0, 70, {
  state: 'construction',
  ownerHouseId: undefined,
  controllerHouseId: 'aurora',
});
territories.forEach((t, i) => {
  const village = [1, 4, 6, 8, 9, 11, 12, 13].includes(i)
    ? place(
        i,
        `village-${i}`,
        'village',
        [`${t.name[0]} 마을`, `${t.name[1]} Village`],
        (i % 3) + 1,
        290,
        220,
        { population: 220 + i * 35 },
      )
    : undefined;
  site(i, 'village', village, 290, 220);
  place(i, `forest-${i}`, 'forest', ['산림 지대', 'Woodland'], 1, -280, -160);
  if (t.potential.agriculture >= 4)
    place(i, `farm-${i}`, 'farm', ['곡물 농장', 'Grain Farm'], 1, -320, 200);
});
for (const i of [0, 6, 13])
  site(
    i,
    'mine',
    place(
      i,
      `mine-${i}`,
      'mine',
      [i === 6 ? '구리빛 광산' : '산릉 광산', i === 6 ? 'Copperhollow Mine' : 'Ridge Mine'],
      i === 0 ? 3 : 1,
      -330,
      220,
      { operatorHouseId: 'iron' },
    ),
  );
site(15, 'port', undefined, 60, 50);
place(7, 'dungeon-1', 'dungeon', ['침묵의 지하묘', 'Silent Catacombs'], 1, 40, 80, {
  ownerHouseId: undefined,
  controllerHouseId: undefined,
});
place(2, 'dungeon-2', 'dungeon', ['잊힌 성소', 'Forgotten Shrine'], 1, 0, 60, {
  ownerHouseId: undefined,
  controllerHouseId: undefined,
});
place(11, 'event-1', 'event', ['변경의 긴장', 'Marches in Tension'], 1, -270, 0);
place(6, 'player-1', 'player', ['탐험가 에린', 'Explorer Aerin'], 12, 30, -120, {
  ownerHouseId: 'aurora',
  controllerHouseId: 'aurora',
});
place(5, 'npc-merchant', 'npc', ['왕도 상인', 'Capital Merchant'], 1, 220, -150, {
  role: 'merchant',
});
place(0, 'npc-miner', 'npc', ['광산 감독', 'Mine Overseer'], 1, -170, -60, { role: 'miner' });
place(12, 'npc-farmer', 'npc', ['농장지기', 'Farm Steward'], 1, -200, -160, { role: 'farmer' });
place(8, 'npc-guard', 'npc', ['왕실 경비대', 'Royal Guard'], 1, 180, -170, { role: 'guard' });
place(10, 'caravan-1', 'caravan', ['푸른돛 교역 행렬', 'Bluesail Caravan'], 1, -390, -60, {
  ownerHouseId: 'tide',
  controllerHouseId: 'tide',
});
for (const i of [2, 3, 7, 11, 13, 15]) {
  place(
    i,
    `monster-${i}`,
    'monster',
    [i === 7 ? '정예 늑대 무리' : '변경의 위협', i === 7 ? 'Elite Wolf Pack' : 'Frontier Threat'],
    i + 2,
    200,
    -120,
    {
      role: i % 2 ? 'wolf' : 'bandit',
      rank: i === 7 ? 'elite' : 'common',
      ownerHouseId: undefined,
      controllerHouseId: undefined,
    },
  );
}
territories.forEach((t, i) => {
  for (let n = 0; n < 3; n++)
    place(
      i,
      `resource-${i}-${n}`,
      'resource',
      [
        t.potential.mining >= 4 ? '광맥' : '지역 자원',
        t.potential.mining >= 4 ? 'Ore Vein' : 'Local Resource',
      ],
      1,
      70 + n * 95,
      -220 - n * 60,
      {
        resourceType:
          t.potential.mining >= 4 ? (n % 2 ? 'iron' : 'copper') : n % 2 ? 'wood' : 'grain',
      },
    );
});
export const sampleRegion: SampleRegion = {
  id: 'erden',
  name: ['에르덴 변경', 'The Erden Marches'],
  width: 6000,
  height: 4000,
  state: 'FRONTIER',
  territories,
  objects,
  sites,
  houses: sampleHouses,
  rivers: [
    [
      { x: 3100, y: 0 },
      { x: 3250, y: 480 },
      { x: 2790, y: 1000 },
      { x: 3010, y: 1600 },
      { x: 2760, y: 2080 },
      { x: 2560, y: 2450 },
      { x: 2950, y: 2900 },
      { x: 3150, y: 3400 },
      { x: 3500, y: 4000 },
    ],
    [
      { x: 6000, y: 1920 },
      { x: 5200, y: 1900 },
      { x: 4500, y: 2180 },
      { x: 3650, y: 2140 },
      { x: 2760, y: 2080 },
    ],
  ],
  roads: [
    [
      { x: 600, y: 450 },
      { x: 740, y: 1420 },
      { x: 2060, y: 1480 },
      { x: 3530, y: 2580 },
      { x: 5250, y: 2500 },
    ],
    [
      { x: 740, y: 1420 },
      { x: 730, y: 2500 },
      { x: 2080, y: 2560 },
      { x: 3450, y: 3550 },
    ],
    [
      { x: 2060, y: 1480 },
      { x: 2100, y: 500 },
      { x: 3550, y: 470 },
      { x: 5100, y: 460 },
    ],
  ],
};

/** Presentation-only scenarios. Never mutate gameplay cache, commands, or the fixture. */
export function regionForScenario(scenario: Scenario): SampleRegion {
  const region = structuredClone(sampleRegion);
  if (scenario === 'frontier') return region;
  region.state =
    scenario === 'prosperity' ? 'MATURE' : scenario === 'conflict' ? 'CONTESTED' : 'DECLINING';
  for (const t of region.territories) {
    if (t.state === 'dormant' || t.state === 'frontier') {
      t.state = 'developing';
      t.ownerHouseId = t.zone === 'wild' ? 'iron' : 'aurora';
      t.controllerHouseId = t.ownerHouseId;
    } else if (t.zone !== 'core') t.state = 'established';
  }
  for (const o of region.objects) {
    const t = region.territories.find((t) => t.id === o.territoryId)!;
    if (!o.ownerHouseId && !['monster', 'dungeon'].includes(o.kind)) {
      o.ownerHouseId = t.ownerHouseId;
      o.controllerHouseId = t.controllerHouseId;
    }
    if (['city', 'town', 'village', 'castle', 'manor'].includes(o.kind)) {
      o.level = Math.min(['manor'].includes(o.kind) ? 3 : 5, o.level + 1);
      o.state = 'prosperous';
    }
    if (o.kind === 'outpost') {
      o.level = 3;
      o.state = 'normal';
    }
  }
  const newVillageSite = region.sites.find((s) => s.id === 'site-village-15')!;
  const t = region.territories[14];
  const village: WorldObject = {
    id: 'village-new',
    regionId: region.id,
    territoryId: t.id,
    x: newVillageSite.x,
    y: newVillageSite.y,
    kind: 'village',
    name: ['새벽 마을', 'Dawn Village'],
    level: 1,
    state: 'construction',
    ownerHouseId: 'aurora',
    controllerHouseId: 'aurora',
    siteId: newVillageSite.id,
    population: 160,
  };
  region.objects.push(village);
  newVillageSite.entityId = village.id;
  if (scenario === 'conflict') {
    for (const t of region.territories.filter((t) => ['A-07', 'A-11', 'A-12'].includes(t.id))) {
      t.state = 'contested';
      t.controllerHouseId = 'thorn';
    }
    for (const o of region.objects.filter(
      (o) =>
        ['A-07', 'A-11'].includes(o.territoryId) &&
        ['castle', 'city', 'village', 'mine'].includes(o.kind),
    )) {
      o.controllerHouseId = 'thorn';
      o.state = o.kind === 'city' ? 'siege' : 'damaged';
    }
  }
  if (scenario === 'decline') {
    for (const t of region.territories.filter((t) =>
      ['A-03', 'A-08', 'A-12', 'A-16'].includes(t.id),
    ))
      t.state = t.id === 'A-08' ? 'abandoned' : 'declining';
    for (const o of region.objects.filter((o) => ['A-08', 'A-12', 'A-16'].includes(o.territoryId)))
      o.state = 'abandoned';
    region.objects.find((o) => o.id === 'city-1')!.state = 'damaged';
  }
  return region;
}
export function territoryAt(region: SampleRegion, point: Point) {
  return region.territories.find((t) => containsPoint(t.polygon, point));
}
