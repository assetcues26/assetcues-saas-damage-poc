import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { CompactHeader, ProgressPill } from '../../components/layout/AppHeader';
import { BackButton } from '../../components/ui/BackButton';
import { ProceedButton } from '../../components/ui/ProceedButton';
import { Button } from '@/components/ui/button';
import { BatchThumbnail } from '../../components/batch/BatchThumbnail';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { HeroSection } from '../../components/layout/HeroSection';
import { useV6 } from '../../hooks/useV6';
import { AngleChecklistCard } from '../../components/v6/AngleChecklistCard';

export function V6BatchPage() {
  const navigate = useNavigate();
  const {
    editedContext,
    batchImages,
    batchCount,
    maxImages,
    removeImage,
    setAnalysisError,
  } = useV6();

  useEffect(() => {
    if (!editedContext) navigate('/v6', { replace: true });
    else if (batchCount === 0) navigate('/v6/upload', { replace: true });
  }, [editedContext, batchCount, navigate]);

  if (!editedContext || batchCount === 0) return null;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-50">
      <CompactHeader
        title="Batch"
        left={<BackButton label="Back" onClick={() => navigate('/v6/upload')} />}
        right={<ProgressPill current={batchCount} max={maxImages} />}
      />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <HeroSection>
          <PageWrapper className="py-4 pb-28 sm:py-6">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {batchCount} image{batchCount === 1 ? '' : 's'} for {editedContext.asset_name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              ERP context + photos sent to the V6 analysis endpoint
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
            {batchImages.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <BatchThumbnail image={img} index={idx + 1} onRemove={removeImage} />
              </motion.div>
            ))}
            </div>

            <div className="mt-4">
              <AngleChecklistCard
                category={editedContext.category}
                subcategory={editedContext.subcategory}
                compact
                defaultCollapsed
              />
            </div>

            {batchCount === 0 && (
              <div className="flex flex-col items-center gap-4 py-16">
                <ImageOff size={48} className="text-gray-600" />
                <Button variant="outline" onClick={() => navigate('/v6/upload')}>
                  Add images
                </Button>
              </div>
            )}
          </PageWrapper>
        </HeroSection>
      </main>

      <footer className="shrink-0 border-t border-gray-200 bg-white/95 p-3 pb-safe backdrop-blur-md sm:p-4">
        <div className="mx-auto flex max-w-lg gap-2 sm:gap-3">
          <Button
            variant="outline"
            className="min-h-11 flex-1 sm:min-h-9"
            onClick={() => navigate('/v6/upload')}
          >
            Add more
          </Button>
          <ProceedButton
            fullWidth={false}
            className="min-h-11 flex-[2] min-w-0 sm:min-h-9"
            label="Run V6 analysis"
            count={batchCount}
            onClick={() => {
              setAnalysisError(null);
              navigate('/v6/processing');
            }}
          />
        </div>
      </footer>
    </div>
  );
}
