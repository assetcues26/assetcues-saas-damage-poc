import { describe, expect, it } from 'vitest';
import { buildAnalysisReport, resolveImageReadability } from './analysisReport';

describe('resolveImageReadability', () => {
  it('returns Y when both images are uploaded and AI sent E', () => {
    expect(
      resolveImageReadability(
        { imageReadability: 'E' },
        {
          asset_image_url: 'https://example.com/asset.jpg',
          barcode_image_url: 'https://example.com/barcode.jpg',
        },
      ),
    ).toBe('Y');
  });

  it('returns N when no images on asset', () => {
    expect(resolveImageReadability({ imageReadability: 'E' }, {})).toBe('N');
  });

  it('keeps explicit AI Y/N', () => {
    expect(resolveImageReadability({ imageReadability: 'N' }, { asset_image_url: 'a' })).toBe('N');
  });
});

describe('buildAnalysisReport', () => {
  it('marks image readability pass when both photos exist', () => {
    const report = buildAnalysisReport(
      { imageReadability: 'E', namedescriptionmatch: 'Y' },
      {
        asset_image_url: 'https://example.com/asset.jpg',
        barcode_image_url: 'https://example.com/barcode.jpg',
      },
    );
    const readability = report.checks.find((c) => c.key === 'imageReadability');
    expect(readability?.pass).toBe(true);
    expect(report.imageReadability).toBe('Y');
  });
});
