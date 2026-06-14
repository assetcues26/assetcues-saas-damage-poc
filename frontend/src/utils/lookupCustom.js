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
