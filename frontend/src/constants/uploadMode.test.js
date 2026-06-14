import { describe, it, expect } from 'vitest';
import { readStoredUploadMode, UPLOAD_PROCESSING_MODES } from './uploadMode';

describe('uploadMode constants', () => {
  it('defaults to direct multi-image (no browser storage)', () => {
    expect(readStoredUploadMode()).toBe(UPLOAD_PROCESSING_MODES.DIRECT);
  });
});
