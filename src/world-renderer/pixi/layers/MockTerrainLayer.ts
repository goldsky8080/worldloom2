import { Container, Graphics, Text } from 'pixi.js';
import { WORLD_CONFIG } from '../../../core/world/worldConfig';
import { theme } from '../../../ui/theme/tokens';
import { translate } from '../../../services/localization';
/** Mock art only. Replace this layer with tile terrain without changing entity logic. */
export class MockTerrainLayer extends Container {
  constructor() {
    super();
    this.eventMode = 'none';
    const terrain = new Graphics()
      .rect(0, 0, WORLD_CONFIG.width, WORLD_CONFIG.height)
      .fill(theme.map.land);
    for (let i = 0; i < 85; i++) {
      const x = (i * 367) % WORLD_CONFIG.width,
        y = (i * 233) % WORLD_CONFIG.height,
        radius = 35 + (i % 5) * 22;
      terrain.ellipse(x, y, radius * 1.6, radius).fill({ color: theme.map.landLight, alpha: 0.35 });
    }
    terrain
      .moveTo(1300, -100)
      .bezierCurveTo(820, 350, 1560, 600, 970, 920)
      .bezierCurveTo(690, 1100, 1170, 1350, 700, 1750)
      .stroke({ color: theme.map.river, width: 94 });
    terrain
      .moveTo(340, 820)
      .bezierCurveTo(680, 650, 900, 1100, 1280, 1030)
      .bezierCurveTo(1700, 970, 1650, 500, 2080, 470)
      .stroke({ color: theme.map.road, width: 5, alpha: 0.45 });
    terrain
      .moveTo(840, 980)
      .lineTo(1200, 600)
      .lineTo(1720, 490)
      .stroke({ color: theme.map.road, width: 3, alpha: 0.25 });
    for (let i = 0; i < 110; i++) {
      const x = (i * 179 + 80) % WORLD_CONFIG.width,
        y = (i * 313 + 50) % WORLD_CONFIG.height;
      terrain
        .moveTo(x, y - 12)
        .lineTo(x + 8, y + 8)
        .lineTo(x - 8, y + 8)
        .closePath()
        .fill({ color: theme.map.landLight, alpha: 0.9 });
    }
    terrain
      .rect(775, 920, 130, 100)
      .fill({ color: theme.map.road, alpha: 0.12 })
      .stroke({ color: theme.map.road, width: 2, alpha: 0.5 });
    this.addChild(terrain);
    const names = [
      { key: 'world.region', x: 1010, y: 370, size: 27 },
      { key: 'world.subtitle', x: 1010, y: 420, size: 12 },
    ];
    names.forEach((n) => {
      const label = new Text({
        text: translate(n.key),
        style: {
          fontFamily: 'Georgia, serif',
          fontSize: n.size,
          fill: theme.colors.textMuted,
          letterSpacing: 3,
        },
      });
      label.position.set(n.x, n.y);
      label.alpha = 0.35;
      label.label = n.key;
      this.addChild(label);
    });
  }
  syncLabels() {
    this.children.forEach((child) => {
      if (child instanceof Text && child.label.startsWith('world.'))
        child.text = translate(child.label);
    });
  }
}
