import { describe, it, expect, vi, beforeEach } from 'vitest';

const save = vi.fn();
const addImage = vi.fn();
const addPage = vi.fn();
const text = vi.fn();
const line = vi.fn();
const splitTextToSize = vi.fn((t) => [String(t)]);
const setFont = vi.fn();
const setFontSize = vi.fn();
const setTextColor = vi.fn();
const setDrawColor = vi.fn();
const setLineWidth = vi.fn();
const setFillColor = vi.fn();
const rect = vi.fn();

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    addImage,
    addPage,
    text,
    textWithLink: (label, x, y) => text(label, x, y),
    link: vi.fn(),
    line,
    rect,
    splitTextToSize,
    setFont,
    setFontSize,
    setTextColor,
    setDrawColor,
    setLineWidth,
    setFillColor,
    save,
  })),
}));

import { exportAssetReportPdf, pdfSafeText } from './assetReportPdf';

describe('pdfSafeText', () => {
  it('replaces rupee symbol and en-dash for Latin-1 PDF fonts', () => {
    const out = pdfSafeText('Current (₹18,444 – ₹19,912) — note');
    expect(out).toBe('Current (Rs. 18,444 - Rs. 19,912) - note');
    expect(out).not.toMatch(/₹/);
    expect(out).not.toMatch(/\u2013|\u2014/);
  });
});

describe('exportAssetReportPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.Image = class {
      constructor() {
        this.naturalWidth = 400;
        this.naturalHeight = 300;
        this.width = 400;
        this.height = 300;
      }

      set src(_v) {
        queueMicrotask(() => this.onload?.());
      }
    };
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    }));
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,abc');
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['x'], { type: 'image/png' }),
    });
  });

  it('generates and saves a PDF for a full entry', async () => {
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:5173' },
    });

    await exportAssetReportPdf({
      id: 'hist-pdf-test-1',
      asset_name: 'Test Chiller',
      condition: 'Good',
      request_id: 'req-pdf-1',
      processing_time_ms: 5000,
      analysis_method: 'multi_image',
      processingMode: 'direct',
      previewUrls: ['data:image/jpeg;base64,def'],
      asset: { brand: 'York', category: 'HVAC', model: 'YCIV' },
      conditionDetail: {
        grade: 'Good',
        summary: 'OK',
        damage_items: [{ type: 'dent', severity: 'minor', detail: 'Small dent' }],
        repair_plan: { summary: 'Cosmetic only', items: [] },
      },
      valuation: {
        as_is: { inr: { min: 18000, max: 20000 } },
        nbv: { inr: { min: 14200, max: 14200 }, method: 'erp_book_nbv', age_years_used: 5.2 },
        like_new_reference: { inr: { min: 30000, max: 32000 } },
        confidence: 0.7,
      },
      erpContext: { catalog_id: 'ac-001', book_nbv_inr: 14200, location: 'Mumbai' },
      erp_verification: {
        tag_number_match: true,
        nbv_vs_market_points: ['Book NBV from ERP is the baseline.'],
        climate_valuation_points: ['Coastal humid site.'],
      },
      identifiers: { asset_tag_number_raw: 'TAG-99', stickers: [{ label_text: 'HP', sticker_type: 'brand' }] },
      reasoning_summary: { narrative: 'Test narrative', uncertainty_flags: ['partial_view'] },
      confidence: { overall: 0.8 },
      detected_tag_number_raw: 'TAG-99',
      asset_description: 'Unit description',
      token_usage: { total_tokens: 1000 },
      cost: { total_cost_usd: 0.002, model: 'test-model' },
    });

    expect(save).toHaveBeenCalled();
    expect(save.mock.calls[0][0]).toMatch(/AssetCues-Report-Test-Chiller/);
    expect(text).toHaveBeenCalled();
  });
});
