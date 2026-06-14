import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAppAt, createTestImageFile, SEED_HISTORY, seedLocalHistory } from '../test/testUtils';
import * as analysisService from '../services/analysisService';

vi.mock('../config/features', () => ({
  V6_DEMO_ENABLED: false,
  CAPTURE_SESSION_ENABLED: true,
  SAAS_MODULE_ENABLED: false,
}));

vi.mock('../services/analysisService', () => ({
  analyzeImages: vi.fn(),
}));

const ROUTES = [
  { path: '/', heading: /AI-Powered Asset Intelligence/i, name: 'Landing' },
  { path: '/capture', bannerLabel: 'Capture', name: 'Capture' },
  { path: '/upload', heading: /Upload Images/i, name: 'Upload' },
  { path: '/asset/hist-carrier-route-test', text: 'Carrier Split AC Unit', name: 'Asset Detail', seedHistory: true },
];

describe('AppRouter — route endpoints', () => {
  beforeEach(() => {
    analysisService.analyzeImages.mockReset();
  });

  it.each(ROUTES)('GET $path renders $name page', async ({ path, heading, text, bannerLabel, seedHistory }) => {
    if (seedHistory) {
      seedLocalHistory([{ ...SEED_HISTORY[0], id: 'hist-carrier-route-test' }]);
    }
    renderAppAt(path);
    await waitFor(() => {
      if (text) {
        expect(screen.getAllByText(text).length).toBeGreaterThan(0);
      } else if (bannerLabel) {
        expect(screen.getByRole('banner', { name: bannerLabel })).toBeInTheDocument();
      } else {
        expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
      }
    });
  });

  it('renders aurora background on landing and history pages', async () => {
    const landing = renderAppAt('/');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
    });
    expect(landing.container.querySelector('.aurora-backdrop-layer')).toBeTruthy();

    const history = renderAppAt('/history');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Asset History/i })).toBeInTheDocument();
    });
    expect(history.container.querySelector('.aurora-backdrop-layer')).toBeTruthy();
  });

  it('GET /history renders empty asset history page', async () => {
    renderAppAt('/history');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Asset History/i })).toBeInTheDocument();
      expect(screen.getByText(/No assets scanned yet/i)).toBeInTheDocument();
    });
  });

  it('GET /history shows saved scans when present', async () => {
    seedLocalHistory([{ ...SEED_HISTORY[0], id: 'hist-route-test-1' }]);
    renderAppAt('/history');
    await waitFor(() => {
      expect(screen.getByText('Carrier Split AC Unit')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /View details/i }).length).toBeGreaterThan(0);
    });
  });

  it('GET /batch redirects to / when batch is empty', async () => {
    renderAppAt('/batch');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
    });
  });

  it('GET /processing redirects to / when batch is empty', async () => {
    renderAppAt('/processing');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
    });
  });

  it('GET /unknown redirects to landing', async () => {
    renderAppAt('/does-not-exist');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
    });
  });

  it('GET /asset/:invalid shows not found', async () => {
    renderAppAt('/asset/invalid-id-xyz');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Asset Not Found/i })).toBeInTheDocument();
    });
  });

  it('navigates / → /capture via CTA', async () => {
    const user = userEvent.setup();
    renderAppAt('/');
    await waitFor(() => expect(screen.getByText('Capture Photos')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Capture Photos/i }));
    await waitFor(() => {
      expect(screen.getByRole('banner', { name: 'Capture' })).toBeInTheDocument();
    });
  });

  it('navigates / → /upload via CTA', async () => {
    const user = userEvent.setup();
    renderAppAt('/');
    await user.click(screen.getByRole('button', { name: /Upload Images/i }));
    await waitFor(() => {
      expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument();
    });
  });

  it('header nav links reach capture and upload', async () => {
    const user = userEvent.setup();
    renderAppAt('/');
    await waitFor(() => expect(screen.getByRole('navigation', { name: /Main/i })).toBeInTheDocument());
    const captureLinks = screen.getAllByRole('link', { name: 'Capture' });
    await user.click(captureLinks[0]);
    await waitFor(() => expect(screen.getByRole('banner', { name: 'Capture' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument(),
    );
    const uploadLinks = screen.getAllByRole('link', { name: 'Upload' });
    await user.click(uploadLinks[0]);
    await waitFor(() => expect(screen.getByText(/Upload Images/i)).toBeInTheDocument());
  });

  it('history card expands details in place', async () => {
    const user = userEvent.setup();
    seedLocalHistory([{ ...SEED_HISTORY[0], id: 'hist-expand-test' }]);
    renderAppAt('/history');
    await waitFor(() =>
      expect(screen.getAllByText(SEED_HISTORY[0].asset_name).length).toBeGreaterThan(0),
    );
    const viewButtons = screen.getAllByRole('button', { name: /View details/i });
    await user.click(viewButtons[0]);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    });
  });
});
