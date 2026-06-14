import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  enqueueMobileCapture,
  getMobileCaptureQueueSnapshot,
  retryFailedUploads,
  runMobileCaptureQueue,
  seedMobileCaptureConfirmedCount,
  subscribeMobileCaptureQueue,
} from './mobileCaptureUploadQueue';

/**
 * Queue camera captures for compress + session upload. The queue survives navigation
 * so uploads keep syncing after the user taps Done.
 * @param {{
 *   token?: string,
 *   session?: { images?: Array<{ byte_size?: number | null }> } | null,
 *   refresh?: () => Promise<unknown>,
 *   imageCount?: number,
 *   maxImages?: number,
 *   canAdd?: boolean,
 *   showToast?: (message: string, type?: string) => void,
 * }} options
 */
export function useMobileCaptureUpload({
  token,
  session,
  refresh,
  imageCount = 0,
  maxImages = 10,
  canAdd = false,
  showToast,
}) {
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const handlersRef = useRef({ refresh, showToast });
  handlersRef.current = { refresh, showToast };

  const subscribe = useCallback(
    (listener) => (token ? subscribeMobileCaptureQueue(token, listener) : () => {}),
    [token],
  );

  const emptySnapshotRef = useRef({
    queueLength: 0,
    uploading: false,
    pendingCount: 0,
    failedCount: 0,
    confirmedCount: 0,
  });

  const getSnapshot = useCallback(
    () => (token ? getMobileCaptureQueueSnapshot(token) : emptySnapshotRef.current),
    [token],
  );

  const queueSnapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const getHandlers = useCallback(
    () => ({
      getSessionImages: () => sessionRef.current?.images,
      refresh: handlersRef.current.refresh,
      showToast: handlersRef.current.showToast,
    }),
    [],
  );

  useEffect(() => {
    if (!token) return;
    seedMobileCaptureConfirmedCount(token, imageCount);
  }, [token, imageCount]);

  useEffect(() => {
    if (!token) return;
    runMobileCaptureQueue(token, getHandlers());
  }, [token, getHandlers]);

  const displayImageCount = Math.max(imageCount, queueSnapshot.confirmedCount);
  const pendingCount = queueSnapshot.pendingCount;
  const failedCount = queueSnapshot.failedCount;
  const reservedCount = pendingCount + failedCount;
  const canCaptureMore = Boolean(
    token && canAdd && displayImageCount + reservedCount < maxImages,
  );

  const enqueueCapture = useCallback(
    (file) => {
      if (!file || !token || !canCaptureMore) return false;
      enqueueMobileCapture(token, file, getHandlers());
      return true;
    },
    [token, canCaptureMore, getHandlers],
  );

  const retryFailed = useCallback(() => {
    if (!token || queueSnapshot.uploading) return;
    retryFailedUploads(token, getHandlers());
  }, [token, queueSnapshot.uploading, getHandlers]);

  return {
    enqueueCapture,
    retryFailed,
    queueLength: queueSnapshot.queueLength,
    uploading: queueSnapshot.uploading,
    pendingCount,
    failedCount,
    displayImageCount,
    canCaptureMore,
    isSyncing: pendingCount > 0,
    hasSyncFailures: failedCount > 0,
  };
}
