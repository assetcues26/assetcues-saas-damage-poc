import { describe, it, expect, vi } from 'vitest';
import { isRetryableUploadError, withUploadRetries } from './uploadRetry';

describe('uploadRetry', () => {
  it('detects network and timeout errors as retryable', () => {
    expect(isRetryableUploadError(new TypeError('Failed to fetch'))).toBe(true);
    expect(
      isRetryableUploadError(new Error('Network error — check your connection and try again.')),
    ).toBe(true);
    expect(
      isRetryableUploadError(new Error('Upload timed out — try fewer photos or a stronger connection.')),
    ).toBe(true);
  });

  it('treats business rule errors as non-retryable', () => {
    expect(isRetryableUploadError(new Error('Session is analyzing; cannot add images'))).toBe(false);
    expect(isRetryableUploadError(new Error('Maximum 10 images per session'))).toBe(false);
  });

  it('retries retryable operations before throwing', async () => {
    vi.useFakeTimers();
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce('ok');

    const promise = withUploadRetries(operation, {
      maxAttempts: 3,
      delays: [100],
    });

    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
