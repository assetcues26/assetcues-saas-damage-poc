/** Supported market regions for valuation and currency display. */

export const MARKET_REGIONS = {
  IN: {
    id: 'IN',
    label: 'India',
    currency: 'INR',
    symbol: '₹',
    locale: 'en-IN',
    subtitle: 'India market estimates in rupees (₹)',
  },
  US: {
    id: 'US',
    label: 'United States',
    currency: 'USD',
    symbol: '$',
    locale: 'en-US',
    subtitle: 'US market estimates in dollars ($)',
  },
  GB: {
    id: 'GB',
    label: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    locale: 'en-GB',
    subtitle: 'UK market estimates in pounds (£)',
  },
};

export const MARKET_OPTIONS = Object.values(MARKET_REGIONS);

function readEnvDefaultMarketRegion() {
  const raw = import.meta.env.VITE_DEFAULT_MARKET_REGION?.trim().toUpperCase();
  if (raw === 'IN' || raw === 'US' || raw === 'GB') return raw;
  return 'IN';
}

/** Default region for new users (VITE_DEFAULT_MARKET_REGION on Vercel / .env.local). */
export const DEFAULT_MARKET_REGION = readEnvDefaultMarketRegion();

export function getMarketConfig(region) {
  const key = (region || DEFAULT_MARKET_REGION).toUpperCase();
  return MARKET_REGIONS[key] || MARKET_REGIONS[DEFAULT_MARKET_REGION] || MARKET_REGIONS.IN;
}
