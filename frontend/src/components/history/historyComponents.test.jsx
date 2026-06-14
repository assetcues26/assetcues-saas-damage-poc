import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { MemoryRouter } from 'react-router-dom';

import { HistorySearch } from './HistorySearch';

import { HistoryGrid } from './HistoryGrid';

import { HistoryAssetCard } from './HistoryAssetCard';

import { SEED_HISTORY } from '../../utils/mockData';
import { AppProvider } from '../../context/AppContext';
import { HistoryProvider } from '../../context/HistoryContext';
import { ToastContainer } from '../ui/Toast';
import { hydrateListItem } from '../../services/historyApi';

vi.mock('../../services/assetReportPdf', () => ({
  exportAssetReportPdf: vi.fn().mockResolvedValue(undefined),
}));

function mockDetailFetch() {
  global.fetch = vi.fn(async (url, options = {}) => {
    const href = typeof url === 'string' ? url : url.url;

    if (href.includes('/v1/history/')) {
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          entry_id: 'summary-only-1',
          request_id: 'summary-only-1',
          processed_at: '2026-01-01T00:00:00Z',
          result_json: {
            request_id: 'summary-only-1',
            status: 'success',
            analysis_method: 'multi_image',
            asset: { name: 'ASUS ZenBook Laptop', description: 'Laptop on desk' },
            condition: { grade: 'Good', summary: 'Good cosmetic condition' },
            identifiers: { asset_tag_number_raw: 'Not detected' },
            valuation: {},
            confidence: {},
          },
          image_urls: { preview_urls: [], merged_image_url: null },
        }),
      };
    }

    if (href.includes('/v1/history')) {
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ items: [], total: 0, limit: 100, offset: 0 }),
      };
    }

    return { ok: true, blob: async () => new Blob(['img'], { type: 'image/jpeg' }) };
  });
}

function renderHistory(ui) {
  return render(
    <AppProvider>
      <HistoryProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </HistoryProvider>
      <ToastContainer />
    </AppProvider>,
  );
}

describe('History components', () => {
  beforeEach(() => {
    mockDetailFetch();
  });

  it('HistorySearch calls onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<HistorySearch value="" onChange={onChange} />);
    await user.type(screen.getByRole('searchbox'), 'Carrier');
    expect(onChange).toHaveBeenCalled();
  });

  it('HistoryGrid renders cards for entries', () => {
    renderHistory(<HistoryGrid entries={SEED_HISTORY} onDelete={vi.fn()} />);
    expect(screen.getByText('Carrier Split AC Unit')).toBeInTheDocument();
    expect(screen.getByText('Apple Macbook Pro')).toBeInTheDocument();
  });

  it('HistoryGrid shows only the expanded entry in focus mode', async () => {
    const user = userEvent.setup();
    renderHistory(<HistoryGrid entries={SEED_HISTORY} onDelete={vi.fn()} />);

    expect(screen.getByText('Carrier Split AC Unit')).toBeInTheDocument();
    expect(screen.getByText('Apple Macbook Pro')).toBeInTheDocument();

    const macButtons = screen.getAllByRole('button', { name: /View details/i });
    await user.click(macButtons[2]);

    await waitFor(() => {
      expect(screen.queryByText('Carrier Split AC Unit')).not.toBeInTheDocument();
      expect(screen.queryByText('Daikin Inverter AC')).not.toBeInTheDocument();
      expect(screen.getAllByText('Apple Macbook Pro').length).toBeGreaterThan(0);
    });
  });

  it('HistoryAssetCard expands with full report for in-memory entries', async () => {
    const onDelete = vi.fn();
    const onToggleExpand = vi.fn();
    const user = userEvent.setup();

    const { rerender } = renderHistory(
      <HistoryAssetCard
        entry={SEED_HISTORY[0]}
        onDelete={onDelete}
        expanded={false}
        onToggleExpand={onToggleExpand}
      />,
    );

    await user.click(screen.getByRole('button', { name: /View details/i }));
    expect(onToggleExpand).toHaveBeenCalledWith(SEED_HISTORY[0].id);

    rerender(
      <AppProvider>
        <HistoryProvider>
          <MemoryRouter>
            <HistoryAssetCard
              entry={SEED_HISTORY[0]}
              onDelete={onDelete}
              expanded
              onToggleExpand={onToggleExpand}
            />
          </MemoryRouter>
        </HistoryProvider>
        <ToastContainer />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    });
    expect(screen.getAllByText(SEED_HISTORY[0].asset_name).length).toBeGreaterThan(0);
  });

  it('HistoryAssetCard fetches detail for summary-only entries on expand', async () => {
    const summaryEntry = hydrateListItem({
      entry_id: 'summary-only-1',
      request_id: 'summary-only-1',
      asset_name: 'ASUS ZenBook Laptop',
      asset_tag: '—',
      condition_grade: 'Good',
      processed_at: '2026-01-01T00:00:00Z',
    });

    renderHistory(
      <HistoryAssetCard
        entry={summaryEntry}
        onDelete={vi.fn()}
        expanded
        onToggleExpand={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText('ASUS ZenBook Laptop').length).toBeGreaterThan(0);
      expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    });
    expect(screen.getAllByText('Good cosmetic condition').length).toBeGreaterThan(0);
  });

  it('HistoryAssetCard deletes after confirm', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderHistory(
      <HistoryAssetCard
        entry={SEED_HISTORY[0]}
        onDelete={onDelete}
        expanded={false}
        onToggleExpand={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Delete asset/i }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(SEED_HISTORY[0].id));
  });
});
