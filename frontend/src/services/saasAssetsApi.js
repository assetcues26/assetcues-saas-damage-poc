import { ASSET_ANALYSIS_API_BASE } from '../config/api';
import { formatApiErrorMessage } from '../utils/apiErrorMessage';
import { prepareSaasPhotoForUpload } from '../utils/imageCompression';
import { withUploadRetries } from '../utils/uploadRetry';

const SAAS_BASE = `${ASSET_ANALYSIS_API_BASE}/v1/saas`;
const UPLOAD_TIMEOUT_MS = 120_000;
const ANALYZE_TIMEOUT_MS = 300_000;

function saasHeaders() {
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
 * @param {{ limit?: number, offset?: number, q?: string, ai_status?: string, company?: string, sort?: string, order?: string }} [params]
 */
export async function fetchSaasAssetsList(params = {}) {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.q) search.set('q', params.q);
  if (params.ai_status) search.set('ai_status', params.ai_status);
  if (params.company) search.set('company', params.company);
  if (params.sort) search.set('sort', params.sort);
  if (params.order) search.set('order', params.order);

  const url = search.toString() ? `${SAAS_BASE}/assets?${search}` : `${SAAS_BASE}/assets`;
  const response = await fetch(url, { headers: saasHeaders() });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function fetchSaasAsset(assetId) {
  const response = await fetch(`${SAAS_BASE}/assets/${encodeURIComponent(assetId)}`, {
    headers: saasHeaders(),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

async function prepareSaasUploadFiles(files = {}, onProgress) {
  const prepared = {};
  if (files.assetImage) {
    onProgress?.('preparing');
    prepared.assetImage = await prepareSaasPhotoForUpload(files.assetImage);
  }
  if (files.barcodeImage) {
    onProgress?.('preparing');
    prepared.barcodeImage = await prepareSaasPhotoForUpload(files.barcodeImage);
  }
  return prepared;
}

function formatUploadNetworkError(err) {
  if (err?.name === 'AbortError') {
    return 'Upload timed out — try a smaller photo or check your connection.';
  }
  if (err?.name === 'TypeError') {
    const base = ASSET_ANALYSIS_API_BASE;
    return `Cannot reach the API (${base}) — check that the backend is running and VITE_ASSET_ANALYSIS_API_BASE is correct.`;
  }
  return err instanceof Error ? err.message : 'Upload failed';
}

async function postSaasUpload(url, requestBody, onProgress) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  onProgress?.('uploading');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: saasHeaders(),
      body: requestBody,
      signal: controller.signal,
    });
    const body = await parseJsonResponse(response);
    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        throw new Error(
          'Photo upload API is unavailable — restart the backend (port 8000) or redeploy the latest backend on Vercel.',
        );
      }
      throw new Error(formatApiErrorMessage(body, response.status));
    }
    return body;
  } catch (err) {
    throw new Error(formatUploadNetworkError(err));
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * @param {Record<string, string|number|undefined>} metadata
 * @param {File} assetImage
 * @param {File} [barcodeImage]
 * @param {{ autoAnalyze?: boolean, skipAi?: boolean }} [options]
 */
export async function createSaasAsset(metadata, assetImage, barcodeImage, options = {}) {
  const compressedAsset = await prepareSaasPhotoForUpload(assetImage);
  const compressedBarcode = barcodeImage
    ? await prepareSaasPhotoForUpload(barcodeImage)
    : undefined;

  const form = new FormData();
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  });
  form.append('assetimage', compressedAsset);
  if (compressedBarcode) {
    form.append('barcodeimage', compressedBarcode);
  }

  const search = new URLSearchParams();
  if (options.autoAnalyze === false) {
    search.set('auto_analyze', 'false');
  }
  if (options.skipAi) {
    search.set('skip_ai', 'true');
  }

  const response = await fetch(`${SAAS_BASE}/assets?${search}`, {
    method: 'POST',
    headers: saasHeaders(),
    body: form,
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function runSaasAssetAnalysis(assetId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${SAAS_BASE}/assets/${encodeURIComponent(assetId)}/analyze`,
      {
        method: 'POST',
        headers: saasHeaders(),
        signal: controller.signal,
      },
    );
    const body = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(formatApiErrorMessage(body, response.status));
    }
    return body;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchSaasAssetAnalyses(assetId) {
  const response = await fetch(
    `${SAAS_BASE}/assets/${encodeURIComponent(assetId)}/analyses`,
    { headers: saasHeaders() },
  );
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function fetchSaasAssetAnalysis(assetId, analysisId) {
  const response = await fetch(
    `${SAAS_BASE}/assets/${encodeURIComponent(assetId)}/analyses/${encodeURIComponent(analysisId)}`,
    { headers: saasHeaders() },
  );
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function createAssetCreateSession(draftJson = {}) {
  const response = await fetch(`${SAAS_BASE}/asset-sessions`, {
    method: 'POST',
    headers: { ...saasHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft_json: draftJson }),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function fetchAssetCreateSession(token) {
  const response = await fetch(
    `${SAAS_BASE}/asset-sessions/${encodeURIComponent(token)}`,
    { headers: saasHeaders() },
  );
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

/**
 * @param {string} token
 * @param {Record<string, unknown>} draftJson
 */
export async function saveAssetCreateSessionDraft(token, draftJson) {
  const response = await fetch(
    `${SAAS_BASE}/asset-sessions/${encodeURIComponent(token)}/draft`,
    {
      method: 'PATCH',
      headers: { ...saasHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_json: draftJson }),
    },
  );
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

/**
 * @param {string} token
 * @param {'assetimage'|'barcodeimage'} fieldName
 * @param {File} file
 */
export async function uploadAssetCreateSessionImage(token, fieldName, file) {
  const prepared = await prepareSaasPhotoForUpload(file);
  const form = new FormData();
  form.append(fieldName, prepared);

  const response = await fetch(
    `${SAAS_BASE}/asset-sessions/${encodeURIComponent(token)}/images`,
    {
      method: 'POST',
      headers: saasHeaders(),
      body: form,
    },
  );
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

/**
 * @param {string} token
 * @param {Record<string, string|number|undefined>} metadata
 * @param {{ autoAnalyze?: boolean, skipAi?: boolean }} [options]
 */
export async function completeAssetCreateSession(token, metadata, options = {}) {
  const form = new FormData();
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  });

  const search = new URLSearchParams();
  if (options.autoAnalyze === false) {
    search.set('auto_analyze', 'false');
  }
  if (options.skipAi) {
    search.set('skip_ai', 'true');
  }

  const response = await fetch(
    `${SAAS_BASE}/asset-sessions/${encodeURIComponent(token)}/complete?${search}`,
    {
      method: 'POST',
      headers: saasHeaders(),
      body: form,
    },
  );
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function fetchLookups(type, parentId) {
  const search = new URLSearchParams({ type });
  if (parentId) search.set('parent_id', parentId);
  const response = await fetch(`${SAAS_BASE}/lookups?${search}`, { headers: saasHeaders() });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function fetchDashboardStats() {
  const response = await fetch(`${SAAS_BASE}/assets/stats`, { headers: saasHeaders() });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

/**
 * @returns {Promise<{ assetid: string, assetnumber: string }>}
 */
export async function fetchNextAssetIdentifiers() {
  const response = await fetch(`${SAAS_BASE}/assets/next-identifiers`, { headers: saasHeaders() });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function clearAllSaasAnalyses() {
  const response = await fetch(`${SAAS_BASE}/analyses`, {
    method: 'DELETE',
    headers: saasHeaders(),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function fetchActivity(limit = 30) {
  const response = await fetch(`${SAAS_BASE}/activity?limit=${limit}`, { headers: saasHeaders() });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function registerSaasAsset(metadata) {
  const response = await fetch(`${SAAS_BASE}/assets/register`, {
    method: 'POST',
    headers: { ...saasHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function updateSaasAsset(assetId, metadata, options = {}) {
  const search = options.reanalyze ? '?reanalyze=true' : '';
  const response = await fetch(`${SAAS_BASE}/assets/${encodeURIComponent(assetId)}${search}`, {
    method: 'PATCH',
    headers: { ...saasHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

/**
 * @param {string} assetId
 * @param {{ assetImage?: File, barcodeImage?: File }} files
 * @param {{ reanalyze?: boolean, sessionToken?: string, onProgress?: (phase: 'preparing' | 'uploading') => void }} [options]
 */
export async function uploadSaasAssetImages(assetId, files, options = {}) {
  const search = new URLSearchParams();
  if (options.reanalyze === false) search.set('reanalyze', 'false');
  if (options.sessionToken) search.set('session_token', options.sessionToken);

  const hasFiles = Boolean(files?.assetImage || files?.barcodeImage);
  const hasSession = Boolean(options.sessionToken);
  if (!hasFiles && !hasSession) {
    throw new Error('No photos to upload — add an asset image first.');
  }

  const query = search.toString() ? `?${search}` : '';
  const url = `${SAAS_BASE}/assets/${encodeURIComponent(assetId)}/images${query}`;

  return withUploadRetries(async () => {
    let requestBody;
    if (hasFiles) {
      const prepared = await prepareSaasUploadFiles(files, options.onProgress);
      const form = new FormData();
      if (prepared.assetImage) form.append('assetimage', prepared.assetImage);
      if (prepared.barcodeImage) form.append('barcodeimage', prepared.barcodeImage);
      requestBody = form;
    }

    return postSaasUpload(url, requestBody, options.onProgress);
  });
}

/**
 * @param {string} assetId
 * @param {'asset' | 'barcode'} kind
 */
export async function deleteSaasAssetImage(assetId, kind) {
  const response = await fetch(
    `${SAAS_BASE}/assets/${encodeURIComponent(assetId)}/images?kind=${encodeURIComponent(kind)}`,
    {
      method: 'DELETE',
      headers: saasHeaders(),
    },
  );
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function deleteSaasAsset(assetId) {
  const response = await fetch(`${SAAS_BASE}/assets/${encodeURIComponent(assetId)}`, {
    method: 'DELETE',
    headers: saasHeaders(),
  });
  if (!response.ok) {
    const body = await parseJsonResponse(response);
    throw new Error(formatApiErrorMessage(body, response.status));
  }
}

export async function bulkDeleteSaasAssets(assetIds) {
  const response = await fetch(`${SAAS_BASE}/assets/bulk-delete`, {
    method: 'POST',
    headers: { ...saasHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset_ids: assetIds }),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function bulkAnalyzeSaasAssets(assetIds) {
  const response = await fetch(`${SAAS_BASE}/assets/bulk-analyze`, {
    method: 'POST',
    headers: { ...saasHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset_ids: assetIds }),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function analyzeSaasAssetWithPatch(assetId, metadataPatch) {
  const response = await fetch(`${SAAS_BASE}/assets/${encodeURIComponent(assetId)}/analyze`, {
    method: 'POST',
    headers: { ...saasHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata_patch: metadataPatch }),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

/**
 * @param {{ q?: string, ai_status?: string, company?: string }} [filters]
 */
export async function exportAssetsCsv(filters = {}) {
  const search = new URLSearchParams();
  if (filters.q) search.set('q', filters.q);
  if (filters.ai_status) search.set('ai_status', filters.ai_status);
  if (filters.company) search.set('company', filters.company);
  const url = search.toString()
    ? `${SAAS_BASE}/assets/export.csv?${search}`
    : `${SAAS_BASE}/assets/export.csv`;
  const response = await fetch(url, { headers: saasHeaders() });
  if (!response.ok) {
    const body = await parseJsonResponse(response);
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return response.blob();
}

export async function fetchWebDrafts() {
  const response = await fetch(`${SAAS_BASE}/drafts`, { headers: saasHeaders() });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function fetchWebDraft(draftId) {
  const response = await fetch(`${SAAS_BASE}/drafts/${encodeURIComponent(draftId)}`, {
    headers: saasHeaders(),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function saveWebDraft(draftJson, options = {}) {
  const search = options.draftId ? `?draft_id=${encodeURIComponent(options.draftId)}` : '';
  const response = await fetch(`${SAAS_BASE}/drafts${search}`, {
    method: 'POST',
    headers: { ...saasHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: options.title,
      draft_json: draftJson,
      asset_image_path: options.assetImagePath,
      barcode_image_path: options.barcodeImagePath,
    }),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
}

export async function deleteWebDraft(draftId) {
  const response = await fetch(`${SAAS_BASE}/drafts/${encodeURIComponent(draftId)}`, {
    method: 'DELETE',
    headers: saasHeaders(),
  });
  if (!response.ok) {
    const body = await parseJsonResponse(response);
    throw new Error(formatApiErrorMessage(body, response.status));
  }
}
