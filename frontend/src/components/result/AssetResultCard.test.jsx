import { describe, it, expect, vi } from 'vitest';

vi.mock('../../services/assetReportPdf', () => ({
  exportAssetReportPdf: vi.fn().mockResolvedValue(undefined),
}));
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../../context/AppContext';
import { ToastContainer } from '../ui/Toast';
import { AssetResultCard } from './AssetResultCard';
import { SEED_HISTORY } from '../../utils/mockData';

function renderCard(entry = SEED_HISTORY[0]) {
  return render(
    <AppProvider>
      <AssetResultCard result={entry} images={[]} showExport />
      <ToastContainer />
    </AppProvider>,
  );
}

describe('AssetResultCard', () => {
  it('renders asset name, tag, labels, and condition summary', () => {
    const entry = SEED_HISTORY[0];
    renderCard(entry);
    expect(screen.getAllByText(entry.asset_name).length).toBeGreaterThan(0);
    expect(screen.getAllByText(entry.detected_tag_number_raw).length).toBeGreaterThan(0);
    expect(screen.getByText('Detected labels')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText(entry.asset_condition)).toBeInTheDocument();
  });

  it('export button triggers PDF download', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole('button', { name: /Export PDF report/i }));
    await waitFor(() => {
      expect(screen.getByText(/PDF report downloaded/i)).toBeInTheDocument();
    });
  });

  it('renders collage processing image and original uploads', () => {
    render(
      <AppProvider>
        <AssetResultCard
          result={{
            ...SEED_HISTORY[0],
            processingMode: 'collage',
            analysis_method: 'collage',
            mergedImageUrl: 'data:image/jpeg;base64,collage',
            previewUrls: [
              'data:image/jpeg;base64,upload-a',
              'data:image/jpeg;base64,upload-b',
            ],
          }}
          showExport
        />
        <ToastContainer />
      </AppProvider>,
    );
    expect(screen.getByText(/Processing collage/i)).toBeInTheDocument();
    expect(screen.getByText(/Original uploads \(2\)/i)).toBeInTheDocument();
  });

  it('renders US dollar valuation from stored analysis policy', () => {
    render(
      <AppProvider>
        <AssetResultCard
          result={{
            ...SEED_HISTORY[0],
            analysis_policy: { market_region: 'US', display_currency: 'USD' },
            valuation: {
              as_is: {
                display: { min: 1200, max: 1500 },
                display_currency: 'USD',
              },
            },
          }}
          images={[]}
          showExport={false}
        />
      </AppProvider>,
    );
    expect(screen.getAllByText(/\$1,200 – \$1,500/).length).toBeGreaterThan(0);
  });

  it('expands long description', async () => {
    const entry = {
      ...SEED_HISTORY[0],
      asset_description: 'x'.repeat(250),
    };
    const user = userEvent.setup();
    renderCard(entry);
    await user.click(screen.getByRole('button', { name: /Read more/i }));
    expect(screen.getByRole('button', { name: /Show less/i })).toBeInTheDocument();
  });
});
