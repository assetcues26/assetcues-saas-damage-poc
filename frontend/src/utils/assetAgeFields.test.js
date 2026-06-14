import { describe, expect, it } from 'vitest';
import { enrichAssetAgeFields } from './assetAgeFields';

describe('enrichAssetAgeFields', () => {
  it('splits legacy combined estimated_age into model year and age', () => {
    const asset = enrichAssetAgeFields({
      estimated_age: '~2-3 years (approx. 2022-2023)',
    });
    expect(asset.estimated_model_years).toBe('2022–2023');
    expect(asset.estimated_age_years).toMatch(/as of/);
  });

  it('leaves asset unchanged when split fields already exist', () => {
    const input = {
      estimated_model_years: '2020',
      estimated_age_years: '~6 years (as of 2026)',
    };
    expect(enrichAssetAgeFields(input)).toBe(input);
  });
});
