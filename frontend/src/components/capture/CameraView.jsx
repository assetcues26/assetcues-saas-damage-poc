import { AlertCircle } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/button';
import { getCameraErrorMessage } from '../../utils/cameraErrors';

export function CameraView({
  videoRef,
  facingMode,
  zoomLevel = 1,
  status,
  error,
  onRetry,
  className = '',
}) {
  const mirrored = facingMode === 'user';
  const zoom = Math.min(5, Math.max(1, zoomLevel));
  const mirrorTransform = mirrored ? 'scaleX(-1)' : '';
  const zoomTransform = zoom > 1 ? `scale(${zoom})` : '';
  const videoTransform = [mirrorTransform, zoomTransform].filter(Boolean).join(' ') || undefined;

  const showError = status === 'denied' || error;

  return (
    <div
      className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border shadow-2xl ${
        showError
          ? 'border-red-900/50 bg-gray-900'
          : 'border-gray-700 bg-black'
      } ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          transform: videoTransform,
          transformOrigin: 'center center',
        }}
        className={`h-full min-h-[280px] w-full object-cover ${
          showError ? 'pointer-events-none absolute opacity-0' : ''
        }`}
        aria-label="Camera viewfinder"
        aria-hidden={showError}
      />

      {status === 'loading' && !showError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-950/90">
          <Spinner size={40} />
          <p className="text-sm text-gray-400">Starting camera…</p>
        </div>
      )}

      {showError && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertCircle size={48} className="text-red-400" />
          <h2 className="text-lg font-semibold text-white">Camera access required</h2>
          <p className="max-w-sm text-sm text-gray-400">{getCameraErrorMessage(error)}</p>
          <p className="max-w-sm text-xs text-gray-500">
            Tip: tap the lock or camera icon in the address bar → Site settings → allow Camera.
          </p>
          <Button variant="default" onClick={onRetry} ariaLabel="Enable camera">
            Enable Camera
          </Button>
        </div>
      )}
    </div>
  );
}
