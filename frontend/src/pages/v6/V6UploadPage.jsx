import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompactHeader, ProgressPill } from '../../components/layout/AppHeader';
import { BackButton } from '../../components/ui/BackButton';
import { ProceedButton } from '../../components/ui/ProceedButton';
import { DropZone } from '../../components/upload/DropZone';
import { BatchTray } from '../../components/batch/BatchTray';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { HeroSection } from '../../components/layout/HeroSection';
import { useV6 } from '../../hooks/useV6';
import { useApp } from '../../context/AppContext';
import { AngleChecklistCard } from '../../components/v6/AngleChecklistCard';

export function V6UploadPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const {
    editedContext,
    batchImages,
    batchCount,
    maxImages,
    removeImage,
    tryAddImages,
    canAddMore,
  } = useV6();

  useEffect(() => {
    if (!editedContext) navigate('/v6', { replace: true });
  }, [editedContext, navigate]);

  if (!editedContext) return null;

  const handleFiles = async (files) => {
    if (!files.length) return;
    const { added, skipped } = await tryAddImages(files);
    if (skipped > 0) {
      showToast(`${skipped} file(s) skipped — max ${maxImages} images`, 'warning');
    }
    if (added > 0 && batchCount + added >= 1) {
      navigate('/v6/batch');
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-50">
      <CompactHeader
        title="Upload"
        left={
          <BackButton
            label="Back"
            onClick={() => navigate(`/v6/asset/${editedContext.catalog_id}`)}
          />
        }
        right={<ProgressPill current={batchCount} max={maxImages} />}
      />

      <HeroSection fill className="flex-1">
        <PageWrapper className="py-6 pb-32">
          <header className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900">Add photos for {editedContext.asset_name}</h2>
            <p className="mt-2 text-sm text-gray-600">
              Upload up to {maxImages} images. ERP context will be sent with this batch.
            </p>
          </header>

          <div className="mb-4">
            <AngleChecklistCard
              category={editedContext.category}
              subcategory={editedContext.subcategory}
              compact
            />
          </div>

          <DropZone
            onFilesSelected={handleFiles}
            onRejectedFiles={(count) =>
              showToast(
                `${count} file${count === 1 ? '' : 's'} skipped — use JPEG, PNG, or WebP only`,
                'warning',
              )
            }
            disabled={!canAddMore && batchCount >= maxImages}
          />

          {batchCount > 0 && (
            <section className="mt-10 rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm">
              <BatchTray
                images={batchImages}
                maxImages={maxImages}
                onRemove={removeImage}
                showCounter
              />
            </section>
          )}
        </PageWrapper>
      </HeroSection>

      {batchCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 p-4 backdrop-blur-md">
          <ProceedButton
            fullWidth
            label="Review batch"
            count={batchCount}
            onClick={() => navigate('/v6/batch')}
          />
        </div>
      )}
    </div>
  );
}
