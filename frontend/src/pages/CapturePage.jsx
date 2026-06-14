import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Images, SwitchCamera } from 'lucide-react';
import { CompactHeader, ProgressPill } from '../components/layout/AppHeader';
import { BrandLogo } from '../components/layout/BrandLogo';
import { BackButton } from '../components/ui/BackButton';
import { CameraZoomControls } from '../components/capture/CameraZoomControls';
import { ConfirmModal } from '../components/ui/Modal';
import { ProceedButton } from '../components/ui/ProceedButton';
import { CameraView } from '../components/capture/CameraView';
import { ShutterButton } from '../components/capture/ShutterButton';
import { FlashToggle } from '../components/capture/FlashToggle';
import { BatchTray } from '../components/batch/BatchTray';
import { LiveBatchPanel } from '../components/batch/LiveBatchPanel';
import { useCamera } from '../hooks/useCamera';
import { useMergedBatch } from '../hooks/useMergedBatch';
import { usePhoneBatchPanel } from '../hooks/usePhoneBatchPanel';
import { useApp } from '../context/AppContext';
import { AddFromPhonePanel } from '../components/session/AddFromPhonePanel';

export function CapturePage() {
  const navigate = useNavigate();
  const { maxImages, setPreviewImage, showToast } = useApp();
  const {
    batchImages,
    batchCount,
    removeImage,
    canAddMore,
    hasSessionImages,
    sessionImageCount,
  } = useMergedBatch();
  const { open: batchPanelOpen, openPanel, closePanel } = usePhoneBatchPanel(sessionImageCount);
  const camera = useCamera();
  const cameraApiRef = useRef(camera);
  cameraApiRef.current = camera;

  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => () => cameraApiRef.current.handleUnmount(), []);

  const leaveCapture = () => {
    camera.releaseStream();
    navigate('/');
  };

  const goBack = () => {
    if (batchCount > 0) setLeaveConfirm(true);
    else leaveCapture();
  };

  const handleCapture = async () => {
    if (!canAddMore) {
      showToast(`Maximum ${maxImages} images reached`, 'warning');
      return;
    }
    if (!camera.isReady || capturing) return;

    setCapturing(true);
    const file = await camera.captureFrame();
    setCapturing(false);

    if (!file) {
      showToast('Failed to capture image', 'error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const payload = { file, previewUrl, source: 'capture' };
    setPreviewImage(payload);
    navigate('/preview?source=capture', { state: payload });
  };

  const contentBottomPad = batchCount >= 1 ? 'pb-[22rem]' : 'pb-[18rem]';

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-950 text-gray-100">
      <CompactHeader
        variant="dark"
        ariaLabel="Capture"
        center={<BrandLogo className="h-7 w-auto brightness-0 invert sm:h-8" />}
        left={<BackButton label="Back" onClick={goBack} variant="dark" />}
        right={<ProgressPill current={batchCount} max={maxImages} variant="dark" />}
      />

      <div
        className={`flex min-h-0 flex-1 flex-col px-3 pt-2 sm:px-4 sm:pt-3 ${contentBottomPad}`}
      >
        <CameraView
          videoRef={camera.videoRef}
          facingMode={camera.facingMode}
          zoomLevel={camera.previewZoom}
          status={camera.status}
          error={camera.error}
          onRetry={camera.retry}
          className="min-h-[min(55dvh,520px)] flex-1 sm:min-h-[min(65dvh,640px)]"
        />
        <p className="mt-2 px-1 text-center text-xs leading-relaxed text-gray-400 sm:mt-3">
          Align the asset in frame, then tap the shutter. Save each photo, then proceed to analysis.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-gray-950/95 pb-safe backdrop-blur-md">
        {batchCount >= 1 && (
          <div className="border-b border-gray-800 px-4 py-3 sm:px-6">
            <ProceedButton
              label="Proceed to Analysis"
              count={batchCount}
              onClick={() => navigate('/batch')}
              className="w-full"
            />
          </div>
        )}

        <div className="px-4 sm:px-6">
          <AddFromPhonePanel variant="compact" />
        </div>

        <BatchTray
          images={batchImages}
          maxImages={maxImages}
          onRemove={removeImage}
          theme="dark"
        />

        <div className="px-4 pt-2 sm:px-6">
          <CameraZoomControls
            zoomLevel={camera.zoomLevel}
            onZoomChange={camera.setZoomLevel}
            disabled={!camera.isReady}
          />
        </div>

        <div className="flex items-center justify-between px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
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
            disabled={!canAddMore || capturing || !camera.isReady}
          />

          <FlashToggle
            mode={camera.flashMode}
            onCycle={camera.cycleFlash}
            theme="dark"
          />
        </div>
      </div>

      <LiveBatchPanel
        open={batchPanelOpen}
        onClose={closePanel}
        images={batchImages}
        maxImages={maxImages}
        onRemove={removeImage}
        onProceed={() => navigate('/batch')}
        sessionImageCount={sessionImageCount}
      />

      {hasSessionImages && batchCount > 0 && !batchPanelOpen && (
        <button
          type="button"
          onClick={openPanel}
          className="fixed bottom-[21rem] right-4 z-50 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 sm:bottom-[22rem]"
        >
          <Images size={18} aria-hidden />
          Phone photos ({sessionImageCount})
        </button>
      )}

      <ConfirmModal
        open={leaveConfirm}
        title="Leave capture?"
        description="You have unsaved images in your batch. Leaving will keep them, but you can continue reviewing on the batch page."
        confirmLabel="Leave"
        confirmVariant="primary"
        onConfirm={leaveCapture}
        onCancel={() => setLeaveConfirm(false)}
      />
    </div>
  );
}
