import { describe, expect, it } from 'vitest';
import { getAngleChecklist } from './angleChecklists';

describe('getAngleChecklist', () => {
  it('returns default angles for unknown category', () => {
    const angles = getAngleChecklist({});
    expect(angles).toHaveLength(4);
    expect(angles[0].id).toBe('front');
  });

  it('returns HVAC-specific angles', () => {
    const angles = getAngleChecklist({ category: 'HVAC', subcategory: 'Split AC' });
    expect(angles[0].label).toMatch(/indoor|condenser/i);
  });

  it('returns IT equipment angles for laptop', () => {
    const angles = getAngleChecklist({ category: 'IT Equipment', subcategory: 'Laptop' });
    expect(angles[1].label).toMatch(/sticker|tag/i);
  });
});
