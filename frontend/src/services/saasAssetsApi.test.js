import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  fetchLookups,
  fetchDashboardStats,
  exportAssetsCsv,
} from '../services/saasAssetsApi';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

describe('saasAssetsApi extended', () => {
  it('fetchLookups builds query string', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ type: 'company', items: [] }),
    });
    await fetchLookups('company');
    expect(mockFetch.mock.calls[0][0]).toContain('/lookups?type=company');
  });

  it('fetchDashboardStats hits stats endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ total: 5 }),
    });
    const stats = await fetchDashboardStats();
    expect(stats.total).toBe(5);
    expect(mockFetch.mock.calls[0][0]).toContain('/assets/stats');
  });

  it('exportAssetsCsv returns blob', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['a,b']),
    });
    const blob = await exportAssetsCsv({ ai_status: 'pass' });
    expect(blob).toBeInstanceOf(Blob);
    expect(mockFetch.mock.calls[0][0]).toContain('export.csv');
  });
});
