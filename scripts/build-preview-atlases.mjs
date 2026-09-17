import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
const root = process.cwd();
const stroke = '#263b39',
  stone = '#a4aa8c',
  light = '#c5c6a4',
  shade = '#768577',
  roof = '#7e7060';
const poly = (points, fill, line = stroke, width = 2) =>
  `<polygon points="${points}" fill="${fill}" stroke="${line}" stroke-width="${width}" stroke-linejoin="round"/>`;
const line = (x1, y1, x2, y2, color = stroke, width = 2) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const ellipse = (x, y, rx, ry, color, opacity = 1) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${opacity}"/>`;
function ground(size = 256) {
  return (
    ellipse(size / 2, size * 0.76, size * 0.37, size * 0.14, '#101f20', 0.34) +
    poly(
      `${size * 0.1},${size * 0.71} ${size * 0.48},${size * 0.48} ${size * 0.91},${size * 0.7} ${size * 0.53},${size * 0.94}`,
      '#52634e',
      '#3b5044',
      1,
    )
  );
}
function building(x, y, w, h, top = roof, tower = false) {
  const d = w * 0.5;
  let s =
    poly(`${x},${y} ${x + w / 2},${y + d / 2} ${x + w / 2},${y + d / 2 - h} ${x},${y - h}`, shade) +
    poly(`${x},${y} ${x - w / 2},${y + d / 2} ${x - w / 2},${y + d / 2 - h} ${x},${y - h}`, stone);
  s += poly(
    `${x - w / 2},${y + d / 2 - h} ${x},${y - h - d / 2} ${x + w / 2},${y + d / 2 - h} ${x},${y + d / 2 - h + d / 2}`,
    top,
  );
  if (tower) {
    for (let a = -1; a <= 1; a++)
      s += `<rect x="${x + a * w * 0.29 - 3}" y="${y - h - 5}" width="6" height="8" fill="${light}" stroke="${stroke}" stroke-width="1"/>`;
  } else
    s += poly(
      `${x - w / 2 - 3},${y - h + d / 2} ${x},${y - h - d * 0.75} ${x + w / 2 + 3},${y - h + d / 2} ${x},${y - h + d}`,
      top,
    );
  s +=
    line(x - w * 0.18, y - h * 0.55, x - w * 0.18, y - h * 0.3, '#293b39', 3) +
    line(x + w * 0.2, y - h * 0.5, x + w * 0.2, y - h * 0.26, '#293b39', 3);
  return s;
}
function trees(x, y, n = 3) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const px = x + (i % 3) * 15 - 15,
      py = y + Math.floor(i / 3) * 12;
    s +=
      line(px, py, px, py - 28, '#59564a', 3) +
      poly(
        `${px - 12},${py - 9} ${px},${py - 41} ${px + 12},${py - 9}`,
        i % 2 ? '#57755e' : '#3d6051',
        '#2b4a40',
        1,
      ) +
      poly(`${px - 9},${py - 22} ${px},${py - 47} ${px + 9},${py - 22}`, '#668266', '#354f45', 1);
  }
  return s;
}
function settlement(kind, l) {
  let s = ground();
  if (kind === 'city' || kind === 'town' || kind === 'village') {
    const count = (kind === 'city' ? 6 : kind === 'town' ? 3 : 2) + l * 2;
    if (kind === 'city' && l >= 3)
      s +=
        poly('27,169 59,114 122,93 207,140 229,178 156,221 68,207', '#778774', '#293e37', 5) +
        poly('37,166 67,124 122,105 196,148 215,175 154,206 77,196', '#52634e', '#a2a68b', 2);
    const places = [
      [78, 158, 27, 30],
      [112, 164, 29, 42],
      [151, 170, 31, 36],
      [178, 150, 25, 35],
      [59, 180, 27, 27],
      [88, 193, 30, 31],
      [123, 194, 33, 32],
      [159, 199, 25, 36],
      [184, 181, 27, 27],
      [98, 134, 24, 30],
      [137, 139, 28, 36],
      [165, 128, 27, 28],
      [113, 110, 25, 30],
      [57, 147, 24, 26],
      [205, 159, 22, 26],
      [151, 115, 24, 35],
    ];
    for (const [x, y, w, h] of places.slice(0, count).sort((a, b) => a[1] - b[1]))
      s += building(x, y, w, h, kind === 'village' ? '#998967' : roof);
    if (kind === 'city') {
      s += building(124, 159, 48, 53 + l * 5, '#a39572');
      if (l >= 4)
        s +=
          building(132, 134, 20, 75, '#827761', true) +
          line(132, 53, 132, 31, '#c4ac71', 2) +
          poly('132,32 150,40 132,47', '#c4ac71', stroke, 1);
    }
    s += trees(31, 183, 2) + trees(214, 186, 2);
  } else if (kind === 'castle') {
    const wall = l === 1 ? '#8c8160' : stone;
    s +=
      poly('40,172 70,120 127,98 209,145 217,181 152,217 72,202', wall, stroke, 3) +
      poly('52,168 77,132 129,114 196,151 201,177 152,201 81,189', '#596953', stroke, 2);
    if (l >= 4)
      s += poly('27,175 64,108 126,81 220,138 236,188 156,231 53,210', 'none', '#acb298', 6);
    const towerPlaces = [
      [71, 132],
      [127, 112],
      [204, 154],
      [208, 187],
      [154, 215],
      [71, 199],
    ];
    for (const [x, y] of towerPlaces.slice(0, Math.min(6, l + 1)))
      s += building(x, y, 22, 28 + l * 7, l === 1 ? '#7e6e55' : light, l > 1);
    s += building(127, 178, 54, 45 + l * 9, l === 1 ? '#827456' : '#a9ad8b', l > 1);
    if (l >= 3) s += building(113, 155, 24, 65 + l * 4, light, true);
    if (l === 5)
      s += building(166, 163, 24, 77, light, true) + building(86, 167, 20, 65, light, true);
    s +=
      line(127, 90 - l * 7, 127, 68 - l * 7, '#b7a474', 2) +
      poly(`127,${69 - l * 7} 150,${75 - l * 7} 127,${86 - l * 7}`, '#b7a474', stroke, 1) +
      poly('137,213 154,203 154,185 141,189', '#253732', stroke, 1);
  } else if (kind === 'mine') {
    s +=
      poly('49,168 71,108 101,95 122,122 151,104 201,145 202,188 119,216', '#758778', stroke, 2) +
      poly('92,193 91,157 119,135 147,153 148,193', '#314338', '#233731', 3) +
      poly('100,187 101,160 119,146 140,160 140,188', '#172d2b', stroke, 2);
    s +=
      building(175, 185, 36, 26, roof) +
      line(111, 202, 81, 229, '#b0a887', 3) +
      line(130, 205, 107, 229, '#b0a887', 3);
    if (l > 1) s += building(64, 179, 27, 42, roof) + line(56, 141, 130, 114, '#a9a083', 4);
    if (l > 2)
      s +=
        building(162, 130, 29, 48, roof) +
        poly('84,207 105,212 119,206 97,200', '#bf936b', stroke, 1);
  } else if (kind === 'port') {
    s +=
      poly('22,180 131,115 233,179 126,240', '#294853', '#233b43', 2) +
      poly('51,160 122,195 180,164 177,179 122,214 48,177', '#93866a', stroke, 2);
    s += building(125, 149, 51, 34, roof) + building(77, 159, 29, 28, roof);
    s +=
      poly('166,187 201,190 220,177 201,202 177,207', '#857458', stroke, 2) +
      line(195, 189, 195, 134, '#c1b591', 3) +
      poly('195,137 195,181 218,179', '#c1b591', stroke, 1);
    if (l > 1) s += building(142, 121, 29, 40, roof);
    if (l > 2) s += building(175, 147, 31, 40, roof);
  } else if (kind === 'manor') {
    s +=
      poly('52,164 115,124 202,170 149,208', '#829473', stroke, 2) +
      building(123, 168, 68, 39 + l * 5, '#8b785e') +
      building(158, 167, 27, 51, roof) +
      trees(50, 176, 4);
    if (l > 1) s += building(86, 187, 31, 28, roof);
    if (l > 2)
      s += building(174, 191, 35, 33, roof) + poly('47,193 99,219 181,203', 'none', '#adb593', 3);
  } else {
    s += poly('49,173 87,121 177,141 210,182 141,211', '#938769', stroke, 4);
    s += building(119, 181, 42, 32 + l * 8, roof) + building(171, 166, 22, 40 + l * 5, roof, l > 1);
    if (l > 1) s += building(77, 175, 23, 42, roof, l > 1);
    if (l > 2) s += building(128, 143, 26, 54, roof, true);
  }
  return s;
}
function object(key) {
  let s = ground(128);
  if (key.startsWith('forest')) return s + trees(46, 86, 8) + trees(80, 90, 5);
  if (key.startsWith('farm')) {
    for (let i = 0; i < 6; i++)
      s += line(27 + i * 8, 81 - i * 4, 73 + i * 8, 104 - i * 4, '#b0a775', 3);
    return s + building(78, 73, 27, 27, '#968563');
  }
  if (key.startsWith('dungeon'))
    return (
      s +
      poly('32,81 47,44 67,36 99,72 96,93 61,105', '#6a7e72', stroke, 2) +
      poly('50,89 50,66 66,54 79,69 80,90', '#172c2d', '#adb39c', 3) +
      line(57, 57, 75, 67, '#a292c1', 3)
    );
  if (key.startsWith('resource')) {
    const color = key.includes('copper')
      ? '#c49471'
      : key.includes('iron')
        ? '#b0bcb1'
        : key.includes('wood')
          ? '#967e54'
          : '#c0b279';
    if (key.includes('wood')) return s + trees(62, 94, 4);
    if (key.includes('grain')) {
      for (let i = 0; i < 6; i++)
        s +=
          line(44 + i * 7, 89, 40 + i * 7, 51, color, 3) +
          poly(`${36 + i * 7},58 ${40 + i * 7},43 ${44 + i * 7},57`, color, stroke, 1);
      return s;
    }
    return (
      s +
      poly('30,88 38,61 58,55 69,76 85,59 104,81 91,101 61,107', color, stroke, 2) +
      poly('38,61 58,55 53,80 30,88', '#d1bc96', stroke, 1) +
      poly('69,76 85,59 82,88 61,107', '#859284', stroke, 1)
    );
  }
  if (key.startsWith('caravan'))
    return (
      s +
      ellipse(42, 91, 10, 12, '#3d4640') +
      ellipse(91, 97, 10, 12, '#3d4640') +
      poly('32,79 74,55 104,72 104,90 67,105 31,89', '#8d8064', stroke, 2) +
      poly('32,77 34,57 52,44 77,44 104,61 104,78 67,92', '#c2b798', stroke, 2) +
      line(62, 48, 63, 89, '#867f65', 2)
    );
  if (key.startsWith('event'))
    return (
      ellipse(64, 80, 34, 18, '#222f2b', 0.4) +
      line(64, 104, 64, 28, '#c3ad73', 4) +
      poly('64,29 103,45 81,61 64,55', '#a66c65', stroke, 2) +
      poly('47,108 64,97 82,108 64,116', '#7b8b73', stroke, 2)
    );
  if (key.includes('wolf'))
    return (
      s +
      poly('24,82 42,65 73,64 94,47 102,51 109,74 94,86 74,85 45,90', '#a0aaa0', stroke, 2) +
      poly('91,54 94,36 99,49', '#a0aaa0', stroke, 2) +
      line(45, 87, 40, 106, '#a0aaa0', 6) +
      line(78, 85, 83, 103, '#a0aaa0', 6) +
      line(25, 82, 14, 72, '#a0aaa0', 6) +
      ellipse(99, 63, 2, 2, '#dfb374')
    );
  const color = key.includes('bandit')
    ? '#a8796b'
    : key.includes('guard')
      ? '#b5ad86'
      : key.includes('player')
        ? '#7dab9c'
        : '#a89874';
  s +=
    ellipse(64, 45, 11, 12, '#bdb092') +
    poly('48,85 51,60 64,52 78,61 83,91 63,103', color, stroke, 2) +
    line(56, 98, 51, 113, '#766f5e', 6) +
    line(71, 98, 78, 110, '#766f5e', 6);
  if (key.includes('miner'))
    s += line(84, 87, 88, 43, '#bcad84', 4) + line(73, 40, 103, 46, '#a8b4a1', 5);
  else if (key.includes('player') || key.includes('guard') || key.includes('bandit'))
    s +=
      line(87, 94, 93, 42, '#c2c8b5', 4) +
      poly('40,68 53,75 52,93 42,98 32,88 32,75', '#718c7c', stroke, 2);
  else s += poly('81,79 98,84 96,98 81,94', '#8b785d', stroke, 2);
  return s;
}
function item(kind, tier) {
  const metals = ['#9caa95', '#b6bca8', '#d1d3bc', '#8bb9b5', '#ccb786'],
    shafts = ['#7c6b50', '#8a7757', '#977f5d', '#45716e', '#a18c58'];
  let s = ellipse(64, 101, 31, 10, '#162729', 0.28);
  if (kind === 'pickaxe')
    s +=
      line(31, 108, 84, 37, shafts[tier - 1], 9) +
      `<path d="M25 47Q66 5 106 53L93 55Q63 31 32 56Z" fill="${metals[tier - 1]}" stroke="${stroke}" stroke-width="3"/>`;
  else
    s +=
      poly('40,92 74,40 101,16 92,49 54,104', metals[tier - 1], stroke, 3) +
      line(44, 100, 27, 117, shafts[tier - 1], 10) +
      line(29, 84, 64, 108, '#bbab7b', 6);
  if (tier >= 3) s += line(58, 72, 73, 49, '#6fa69e', 2);
  if (tier >= 4)
    s += poly('64,41 70,47 64,53 58,47', tier === 5 ? '#ead097' : '#8dd7c3', stroke, 1);
  if (tier === 5) s += poly('77,33 84,38 79,46 72,39', '#dcc681', stroke, 1);
  return s;
}
function overlay(key) {
  const colors = ['#899c91', '#81b398', '#7cb3d3', '#ba91d0', '#d5b974'];
  if (key.startsWith('rarity')) {
    const index = ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(key.split('.')[1]);
    return (
      `<rect x="7" y="7" width="114" height="114" rx="13" fill="none" stroke="${colors[index]}" stroke-width="4"/><rect x="13" y="13" width="102" height="102" rx="9" fill="none" stroke="${colors[index]}" stroke-width="1" opacity=".45"/>` +
      poly('64,2 73,9 64,17 55,9', colors[index], stroke, 1)
    );
  }
  if (key.startsWith('enhance')) {
    const index = ['low', 'mid', 'high', 'great', 'max'].indexOf(key.split('.')[1]);
    const color = colors[Math.min(4, index)];
    let s = ellipse(64, 85, 40, 19, 'none');
    for (let n = 0; n < index + 1; n++)
      s += `<ellipse cx="64" cy="76" rx="${44 - n * 4}" ry="${48 - n * 4}" fill="none" stroke="${color}" stroke-width="${index > 2 ? 2 : 1}" opacity="${0.15 + n * 0.06}"/>`;
    if (index >= 2)
      s +=
        poly('17,78 25,66 32,77 24,90', color, 'none') +
        poly('94,28 101,18 108,29 101,38', color, 'none');
    if (index === 4)
      for (let i = 0; i < 8; i++)
        s += ellipse(17 + i * 13, 22 + Math.sin(i * 2) * 14, 2, 2, '#efd596');
    return s;
  }
  const kind = key.split('.')[1],
    color =
      kind === 'prosperous'
        ? '#d3bf7b'
        : kind === 'siege' || kind === 'burning' || kind === 'boss'
          ? '#d58d78'
          : kind === 'plague'
            ? '#b2bb7d'
            : '#b5bd9e';
  let s =
    ellipse(64, 103, 45, 15, 'none') +
    `<ellipse cx="64" cy="103" rx="45" ry="15" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="${kind === 'construction' ? '5 5' : '0'}"/>`;
  if (kind === 'siege' || kind === 'elite' || kind === 'boss')
    s += line(84, 30, 106, 54, color, 5) + line(84, 54, 106, 30, color, 5);
  else if (kind === 'construction')
    s += line(89, 30, 107, 50, color, 5) + line(99, 28, 106, 34, color, 6);
  else if (kind === 'prosperous')
    s += poly('93,30 98,40 109,43 99,47 96,59 91,48 81,44 90,40', color, 'none');
  else if (kind === 'burning')
    s += poly('91,66 82,46 93,32 97,48 105,39 110,61 100,69', '#cb9171', 'none');
  else if (kind === 'abandoned' || kind === 'damaged')
    s += poly('91,31 94,46 85,55 95,65', 'none', color, 3);
  else if (kind === 'plague')
    s += ellipse(98, 44, 13, 13, color, 0.6) + line(89, 44, 106, 44, stroke, 3);
  return s;
}
const definitions = [
  {
    id: 'world-settlements',
    folder: 'world',
    cell: 256,
    columns: 8,
    entries: [
      ...['city', 'castle', 'town', 'village'].flatMap((k) =>
        Array.from({ length: 5 }, (_, i) => [`settlement.${k}.l${i + 1}`, settlement(k, i + 1)]),
      ),
      ...['outpost', 'port', 'mine', 'manor'].flatMap((k) =>
        Array.from({ length: 3 }, (_, i) => [`settlement.${k}.l${i + 1}`, settlement(k, i + 1)]),
      ),
    ],
  },
  {
    id: 'world-objects',
    folder: 'world',
    cell: 128,
    columns: 8,
    entries: [
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
    ].map((k) => ['world.' + k, object(k)]),
  },
  {
    id: 'item-bases',
    folder: 'items',
    cell: 128,
    columns: 8,
    entries: ['pickaxe', 'sword'].flatMap((k) =>
      Array.from({ length: 5 }, (_, i) => [`item.${k}.t${i + 1}`, item(k, i + 1)]),
    ),
  },
  {
    id: 'common-overlays',
    folder: 'common',
    cell: 128,
    columns: 8,
    entries: [
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
    ].map((k) => [k, overlay(k)]),
  },
];
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
try {
  const page = await browser.newPage();
  for (const definition of definitions) {
    const { id, folder, cell, columns, entries } = definition,
      width = columns * cell,
      height = Math.ceil(entries.length / columns) * cell;
    const frames = {};
    let body = '';
    entries.forEach(([key, art], i) => {
      const x = (i % columns) * cell,
        y = Math.floor(i / columns) * cell;
      frames[key] = { x, y, w: cell, h: cell };
      body += `<svg x="${x}" y="${y}" width="${cell}" height="${cell}" viewBox="0 0 ${cell} ${cell}">${art}</svg>`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
    const dir = path.join(root, 'public/assets', folder, 'atlas');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, id + '.svg'), svg);
    const data = await page.evaluate(
      async ({ svg, width, height }) => {
        const image = new Image();
        image.src = 'data:image/svg+xml;base64,' + btoa(svg);
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(image, 0, 0);
        return canvas.toDataURL('image/webp', 0.94).split(',')[1];
      },
      { svg, width, height },
    );
    await fs.writeFile(path.join(dir, id + '.webp'), Buffer.from(data, 'base64'));
    await fs.writeFile(
      path.join(dir, id + '.json'),
      JSON.stringify(
        { id, image: `/assets/${folder}/atlas/${id}.webp`, width, height, frames },
        null,
        2,
      ) + '\n',
    );
    console.log(id, entries.length, 'frames', width + 'x' + height);
  }
} finally {
  await browser.close();
}
