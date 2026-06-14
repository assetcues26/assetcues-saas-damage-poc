import { describe, expect, it, vi, beforeEach } from 'vitest';

const save = vi.fn();
const mockDoc = {
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  setFillColor: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  text: vi.fn(),
  rect: vi.fn(),
  splitTextToSize: vi.fn((text) => [String(text)]),
  addPage: vi.fn(),
  addImage: vi.fn(),
  save,
};

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => mockDoc),
}));

vi.mock('./assetReportPdf', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    prepareLogoForPdf: vi.fn().mockResolvedValue({
      dataUrl: 'data:image/png;base64,logo',
      width: 320,
      height: 80,
    }),
    prepareImageForPdf: vi.fn().mockResolvedValue({
      dataUrl: 'data:image/jpeg;base64,img',
      width: 400,
      height: 300,
    }),
    drawImagesGrid: vi.fn(async (state) => {
      state.y += 40;
    }),
  };
});

import { exportSaasAssetReportPdf } from './exportSaasAssetReportPdf';

describe('exportSaasAssetReportPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates structured AssetCues PDF with logo and sections', async () => {
    await exportSaasAssetReportPdf({
      asset: {
        id: 'uuid-1',
        assetid: 'AST-10001',
        assetname: 'Dell Latitude',
        company: 'Company 1',
        cost: 125000,
        acquisitiondate: '15-08-2023',
        tagnumber: 'TAG1001',
        asset_image_url: 'https://example.com/asset.jpg',
        ai_status: 'pass',
      },
      analysis: {
        request_id: 'req-1',
        created_at: '2026-06-14T10:00:00.000Z',
        response_json: {
          detectedAsset: 'Dell Latitude Laptop',
          condition: 'Good',
          namedescriptionmatch: 'Y',
          namedescriptionmatchpercent: 92,
          subcatmodelmatch: 'Y',
          detectedtagnumbermatch: 'Y',
          costvalidation: { costmatch: 'Y', usercost: 125000, estimatedcost: 120000 },
          acquisitiondatevalidation: { datematch: 'Y', useracquisitiondate: '15-08-2023' },
          imageAnalysis: 'Clear photo of laptop.',
          damage_assessment: 'Minor wear on corners.',
        },
      },
    });

    expect(save).toHaveBeenCalledWith(expect.stringMatching(/^AssetCues-Report-Dell-Latitude-\d{4}-\d{2}-\d{2}\.pdf$/));
    expect(mockDoc.addImage).toHaveBeenCalled();
    expect(mockDoc.text).toHaveBeenCalled();
  });
});
