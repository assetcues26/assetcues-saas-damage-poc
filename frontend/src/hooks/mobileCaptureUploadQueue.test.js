import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  enqueueMobileCapture,
  getMobileCaptureQueueSnapshot,
  retryFailedUploads,
  runMobileCaptureQueue,
} from './mobileCaptureUploadQueue';

vi.mock('../services/sessionApi', () => ({
  uploadSessionImagesPrepared: vi.fn(),
}));

vi.mock('../utils/uploadRetry', async () => {
  const actual = await vi.importActual('../utils/uploadRetry');
  return {
    ...actual,
    withUploadRetries: vi.fn((operation) => operation()),
  };
});

import { uploadSessionImagesPrepared } from '../services/sessionApi';

describe('mobileCaptureUploadQueue', () => {
  const refresh = vi.fn(async () => null);
  const showToast = vi.fn();
  const handlers = {
    getSessionImages: () => [],
    refresh,
    showToast,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    uploadSessionImagesPrepared.mockImplementation(async () => ({
      status: 'active',
      image_count: 1,
      images: [{ byte_size: 1000 }],
    }));
  });

  it('keeps processing after handlers are reattached', async () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });

    enqueueMobileCapture('token-a', file, handlers);
    await runMobileCaptureQueue('token-a', handlers);

    expect(uploadSessionImagesPrepared).toHaveBeenCalledTimes(1);
    expect(getMobileCaptureQueueSnapshot('token-a').pendingCount).toBe(0);
    expect(refresh).toHaveBeenCalled();
  });

  it('stores retryable failures instead of dropping photos', async () => {
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' });
    const networkError = new TypeError('Failed to fetch');
    networkError.message = 'Network error — check your connection and try again.';

    uploadSessionImagesPrepared.mockRejectedValueOnce(networkError);

    enqueueMobileCapture('token-retry', file, handlers);
    await runMobileCaptureQueue('token-retry', handlers);

    const snapshot = getMobileCaptureQueueSnapshot('token-retry');
    expect(snapshot.failedCount).toBe(1);
    expect(snapshot.pendingCount).toBe(0);
    expect(showToast).not.toHaveBeenCalled();
  });

  it('retryFailedUploads re-queues failed photos', async () => {
    const file = new File(['x'], 'c.jpg', { type: 'image/jpeg' });
    const networkError = new TypeError('Failed to fetch');

    uploadSessionImagesPrepared
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({
        status: 'active',
        image_count: 1,
        images: [{ byte_size: 1000 }],
      });

    enqueueMobileCapture('token-manual', file, handlers);
    await runMobileCaptureQueue('token-manual', handlers);
    expect(getMobileCaptureQueueSnapshot('token-manual').failedCount).toBe(1);

    retryFailedUploads('token-manual', handlers);
    await runMobileCaptureQueue('token-manual', handlers);

    expect(getMobileCaptureQueueSnapshot('token-manual').failedCount).toBe(0);
    expect(uploadSessionImagesPrepared).toHaveBeenCalledTimes(2);
  });

  it('shows toast for non-retryable upload errors', async () => {
    const file = new File(['x'], 'd.jpg', { type: 'image/jpeg' });
    uploadSessionImagesPrepared.mockRejectedValueOnce(new Error('Session is analyzing; cannot add images'));

    enqueueMobileCapture('token-hard', file, handlers);
    await runMobileCaptureQueue('token-hard', handlers);

    expect(getMobileCaptureQueueSnapshot('token-hard').failedCount).toBe(0);
    expect(showToast).toHaveBeenCalledWith('Session is analyzing; cannot add images', 'error');
  });
});
