import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';
import { UPLOAD_PROCESSING_MODES } from '../constants/uploadMode';

function wrapper({ children }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('AppContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws when useApp is used outside provider', () => {
    expect(() => renderHook(() => useApp())).toThrow(/AppProvider/);
  });

  it('loads maxImages config on mount', async () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.configLoading).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(result.current.configLoading).toBe(false);
    expect(result.current.maxImages).toBe(10);
  });

  it('manages toasts', async () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      result.current.showToast('Test message', 'success');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    act(() => {
      result.current.dismissToast(result.current.toasts[0].id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('updates upload processing mode in memory', async () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      result.current.setUploadProcessingMode(UPLOAD_PROCESSING_MODES.COLLAGE);
    });
    expect(result.current.uploadProcessingMode).toBe(UPLOAD_PROCESSING_MODES.COLLAGE);
  });

  it('stores preview and result state', async () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const preview = { file: new File(['x'], 'a.jpg'), previewUrl: 'blob:x' };
    act(() => {
      result.current.setPreviewImage(preview);
      result.current.setLastResult({ id: 'r1', asset_name: 'Test' });
    });
    expect(result.current.previewImage).toEqual(preview);
    expect(result.current.lastResult.asset_name).toBe('Test');
  });
});
