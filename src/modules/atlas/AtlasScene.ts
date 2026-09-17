import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
} from 'pixi.js';
import { assetManager } from '../../services/assets/AssetManager';
import { previewAtlases } from '../../services/assets/atlas';
import { atlasText } from './copy';
import { crestDataUrl } from './heraldry';
import {
  atlasLod,
  clampAtlasCamera,
  objectVisible,
  type AtlasCamera,
  type AtlasLayers,
  type SampleRegion,
  type Selection,
  type WorldObject,
} from './model';
import { territoryAt } from './sampleRegion';
import { worldObjectRegistry } from './objectRegistry';
import type { Language } from '../../services/localization';
interface ObjectView {
  object: WorldObject;
  container: Container;
  sprite: Sprite;
  label: Text;
  crest?: Sprite;
  overlay?: Sprite;
  ring: Graphics;
}
export interface AtlasSceneOptions {
  region: SampleRegion;
  layers: AtlasLayers;
  selection?: Selection;
  language: Language;
  politicalMode?: 'owner' | 'controller';
}
export interface AtlasStats {
  lod: ReturnType<typeof atlasLod>;
  visible: number;
  zoom: number;
}
export class AtlasScene {
  private app = new Application();
  private root = new Container();
  private terrain = new Container();
  private borders = new Graphics();
  private labels = new Container();
  private markers = new Container();
  private sites = new Container();
  private views: ObjectView[] = [];
  private textures = new Map<string, Texture>();
  private crests = new Map<string, Texture>();
  private siteViews: { id: string; x: number; y: number; container: Container }[] = [];
  private camera: AtlasCamera = { x: 3000, y: 2000, zoom: 0.15 };
  private ready = false;
  private disposed = false;
  private initialized = false;
  private resize?: ResizeObserver;
  private cleanup: (() => void)[] = [];
  private drag?: { x: number; y: number; camera: AtlasCamera };
  private moved = 0;
  private pointers = new Map<number, { x: number; y: number }>();
  private pinch?: { distance: number; camera: AtlasCamera; center: { x: number; y: number } };
  private lastStats = '';
  constructor(
    private host: HTMLElement,
    private options: AtlasSceneOptions,
    private select: (selection: Selection) => void,
    private onStats: (stats: AtlasStats) => void,
  ) {}
  async init() {
    await this.app.init({
      width: Math.max(1, this.host.clientWidth),
      height: Math.max(1, this.host.clientHeight),
      background: 0x162d2f,
      antialias: true,
      resolution: Math.min(devicePixelRatio, 2),
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
    this.app.canvas.tabIndex = 0;
    this.app.stage.addChild(this.root);
    this.root.addChild(this.terrain, this.borders, this.labels, this.markers, this.sites);
    this.markers.sortableChildren = true;
    const atlasLoads = await Promise.allSettled(
      previewAtlases
        .filter((a) => a.id !== 'item-bases')
        .map(async (atlas) => {
          const manifest = await assetManager.loadAtlas(atlas.id),
            sheet = await Assets.load<Texture>(manifest.image);
          if (this.disposed) return;
          for (const [key, frame] of Object.entries(manifest.frames))
            this.textures.set(
              key,
              new Texture({
                source: sheet.source,
                frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
              }),
            );
        }),
    );
    if (this.disposed) {
      this.destroyTextures();
      return;
    }
    const failedLoad = atlasLoads.find((result) => result.status === 'rejected');
    if (failedLoad?.status === 'rejected') throw failedLoad.reason;
    await Promise.all(
      this.options.region.houses.map(async (house) => {
        const image = new Image();
        image.src = crestDataUrl(house.crest);
        await image.decode();
        if (!this.disposed) this.crests.set(house.id, Texture.from(image));
      }),
    );
    if (this.disposed) {
      this.destroyTextures();
      return;
    }
    this.initialized = true;
    this.buildTerrain();
    this.buildMarkers();
    this.bindInput();
    this.resize = new ResizeObserver(() => {
      if (!this.disposed) {
        this.app.renderer.resize(
          Math.max(1, this.host.clientWidth),
          Math.max(1, this.host.clientHeight),
        );
        this.render();
      }
    });
    this.resize.observe(this.host);
    this.fit();
    this.host.dataset.ready = 'true';
  }
  update(options: AtlasSceneOptions) {
    this.options = options;
    if (!this.ready || this.disposed || !this.initialized) return;
    this.buildMarkers();
    this.render();
  }
  fit() {
    this.setCamera({
      x: this.options.region.width / 2,
      y: this.options.region.height / 2,
      zoom: Math.min(
        (this.host.clientWidth - 52) / this.options.region.width,
        (this.host.clientHeight - 160) / this.options.region.height,
      ),
    });
  }
  focus(x: number, y: number, zoom = 0.46) {
    this.setCamera({ x, y, zoom });
  }
  zoom(factor: number) {
    this.setCamera({ ...this.camera, zoom: this.camera.zoom * factor });
  }
  zoomTo(zoom: number) {
    this.setCamera({ ...this.camera, zoom });
  }
  getCamera() {
    return { ...this.camera };
  }
  private setCamera(camera: AtlasCamera) {
    this.camera = clampAtlasCamera(camera, this.options.region);
    this.render();
  }
  private clear(container: Container) {
    container.removeChildren().forEach((child) => child.destroy({ children: true }));
  }
  private buildTerrain() {
    this.clear(this.terrain);
    const { width, height, rivers, roads } = this.options.region;
    const g = new Graphics()
      .rect(-180, -180, width + 360, height + 360)
      .fill(0x182f30)
      .rect(0, 0, width, height)
      .fill(0x344a3d);
    const random = (n: number) => {
      const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return value - Math.floor(value);
    };
    for (let i = 0; i < 580; i++) {
      const x = random(i) * width,
        y = random(i + 1000) * height;
      g.ellipse(x, y, 60 + random(i + 20) * 250, 45 + random(i + 30) * 130).fill({
        color: i % 3 === 0 ? 0x718062 : 0x223c35,
        alpha: i % 3 === 0 ? 0.13 : 0.2,
      });
    }
    for (let i = 0; i < 160; i++) {
      const x = random(i + 25) * width,
        y = random(i + 405) * height;
      g.ellipse(x, y, 120 + random(i + 55) * 110, 60 + random(i + 89) * 90).stroke({
        color: 0x819079,
        width: 2,
        alpha: 0.1,
      });
    }
    for (const river of rivers) {
      g.moveTo(river[0].x, river[0].y);
      for (let i = 1; i < river.length; i++) {
        const a = river[i - 1],
          b = river[i];
        g.bezierCurveTo(a.x, a.y + (b.y - a.y) * 0.55, b.x - (b.x - a.x) * 0.3, b.y, b.x, b.y);
      }
      g.stroke({ color: 0x718875, width: 116, alpha: 0.25 });
      g.moveTo(river[0].x, river[0].y);
      for (let i = 1; i < river.length; i++) {
        const a = river[i - 1],
          b = river[i];
        g.bezierCurveTo(a.x, a.y + (b.y - a.y) * 0.55, b.x - (b.x - a.x) * 0.3, b.y, b.x, b.y);
      }
      g.stroke({ color: 0x173c43, width: 84 });
      g.moveTo(river[0].x, river[0].y);
      for (let i = 1; i < river.length; i++) {
        const a = river[i - 1],
          b = river[i];
        g.bezierCurveTo(a.x, a.y + (b.y - a.y) * 0.55, b.x - (b.x - a.x) * 0.3, b.y, b.x, b.y);
      }
      g.stroke({ color: 0x83a8a0, width: 3, alpha: 0.4 });
    }
    for (const road of roads) {
      g.moveTo(road[0].x, road[0].y);
      road.slice(1).forEach((p) => g.lineTo(p.x, p.y));
      g.stroke({ color: 0x182e29, width: 27, alpha: 0.5 });
      g.moveTo(road[0].x, road[0].y);
      road.slice(1).forEach((p) => g.lineTo(p.x, p.y));
      g.stroke({ color: 0xb3a07b, width: 12, alpha: 0.5 });
    }
    // Mountain ridges and stands of trees are static geometry, separate from ownership overlays.
    for (let i = 0; i < 42; i++) {
      const x = 90 + (i % 14) * 270 + Math.floor(i / 14) * 130,
        y = 100 + Math.floor(i / 14) * 170 + Math.sin(i) * 60;
      g.poly([x - 110, y + 130, x, y - 65, x + 125, y + 130])
        .fill(0x566658)
        .stroke({ color: 0x253e35, width: 4 });
      g.poly([x, y - 65, x + 125, y + 130, x + 30, y + 85]).fill(0x354d40);
      g.poly([x - 28, y - 12, x, y - 65, x + 38, y + 3, x + 8, y - 8]).fill({
        color: 0xa3aa8d,
        alpha: 0.55,
      });
    }
    for (let i = 0; i < 480; i++) {
      const x = random(i + 880) * width,
        y = 700 + random(i + 120) * 3100;
      if ((x > 1200 && x < 2400 && y < 1200) || (x > 4400 && y < 2000) || (x < 800 && y > 3000)) {
        const size = 20 + random(i) * 24;
        g.poly([x - size, y + size, x, y - size * 2, x + size, y + size])
          .fill(i % 2 ? 0x3a5b45 : 0x254839)
          .stroke({ color: 0x799170, width: 1, alpha: 0.15 });
      }
    }
    g.rect(0, 0, width, height).stroke({ color: 0x929979, width: 7, alpha: 0.45 });
    this.terrain.addChild(g);
  }
  private buildMarkers() {
    this.clear(this.markers);
    this.clear(this.labels);
    this.clear(this.sites);
    this.views = [];
    this.siteViews = [];
    const language = this.options.language;
    this.app.canvas.setAttribute(
      'aria-label',
      atlasText('title', language) + '. ' + atlasText('drag', language),
    );
    for (const t of this.options.region.territories) {
      const label = new Text({
        text: t.id + '  ' + t.name[language === 'ko' ? 0 : 1],
        style: {
          fontFamily: 'Georgia, serif',
          fontSize: 14,
          fill: '#dbd8b7',
          letterSpacing: 1,
          dropShadow: { color: '#102824', blur: 4, distance: 1 },
        },
      });
      label.anchor.set(0.5);
      label.position.set(t.center.x, t.center.y - 200);
      this.labels.addChild(label);
    }
    for (const object of this.options.region.objects) {
      const visual = worldObjectRegistry.visual(object);
      const key = visual.frameKey,
        texture = this.textures.get(key);
      if (!texture) throw new Error('Missing visual ' + key);
      const container = new Container(),
        sprite = new Sprite(texture),
        ring = new Graphics()
          .ellipse(0, 10, 36, 14)
          .stroke({ color: 0xe1cd95, width: 2 })
          .ellipse(0, 10, 42, 18)
          .stroke({ color: 0xe1cd95, width: 1, alpha: 0.3 });
      const label = new Text({
        text: object.name[language === 'ko' ? 0 : 1],
        style: {
          fontFamily: 'sans-serif',
          fontSize: 11,
          fill: '#eee6c9',
          dropShadow: { color: '#132623', blur: 4, distance: 1 },
        },
      });
      label.anchor.set(0.5);
      label.y = 34;
      sprite.anchor.set(visual.anchorX, visual.anchorY);
      container.zIndex = visual.zIndex + object.y / this.options.region.height;
      const house = object.controllerHouseId ?? object.ownerHouseId;
      const crestTexture = house ? this.crests.get(house) : undefined;
      const crest = crestTexture ? new Sprite(crestTexture) : undefined;
      if (crest) {
        crest.anchor.set(0.5);
        crest.width = 24;
        crest.height = 24;
        crest.position.set(29, -20);
      }
      const overlayKey =
        object.state !== 'normal'
          ? 'settlement.' + object.state
          : object.rank && object.rank !== 'common'
            ? 'rank.' + object.rank
            : undefined;
      const overlayTexture = overlayKey ? this.textures.get(overlayKey) : undefined;
      const overlay = overlayTexture ? new Sprite(overlayTexture) : undefined;
      if (overlay) {
        overlay.anchor.set(0.5, 0.7);
        overlay.width = 82;
        overlay.height = 82;
      }
      container.addChild(ring, sprite);
      if (overlay) container.addChild(overlay);
      if (crest) container.addChild(crest);
      container.addChild(label);
      this.markers.addChild(container);
      this.views.push({ object, container, sprite, label, crest, overlay, ring });
    }
    for (const site of this.options.region.sites.filter((s) => !s.entityId)) {
      const container = new Container();
      container.addChild(
        new Graphics()
          .poly([0, -11, 14, 0, 0, 11, -14, 0])
          .stroke({ color: 0xccbf8d, width: 1.5, alpha: 0.85 })
          .circle(0, 0, 2)
          .fill(0xccbf8d),
      );
      const text = new Text({
        text: atlasText(site.kind, language) + ' · ' + atlasText('sites', language),
        style: {
          fontSize: 10,
          fill: '#c5c3a5',
          dropShadow: { color: '#132623', blur: 3, distance: 0 },
        },
      });
      text.anchor.set(0.5);
      text.y = 22;
      container.addChild(text);
      this.sites.addChild(container);
      this.siteViews.push({ id: site.id, x: site.x, y: site.y, container });
    }
  }
  private render() {
    if (!this.ready || this.disposed) return;
    const c = this.camera,
      screen = this.app.screen,
      lod = atlasLod(c.zoom),
      { layers, selection, region } = this.options;
    this.root.scale.set(c.zoom);
    this.root.position.set(screen.width / 2 - c.x * c.zoom, screen.height / 2 - c.y * c.zoom);
    this.borders.clear();
    for (const t of region.territories) {
      const house = region.houses.find(
          (h) =>
            h.id ===
            (this.options.politicalMode === 'controller'
              ? (t.controllerHouseId ?? t.ownerHouseId)
              : t.ownerHouseId),
        ),
        color = house ? parseInt(house.crest.primaryColor.slice(1), 16) : 0x97a790;
      const chosen = selection?.type === 'territory' && selection.id === t.id;
      this.borders.poly(t.polygon.flatMap((p) => [p.x, p.y])).fill({
        color: t.state === 'dormant' ? 0x102b2b : color,
        alpha:
          t.state === 'dormant' ? 0.65 : t.state === 'abandoned' ? 0.035 : chosen ? 0.21 : 0.075,
      });
      if (layers.borders || chosen)
        this.borders.poly(t.polygon.flatMap((p) => [p.x, p.y])).stroke({
          color: chosen ? 0xf0dba2 : color,
          width: (chosen ? 2.2 : 0.8) / c.zoom,
          alpha: chosen ? 1 : 0.58,
        });
      if (t.state === 'contested')
        this.borders
          .circle(t.center.x, t.center.y, 130)
          .stroke({ color: 0xd18577, width: 1.5 / c.zoom, alpha: 0.7 });
    }
    this.labels.children.forEach((label) => {
      label.scale.set((screen.width < 600 ? 0.6 : 1) / c.zoom);
      label.visible = layers.borders;
      label.alpha = lod === 'near' ? 0.45 : 0.8;
    });
    let visible = 0;
    for (const view of this.views) {
      const { object, container } = view,
        selected = selection?.type === 'object' && selection.id === object.id;
      const px = screen.width / 2 + (object.x - c.x) * c.zoom,
        py = screen.height / 2 + (object.y - c.y) * c.zoom;
      container.visible =
        objectVisible(object, lod, layers) &&
        px > -100 &&
        px < screen.width + 100 &&
        py > -100 &&
        py < screen.height + 100;
      if (!container.visible) continue;
      visible++;
      container.position.set(object.x, object.y);
      container.scale.set(1 / c.zoom);
      const major = ['capital', 'city', 'castle'].includes(object.kind),
        actor = ['player', 'npc', 'monster', 'resource'].includes(object.kind);
      const size = major
        ? lod === 'far'
          ? 58
          : lod === 'medium'
            ? 80
            : 105
        : actor
          ? 38
          : lod === 'near'
            ? 78
            : 56;
      const displaySize = screen.width < 600 && lod === 'far' ? size * 0.72 : size;
      view.sprite.width = displaySize;
      view.sprite.height = displaySize;
      view.label.style.fontSize = screen.width < 600 ? 9 : 11;
      if (view.crest) {
        view.crest.width = screen.width < 600 && lod === 'far' ? 17 : 24;
        view.crest.height = view.crest.width;
      }
      view.sprite.alpha = object.state === 'abandoned' ? 0.5 : 1;
      view.label.visible =
        selected ||
        (!actor && object.kind !== 'forest' && object.kind !== 'farm' && (lod !== 'far' || major));
      view.label.y = major ? 33 : 25;
      view.ring.visible = selected;
      if (view.crest)
        view.crest.visible =
          layers.houses &&
          !actor &&
          object.kind !== 'forest' &&
          object.kind !== 'farm' &&
          object.kind !== 'resource';
      if (view.overlay) view.overlay.visible = layers.settlements || layers.resources;
    }
    for (const site of this.siteViews) {
      site.container.position.set(site.x, site.y);
      site.container.scale.set(1 / c.zoom);
      site.container.visible = layers.sites && lod !== 'far';
    }
    this.app.renderer.render({ container: this.app.stage });
    const stats = lod + ':' + visible + ':' + c.zoom.toFixed(3);
    if (stats !== this.lastStats) {
      this.lastStats = stats;
      this.onStats({ lod, visible, zoom: c.zoom });
    }
  }
  private pick(clientX: number, clientY: number) {
    const rect = this.app.canvas.getBoundingClientRect(),
      c = this.camera;
    const x = (clientX - rect.left - rect.width / 2) / c.zoom + c.x,
      y = (clientY - rect.top - rect.height / 2) / c.zoom + c.y;
    const nearest = this.views
      .filter((v) => v.container.visible)
      .map((v) => ({ view: v, d: Math.hypot(v.object.x - x, v.object.y - y) * c.zoom }))
      .sort((a, b) => a.d - b.d)[0];
    if (nearest && nearest.d < 36) {
      this.select({ type: 'object', id: nearest.view.object.id });
      return;
    }
    const site = this.siteViews
      .filter((v) => v.container.visible)
      .find((v) => Math.hypot(v.x - x, v.y - y) * c.zoom < 20);
    if (site) {
      this.select({ type: 'site', id: site.id });
      return;
    }
    const territory = territoryAt(this.options.region, { x, y });
    if (territory) this.select({ type: 'territory', id: territory.id });
  }
  private bindInput() {
    const canvas = this.app.canvas;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) {
        this.moved = 0;
        this.drag = { x: e.clientX, y: e.clientY, camera: { ...this.camera } };
      }
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.pinch = {
          distance: Math.hypot(a.x - b.x, a.y - b.y),
          camera: { ...this.camera },
          center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        };
        this.moved = 10;
      }
    };
    const move = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2 && this.pinch) {
        const [a, b] = [...this.pointers.values()],
          zoom = clampAtlasCamera(
            {
              ...this.camera,
              zoom:
                (this.pinch.camera.zoom * Math.hypot(a.x - b.x, a.y - b.y)) /
                Math.max(1, this.pinch.distance),
            },
            this.options.region,
          ).zoom;
        const rect = canvas.getBoundingClientRect(),
          old = this.pinch.center,
          center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const oldX = old.x - rect.left - rect.width / 2,
          oldY = old.y - rect.top - rect.height / 2;
        this.setCamera({
          x:
            this.pinch.camera.x +
            oldX / this.pinch.camera.zoom -
            (center.x - rect.left - rect.width / 2) / zoom,
          y:
            this.pinch.camera.y +
            oldY / this.pinch.camera.zoom -
            (center.y - rect.top - rect.height / 2) / zoom,
          zoom,
        });
      } else if (this.drag) {
        const dx = e.clientX - this.drag.x,
          dy = e.clientY - this.drag.y;
        this.moved = Math.max(this.moved, Math.hypot(dx, dy));
        this.setCamera({
          ...this.drag.camera,
          x: this.drag.camera.x - dx / this.drag.camera.zoom,
          y: this.drag.camera.y - dy / this.drag.camera.zoom,
        });
      }
    };
    const up = (e: PointerEvent) => {
      if (this.pointers.size === 1 && this.moved < 6 && e.type !== 'pointercancel')
        this.pick(e.clientX, e.clientY);
      this.pointers.delete(e.pointerId);
      this.pinch = undefined;
      this.drag = undefined;
      if (this.pointers.size === 1) {
        const p = [...this.pointers.values()][0];
        this.drag = { ...p, camera: { ...this.camera } };
        this.moved = 10;
      }
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect(),
        c = this.camera,
        x = e.clientX - rect.left - rect.width / 2,
        y = e.clientY - rect.top - rect.height / 2,
        zoom = clampAtlasCamera(
          { ...c, zoom: c.zoom * Math.exp(-e.deltaY * 0.0015) },
          this.options.region,
        ).zoom;
      this.setCamera({ x: c.x + x / c.zoom - x / zoom, y: c.y + y / c.zoom - y / zoom, zoom });
    };
    const key = (e: KeyboardEvent) => {
      const step = 130 / this.camera.zoom,
        directions: Record<string, [number, number]> = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
        };
      if (directions[e.key]) {
        e.preventDefault();
        const [x, y] = directions[e.key];
        this.setCamera({ ...this.camera, x: this.camera.x + x, y: this.camera.y + y });
      }
      if (['+', '=', '-'].includes(e.key)) {
        e.preventDefault();
        this.zoom(e.key === '-' ? 1 / 1.2 : 1.2);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const t = territoryAt(this.options.region, this.camera);
        if (t) this.select({ type: 'territory', id: t.id });
      }
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('keydown', key);
    this.cleanup.push(() => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('keydown', key);
    });
  }
  private destroyTextures() {
    this.textures.forEach((texture) => texture.destroy(false));
    this.textures.clear();
    this.crests.forEach((texture) => texture.destroy(true));
    this.crests.clear();
  }
  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.resize?.disconnect();
    this.cleanup.forEach((fn) => fn());
    if (this.ready) {
      this.app.destroy(true, { children: true });
      this.ready = false;
    }
    this.destroyTextures();
    delete this.host.dataset.ready;
  }
}
