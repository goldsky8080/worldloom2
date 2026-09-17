import { Container, Graphics } from 'pixi.js';
import { WORLD_CONFIG } from '../../../core/world/worldConfig';
import { theme } from '../../../ui/theme/tokens';
export class DebugLayer extends Container {
  private grid = new Graphics();
  constructor() {
    super();
    const { width, height, chunkSize } = WORLD_CONFIG;
    for (let x = 0; x <= width; x += chunkSize) this.grid.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y <= height; y += chunkSize) this.grid.moveTo(0, y).lineTo(width, y);
    this.grid.stroke({ color: theme.map.grid, alpha: 0.45, width: 1 });
    this.addChild(this.grid);
    this.eventMode = 'none';
  }
  update(show: boolean) {
    this.grid.visible = show;
  }
}
