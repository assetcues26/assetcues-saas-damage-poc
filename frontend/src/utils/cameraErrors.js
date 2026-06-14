export function getCameraErrorMessage(error) {
  if (!error) {
    return 'Could not access the camera. Check your browser settings and try again.';
  }

  const name = error.name || '';

  if (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    name === 'SecurityError'
  ) {
    return 'Camera access is blocked. Open your browser site settings for this page, allow Camera, then tap Enable Camera below.';
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera was found on this device.';
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'The camera is in use by another app. Close other apps using the camera and try again.';
  }

  if (name === 'OverconstrainedError') {
    return 'This camera does not support the requested settings. Try flipping the camera or use Upload instead.';
  }

  return error.message || 'Could not start the camera. Try again or use Upload Images instead.';
}
