import { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Display-only tag region highlight / zoom for V6 results.
 * @param {{ src: string, alt?: string, tagZoomHint?: object | null, className?: string }} props
 */
export function TagZoomOverlay({ src, alt = '', tagZoomHint, className = '' }) {
  const [zoomTag, setZoomTag] = useState(false);

  if (!tagZoomHint) {
    return (
      <img src={src} alt={alt} className={className} />
    );
  }

  const { x_pct = 0, y_pct = 0, width_pct = 35, height_pct = 35 } = tagZoomHint;
  const hasBox = width_pct > 0 && height_pct > 0;

  if (!zoomTag) {
    return (
      <div className={`relative ${className ? '' : 'inline-block'}`}>
        <img src={src} alt={alt} className={className || 'max-h-[90vh] max-w-full object-contain'} />
        {hasBox && (
          <div
            className="pointer-events-none absolute border-2 border-amber-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.15)]"
            style={{
              left: `${x_pct}%`,
              top: `${y_pct}%`,
              width: `${width_pct}%`,
              height: `${height_pct}%`,
            }}
          />
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute bottom-3 right-3 gap-1 bg-white/90 text-gray-900 shadow"
          onClick={(e) => {
            e.stopPropagation();
            setZoomTag(true);
          }}
        >
          <ZoomIn size={14} />
          Zoom tag region
        </Button>
      </div>
    );
  }

  const scale = Math.min(100 / width_pct, 100 / height_pct, 4);
  const originX = x_pct + width_pct / 2;
  const originY = y_pct + height_pct / 2;

  return (
    <div className={`relative overflow-hidden ${className ? '' : 'max-h-[90vh] max-w-full'}`}>
      <img
        src={src}
        alt={alt}
        className={className || 'max-h-[90vh] max-w-full object-contain'}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: `${originX}% ${originY}%`,
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="absolute bottom-3 right-3 bg-white/90 text-gray-900 shadow"
        onClick={(e) => {
          e.stopPropagation();
          setZoomTag(false);
        }}
      >
        Full image
      </Button>
    </div>
  );
}
