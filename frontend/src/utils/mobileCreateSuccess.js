const STORAGE_PREFIX = 'assetcues.mobileCreate.done.';

/**
 * @typedef {{
 *   assetId: string,
 *   assetTag?: string,
 *   assetName?: string,
 *   aiStatus?: string,
 * }} MobileCreateSuccess
 */

/**
 * @param {string} token
 * @param {MobileCreateSuccess} payload
 */
export function persistMobileCreateSuccess(token, payload) {
  if (!token || !payload?.assetId) return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${token}`, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

/**
 * @param {string | undefined} token
 * @returns {MobileCreateSuccess | null}
 */
export function readMobileCreateSuccess(token) {
  if (!token) return null;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${token}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
