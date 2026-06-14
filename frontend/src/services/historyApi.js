import { ASSET_ANALYSIS_API_BASE } from '../config/api';
import { formatApiErrorMessage } from '../utils/apiErrorMessage';
import { mapAnalysisResponse } from '../utils/mapAnalysisResponse';

const HISTORY_BASE = `${ASSET_ANALYSIS_API_BASE}/v1/history`;

function historyHeaders() {
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
 * @param {{ limit?: number, offset?: number, q?: string }} [params]
 */
export async function fetchHistoryList(params = {}) {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.q) search.set('q', params.q);

  const url = search.toString() ? `${HISTORY_BASE}?${search}` : HISTORY_BASE;
  const response = await fetch(url, { headers: historyHeaders() });
  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }

  return body;
}

/**
 * @param {string} entryId
 */
export async function fetchHistoryEntry(entryId) {
  const response = await fetch(`${HISTORY_BASE}/${encodeURIComponent(entryId)}`, {
    headers: historyHeaders(),
  });
  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }

  return body;
}

/**
 * @param {string} entryId
 */
export async function deleteHistoryEntry(entryId) {
  const response = await fetch(`${HISTORY_BASE}/${encodeURIComponent(entryId)}`, {
    method: 'DELETE',
    headers: historyHeaders(),
  });
  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(formatApiErrorMessage(body, response.status));
  }

  return body;
}

/**
 * True when an entry has full report fields (not a summary list row).
 * @param {object | null | undefined} entry
 */
export function isFullHistoryEntry(entry) {
  if (!entry) return false;
  if (entry.conditionDetail || entry.apiResponse) return true;
  return Boolean(
    entry.asset_condition &&
      entry.asset_condition !== '—' &&
      entry.asset_description &&
      entry.asset_description !== '—',
  );
}

/**
 * Map list API row to summary entry for history cards.
 * @param {object} item
 */
export function hydrateListItem(item) {
  const processedAt = item.processed_at || new Date().toISOString();
  const previewUrls = item.preview_url ? [item.preview_url] : [];

  return {
    id: item.entry_id,
    request_id: item.request_id,
    processedAt,
    asset_name: item.asset_name || 'Unknown asset',
    condition: item.condition_grade || null,
    detected_tag_number_raw: item.asset_tag || '—',
    images_analyzed: item.images_analyzed ?? 0,
    analysis_method: item.analysis_method,
    processingMode: item.processing_mode,
    previewUrls,
    mergedImageUrl: null,
  };
}

/**
 * Map detail API row to full app entry shape.
 * @param {object} detail
 */
export function hydrateEntry(detail) {
  const resultJson = detail.result_json || {};
  const imageUrls = detail.image_urls || resultJson.image_urls || {};
  const api = {
    ...resultJson,
    request_id: detail.request_id || resultJson.request_id,
    image_urls: imageUrls,
    entry_id: detail.entry_id,
    saved_to_db: true,
  };

  const entry = mapAnalysisResponse(api, {
    fallbackPreviewUrls: imageUrls.preview_urls || [],
    processingMode: resultJson.processing_mode || 'collage',
    apiRoute: resultJson.api_route || '',
  });

  return {
    ...entry,
    id: detail.entry_id || entry.request_id,
    processedAt: detail.processed_at || resultJson.processed_at || new Date().toISOString(),
    saved_to_db: true,
  };
}

/**
 * Returns true when history API is expected to be available (503 = not configured).
 * @param {Error} err
 */
export function isHistoryUnavailableError(err) {
  const message = err?.message || '';
  return message.includes('503') || message.toLowerCase().includes('not configured');
}
