import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadSessionImagesPrepared } from './sessionApi';

vi.mock('../utils/imageCompression', () => ({
  prepareImagesForUpload: vi.fn(async (files) => files),
  sumSessionImageBytes: vi.fn(() => 0),
}));

import { prepareImagesForUpload } from '../utils/imageCompression';

describe('sessionApi uploadSessionImagesPrepared', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        session_token: 'test-token',
        status: 'active',
        image_count: 1,
        images: [],
      }),
    });
  });

  it('compresses before uploading to session endpoint', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    await uploadSessionImagesPrepared('test-token-abcdefghijklmnopqrstuvwxyz', file, 'mobile', {
      sessionImages: [],
    });

    expect(prepareImagesForUpload).toHaveBeenCalledWith([file], {
      existingBytes: 0,
      mobile: true,
      fast: true,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/sessions/'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
