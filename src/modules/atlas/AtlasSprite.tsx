import { useEffect, useState } from 'react';
import { assetManager } from '../../services/assets/AssetManager';
import type { AtlasManifest } from '../../services/assets/atlas';
import { crestDataUrl } from './heraldry';
import type { Crest } from './model';
export function AtlasSprite({
  frameKey,
  size = 88,
  className = '',
}: {
  frameKey: string;
  size?: number;
  className?: string;
}) {
  const [atlas, setAtlas] = useState<AtlasManifest>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    setAtlas(undefined);
    setFailed(false);
    const frame = assetManager.frame(frameKey);
    void assetManager
      .loadAtlas(frame.atlasId)
      .then((atlas) => {
        if (alive) setAtlas(atlas);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [frameKey]);
  const frame = atlas?.frames[frameKey],
    scale = frame ? size / frame.w : 1;
  return (
    <span
      aria-hidden="true"
      className={'atlas-sprite ' + className}
      style={{
        width: size,
        height: size,
        ...(atlas && frame
          ? {
              backgroundImage: 'url("' + atlas.image + '")',
              backgroundSize: atlas.width * scale + 'px ' + atlas.height * scale + 'px',
              backgroundPosition: -frame.x * scale + 'px ' + -frame.y * scale + 'px',
            }
          : {}),
      }}
    >
      {failed ? '◇' : null}
    </span>
  );
}
export function HouseCrest({ crest, size = 40 }: { crest: Crest; size?: number }) {
  return (
    <img className="atlas-crest" src={crestDataUrl(crest)} alt="" width={size} height={size} />
  );
}
