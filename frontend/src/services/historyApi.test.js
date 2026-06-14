import { describe, it, expect } from 'vitest';
import { hydrateListItem, isFullHistoryEntry } from './historyApi';

describe('historyApi helpers', () => {
  it('isFullHistoryEntry returns false for summary list rows', () => {
    const summary = hydrateListItem({
      entry_id: 'uuid-1',
      request_id: 'uuid-1',
      asset_name: 'Test Asset',
      asset_tag: 'TAG-1',
      condition_grade: 'Good',
      processed_at: '2026-01-01T00:00:00Z',
    });
    expect(isFullHistoryEntry(summary)).toBe(false);
  });

  it('isFullHistoryEntry returns true for hydrated report entries', () => {
    expect(
      isFullHistoryEntry({
        asset_name: 'Laptop',
        asset_condition: 'Good cosmetic condition',
        asset_description: 'ASUS ZenBook laptop',
        conditionDetail: { grade: 'Good' },
      }),
    ).toBe(true);
  });
});
