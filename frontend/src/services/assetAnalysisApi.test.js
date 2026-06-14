import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeAssetsOnServer, resolveAnalysisEndpoint } from './assetAnalysisApi';
import { UPLOAD_PROCESSING_MODES } from '../constants/uploadMode';
import { ASSET_ANALYSIS_ENDPOINTS } from '../config/api';

describe('assetAnalysisApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves collage and multi endpoints from settings mode', () => {
    expect(resolveAnalysisEndpoint(UPLOAD_PROCESSING_MODES.COLLAGE)).toBe(
      ASSET_ANALYSIS_ENDPOINTS.collage,
    );
    expect(resolveAnalysisEndpoint(UPLOAD_PROCESSING_MODES.DIRECT)).toBe(
      ASSET_ANALYSIS_ENDPOINTS.multi,
    );
  });

  it('posts multipart form with images and locale', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        status: 'success',
        request_id: 'req-1',
        asset: { name: 'Test' },
        condition: { grade: 'Good' },
        identifiers: {},
      }),
    });

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    await analyzeAssetsOnServer(
      [{ file, name: 'photo.jpg' }],
      UPLOAD_PROCESSING_MODES.COLLAGE,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ASSET_ANALYSIS_ENDPOINTS.collage);
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get('locale')).toBe('en-IN');
    expect(init.body.get('market_region')).toBe('IN');
    expect(init.body.getAll('images')).toHaveLength(1);
  });

  it('throws when response is not ok', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Server error' }),
    });

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    await expect(
      analyzeAssetsOnServer([{ file }], UPLOAD_PROCESSING_MODES.DIRECT),
    ).rejects.toThrow('Server error');
  });
});
