import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BatchProvider, useBatchContext } from './BatchContext';
import { createTestImageFile } from '../test/testUtils';

function wrapper({ children }) {
  return <BatchProvider>{children}</BatchProvider>;
}

describe('BatchContext', () => {
  it('throws outside provider', () => {
    expect(() => renderHook(() => useBatchContext())).toThrow(/BatchProvider/);
  });

  it('adds, lists, and removes images', () => {
    const { result } = renderHook(() => useBatchContext(), { wrapper });
    const file = createTestImageFile();

    act(() => {
      result.current.addImage(file);
    });
    expect(result.current.batchCount).toBe(1);
    expect(result.current.batchImages[0].name).toBe('test-asset.jpg');

    const id = result.current.batchImages[0].id;
    act(() => {
      result.current.removeImage(id);
    });
    expect(result.current.batchCount).toBe(0);
  });

  it('adds multiple images at once', () => {
    const { result } = renderHook(() => useBatchContext(), { wrapper });
    act(() => {
      result.current.addImages([
        createTestImageFile('a.jpg'),
        createTestImageFile('b.jpg'),
      ]);
    });
    expect(result.current.batchCount).toBe(2);
  });

  it('clears batch and revokes URLs', () => {
    const { result } = renderHook(() => useBatchContext(), { wrapper });
    act(() => {
      result.current.addImage(createTestImageFile());
      result.current.clearBatch();
    });
    expect(result.current.batchCount).toBe(0);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
