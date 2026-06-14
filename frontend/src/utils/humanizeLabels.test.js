import { describe, expect, it } from 'vitest';
import {
  humanizeAnalysisMethod,
  humanizeUncertaintyFlag,
  humanizeUncertaintyFlags,
  humanizeValuationStatus,
} from './humanizeLabels';
describe('humanizeLabels', () => {
  it('maps uncertainty flags to plain language', () => {
    expect(humanizeUncertaintyFlag('generation_ambiguous')).toMatch(/generation/i);
    expect(humanizeUncertaintyFlag('age_uncertain')).toMatch(/age/i);
    expect(humanizeUncertaintyFlags(['partial_view', 'valuation_uncertain'])).toHaveLength(2);
    expect(humanizeUncertaintyFlags(['angle_missing_front'])[0]).toMatch(/front/i);
  });

  it('maps valuation status for clients', () => {
    expect(humanizeValuationStatus('indicative_only')).toMatch(/indicative/i);
    expect(humanizeAnalysisMethod('multi_image')).toBe('Multi-photo scan');
  });
});
