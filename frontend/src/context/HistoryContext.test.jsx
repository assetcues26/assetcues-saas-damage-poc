import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  HistoryProvider,
  useHistoryContext,
  stripLegacySeedEntries,
} from './HistoryContext';
import { hydrateListItem, isFullHistoryEntry } from '../services/historyApi';
import { SEED_HISTORY } from '../utils/mockData';

function mockHistoryFetch(items = []) {
  global.fetch = vi.fn(async (url, options = {}) => {
    const href = typeof url === 'string' ? url : url.url;

    if (href.includes('/v1/history') && options.method === 'DELETE') {
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ entry_id: 'deleted', deleted: true }),
      };
    }

    if (href.includes('/v1/history/')) {
      const entryId = decodeURIComponent(href.split('/v1/history/')[1]?.split('?')[0] || 'detail-1');
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          entry_id: entryId,
          request_id: entryId,
          processed_at: '2026-01-01T00:00:00Z',
          result_json: {
            request_id: entryId,
            status: 'success',
            analysis_method: 'multi_image',
            asset: { name: 'Detail Asset', description: 'Full report description' },
            condition: { grade: 'Good', summary: 'Good cosmetic condition' },
            identifiers: {},
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
        json: async () => ({ items, total: items.length, limit: 100, offset: 0 }),
      };
    }

    return {
      ok: true,
      blob: async () => new Blob(['img'], { type: 'image/jpeg' }),
    };
  });
}

function wrapper({ children }) {
  return <HistoryProvider>{children}</HistoryProvider>;
}

describe('HistoryContext', () => {
  beforeEach(() => {
    mockHistoryFetch();
  });

  it('throws outside provider', () => {
    expect(() => renderHook(() => useHistoryContext())).toThrow(/HistoryProvider/);
  });

  it('loads history from API on mount', async () => {
    mockHistoryFetch([
      {
        entry_id: 'api-entry-1',
        request_id: 'api-entry-1',
        asset_name: 'API Asset',
        asset_tag: 'TAG-1',
        condition_grade: 'Good',
        processed_at: '2026-01-02T00:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useHistoryContext(), { wrapper });
    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
      expect(result.current.historyCount).toBe(1);
    });
    expect(result.current.getEntryById('api-entry-1')?.asset_name).toBe('API Asset');
  });

  it('starts empty when history API is unavailable', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'History persistence is not configured' }),
    }));

    const { result } = renderHook(() => useHistoryContext(), { wrapper });
    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
      expect(result.current.historyCount).toBe(0);
      expect(result.current.historyApiEnabled).toBe(false);
    });
  });

  it('stripLegacySeedEntries keeps real scans', () => {
    const real = { id: 'hist-real-1', asset_name: 'Real Unit' };
    const cleaned = stripLegacySeedEntries([...SEED_HISTORY, real]);
    expect(cleaned).toEqual([real]);
  });

  it('adds, searches, deletes, and checks isSaved', async () => {
    const { result } = renderHook(() => useHistoryContext(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let entry;
    await act(async () => {
      entry = await result.current.addEntry({
        asset_name: 'Test Compressor',
        request_id: 'req_test_99',
        detected_tag_number_raw: 'TST-001',
        visible_labels: ['TestCo'],
        condition: 'Good',
      });
    });

    expect(result.current.getEntryById(entry.id)).toBeTruthy();
    expect(result.current.isSaved('req_test_99')).toBe(true);

    const found = result.current.searchEntries('compressor');
    expect(found.some((e) => e.id === entry.id)).toBe(true);

    await act(async () => {
      await result.current.deleteEntry(entry.id);
    });
    expect(result.current.getEntryById(entry.id)).toBeUndefined();
  });

  it('replaces existing entry when same request_id is added again', async () => {
    const { result } = renderHook(() => useHistoryContext(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      await result.current.addEntry({
        request_id: 'req_dup_test',
        asset_name: 'First Name',
        detected_tag_number_raw: 'TAG-1',
      });
    });
    await act(async () => {
      await result.current.addEntry({
        request_id: 'req_dup_test',
        asset_name: 'Updated Name',
        detected_tag_number_raw: 'TAG-1',
      });
    });

    const matches = result.current.history.filter((e) => e.request_id === 'req_dup_test');
    expect(matches).toHaveLength(1);
    expect(matches[0].asset_name).toBe('Updated Name');
  });

  it('ensureEntry fetches detail when missing from memory', async () => {
    const { result } = renderHook(() => useHistoryContext(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let fetched;
    await act(async () => {
      fetched = await result.current.ensureEntry('detail-1');
    });

    expect(fetched?.asset_name).toBe('Detail Asset');
    expect(result.current.getEntryById('detail-1')).toBeTruthy();
  });

  it('ensureEntry fetches detail for summary list rows after refresh', async () => {
    mockHistoryFetch([
      {
        entry_id: 'summary-uuid-1',
        request_id: 'summary-uuid-1',
        asset_name: 'Summary Only',
        asset_tag: 'TAG-9',
        condition_grade: 'Good',
        processed_at: '2026-01-02T00:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useHistoryContext(), { wrapper });
    await waitFor(() => expect(result.current.historyCount).toBe(1));

    const summary = result.current.getEntryById('summary-uuid-1');
    expect(isFullHistoryEntry(summary)).toBe(false);
    expect(hydrateListItem({
      entry_id: 'summary-uuid-1',
      request_id: 'summary-uuid-1',
      asset_name: 'Summary Only',
    }).asset_condition).toBeUndefined();

    let fetched;
    await act(async () => {
      fetched = await result.current.ensureEntry('summary-uuid-1');
    });

    expect(fetched?.asset_name).toBe('Detail Asset');
    expect(isFullHistoryEntry(result.current.getEntryById('summary-uuid-1'))).toBe(true);
    expect(result.current.getEntryById('summary-uuid-1')?.asset_description).toBe(
      'Full report description',
    );
  });

  it('sets historyError when list API fails', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Invalid or missing demo API key' }),
    }));

    const { result } = renderHook(() => useHistoryContext(), { wrapper });
    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
      expect(result.current.historyError).toMatch(/demo API key/i);
    });
  });
});
