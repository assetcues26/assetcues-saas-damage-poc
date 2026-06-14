import { describe, it, expect } from 'vitest';
import { formatPlacement, formatStickerType } from './placementFormatters';

describe('placementFormatters', () => {
  it('formatPlacement joins placement fields', () => {
    const text = formatPlacement({
      asset_location: 'top lid rear-left',
      horizontal: 'left',
      vertical: 'top',
      seen_in_image: 2,
      in_frame_position: 'upper-left',
    });
    expect(text).toContain('top lid rear-left');
    expect(text).toContain('left / top');
    expect(text).toContain('Image 2');
  });

  it('formatStickerType title-cases sticker type', () => {
    expect(formatStickerType('warranty')).toBe('Warranty');
  });
});
