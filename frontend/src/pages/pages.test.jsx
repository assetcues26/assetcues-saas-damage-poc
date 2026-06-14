import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  renderAppAt,
  createTestImageFile,
  SEED_HISTORY,
  seedLocalHistory,
} from '../test/testUtils';
import { LandingPage } from './LandingPage';
import { PreviewPage } from './PreviewPage';
import { AssetDetailPage } from './AssetDetailPage';
import { useApp } from '../context/AppContext';
import { useEffect } from 'react';
import * as analysisService from '../services/analysisService';

vi.mock('../services/analysisService', () => ({
  analyzeImages: vi.fn(),
}));

function PreviewWithImage() {
  const { setPreviewImage } = useApp();
  useEffect(() => {
    setPreviewImage({
      file: createTestImageFile('preview.jpg'),
      previewUrl: 'blob:preview-test',
      source: 'upload',
    });
  }, [setPreviewImage]);
  return <PreviewPage />;
}

describe('Page components', () => {
  beforeEach(() => {
    analysisService.analyzeImages.mockResolvedValue({
      request_id: 'req_page_test',
      asset_name: 'Page Test Unit',
      condition: 'Good',
      asset_condition: 'OK',
      detected_tag_number_raw: 'PG-001',
      barcodeposition: 'top',
      tag_detection_reasoning: 'test',
      asset_description: 'desc',
      stitching_confidence: 0.9,
      image_readability: 'Readable',
      visible_labels: ['A'],
      processing_time_ms: 3000,
      mergedImageUrl: 'blob:page-merged',
    });
  });

  it('LandingPage renders hero without asset history', async () => {
    renderWithProviders(<LandingPage />, { route: '/' });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
      expect(screen.queryByText('Asset History')).not.toBeInTheDocument();
      expect(screen.getByLabelText('App settings')).toBeInTheDocument();
    });
  });

  it('PreviewPage saves image to batch', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreviewWithImage />, { route: '/preview?source=upload' });
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Preview Image/i })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /Save image/i }));
    await waitFor(() =>
      expect(screen.getAllByText(/Image saved to batch/i).length).toBeGreaterThan(0),
    );
  });

  it('GET /batch redirects when batch empty', async () => {
    renderAppAt('/batch');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
    });
  });

  it('ResultPage loads saved entry by id', async () => {
    seedLocalHistory([{ ...SEED_HISTORY[0], id: 'hist-result-page-test' }]);
    renderAppAt('/result/hist-result-page-test');
    await waitFor(
      () => {
        expect(screen.getAllByText(SEED_HISTORY[0].asset_name).length).toBeGreaterThan(0);
        expect(screen.getByText(SEED_HISTORY[0].detected_tag_number_raw)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('AssetDetailPage shows not found for missing id', async () => {
    renderWithProviders(<AssetDetailPage />, { route: '/asset/missing-999' });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Asset Not Found/i })).toBeInTheDocument();
    });
  });
});
