import { describe, expect, it } from 'vitest';
import { buildCustomLookupId, isCustomLookupId } from './lookupCustom';

describe('lookupCustom', () => {
  it('builds stable custom ids from labels', () => {
    const id = buildCustomLookupId('HP Laptop');
    expect(id).toMatch(/^custom-hp-laptop-\d+$/);
    expect(isCustomLookupId(id)).toBe(true);
  });
});
