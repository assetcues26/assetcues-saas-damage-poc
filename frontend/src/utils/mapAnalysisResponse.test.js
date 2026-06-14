import { describe, it, expect } from 'vitest';
import {
  extractUploadedImagesFromApi,
  mapAnalysisResponse,
  normalizeCollageBase64,
  resolveEntryImages,
} from './mapAnalysisResponse';
import { UPLOAD_PROCESSING_MODES } from '../constants/uploadMode';

const COLLAGE_API = {
  collage_base64: 'collage-data',
  images_base64: ['upload-a', 'upload-b'],
  request_id: 'req-collage-1',
  status: 'success',
  processing_time_ms: 5200,
  analysis_method: 'collage',
  images_analyzed: 2,
  asset: { name: 'Example laptop', brand: 'Dell' },
  condition: { grade: 'Fair', summary: 'Minor wear.' },
  identifiers: {
    asset_tag_number_raw: '1234567890123456',
    tag_readable: true,
    visible_labels: ['Dell'],
  },
  confidence: { overall: 0.85 },
};

const PLACEMENT_SAMPLE = {
  asset_location: 'top lid rear-left',
  horizontal: 'left',
  vertical: 'top',
  seen_in_image: 2,
  in_frame_position: 'upper-left',
};

const COLLAGE_WITH_PLACEMENT = {
  ...COLLAGE_API,
  condition: {
    ...COLLAGE_API.condition,
    damage_items: [
      {
        location: 'Top lid rear-left',
        type: 'dent',
        severity: 'moderate',
        seen_in_image: 2,
        detail: 'Small dent',
        affects_function: false,
        repair_action: 'Buff lid',
        placement: PLACEMENT_SAMPLE,
      },
    ],
  },
  identifiers: {
    ...COLLAGE_API.identifiers,
    barcode: {
      present: true,
      readable: true,
      placement: {
        asset_location: 'base panel',
        horizontal: 'center',
        vertical: 'bottom',
        seen_in_image: 3,
        in_frame_position: 'lower-center',
        description: 'On asset-tracking sticker',
      },
      detection_reasoning: '16-digit code under barcode',
    },
    stickers: [
      {
        label_text: 'Dell',
        sticker_type: 'brand',
        placement: {
          asset_location: 'lid',
          horizontal: 'center',
          vertical: 'center',
          seen_in_image: 1,
          in_frame_position: 'center',
        },
      },
    ],
  },
};

const MULTI_API = {
  collage_base64: null,
  images_base64: ['img1', 'img2', 'img3'],
  request_id: 'req-multi-1',
  status: 'success',
  analysis_method: 'multi_image',
  images_analyzed: 3,
  asset: { name: 'AC Unit' },
  condition: { grade: 'Good' },
  identifiers: { asset_tag_number_raw: 'TAG-2', tag_readable: true },
  confidence: { overall: 0.95 },
};

describe('mapAnalysisResponse', () => {
  it('normalizes raw base64 collage', () => {
    expect(normalizeCollageBase64('abc')).toBe('data:image/jpeg;base64,abc');
    expect(normalizeCollageBase64('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(normalizeCollageBase64(null)).toBeNull();
  });

  it('extracts images_base64 from API', () => {
    const urls = extractUploadedImagesFromApi(COLLAGE_API);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain('upload-a');
  });

  it('collage: collage for processing + separate original uploads', () => {
    const { mergedImageUrl, previewUrls } = resolveEntryImages(COLLAGE_API, {
      processingMode: UPLOAD_PROCESSING_MODES.COLLAGE,
    });
    expect(mergedImageUrl).toContain('collage-data');
    expect(previewUrls).toHaveLength(2);
    expect(previewUrls[0]).not.toBe(mergedImageUrl);
  });

  it('multi: all images in previewUrls, no collage hero', () => {
    const { mergedImageUrl, previewUrls } = resolveEntryImages(MULTI_API, {
      processingMode: UPLOAD_PROCESSING_MODES.DIRECT,
    });
    expect(mergedImageUrl).toBeNull();
    expect(previewUrls).toHaveLength(3);
  });

  it('maps collage API payload to app entry', () => {
    const entry = mapAnalysisResponse(COLLAGE_API, {
      fallbackPreviewUrls: ['blob:a'],
      processingMode: 'collage',
      apiRoute: 'https://example.com/collage',
    });

    expect(entry.asset_name).toBe('Example laptop');
    expect(entry.mergedImageUrl).toContain('collage-data');
    expect(entry.previewUrls).toHaveLength(2);
    expect(entry.previewUrls[0]).toContain('upload-a');
  });

  it('preserves nested placement, barcode, and stickers from API', () => {
    const entry = mapAnalysisResponse(COLLAGE_WITH_PLACEMENT, {
      processingMode: 'collage',
      apiRoute: 'https://example.com/collage',
    });

    expect(entry.conditionDetail.damage_items[0].placement.asset_location).toBe(
      'top lid rear-left',
    );
    expect(entry.identifiers.barcode.present).toBe(true);
    expect(entry.identifiers.stickers).toHaveLength(1);
    expect(entry.identifiers.stickers[0].sticker_type).toBe('brand');
  });

  it('uses condition summary when asset description is missing', () => {
    const entry = mapAnalysisResponse(
      {
        ...COLLAGE_API,
        asset: { name: 'Example laptop', brand: 'Dell' },
        condition: { grade: 'Fair', summary: 'White laptop with minor lid wear.' },
      },
      {
        processingMode: 'collage',
        apiRoute: 'https://example.com/collage',
      },
    );
    expect(entry.asset_description).toBe('White laptop with minor lid wear.');
  });

  it('falls back to local previews when API sends no upload base64', () => {
    const entry = mapAnalysisResponse(
      { ...COLLAGE_API, images_base64: undefined },
      {
        fallbackPreviewUrls: ['blob:local-1', 'blob:local-2'],
        processingMode: 'collage',
        apiRoute: 'https://example.com/collage',
      },
    );
    expect(entry.previewUrls).toEqual(['blob:local-1', 'blob:local-2']);
  });
});
