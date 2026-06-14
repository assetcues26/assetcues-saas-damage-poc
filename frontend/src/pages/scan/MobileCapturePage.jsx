import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SwitchCamera } from 'lucide-react';
import { CompactHeader, ProgressPill } from '../../components/layout/AppHeader';
import { BackButton } from '../../components/ui/BackButton';
import { CameraView } from '../../components/capture/CameraView';
import { FlashToggle } from '../../components/capture/FlashToggle';
import { ShutterButton } from '../../components/capture/ShutterButton';
import { useCamera } from '../../hooks/useCamera';
import { useLockViewportZoom } from '../../hooks/useLockViewportZoom';
import { useMobileCaptureUpload } from '../../hooks/useMobileCaptureUpload';
import { useMobileSession } from '../../hooks/useMobileSession';
import { MobileSyncFailedBanner } from '../../components/session/MobileSyncFailedBanner';
import { useApp } from '../../context/AppContext';

const CAPTURE_COOLDOWN_MS = 750;
const CAPTURE_FLASH_MS = 180;
const CAPTURE_FEEDBACK_MS = 400;

function triggerCaptureHaptic() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(40);
  }
}

export function MobileCapturePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const camera = useCamera();
  const cameraApiRef = useRef(camera);
  cameraApiRef.current = camera;
  const { imageCount, maxImages, canAdd, session, refresh } = useMobileSession(token);
  const {
    enqueueCapture,
    pendingCount,
    failedCount,
    uploading,
    canCaptureMore,
    displayImageCount,
    retryFailed,
  } = useMobileCaptureUpload({
    token,
    session,
    refresh,
    imageCount,
    maxImages,
    canAdd,
    showToast,
  });
  const [capturing, setCapturing] = useState(false);
  const [captureCooldown, setCaptureCooldown] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);
  const [justCaptured, setJustCaptured] = useState(false);
  const [pillBump, setPillBump] = useState(false);
  const lastCaptureAtRef = useRef(0);
  const feedbackTimersRef = useRef([]);

  useLockViewportZoom(true);

  useEffect(() => () => cameraApiRef.current.handleUnmount(), []);

  useEffect(() => {
    camera.setZoomLevel(1);
  }, [camera.setZoomLevel]);

  useEffect(
    () => () => {
      feedbackTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      feedbackTimersRef.current = [];
    },
    [],
  );

  const scheduleFeedbackReset = (setter, delay) => {
    const timerId = window.setTimeout(() => setter(false), delay);
    feedbackTimersRef.current.push(timerId);
  };

  const showCaptureFeedback = () => {
    setFlashVisible(true);
    setJustCaptured(true);
    setPillBump(true);
    triggerCaptureHaptic();
    scheduleFeedbackReset(setFlashVisible, CAPTURE_FLASH_MS);
    scheduleFeedbackReset(setJustCaptured, CAPTURE_FEEDBACK_MS);
    scheduleFeedbackReset(setPillBump, 320);
  };

  const handleCapture = async () => {
    const now = Date.now();
    if (
      !canCaptureMore ||
      !camera.isReady ||
      capturing ||
      captureCooldown ||
      now - lastCaptureAtRef.current < CAPTURE_COOLDOWN_MS
    ) {
      return;
    }

    setCapturing(true);
    const file = await camera.captureFrame();
    setCapturing(false);
    if (!file) return;

    lastCaptureAtRef.current = Date.now();
    setCaptureCooldown(true);
    showCaptureFeedback();

    const added = enqueueCapture(file);
    if (!added) {
      showToast(`Maximum ${maxImages} images per batch`, 'warning');
      setCaptureCooldown(false);
      return;
    }

    window.setTimeout(() => setCaptureCooldown(false), CAPTURE_COOLDOWN_MS);
  };

  const hasPhotos = displayImageCount > 0 || pendingCount > 0 || failedCount > 0;
  const flashSupported = camera.facingMode === 'environment';
  const shutterDisabled = !camera.isReady || capturing || captureCooldown || !canCaptureMore;

  const statusText = (() => {
    if (failedCount > 0 && !uploading && pendingCount === 0) {
      return failedCount === 1
        ? '1 photo could not sync — tap Retry below'
        : `${failedCount} photos could not sync — tap Retry below`;
    }
    if (uploading || pendingCount > 0) {
      const syncing = pendingCount === 1 ? '1 photo syncing' : `${pendingCount} photos syncing`;
      return `${syncing} — tap Done anytime`;
    }
    if (displayImageCount > 0) {
      return `${displayImageCount} in batch — tap Done when finished`;
    }
    if (!flashSupported) {
      return 'Front camera has no flash — flip to rear camera for flash';
    }
    return 'Each photo adds automatically to your laptop batch';
  })();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-black">
      <CompactHeader
        ariaLabel="Take photo"
        variant="dark"
        left={<BackButton label="Back" variant="dark" onClick={() => navigate(`/scan/${token}`)} />}
        center={
          <ProgressPill
            current={displayImageCount}
            max={maxImages}
            variant="dark"
            compact
            bump={pillBump}
          />
        }
        right={
          hasPhotos ? (
            <button
              type="button"
              className="touch-manipulation shrink-0 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white active:bg-blue-500"
              onClick={() => navigate(`/scan/${token}/done`)}
            >
              Done
            </button>
          ) : (
            <span className="inline-block w-[4.25rem]" aria-hidden="true" />
          )
        }
      />
      <div className="relative flex min-h-0 flex-1 flex-col pb-[9.5rem]">
        <CameraView
          videoRef={camera.videoRef}
          facingMode={camera.facingMode}
          zoomLevel={camera.previewZoom}
          status={camera.status}
          error={camera.error}
          onRetry={camera.retry}
          className="min-h-0 flex-1 rounded-none border-0"
        />
        {flashVisible && (
          <div
            className="capture-flash-overlay pointer-events-none absolute inset-0 z-20 bg-white"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-950/95 pb-safe backdrop-blur-md">
        {failedCount > 0 ? (
          <MobileSyncFailedBanner
            count={failedCount}
            onRetry={retryFailed}
            retrying={uploading}
            variant="dark"
            className="mx-4 mt-3"
          />
        ) : null}
        <p className="px-4 pb-2 pt-3 text-center text-xs text-white/90">{statusText}</p>
        <div className="flex items-center justify-between px-4 pb-4 pt-1">
          <button
            type="button"
            onClick={camera.flipCamera}
            disabled={camera.status === 'denied'}
            aria-label="Flip camera"
            className="touch-target touch-manipulation flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-800 text-gray-100 active:bg-gray-700 disabled:opacity-40"
          >
            <SwitchCamera size={24} />
          </button>

          <ShutterButton
            onClick={handleCapture}
            disabled={shutterDisabled}
            justCaptured={justCaptured}
          />

          <FlashToggle
            mode={camera.flashMode}
            onCycle={camera.cycleFlash}
            theme="dark"
          />
        </div>
      </div>
    </div>
  );
}
