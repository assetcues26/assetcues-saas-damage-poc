import { describe, expect, it } from 'vitest';
import { mergePreservingImageUrls, mergePollAssetStatuses } from './mergeAssetList';

describe('mergePreservingImageUrls', () => {
  it('keeps previous signed URL when storage path is unchanged', () => {
    const prev = [
      {
        id: '1',
        asset_image_path: 'user_1/saas_assets/1/asset.jpg',
        asset_image_url: 'https://cdn.example.com/obj/asset.jpg?token=old',
      },
    ];
    const next = [
      {
        id: '1',
        asset_image_path: 'user_1/saas_assets/1/asset.jpg',
        asset_image_url: 'https://cdn.example.com/obj/asset.jpg?token=new',
      },
    ];
    const merged = mergePreservingImageUrls(prev, next);
    expect(merged[0].asset_image_url).toBe(prev[0].asset_image_url);
    expect(merged[0].asset_image_path).toBe(next[0].asset_image_path);
  });

  it('uses new URL when image path changes', () => {
    const prev = [
      {
        id: '1',
        asset_image_path: 'user_1/saas_assets/1/asset.jpg',
        asset_image_url: 'https://cdn.example.com/obj/asset.jpg?token=old',
      },
    ];
    const next = [
      {
        id: '1',
        asset_image_path: 'user_1/saas_assets/1/asset_v2.jpg',
        asset_image_url: 'https://cdn.example.com/obj/asset_v2.jpg?token=new',
      },
    ];
    const merged = mergePreservingImageUrls(prev, next);
    expect(merged[0].asset_image_url).toBe(next[0].asset_image_url);
  });

  it('masks stale analyzing rows except the active asset', () => {
    const prev = [
      { id: '1', ai_status: 'fail' },
      { id: '2', ai_status: 'pass' },
    ];
    const next = [
      { id: '1', ai_status: 'analyzing' },
      { id: '2', ai_status: 'analyzing' },
    ];
    const merged = mergePollAssetStatuses(next, prev, '2');
    expect(merged[0].ai_status).toBe('fail');
    expect(merged[1].ai_status).toBe('analyzing');
  });
});
