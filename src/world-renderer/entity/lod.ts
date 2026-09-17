export type EntityLod = 'detail' | 'icon' | 'dot' | 'cluster';
export interface LodPolicy {
  level(zoom: number, visibleCount: number): EntityLod;
}
export const defaultLodPolicy: LodPolicy = {
  level: (zoom, count) =>
    count > 500 && zoom < 0.6 ? 'cluster' : zoom < 0.55 ? 'dot' : zoom < 0.8 ? 'icon' : 'detail',
};
