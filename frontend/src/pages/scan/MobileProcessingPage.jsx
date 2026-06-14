import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ProcessingAnimation,
  ShimmerProgressBar,
} from '../../components/processing/ProcessingAnimation';
import { StatusCycler } from '../../components/processing/StatusCycler';
import { HeroSection } from '../../components/layout/HeroSection';
import { Button } from '@/components/ui/button';
import { useMobileSession } from '../../hooks/useMobileSession';

export function MobileProcessingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const seedImageCount = location.state?.imageCount ?? 0;
  const { session, imageCount, error, isAnalyzing, cancelling, cancelAnalysis } =
    useMobileSession(token, { seedImageCount });

  if (error) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-zinc-50 p-8">
        <AlertCircle size={48} className="text-red-400" aria-hidden />
        <h1 className="text-lg font-bold text-gray-900">Analysis failed</h1>
        <p className="max-w-sm text-center text-sm text-gray-600">{error}</p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button
            variant="outline"
            disabled={cancelling}
            onClick={() => cancelAnalysis({ clearImages: false })}
          >
            {cancelling ? 'Cancelling…' : 'Cancel analysis'}
          </Button>
          <Button
            variant="destructive"
            disabled={cancelling}
            onClick={() => cancelAnalysis({ clearImages: true })}
          >
            Cancel & clear images
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/scan/${token}/done`)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <HeroSection className="min-h-[100dvh]">
      <div className="flex min-h-[100dvh] flex-col px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-1 flex-col items-center justify-center py-8"
        >
          <ProcessingAnimation />
          <p className="mt-6 text-center text-sm text-gray-600">
            {!isAnalyzing && !session
              ? 'Preparing analysis…'
              : `Analyzing ${imageCount} image${imageCount === 1 ? '' : 's'}…`}
          </p>
          <p className="mt-2 text-center text-xs text-gray-500">
            Usually under a minute. Tap cancel to stop.
          </p>
          <div className="mt-10 w-full max-w-md">
            <StatusCycler />
          </div>
        </motion.div>

        <div className="mx-auto w-full max-w-sm shrink-0 pb-8 pb-safe">
          <div className="mb-5 flex flex-col gap-3">
            <Button
              variant="outline"
              disabled={cancelling}
              onClick={() => cancelAnalysis({ clearImages: false })}
            >
              {cancelling ? 'Cancelling…' : 'Cancel analysis'}
            </Button>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={() => cancelAnalysis({ clearImages: true })}
            >
              Cancel & clear images
            </Button>
          </div>
          <ShimmerProgressBar />
        </div>
      </div>
    </HeroSection>
  );
}
