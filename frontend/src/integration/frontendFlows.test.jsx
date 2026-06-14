import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAppAt, createTestImageFile, SEED_HISTORY, seedLocalHistory } from '../test/testUtils';
import * as analysisService from '../services/analysisService';
import { createSampleAnalysisResult } from '../utils/mockData';

vi.mock('../services/analysisService', () => ({
  analyzeImages: vi.fn(),
}));

describe('Frontend integration flows', () => {
  beforeEach(() => {
    seedLocalHistory(
      SEED_HISTORY.map((entry, index) => ({
        ...entry,
        id: `test-history-${index}`,
      })),
    );
    analysisService.analyzeImages.mockResolvedValue({
      ...createSampleAnalysisResult({
        asset_name: 'Integration Test Asset',
        request_id: 'req_integration_test',
      }),
      processingMode: 'collage',
      analysis_method: 'collage',
      mergedImageUrl: 'data:image/jpeg;base64,mock-collage',
      previewUrls: ['data:image/jpeg;base64,mock-upload-a'],
    });
  });

  it('history page search tab filters history', async () => {
    const user = userEvent.setup();
    renderAppAt('/history');
    await waitFor(() => expect(screen.getByText('Carrier Split AC Unit')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Search' }));
    const search = screen.getByRole('searchbox');
    await user.type(search, 'Macbook');

    await waitFor(
      () => {
        expect(screen.getByText('Apple Macbook Pro')).toBeInTheDocument();
        expect(screen.queryByText('Carrier Split AC Unit')).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('history search shows empty state for no matches', async () => {
    const user = userEvent.setup();
    renderAppAt('/history');
    await waitFor(() => expect(screen.getByText('Carrier Split AC Unit')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.type(screen.getByRole('searchbox'), 'zzznomatchzzz');
    await waitFor(() => {
      expect(screen.getByText(/No results found/i)).toBeInTheDocument();
    });
  });

  it('history Recent tab shows compact list', async () => {
    const user = userEvent.setup();
    renderAppAt('/history');
    await waitFor(() => expect(screen.getByText('Carrier Split AC Unit')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Recent' }));
    expect(screen.getAllByText(/Split AC|Inverter AC|Window AC/).length).toBeGreaterThan(0);
  });

  it('upload single file → preview → save → returns with batch', async () => {
    const user = userEvent.setup();
    renderAppAt('/upload');
    await waitFor(() =>
      expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument(),
    );

    const input = document.querySelector('input[type="file"]');
    const file = createTestImageFile('single.jpg');
    await user.upload(input, file);

    await waitFor(() => expect(screen.getByRole('heading', { name: /Preview Image/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Save image/i }));

    await waitFor(() => {
      expect(screen.getByText(/Upload Images/i)).toBeInTheDocument();
      expect(screen.getAllByText(/1 \/ 10/).length).toBeGreaterThan(0);
    });
  });

  it(
    'upload multiple files → batch review → processing → result',
    async () => {
      const user = userEvent.setup();
      renderAppAt('/upload');

      const input = document.querySelector('input[type="file"]');
      await user.upload(input, [
        createTestImageFile('a.jpg'),
        createTestImageFile('b.jpg'),
      ]);

      await waitFor(() =>
        expect(screen.getByText(/images ready for analysis/i)).toBeInTheDocument(),
      );
      await user.click(screen.getByRole('button', { name: /Proceed to Analysis/i }));

      await waitFor(
        () => {
          expect(screen.getAllByText('Integration Test Asset').length).toBeGreaterThan(0);
          expect(screen.getByText(/Processing collage|Uploaded images/i)).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      expect(analysisService.analyzeImages).toHaveBeenCalled();
      expect(screen.getAllByText('Integration Test Asset').length).toBeGreaterThan(0);
    },
    25000,
  );

  it('preview discard returns without adding to batch', async () => {
    const user = userEvent.setup();
    renderAppAt('/upload');
    const input = document.querySelector('input[type="file"]');
    await user.upload(input, createTestImageFile());
    await waitFor(() => screen.getByRole('button', { name: /Discard image/i }));
    await user.click(screen.getByRole('button', { name: /Discard image/i }));
    await waitFor(() => {
      expect(screen.queryByText(/1 \/ 10/)).not.toBeInTheDocument();
    });
  });

  it('batch page remove image redirects home when batch empty', async () => {
    const user = userEvent.setup();
    renderAppAt('/upload');
    const input = document.querySelector('input[type="file"]');
    await user.upload(input, [
      createTestImageFile('a.jpg'),
      createTestImageFile('b.jpg'),
    ]);
    await waitFor(() => expect(screen.getByText(/images ready for analysis/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Remove image 1/i }));
    await user.click(screen.getByRole('button', { name: /Remove image 1/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
    });
  });

  it('asset detail back navigates to landing', async () => {
    const user = userEvent.setup();
    renderAppAt('/asset/test-history-0');
    await waitFor(() =>
      expect(screen.getAllByText(SEED_HISTORY[0].asset_name).length).toBeGreaterThan(0),
    );
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
    });
  });

  it('capture page renders viewfinder and toolbar', async () => {
    renderAppAt('/capture');
    await waitFor(() => {
      expect(screen.getByLabelText('Camera viewfinder')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Capture photo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Flip camera/i })).toBeInTheDocument();
    });
  });

  it('capture back with empty batch goes home', async () => {
    const user = userEvent.setup();
    renderAppAt('/capture');
    await waitFor(() => screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI-Powered Asset Intelligence/i })).toBeInTheDocument();
    });
  });

  it('processing API failure shows error UI', async () => {
    analysisService.analyzeImages.mockRejectedValueOnce(new Error('Network failure'));
    const user = userEvent.setup();
    renderAppAt('/upload');
    const input = document.querySelector('input[type="file"]');
    await user.upload(input, [createTestImageFile('err.jpg'), createTestImageFile('err2.jpg')]);
    await waitFor(() => screen.getByRole('button', { name: /Proceed to Analysis/i }));
    await user.click(screen.getByRole('button', { name: /Proceed to Analysis/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Analysis failed/i })).toBeInTheDocument();
      expect(screen.getByText(/Network failure/i)).toBeInTheDocument();
    });
  });

  it('asset detail shows all result fields from saved entry', async () => {
    const entry = SEED_HISTORY[0];
    renderAppAt('/asset/test-history-0');
    await waitFor(() => {
      expect(screen.getAllByText(entry.asset_name).length).toBeGreaterThan(0);
      expect(screen.getByText(/Visible labels|Detected labels/i)).toBeInTheDocument();
      expect(
        screen.getAllByText(/No tag detected|Tag readable|Tag unreadable/i).length,
      ).toBeGreaterThan(0);
    });
  });

  it('footer links navigate correctly', async () => {
    const user = userEvent.setup();
    renderAppAt('/');
    await waitFor(() => expect(screen.getByText('Enterprise Asset Intelligence')).toBeInTheDocument());
    const footer = screen.getByText('Enterprise Asset Intelligence').closest('footer');
    await user.click(within(footer).getByRole('link', { name: 'Capture' }));
    await waitFor(() => expect(screen.getByRole('banner', { name: 'Capture' })).toBeInTheDocument());
  });
});
