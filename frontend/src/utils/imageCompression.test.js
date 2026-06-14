import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MOBILE_MAX_FILE_BYTES,
  UPLOAD_MAX_TOTAL_MB,
  prepareImagesForUpload,
  sumSessionImageBytes,
} from './imageCompression';

vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file, options) => {
    const scale = options.maxSizeMB || 0.4;
    const size = Math.min(file.size, Math.floor(scale * 1024 * 1024));
    return new Blob([new Uint8Array(size)], { type: file.type || 'image/jpeg' });
  }),
}));

describe('imageCompression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects empty file list', async () => {
    await expect(prepareImagesForUpload([])).rejects.toThrow(/No images provided/);
  });

  it('rejects more than max images', async () => {
    const files = Array.from({ length: 11 }, (_, i) =>
      new File([new Uint8Array(1000)], `img-${i}.jpg`, { type: 'image/jpeg' }),
    );
    await expect(prepareImagesForUpload(files)).rejects.toThrow(/Maximum 10 images/);
  });

  it('compresses files within total budget', async () => {
    const files = [
      new File([new Uint8Array(8 * 1024 * 1024)], 'a.jpg', { type: 'image/jpeg' }),
      new File([new Uint8Array(8 * 1024 * 1024)], 'b.jpg', { type: 'image/jpeg' }),
    ];
    const prepared = await prepareImagesForUpload(files);
    expect(prepared).toHaveLength(2);
    const total = prepared.reduce((sum, f) => sum + f.size, 0);
    expect(total).toBeLessThanOrEqual(UPLOAD_MAX_TOTAL_MB * 1024 * 1024);
  });

  it('rejects when existing session bytes exhaust the budget', async () => {
    const files = [
      new File([new Uint8Array(1000)], 'a.jpg', { type: 'image/jpeg' }),
    ];
    const existingBytes = 15 * 1024 * 1024;
    await expect(
      prepareImagesForUpload(files, { existingBytes }),
    ).rejects.toThrow(/15 MB/);
  });

  it('compresses mobile uploads to 500KB per file', async () => {
    const files = [
      new File([new Uint8Array(4 * 1024 * 1024)], 'phone.jpg', { type: 'image/jpeg' }),
    ];
    const prepared = await prepareImagesForUpload(files, { mobile: true });
    expect(prepared).toHaveLength(1);
    expect(prepared[0].size).toBeLessThanOrEqual(MOBILE_MAX_FILE_BYTES);
  });

  it('sums session image byte sizes', () => {
    expect(
      sumSessionImageBytes([
        { byte_size: 1000 },
        { byte_size: 2000 },
        { byte_size: null },
      ]),
    ).toBe(3000);
  });
});
