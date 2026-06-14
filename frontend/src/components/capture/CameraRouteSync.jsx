import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCamera } from '../../hooks/useCamera';

/** @param {string} pathname */
export function isCaptureRoute(pathname) {
  return pathname === '/capture' || pathname.endsWith('/capture');
}

/**
 * Keeps the device camera active only on capture routes. Releases the stream on
 * every other route so upload, preview, batch, etc. do not leave the camera running.
 */
export function CameraRouteSync() {
  const { pathname } = useLocation();
  const { ensureActive, releaseStream } = useCamera();

  useEffect(() => {
    if (isCaptureRoute(pathname)) {
      ensureActive();
      return () => releaseStream();
    }
    releaseStream();
  }, [pathname, ensureActive, releaseStream]);

  return null;
}
