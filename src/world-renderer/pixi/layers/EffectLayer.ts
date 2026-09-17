import { Container, Graphics } from 'pixi.js';
import type { WorldEntityView } from '../../../core/contracts';
import { interpolate } from '../../movement/interpolate';
import { theme } from '../../../ui/theme/tokens';
export class EffectLayer extends Container {
  private route = new Graphics();
  constructor() {
    super();
    this.addChild(this.route);
    this.eventMode = 'none';
  }
  update(player: WorldEntityView | undefined, now: number, enabled: boolean) {
    this.route.clear();
    if (!enabled || !player?.movement) return;
    const from = interpolate(player, now),
      to = { x: player.movement.toX, y: player.movement.toY };
    this.route
      .moveTo(from.x, from.y)
      .lineTo(to.x, to.y)
      .stroke({ color: theme.map.player, width: 2, alpha: 0.5 });
    this.route
      .circle(to.x, to.y, 16)
      .stroke({ color: theme.map.player, width: 2, alpha: 0.85 })
      .moveTo(to.x - 8, to.y)
      .lineTo(to.x + 8, to.y)
      .moveTo(to.x, to.y - 8)
      .lineTo(to.x, to.y + 8)
      .stroke({ color: theme.map.player, width: 1.5 });
  }
}
