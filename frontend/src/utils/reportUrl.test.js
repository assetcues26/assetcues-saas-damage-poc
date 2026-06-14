import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildAssetReportUrl } from './reportUrl';

describe('buildAssetReportUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds result URL from current origin', () => {
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:5173' },
    });
    expect(buildAssetReportUrl({ id: 'hist-abc-123' })).toBe(
      'http://localhost:5173/result/hist-abc-123',
    );
  });

  it('returns null without entry id', () => {
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:5173' },
    });
    expect(buildAssetReportUrl({ request_id: 'req-only' })).toBeNull();
  });
});
