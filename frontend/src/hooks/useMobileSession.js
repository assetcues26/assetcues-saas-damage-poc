import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  analyzeCaptureSession,
  cancelCaptureSessionAnalysis,
  fetchCaptureSession,
  isSessionUnavailableError,
} from '../services/sessionApi';
import { DEFAULT_MARKET_REGION } from '../constants/markets';

const POLL_MS = 1000;
const ANALYZE_STALE_MS = 90_000;

/**
 * Poll capture session on mobile routes.
 * @param {string | undefined} token
 * @param {{ seedImageCount?: number }} [options]
 */
export function useMobileSession(token, options = {}) {
  const seedImageCount = options.seedImageCount ?? 0;
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const sawAnalyzingRef = useRef(false);
  const analyzingSinceRef = useRef(null);
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  const handleSessionStatus = useCallback(
    (data) => {
      if (!data) return;

      if (data.status === 'analyzing') {
        sawAnalyzingRef.current = true;
        if (!analyzingSinceRef.current) {
          analyzingSinceRef.current = Date.now();
        }
        const elapsed = Date.now() - analyzingSinceRef.current;
        if (elapsed > ANALYZE_STALE_MS) {
          setError('Analysis timed out after 90 seconds. Cancel and try again.');
        }
        if (!pathnameRef.current.includes('/processing')) {
          navigate(`/scan/${token}/processing`, {
            replace: true,
            state: { imageCount: data.image_count ?? 0 },
          });
        }
        return;
      }

      analyzingSinceRef.current = null;

      if (data.status === 'active' && sawAnalyzingRef.current) {
        sawAnalyzingRef.current = false;
        setError((prev) => prev || 'Analysis was interrupted. Cancel and try again.');
        return;
      }

      if (data.status === 'active') {
        setError(null);
      }

      if (data.status === 'completed' && data.entry_id) {
        sawAnalyzingRef.current = false;
        navigate(`/result/${data.entry_id}`, { replace: true });
      }
    },
    [navigate, token],
  );

  const refresh = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await fetchCaptureSession(token);
      setSession(data);
      if (data.status === 'expired') {
        setError('This scan link has expired. Start a new scan on your computer.');
      }
      handleSessionStatus(data);
      return data;
    } catch (err) {
      setError(err?.message || 'Session unavailable');
      return null;
    }
  }, [token, handleSessionStatus]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Invalid scan link');
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    sawAnalyzingRef.current = false;
    analyzingSinceRef.current = null;

    const load = async () => {
      const data = await refresh();
      if (!cancelled) setLoading(false);
      if (data?.status === 'expired') {
        setError('This scan link has expired. Start a new scan on your computer.');
      }
    };

    load();
    const id = setInterval(() => {
      refresh();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token, refresh]);

  const startAnalyze = useCallback(async () => {
    if (!token) return null;
    setError(null);
    sawAnalyzingRef.current = false;
    analyzingSinceRef.current = null;
    try {
      const latest = await refresh();
      const sessionRegion =
        latest?.market_region || session?.market_region || DEFAULT_MARKET_REGION;
      const result = await analyzeCaptureSession(token, {
        marketRegion: sessionRegion,
      });
      const data = latest ?? (await refresh());
      if (result.status === 'completed' && result.entry_id) {
        navigate(`/result/${result.entry_id}`, { replace: true });
        return result;
      }
      if (result.status === 'analyzing' || result.status === 'completed') {
        navigate(`/scan/${token}/processing`, {
          replace: true,
          state: { imageCount: data?.image_count ?? seedImageCount },
        });
      }
      return result;
    } catch (err) {
      setError(err?.message || 'Analysis failed');
      return null;
    }
  }, [token, refresh, navigate, seedImageCount, session?.market_region]);

  const cancelAnalysis = useCallback(
    async ({ clearImages = false } = {}) => {
      if (!token) return null;
      setCancelling(true);
      try {
        const updated = await cancelCaptureSessionAnalysis(token, { clearImages });
        setSession(updated);
        sawAnalyzingRef.current = false;
        analyzingSinceRef.current = null;
        setError(null);
        navigate(`/scan/${token}/done`, { replace: true });
        return updated;
      } catch (err) {
        setError(err?.message || 'Could not cancel analysis');
        return null;
      } finally {
        setCancelling(false);
      }
    },
    [token, navigate],
  );

  return {
    session,
    error,
    loading,
    cancelling,
    refresh,
    startAnalyze,
    cancelAnalysis,
    isUnavailable: error && isSessionUnavailableError({ message: error }),
    imageCount: session?.image_count ?? seedImageCount,
    maxImages: session?.max_images ?? 10,
    canAdd: session?.status === 'active',
    isAnalyzing: session?.status === 'analyzing',
  };
}
