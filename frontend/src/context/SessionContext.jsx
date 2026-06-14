import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CAPTURE_SESSION_ENABLED } from '../config/features';
import { useApp } from './AppContext';
import { useBatchContext } from './BatchContext';
import {
  abortActiveSessionAnalyze,
  analyzeCaptureSession,
  cancelCaptureSessionAnalysis,
  createCaptureSession,
  deleteSessionImage,
  fetchCaptureSession,
  isSessionNotFoundError,
  isSessionUnavailableError,
  uploadSessionImagesPrepared,
} from '../services/sessionApi';

const POLL_MS = 1000;

const SessionContext = createContext(null);

const LAPTOP_SYNC_PATHS = ['/upload', '/capture', '/batch'];

export function SessionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { uploadProcessingMode, showToast, maxImages, marketRegion } = useApp();
  const { batchImages, clearBatch } = useBatchContext();

  const [enabled, setEnabled] = useState(CAPTURE_SESSION_ENABLED);
  const [token, setToken] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const completedHandledRef = useRef(null);
  const analysisCancelledRef = useRef(false);

  const refreshSession = useCallback(async (activeToken) => {
    if (!activeToken) return null;
    const data = await fetchCaptureSession(activeToken);
    setSession(data);
    return data;
  }, []);

  const clearSession = useCallback(() => {
    abortActiveSessionAnalyze();
    setToken(null);
    setSession(null);
    completedHandledRef.current = null;
    analysisCancelledRef.current = false;
  }, []);

  const attachToken = useCallback((activeToken) => {
    setToken(activeToken);
    completedHandledRef.current = null;
    analysisCancelledRef.current = false;
  }, []);

  const startSession = useCallback(async () => {
    if (!enabled) {
      showToast('Add from phone is not available', 'warning');
      return null;
    }
    setLoading(true);
    try {
      const created = await createCaptureSession({
        processing_mode: uploadProcessingMode,
        market_region: marketRegion,
      });
      const activeToken = created.session_token;
      setToken(activeToken);
      setSession(created);
      analysisCancelledRef.current = false;
      // QR session is for phone uploads only — laptop images stay in local batch
      // and use the fast direct analyze path (/v1/assets/analyze/*).
      return activeToken;
    } catch (err) {
      if (isSessionUnavailableError(err)) {
        setEnabled(false);
      }
      const msg = err?.message || '';
      showToast(
        msg.includes('Failed to fetch')
          ? 'Cannot reach the API — check VITE_ASSET_ANALYSIS_API_BASE on Vercel and redeploy frontend'
          : msg || 'Could not start phone session',
        'error',
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, uploadProcessingMode, showToast, marketRegion]);

  const uploadImage = useCallback(
    async (fileOrFiles, source = 'laptop') => {
      if (!token) {
        showToast('Tap Add from phone first', 'warning');
        return null;
      }
      try {
        const updated = await uploadSessionImagesPrepared(token, fileOrFiles, source, {
          sessionImages: session?.images,
        });
        setSession(updated);
        return updated;
      } catch (err) {
        showToast(err?.message || 'Upload failed', 'error');
        return null;
      }
    },
    [token, session?.images, showToast],
  );

  const removeImage = useCallback(
    async (imageId) => {
      if (!token) return null;
      try {
        const updated = await deleteSessionImage(token, imageId);
        setSession(updated);
        return updated;
      } catch (err) {
        showToast(err?.message || 'Could not remove image', 'error');
        return null;
      }
    },
    [token, showToast],
  );

  const startAnalyze = useCallback(async () => {
    if (!token) return null;
    analysisCancelledRef.current = false;
    try {
      const result = await analyzeCaptureSession(token, { marketRegion });
      if (analysisCancelledRef.current) return null;
      if (result.status === 'analyzing' || result.status === 'completed') {
        await refreshSession(token);
      }
      return result;
    } catch (err) {
      if (analysisCancelledRef.current) return null;
      showToast(err?.message || 'Analysis could not start', 'error');
      return null;
    }
  }, [token, refreshSession, showToast, marketRegion]);

  const clearSessionImages = useCallback(
    async (activeToken, images) => {
      let latest = null;
      for (const img of images || []) {
        latest = await deleteSessionImage(activeToken, img.id);
      }
      return latest;
    },
    [deleteSessionImage],
  );

  const cancelAnalysis = useCallback(
    async ({ clearImages = false } = {}) => {
      if (!token) {
        if (clearImages) clearBatch();
        return null;
      }

      analysisCancelledRef.current = true;
      abortActiveSessionAnalyze();

      const succeed = (updated, message) => {
        if (updated) setSession(updated);
        if (clearImages) clearBatch();
        showToast(message, 'success');
        return updated;
      };

      try {
        let current = await fetchCaptureSession(token);

        if (current.status === 'active') {
          if (clearImages && current.images?.length) {
            current = await clearSessionImages(token, current.images);
          }
          return succeed(
            current,
            clearImages ? 'Analysis cancelled and images cleared' : 'Analysis cancelled',
          );
        }

        const updated = await cancelCaptureSessionAnalysis(token, { clearImages });
        return succeed(
          updated,
          clearImages ? 'Analysis cancelled and images cleared' : 'Analysis cancelled',
        );
      } catch (err) {
        try {
          const current = await fetchCaptureSession(token);
          if (current.status === 'active') {
            let latest = current;
            if (clearImages && current.images?.length) {
              latest = await clearSessionImages(token, current.images);
            }
            return succeed(
              latest,
              clearImages ? 'Images cleared — you can upload again' : 'Analysis cancelled',
            );
          }
          if (current.status === 'analyzing') {
            showToast(
              'Server is still processing. Wait a minute or use Settings → Clear database.',
              'warning',
            );
            return null;
          }
        } catch (refreshErr) {
          if (isSessionNotFoundError(refreshErr) || isSessionNotFoundError(err)) {
            clearSession();
            if (clearImages) clearBatch();
            showToast('Session reset — start a new upload', 'success');
            return null;
          }
        }

        if (isSessionNotFoundError(err)) {
          clearSession();
          if (clearImages) clearBatch();
          showToast('Session reset — start a new upload', 'success');
          return null;
        }

        showToast(err?.message || 'Could not cancel analysis', 'error');
        return null;
      }
    },
    [token, clearBatch, clearSessionImages, showToast, clearSession],
  );

  const batchImagesRef = useRef(batchImages);
  batchImagesRef.current = batchImages;

  useEffect(() => {
    if (!token || !enabled) return undefined;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await fetchCaptureSession(token);
        if (cancelled) return;
        setSession(data);

        // Never interfere with a direct laptop analysis in progress
        // (/processing without ?session= runs the fast local path).
        const onDirectProcessing =
          location.pathname.startsWith('/processing') &&
          !location.search.includes('session');

        if (
          data.status === 'analyzing' &&
          !analysisCancelledRef.current &&
          (data.image_count || 0) > 0 &&
          // Don't drop local laptop files by redirecting to the
          // session-only poll view — locals would be excluded.
          batchImagesRef.current.length === 0
        ) {
          const onLaptopSyncPage = LAPTOP_SYNC_PATHS.some((p) =>
            location.pathname.startsWith(p),
          );
          if (onLaptopSyncPage) {
            navigate(`/processing?session=${encodeURIComponent(token)}`, { replace: true });
          }
        }

        if (data.status === 'completed' && data.entry_id && !onDirectProcessing) {
          if (completedHandledRef.current === data.entry_id) return;
          completedHandledRef.current = data.entry_id;
          clearBatch();
          clearSession();
          navigate(`/result/${data.entry_id}`, { replace: true });
        }
      } catch (err) {
        if (!cancelled && isSessionNotFoundError(err)) {
          clearSession();
          return;
        }
        if (!cancelled && !isSessionUnavailableError(err)) {
          console.warn('Session poll failed', err);
        }
      }
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token, enabled, location.pathname, location.search, navigate, clearBatch, clearSession]);

  const isSessionActive = Boolean(token && session?.status === 'active');
  const isSessionAnalyzing = Boolean(token && session?.status === 'analyzing');
  const hasSessionBatch = Boolean(
    token && session && ['active', 'analyzing'].includes(session.status),
  );
  const sessionImages = session?.images || [];
  const sessionCount = session?.image_count ?? sessionImages.length;

  const value = useMemo(
    () => ({
      enabled,
      token,
      session,
      sessionImages,
      sessionCount,
      isSessionActive,
      isSessionAnalyzing,
      hasSessionBatch,
      loading,
      maxImages,
      startSession,
      refreshSession,
      uploadImage,
      removeImage,
      startAnalyze,
      cancelAnalysis,
      clearSession,
      attachToken,
    }),
    [
      enabled,
      token,
      session,
      sessionImages,
      sessionCount,
      isSessionActive,
      isSessionAnalyzing,
      hasSessionBatch,
      loading,
      maxImages,
      startSession,
      refreshSession,
      uploadImage,
      removeImage,
      startAnalyze,
      cancelAnalysis,
      clearSession,
      attachToken,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext must be used within SessionProvider');
  return ctx;
}
