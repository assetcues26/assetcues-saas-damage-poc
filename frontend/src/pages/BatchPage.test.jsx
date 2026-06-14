import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchPage } from './BatchPage';
import { renderWithProviders } from '../test/testUtils';

const mockNavigate = vi.fn();
const mockStartAnalyze = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUploadImage = vi.fn();
const mockClearBatch = vi.fn();

vi.mock('../hooks/useMergedBatch', () => ({
  useMergedBatch: () => ({
    batchImages: [{ id: '1', previewUrl: 'https://example.com/a.jpg', name: 'a.jpg' }],
    batchCount: 1,
    removeImage: vi.fn(),
    maxImages: 10,
    hasLocalFiles: false,
    hasSessionImages: true,
    clearBatch: mockClearBatch,
  }),
}));

vi.mock('../hooks/useSession', () => ({
  useSession: () => ({
    isSessionActive: true,
    isSessionAnalyzing: false,
    token: 'session-token-abcdefghijklmnopqrstuvwxyz',
    startAnalyze: mockStartAnalyze,
    uploadImage: mockUploadImage,
    cancelAnalysis: vi.fn(),
  }),
}));

describe('BatchPage proceed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('always uses the fast direct processing path', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BatchPage />, { route: '/batch' });

    await user.click(screen.getByRole('button', { name: /Proceed to Analysis/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/processing');
    expect(mockStartAnalyze).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.stringContaining('/processing?session='),
    );
  });
});
