import { useEffect, useRef, useState } from 'react';
import { assetManager } from '../../services/assets/AssetManager';
import { useTranslation } from '../../services/localization';
export function AssetImage({
  assetId,
  alt,
  className = '',
  eager = false,
}: {
  assetId: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const fallback = assetManager.fallback(assetId),
    ref = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState(fallback),
    [broken, setBroken] = useState(false);
  const { t } = useTranslation();
  useEffect(() => {
    let alive = true,
      observer: IntersectionObserver | undefined;
    setSrc(assetManager.fallback(assetId));
    setBroken(false);
    const load = () => {
      observer?.disconnect();
      void assetManager
        .resolve(assetId)
        .then((url) => {
          if (alive) setSrc(url);
        })
        .catch(() => {
          if (alive) setBroken(true);
        });
    };
    if (!eager && ref.current && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) load();
        },
        { rootMargin: '100px' },
      );
      observer.observe(ref.current);
    } else load();
    return () => {
      alive = false;
      observer?.disconnect();
    };
  }, [assetId, eager]);
  if (broken)
    return (
      <span className={'asset-failed ' + className} role="img" aria-label={alt}>
        {t('common.error')}
      </span>
    );
  return (
    <img
      ref={ref}
      className={'asset-image ' + className}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      draggable={false}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
        else setBroken(true);
      }}
      style={{ aspectRatio: assetManager.get(assetId).aspectRatio }}
    />
  );
}
