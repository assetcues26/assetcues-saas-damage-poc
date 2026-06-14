import { describe, expect, it } from 'vitest';
import {
  getValuationBullets,
  normalizeErpVerification,
  splitProseToBullets,
} from './valuationBullets';

describe('valuationBullets', () => {
  it('splits legacy paragraphs into punctuated bullets', () => {
    const bullets = splitProseToBullets('First point here. Second point follows');
    expect(bullets).toHaveLength(2);
    expect(bullets[0]).toMatch(/\.$/);
  });

  it('builds points from legacy paragraph notes', () => {
    const erp = normalizeErpVerification({
      climate_valuation_note:
        'Site context: Kashmir — moderate urban climate. Moderate tier-1/tier-2 climate — location adds less extreme wear.',
    });
    expect(erp.climate_valuation_points.length).toBeGreaterThanOrEqual(2);
  });

  it('filters legacy NBV paragraph to book/market lines only', () => {
    const bullets = getValuationBullets(
      {
        nbv_vs_market_note:
          'Book NBV from ERP is the accounting baseline. Estimated market/as-is value is above book NBV. Site context: Kashmir — moderate urban climate.',
      },
      'nbv_vs_market',
    );
    expect(bullets.some((b) => /book nbv/i.test(b))).toBe(true);
    expect(bullets.some((b) => /site context/i.test(b))).toBe(false);
  });

  it('prefers points arrays from API', () => {
    const bullets = getValuationBullets(
      {
        nbv_vs_market_points: ['Book NBV from ERP is the baseline.'],
        nbv_vs_market_note: 'Legacy paragraph should be ignored.',
      },
      'nbv_vs_market',
    );
    expect(bullets).toHaveLength(1);
    expect(bullets[0]).toContain('Book NBV');
  });
});
