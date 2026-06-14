import { describe, it, expect } from 'vitest';
import { computeSlmFar, recomputeFar, resolveUsefulLife } from './farCalculator';

// Reference date for deterministic tests
const AS_OF = '2026-06-07';

describe('resolveUsefulLife', () => {
  it('returns explicit useful_life_years when set', () => {
    expect(resolveUsefulLife({ useful_life_years: 10 })).toBe(10);
  });

  it('falls back to subcategory match — laptop → 5', () => {
    expect(resolveUsefulLife({ subcategory: 'Laptop' })).toBe(5);
  });

  it('falls back to subcategory match — split ac → 15', () => {
    expect(resolveUsefulLife({ subcategory: 'Split AC' })).toBe(15);
  });

  it('falls back to category — vehicle → 8', () => {
    expect(resolveUsefulLife({ category: 'Vehicle' })).toBe(8);
  });

  it('defaults to 5 for unknown category/subcategory', () => {
    expect(resolveUsefulLife({ category: 'Misc', subcategory: 'Other' })).toBe(5);
  });
});

describe('computeSlmFar', () => {
  it('returns null for zero cost', () => {
    expect(computeSlmFar(0, '2021-01-01', 5, { asOf: AS_OF })).toBeNull();
  });

  it('returns null for missing date', () => {
    expect(computeSlmFar(100000, '', 5, { asOf: AS_OF })).toBeNull();
  });

  it('returns null for zero useful life', () => {
    expect(computeSlmFar(100000, '2021-01-01', 0, { asOf: AS_OF })).toBeNull();
  });

  it('computes correct NBV for a 5-year laptop at 5 years old', () => {
    // Acquired 2021-06-07, as of 2026-06-07 — 365.25-day years means age is ≈ 4.998,
    // so NBV is at or very near the 5% residual floor (5000).
    const far = computeSlmFar(100000, '2021-06-07', 5, { residualPct: 0.05, asOf: AS_OF });
    expect(far.book_nbv_inr).toBeGreaterThanOrEqual(5000);
    expect(far.book_nbv_inr).toBeLessThanOrEqual(5100); // within 0.1% of floor
    expect(far.residual_value_inr).toBe(5000);
    expect(far.asset_age_years).toBeCloseTo(5, 1);
  });

  it('NBV floors at residual when asset is fully depreciated', () => {
    // 20-year-old asset with 5-year life
    const far = computeSlmFar(50000, '2000-01-01', 5, { residualPct: 0.05, asOf: AS_OF });
    expect(far.book_nbv_inr).toBe(2500); // 5% of 50000
  });

  it('NBV equals original cost for brand-new asset (age ≈ 0)', () => {
    const far = computeSlmFar(200000, AS_OF, 10, { residualPct: 0.05, asOf: AS_OF });
    expect(far.book_nbv_inr).toBe(200000);
    expect(far.asset_age_years).toBeCloseTo(0, 1);
  });

  it('computes partial year depreciation correctly', () => {
    // Acquired exactly 2.5 years before as-of (using 365.25-day years)
    const acq = new Date(new Date(AS_OF).getTime() - 2.5 * 365.25 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const far = computeSlmFar(100000, acq, 10, { residualPct: 0.05, asOf: AS_OF });
    // annual dep = (100000 - 5000) / 10 = 9500; 2.5 years ≈ 23750 accumulated (±100 rounding)
    expect(far.accumulated_depreciation_inr).toBeGreaterThan(23500);
    expect(far.accumulated_depreciation_inr).toBeLessThan(24000);
    expect(far.asset_age_years).toBeCloseTo(2.5, 1);
  });

  it('matches Python backend result for Micromax AC (ac-001)', () => {
    // cost=33490, acq=2021-06-15, life=15, residual=0.05
    const far = computeSlmFar(33490, '2021-06-15', 15, { residualPct: 0.05, asOf: AS_OF });
    // residual = 1674.50; depreciable = 31815.50; annual = 2121.03; age ≈ 4.98 yrs
    expect(far.book_nbv_inr).toBeGreaterThan(10000);
    expect(far.asset_age_years).toBeCloseTo(4.98, 1);
    expect(far.annual_depreciation_inr).toBeCloseTo(2121, 0);
  });

  it('includes far_as_of_date in output', () => {
    const far = computeSlmFar(50000, '2022-01-01', 5, { asOf: AS_OF });
    expect(far.far_as_of_date).toBe(AS_OF);
  });
});

describe('recomputeFar', () => {
  it('returns null for null context', () => {
    expect(recomputeFar(null)).toBeNull();
  });

  it('derives all fields from a context object', () => {
    const ctx = {
      original_cost_inr: 169900,
      acquisition_date: '2022-03-15',
      useful_life_years: 5,
      residual_value_pct: 0.05,
    };
    const far = recomputeFar({ ...ctx, _asOf: AS_OF });
    expect(far).not.toBeNull();
    expect(far.book_nbv_inr).toBeGreaterThan(0);
    expect(far.book_nbv_inr).toBeLessThan(ctx.original_cost_inr);
  });

  it('updates NBV when acquisition_date is brand new on the as-of date', () => {
    const ctx = {
      original_cost_inr: 100000,
      acquisition_date: AS_OF,
      subcategory: 'laptop',
    };
    const far = computeSlmFar(
      ctx.original_cost_inr,
      ctx.acquisition_date,
      resolveUsefulLife(ctx),
      { asOf: AS_OF },
    );
    expect(far.book_nbv_inr).toBe(100000);
  });
});
