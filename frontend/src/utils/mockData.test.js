import { describe, it, expect } from 'vitest';
import { SEED_HISTORY, createSampleAnalysisResult, isLegacySeedEntry } from './mockData';

describe('mockData', () => {
  it('seeds three distinct history entries', () => {
    expect(SEED_HISTORY).toHaveLength(3);
    const names = SEED_HISTORY.map((e) => e.asset_name);
    expect(names).toContain('Carrier Split AC Unit');
    expect(names).toContain('Daikin Inverter AC');
    expect(names).toContain('Apple Macbook Pro');
  });

  it('isLegacySeedEntry identifies legacy sample rows', () => {
    expect(isLegacySeedEntry(SEED_HISTORY[0])).toBe(true);
    expect(isLegacySeedEntry({ id: 'hist-real-99' })).toBe(false);
  });

  it('each seed entry has required LLM fields', () => {
    SEED_HISTORY.forEach((entry) => {
      expect(entry.id).toBeTruthy();
      expect(entry.request_id).toBeTruthy();
      expect(entry.detected_tag_number_raw).toBeTruthy();
      expect(entry.asset_condition).toBeTruthy();
      expect(entry.stitching_confidence).toBeGreaterThan(0);
      expect(entry.visible_labels?.length).toBeGreaterThan(0);
      expect(entry.processedAt).toBeTruthy();
    });
  });

  it('createSampleAnalysisResult returns randomized analysis payload', () => {
    const a = createSampleAnalysisResult();
    const b = createSampleAnalysisResult();
    expect(a.request_id).toBeTruthy();
    expect(a.asset_name).toBeTruthy();
    expect(a.processing_time_ms).toBeGreaterThanOrEqual(3000);
    expect(a.stitching_confidence).toBeGreaterThan(0);
    expect(a.request_id).not.toBe(b.request_id);
  });
});
