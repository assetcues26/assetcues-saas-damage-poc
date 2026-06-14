import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MobilePreviewPage } from './MobilePreviewPage';
import { AppProvider } from '../../context/AppContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/sessionApi', () => ({
  fetchCaptureSession: vi.fn(async () => ({
    session_token: 'tok',
    status: 'active',
    images: [],
  })),
  uploadSessionImagesPrepared: vi.fn(),
}));

import { uploadSessionImagesPrepared } from '../../services/sessionApi';

function renderPreview() {
  const file = new File(['x'], 'shot.jpg', { type: 'image/jpeg' });
  const previewUrl = 'blob:preview';
  return render(
    <AppProvider>
      <MemoryRouter
        initialEntries={[
          { pathname: '/scan/tok/preview', state: { file, previewUrl } },
        ]}
      >
        <Routes>
          <Route path="/scan/:token/preview" element={<MobilePreviewPage />} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

describe('MobilePreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.revokeObjectURL = vi.fn();
  });

  it('shows error and stays on page when upload fails', async () => {
    uploadSessionImagesPrepared.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    renderPreview();

    await user.click(screen.getByRole('button', { name: /Add to batch/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/scan/tok/done');
  });

  it('navigates to done on successful upload', async () => {
    uploadSessionImagesPrepared.mockResolvedValueOnce({ status: 'active' });
    const user = userEvent.setup();
    renderPreview();

    await user.click(screen.getByRole('button', { name: /Add to batch/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/scan/tok/done');
    });
  });
});
