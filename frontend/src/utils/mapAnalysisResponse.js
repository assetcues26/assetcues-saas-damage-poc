import { UPLOAD_PROCESSING_MODES } from '../constants/uploadMode';
import { imageReadabilityText } from './tagReadability';
import { enrichAssetAgeFields } from './assetAgeFields';
import { normalizeErpVerification } from './valuationBullets';

/**
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function normalizeCollageBase64(raw) {
  if (!raw || typeof raw !== 'string') return null;
  if (raw.startsWith('data:')) return raw;
  return `data:image/jpeg;base64,${raw}`;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeBase64ImageList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => normalizeCollageBase64(item)).filter(Boolean);
}

/**
 * Extract uploaded/source images returned by the API (base64).
 * Supports several backend field names.
 * @param {object} api
 * @returns {string[]}
 */
export function extractUploadedImagesFromApi(api) {
  if (!api || typeof api !== 'object') return [];

  const arrayFields = [
    api.images_base64,
    api.uploaded_images_base64,
    api.source_images_base64,
    api.original_images_base64,
    api.input_images_base64,
    api.uploaded_images,
  ];

  for (const field of arrayFields) {
    const urls = normalizeBase64ImageList(field);
    if (urls.length) return urls;
  }

  if (Array.isArray(api.images)) {
    const fromObjects = api.images
      .map((item) => {
        if (typeof item === 'string') return normalizeCollageBase64(item);
        if (item && typeof item === 'object') {
          return (
            normalizeCollageBase64(item.base64) ||
            normalizeCollageBase64(item.data) ||
            normalizeCollageBase64(item.image_base64) ||
            normalizeCollageBase64(item.content)
          );
        }
        return null;
      })
      .filter(Boolean);
    if (fromObjects.length) return fromObjects;
  }

  return [];
}

/**
 * @param {object} api
 * @param {{ fallbackPreviewUrls?: string[], processingMode: string }} meta
 */
export function resolveEntryImages(api, meta) {
  if (api.image_urls && typeof api.image_urls === 'object') {
    return {
      mergedImageUrl: api.image_urls.merged_image_url || null,
      previewUrls: Array.isArray(api.image_urls.preview_urls)
        ? api.image_urls.preview_urls
        : [],
    };
  }

  const collageUrl = normalizeCollageBase64(api.collage_base64);
  const apiUploads = extractUploadedImagesFromApi(api);
  const isMulti =
    api.analysis_method === 'multi_image' ||
    meta.processingMode === UPLOAD_PROCESSING_MODES.DIRECT;

  if (isMulti) {
    return {
      mergedImageUrl: null,
      previewUrls:
        apiUploads.length > 0 ? apiUploads : meta.fallbackPreviewUrls || [],
    };
  }

  // Collage: collage used for AI + original uploads from API
  if (apiUploads.length > 0) {
    return {
      mergedImageUrl: collageUrl,
      previewUrls: apiUploads,
    };
  }

  return {
    mergedImageUrl: collageUrl,
    previewUrls: meta.fallbackPreviewUrls || [],
  };
}

/**
 * Maps backend analyze response to app history/result entry shape.
 * @param {object} api
 * @param {{ fallbackPreviewUrls?: string[], processingMode: string, apiRoute: string }} meta
 */
export function mapAnalysisResponse(api, meta) {
  const asset = enrichAssetAgeFields(api.asset || {});
  const condition = api.condition || {};
  const identifiers = api.identifiers || {};
  const valuation = api.valuation || {};
  const confidence = api.confidence || {};

  const tagRaw =
    identifiers.asset_tag_number_raw ||
    identifiers.asset_tag_number ||
    asset.asset_tag_number ||
    '—';

  const { mergedImageUrl, previewUrls } = resolveEntryImages(api, meta);

  return {
    request_id: api.request_id,
    status: api.status,
    analysis_method: api.analysis_method,
    images_analyzed: api.images_analyzed,
    review_required: api.review_required,
    processing_time_ms: api.processing_time_ms,
    prompt_version: api.prompt_version,
    analysis_policy: api.analysis_policy,
    reasoning_summary: api.reasoning_summary,
    stage_timings_ms: api.stage_timings_ms,

    asset_name: asset.name || 'Unknown asset',
    condition: condition.grade || null,
    asset_condition: condition.summary || condition.cosmetic_condition || '—',
    asset_description:
      asset.description ||
      condition.summary ||
      api.reasoning_summary?.narrative ||
      '—',
    detected_tag_number_raw: tagRaw,
    barcodeposition: identifiers.tag_position || '—',
    tag_detection_reasoning: identifiers.tag_detection_reasoning || '—',
    image_readability: imageReadabilityText(identifiers),
    visible_labels: identifiers.visible_labels?.length
      ? identifiers.visible_labels
      : [asset.brand, asset.model, asset.category].filter(Boolean),

    stitching_confidence: confidence.overall ?? null,
    confidence,

    asset,
    conditionDetail: condition,
    identifiers,
    valuation,
    token_usage: api.token_usage,
    cost: api.cost,
    apiResponse: api,

    mergedImageUrl,
    previewUrls,
    processingMode: meta.processingMode,
    apiRoute: meta.apiRoute,
    erp_verification: normalizeErpVerification(api.demo_verification),
  };
}
