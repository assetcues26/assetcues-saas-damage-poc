const INVALID_TAG_RAW = new Set([
  'UNREADABLE',
  'NONE',
  'N/A',
  'NOT VISIBLE',
  'NOT FOUND',
  'NO TAG',
  'NOT DETECTED',
  '—',
]);

export function hasAssetTag(identifiers) {
  if (identifiers?.asset_tag_number) return true;
  const raw = String(identifiers?.asset_tag_number_raw || '').trim().toUpperCase();
  return Boolean(raw) && !INVALID_TAG_RAW.has(raw);
}

/** @returns {'readable' | 'unreadable' | 'none'} */
export function tagReadabilityStatus(identifiers) {
  if (identifiers?.tag_readable === true) return 'readable';
  if (!hasAssetTag(identifiers) && !identifiers?.barcode?.present) return 'none';
  return 'unreadable';
}

export function tagReadabilityLabel(identifiers) {
  const status = tagReadabilityStatus(identifiers);
  if (status === 'readable') return 'Tag readable';
  if (status === 'unreadable') return 'Tag unreadable';
  return 'No tag detected';
}

export function imageReadabilityText(identifiers) {
  const status = tagReadabilityStatus(identifiers);
  if (status === 'readable') return 'Readable';
  if (status === 'unreadable') return 'Unreadable';
  return 'No tag detected';
}

export function tagReadableGridValue(identifiers) {
  const status = tagReadabilityStatus(identifiers);
  if (status === 'readable') return 'Yes';
  if (status === 'none') return 'Not detected';
  return 'No';
}
