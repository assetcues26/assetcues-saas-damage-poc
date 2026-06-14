/**
 * Public URL to open the full interactive asset report in the browser.
 * @param {{ id?: string, request_id?: string }} entry
 * @returns {string | null}
 */
export function buildAssetReportUrl(entry) {
  const id = entry?.id;
  if (!id) return null;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(`/result/${encodeURIComponent(id)}`, window.location.origin).href;
  }

  const base = import.meta.env.VITE_APP_BASE_URL;
  if (base) {
    return new URL(`/result/${encodeURIComponent(id)}`, base).href;
  }

  return null;
}
