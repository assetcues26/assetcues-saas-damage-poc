import { ASSET_ANALYSIS_API_BASE } from '../config/api';
import { formatApiErrorMessage } from '../utils/apiErrorMessage';

const SAAS_BASE = `${ASSET_ANALYSIS_API_BASE}/v1/saas`;

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

/**
 * @param {Record<string, string|number|undefined>} metadata
 * @param {File} assetImage
 * @param {File} [barcodeImage]
 */
export async function createSaasAsset(metadata, assetImage, barcodeImage) {
  const form = new FormData();
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  });
  form.append('assetimage', assetImage);
  if (barcodeImage) {
    form.append('barcodeimage', barcodeImage);
  }

  const response = await fetch(`${SAAS_BASE}/assets`, {
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
  const response = await fetch(`${SAAS_BASE}/assets/${encodeURIComponent(assetId)}/analyze`, {
    method: 'POST',
    headers: saasHeaders(),
  });
  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }
  return body;
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
 * @param {'assetimage'|'barcodeimage'} fieldName
 * @param {File} file
 */
export async function uploadAssetCreateSessionImage(token, fieldName, file) {
  const form = new FormData();
  form.append(fieldName, file);

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
 */
export async function completeAssetCreateSession(token, metadata) {
  const form = new FormData();
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  });

  const response = await fetch(
    `${SAAS_BASE}/asset-sessions/${encodeURIComponent(token)}/complete`,
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

export async function fetchActivity(limit = 30) {
  const response = await fetch(`${SAAS_BASE}/activity?limit=${limit}`, { headers: saasHeaders() });
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
