import { DEFAULT_MARKET_REGION } from '../constants/markets';

const STORAGE_KEY = 'assetcues_market_region';

export function readStoredMarketRegion() {
  if (typeof localStorage === 'undefined') return DEFAULT_MARKET_REGION;
  const stored = localStorage.getItem(STORAGE_KEY)?.trim().toUpperCase();
  if (stored === 'IN' || stored === 'US' || stored === 'GB') return stored;
  return DEFAULT_MARKET_REGION;
}

export function writeStoredMarketRegion(region) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, region);
}
