import { describe, expect, it } from 'vitest';
import { buildAiStatusLines, getCheckReason } from './aiStatusSummary';

const SAMPLE_SUMMARY = {
  checks: {
    imageReadability: true,
    namedescriptionmatch: false,
    subcatmodelmatch: false,
    detectedtagnumbermatch: false,
    costmatch: false,
    datematch: false,
  },
  reasoning:
    'User Claim: HP Laptop. Image Shows: MacBook Pro. Verdict: The asset name provided contradicts the visual evidence.',
  namedescriptionmatchpercent: 0,
  subcatmodelmatchpercent: 30,
  field_comparison: {
    namedescriptionmatch: {
      registered: 'HP Laptop',
      detected: 'MacBook Pro',
    },
    costmatch: {
      registered: '250000',
      detected: '120000',
    },
  },
  costvalidation: { reasoning: 'Detected cost is below registered amount.' },
};

describe('aiStatusSummary', () => {
  it('builds failed check lines with reasoning for fail status', () => {
    const lines = buildAiStatusLines(SAMPLE_SUMMARY, 'fail');
    expect(lines.some((l) => l.label === 'Name & description match')).toBe(true);
    expect(lines.some((l) => l.reason?.includes('HP Laptop'))).toBe(true);
    expect(lines.some((l) => l.type === 'reasoning')).toBe(true);
  });

  it('extracts registered vs detected reason', () => {
    const reason = getCheckReason('namedescriptionmatch', SAMPLE_SUMMARY);
    expect(reason).toContain('HP Laptop');
    expect(reason).toContain('MacBook Pro');
  });
});
