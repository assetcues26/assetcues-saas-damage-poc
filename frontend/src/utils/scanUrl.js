/**
 * Public HTTPS URL for mobile QR scan flow.
 * @param {string} token
 * @returns {string | null}
 */
export function buildScanUrl(token) {
  if (!token) return null;
  const base = import.meta.env.VITE_APP_BASE_URL?.trim();
  if (base) {
    return new URL(`/scan/${encodeURIComponent(token)}`, base.replace(/\/$/, '')).href;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(`/scan/${encodeURIComponent(token)}`, window.location.origin).href;
  }
  return null;
}
