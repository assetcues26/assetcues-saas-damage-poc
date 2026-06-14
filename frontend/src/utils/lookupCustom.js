export const CUSTOM_LOOKUP_VALUE = '__custom__';

export function buildCustomLookupId(label) {
  const slug = String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `custom-${slug || 'entry'}-${Date.now()}`;
}

export function isCustomLookupId(id) {
  return String(id || '').startsWith('custom-');
}

/**
 * Assign the next available lookup id for custom entries.
 * @param {string} type
 * @param {Array<{ id: string }>} items
 * @param {string} label
 */
export function allocateCustomLookupId(type, items, label) {
  const ids = new Set((items || []).map((item) => String(item.id)));
  const numeric = (items || [])
    .map((item) => Number.parseInt(String(item.id), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (type === 'company' || numeric.length > 0) {
    let candidate = (numeric.length ? Math.max(...numeric) : 0) + 1000;
    while (ids.has(String(candidate))) {
      candidate += 1000;
    }
    return String(candidate);
  }

  let candidate = buildCustomLookupId(label);
  while (ids.has(candidate)) {
    candidate = buildCustomLookupId(label);
  }
  return candidate;
}
