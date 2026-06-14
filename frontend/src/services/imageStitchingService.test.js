import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stitchBatchImages } from './imageStitchingService';

describe('imageStitchingService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects when no images provided', async () => {
    await expect(stitchBatchImages([])).rejects.toThrow('No images provided');
  });

  it('returns same url for single image batch', async () => {
    const promise = stitchBatchImages([{ previewUrl: 'blob:single' }]);
    await vi.advanceTimersByTimeAsync(800);
    await expect(promise).resolves.toBe('blob:single');
  });
});
