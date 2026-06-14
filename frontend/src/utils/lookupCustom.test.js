import { describe, expect, it } from 'vitest';
import {
  allocateCustomLookupId,
  buildCustomLookupId,
  isCustomLookupId,
} from './lookupCustom';

describe('lookupCustom', () => {
  it('builds stable custom ids from labels', () => {
    const id = buildCustomLookupId('HP Laptop');
    expect(id).toMatch(/^custom-hp-laptop-\d+$/);
    expect(isCustomLookupId(id)).toBe(true);
  });

  it('allocates numeric ids for company lookups', () => {
    const items = [
      { id: '1000' },
      { id: '7000' },
    ];
    expect(allocateCustomLookupId('company', items, 'New Co')).toBe('8000');
  });

  it('allocates slug ids for non-numeric lookups', () => {
    const items = [{ id: 'IT' }];
    const id = allocateCustomLookupId('assetclass', items, 'Lab Equipment');
    expect(id).toMatch(/^custom-lab-equipment-\d+$/);
  });
});
