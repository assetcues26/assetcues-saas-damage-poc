import { useBatchContext } from '../context/BatchContext';
import { useApp } from '../context/AppContext';

export function useBatch() {
  const batch = useBatchContext();
  const { maxImages, showToast } = useApp();

  const canAddMore = batch.batchCount < maxImages;
  const remainingSlots = Math.max(0, maxImages - batch.batchCount);

  const tryAddImage = (file) => {
    if (!canAddMore) {
      showToast(`Maximum ${maxImages} images reached`, 'warning');
      return null;
    }
    return batch.addImage(file);
  };

  const tryAddImages = (files) => {
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

    if (accepted.length > 0) {
      return batch.addImages(accepted);
    }
    return [];
  };

  return {
    ...batch,
    maxImages,
    canAddMore,
    remainingSlots,
    tryAddImage,
    tryAddImages,
  };
}
