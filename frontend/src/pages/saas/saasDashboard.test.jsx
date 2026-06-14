import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AssetsDashboardPage } from './AssetsDashboardPage';

vi.mock('../../context/SaasAssetsContext', () => ({
  useSaasAssets: () => ({
    assets: [
      {
        id: 'a1',
        assetid: 'AST-1',
        assetname: 'Test',
        company: 'Co',
        cost: 1000,
        acquisitiondate: '01-01-2023',
        ai_status: 'fail',
        latest_analysis_id: 'analysis-1',
        asset_image_url: 'https://example.com/a.jpg',
      },
    ],
    total: 1,
    loading: false,
    error: null,
    search: '',
    setSearch: vi.fn(),
    aiStatusFilter: null,
    setAiStatusFilter: vi.fn(),
    sort: 'created_at',
    setSort: vi.fn(),
    order: 'desc',
    setOrder: vi.fn(),
    page: 0,
    setPage: vi.fn(),
    pageSize: 25,
    selectedIds: [],
    toggleSelected: vi.fn(),
    toggleSelectAll: vi.fn(),
    stats: { total: 1, pass_count: 1, fail_count: 0, pending: 0, error: 0, analyzing: 0 },
    activity: [{ id: 'e1', message: 'Asset created', created_at: new Date().toISOString() }],
    refresh: vi.fn(),
    runAnalysis: vi.fn(),
    queueNewAssetAnalysis: vi.fn(),
    bulkAnalyze: vi.fn(),
    bulkAnalyzeIds: vi.fn(),
    bulkDelete: vi.fn(),
    exportCsv: vi.fn(),
  }),
}));

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../services/saasAssetsApi', () => ({
  deleteSaasAsset: vi.fn(),
  fetchSaasAssetAnalysis: vi.fn(),
}));

describe('AssetsDashboardPage', () => {
  it('renders summary cards and asset row', () => {
    render(
      <MemoryRouter>
        <AssetsDashboardPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Assets Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('AST-1')).toBeInTheDocument();
  });
});
