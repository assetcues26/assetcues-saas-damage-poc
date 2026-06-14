import { describe, expect, it } from 'vitest';
import { formatAgeYearsMonths } from './formatters';

describe('formatAgeYearsMonths', () => {
  it('formats decimal years as years and months', () => {
    expect(formatAgeYearsMonths(5.242984257357974)).toBe('5 years 3 months');
    expect(formatAgeYearsMonths(1)).toBe('1 year');
    expect(formatAgeYearsMonths(0.5)).toBe('6 months');
    expect(formatAgeYearsMonths(2.25)).toBe('2 years 3 months');
  });

  it('passes through already formatted strings', () => {
    expect(formatAgeYearsMonths('~6 years (as of 2026)')).toBe('~6 years (as of 2026)');
  });
});
