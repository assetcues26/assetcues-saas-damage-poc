import { ASSET_ANALYSIS_API_BASE } from '../config/api';
import { DEFAULT_MARKET_REGION, getMarketConfig } from '../constants/markets';

import { formatApiErrorMessage } from '../utils/apiErrorMessage';

import { prepareImagesForUpload, sumSessionImageBytes } from '../utils/imageCompression';



const SESSIONS_BASE = `${ASSET_ANALYSIS_API_BASE}/v1/sessions`;

const UPLOAD_TIMEOUT_MS = 90_000;
const ANALYZE_TIMEOUT_MS = 90_000;

let activeAnalyzeController = null;

export function abortActiveSessionAnalyze() {
  if (activeAnalyzeController) {
    activeAnalyzeController.abort();
    activeAnalyzeController = null;
  }
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function sessionHeaders() {

  const headers = { Accept: 'application/json' };

  const demoKey = import.meta.env.VITE_DEMO_API_KEY?.trim();

  if (demoKey) {

    headers['X-Demo-Key'] = demoKey;

  }

  return headers;

}



async function parseJsonResponse(response) {

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {

    return response.json();

  }

  const text = await response.text();

  try {

    return JSON.parse(text);

  } catch {

    return { message: text || response.statusText };

  }

}



/**

 * @param {{ processing_mode: string }} body

 */

export async function createCaptureSession(body) {

  const response = await fetch(SESSIONS_BASE, {

    method: 'POST',

    headers: { ...sessionHeaders(), 'Content-Type': 'application/json' },

    body: JSON.stringify(body),

  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {

    throw new Error(formatApiErrorMessage(data, response.status));

  }

  return data;

}



/**

 * @param {string} token

 */

export async function fetchCaptureSession(token) {

  const response = await fetch(`${SESSIONS_BASE}/${encodeURIComponent(token)}`, {

    headers: sessionHeaders(),

  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {

    throw new Error(formatApiErrorMessage(data, response.status));

  }

  return data;

}



/**

 * @param {string} token

 * @param {File | File[]} files

 * @param {'laptop' | 'mobile'} source

 */

export async function uploadSessionImages(token, files, source = 'mobile') {
  const list = Array.isArray(files) ? files : [files];
  const formData = new FormData();

  for (const file of list) {
    formData.append('images', file, file.name || 'image.jpg');
  }
  formData.append('source', source);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(`${SESSIONS_BASE}/${encodeURIComponent(token)}/images`, {
      method: 'POST',
      headers: sessionHeaders(),
      body: formData,
      signal: controller.signal,
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(formatApiErrorMessage(data, response.status));
    }
    return data;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Upload timed out — try fewer photos or a stronger connection.');
    }
    if (err?.name === 'TypeError') {
      throw new Error('Network error — check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}



/**

 * Compress files to fit batch budget, then upload to session.

 *

 * @param {string} token

 * @param {File | File[]} files

 * @param {'laptop' | 'mobile'} source

 * @param {{ existingBytes?: number, sessionImages?: Array<{ byte_size?: number | null }> }} [options]

 */

export async function uploadSessionImagesPrepared(token, files, source = 'mobile', options = {}) {
  const list = Array.isArray(files) ? files : [files];
  const sequential = options.sequential ?? (source === 'mobile' && isMobileDevice());
  const onProgress = options.onProgress;
  let existingBytes = options.existingBytes ?? sumSessionImageBytes(options.sessionImages);

  if (!sequential || list.length <= 1) {
    onProgress?.({ phase: 'compress', current: 1, total: 1 });
    const prepared = await prepareImagesForUpload(list, {
      existingBytes,
      mobile: source === 'mobile',
      fast: options.fast ?? source === 'mobile',
    });
    onProgress?.({ phase: 'upload', current: 1, total: 1 });
    return uploadSessionImages(token, prepared, source);
  }

  onProgress?.({ phase: 'compress', current: 0, total: list.length });
  const prepared = [];
  for (let i = 0; i < list.length; i += 1) {
    const batch = await prepareImagesForUpload(list[i], { existingBytes, mobile: true });
    prepared.push(batch[0]);
    existingBytes += batch[0].size;
    onProgress?.({ phase: 'compress', current: i + 1, total: list.length });
  }

  let lastResult;
  for (let i = 0; i < prepared.length; i += 1) {
    onProgress?.({ phase: 'upload', current: i + 1, total: prepared.length });
    lastResult = await uploadSessionImages(token, prepared[i], source);
  }
  return lastResult;
}



/**

 * @param {string} token

 * @param {string} imageId

 */

export async function deleteSessionImage(token, imageId) {

  const response = await fetch(

    `${SESSIONS_BASE}/${encodeURIComponent(token)}/images/${encodeURIComponent(imageId)}`,

    { method: 'DELETE', headers: sessionHeaders() },

  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {

    throw new Error(formatApiErrorMessage(data, response.status));

  }

  return data;

}



/**

 * @param {string} token

 * @param {{ locale?: string, marketRegion?: string }} [options]

 */

export async function analyzeCaptureSession(token, options = {}) {
  abortActiveSessionAnalyze();
  const controller = new AbortController();
  activeAnalyzeController = controller;
  const signal = options.signal || controller.signal;

  const marketRegion = (options.marketRegion || DEFAULT_MARKET_REGION).toUpperCase();
  const market = getMarketConfig(marketRegion);
  const formData = new FormData();
  formData.append('locale', options.locale || market.locale);
  formData.append('market_region', marketRegion);

  const timeoutId = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

  try {
    const response = await fetch(`${SESSIONS_BASE}/${encodeURIComponent(token)}/analyze`, {
      method: 'POST',
      headers: sessionHeaders(),
      body: formData,
      signal,
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(formatApiErrorMessage(data, response.status));
    }
    return data;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Analysis cancelled or timed out.');
    }
    if (err?.name === 'TypeError') {
      throw new Error('Network error during analysis — check your connection.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (activeAnalyzeController === controller) {
      activeAnalyzeController = null;
    }
  }
}

/**
 * Stop an in-flight analyze request and unlock the session on the server.
 *
 * @param {string} token
 * @param {{ clearImages?: boolean }} [options]
 */
export async function cancelCaptureSessionAnalysis(token, options = {}) {
  abortActiveSessionAnalyze();
  const response = await fetch(`${SESSIONS_BASE}/${encodeURIComponent(token)}/cancel`, {
    method: 'POST',
    headers: { ...sessionHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ clear_images: Boolean(options.clearImages) }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(data, response.status));
  }
  return data;
}



export function isSessionUnavailableError(err) {
  const message = err?.message || '';
  return message.includes('503') || message.toLowerCase().includes('not configured');
}

export function isSessionNotFoundError(err) {
  const message = (err?.message || '').toLowerCase();
  return message.includes('not found') || message.includes('404');
}

