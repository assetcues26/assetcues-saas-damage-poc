import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import { BatchProvider } from '../context/BatchContext';
import { useBatch } from './useBatch';
import { createTestImageFile } from '../test/testUtils';

function wrapper({ children }) {
  return (
    <AppProvider>
      <BatchProvider>{children}</BatchProvider>
    </AppProvider>
  );
}

describe('useBatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function flushConfig() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
  }

  it('enforces maxImages on tryAddImage', async () => {
    const { result } = renderHook(() => useBatch(), { wrapper });
    await flushConfig();

    await act(async () => {
      for (let i = 0; i < 10; i++) {
        result.current.tryAddImage(createTestImageFile(`f${i}.jpg`));
      }
    });
    expect(result.current.batchCount).toBe(10);

    await act(async () => {
      result.current.tryAddImage(createTestImageFile('overflow.jpg'));
    });
    expect(result.current.batchCount).toBe(10);
  });

  it('accepts partial files when tryAddImages exceeds limit', async () => {
    const { result } = renderHook(() => useBatch(), { wrapper });
    await flushConfig();

    act(() => {
      result.current.tryAddImages([
        createTestImageFile('1.jpg'),
        createTestImageFile('2.jpg'),
        createTestImageFile('3.jpg'),
        createTestImageFile('4.jpg'),
        createTestImageFile('5.jpg'),
        createTestImageFile('6.jpg'),
        createTestImageFile('7.jpg'),
        createTestImageFile('8.jpg'),
        createTestImageFile('9.jpg'),
        createTestImageFile('10.jpg'),
      ]);
    });
    expect(result.current.batchCount).toBe(10);

    act(() => {
      result.current.tryAddImages([
        createTestImageFile('11.jpg'),
        createTestImageFile('12.jpg'),
      ]);
    });
    expect(result.current.batchCount).toBe(10);
  });
});
