import { describe, it, expect } from 'vitest';
import {
  imageReadabilityText,
  tagReadabilityLabel,
  tagReadabilityStatus,
  tagReadableGridValue,
} from './tagReadability';

describe('tagReadability', () => {
  it('marks readable only when tag_readable is true', () => {
    const ids = { tag_readable: true, asset_tag_number: '1234567890123456' };
    expect(tagReadabilityStatus(ids)).toBe('readable');
    expect(tagReadabilityLabel(ids)).toBe('Tag readable');
  });

  it('marks none when no tag evidence', () => {
    const ids = { tag_readable: false };
    expect(tagReadabilityStatus(ids)).toBe('none');
    expect(imageReadabilityText(ids)).toBe('No tag detected');
    expect(tagReadableGridValue(ids)).toBe('Not detected');
  });

  it('treats UNREADABLE as no tag detected', () => {
    const ids = { tag_readable: false, asset_tag_number_raw: 'UNREADABLE' };
    expect(tagReadabilityStatus(ids)).toBe('none');
    expect(tagReadabilityLabel(ids)).toBe('No tag detected');
  });
});
