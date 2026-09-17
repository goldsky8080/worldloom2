import { EffectLayer } from './layers/EffectLayer';
import { WORLD_CONFIG } from '../../core/world/worldConfig';
import { MockTerrainLayer } from './layers/MockTerrainLayer';
import { DebugLayer } from './layers/DebugLayer';
import { Application, Assets, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { runtime, realtimeGateway } from '../../app/bootstrap/services';
import { camera, clampZoom, clampCamera } from '../camera/camera';
import { interpolate } from '../movement/interpolate';
import { inArea } from '../aoi/area';
import { visibleChunks, chunkSubscriptionKey, chunkSubscriptionArea } from '../chunk/chunks';
import { defaultLodPolicy } from '../entity/lod';
import { assetManager } from '../../services/assets/AssetManager';
import { locale, translate } from '../../services/localization';
import { settings } from '../../services/settings';
import { timeService } from '../../services/time/TimeService';
import { theme } from '../../ui/theme/tokens';
import { worldDebug, selectedEntity } from '../../shell/state';
import type { AreaSubscription, WorldEntityView } from '../../core/contracts';
interface EntitySprite {
  container: Container;
  sprite: Sprite;
  dot: Graphics;
  ring: Graphics;
  label: Text;
  hp: Graphics;
  entity: WorldEntityView;
}
export class WorldScene {
  private app = new Application();
  private root = new Container();
  private terrain = new MockTerrainLayer();
  private entities = new Container();
  private effects = new EffectLayer();
  private debug = new DebugLayer();
  private aoi = new Graphics();
  private views = new Map<string, EntitySprite>();
  private textures = new Map<string, Texture>();
  private disposed = false;
  private ready = false;
  private unsubscribe: (() => void)[] = [];
  private resize?: ResizeObserver;
  private drag?: { x: number; y: number; cameraX: number; cameraY: number };
  private dragDistance = 0;
  private lastAreaAt = 0;
  private lastArea = '';
  private statsAt = 0;
  constructor(
    private host: HTMLElement,
    private select: (id: string) => void,
  ) {}
  async init() {
    await this.app.init({
      width: Math.max(1, this.host.clientWidth),
      height: Math.max(1, this.host.clientHeight),
      background: theme.map.land,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
      preference: 'webgl',
    });
    this.ready = true;
    if (this.disposed) {
      this.app.destroy(true, { children: true });
      this.ready = false;
      return;
    }
    this.host.appendChild(this.app.canvas);
    this.app.canvas.setAttribute(
      'aria-label',
      translate('menu.map') + '. ' + translate('world.keyboardHint'),
    );
    this.app.stage.addChild(this.root);
    this.root.addChild(this.terrain, this.entities, this.effects, this.debug);
    this.app.stage.addChild(this.aoi);
    this.resize = new ResizeObserver(() => {
      if (!this.disposed)
        this.app.renderer.resize(
          Math.max(1, this.host.clientWidth),
          Math.max(1, this.host.clientHeight),
        );
    });
    this.resize.observe(this.host);
    this.bindInput();
    await Promise.all(
      ['player', 'monster', 'transport', 'resource', 'npc', 'party'].map(async (name) => {
        const id = 'framework.marker.' + name,
          path = await assetManager.resolve(id);
        const texture = await Assets.load<Texture>(path);
        if (!this.disposed) this.textures.set(id, texture);
      }),
    );
    if (this.disposed) return;
    this.syncEntities();
    this.syncHealth();
    this.syncSettings();
    this.unsubscribe.push(
      runtime.connection.subscribe(() => {
        this.lastArea = '';
      }),
      runtime.cache.world.subscribe(() => {
        this.syncEntities();
        this.syncHealth();
      }),
      runtime.cache.characters.subscribe(() => this.syncHealth()),
      locale.subscribe(() => this.syncLabels()),
      settings.subscribe(() => this.syncSettings()),
    );
    // Ready means the first frame has coordinates and hit targets, not merely loaded textures.
    this.tick();
    this.app.renderer.render({ container: this.app.stage });
    this.app.ticker.add(this.tick);
  }
  private syncLabels() {
    this.views.forEach((view) => {
      view.label.text = translate(view.entity.displayNameKey);
    });
    this.terrain.syncLabels();
    this.app.canvas.setAttribute(
      'aria-label',
      translate('menu.map') + '. ' + translate('world.keyboardHint'),
    );
  }
  private syncHealth() {
    const characters = runtime.cache.characters.get(),
      main = characters.characterPool.find((c) => c.id === characters.mainParty[0]);
    this.views.forEach((view) => {
      if (view.entity.type !== 'player' || !main) return;
      const ratio = Math.max(0, Math.min(1, main.hp / main.maxHp));
      view.hp.clear().roundRect(-22, -42, 44, 4, 2).fill(theme.map.river);
      if (ratio) view.hp.roundRect(-22, -42, 44 * ratio, 4, 2).fill(theme.map.resource);
    });
  }
  private syncSettings() {
    const s = settings.get();
    this.app.ticker.maxFPS = s.graphics.battery ? 30 : s.graphics.fps;
  }
  private syncEntities() {
    const entities = runtime.cache.world.get(),
      ids = new Set(entities.map((e) => e.id));
    this.views.forEach((view, id) => {
      if (!ids.has(id)) {
        view.container.destroy({ children: true });
        this.views.delete(id);
      }
    });
    for (const entity of entities) {
      const existing = this.views.get(entity.id);
      if (existing) {
        existing.entity = entity;
        existing.label.text = translate(entity.displayNameKey);
        const texture = this.textures.get(entity.markerAssetId);
        if (texture) existing.sprite.texture = texture;
        continue;
      }
      const texture = this.textures.get(entity.markerAssetId);
      if (!texture) continue;
      const container = new Container(),
        sprite = new Sprite(texture),
        color = theme.map[entity.type === 'party' ? 'player' : entity.type];
      sprite.anchor.set(0.5);
      sprite.width = entity.id.startsWith('ambient-') ? 36 : 64;
      sprite.height = sprite.width;
      const ring = new Graphics()
        .circle(0, 0, 33)
        .stroke({ color: theme.map.player, width: 2 })
        .circle(0, 0, 38)
        .stroke({ color: theme.map.player, alpha: 0.3, width: 1 });
      const dot = new Graphics().circle(0, 0, 7).fill(color);
      const label = new Text({
        text: translate(entity.displayNameKey),
        style: {
          fontFamily: 'sans-serif',
          fontSize: 11,
          fill: theme.colors.text,
          dropShadow: { color: theme.colors.background, blur: 4, distance: 0 },
        },
      });
      label.anchor.set(0.5);
      label.y = 39;
      const hp = new Graphics()
        .roundRect(-22, -35, 44, 4, 2)
        .fill(theme.map.river)
        .roundRect(-22, -35, 37, 4, 2)
        .fill(theme.map.resource);
      container.addChild(ring, sprite, dot, label, hp);
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.on('pointertap', () => {
        if (this.dragDistance < 6) this.select(entity.id);
      });
      this.entities.addChild(container);
      this.views.set(entity.id, { container, sprite, ring, dot, label, hp, entity });
    }
  }
  private tick = () => {
    if (this.disposed) return;
    const c = camera.get(),
      screen = this.app.screen,
      s = settings.get(),
      now = timeService.now();
    this.root.scale.set(c.zoom);
    this.root.position.set(screen.width / 2 - c.x * c.zoom, screen.height / 2 - c.y * c.zoom);
    const area: AreaSubscription = {
      centerX: c.x,
      centerY: c.y,
      width: screen.width / c.zoom,
      height: screen.height / c.zoom,
      zoom: c.zoom,
    };
    const lod = defaultLodPolicy.level(c.zoom, this.views.size);
    let visible = 0;
    this.views.forEach((view) => {
      const point = interpolate(view.entity, now);
      view.container.position.set(point.x, point.y);
      view.container.visible = inArea(point, area) && visible < s.graphics.entities;
      if (!view.container.visible) return;
      visible++;
      view.sprite.visible = lod !== 'dot' && lod !== 'cluster';
      view.dot.visible = !view.sprite.visible;
      view.label.visible =
        s.interface.names &&
        lod === 'detail' &&
        (!view.entity.id.startsWith('ambient-') ||
          selectedEntity.get() === view.entity.id ||
          c.zoom > 1.5);
      view.hp.visible = s.interface.hp && view.entity.type === 'player';
      view.ring.visible = selectedEntity.get() === view.entity.id;
      view.ring.alpha = s.graphics.effects > 0 ? 0.72 + Math.sin(now / 350) * 0.2 : 1;
    });
    this.effects.update(
      runtime.cache.world.get().find((e) => e.id === 'player-1'),
      now,
      s.graphics.effects > 0,
    );
    const debug = worldDebug.get();
    this.debug.update(debug.grid);
    this.aoi.clear();
    if (debug.aoi)
      this.aoi
        .rect(35, 90, Math.max(0, screen.width - 70), Math.max(0, screen.height - 125))
        .stroke({ color: theme.map.player, width: 1, alpha: 0.5 });
    if (now - this.lastAreaAt > 120 && runtime.connection.get() === 'connected') {
      const key = chunkSubscriptionKey(area);
      if (key !== this.lastArea) {
        this.lastArea = key;
        realtimeGateway.subscribeArea(chunkSubscriptionArea(area));
      }
      this.lastAreaAt = now;
    }
    if (now - this.statsAt > 500) {
      worldDebug.set({
        ...worldDebug.get(),
        visible,
        chunks: visibleChunks(area).length,
        fps: Math.round(this.app.ticker.FPS),
      });
      this.statsAt = now;
    }
  };
  private bindInput() {
    const canvas = this.app.canvas;
    canvas.tabIndex = 0;
    const keydown = (event: KeyboardEvent) => {
      const c = camera.get(),
        delta = 100 / c.zoom;
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [-delta, 0],
        ArrowRight: [delta, 0],
        ArrowUp: [0, -delta],
        ArrowDown: [0, delta],
      };
      const direction = directions[event.key];
      if (direction) {
        event.preventDefault();
        camera.set({
          ...c,
          x: Math.max(0, Math.min(WORLD_CONFIG.width, c.x + direction[0])),
          y: Math.max(0, Math.min(WORLD_CONFIG.height, c.y + direction[1])),
        });
      }
      if (event.key === '+' || event.key === '-' || event.key === '=') {
        event.preventDefault();
        camera.set({ ...c, zoom: clampZoom(c.zoom * (event.key === '-' ? 1 / 1.15 : 1.15)) });
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const nearest = [...this.views.values()]
          .filter((v) => v.container.visible)
          .sort(
            (a, b) =>
              Math.hypot(a.container.x - c.x, a.container.y - c.y) -
              Math.hypot(b.container.x - c.x, b.container.y - c.y),
          )[0];
        if (nearest) this.select(nearest.entity.id);
      }
    };
    canvas.addEventListener('keydown', keydown);
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      this.dragDistance = 0;
      const c = camera.get();
      this.drag = { x: e.clientX, y: e.clientY, cameraX: c.x, cameraY: c.y };
    };
    const move = (e: PointerEvent) => {
      if (!this.drag) return;
      const c = camera.get(),
        dx = e.clientX - this.drag.x,
        dy = e.clientY - this.drag.y;
      this.dragDistance = Math.max(this.dragDistance, Math.hypot(dx, dy));
      camera.set({
        ...c,
        x: Math.max(0, Math.min(WORLD_CONFIG.width, this.drag.cameraX - dx / c.zoom)),
        y: Math.max(0, Math.min(WORLD_CONFIG.height, this.drag.cameraY - dy / c.zoom)),
      });
    };
    const up = () => {
      this.drag = undefined;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const c = camera.get(),
        rect = canvas.getBoundingClientRect(),
        x = e.clientX - rect.left - rect.width / 2,
        y = e.clientY - rect.top - rect.height / 2,
        zoom = clampZoom(c.zoom * Math.exp(-e.deltaY * 0.001));
      camera.set(
        clampCamera({ x: c.x + x / c.zoom - x / zoom, y: c.y + y / c.zoom - y / zoom, zoom }),
      );
    };
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    this.unsubscribe.push(() => {
      canvas.removeEventListener('keydown', keydown);
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      canvas.removeEventListener('wheel', wheel);
    });
  }
  destroy() {
    this.disposed = true;
    this.resize?.disconnect();
    this.unsubscribe.forEach((fn) => fn());
    this.unsubscribe = [];
    if (this.ready) {
      this.app.ticker.remove(this.tick);
      this.app.destroy(true, { children: true });
      this.ready = false;
    }
    this.views.clear();
  }
}
