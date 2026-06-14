import { useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBatch } from './useBatch';
import { useSession } from './useSession';

/**
 * Unified batch: local laptop uploads + optional phone session images.
 * Laptop file picks always stay in BatchContext; session is for mobile sync only.
 */
export function useMergedBatch() {
  const batch = useBatch();
  const { showToast } = useApp();
  const {
    isSessionActive,
    hasSessionBatch,
    sessionImages,
    maxImages,
    removeImage: removeSessionImage,
  } = useSession();

  const sessionBatchImages = useMemo(
    () =>
      (sessionImages || []).map((img) => ({
        id: img.id,
        previewUrl: img.preview_url,
        name: img.file_name || `Image ${img.sort_order}`,
        isRemote: true,
        sortOrder: img.sort_order,
      })),
    [sessionImages],
  );

  const batchImages = useMemo(() => {
    if (!hasSessionBatch) return batch.batchImages;
    return [...batch.batchImages, ...sessionBatchImages];
  }, [hasSessionBatch, batch.batchImages, sessionBatchImages]);

  const batchCount = batchImages.length;
  const localBatchCount = batch.batchCount;
  const sessionImageCount = sessionBatchImages.length;
  const canAddMore = batchCount < maxImages;
  const remainingSlots = Math.max(0, maxImages - batchCount);

  const hasLocalFiles = useMemo(
    () => batch.batchImages.some((img) => img.file instanceof File),
    [batch.batchImages],
  );

  const hasSessionImages = sessionImageCount > 0;

  const removeImage = useCallback(
    (id) => {
      if (sessionBatchImages.some((img) => img.id === id)) {
        return removeSessionImage(id);
      }
      batch.removeImage(id);
    },
    [sessionBatchImages, removeSessionImage, batch],
  );

  const tryAddImage = useCallback(
    async (file) => {
      if (!canAddMore) {
        showToast(`Maximum ${maxImages} images reached`, 'warning');
        return null;
      }
      return batch.tryAddImage(file);
    },
    [canAddMore, maxImages, batch, showToast],
  );

  const tryAddImages = useCallback(
    async (files) => {
      if (!canAddMore) {
        showToast(`Maximum ${maxImages} images reached`, 'warning');
        return [];
      }

      const accepted = [];
      const rejected = [];
      let slots = remainingSlots;

      files.forEach((file) => {
        if (slots > 0) {
          accepted.push(file);
          slots -= 1;
        } else {
          rejected.push(file);
        }
      });

      if (rejected.length > 0) {
        showToast(
          `${rejected.length} file${rejected.length === 1 ? '' : 's'} rejected — max ${maxImages} images`,
          'warning',
        );
      }

      if (accepted.length === 0) return [];

      return batch.addImages(accepted);
    },
    [canAddMore, remainingSlots, maxImages, batch, showToast],
  );

  return {
    batchImages,
    batchCount,
    localBatchCount,
    sessionImageCount,
    maxImages,
    canAddMore,
    remainingSlots,
    isSessionActive,
    hasLocalFiles,
    hasSessionImages,
    removeImage,
    tryAddImage,
    tryAddImages,
    clearBatch: batch.clearBatch,
    addImage: batch.addImage,
    addImages: batch.addImages,
  };
}
