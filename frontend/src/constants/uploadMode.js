import { ASSET_ANALYSIS_ENDPOINTS } from '../config/api';

/** @typedef {'collage' | 'direct'} UploadProcessingMode */

/** Collage = single collage sent to API; direct = multi-image endpoint. */
export const UPLOAD_PROCESSING_MODES = {
  COLLAGE: 'collage',
  DIRECT: 'direct',
};

export const UPLOAD_MODE_LABELS = {
  [UPLOAD_PROCESSING_MODES.COLLAGE]: 'Combined view (collage)',
  [UPLOAD_PROCESSING_MODES.DIRECT]: 'Multi-angle (recommended)',
};

export const UPLOAD_MODE_API_ROUTES = {
  [UPLOAD_PROCESSING_MODES.COLLAGE]: ASSET_ANALYSIS_ENDPOINTS.collage,
  [UPLOAD_PROCESSING_MODES.DIRECT]: ASSET_ANALYSIS_ENDPOINTS.multi,
};

export function isValidUploadMode(value) {
  return (
    value === UPLOAD_PROCESSING_MODES.COLLAGE || value === UPLOAD_PROCESSING_MODES.DIRECT
  );
}

/** In-memory default only — no browser storage (demo: each run is fresh). */
export function readStoredUploadMode() {
  return UPLOAD_PROCESSING_MODES.DIRECT;
}
