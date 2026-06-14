import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Dashboard / list thumbnail with skeleton — avoids blank flash while loading.
 * @param {{
 *   src?: string | null,
 *   alt?: string,
 *   size?: number,
 *   className?: string,
 * }} props
 */
export function AssetThumbnail({ src, alt = '', size = 40, className }) {
  const [status, setStatus] = useState(src ? 'loading' : 'empty');

  useEffect(() => {
    setStatus(src ? 'loading' : 'empty');
  }, [src]);

  if (!src) {
    return <span className="inline-flex h-10 w-10 items-center justify-center text-gray-300">—</span>;
  }

  return (
    <span
      className={cn(
        'relative inline-block shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {status === 'loading' && (
        <span className="absolute inset-0 animate-pulse bg-gray-100" aria-hidden />
      )}
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        loading="eager"
        decoding="async"
        fetchPriority="low"
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          status === 'loaded' ? 'opacity-100' : 'opacity-0',
        )}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
      {status === 'error' && (
        <span className="absolute inset-0 flex items-center justify-center bg-gray-100 text-[10px] font-medium text-gray-400">
          N/A
        </span>
      )}
    </span>
  );
}
