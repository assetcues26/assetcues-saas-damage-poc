import { fetchNextAssetIdentifiers } from '../services/saasAssetsApi';

export const AUTO_IDENTIFIER_KEYS = ['assetid', 'assetnumber'];

/**
 * Fill empty unique identity fields with server-suggested values.
 * @param {Record<string, string>} values
 * @param {{ assetid?: string, assetnumber?: string } | null | undefined} identifiers
 */
export function applyAutoIdentifiers(values, identifiers) {
  if (!identifiers) return values;
  const next = { ...values };
  for (const key of AUTO_IDENTIFIER_KEYS) {
    if (!String(next[key] || '').trim() && identifiers[key]) {
      next[key] = identifiers[key];
    }
  }
  return next;
}

/**
 * @param {() => void} setValues — React setState for form values
 * @param {Record<string, unknown> | null | undefined} draftJson — optional session/draft to merge first
 * @param {{ enabled?: boolean, mergeDraft?: (prev: Record<string, string>, draft: Record<string, unknown>) => Record<string, string> }} [options]
 */
export function prefetchAutoIdentifiers(setValues, draftJson, options = {}) {
  const { enabled = true, mergeDraft } = options;
  if (!enabled) return () => {};

  let cancelled = false;
  fetchNextAssetIdentifiers()
    .then((identifiers) => {
      if (cancelled) return;
      setValues((prev) => {
        const base = mergeDraft && draftJson ? mergeDraft(prev, draftJson) : prev;
        return applyAutoIdentifiers(base, identifiers);
      });
    })
    .catch(() => {});

  return () => {
    cancelled = true;
  };
}
