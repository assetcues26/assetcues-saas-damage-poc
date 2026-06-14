/** ERP catalog fallback — mirrors backend demo_catalog.json after FAR enrichment. */

import fallbackCatalog from './erpCatalogFallback.json';

export const ERP_CATALOG = fallbackCatalog;

export function getCatalogAsset(catalogId) {
  return ERP_CATALOG.find((a) => a.catalog_id === catalogId) ?? null;
}

export function catalogToContext(asset) {
  if (!asset) return null;
  return { ...asset };
}

export function formatInr(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}
