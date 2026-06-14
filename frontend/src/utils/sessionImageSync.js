import { stableStorageImageKey } from './stableImageKey';

/**
 * Detect newly arrived session images using stable storage paths (not signed URLs).
 * @param {object | null | undefined} session
 * @param {{ asset?: string | null, barcode?: string | null }} seen
 */
export function detectNewSessionImages(session, seen) {
  const assetKey = stableStorageImageKey(
    session?.asset_image_path || session?.asset_image_url,
  );
  const barcodeKey = stableStorageImageKey(
    session?.barcode_image_path || session?.barcode_image_url,
  );

  const newAsset = Boolean(assetKey && assetKey !== seen.asset);
  const newBarcode = Boolean(barcodeKey && barcodeKey !== seen.barcode);

  return { newAsset, newBarcode, assetKey, barcodeKey };
}
