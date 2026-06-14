import { describe, it, expect } from 'vitest';
import { getCameraErrorMessage } from './cameraErrors';

describe('getCameraErrorMessage', () => {
  it('returns permission guidance for NotAllowedError', () => {
    const msg = getCameraErrorMessage({ name: 'NotAllowedError' });
    expect(msg).toMatch(/blocked/i);
  });

  it('returns not found message', () => {
    const msg = getCameraErrorMessage({ name: 'NotFoundError' });
    expect(msg).toMatch(/No camera/i);
  });
});
