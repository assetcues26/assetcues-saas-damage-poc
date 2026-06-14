import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  completeAssetCreateSession,
  fetchAssetCreateSession,
  uploadAssetCreateSessionImage,
} from '../services/saasAssetsApi';

const POLL_MS = 1000;

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
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

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
      const result = await completeAssetCreateSession(token, metadata);
      navigate(`/assets/create/mobile/${token}/done`);
      return result;
    },
    [token, navigate],
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
    uploadImage,
    complete,
  };
}
