import { z } from 'zod';
import type { AssetDefinition } from '../../assets/manifest/framework';
import {
  atlasManifestSchema,
  type AtlasDefinition,
  type AtlasFrameAsset,
  type AtlasManifest,
} from './atlas';
const overrideSchema = z.record(
  z.object({
    path: z.string().startsWith('/assets/'),
    fallback: z.string().startsWith('/assets/').optional(),
    themes: z.record(z.string().startsWith('/assets/')).optional(),
  }),
);
export class AssetManager {
  private registry = new Map<string, AssetDefinition>();
  private cache = new Map<string, Promise<string>>();
  private theme = 'default';
  private atlases = new Map<string, AtlasDefinition>();
  private frames = new Map<string, AtlasFrameAsset>();
  private atlasCache = new Map<string, Promise<AtlasManifest>>();
  registerAtlases(atlases: AtlasDefinition[], frames: AtlasFrameAsset[]) {
    if (
      new Set(atlases.map((a) => a.id)).size !== atlases.length ||
      atlases.some((a) => this.atlases.has(a.id)) ||
      new Set(frames.map((f) => f.frameKey)).size !== frames.length ||
      frames.some(
        (f) =>
          this.frames.has(f.frameKey) ||
          (!atlases.some((a) => a.id === f.atlasId) && !this.atlases.has(f.atlasId)),
      )
    )
      throw new Error('Invalid atlas registration');
    atlases.forEach((a) => this.atlases.set(a.id, a));
    frames.forEach((f) => this.frames.set(f.frameKey, f));
  }
  frame(key: string) {
    const frame = this.frames.get(key);
    if (!frame) throw new Error('Unknown atlas frame: ' + key);
    return frame;
  }
  async loadAtlas(id: string): Promise<AtlasManifest> {
    const cached = this.atlasCache.get(id);
    if (cached) return cached;
    const definition = this.atlases.get(id);
    if (!definition) throw new Error('Unknown atlas: ' + id);
    const pending = (async () => {
      const response = await fetch(definition.manifestPath);
      if (!response.ok) throw new Error('Atlas manifest unavailable: ' + id);
      const manifest = atlasManifestSchema.parse(await response.json());
      if (manifest.id !== id) throw new Error('Atlas ID mismatch');
      for (const frame of this.frames.values())
        if (frame.atlasId === id && !manifest.frames[frame.frameKey])
          throw new Error('Missing atlas frame: ' + frame.frameKey);
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () =>
          image.naturalWidth === manifest.width && image.naturalHeight === manifest.height
            ? resolve()
            : reject(new Error('Atlas image dimensions mismatch: ' + id));
        image.onerror = () => reject(new Error('Atlas image unavailable: ' + id));
        image.src = manifest.image;
      });
      return manifest;
    })();
    this.atlasCache.set(id, pending);
    pending.catch(() => this.atlasCache.delete(id));
    return pending;
  }
  register(definitions: AssetDefinition[]) {
    for (const asset of definitions) {
      if (this.registry.has(asset.id)) throw new Error('Duplicate asset: ' + asset.id);
      this.registry.set(asset.id, asset);
    }
  }
  get(id: string) {
    const asset = this.registry.get(id);
    if (!asset) throw new Error('Unknown asset: ' + id);
    return asset;
  }
  has(id: string) {
    return this.registry.has(id);
  }
  setTheme(theme: string) {
    this.theme = theme;
    this.cache.clear();
  }
  fallback(id: string) {
    return this.get(id).fallback;
  }
  async loadOverrides() {
    try {
      const response = await fetch('/assets/manifest.json');
      if (!response.ok) return;
      const overrides = overrideSchema.parse(await response.json());
      Object.entries(overrides).forEach(([id, value]) => {
        const asset = this.registry.get(id);
        if (asset) this.registry.set(id, { ...asset, ...value });
      });
      this.cache.clear();
    } catch {
      /* Optional manifest: built-in safe placeholders remain available. */
    }
  }
  async resolve(
    id: string,
    loader: (url: string) => Promise<void> = this.loadImage,
  ): Promise<string> {
    const existing = this.cache.get(id);
    if (existing) return existing;
    const asset = this.get(id),
      path = asset.themes?.[this.theme] ?? asset.path;
    const result = loader(path)
      .then(() => path)
      .catch(async () => {
        await loader(asset.fallback);
        return asset.fallback;
      });
    this.cache.set(id, result);
    result.catch(() => this.cache.delete(id));
    return result;
  }
  private loadImage = (url: string) =>
    new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Asset unavailable: ' + url));
      image.src = url;
    });
  async preload(group: AssetDefinition['group']) {
    await Promise.all(
      [...this.registry.values()].filter((a) => a.group === group).map((a) => this.resolve(a.id)),
    );
  }
  list() {
    return [...this.registry.values()];
  }
}
export const assetManager = new AssetManager();
