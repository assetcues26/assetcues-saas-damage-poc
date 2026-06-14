import { ASSET_ANALYSIS_API_BASE } from '../config/api';
import { formatApiErrorMessage } from '../utils/apiErrorMessage';

const DEMO_BASE = `${ASSET_ANALYSIS_API_BASE}/v1/demo`;

function demoHeaders() {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
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
 * Safely wipe demo user data (rows + storage). Schema and tables are untouched.
 */
export async function clearDemoDatabase() {
  const response = await fetch(`${DEMO_BASE}/clear-data`, {
    method: 'POST',
    headers: demoHeaders(),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatApiErrorMessage(data, response.status));
  }
  return data;
}

export function isDemoMaintenanceUnavailableError(err) {
  const message = err?.message || '';
  return message.includes('503') || message.toLowerCase().includes('not configured');
}
