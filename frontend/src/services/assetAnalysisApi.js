import { DEFAULT_MARKET_REGION, getMarketConfig } from '../constants/markets';
import {
  UPLOAD_MODE_API_ROUTES,
  UPLOAD_PROCESSING_MODES,
} from '../constants/uploadMode';
import { formatApiErrorMessage } from '../utils/apiErrorMessage';

const DEFAULT_LOCALE = 'en';
const ANALYZE_TIMEOUT_MS = 90_000;

let activeLocalAnalyzeController = null;

function analysisHeaders() {
  const headers = {};
  const demoKey = import.meta.env.VITE_DEMO_API_KEY?.trim();
  if (demoKey) {
    headers['X-Demo-Key'] = demoKey;
  }
  return headers;
}

export function abortActiveLocalAnalyze() {
  if (activeLocalAnalyzeController) {
    activeLocalAnalyzeController.abort();
    activeLocalAnalyzeController = null;
  }
}

/**
 * @param {import('../constants/uploadMode').UploadProcessingMode} processingMode
 */
export function resolveAnalysisEndpoint(processingMode) {
  return (
    UPLOAD_MODE_API_ROUTES[processingMode] ??
    UPLOAD_MODE_API_ROUTES[UPLOAD_PROCESSING_MODES.COLLAGE]
  );
}

/**
 * @param {Array<{ file?: File, name?: string }>} images
 * @param {import('../constants/uploadMode').UploadProcessingMode} processingMode
 * @param {{ locale?: string, marketRegion?: string }} [options]
 */
export async function analyzeAssetsOnServer(images, processingMode, options = {}) {
  abortActiveLocalAnalyze();
  const controller = new AbortController();
  activeLocalAnalyzeController = controller;
  const signal = options.signal || controller.signal;

  const url = resolveAnalysisEndpoint(processingMode);
  const formData = new FormData();
  const marketRegion = (options.marketRegion || DEFAULT_MARKET_REGION).toUpperCase();
  const market = getMarketConfig(marketRegion);
  const locale = options.locale ?? market.locale ?? DEFAULT_LOCALE;

  for (const img of images) {
    if (!img.file) {
      throw new Error('Each image must include a file for upload');
    }
    const filename = img.name || img.file.name || 'image.jpg';
    formData.append('images', img.file, filename);
  }
  formData.append('locale', locale);
  formData.append('market_region', marketRegion);
  formData.append('processing_mode', processingMode);

  const timeoutId = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: analysisHeaders(),
      body: formData,
      signal,
    });

    let body = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      const text = await response.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text || response.statusText };
      }
    }

    if (!response.ok) {
      throw new Error(formatApiErrorMessage(body, response.status));
    }

    if (body?.status && body.status !== 'success') {
      throw new Error(body.message || `Analysis status: ${body.status}`);
    }

    return body;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Analysis cancelled or timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (activeLocalAnalyzeController === controller) {
      activeLocalAnalyzeController = null;
    }
  }
}
