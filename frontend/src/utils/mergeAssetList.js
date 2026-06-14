import { stableStorageImageKey } from './stableImageKey';

/**
 * Keep existing signed URLs when the underlying storage object is unchanged.
 * Stops dashboard polls from invalidating <img src> and re-downloading thumbnails.
 *
 * @param {Array<Record<string, unknown>>} prevItems
 * @param {Array<Record<string, unknown>>} nextItems
 */
export function mergePreservingImageUrls(prevItems, nextItems) {
  if (!prevItems?.length) return nextItems;

  const prevById = new Map(prevItems.map((item) => [item.id, item]));

  return nextItems.map((next) => {
    const prev = prevById.get(next.id);
    if (!prev) return next;

    const nextAssetKey = stableStorageImageKey(next.asset_image_path || next.asset_image_url);
    const prevAssetKey = stableStorageImageKey(prev.asset_image_path || prev.asset_image_url);
    const nextBarcodeKey = stableStorageImageKey(next.barcode_image_path || next.barcode_image_url);
    const prevBarcodeKey = stableStorageImageKey(prev.barcode_image_path || prev.barcode_image_url);

    return {
      ...next,
      asset_image_url:
        nextAssetKey && nextAssetKey === prevAssetKey && prev.asset_image_url
          ? prev.asset_image_url
          : next.asset_image_url,
      barcode_image_url:
        nextBarcodeKey && nextBarcodeKey === prevBarcodeKey && prev.barcode_image_url
          ? prev.barcode_image_url
          : next.barcode_image_url,
    };
  });
}

/**
 * During bulk analysis only the active asset should show "analyzing".
 * Other rows may still be stuck server-side from aborted runs — keep prior UI status.
 *
 * @param {Array<Record<string, unknown>>} items
 * @param {Array<Record<string, unknown>>} prevItems
 * @param {string | null} currentAnalyzingId
 */
export function mergePollAssetStatuses(items, prevItems, currentAnalyzingId) {
  if (!currentAnalyzingId || !prevItems?.length) return items;

  const prevById = new Map(prevItems.map((item) => [item.id, item]));

  return items.map((item) => {
    if (item.ai_status !== 'analyzing' || item.id === currentAnalyzingId) {
      return item;
    }
    const prev = prevById.get(item.id);
    if (!prev || prev.ai_status === 'analyzing') {
      return item;
    }
    return { ...item, ai_status: prev.ai_status };
  });
}
