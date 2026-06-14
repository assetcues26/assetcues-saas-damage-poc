import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  completeAssetCreateSession,
  fetchAssetCreateSession,
  saveAssetCreateSessionDraft,
  uploadAssetCreateSessionImage,
} from '../services/saasAssetsApi';
import { persistMobileCreateSuccess } from '../utils/mobileCreateSuccess';
import { isAiAnalysisEnabled } from '../utils/saasAiSettings';
import { enqueueAssetAnalysis } from '../utils/analysisQueue';

const POLL_MS = 2000;

/**
 * @param {string | undefined} token
 */
export function useAssetCreateSession(token) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(null);

  const expiresAt = session?.expires_at ?? null;
  const pollStopped = session?.status === 'completed' || session?.status === 'expired';
  const pollRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const detail = await fetchAssetCreateSession(token);
      setSession(detail);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Session unavailable';
      setError(message);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    refresh();
    if (pollStopped) return undefined;

    pollRef.current = setInterval(refresh, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refresh, token, pollStopped]);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsRemaining(null);
      return undefined;
    }
    const tick = () => {
      const end = new Date(expiresAt).getTime();
      setSecondsRemaining(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const saveDraft = useCallback(
    async (draftJson) => {
      if (!token) return null;
      const detail = await saveAssetCreateSessionDraft(token, draftJson);
      setSession(detail);
      setError(null);
      return detail;
    },
    [token],
  );

  const uploadImage = useCallback(
    async (fieldName, file) => {
      if (!token || !file) return;
      setUploading(true);
      try {
        const detail = await uploadAssetCreateSessionImage(token, fieldName, file);
        setSession(detail);
        setError(null);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [token],
  );

  const complete = useCallback(
    async (metadata) => {
      if (!token) return null;
      const aiEnabled = isAiAnalysisEnabled();
      const result = await completeAssetCreateSession(token, metadata, {
        autoAnalyze: false,
        skipAi: !aiEnabled,
      });
      if (aiEnabled && result.ai_status === 'pending') {
        enqueueAssetAnalysis(result.asset_id).catch(() => {});
      }
      const success = {
        aiStatus: result.ai_status,
        assetId: result.asset_id,
        assetTag: result.assetid,
        assetName: session?.draft_json?.assetname || metadata?.assetname || '',
      };
      persistMobileCreateSuccess(token, success);
      navigate(`/assets/create/mobile/${token}/done`, {
        replace: true,
        state: success,
      });
      return result;
    },
    [token, navigate, session?.draft_json?.assetname],
  );

  const canUse = useMemo(
    () => Boolean(session && session.status !== 'completed' && session.status !== 'expired'),
    [session],
  );

  return {
    session,
    loading,
    error,
    uploading,
    canUse,
    expiresAt,
    secondsRemaining,
    refresh,
    saveDraft,
    uploadImage,
    complete,
  };
}
