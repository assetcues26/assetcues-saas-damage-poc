import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SwitchCamera } from 'lucide-react';
import { CompactHeader, ProgressPill } from '../../components/layout/AppHeader';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { BackButton } from '../../components/ui/BackButton';
import { CameraZoomControls } from '../../components/capture/CameraZoomControls';
import { ConfirmModal } from '../../components/ui/Modal';
import { ProceedButton } from '../../components/ui/ProceedButton';
import { CameraView } from '../../components/capture/CameraView';
import { ShutterButton } from '../../components/capture/ShutterButton';
import { FlashToggle } from '../../components/capture/FlashToggle';
import { BatchTray } from '../../components/batch/BatchTray';
import { useCamera } from '../../hooks/useCamera';
import { useV6 } from '../../hooks/useV6';
import { useApp } from '../../context/AppContext';
import { AngleChecklistCard } from '../../components/v6/AngleChecklistCard';

export function V6CapturePage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const {
    editedContext,
    batchImages,
    batchCount,
    maxImages,
    removeImage,
    addImage,
    canAddMore,
  } = useV6();
  const camera = useCamera();
  const cameraApiRef = useRef(camera);
  cameraApiRef.current = camera;

  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!editedContext) navigate('/v6', { replace: true });
  }, [editedContext, navigate]);

  useEffect(() => () => cameraApiRef.current.handleUnmount(), []);

  if (!editedContext) return null;

  const goBack = () => {
    if (batchCount > 0) setLeaveConfirm(true);
    else navigate(`/v6/asset/${editedContext.catalog_id}`);
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

    await addImage(file);
    showToast('Photo added to batch', 'success');
  };

  const contentBottomPad = batchCount >= 1 ? 'pb-[22rem]' : 'pb-[18rem]';

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-950 text-gray-100">
      <CompactHeader
        variant="dark"
        ariaLabel="capture"
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
        <div className="mt-2 px-1">
          <AngleChecklistCard
            category={editedContext.category}
            subcategory={editedContext.subcategory}
            theme="dark"
            compact
            defaultCollapsed
          />
        </div>
        <p className="mt-2 px-1 text-center text-xs text-gray-400">
          V6 — photos are sent with ERP context for {editedContext.asset_name}
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-gray-950/95 pb-safe backdrop-blur-md">
        {batchCount >= 1 && (
          <div className="border-b border-gray-800 px-4 py-3">
            <ProceedButton
              label="Review batch"
              count={batchCount}
              onClick={() => navigate('/v6/batch')}
              className="w-full"
            />
          </div>
        )}

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
          <FlashToggle mode={camera.flashMode} onCycle={camera.cycleFlash} theme="dark" />
        </div>
      </div>

      <ConfirmModal
        open={leaveConfirm}
        title="Leave capture?"
        description="Your batch is kept in this session."
        confirmLabel="Leave"
        onConfirm={() => navigate(`/v6/asset/${editedContext.catalog_id}`)}
        onCancel={() => setLeaveConfirm(false)}
      />
    </div>
  );
}
