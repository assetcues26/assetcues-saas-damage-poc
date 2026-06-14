import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import {
  ProcessingAnimation,
  ShimmerProgressBar,
} from '../components/processing/ProcessingAnimation';
import { StatusCycler } from '../components/processing/StatusCycler';
import { Button } from '@/components/ui/button';
import { HeroSection } from '../components/layout/HeroSection';
import { useMergedBatch } from '../hooks/useMergedBatch';
import { useHistory } from '../hooks/useHistory';
import { useSession } from '../hooks/useSession';
import { useApp } from '../context/AppContext';
import { analyzeImages } from '../services/analysisService';
import { abortActiveLocalAnalyze } from '../services/assetAnalysisApi';
import { fetchCaptureSession } from '../services/sessionApi';

const ANALYSIS_TIMEOUT_MS = 90_000;

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Analysis timed out after 90 seconds. Cancel and try again.')),
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

export function ProcessingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionToken = searchParams.get('session');

  const { batchImages, batchCount, clearBatch } = useMergedBatch();
  const { addEntry } = useHistory();
  const { attachToken, clearSession, cancelAnalysis, sessionCount } = useSession();
  const {
    lastResult,
    setLastResult,
    setAnalysisError,
    analysisError,
    uploadProcessingMode,
    marketRegion,
  } = useApp();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [sessionImageCount, setSessionImageCount] = useState(() =>
    sessionToken ? sessionCount || 0 : 0,
  );
  const [sessionPollReady, setSessionPollReady] = useState(false);
  const runIdRef = useRef(0);
  const completedRef = useRef(false);
  const startedBatchKeyRef = useRef(null);
  const sawAnalyzingRef = useRef(false);
  const analyzingSinceRef = useRef(null);
  const pollStoppedRef = useRef(false);
  const analyzingRef = useRef(false);

  const batchKey = useMemo(
    () => batchImages.map((img) => img.id).sort().join('|'),
    [batchImages],
  );

  const readyImages = useMemo(
    () => batchImages.filter((img) => img.file instanceof File),
    [batchImages],
  );

  // Phone images synced via capture session — downloadable from signed URLs.
  const remoteImages = useMemo(
    () =>
      batchImages.filter(
        (img) => !(img.file instanceof File) && img.isRemote && img.previewUrl,
      ),
    [batchImages],
  );

  // Refs so the analyze effect reads the latest arrays without re-running when
  // session polling replaces array identities every second.
  const readyImagesRef = useRef(readyImages);
  readyImagesRef.current = readyImages;
  const remoteImagesRef = useRef(remoteImages);
  remoteImagesRef.current = remoteImages;
  const sessionCountRef = useRef(sessionCount);
  sessionCountRef.current = sessionCount;

  const analyzableCount = readyImages.length + remoteImages.length;

  const handleCancel = useCallback(
    async ({ clearImages = false } = {}) => {
      setCancelling(true);
      pollStoppedRef.current = true;
      runIdRef.current += 1;

      try {
        if (sessionToken) {
          await cancelAnalysis({ clearImages });
          setAnalysisError(null);
          setIsAnalyzing(false);
          navigate(clearImages || batchCount === 0 ? '/upload' : '/batch', { replace: true });
          return;
        }

        abortActiveLocalAnalyze();
        setAnalysisError(null);
        setIsAnalyzing(false);
        navigate('/batch', { replace: true });
      } finally {
        setCancelling(false);
      }
    },
    [sessionToken, cancelAnalysis, navigate, batchCount, setAnalysisError],
  );

  useEffect(() => {
    if (sessionToken) {
      attachToken(sessionToken);
    }
  }, [sessionToken, attachToken]);

  // Abort in-flight fetch when leaving the page (do not bump runId — that
  // invalidates completion handlers under React Strict Mode remounts).
  useEffect(
    () => () => {
      abortActiveLocalAnalyze();
    },
    [],
  );

  useEffect(() => {
    if (!sessionToken) return undefined;

    let cancelled = false;
    pollStoppedRef.current = false;
    setIsAnalyzing(true);
    setAnalysisError(null);
    completedRef.current = false;
    sawAnalyzingRef.current = false;
    analyzingSinceRef.current = null;
    setSessionPollReady(false);
    if (sessionCountRef.current > 0) {
      setSessionImageCount(sessionCountRef.current);
    }

    const poll = async () => {
      if (pollStoppedRef.current || cancelled) return;
      try {
        const data = await fetchCaptureSession(sessionToken);
        if (cancelled || pollStoppedRef.current) return;
        setSessionPollReady(true);
        setSessionImageCount(data.image_count || 0);

        if (data.status === 'analyzing') {
          sawAnalyzingRef.current = true;
          if (!analyzingSinceRef.current) {
            analyzingSinceRef.current = Date.now();
          } else if (Date.now() - analyzingSinceRef.current > ANALYSIS_TIMEOUT_MS) {
            setAnalysisError('Analysis timed out after 90 seconds. Cancel and try again.');
            setIsAnalyzing(false);
            pollStoppedRef.current = true;
          }
        }

        if (data.status === 'completed' && data.entry_id) {
          completedRef.current = true;
          clearBatch();
          clearSession();
          navigate(`/result/${data.entry_id}`, { replace: true });
          return;
        }

        if (data.status === 'expired') {
          setAnalysisError('This scan session has expired. Start a new session on your computer.');
          setIsAnalyzing(false);
          pollStoppedRef.current = true;
          return;
        }

        if (data.status === 'active' && sawAnalyzingRef.current) {
          setAnalysisError('Analysis was interrupted. Cancel or return to batch and try again.');
          setIsAnalyzing(false);
          pollStoppedRef.current = true;
        }
      } catch (err) {
        if (!cancelled && !pollStoppedRef.current) {
          setAnalysisError(err.message || 'Could not track session analysis');
          setIsAnalyzing(false);
          pollStoppedRef.current = true;
        }
      }
    };

    poll();
    const id = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sessionToken, navigate, clearBatch, clearSession, setAnalysisError]);

  useEffect(() => {
    if (sessionToken) return undefined;

    if (batchCount === 0) {
      if (!analyzingRef.current && !completedRef.current) {
        navigate('/', { replace: true });
      }
      return undefined;
    }

    if (analyzableCount === 0) {
      setAnalysisError('Missing image files — remove items and re-upload from capture or upload.');
      setIsAnalyzing(false);
      return undefined;
    }

    // Start one analysis per unique batch; never restart for identity-only
    // changes (session polling) or isAnalyzing/error state flips, and never
    // start a second run while one is already in flight (e.g. a late phone
    // image changing the batch key mid-analysis).
    if (analyzingRef.current) return undefined;
    if (startedBatchKeyRef.current === batchKey) return undefined;
    startedBatchKeyRef.current = batchKey;

    const runId = ++runIdRef.current;
    setAnalysisError(null);
    setIsAnalyzing(true);
    analyzingRef.current = true;
    completedRef.current = false;

    const MAX_ANALYZE_IMAGES = 10;
    const materializeAndAnalyze = async () => {
      const locals = readyImagesRef.current.slice(0, MAX_ANALYZE_IMAGES);
      const remotes = remoteImagesRef.current.slice(
        0,
        Math.max(0, MAX_ANALYZE_IMAGES - locals.length),
      );
      const downloaded = await Promise.all(
        remotes.map(async (img, i) => {
          const response = await fetch(img.previewUrl);
          if (!response.ok) {
            throw new Error('Could not load a phone image — go back and try again.');
          }
          const blob = await response.blob();
          return {
            id: img.id,
            previewUrl: img.previewUrl,
            name: img.name || `phone_${i + 1}.jpg`,
            file: new File([blob], img.name || `phone_${i + 1}.jpg`, {
              type: blob.type || 'image/jpeg',
            }),
          };
        }),
      );
      return analyzeImages([...locals, ...downloaded], {
        processingMode: uploadProcessingMode,
        marketRegion,
      });
    };

    withTimeout(materializeAndAnalyze(), ANALYSIS_TIMEOUT_MS)
      .then(async (result) => {
        const entry = await addEntry({
          ...result,
          mergedImageUrl: result.mergedImageUrl ?? null,
          previewUrls: result.previewUrls ?? [],
        });
        setLastResult(entry);
        setAnalysisError(null);
        clearBatch();
        if (remoteImagesRef.current.length > 0) {
          clearSession();
        }
        if (runId !== runIdRef.current) return;
        completedRef.current = true;
        navigate(`/result/${entry.id}`, { replace: true });
      })
      .catch((err) => {
        if (runId !== runIdRef.current) return;
        setAnalysisError(err.message || 'Analysis failed');
      })
      .finally(() => {
        if (runId !== runIdRef.current) {
          // Stale run (e.g. Strict Mode) — unblock UI so recovery can navigate.
          startedBatchKeyRef.current = null;
          analyzingRef.current = false;
          setIsAnalyzing(false);
          return;
        }
        setIsAnalyzing(false);
        analyzingRef.current = false;
      });

    return undefined;
  }, [
    sessionToken,
    batchKey,
    analyzableCount,
    batchCount,
    uploadProcessingMode,
    marketRegion,
    addEntry,
    setLastResult,
    setAnalysisError,
    clearBatch,
    clearSession,
    navigate,
  ]);

  // Recover if analysis finished but navigation was skipped (e.g. Strict Mode).
  useEffect(() => {
    if (sessionToken || isAnalyzing || analysisError || batchCount > 0) return;
    const resultId = lastResult?.id || lastResult?.request_id;
    if (!resultId || completedRef.current) return;
    completedRef.current = true;
    navigate(`/result/${resultId}`, { replace: true });
  }, [
    sessionToken,
    isAnalyzing,
    analysisError,
    batchCount,
    lastResult,
    navigate,
  ]);

  const displayCount = sessionToken ? sessionImageCount : analyzableCount;
  const sessionStatusText =
    sessionToken && !sessionPollReady && displayCount === 0
      ? 'Preparing analysis…'
      : `Analyzing ${displayCount} image${displayCount === 1 ? '' : 's'}… Usually under a minute.`;

  if (!sessionToken && batchCount === 0 && !isAnalyzing && !analysisError) return null;

  if (analysisError && !isAnalyzing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8">
        <AlertCircle size={56} className="text-red-400" />
        <h1 className="text-xl font-bold text-gray-900">Analysis failed</h1>
        <p className="max-w-md text-center text-gray-600">{analysisError}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            disabled={cancelling}
            onClick={() => handleCancel({ clearImages: false })}
          >
            {cancelling ? 'Cancelling…' : 'Cancel analysis'}
          </Button>
          {sessionToken && (
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={() => handleCancel({ clearImages: true })}
            >
              Cancel & clear images
            </Button>
          )}
          <Button onClick={() => navigate(sessionToken ? '/batch' : '/batch')}>Back to batch</Button>
        </div>
      </div>
    );
  }

  return (
    <HeroSection className="min-h-screen">
      <div className="flex min-h-screen flex-col px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-1 flex-col items-center justify-center py-8"
        >
          <ProcessingAnimation />
          <p className="mt-6 text-center text-sm text-gray-600">
            {sessionToken ? sessionStatusText : `Analyzing ${displayCount} image${displayCount === 1 ? '' : 's'}… Usually under a minute.`}
          </p>
          <div className="mt-10 w-full max-w-md">
            <StatusCycler />
          </div>
        </motion.div>

        <div className="mx-auto w-full max-w-md shrink-0 pb-8 pb-safe">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              disabled={cancelling}
              onClick={() => handleCancel({ clearImages: false })}
            >
              {cancelling ? 'Cancelling…' : 'Cancel analysis'}
            </Button>
            {sessionToken && (
              <Button
                variant="destructive"
                disabled={cancelling}
                onClick={() => handleCancel({ clearImages: true })}
              >
                Cancel & clear images
              </Button>
            )}
          </div>
          <ShimmerProgressBar />
        </div>
      </div>
    </HeroSection>
  );
}
