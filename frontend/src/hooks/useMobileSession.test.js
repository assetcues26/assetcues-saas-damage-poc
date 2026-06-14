import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobileSession } from './useMobileSession';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/scan/tok/done' }),
}));

vi.mock('../services/sessionApi', () => ({
  analyzeCaptureSession: vi.fn(),
  cancelCaptureSessionAnalysis: vi.fn(),
  fetchCaptureSession: vi.fn(),
  isSessionUnavailableError: vi.fn(() => false),
}));

import { analyzeCaptureSession, fetchCaptureSession } from '../services/sessionApi';

describe('useMobileSession startAnalyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCaptureSession.mockResolvedValue({
      status: 'active',
      image_count: 2,
      market_region: 'US',
    });
    analyzeCaptureSession.mockResolvedValue({ status: 'analyzing' });
  });

  it('uses market_region from session instead of phone localStorage default', async () => {
    const { result } = renderHook(() => useMobileSession('tok'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.startAnalyze();
    });

    expect(analyzeCaptureSession).toHaveBeenCalledWith('tok', { marketRegion: 'US' });
  });
});
