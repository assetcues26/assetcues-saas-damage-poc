import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import {
  ProcessingAnimation,
  ShimmerProgressBar,
} from '../../components/processing/ProcessingAnimation';
import { StatusCycler } from '../../components/processing/StatusCycler';
import { Button } from '@/components/ui/button';
import { HeroSection } from '../../components/layout/HeroSection';
import { useV6 } from '../../hooks/useV6';
import { analyzeV6Images } from '../../services/v6ErpService';

const ANALYSIS_TIMEOUT_MS = 120_000;

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Analysis is taking longer than expected. Please try again.')),
      ms,
    );
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function V6ProcessingPage() {
  const navigate = useNavigate();
  const {
    batchImages,
    batchCount,
    editedContext,
    clearBatch,
    addSessionResult,
    analysisError,
    setAnalysisError,
  } = useV6();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const runIdRef = useRef(0);
  const completedRef = useRef(false);
  const startedBatchKeyRef = useRef(null);

  const batchKey = useMemo(
    () => batchImages.map((img) => img.id).sort().join('|'),
    [batchImages],
  );

  const readyImages = useMemo(
    () => batchImages.filter((img) => img.file instanceof File),
    [batchImages],
  );

  useEffect(() => {
    if (!editedContext) {
      navigate('/v6', { replace: true });
      return;
    }
    if (batchCount === 0) {
      if (!isAnalyzing && !completedRef.current) {
        navigate('/v6/upload', { replace: true });
      }
      return;
    }

    if (readyImages.length === 0) {
      setAnalysisError('Missing image files — remove items and re-upload.');
      setIsAnalyzing(false);
      return;
    }

    if (startedBatchKeyRef.current === batchKey) return;
    startedBatchKeyRef.current = batchKey;

    const runId = ++runIdRef.current;
    setAnalysisError(null);
    setIsAnalyzing(true);
    completedRef.current = false;

    withTimeout(analyzeV6Images(readyImages, editedContext), ANALYSIS_TIMEOUT_MS)
      .then((result) => {
        if (runId !== runIdRef.current) return;
        const entry = addSessionResult({
          ...result,
          mergedImageUrl: result.mergedImageUrl ?? null,
          previewUrls: result.previewUrls ?? [],
        });
        setAnalysisError(null);
        clearBatch();
        completedRef.current = true;
        navigate(`/v6/result/${entry.id}`, { replace: true });
      })
      .catch((err) => {
        if (runId !== runIdRef.current) return;
        setAnalysisError(err.message || 'V6 analysis failed');
      })
      .finally(() => {
        if (runId === runIdRef.current) setIsAnalyzing(false);
      });

    return () => {
      runIdRef.current += 1;
      startedBatchKeyRef.current = null;
    };
  }, [
    batchKey,
    batchCount,
    readyImages,
    editedContext,
    addSessionResult,
    setAnalysisError,
    clearBatch,
    navigate,
  ]);

  if (batchCount === 0 && !isAnalyzing && !analysisError) return null;

  if (analysisError && !isAnalyzing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8">
        <AlertCircle size={56} className="text-red-400" />
        <h1 className="text-xl font-bold text-gray-900">V6 analysis failed</h1>
        <p className="max-w-md text-center text-gray-600">{analysisError}</p>
        <Button onClick={() => navigate('/v6/batch')}>Try Again</Button>
      </div>
    );
  }

  return (
    <HeroSection className="min-h-screen">
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <ProcessingAnimation />
          <p className="mt-6 text-center text-sm text-gray-600">
            V6 analyzing {readyImages.length} image{readyImages.length === 1 ? '' : 's'} with
            ERP context…
          </p>
          <div className="mt-10 w-full max-w-md">
            <StatusCycler />
          </div>
        </motion.div>
        <div className="absolute bottom-16 left-6 right-6 mx-auto max-w-2xl">
          <ShimmerProgressBar />
        </div>
      </div>
    </HeroSection>
  );
}
