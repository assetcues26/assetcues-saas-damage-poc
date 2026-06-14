/**
 * Stable identity for a storage image — ignores rotating signed-URL query tokens.
 * @param {string | null | undefined} urlOrPath
 */
export function stableStorageImageKey(urlOrPath) {
  if (!urlOrPath) return null;
  const value = String(urlOrPath).trim();
  if (!value) return null;

  if (!value.startsWith('http')) {
    return value;
  }

  try {
    return new URL(value).pathname;
  } catch {
    return value.split('?')[0] || null;
  }
}
