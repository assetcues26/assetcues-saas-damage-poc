/**
 * Build mobile asset-create QR URL (isolated from /scan/* capture sessions).
 * @param {string} token
 * @param {'images_only' | 'full_mobile'} [mode]
 */
export function buildAssetCreateScanUrl(token, mode = 'full_mobile') {
  const configured = import.meta.env.VITE_APP_BASE_URL?.trim();
  const base = configured || (typeof window !== 'undefined' ? window.location.origin : '');
  if (!base || !token) return null;
  const path =
    mode === 'images_only'
      ? `/assets/create/mobile/${encodeURIComponent(token)}/photos`
      : `/assets/create/mobile/${encodeURIComponent(token)}`;
  return new URL(path, base.replace(/\/$/, '')).href;
}
