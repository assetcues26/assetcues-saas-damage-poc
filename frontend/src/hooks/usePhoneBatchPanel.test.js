import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhoneBatchPanel } from './usePhoneBatchPanel';

describe('usePhoneBatchPanel', () => {
  it('auto-opens when session image count increases', () => {
    const { result, rerender } = renderHook(
      ({ count }) => usePhoneBatchPanel(count),
      { initialProps: { count: 0 } },
    );

    expect(result.current.open).toBe(false);

    rerender({ count: 1 });
    expect(result.current.open).toBe(true);

    act(() => result.current.closePanel());
    expect(result.current.open).toBe(false);

    rerender({ count: 2 });
    expect(result.current.open).toBe(true);
  });
});
