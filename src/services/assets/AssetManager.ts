import { z } from 'zod';
import type { AssetDefinition } from '../../assets/manifest/framework';
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
