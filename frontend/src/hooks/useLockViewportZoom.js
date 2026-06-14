import { useEffect } from 'react';

const LOCKED_VIEWPORT =
  'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1, user-scalable=no';

/**
 * Prevents pinch-zoom on mobile camera/upload flows where page zoom breaks the layout.
 */
export function useLockViewportZoom(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return undefined;

    const previous = meta.getAttribute('content');
    meta.setAttribute('content', LOCKED_VIEWPORT);

    return () => {
      if (previous) {
        meta.setAttribute('content', previous);
      }
    };
  }, [enabled]);
}
