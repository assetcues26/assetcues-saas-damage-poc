import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Check, Trash2 } from 'lucide-react';
import { CompactHeader } from '../components/layout/AppHeader';
import { BackButton } from '../components/ui/BackButton';
import { ProceedButton } from '../components/ui/ProceedButton';
import { Button } from '@/components/ui/button';
import { useApp } from '../context/AppContext';
import { useMergedBatch } from '../hooks/useMergedBatch';
import { formatFileSize } from '../utils/formatters';

export function PreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const source = params.get('source') || 'capture';
  const { previewImage, setPreviewImage, showToast } = useApp();
  const { tryAddImage, batchCount } = useMergedBatch();
  const [meta, setMeta] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!previewImage && location.state?.file) {
      setPreviewImage({
        file: location.state.file,
        previewUrl: location.state.previewUrl,
        source: location.state.source || source,
      });
    }
  }, [location.state, previewImage, setPreviewImage, source]);

  useEffect(() => {
    if (!previewImage && !location.state?.file) {
      navigate(source === 'upload' ? '/upload' : '/capture', { replace: true });
    }
  }, [previewImage, location.state, navigate, source]);

  useEffect(() => {
    if (!previewImage?.previewUrl) return;
    const img = new Image();
    img.onload = () => setMeta({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = previewImage.previewUrl;
  }, [previewImage]);

  if (!previewImage) return null;

  const goBack = () => {
    URL.revokeObjectURL(previewImage.previewUrl);
    setPreviewImage(null);
    navigate(source === 'upload' ? '/upload' : '/capture');
  };

  const handleDiscard = () => {
    goBack();
  };

  const handleSave = async () => {
    const added = await tryAddImage(previewImage.file);
    if (added) {
      showToast('Image saved to batch', 'success');
    }
    URL.revokeObjectURL(previewImage.previewUrl);
    setPreviewImage(null);
    navigate(source === 'upload' ? '/upload' : '/capture');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-50">
      <CompactHeader
        title="Preview Image"
        left={<BackButton label="Back" onClick={handleDiscard} />}
      />

      <div className="relative flex min-h-0 flex-1 w-full items-center justify-center bg-black p-2 pb-36 sm:p-4 sm:pb-28">
        <div className="flex h-full w-full max-h-[calc(100dvh-11rem)] items-center justify-center">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit
            centerZoomedOut
          >
            <TransformComponent
              wrapperClass="flex h-full w-full items-center justify-center"
              contentClass="flex w-full items-center justify-center"
            >
              <img
                src={previewImage.previewUrl}
                alt="Preview"
                className="mx-auto block max-h-[calc(100dvh-13rem)] w-auto max-w-full object-contain"
              />
            </TransformComponent>
          </TransformWrapper>
        </div>

        <div className="absolute bottom-36 left-2 right-2 max-w-full truncate rounded-xl border border-gray-200 bg-white/95 px-3 py-2 text-center text-[11px] text-gray-700 backdrop-blur-sm sm:bottom-32 sm:left-4 sm:right-auto sm:max-w-none sm:rounded-full sm:px-4 sm:text-xs">
          {previewImage.file.name} · {formatFileSize(previewImage.file.size)}
          {meta.width > 0 && ` · ${meta.width}×${meta.height}`}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col gap-2 border-t border-gray-200 bg-white/95 p-3 pb-safe backdrop-blur-md sm:gap-3 sm:p-4">
        {batchCount >= 1 && (
          <ProceedButton
            label="Proceed to Analysis"
            count={batchCount}
            onClick={() => {
              URL.revokeObjectURL(previewImage.previewUrl);
              setPreviewImage(null);
              navigate('/batch');
            }}
          />
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            variant="danger"
            className="min-h-12 flex-1 sm:min-h-11"
            onClick={handleDiscard}
            ariaLabel="Discard image"
          >
            <Trash2 size={18} />
            Discard
          </Button>
          <Button
            variant="success"
            className="min-h-12 flex-1 sm:min-h-11"
            onClick={handleSave}
            ariaLabel="Save image to batch"
          >
            <Check size={18} />
            Save to batch
          </Button>
        </div>
      </div>
    </div>
  );
}
