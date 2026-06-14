import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMobileCaptureUpload } from './useMobileCaptureUpload';

vi.mock('../services/sessionApi', () => ({
  uploadSessionImagesPrepared: vi.fn(),
}));

import { uploadSessionImagesPrepared } from '../services/sessionApi';

describe('useMobileCaptureUpload', () => {
  const refresh = vi.fn(async () => null);
  const showToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    uploadSessionImagesPrepared.mockImplementation(async () => ({
      status: 'active',
      image_count: 1,
      images: [{ byte_size: 1000 }],
    }));
  });

  it('uploads captures in the background without blocking the next capture slot', async () => {
    const { result } = renderHook(() =>
      useMobileCaptureUpload({
        token: 'test-token',
        session: { images: [] },
        refresh,
        imageCount: 0,
        maxImages: 10,
        canAdd: true,
        showToast,
      }),
    );

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.enqueueCapture(file);
    });

    await waitFor(() => {
      expect(uploadSessionImagesPrepared).toHaveBeenCalledTimes(1);
    });

    expect(uploadSessionImagesPrepared).toHaveBeenCalledWith('test-token', file, 'mobile', {
      sessionImages: [],
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('rejects enqueue when batch is full', () => {
    const { result } = renderHook(() =>
      useMobileCaptureUpload({
        token: 'test-token',
        session: { images: [] },
        refresh,
        imageCount: 10,
        maxImages: 10,
        canAdd: true,
        showToast,
      }),
    );

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    let added = false;

    act(() => {
      added = result.current.enqueueCapture(file);
    });

    expect(added).toBe(false);
    expect(uploadSessionImagesPrepared).not.toHaveBeenCalled();
  });
});
