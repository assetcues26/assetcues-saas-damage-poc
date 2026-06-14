import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { CompactHeader, ProgressPill } from '../components/layout/AppHeader';
import { BackButton } from '../components/ui/BackButton';
import { ProceedButton } from '../components/ui/ProceedButton';
import { Button } from '@/components/ui/button';
import { BatchThumbnail } from '../components/batch/BatchThumbnail';
import { PageWrapper } from '../components/layout/PageWrapper';
import { HeroSection } from '../components/layout/HeroSection';
import { useMergedBatch } from '../hooks/useMergedBatch';
import { useSession } from '../hooks/useSession';
import { useApp } from '../context/AppContext';
import { AddFromPhonePanel } from '../components/session/AddFromPhonePanel';

export function BatchPage() {
  const navigate = useNavigate();
  const { setLastResult, setAnalysisError } = useApp();
  const {
    batchImages,
    batchCount,
    removeImage,
    maxImages,
  } = useMergedBatch();
  const { isSessionAnalyzing, cancelAnalysis } = useSession();
  const [proceeding, setProceeding] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (batchCount === 0) {
      navigate('/', { replace: true });
    }
  }, [batchCount, navigate]);

  if (batchCount === 0) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-28">
      <CompactHeader
        title="Review Batch"
        left={
          <BackButton
            label="Back"
            onClick={() => navigate(batchImages.length ? '/capture' : '/')}
          />
        }
        right={<ProgressPill current={batchCount} max={maxImages} />}
      />

      <HeroSection>
        <PageWrapper className="py-6">
          <div className="mb-6">
            <AddFromPhonePanel variant="compact" />
          </div>

          {isSessionAnalyzing && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">Analysis in progress</p>
              <p className="mt-1 text-xs text-amber-800">
                Images are locked until you cancel. You can delete them after cancelling.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelling}
                  onClick={async () => {
                    setCancelling(true);
                    await cancelAnalysis({ clearImages: false });
                    setCancelling(false);
                  }}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel analysis'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={cancelling}
                  onClick={async () => {
                    setCancelling(true);
                    await cancelAnalysis({ clearImages: true });
                    setCancelling(false);
                  }}
                >
                  Cancel & clear all
                </Button>
              </div>
            </div>
          )}

          <motion.div
            key={batchCount}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              <motion.span
                key={batchCount}
                initial={{ scale: 1.2, color: '#60A5FA' }}
                animate={{ scale: 1, color: '#111827' }}
              >
                {batchCount}
              </motion.span>{' '}
              images ready for analysis
            </h2>
            <p className="mt-1 text-sm text-gray-500">Review your images before proceeding</p>
          </motion.div>
        </PageWrapper>
      </HeroSection>

      <PageWrapper className="py-6">
        {batchCount === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <ImageOff size={48} className="text-gray-600" />
            <p className="text-gray-600">Add images to continue</p>
            <Button variant="outline" onClick={() => navigate('/capture')}>
              Go to Capture
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {batchImages.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <BatchThumbnail
                  image={img}
                  index={idx + 1}
                  onRemove={removeImage}
                />
              </motion.div>
            ))}
          </div>
        )}
      </PageWrapper>

      <div className="fixed bottom-0 left-0 right-0 flex gap-3 border-t border-gray-200 bg-white/95 p-4 backdrop-blur-md">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/upload')}>
          Back
        </Button>
        <ProceedButton
          fullWidth
          className="flex-[2]"
          label="Proceed to Analysis"
          count={batchCount}
          disabled={batchCount === 0 || proceeding}
          onClick={() => {
            setLastResult(null);
            setAnalysisError(null);
            setProceeding(true);
            // Always use the fast direct analyze path — phone images are
            // downloaded from their signed URLs on the processing page.
            navigate('/processing');
            setProceeding(false);
          }}
        />
      </div>
    </div>
  );
}
