import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeImages } from './analysisService';
import { UPLOAD_PROCESSING_MODES } from '../constants/uploadMode';
import { ASSET_ANALYSIS_ENDPOINTS } from '../config/api';

vi.mock('./assetAnalysisApi', () => ({
  analyzeAssetsOnServer: vi.fn(),
  resolveAnalysisEndpoint: vi.fn((mode) =>
    mode === UPLOAD_PROCESSING_MODES.DIRECT
      ? ASSET_ANALYSIS_ENDPOINTS.multi
      : ASSET_ANALYSIS_ENDPOINTS.collage,
  ),
}));

import { analyzeAssetsOnServer } from './assetAnalysisApi';

describe('analysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let forkCounter = 0;
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['img'], { type: 'image/jpeg' }),
    });
    vi.spyOn(URL, 'createObjectURL').mockImplementation(
      () => `blob:fork-${++forkCounter}`,
    );
  });

  it('rejects when no images provided', async () => {
    await expect(analyzeImages([])).rejects.toThrow('No images provided');
  });

  it('rejects when image file is missing', async () => {
    await expect(
      analyzeImages([{ id: '1', previewUrl: 'blob:test' }]),
    ).rejects.toThrow(/missing file data/i);
  });

  it('defaults to multi-image endpoint when processingMode omitted', async () => {
    analyzeAssetsOnServer.mockResolvedValue({
      status: 'success',
      request_id: 'req-default',
      analysis_method: 'multi_image',
      images_base64: ['u1'],
      asset: { name: 'Unit' },
      condition: { grade: 'Good' },
      identifiers: { asset_tag_number_raw: 'T', tag_readable: true },
      confidence: { overall: 0.9 },
    });

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const result = await analyzeImages([
      { id: '1', file, previewUrl: 'blob:test', name: 'a.jpg' },
    ]);

    expect(result.apiRoute).toBe(ASSET_ANALYSIS_ENDPOINTS.multi);
  });

  it('calls collage endpoint and uses API base64 images', async () => {
    analyzeAssetsOnServer.mockResolvedValue({
      status: 'success',
      request_id: 'req-1',
      processing_time_ms: 1000,
      analysis_method: 'collage',
      collage_base64: 'collage-b64',
      images_base64: ['orig-b64'],
      asset: { name: 'HVAC Unit', description: 'White unit.' },
      condition: { grade: 'Good', summary: 'OK' },
      identifiers: {
        asset_tag_number_raw: 'TAG-1',
        tag_readable: true,
        visible_labels: [],
      },
      confidence: { overall: 0.9 },
    });

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const result = await analyzeImages(
      [{ id: '1', file, previewUrl: 'blob:test', name: 'a.jpg' }],
      { processingMode: UPLOAD_PROCESSING_MODES.COLLAGE },
    );

    expect(result.apiRoute).toBe(ASSET_ANALYSIS_ENDPOINTS.collage);
    expect(result.mergedImageUrl).toContain('collage-b64');
    expect(result.previewUrls[0]).toContain('orig-b64');
  });

  it('falls back to local blob copies when API omits upload base64', async () => {
    analyzeAssetsOnServer.mockResolvedValue({
      status: 'success',
      request_id: 'req-1b',
      analysis_method: 'collage',
      collage_base64: 'c',
      asset: { name: 'Unit' },
      condition: { grade: 'Good' },
      identifiers: { asset_tag_number_raw: 'T', tag_readable: true },
      confidence: { overall: 0.9 },
    });

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const result = await analyzeImages(
      [{ id: '1', file, previewUrl: 'blob:test', name: 'a.jpg' }],
      { processingMode: UPLOAD_PROCESSING_MODES.COLLAGE },
    );

    expect(result.previewUrls[0]).toMatch(/^blob:fork-/);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('calls multi endpoint and shows all API upload images', async () => {
    analyzeAssetsOnServer.mockResolvedValue({
      status: 'success',
      request_id: 'req-2',
      processing_time_ms: 2000,
      analysis_method: 'multi_image',
      collage_base64: null,
      images_base64: ['u1', 'u2'],
      asset: { name: 'AC Unit' },
      condition: { grade: 'Good' },
      identifiers: { asset_tag_number_raw: 'TAG-2', tag_readable: true },
      confidence: { overall: 0.95 },
    });

    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' });
    const result = await analyzeImages(
      [
        { id: '1', file, previewUrl: 'blob:a', name: 'a.jpg' },
        { id: '2', file, previewUrl: 'blob:b', name: 'b.jpg' },
      ],
      { processingMode: UPLOAD_PROCESSING_MODES.DIRECT },
    );

    expect(result.apiRoute).toBe(ASSET_ANALYSIS_ENDPOINTS.multi);
    expect(result.previewUrls).toHaveLength(2);
    expect(result.previewUrls[0]).toContain('u1');
    expect(result.mergedImageUrl).toBeNull();
  });
});
