import { describe, it, expect, vi, afterEach } from 'vitest';

describe('DEFAULT_MARKET_REGION env', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses VITE_DEFAULT_MARKET_REGION when set to US', async () => {
    vi.stubEnv('VITE_DEFAULT_MARKET_REGION', 'US');
    const { DEFAULT_MARKET_REGION, getMarketConfig } = await import('./markets.js');
    expect(DEFAULT_MARKET_REGION).toBe('US');
    expect(getMarketConfig().currency).toBe('USD');
  });

  it('falls back to IN for invalid env value', async () => {
    vi.stubEnv('VITE_DEFAULT_MARKET_REGION', 'EU');
    const { DEFAULT_MARKET_REGION } = await import('./markets.js');
    expect(DEFAULT_MARKET_REGION).toBe('IN');
  });
});
