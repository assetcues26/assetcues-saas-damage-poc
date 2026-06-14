import { describe, it, expect } from 'vitest';
import { formatApiErrorMessage } from './apiErrorMessage';

describe('formatApiErrorMessage', () => {
  it('formats FastAPI validation array', () => {
    const msg = formatApiErrorMessage(
      {
        detail: [{ loc: ['body', 'images'], msg: 'Field required', type: 'missing' }],
      },
      422,
    );
    expect(msg).toContain('Field required');
  });

  it('returns string detail', () => {
    expect(formatApiErrorMessage({ detail: 'At least 2 images required' }, 400)).toBe(
      'At least 2 images required',
    );
  });
});
