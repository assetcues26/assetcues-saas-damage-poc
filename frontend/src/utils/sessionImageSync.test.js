import { describe, expect, it } from 'vitest';
import { detectNewSessionImages } from './sessionImageSync';
import { stableStorageImageKey } from './stableImageKey';

describe('stableStorageImageKey', () => {
  it('uses pathname for signed URLs so token rotation does not look like a new image', () => {
    const path =
      '/storage/v1/object/sign/saas-asset-images/user_100/saas_sessions/tok/asset_a1b2.jpg';
    const a = `https://example.supabase.co${path}?token=aaa`;
    const b = `https://example.supabase.co${path}?token=bbb`;
    expect(stableStorageImageKey(a)).toBe(path);
    expect(stableStorageImageKey(a)).toBe(stableStorageImageKey(b));
  });

  it('returns storage path as-is when not a URL', () => {
    expect(stableStorageImageKey('user_100/saas_sessions/tok/asset.jpg')).toBe(
      'user_100/saas_sessions/tok/asset.jpg',
    );
  });
});

describe('detectNewSessionImages', () => {
  it('fires only once per stable asset and barcode path', () => {
    const seen = { asset: null, barcode: null };
    const session = {
      asset_image_path: 'user_100/saas_sessions/tok/asset.jpg',
      asset_image_url: 'https://x.test/a.jpg?token=1',
      barcode_image_path: 'user_100/saas_sessions/tok/barcode.jpg',
      barcode_image_url: 'https://x.test/b.jpg?token=1',
    };

    const first = detectNewSessionImages(session, seen);
    expect(first.newAsset).toBe(true);
    expect(first.newBarcode).toBe(true);
    seen.asset = first.assetKey;
    seen.barcode = first.barcodeKey;

    const refreshed = {
      ...session,
      asset_image_url: 'https://x.test/a.jpg?token=2',
      barcode_image_url: 'https://x.test/b.jpg?token=2',
    };
    const second = detectNewSessionImages(refreshed, seen);
    expect(second.newAsset).toBe(false);
    expect(second.newBarcode).toBe(false);
  });
});
